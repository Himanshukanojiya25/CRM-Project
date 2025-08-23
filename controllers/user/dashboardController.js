const User = require('../../models/User');
const Attendance = require('../../models/Attendance');

const getDashboard = async (req, res) => {
  try {
    console.log('📊 Dashboard Request - User:', req.user);
    console.log('📊 Dashboard Request - Session:', req.session);
    
    if (!req.user) {
      console.log('❌ No user in request');
      return res.redirect('/auth/login');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('❌ User not found in database');
      return res.redirect('/auth/login');
    }

    console.log('✅ User found:', user.name);
    
    const stats = {
      leavesApplied: 3,
      feedbackSubmitted: 2,
      attendanceDays: 15
    };

    res.render('user/dashboard', {
      pageTitle: 'Dashboard - CRM',
      layout: 'layouts/user-base',
      user: user,
      stats: stats
    });
  } catch (err) {
    console.error('❌ Dashboard error:', err);
    res.status(500).send('Server Error');
  }
};

module.exports = { getDashboard };