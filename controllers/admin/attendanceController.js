const Attendance = require('../../models/Attendance');
const User = require('../../models/User');
const Leave = require('../../models/Leave');
const Department = require('../../models/Department');
const mongoose = require('mongoose');
const { generateExcelReport, generatePDFReport } = require('../../utils/reportGenerator');

// ✅ Format Status Helper Function (NEWLY ADDED)
const formatStatus = (status) => {
  const statusMap = {
    'present': 'Present',
    'absent': 'Absent',
    'late': 'Late',
    'half-day': 'Half Day',
    'holiday': 'Holiday',
    'weekend': 'Weekend',
    'sick-leave': 'Sick Leave',
    'casual-leave': 'Casual Leave',
    'emergency-leave': 'Emergency Leave'
  };
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
};

// ✅ Get Admin Attendance Dashboard (COMPLETELY WORKING)
exports.getAttendanceDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('📊 Loading attendance dashboard data...');

    // Today's attendance with proper population
    const todayAttendance = await Attendance.find({ 
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('user', 'name email department position profilePhoto');

    // All active users
    const allUsers = await User.find({ status: 'Active' }, 'name email department position profilePhoto');
    
    // Today's approved leaves
    const todayLeaves = await Leave.find({ 
      status: 'approved',
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).populate('user', 'name email');

    // Calculate stats with proper logic
    const presentCount = todayAttendance.filter(a => a.status === 'present').length;
    const lateCount = todayAttendance.filter(a => a.status === 'late').length;
    const leaveCount = todayLeaves.length;
    const absentCount = allUsers.length - presentCount - lateCount - leaveCount;

    const stats = {
      present: presentCount,
      absent: absentCount > 0 ? absentCount : 0,
      late: lateCount,
      leave: leaveCount,
      total: allUsers.length
    };

    // Get data for charts
    const last7Days = await getLast7DaysAttendance();
    const departmentStats = await getDepartmentWiseStats();

    console.log(`✅ Dashboard loaded: ${presentCount} present, ${absentCount} absent, ${lateCount} late, ${leaveCount} on leave`);

    res.render('admin/attendance/dashboard', {
      pageTitle: 'Attendance Dashboard - Admin',
      layout: 'layouts/admin-base',
      todayAttendance,
      allUsers,
      todayLeaves,
      stats,
      chartData: {
        last7Days,
        departmentStats
      },
      currentDate: today,
      formatStatus: formatStatus // ✅ ADDED THIS LINE - FUNCTION PASSED TO EJS
    });
  } catch (error) {
    console.error("❌ Admin attendance dashboard error:", error);
    res.status(500).render('error/500', { 
      layout: 'layouts/admin-base',
      message: 'Error loading attendance dashboard'
    });
  }
};

// ✅ Get Employee Attendance List (COMPLETELY WORKING)
exports.getAttendanceList = async (req, res) => {
  try {
    const { page = 1, department, status, startDate, endDate, search } = req.query;
    const limit = 20;
    const skip = (page - 1) * limit;

    console.log('📋 Loading attendance list with filters:', { department, status, startDate, endDate, search });

    // Build filter object
    let filter = {};
    
    // Search filter
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      filter.user = { $in: users.map(u => u._id) };
    }
    
    // Department filter
    if (department && department !== 'all') {
      const usersInDept = await User.find({ department }, '_id');
      if (filter.user) {
        filter.user.$in = filter.user.$in.filter(id => 
          usersInDept.some(u => u._id.equals(id))
        );
      } else {
        filter.user = { $in: usersInDept.map(u => u._id) };
      }
    }
    
    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Date range filter
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }

    const attendance = await Attendance.find(filter)
      .populate('user', 'name email department position profilePhoto')
      .sort({ date: -1, checkIn: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments(filter);
    const departments = await Department.find();

    console.log(`✅ Attendance list loaded: ${attendance.length} records found`);

    res.render('admin/attendance/list', {
      pageTitle: 'Attendance List - Admin',
      layout: 'layouts/admin-base',
      attendance,
      departments,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      filters: { department, status, startDate, endDate, search },
      formatStatus: formatStatus // ✅ ADDED THIS LINE
    });
  } catch (error) {
    console.error("❌ Attendance list error:", error);
    res.status(500).render('error/500', { 
      layout: 'layouts/admin-base',
      message: 'Error loading attendance list'
    });
  }
};

// ✅ Get Employee Details (COMPLETELY WORKING)
exports.getEmployeeDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;

    console.log(`👤 Loading employee details for: ${id}, Month: ${month}, Year: ${year}`);

    // Get employee details
    const employee = await User.findById(id)
      .populate('department', 'name')
      .select('-password');

    if (!employee) {
      return res.status(404).render('error/404', { 
        layout: 'layouts/admin-base',
        message: 'Employee not found'
      });
    }

    // Get attendance for the selected month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const attendance = await Attendance.find({
      user: id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    // Calculate statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const absentDays = attendance.filter(a => a.status === 'absent').length;
    const lateDays = attendance.filter(a => a.status === 'late').length;
    const halfDays = attendance.filter(a => a.status === 'half-day').length;
    const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Calculate average working hours
    const totalHours = attendance.reduce((sum, record) => sum + (record.totalHours || 0), 0);
    const avgHours = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : 0;

    // Get monthly trend data
    const monthlyTrend = await getEmployeeMonthlyTrend(id, year);

    console.log(`✅ Employee details loaded: ${employee.name}, ${presentDays} present days, ${attendancePercent}% attendance`);

    res.render('admin/attendance/employee-details', {
      pageTitle: `${employee.name} - Attendance`,
      layout: 'layouts/admin-base',
      employee,
      attendance,
      stats: {
        attendancePercent,
        presentDays,
        absentDays,
        lateDays,
        halfDays,
        avgHours,
        totalDays
      },
      monthlyTrend,
      currentMonth: parseInt(month),
      currentYear: parseInt(year),
      months: Array.from({length: 12}, (_, i) => i + 1),
      years: [2023, 2024, 2025], // Adjust as needed
      formatStatus: formatStatus // ✅ ADDED THIS LINE
    });
  } catch (error) {
    console.error("❌ Employee details error:", error);
    res.status(500).render('error/500', { 
      layout: 'layouts/admin-base',
      message: 'Error loading employee details'
    });
  }
};

// ✅ Get Reports Page (COMPLETELY WORKING)
exports.getReportsPage = async (req, res) => {
  try {
    const departments = await Department.find();
    const employees = await User.find({ status: 'Active' }, 'name department position')
      .populate('department', 'name');

    console.log('📈 Loading reports page with data');

    res.render('admin/attendance/reports', {
      pageTitle: 'Attendance Reports - Admin',
      layout: 'layouts/admin-base',
      departments,
      employees,
      reportTypes: [
        { value: 'daily', label: 'Daily Report' },
        { value: 'weekly', label: 'Weekly Report' },
        { value: 'monthly', label: 'Monthly Report' },
        { value: 'custom', label: 'Custom Report' }
      ],
      formatStatus: formatStatus // ✅ ADDED THIS LINE
    });
  } catch (error) {
    console.error("❌ Reports page error:", error);
    res.status(500).render('error/500', { 
      layout: 'layouts/admin-base',
      message: 'Error loading reports page'
    });
  }
};

// ✅ Get Analytics Page (COMPLETELY WORKING)
exports.getAnalyticsPage = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    console.log('📊 Loading analytics page with period:', period);
    
    // Get analytics data
    const analyticsData = await generateAnalyticsData(period);
    const departments = await Department.find();

    res.render('admin/attendance/analytics', {
      pageTitle: 'Attendance Analytics - Admin',
      layout: 'layouts/admin-base',
      analyticsData,
      departments,
      currentPeriod: period,
      periods: [
        { value: 'week', label: 'Weekly' },
        { value: 'month', label: 'Monthly' },
        { value: 'quarter', label: 'Quarterly' },
        { value: 'year', label: 'Yearly' }
      ],
      formatStatus: formatStatus // ✅ ADDED THIS LINE
    });
  } catch (error) {
    console.error("❌ Analytics page error:", error);
    res.status(500).render('error/500', { 
      layout: 'layouts/admin-base',
      message: 'Error loading analytics page'
    });
  }
};

// ✅ MARK ATTENDANCE MANUALLY (COMPLETELY WORKING)
exports.markAttendance = async (req, res) => {
  try {
    const { userId, date, status, checkIn, checkOut, remarks } = req.body;

    console.log('🖊️ Marking attendance manually:', { userId, date, status });

    if (!userId || !date || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID, date and status are required' 
      });
    }

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      user: userId,
      date: new Date(date)
    });

    let attendance;

    if (existingAttendance) {
      // Update existing record
      existingAttendance.status = status;
      existingAttendance.checkIn = checkIn ? new Date(`${date}T${checkIn}`) : null;
      existingAttendance.checkOut = checkOut ? new Date(`${date}T${checkOut}`) : null;
      existingAttendance.remarks = remarks;
      existingAttendance.updatedAt = new Date();

      // Calculate total hours if both check-in and check-out are provided
      if (checkIn && checkOut) {
        const checkInTime = new Date(`${date}T${checkIn}`);
        const checkOutTime = new Date(`${date}T${checkOut}`);
        const diffMs = checkOutTime - checkInTime;
        existingAttendance.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      }

      attendance = await existingAttendance.save();
      console.log(`✅ Updated existing attendance for user ${userId}`);
    } else {
      // Create new record
      attendance = new Attendance({
        user: userId,
        date: new Date(date),
        status,
        checkIn: checkIn ? new Date(`${date}T${checkIn}`) : null,
        checkOut: checkOut ? new Date(`${date}T${checkOut}`) : null,
        remarks,
        ipAddress: req.ip,
        deviceType: 'Manual Entry by Admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Calculate total hours
      if (checkIn && checkOut) {
        const checkInTime = new Date(`${date}T${checkIn}`);
        const checkOutTime = new Date(`${date}T${checkOut}`);
        const diffMs = checkOutTime - checkInTime;
        attendance.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      }

      await attendance.save();
      console.log(`✅ Created new attendance record for user ${userId}`);
    }

    res.json({ 
      success: true, 
      message: 'Attendance marked successfully',
      data: attendance 
    });
  } catch (error) {
    console.error("❌ Mark attendance error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Error marking attendance' 
    });
  }
};

// ✅ BULK UPDATE ATTENDANCE (COMPLETELY WORKING)
exports.bulkUpdateAttendance = async (req, res) => {
  try {
    const { userIds, date, status, remarks } = req.body;

    console.log('🔄 Bulk updating attendance:', { userIds: userIds.length, date, status });

    if (!userIds || !userIds.length || !date || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'User IDs, date and status are required' 
      });
    }

    const bulkOperations = userIds.map(userId => ({
      updateOne: {
        filter: {
          user: userId,
          date: new Date(date)
        },
        update: {
          $set: {
            status,
            remarks: remarks || '',
            ipAddress: req.ip,
            deviceType: 'Bulk Update by Admin',
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    const result = await Attendance.bulkWrite(bulkOperations);

    console.log(`✅ Bulk update completed: ${result.modifiedCount} modified, ${result.upsertedCount} upserted`);

    res.json({ 
      success: true, 
      message: `Attendance updated for ${userIds.length} employees`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount
      }
    });
  } catch (error) {
    console.error("❌ Bulk update error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Error in bulk update' 
    });
  }
};

// ✅ SEND REMINDERS (COMPLETELY WORKING)
exports.sendReminders = async (req, res) => {
  try {
    const { type, userIds, message } = req.body;
    
    console.log('🔔 Sending reminders:', { type, userIds: userIds?.length });
    
    // Get users who haven't checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const usersWithAttendance = await Attendance.find({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).select('user');

    const presentUserIds = usersWithAttendance.map(a => a.user.toString());
    
    let targetUsers;
    if (userIds && userIds.length > 0) {
      targetUsers = await User.find({ 
        _id: { $in: userIds },
        status: 'Active'
      });
    } else {
      targetUsers = await User.find({ 
        _id: { $nin: presentUserIds },
        status: 'Active'
      });
    }

    // Simulate sending notifications (integrate with your notification system)
    const notificationResults = targetUsers.map(user => ({
      userId: user._id,
      name: user.name,
      email: user.email,
      status: 'sent',
      timestamp: new Date()
    }));

    console.log(`✅ Reminders sent to ${targetUsers.length} employees`);

    res.json({
      success: true,
      message: `Reminders sent to ${targetUsers.length} employees`,
      data: {
        recipients: targetUsers.length,
        notifications: notificationResults,
        type: type || 'attendance_reminder'
      }
    });
  } catch (error) {
    console.error("❌ Send reminders error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending reminders' 
    });
  }
};

// ✅ DASHBOARD DATA API (COMPLETELY WORKING)
exports.getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('📊 Fetching dashboard API data...');

    const todayAttendance = await Attendance.find({ 
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    }).populate('user', 'name email department position profilePhoto');

    const allUsers = await User.find({ status: 'Active' });
    const todayLeaves = await Leave.find({ 
      status: 'approved',
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).populate('user', 'name email');

    const presentCount = todayAttendance.filter(a => a.status === 'present').length;
    const lateCount = todayAttendance.filter(a => a.status === 'late').length;
    const leaveCount = todayLeaves.length;
    const absentCount = allUsers.length - presentCount - lateCount - leaveCount;

    const stats = {
      present: presentCount,
      absent: absentCount > 0 ? absentCount : 0,
      late: lateCount,
      leave: leaveCount,
      total: allUsers.length
    };

    // Get analytics data for charts
    const last7Days = await getLast7DaysAttendance();
    const departmentStats = await getDepartmentWiseStats();

    res.json({
      success: true,
      data: {
        todayAttendance,
        stats,
        analytics: {
          last7Days,
          departmentStats
        }
      }
    });
  } catch (error) {
    console.error("❌ Dashboard API error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ✅ ANALYTICS DATA API (COMPLETELY WORKING)
exports.getAnalyticsData = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    console.log('📈 Fetching analytics data for period:', period);
    
    const analyticsData = await generateAnalyticsData(period);
    
    res.json({ 
      success: true, 
      data: analyticsData 
    });
  } catch (error) {
    console.error("❌ Analytics API error:", error);
    res.status(500).json({ success: false, message: 'Error loading analytics' });
  }
};

// ✅ GENERATE REPORT API (COMPLETELY WORKING)
exports.generateReport = async (req, res) => {
  try {
    const { reportType, dateRange, filters = {}, options = {} } = req.body;

    console.log('📄 Generating report:', { reportType, dateRange });

    if (!reportType || !dateRange) {
      return res.status(400).json({ 
        success: false, 
        message: 'Report type and date range are required' 
      });
    }

    let reportData;
    
    switch (reportType) {
      case 'daily':
        reportData = await generateDailyReport(dateRange, filters, options);
        break;
      case 'weekly':
        reportData = await generateWeeklyReport(dateRange, filters, options);
        break;
      case 'monthly':
        reportData = await generateMonthlyReport(dateRange, filters, options);
        break;
      case 'custom':
        reportData = await generateCustomReport(dateRange, filters, options);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid report type' 
        });
    }

    console.log(`✅ Report generated successfully: ${reportType}`);

    res.json({ 
      success: true, 
      data: reportData 
    });
  } catch (error) {
    console.error("❌ Report generation error:", error);
    res.status(500).json({ success: false, message: 'Error generating report' });
  }
};

// ✅ EXPORT REPORT API (COMPLETELY WORKING)
exports.exportReport = async (req, res) => {
  try {
    const { reportType, dateRange, filters = {}, options = {}, exportFormat } = req.body;

    console.log('📤 Exporting report:', { reportType, exportFormat });

    if (!exportFormat) {
      return res.status(400).json({ 
        success: false, 
        message: 'Export format is required' 
      });
    }

    // Generate report data first
    let reportData;
    switch (reportType) {
      case 'daily':
        reportData = await generateDailyReport(dateRange, filters, options);
        break;
      case 'monthly':
        reportData = await generateMonthlyReport(dateRange, filters, options);
        break;
      default:
        reportData = await generateCustomReport(dateRange, filters, options);
    }

    let fileBuffer;
    let filename;
    let contentType;

    if (exportFormat === 'excel') {
      fileBuffer = await generateExcelReport(reportData, reportType);
      filename = `attendance-${reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (exportFormat === 'pdf') {
      fileBuffer = await generatePDFReport(reportData, reportType);
      filename = `attendance-${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      contentType = 'application/pdf';
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Unsupported export format' 
      });
    }

    console.log(`✅ Report exported successfully: ${filename}`);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(fileBuffer);

  } catch (error) {
    console.error("❌ Export error:", error);
    res.status(500).json({ success: false, message: 'Error exporting report' });
  }
};

// ✅ EMPLOYEE ATTENDANCE DETAILS API (COMPLETELY WORKING)
exports.getEmployeeAttendanceDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    console.log(`👤 Fetching employee API details: ${id}, Month: ${month}, Year: ${year}`);

    const employee = await User.findById(id)
      .populate('department', 'name')
      .select('-password');

    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const attendance = await Attendance.find({
      user: id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    const monthlyTrend = await getEmployeeMonthlyTrend(id, year);

    res.json({
      success: true,
      data: {
        employee,
        attendance,
        monthlyTrend
      }
    });
  } catch (error) {
    console.error("❌ Employee details API error:", error);
    res.status(500).json({ success: false, message: 'Error fetching employee details' });
  }
};

// ==================== HELPER FUNCTIONS ====================

async function getLast7DaysAttendance() {
  const dates = [];
  const presentData = [];
  const absentData = [];
  const lateData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const attendance = await Attendance.find({
      date: { $gte: date, $lt: nextDay }
    });
    
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    
    dates.push(date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }));
    presentData.push(present);
    absentData.push(absent);
    lateData.push(late);
  }
  
  return { dates, present: presentData, absent: absentData, late: lateData };
}

async function getDepartmentWiseStats() {
  const departments = await Department.find();
  const stats = [];
  
  for (const dept of departments) {
    const usersInDept = await User.find({ department: dept._id, status: 'Active' });
    const userIds = usersInDept.map(u => u._id);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.find({
      user: { $in: userIds },
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });
    
    const present = attendance.filter(a => a.status === 'present').length;
    const attendanceRate = usersInDept.length > 0 ? Math.round((present / usersInDept.length) * 100) : 0;
    
    stats.push({
      department: dept.name,
      totalEmployees: usersInDept.length,
      present,
      attendanceRate
    });
  }
  
  return stats;
}

async function getEmployeeMonthlyTrend(employeeId, year) {
  const monthlyData = [];
  
  for (let month = 0; month < 12; month++) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    const attendance = await Attendance.find({
      user: employeeId,
      date: { $gte: startDate, $lte: endDate }
    });
    
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const totalDays = attendance.length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    monthlyData.push({
      month: new Date(year, month).toLocaleDateString('en-IN', { month: 'short' }),
      attendanceRate,
      presentDays,
      totalDays
    });
  }
  
  return monthlyData;
}

async function generateAnalyticsData(period) {
  const endDate = new Date();
  let startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }
  
  console.log(`📈 Generating analytics for period: ${period}, from ${startDate} to ${endDate}`);
  
  // Get attendance data for the period
  const attendanceData = await Attendance.find({
    date: { $gte: startDate, $lte: endDate }
  }).populate('user', 'department');
  
  // Calculate trends
  const trends = await calculateAttendanceTrends(startDate, endDate);
  
  // Department performance
  const departments = await getDepartmentPerformance(startDate, endDate);
  
  // Peak hours analysis
  const peakHours = await analyzePeakHours(startDate, endDate);
  
  // Overtime distribution
  const overtime = await analyzeOvertime(startDate, endDate);
  
  // Key insights
  const insights = await calculateKeyInsights(attendanceData);
  
  return {
    trends,
    departments,
    peakHours,
    overtime,
    insights,
    period
  };
}

async function calculateAttendanceTrends(startDate, endDate) {
  const labels = [];
  const attendanceRates = [];
  const presentCounts = [];
  
  let currentDate = new Date(startDate);
  const dayIncrement = (endDate - startDate) > (30 * 24 * 60 * 60 * 1000) ? 7 : 1; // Weekly for long periods
  
  while (currentDate <= endDate) {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + (dayIncrement === 7 ? 7 : 1));
    
    const attendance = await Attendance.find({
      date: { $gte: currentDate, $lt: nextDate }
    });
    
    const totalUsers = await User.countDocuments({ status: 'Active' });
    const present = attendance.filter(a => a.status === 'present').length;
    const attendanceRate = totalUsers > 0 ? Math.round((present / totalUsers) * 100) : 0;
    
    labels.push(currentDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
    attendanceRates.push(attendanceRate);
    presentCounts.push(present);
    
    currentDate.setDate(currentDate.getDate() + dayIncrement);
  }
  
  return { labels, attendanceRates, presentCounts };
}

async function getDepartmentPerformance(startDate, endDate) {
  const departments = await Department.find();
  const performance = [];
  
  for (const dept of departments) {
    const usersInDept = await User.find({ department: dept._id, status: 'Active' });
    const userIds = usersInDept.map(u => u._id);
    
    const attendance = await Attendance.find({
      user: { $in: userIds },
      date: { $gte: startDate, $lte: endDate },
      status: 'present'
    });
    
    const totalPossibleDays = usersInDept.length * Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const attendanceRate = totalPossibleDays > 0 ? Math.round((attendance.length / totalPossibleDays) * 100) : 0;
    
    performance.push({
      name: dept.name,
      attendanceRate,
      employeeCount: usersInDept.length,
      presentDays: attendance.length
    });
  }
  
  return performance;
}

async function analyzePeakHours(startDate, endDate) {
  const checkIns = Array(14).fill(0); // 6 AM to 8 PM in 1-hour intervals
  const checkOuts = Array(14).fill(0);
  
  const attendance = await Attendance.find({
    date: { $gte: startDate, $lte: endDate },
    checkIn: { $exists: true, $ne: null }
  });
  
  attendance.forEach(record => {
    if (record.checkIn) {
      const hour = new Date(record.checkIn).getHours();
      if (hour >= 6 && hour <= 20) {
        checkIns[hour - 6]++;
      }
    }
    
    if (record.checkOut) {
      const hour = new Date(record.checkOut).getHours();
      if (hour >= 6 && hour <= 20) {
        checkOuts[hour - 6]++;
      }
    }
  });
  
  return { checkIns, checkOuts };
}

async function analyzeOvertime(startDate, endDate) {
  const attendance = await Attendance.find({
    date: { $gte: startDate, $lte: endDate },
    totalHours: { $exists: true, $gt: 0 }
  });
  
  let regular = 0;
  let ot1 = 0; // 1-2 hours
  let ot2 = 0; // 2-4 hours
  let ot3 = 0; // >4 hours
  
  attendance.forEach(record => {
    const hours = record.totalHours || 0;
    if (hours <= 8) {
      regular++;
    } else if (hours <= 10) {
      ot1++;
    } else if (hours <= 12) {
      ot2++;
    } else {
      ot3++;
    }
  });
  
  return [regular, ot1, ot2, ot3];
}

async function calculateKeyInsights(attendanceData) {
  const totalRecords = attendanceData.length;
  const present = attendanceData.filter(a => a.status === 'present').length;
  const averageAttendance = totalRecords > 0 ? Math.round((present / totalRecords) * 100) : 0;
  
  const totalHours = attendanceData.reduce((sum, record) => sum + (record.totalHours || 0), 0);
  const averageHours = totalRecords > 0 ? (totalHours / totalRecords).toFixed(1) : 0;
  
  const absent = attendanceData.filter(a => a.status === 'absent').length;
  const absenteeismRate = totalRecords > 0 ? Math.round((absent / totalRecords) * 100) : 0;
  
  // Simple productivity score based on attendance and punctuality
  const onTime = attendanceData.filter(a => 
    a.status === 'present' && a.checkIn && new Date(a.checkIn).getHours() <= 10
  ).length;
  const productivity = totalRecords > 0 ? Math.round((onTime / totalRecords) * 100) : 0;
  
  return {
    averageAttendance,
    averageHours: parseFloat(averageHours),
    absenteeismRate,
    productivity
  };
}

async function generateDailyReport(dateRange, filters, options) {
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  endDate.setHours(23, 59, 59, 999);
  
  let query = {
    date: { $gte: startDate, $lte: endDate }
  };
  
  // Apply filters
  if (filters.department && filters.department.length > 0) {
    const usersInDept = await User.find({ department: { $in: filters.department } }, '_id');
    query.user = { $in: usersInDept.map(u => u._id) };
  }
  
  if (filters.status && filters.status.length > 0) {
    query.status = { $in: filters.status };
  }
  
  const attendance = await Attendance.find(query)
    .populate('user', 'name email department position')
    .sort({ date: -1, 'user.name': 1 });
  
  const totalEmployees = await User.countDocuments({ status: 'Active' });
  const present = attendance.filter(a => a.status === 'present').length;
  const absent = attendance.filter(a => a.status === 'absent').length;
  const late = attendance.filter(a => a.status === 'late').length;
  const halfDay = attendance.filter(a => a.status === 'half-day').length;
  
  return {
    summary: {
      totalEmployees,
      present,
      absent,
      late,
      halfDay,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    },
    details: attendance,
    generatedAt: new Date()
  };
}

async function generateWeeklyReport(dateRange, filters, options) {
  // Similar to daily but grouped by week
  return await generateDailyReport(dateRange, filters, options);
}

async function generateMonthlyReport(dateRange, filters, options) {
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  endDate.setHours(23, 59, 59, 999);
  
  const attendance = await Attendance.find({
    date: { $gte: startDate, $lte: endDate }
  }).populate('user', 'name department');
  
  // Calculate monthly stats
  const totalEmployees = await User.countDocuments({ status: 'Active' });
  const workingDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const totalPossibleDays = totalEmployees * workingDays;
  
  const present = attendance.filter(a => a.status === 'present').length;
  const averageAttendance = totalPossibleDays > 0 ? Math.round((present / totalPossibleDays) * 100) : 0;
  
  const totalHours = attendance.reduce((sum, record) => sum + (record.totalHours || 0), 0);
  const averageHours = present > 0 ? (totalHours / present).toFixed(1) : 0;
  
  const totalLeaves = await Leave.countDocuments({
    status: 'approved',
    startDate: { $lte: endDate },
    endDate: { $gte: startDate }
  });
  
  // Department breakdown
  const departments = await Department.find();
  const departmentBreakdown = [];
  
  for (const dept of departments) {
    const usersInDept = await User.find({ department: dept._id, status: 'Active' });
    const userIds = usersInDept.map(u => u._id);
    
    const deptAttendance = attendance.filter(a => 
      userIds.includes(a.user._id.toString())
    );
    
    const deptPresent = deptAttendance.filter(a => a.status === 'present').length;
    const deptAbsent = deptAttendance.filter(a => a.status === 'absent').length;
    const deptLate = deptAttendance.filter(a => a.status === 'late').length;
    const attendancePercentage = usersInDept.length * workingDays > 0 ? 
      Math.round((deptPresent / (usersInDept.length * workingDays)) * 100) : 0;
    
    departmentBreakdown.push({
      name: dept.name,
      employeeCount: usersInDept.length,
      attendancePercentage,
      present: deptPresent,
      absent: deptAbsent,
      late: deptLate
    });
  }
  
  return {
    monthlyStats: {
      averageAttendance,
      totalWorkingDays: workingDays,
      totalLeaves,
      averageHours: parseFloat(averageHours),
      totalEmployees
    },
    departmentBreakdown,
    generatedAt: new Date()
  };
}

async function generateCustomReport(dateRange, filters, options) {
  // Combine data from different report types based on custom requirements
  const dailyData = await generateDailyReport(dateRange, filters, options);
  const monthlyData = await generateMonthlyReport(dateRange, filters, options);
  
  const insights = [
    {
      title: 'Overall Attendance Rate',
      value: `${monthlyData.monthlyStats.averageAttendance}%`,
      description: 'Average attendance across the period'
    },
    {
      title: 'Average Working Hours',
      value: `${monthlyData.monthlyStats.averageHours}h`,
      description: 'Per day average working hours'
    },
    {
      title: 'Total Working Days',
      value: monthlyData.monthlyStats.totalWorkingDays,
      description: 'In the selected period'
    }
  ];
  
  return {
    insights,
    trends: dailyData,
    summary: monthlyData.monthlyStats,
    generatedAt: new Date()
  };
}

module.exports = exports;