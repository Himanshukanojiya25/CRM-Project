const Attendance = require('../../models/Attendance');

// ✅ Get Attendance Page with Monthly Data
const getAttendancePage = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7);
    const currentMonthFormatted = currentDate.toLocaleString('default', { 
      month: 'long', 
      year: 'numeric' 
    });
    const todayDate = currentDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Generate months for dropdown
    const months = [];
    for(let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      months.push({
        value: value,
        label: label,
        selected: i === 0
      });
    }

    // Get current month attendance
    const startDate = new Date(currentMonth + '-01');
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const currentMonthRecords = await Attendance.find({
      user: req.user.id,
      date: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort({ date: -1 });

    console.log('📊 Found records for month:', currentMonthRecords.length);

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

// ✅ FIXED CHECK-IN FUNCTION
const checkIn = async (req, res) => {
  try {
    console.log('🚨 CHECKIN STARTED - User:', req.user.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const userId = req.user.id;
    const now = new Date();
    
    // ✅ FIXED: Simple date calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('📅 Date range for query:', {
      today: today,
      tomorrow: tomorrow
    });

    // Check existing record
    const existing = await Attendance.findOne({
      user: userId,
      date: { 
        $gte: today, 
        $lt: tomorrow 
      }
    });

    console.log('🔍 Existing record found:', existing);

    if (existing && existing.checkIn) {
      return res.status(400).json({ 
        success: false,
        message: 'Already checked in today'
      });
    }

    // ✅ FIXED: Create new record with MANUAL monthYear
    const attendance = new Attendance({
      user: userId,
      date: today,
      monthYear: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`, // ✅ MANUALLY SET
      checkIn: now,
      status: 'present',
      ipAddress: req.ip || req.connection.remoteAddress,
      deviceType: req.headers['user-agent']
    });

    await attendance.save();

    console.log('✅ CHECKIN SUCCESSFUL:', {
      id: attendance._id,
      date: attendance.date,
      checkIn: attendance.checkIn,
      status: attendance.status,
      monthYear: attendance.monthYear
    });

    res.status(200).json({ 
      success: true,
      message: 'Checked in successfully!', 
      data: attendance 
    });

  } catch (err) {
    console.error('❌ CHECKIN ERROR:', err);
    res.status(500).json({ 
      success: false,
      message: 'Check-in failed. Please try again.', 
      error: err.message 
    });
  }
};

// ✅ FIXED CHECK-OUT FUNCTION  
const checkOut = async (req, res) => {
  try {
    console.log('🚨 CHECKOUT STARTED - User:', req.user.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const userId = req.user.id;
    const now = new Date();
    
    // ✅ FIXED: Same simple date calculation as checkin
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('🔍 Searching for checkin record:', { 
      userId, 
      today, 
      tomorrow 
    });

    // Find today's attendance
    const attendance = await Attendance.findOne({
      user: userId,
      date: { 
        $gte: today, 
        $lt: tomorrow 
      },
      checkIn: { $exists: true, $ne: null }
    });

    console.log('📊 Found record:', attendance);

    if (!attendance) {
      return res.status(400).json({ 
        success: false,
        message: 'Please check-in first before checking out.' 
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ 
        success: false,
        message: 'Already checked out today.' 
      });
    }

    // Update checkout
    attendance.checkOut = now;
    const diffMs = attendance.checkOut - attendance.checkIn;
    attendance.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    // Update status based on hours
    if (attendance.totalHours < 4) {
      attendance.status = 'half-day';
    } else if (attendance.totalHours >= 8) {
      attendance.status = 'present';
    }

    await attendance.save();

    console.log('✅ CHECKOUT SUCCESSFUL:', {
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut, 
      totalHours: attendance.totalHours,
      status: attendance.status
    });

    res.status(200).json({ 
      success: true,
      message: 'Checked out successfully!', 
      data: attendance 
    });

  } catch (err) {
    console.error('❌ CHECKOUT ERROR:', err);
    res.status(500).json({ 
      success: false,
      message: 'Check-out failed. Please try again.', 
      error: err.message 
    });
  }
};

// ✅ FIXED TODAY'S STATUS FUNCTION
const todayStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const userId = req.user.id;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      user: userId,
      date: { 
        $gte: today, 
        $lt: tomorrow 
      }
    });

    console.log('📊 TODAY STATUS:', attendance);

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

// ✅ FIXED MONTHLY RECORDS
const getMonthlyRecords = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const userId = req.user.id;
    const monthYear = req.params.monthYear || new Date().toISOString().slice(0, 7);
    
    const startDate = new Date(monthYear + '-01');
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const records = await Attendance.find({ 
      user: userId,
      date: { $gte: startDate, $lt: endDate }
    }).sort({ date: -1 });

    // Calculate monthly stats
    const totalDays = records.length;
    const presentDays = records.filter(r => ['present', 'late'].includes(r.status)).length;
    const absentDays = totalDays - presentDays;
    const lateDays = records.filter(r => r.status === 'late').length;

    res.status(200).json({ 
      success: true,
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
      message: 'Error fetching monthly records' 
    });
  }
};

// ✅ SIMPLE ARCHIVE FUNCTION
const archiveOldAttendance = async (req, res) => {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const deleteResult = await Attendance.deleteMany({
      date: { $lte: threeMonthsAgo }
    });

    res.status(200).json({ 
      success: true,
      message: 'Archive completed',
      data: {
        deleted: deleteResult.deletedCount
      }
    });
  } catch (err) {
    console.error('Archive error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Archive failed' 
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