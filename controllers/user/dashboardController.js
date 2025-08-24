const User = require('../../models/User');

const getDashboard = async (req, res) => {
  try {
    console.log('🎯 GET /user/dashboard called');
    
    if (!req.user) {
      console.log('❌ No user in request');
      return res.redirect('/auth/login');
    }

    const user = await User.findById(req.user._id).populate('department', 'name');
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.redirect('/auth/login');
    }

    console.log('✅ User found:', user.name);

    // Static data for testing
    const stats = {
      leavesApplied: 3,
      feedbackSubmitted: 5, 
      attendanceDays: 15,
      todayAttendance: 'Present'
    };

    // Render with data
    return res.render('user/dashboard', {
      pageTitle: 'Dashboard - CRM',
      layout: 'layouts/user-base',
      user: user,
      stats: stats
    });

  } catch (err) {
    console.error('❌ Dashboard error:', err);
    return res.status(500).send('Server Error');
  }
};

// ✅ CORRECT EXPORT (Object mein wrap karo)
module.exports = { getDashboard };