const Leave = require('../../models/Leave');
const User = require('../../models/User');

exports.getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate('user', 'name email department')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, leaves });
  } catch (error) {
    console.error('Admin Get Leaves Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const leave = await Leave.findByIdAndUpdate(id, { status }, { new: true });

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    res.status(200).json({ success: true, message: 'Leave status updated', leave });
  } catch (error) {
    console.error('Update Leave Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};
