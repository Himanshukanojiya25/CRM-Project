// controllers/admin/adminController.js
const Leave = require('../../models/leave');
const User = require('../../models/user');

// ✅ Admin - All users ke leaves
const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate('user', 'name email'); // user info bhi dikhana hai

    res.render('admin/leaves', {
      leaves
    });
  } catch (error) {
    console.error("Error in admin getAllLeaves:", error);
    res.status(500).send("Server Error");
  }
};

// ✅ Admin - All users list
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.render('admin/users', {
      users
    });
  } catch (error) {
    console.error("Error in admin getAllUsers:", error);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getAllLeaves,
  getAllUsers
};
