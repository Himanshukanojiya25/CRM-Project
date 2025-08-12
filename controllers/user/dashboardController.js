const User = require('../../models/User');

const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id); // adjust if using JWT or session

    if (!user) return res.status(404).send("User not found");

    const stats = {
      leavesApplied: 3,
      feedbackSubmitted: 2,
      attendanceDays: 15
    };

    res.render('user/dashboard', {
      title: 'Dashboard',
      name: user.name,
      stats
    });
  } catch (err) {
    console.error('Error loading dashboard:', err);
    res.status(500).send('Server Error');
  }
};

module.exports = { getDashboard };
