const attendanceService = require('../../services/admin/attendanceService'); // service exposes checkIn
const Attendance = require('../../models/Attendance');

const checkIn = async (req, res) => {
  try {
    // ✅ Get user ID from authenticated request
    const userId = req.user.id; // ✅ CHANGED: req.user._id -> req.user.id
    
    // ✅ Get client IP address and device type
    const ipAddr = req.ip || req.connection.remoteAddress;
    const deviceType = req.headers['user-agent'];

  // ✅ Call the service function with proper parameters
  const result = await attendanceService.checkIn(userId, ipAddr, deviceType); // call service
    
    // ✅ Send success response with data from service
    res.status(200).json({ 
      success: true, // ✅ ADDED: success flag
      message: 'Checked in successfully', 
      data: result.data // ✅ CHANGED: attendance -> result.data
    });
  } catch (error) {
    // ✅ Handle specific error cases
    if (error.message === 'Already checked in today') {
      return res.status(400).json({ 
        success: false, // ✅ ADDED: success flag
        message: error.message 
      });
    }
    
    // ✅ Handle generic errors
    res.status(500).json({ 
      success: false, // ✅ ADDED: success flag
      message: 'Check-in failed', 
      error: error.message // ✅ CHANGED: full error -> error.message
    });
  }
};

// Simple admin handler to fetch all attendance records (with optional query filters)
const getAllAttendance = async (req, res) => {
  try {
    const query = {};
    // Optional filters: user, monthYear
    if (req.query.user) query.user = req.query.user;
    if (req.query.monthYear) query.monthYear = req.query.monthYear;

    const records = await Attendance.find(query).sort({ date: -1 }).limit(100);
    res.status(200).json({ success: true, data: records });
  } catch (err) {
    console.error('Get all attendance error:', err);
    res.status(500).json({ success: false, message: 'Error fetching attendance', error: err.message });
  }
};

module.exports = { checkIn, getAllAttendance };
