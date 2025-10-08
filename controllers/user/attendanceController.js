const Attendance = require('../../models/Attendance');
const moment = require('moment');

// ✅ Get Attendance Page with Monthly Data
const getAttendancePage = async (req, res) => {
  try {
    const currentMonth = moment().format('YYYY-MM');
    const currentMonthFormatted = moment().format('MMMM YYYY');
    const todayDate = moment().format('dddd, MMMM Do YYYY');
    
    // Generate months for dropdown
    const months = [];
    for(let i = 0; i < 6; i++) {
      const month = moment().subtract(i, 'months');
      months.push({
        value: month.format('YYYY-MM'),
        label: month.format('MMMM YYYY'),
        selected: i === 0
      });
    }

    // Get current month attendance
    const currentMonthRecords = await Attendance.find({
      user: req.user.id,
      monthYear: currentMonth
    }).sort({ date: -1 });

    res.render('user/attendance/list', {
      pageTitle: 'Attendance - CRM',
      layout: 'layouts/user-base',
      currentMonth: currentMonth,
      currentMonthFormatted: currentMonthFormatted,
      todayDate: todayDate,
      months: months,
      currentMonthRecords: currentMonthRecords
    });
  } catch (error) {
    console.error('Attendance page error:', error);
    res.status(500).send('Error loading attendance page');
  }
};

// ✅ Check-In with Enhanced Late Detection
const checkIn = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated. Please login again.' 
      });
    }

    const userId = req.user.id;
    const today = moment().startOf('day');
    const now = new Date();

    // Check if already checked in today
    const existing = await Attendance.findOne({
      user: userId,
      date: { 
        $gte: today.toDate(), 
        $lte: moment(today).endOf('day').toDate() 
      }
    });

    if (existing && existing.checkIn) {
      return res.status(400).json({ 
        success: false,
        message: 'Already checked in today',
        data: existing 
      });
    }

    // Create or update attendance
    const attendance = existing || new Attendance({
      user: userId,
      date: today.toDate()
    });

    attendance.checkIn = now;
    attendance.ipAddress = req.ip || req.connection.remoteAddress;
    attendance.deviceType = req.headers['user-agent'];
    
    // Enhanced late detection (after 10:15 AM is late)
    const checkInTime = moment(now);
    const lateThreshold = moment(today).set({ hour: 10, minute: 15, second: 0 });
    
    if (checkInTime.isAfter(lateThreshold)) {
      attendance.status = 'late';
    } else {
      attendance.status = 'present';
    }

    await attendance.save();
    
    res.status(200).json({ 
      success: true,
      message: 'Checked in successfully', 
      data: attendance 
    });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Check-in failed', 
      error: err.message 
    });
  }
};

// ✅ Check-Out (Same as before)
const checkOut = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated. Please login again.' 
      });
    }

    const userId = req.user.id;
    const today = moment().startOf('day');
    const now = new Date();

    const attendance = await Attendance.findOne({
      user: userId,
      date: { 
        $gte: today.toDate(), 
        $lte: moment(today).endOf('day').toDate() 
      },
      checkIn: { $exists: true },
      checkOut: { $exists: false }
    });

    if (!attendance) {
      return res.status(400).json({ 
        success: false,
        message: 'No valid check-in found for today or already checked out' 
      });
    }

    attendance.checkOut = now;
    const diffMs = attendance.checkOut - attendance.checkIn;
    attendance.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    if (attendance.totalHours < 4) {
      attendance.status = 'half-day';
    }

    await attendance.save();

    res.status(200).json({ 
      success: true,
      message: 'Checked out successfully', 
      data: attendance 
    });
  } catch (err) {
    console.error('Check-out error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Check-out failed', 
      error: err.message 
    });
  }
};

// ✅ Monthly Attendance Records
const getMonthlyRecords = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated. Please login again.' 
      });
    }

    const userId = req.user.id;
    const monthYear = req.params.monthYear || moment().format('YYYY-MM');
    
    const records = await Attendance.find({ 
      user: userId,
      monthYear: monthYear 
    }).sort({ date: -1 });

    // Calculate monthly stats
    const totalDays = records.length;
    const presentDays = records.filter(r => ['present', 'late'].includes(r.status)).length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const lateDays = records.filter(r => r.status === 'late').length;

    res.status(200).json({ 
      success: true,
      message: 'Monthly records fetched successfully',
      data: {
        records: records,
        stats: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          monthYear: monthYear
        }
      }
    });
  } catch (err) {
    console.error('Monthly records error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching monthly records', 
      error: err.message 
    });
  }
};

// ✅ Archive Old Attendance (Utility Function)
const archiveOldAttendance = async (req, res) => {
  try {
    const threeMonthsAgo = moment().subtract(3, 'months').startOf('month');
    const archiveThreshold = moment().subtract(1, 'month').endOf('month');
    
    // Archive records older than 1 month
    const archiveResult = await Attendance.updateMany(
      {
        date: { $lte: archiveThreshold.toDate() },
        isArchived: false
      },
      {
        $set: {
          isArchived: true,
          archivedAt: new Date()
        }
      }
    );

    // Delete records older than 3 months
    const deleteResult = await Attendance.deleteMany({
      date: { $lte: threeMonthsAgo.toDate() }
    });

    res.status(200).json({ 
      success: true,
      message: 'Archive and cleanup completed',
      data: {
        archived: archiveResult.modifiedCount,
        deleted: deleteResult.deletedCount
      }
    });
  } catch (err) {
    console.error('Archive error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Archive failed', 
      error: err.message 
    });
  }
};

// ✅ Today's Status
const todayStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated. Please login again.' 
      });
    }

    const userId = req.user.id;
    const today = moment().startOf('day');

    const attendance = await Attendance.findOne({
      user: userId,
      date: { 
        $gte: today.toDate(), 
        $lte: moment(today).endOf('day').toDate() 
      }
    });

    res.status(200).json({ 
      success: true,
      message: "Today's status fetched",
      data: attendance || { status: 'absent' }
    });
  } catch (err) {
    console.error('Today status error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching today status', 
      error: err.message 
    });
  }
};

module.exports = { 
  getAttendancePage,
  checkIn, 
  checkOut, 
  getMonthlyRecords,
  archiveOldAttendance,
  todayStatus 
};