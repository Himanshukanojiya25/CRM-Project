const mongoose = require('mongoose');
const Leave = require('../../models/Leave');
const emailService = require('../../services/email/emailService'); // ✅ EMAIL SERVICE ADDED

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

// Apply for leave - WITH EMAIL INTEGRATION
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

    // Create leave with current user
    const leave = new Leave({
      user: req.user._id,
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

    // ✅ EMAIL INTEGRATION: Admin ko notification bhejo
    try {
      // Leave data populate karo user details ke saath
      const leaveWithUser = await Leave.findById(leave._id).populate('user', 'name email');
      await emailService.sendLeaveApplicationToAdmin(leaveWithUser);
      console.log('✅ Leave application email triggered');
    } catch (emailError) {
      console.error('❌ Email sending failed, but leave saved:', emailError);
      // Email fail hone par bhi leave save ho gaya hai
    }

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
    
    const userId = req.user._id;
    const leaves = await Leave.find({ 
      user: mongoose.Types.ObjectId.createFromHexString(userId.toString())
    }).sort({ createdAt: -1 });

    console.log("✅ DEBUG: Found", leaves.length, "leaves for user");
    
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