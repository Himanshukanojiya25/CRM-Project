const Leave = require('../../models/Leave');

exports.applyLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    const userId = req.user._id;

    const newLeave = await Leave.create({
      user: userId,
      startDate,
      endDate,
      reason
    });

    res.status(201).json({ success: true, message: 'Leave applied', leave: newLeave });
  } catch (error) {
    console.error('Apply Leave Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const userId = req.user._id;
    const myLeaves = await Leave.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, leaves: myLeaves });
  } catch (error) {
    console.error('My Leaves Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};
