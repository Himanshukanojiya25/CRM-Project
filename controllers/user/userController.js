// 📄 controllers/user/userController.js

const getDashboard = (req, res) => {
  const user = req.user; // middleware ne set kiya
  res.render('user/dashboard', { user });
};

module.exports = {
  getDashboard
};
