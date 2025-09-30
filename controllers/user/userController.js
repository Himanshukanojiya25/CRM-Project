// controllers/user/userController.js
const Leave = require('../../models/leave');

const getDashboard = async (req, res) => {
  try {
    const user = req.user; // middleware se mila
    // ✅ Sirf is user ke leaves
    const leaves = await Leave.find({ user: user._id });

    res.render('user/dashboard', {
      user,
      leaves
    });
  } catch (error) {
    console.error("Error in user dashboard:", error);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getDashboard
};
