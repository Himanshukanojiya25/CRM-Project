const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const transporter = require('../config/email'); // ✅ EMAIL TRANSPORTER IMPORT

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// ----------------------------
// @desc Send Welcome Email (PROFESSIONAL VERSION)
// ----------------------------
const sendWelcomeEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: `"CRM Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Welcome to CRM, ${name}! 🚀`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                     padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { background: #667eea; color: white; padding: 12px 30px; 
                     text-decoration: none; border-radius: 5px; display: inline-block; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to CRM! 🎉</h1>
              <p>We're excited to have you on board</p>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Your account has been successfully created in our Customer Relationship Management system.</p>
              
              <p><strong>What you can do now:</strong></p>
              <ul>
                <li>Track customer interactions</li>
                <li>Manage leads and deals</li>
                <li>Generate reports and analytics</li>
                <li>Collaborate with your team</li>
              </ul>
              
              <p style="text-align: center;">
                <a href="http://localhost:8080/auth" class="button">Login to Your Account</a>
              </p>
              
              <p>If you have any questions, feel free to contact our support team.</p>
              
              <p>Best regards,<br>CRM Team</p>
            </div>
            <div class="footer">
              <p>© 2025 CRM System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent to:', email);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
  }
};

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
    
    // ✅ SEND WELCOME EMAIL AFTER SUCCESSFUL REGISTRATION
    await sendWelcomeEmail(email, name);
    
    res.redirect('/auth');
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).send('❌ Server error during registration');
  }
};


// ----------------------------
// @desc Handle Login (DEBUG VERSION)
// ----------------------------
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // ✅ DEBUG LOGS
    console.log('🔐 Login attempt for email:', email);
    console.log('📝 Input password:', password);

    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found in database');
      return res.send('❌ User not found');
    }

    // ✅ DEBUG LOGS
    console.log('💾 Stored hash:', user.password);
    console.log('👤 User role:', user.role);

    const isMatch = await bcrypt.compare(password, user.password);
    
    // ✅ DEBUG LOGS
    console.log('🔑 Bcrypt compare result:', isMatch);

    if (!isMatch) {
      console.log('❌ Password does not match');
      return res.send('❌ Invalid credentials');
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie('token', token, { httpOnly: true });
    
    console.log('✅ Login successful, redirecting to:', user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
    
    res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
  } catch (err) {
    console.error('❌ Login Error:', err);
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
  logout,
  sendWelcomeEmail
};