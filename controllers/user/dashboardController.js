const User = require('../../models/User');
const Leave = require('../../models/Leave');
const Feedback = require('../../models/Feedback');
const Attendance = require('../../models/Attendance');
const Holiday = require('../../models/Holiday');
const Announcement = require('../../models/Announcement');
const Notification = require('../../models/Notification');

const getDashboard = async (req, res) => {
  try {
    console.log('🎯 DASHBOARD CONTROLLER CALLED - REAL TIME');
    
    // ✅ CACHE PREVENTION FOR REAL-TIME DATA
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (!req.user) {
      return res.redirect('/auth/login');
    }

    const user = await User.findById(req.user._id).populate('department', 'name');
    if (!user) {
      return res.redirect('/auth/login');
    }

    // ✅ GET DATE RANGES FOR REAL-TIME DATA
    const currentYear = new Date().getFullYear();
    const now = new Date();
    
    // Year range
    const yearStart = new Date(`${currentYear}-01-01`);
    const yearEnd = new Date(`${currentYear}-12-31`);
    
    // Month range (FIXED)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Today range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    console.log(`📊 Fetching REAL-TIME data for ${currentYear}, Month: ${now.getMonth() + 1}`);

    // ✅ PARALLEL DATA FETCHING WITH REAL-TIME OPTIMIZATION
    const [
      yearlyLeaves, 
      yearlyFeedback, 
      yearlyAttendance, 
      todayAttendance,
      approvedLeaves,
      pendingLeaves, 
      pendingFeedback,
      monthlyAttendance,
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
        startDate: { $gte: yearStart, $lte: yearEnd }
      }),

      // 2. Yearly Feedback Count
      Feedback.countDocuments({
        user: req.user._id,
        createdAt: { $gte: yearStart, $lte: yearEnd }
      }),

      // 3. Yearly Present Days Count
      Attendance.countDocuments({
        user: req.user._id,
        status: 'present',
        date: { $gte: yearStart, $lte: yearEnd }
      }),

      // 4. Today's Attendance Status (REAL-TIME)
      Attendance.findOne({
        user: req.user._id,
        date: { $gte: todayStart, $lte: todayEnd }
      }).select('status checkIn checkOut'),

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

      // 7. Pending Feedback Count
      Feedback.countDocuments({
        user: req.user._id,
        status: { $in: ['pending', 'under_review'] }
      }),

      // 8. Monthly Attendance (FIXED CALCULATION)
      Attendance.countDocuments({
        user: req.user._id,
        status: 'present',
        date: { $gte: monthStart, $lte: monthEnd }
      }),

      // 9. Recent Attendance (Last 7 days)
      Attendance.find({
        user: req.user._id,
        date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
      .sort({ date: -1 })
      .limit(10)
      .select('date status checkIn checkOut totalHours'),

      // 10. Recent Leaves (Last 30 days)
      Leave.find({
        user: req.user._id,
        startDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('startDate endDate status reason leaveType days'),

      // 11. Recent Feedback (Last 30 days)
      Feedback.find({
        user: req.user._id,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('title category status priority createdAt rating'),

      // 12. Upcoming Holidays (Next 60 days)
      Holiday.find({
        date: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        }
      })
      .sort({ date: 1 })
      .limit(6)
      .select('name date type'),

      // 13. Recent Announcements (Last 15 days)
      Announcement.find({
        $or: [
          { targetAudience: 'all' },
          { targetAudience: 'users' },
          { departments: { $in: [user.department?._id] } }
        ],
        isActive: true,
        createdAt: { $gte: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title message createdAt priority'),

      // 14. User Notifications (Unread - Last 30 days)
      Notification.find({
        user: req.user._id,
        isRead: false,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .sort({ createdAt: -1 })
      .limit(15)
      .select('title message type createdAt isRead')
    ]);

    // ✅ CALCULATE REAL-TIME METRICS
    const todayStatus = todayAttendance ? todayAttendance.status : 'Not Marked';
    const currentMonth = now.toLocaleString('default', { month: 'long' });
    const attendancePercentage = yearlyAttendance > 0 ? Math.round((yearlyAttendance / 365) * 100) : 0;
    const monthlyProgress = Math.min((monthlyAttendance || 0) * 10, 100);

    // ✅ PREPARE COMPLETE REAL-TIME DASHBOARD DATA
    const dashboardData = {
      user: user,
      
      stats: {
        yearlyLeaves: yearlyLeaves || 0,
        yearlyFeedback: yearlyFeedback || 0,
        yearlyAttendance: yearlyAttendance || 0,
        todayAttendance: todayStatus,
        approvedLeaves: approvedLeaves || 0,
        pendingLeaves: pendingLeaves || 0,
        pendingFeedback: pendingFeedback || 0,
        monthlyAttendance: monthlyAttendance || 0,
        currentYear: currentYear,
        currentMonth: currentMonth,
        attendancePercentage: attendancePercentage,
        monthlyProgress: monthlyProgress
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

    console.log('📈 REAL-TIME DASHBOARD DATA LOADED');
    console.log({
      yearlyAttendance: dashboardData.stats.yearlyAttendance,
      monthlyAttendance: dashboardData.stats.monthlyAttendance,
      todayStatus: dashboardData.stats.todayAttendance,
      pendingActions: dashboardData.stats.pendingLeaves + dashboardData.stats.pendingFeedback
    });

    // ✅ RENDER WITH REAL-TIME DATA
    return res.render('user/dashboard', {
      pageTitle: 'Dashboard - CRM',
      layout: 'layouts/user-base',
      user: dashboardData.user,
      stats: dashboardData.stats,
      recentActivity: dashboardData.recentActivity,
      notifications: dashboardData.notifications,
      lastUpdated: new Date(), // ✅ ADD THIS
      dataFreshness: 'real-time' // ✅ ADD THIS
    });

  } catch (err) {
    console.error('❌ DASHBOARD ERROR:', err);
    
    // ✅ GRACEFUL ERROR HANDLING
    const user = await User.findById(req.user?._id).populate('department', 'name') || { name: 'User' };
    
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
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().toLocaleString('default', { month: 'long' }),
        attendancePercentage: 0,
        monthlyProgress: 0
      },
      recentActivity: {
        attendance: [],
        leaves: [],
        feedback: []
      },
      notifications: {
        upcomingHolidays: [],
        announcements: [],
        userNotifications: [],
        unreadCount: 0
      },
      lastUpdated: new Date(), // ✅ ADD THIS
      dataFreshness: 'cached' // ✅ ADD THIS
    });
  }
};

// ✅ NEW: REAL-TIME DATA API ENDPOINT
const getDashboardData = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // ✅ FETCH ONLY REAL-TIME CHANGING DATA
    const [todayAttendance, pendingLeaves, pendingFeedback, userNotifications] = await Promise.all([
      Attendance.findOne({
        user: req.user._id,
        date: { $gte: todayStart, $lte: todayEnd }
      }).select('status checkIn checkOut'),
      
      Leave.countDocuments({
        user: req.user._id,
        status: 'pending'
      }),
      
      Feedback.countDocuments({
        user: req.user._id,
        status: { $in: ['pending', 'under_review'] }
      }),
      
      Notification.countDocuments({
        user: req.user._id,
        isRead: false
      })
    ]);

    res.json({
      success: true,
      data: {
        todayAttendance: todayAttendance ? todayAttendance.status : 'Not Marked',
        pendingLeaves: pendingLeaves || 0,
        pendingFeedback: pendingFeedback || 0,
        unreadNotifications: userNotifications || 0,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Real-time data error:', error);
    res.status(500).json({ error: 'Failed to fetch real-time data' });
  }
};

module.exports = { 
  getDashboard,
  getDashboardData 
};