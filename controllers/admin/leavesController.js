// controllers/admin/leaveController.js
const Leave = require('../../models/Leave');
const User = require('../../models/User');

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

    // ✅ CRITICAL FIX: Proper population with select fields
    const pendingLeaves = await Leave.find({ status: 'pending' })
      .populate({
        path: 'user',
        select: 'name email employeeId department', // ✅ Specific fields select karo
        model: 'User'
      })
      .sort({ createdAt: -1 });

    console.log('Fetched pending leaves:', pendingLeaves.length);
    
    // ✅ Debugging: Check each leave's user data
    pendingLeaves.forEach((leave, index) => {
      console.log(`Leave ${index + 1}:`, {
        leaveId: leave._id,
        userId: leave.user ? leave.user._id : 'No User',
        userName: leave.user ? leave.user.name : 'No Name',
        userEmail: leave.user ? leave.user.email : 'No Email'
      });
    });

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

// Approve leave request
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
    ).populate('user', 'name email'); // ✅ Population add karo

    if (!leave) {
      console.error(`Leave request not found: ${leaveId}`);
      return res.status(404).send('Leave request not found.');
    }

    console.log(`Leave approved: ${leaveId} for user: ${leave.user.name}`);
    res.redirect('/admin/leaves');
  } catch (error) {
    console.error('Error in approveLeave:', error);
    res.status(500).send('Server Error: Unable to approve leave');
  }
};

// Reject leave request
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
    ).populate('user', 'name email'); // ✅ Population add karo

    if (!leave) {
      console.error(`Leave request not found: ${leaveId}`);
      return res.status(404).send('Leave request not found.');
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