const { checkIn } = require('../../services/admin/attendance'); // ✅ Service import

const checkIn = async (req, res) => {
  try {
    // ✅ Get user ID from authenticated request
    const userId = req.user.id; // ✅ CHANGED: req.user._id -> req.user.id
    
    // ✅ Get client IP address and device type
    const ipAddr = req.ip || req.connection.remoteAddress;
    const deviceType = req.headers['user-agent'];

    // ✅ Call the service function with proper parameters
    const result = await checkIn(userId, ipAddr, deviceType); // ✅ ADDED: await and result capture
    
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

module.exports = { checkIn };