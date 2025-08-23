// ✅ ADD THESE IMPORTS AT THE TOP
const User = require('../../models/User');
const Department = require('../../models/Department');
const Attendance = require('../../models/Attendance');
const Leave = require('../../models/Leave');
const Feedback = require('../../models/Feedback');

exports.getAdminDashboard = async (req, res) => {
  try {
    // 📅 Today's start & end time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const todayStr = today.toISOString().split('T')[0];

    // 📊 Dashboard Stats
    const [
      totalUsers,
      totalDepartments,
      todayAttendance,
      todayLeaves,
      recentFeedbacks
    ] = await Promise.all([
      User.countDocuments(),
      Department.countDocuments(),
      Attendance.countDocuments({ 
        checkIn: { $gte: today, $lt: tomorrow } 
      }),
      Leave.countDocuments({ 
        status: 'Approved',
        startDate: { $lte: todayStr },
        endDate: { $gte: todayStr }
      }),
      Feedback.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name')
        .lean()
    ]);

    // 🎯 Render View with data
    res.render('admin/dashboard', {
      pageTitle: 'Admin Dashboard - CRM',
      layout: 'layouts/admin-base',
      totalEmployees: totalUsers,
      totalDepartments: totalDepartments,
      todayAttendance: todayAttendance,
      todayLeaves: todayLeaves,
      recentFeedbacks: recentFeedbacks
    });

  } catch (error) {
    console.error('❌ Dashboard Error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error - CRM</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      </head>
      <body>
        <div class="container mt-5">
          <div class="alert alert-danger">
            <h2>Something went wrong while loading the dashboard.</h2>
            <p>${error.message}</p>
          </div>
        </div>
      </body>
      </html>
    `);
  }
};