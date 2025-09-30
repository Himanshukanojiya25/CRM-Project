const mongoose = require('mongoose'); // Add this line at the top
const Leave = require('../../models/Leave');

// Render apply leave page
const renderApplyPage = (req, res) => {
  if (!req.user || !req.user._id) {
    console.error("❌ renderApplyPage: User not authenticated.");
    return res.redirect('/auth/login');
  }

  res.render('user/leaves/apply', { 
    user: req.user, 
    pageTitle: "Apply Leave"
  });
};

// Apply for leave
// Apply for leave - FIXED VERSION
const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!req.user || !req.user._id) {
      console.error("❌ applyLeave: User not authenticated.");
      return res.status(401).send("User not authenticated");
    }

    if (!leaveType || !startDate || !reason) {
      console.error("❌ applyLeave: Missing fields:", { leaveType, startDate, endDate, reason });
      return res.status(400).send("Please fill all required fields");
    }

    // ✅ DEBUG: Check user object
    console.log("🔍 Applying leave for user:", {
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email
    });

    // Create leave with current user - ✅ ENSURE user ID is properly set
    const leave = new Leave({
      user: req.user._id, // ✅ This should be proper ObjectId
      leaveType,
      startDate: new Date(startDate),
      endDate: leaveType === 'full-day' ? new Date(endDate) : new Date(startDate),
      reason,
    });

    // ✅ DEBUG: Check leave object before saving
    console.log("📝 Leave object before save:", {
      user: leave.user,
      userType: typeof leave.user,
      leaveType: leave.leaveType
    });

    await leave.save();

    // ✅ DEBUG: Check leave object after saving
    console.log("✅ Leave applied successfully:", {
      leaveId: leave._id,
      userId: leave.user,
      userType: typeof leave.user
    });

    res.redirect('/user/leaves');
  } catch (err) {
    console.error("❌ Error in applyLeave:", err.message || err);
    res.status(500).send('Error applying for leave. Please try again later.');
  }
};

// Fetch only logged-in user's leaves
const getMyLeaves = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      console.error("❌ getMyLeaves: User not authenticated.");
      return res.redirect('/auth/login');
    }

    console.log("🔍 DEBUG: Fetching leaves for user ID:", req.user._id);
    console.log("🔍 DEBUG: User object:", {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name
    });

    // 🔥 CRITICAL FIX: Convert user ID to ObjectId and ensure proper query
    const userId = req.user._id;
    
    // Method 1: Using mongoose.Types.ObjectId for safety
    const leaves = await Leave.find({ 
      user: mongoose.Types.ObjectId.createFromHexString(userId.toString())
    }).sort({ createdAt: -1 });

    // Method 2: Alternatively, just use the string (mongoose handles conversion)
    // const leaves = await Leave.find({ user: userId }).sort({ createdAt: -1 });

    console.log("✅ DEBUG: Found", leaves.length, "leaves for user");
    
    // Debug each leave to verify user matching
    leaves.forEach((leave, index) => {
      console.log(`📝 Leave ${index + 1}:`, {
        leaveId: leave._id,
        leaveUser: leave.user.toString(),
        currentUser: userId.toString(),
        matches: leave.user.toString() === userId.toString()
      });
    });

    res.render('user/leaves/list', { 
      user: req.user, 
      leaves, 
      pageTitle: "My Leaves"
    });
  } catch (err) {
    console.error("❌ Error in getMyLeaves:", err.message || err);
    res.status(500).send('Error fetching your leaves');
  }
};

module.exports = {
  renderApplyPage,
  applyLeave,
  getMyLeaves,
};