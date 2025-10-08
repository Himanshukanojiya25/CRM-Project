const Leave = require('../../models/Leave');
const User = require('../../models/User');
const emailService = require('../../services/email/emailService'); // ✅ EMAIL SERVICE ADDED

// Get all pending leave requests
exports.getPendingLeaves = async (req, res) => {
  try {
    if (!req.user) {
      console.error('Unauthorized access - no user found');
      return res.status(401).render('error', {
        message: 'Unauthorized: Please log in',
        layout: 'layouts/admin-base'
      });
    }

    const pendingLeaves = await Leave.find({ status: 'pending' })
      .populate({
        path: 'user',
        select: 'name email employeeId department',
        model: 'User'
      })
      .sort({ createdAt: -1 });

    console.log('Fetched pending leaves:', pendingLeaves.length);
    
    res.render('admin/leaves/list', {
      leaves: pendingLeaves || [],
      pageTitle: 'Pending Leave Requests',
      layout: 'layouts/admin-base'
    });
  } catch (error) {
    console.error('Error in getPendingLeaves:', error);
    res.status(500).render('error', {
      message: 'Server Error: Unable to fetch leave requests',
      error: error.message,
      layout: 'layouts/admin-base'
    });
  }
};

// Approve leave request - WITH EMAIL INTEGRATION
exports.approveLeave = async (req, res) => {
  try {
    const leaveId = req.params.id;

    if (!req.user) {
      console.error('Unauthorized access - no user found');
      return res.status(401).send('Unauthorized: Please log in');
    }

    const leave = await Leave.findByIdAndUpdate(
      leaveId,
      {
        status: 'approved',
        approvedBy: req.user._id,
        approvedAt: Date.now(),
        rejectionReason: '',
        updatedAt: Date.now(),
      },
      { new: true }
    ).populate('user', 'name email'); // ✅ Population for email

    if (!leave) {
      console.error(`Leave request not found: ${leaveId}`);
      return res.status(404).send('Leave request not found.');
    }

    // ✅ EMAIL INTEGRATION: User ko approved email bhejo
    try {
      await emailService.sendLeaveApprovedEmail(leave);
      console.log('✅ Leave approved email sent to:', leave.user.email);
    } catch (emailError) {
      console.error('❌ Email sending failed, but leave approved:', emailError);
      // Email fail hone par bhi leave approve ho gaya hai
    }

    console.log(`Leave approved: ${leaveId} for user: ${leave.user.name}`);
    res.redirect('/admin/leaves');
  } catch (error) {
    console.error('Error in approveLeave:', error);
    res.status(500).send('Server Error: Unable to approve leave');
  }
};

// Reject leave request - WITH EMAIL INTEGRATION
exports.rejectLeave = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const { rejectionReason } = req.body;

    if (!req.user) {
      console.error('Unauthorized access - no user found');
      return res.status(401).send('Unauthorized: Please log in');
    }

    const leave = await Leave.findByIdAndUpdate(
      leaveId,
      {
        status: 'rejected',
        approvedBy: req.user._id,
        approvedAt: Date.now(),
        rejectionReason: rejectionReason || '',
        updatedAt: Date.now(),
      },
      { new: true }
    ).populate('user', 'name email'); // ✅ Population for email

    if (!leave) {
      console.error(`Leave request not found: ${leaveId}`);
      return res.status(404).send('Leave request not found.');
    }

    // ✅ EMAIL INTEGRATION: User ko rejected email bhejo
    try {
      await emailService.sendLeaveRejectedEmail(leave);
      console.log('✅ Leave rejected email sent to:', leave.user.email);
    } catch (emailError) {
      console.error('❌ Email sending failed, but leave rejected:', emailError);
      // Email fail hone par bhi leave reject ho gaya hai
    }

    console.log(`Leave rejected: ${leaveId} for user: ${leave.user.name}`);
    res.redirect('/admin/leaves');
  } catch (error) {
    console.error('Error in rejectLeave:', error);
    res.status(500).send('Server Error: Unable to reject leave');
  }
};

// ✅ Add this new function for debugging
exports.getLeavesDebug = async (req, res) => {
  try {
    const leaves = await Leave.find({ status: 'pending' })
      .populate('user', 'name email employeeId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      leaves: leaves.map(leave => ({
        id: leave._id,
        userName: leave.user ? leave.user.name : 'No User',
        userEmail: leave.user ? leave.user.email : 'No Email',
        userId: leave.user ? leave.user._id : 'No ID',
        leaveType: leave.leaveType,
        status: leave.status
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};