const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// ----------------------------
// @desc Render Combined Auth Page (Login + Register)
// ----------------------------
const getAuthPage = (req, res) => {
  res.render('auth/auth', { 
    pageTitle: 'CRM - Authentication',
    layout: false
  });
};

// ----------------------------
// @desc Handle Registration
// ----------------------------
const register = async (req, res) => {
  console.log('REGISTER BODY 🟢:', req.body);

  try {
    const { name, email, password, confirmPassword, age, department, role } = req.body;

    if (password !== confirmPassword) {
      return res.send('❌ Passwords do not match');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.send('❌ User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      age,
      role: role || 'user'
    });

    if (department && mongoose.Types.ObjectId.isValid(department)) {
      user.department = department;
    }

    await user.save();
    res.redirect('/auth');
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).send('❌ Server error during registration');
  }
};

// ----------------------------
// @desc Handle Login
// ----------------------------
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.send('❌ User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.send('❌ Invalid credentials');

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie('token', token, { httpOnly: true });
    res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).send('❌ Server error during login');
  }
};

// ----------------------------
// @desc Handle Logout
// ----------------------------
const logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth');
};

module.exports = {
  getAuthPage,  // ✅ Combined auth page
  register,
  login,
  logout
};