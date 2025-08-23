const Attendance = require('../../models/Attendance');
const moment = require('moment');

// ✅ Get Attendance Page
const getAttendancePage = async (req, res) => {
  try {
    res.render('user/attendance/list', {
      pageTitle: 'Attendance - CRM',
      layout: 'layouts/user-base'
    });
  } catch (error) {
    console.error('Attendance page error:', error);
    res.status(500).send('Error loading attendance page');
  }
};

// ✅ Check-In
const checkIn = async (req, res) => {
  try {
    console.log('Request User:', req.user); // Debug log
    
    // ✅ Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated. Please login again.' 
      });
    }

    const userId = req.user._id;
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
    
    // Set status based on check-in time
    const checkInHour = now.getHours();
    if (checkInHour > 10) { // After 10 AM is late
      attendance.status = 'late';
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

// ✅ Check-Out
const checkOut = async (req, res) => {
  try {
    // ✅ Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated. Please login again.' 
      });
    }

    const userId = req.user._id;
    const today = moment().startOf('day');
    const now = new Date();

    // Find today's attendance with check-in but no check-out
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

    // Calculate working hours
    attendance.checkOut = now;
    const diffMs = attendance.checkOut - attendance.checkIn;
    attendance.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    // Update status if half-day (less than 4 hours)
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

// ✅ User's Attendance Records with Pagination
const myRecords = async (req, res) => {
  try {
    // ✅ Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated. Please login again.' 
      });
    }

    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const records = await Attendance.find({ user: userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email');

    const total = await Attendance.countDocuments({ user: userId });

    res.status(200).json({ 
      success: true,
      message: 'Records fetched successfully',
      data: records,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total: total
      }
    });
  } catch (err) {
    console.error('Records fetch error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching records', 
      error: err.message 
    });
  }
};

// ✅ Today's Status
const todayStatus = async (req, res) => {
  try {
    // ✅ Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated. Please login again.' 
      });
    }

    const userId = req.user._id;
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

// ✅ Export ALL functions
module.exports = { 
  getAttendancePage,
  checkIn, 
  checkOut, 
  myRecords, 
  todayStatus 
};