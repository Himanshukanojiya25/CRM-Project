const express = require('express');
const router = express.Router();
const { applyLeave, getMyLeaves, renderApplyPage } = require('../../controllers/user/leavesController');
const { isAuthenticated } = require('../../middlewares/authMiddleware');
const Leave = require('../../models/Leave'); // ✅ IMPORTANT: Add this line

// Render leave application page
router.get('/apply', isAuthenticated, renderApplyPage);

// Handle leave application submission
router.post('/apply', isAuthenticated, applyLeave);

// Fetch user's leave history
router.get('/', isAuthenticated, getMyLeaves);

// API endpoint for testing
router.get('/api/debug', isAuthenticated, async (req, res) => {
  try {
    const leaves = await Leave.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      user: {
        _id: req.user._id,
        email: req.user.email,
        name: req.user.name
      },
      leavesCount: leaves.length,
      leaves: leaves.map(l => ({
        id: l._id,
        user: l.user,
        leaveType: l.leaveType,
        status: l.status,
        startDate: l.startDate,
        reason: l.reason
      }))
    });
  } catch (error) {
    console.error("❌ API Debug Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ YAHAN ADD KARO SESSION INFO ROUTE
router.get('/session-info', isAuthenticated, (req, res) => {
  res.json({
    sessionID: req.sessionID,
    user: req.user,
    session: req.session
  });
});

// Clear session for testing
router.get('/clear-session', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Error destroying session:", err);
    }
    res.redirect('/auth/login');
  });
});

// routes/user/leavesRoutes.js mein add karo
router.get('/check-db', async (req, res) => {
  try {
    const leaves = await Leave.find().populate('user', 'name email');
    
    res.json({
      totalLeaves: leaves.length,
      leaves: leaves.map(leave => ({
        id: leave._id,
        userId: leave.user ? leave.user._id : null,
        userName: leave.user ? leave.user.name : 'NO USER',
        userEmail: leave.user ? leave.user.email : 'NO EMAIL',
        storedUserId: leave.user // This is the raw stored value
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;