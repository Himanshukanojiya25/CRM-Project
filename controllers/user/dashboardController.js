const User = require('../../models/User');
const Leave = require('../../models/Leave');
const Feedback = require('../../models/Feedback');
const Attendance = require('../../models/Attendance');
const Holiday = require('../../models/Holiday');
const Announcement = require('../../models/Announcement');
const Notification = require('../../models/Notification');

const getDashboard = async (req, res) => {
  try {
    console.log('🎯🎯🎯 DASHBOARD CONTROLLER CALLED 🎯🎯🎯');
    
    // ✅ CACHE PREVENTION
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (!req.user) {
      console.log('❌ No user in request');
      return res.redirect('/auth/login');
    }

    console.log('✅ User ID:', req.user._id);
    console.log('✅ User Role:', req.user.role);

    const user = await User.findById(req.user._id).populate('department', 'name');
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.redirect('/auth/login');
    }

    console.log('✅ User found:', user.name);

    // ✅ GET CURRENT YEAR FOR FILTERING
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(`${currentYear}-01-01`);
    const yearEnd = new Date(`${currentYear}-12-31`);

    // ✅ GET CURRENT MONTH START AND END (FIXED)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    console.log(`📊 Fetching data for ${currentYear}, Month: ${now.getMonth() + 1}`);

    // ✅ ALL DATA FETCHING - PARALLEL QUERIES
    const [
      yearlyLeaves, 
      yearlyFeedback, 
      yearlyAttendance, 
      todayAttendance,
      approvedLeaves,
      pendingLeaves, 
      monthlyAttendance, // ✅ Now calculated properly
      recentAttendance,
      recentLeaves,
      recentFeedback,
      upcomingHolidays,
      recentAnnouncements,
      userNotifications
    ] = await Promise.all([
      // 1. Yearly Leaves Count
      Leave.countDocuments({
        user: req.user._id,
        startDate: { 
          $gte: yearStart,
          $lte: yearEnd 
        }
      }),

      // 2. Yearly Feedback Count
      Feedback.countDocuments({
        user: req.user._id,
        createdAt: { 
          $gte: yearStart,
          $lte: yearEnd 
        }
      }),

      // 3. Yearly Present Days Count
      Attendance.countDocuments({
        user: req.user._id,
        status: 'present',
        date: { 
          $gte: yearStart,
          $lte: yearEnd 
        }
      }),

      // 4. Today's Attendance Status
      Attendance.findOne({
        user: req.user._id,
        date: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999)
        }
      }).select('status'),

      // 5. Approved Leaves Count
      Leave.countDocuments({
        user: req.user._id,
        status: 'approved',
        startDate: { $gte: yearStart }
      }),

      // 6. Pending Leaves Count
      Leave.countDocuments({
        user: req.user._id,
        status: 'pending',
        startDate: { $gte: yearStart }
      }),

      // 7. ✅ MONTHLY ATTENDANCE (FIXED CALCULATION)
      Attendance.countDocuments({
        user: req.user._id,
        status: 'present',
        date: {
          $gte: monthStart,
          $lte: monthEnd
        }
      }),

      // 8. Recent Attendance (Last 5 records)
      Attendance.find({
        user: req.user._id
      })
      .sort({ date: -1 })
      .limit(5)
      .select('date status checkIn checkOut'),

      // 9. Recent Leaves (Last 5 records)
      Leave.find({
        user: req.user._id
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('startDate endDate status reason'),

      // 10. Recent Feedback (Last 5 records)
      Feedback.find({
        user: req.user._id
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title category status createdAt'),

      // 11. Upcoming Holidays (Next 30 days)
      Holiday.find({
        date: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })
      .sort({ date: 1 })
      .limit(5)
      .select('name date'),

      // 12. Recent Announcements
      Announcement.find({
        $or: [
          { targetAudience: 'all' },
          { targetAudience: 'users' },
          { departments: { $in: [user.department?._id] } }
        ],
        isActive: true
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title message createdAt'),

      // 13. User Notifications
      Notification.find({
        user: req.user._id,
        isRead: false
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title message type createdAt')
    ]);

    // ✅ PREPARE COMPLETE DASHBOARD DATA
    const dashboardData = {
      user: user,
      
      stats: {
        yearlyLeaves: yearlyLeaves || 0,
        yearlyFeedback: yearlyFeedback || 0,
        yearlyAttendance: yearlyAttendance || 0,
        todayAttendance: todayAttendance ? todayAttendance.status : 'Not Marked',
        approvedLeaves: approvedLeaves || 0,
        pendingLeaves: pendingLeaves || 0,
        pendingFeedback: 0, // ✅ Fixed: Remove status check if not in model
        monthlyAttendance: monthlyAttendance || 0,
        currentYear: currentYear
      },

      recentActivity: {
        attendance: recentAttendance || [],
        leaves: recentLeaves || [],
        feedback: recentFeedback || []
      },

      notifications: {
        upcomingHolidays: upcomingHolidays || [],
        announcements: recentAnnouncements || [],
        userNotifications: userNotifications || [],
        unreadCount: userNotifications ? userNotifications.length : 0
      }
    };

    console.log('📈📈📈 DASHBOARD DATA LOADED 📈📈📈');
    console.log('Stats:', {
      yearlyAttendance: dashboardData.stats.yearlyAttendance,
      monthlyAttendance: dashboardData.stats.monthlyAttendance,
      todayStatus: dashboardData.stats.todayAttendance
    });

    // ✅ RENDER WITH COMPLETE DATA
    return res.render('user/dashboard', {
      pageTitle: 'Dashboard - CRM',
      layout: 'layouts/user-base',
      ...dashboardData
    });

  } catch (err) {
    console.error('❌❌❌ DASHBOARD ERROR ❌❌❌');
    console.error('Error:', err);
    
    const user = await User.findById(req.user._id).populate('department', 'name');
    return res.render('user/dashboard', {
      pageTitle: 'Dashboard - CRM',
      layout: 'layouts/user-base',
      user: user,
      stats: {
        yearlyLeaves: 0,
        yearlyFeedback: 0, 
        yearlyAttendance: 0,
        todayAttendance: 'Not Marked',
        approvedLeaves: 0,
        pendingLeaves: 0,
        pendingFeedback: 0,
        monthlyAttendance: 0,
        currentYear: new Date().getFullYear()
      },
      recentActivity: {},
      notifications: {}
    });
  }
};

module.exports = { getDashboard };