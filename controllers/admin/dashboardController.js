const User = require('../../models/User');
const Department = require('../../models/Department');
const Leave = require('../../models/Leave');
const Attendance = require('../../models/Attendance');
const Feedback = require('../../models/Feedback');

exports.getAdminDashboard = async (req, res) => {
  try {
    // 📅 Today’s start & end time
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // 📊 Dashboard Stats
    const [
      totalUsers,
      totalDepartments,
      totalLeaves,
      totalFeedbacks,
      todayAttendance
    ] = await Promise.all([
      User.countDocuments(),
      Department.countDocuments(),
      Leave.countDocuments(),
      Feedback.countDocuments(),
      Attendance.countDocuments({ checkIn: { $gte: today, $lt: tomorrow } })
    ]);

    // 📝 Recent Leave Requests
    const recentLeaves = await Leave.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .lean();

    // 💬 Recent Feedbacks
    const recentFeedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .lean();

    // 🏢 Department-wise User Count
    const departments = await Department.find().lean();
    const departmentWiseUsers = await Promise.all(
      departments.map(async (dept) => ({
        department: dept.name,
        userCount: await User.countDocuments({ department: dept._id })
      }))
    );

    // 🎯 Render View
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      name: req.user?.name || 'Admin', // Fallback for missing auth
      totalUsers,
      totalDepartments,
      totalLeaves,
      totalFeedbacks,
      todayAttendance,
      recentLeaves,
      recentFeedbacks,
      departmentWiseUsers
    });

  } catch (error) {
    console.error('❌ Dashboard Error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Something went wrong while loading the dashboard.',
      error 
    });
  }
};
