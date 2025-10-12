const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const passport = require('passport');

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// ----------------------------
// @desc Send Welcome Email
// ----------------------------
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = require('../config/email');
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
// @desc Render Combined Auth Page
// ----------------------------
const getAuthPage = (req, res) => {
  res.clearCookie('token');
  res.clearCookie('session');
  
  res.render('auth/auth', { 
    pageTitle: 'CRM - Authentication',
    layout: false
  });
};

// ----------------------------
// @desc Handle Registration
// ----------------------------
const register = async (req, res) => {
  console.log('🟢 REGISTER REQUEST BODY:', req.body);

  try {
    const { name, email, password, confirmPassword, phone, role } = req.body;

    // ✅ VALIDATION CHECKS
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // ✅ CHECK IF USER ALREADY EXISTS
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // ✅ CREATE NEW USER
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      phone: phone || '',
      role: role || 'user',
      status: 'Active',
      isEmailVerified: false,
      profilePhoto: '/images/default-avatar.png',
      profilePicture: {
        url: '/images/default-avatar.png',
        filename: '',
        originalName: '',
        uploadDate: new Date(),
        size: 0,
        mimeType: ''
      }
    });

    console.log('🟢 Creating user with data:', {
      name: user.name,
      email: user.email,
      role: user.role
    });

    // ✅ SAVE USER
    await user.save();
    console.log('✅ User saved successfully:', user._id);

    // ✅ SEND WELCOME EMAIL
    try {
      await sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.error('❌ Email sending failed but user created:', emailError);
    }

    // ✅ SUCCESS RESPONSE
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please login to continue.',
      redirectUrl: '/auth'
    });

  } catch (error) {
    console.error('❌ REGISTER ERROR:', error);
    
    if (error.name === 'ValidationError') {
      let errors = [];
      if (error.errors) {
        errors = Object.values(error.errors).map(err => err.message);
      } else {
        errors = ['Validation failed - please check your input data'];
      }
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists in our system'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed due to server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ----------------------------
// @desc Handle Login (PASSPORT VERSION - FIXED)
// ----------------------------
const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('❌ Passport auth error:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error during authentication'
      });
    }

    if (!user) {
      console.log('❌ Passport auth failed:', info?.message);
      return res.status(400).json({
        success: false,
        message: info?.message || 'Invalid email or password'
      });
    }

    req.login(user, async (loginErr) => {
      if (loginErr) {
        console.error('❌ req.login error:', loginErr);
        return res.status(500).json({
          success: false,
          message: 'Session error during login'
        });
      }

      console.log('✅ Passport login successful:', user.email);

      // ✅ GENERATE JWT TOKEN
      const token = jwt.sign(
        { 
          id: user._id, 
          email: user.email,
          role: user.role,
          loginTime: Date.now()
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // ✅ UPDATE LAST LOGIN
      await User.findByIdAndUpdate(user._id, { 
        lastLogin: new Date() 
      });

      // ✅ SET COOKIE
      res.cookie('token', token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'strict'
      });

      console.log('✅ LOGIN SUCCESSFUL - Redirecting to:', user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');

      // ✅ SUCCESS RESPONSE
      res.json({
        success: true,
        message: 'Login successful! Redirecting...',
        redirectUrl: user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    });
  })(req, res, next);
};

// ----------------------------
// @desc Handle Logout
// ----------------------------
const logout = (req, res) => {
  console.log('🚪 LOGOUT - Clearing all cookies and sessions');
  
  req.logout((err) => {
    if (err) {
      console.error('❌ Passport logout error:', err);
    }
    
    res.clearCookie('token');
    res.clearCookie('session');
    res.clearCookie('user');
    res.clearCookie('auth');
    
    res.json({
      success: true,
      message: 'Logout successful',
      redirectUrl: '/auth'
    });
  });
};

// ----------------------------
// @desc Check Auth Status
// ----------------------------
const checkAuth = async (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      console.log('🔍 AUTH CHECK: No token found');
      return res.json({
        success: false,
        isAuthenticated: false
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`🔍 AUTH CHECK: Token decoded for user: ${decoded.email}`);
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log(`❌ AUTH CHECK: User not found for token`);
      res.clearCookie('token');
      return res.json({
        success: false,
        isAuthenticated: false
      });
    }

    console.log(`✅ AUTH CHECK: User authenticated: ${user.email}`);

    res.json({
      success: true,
      isAuthenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId
      }
    });

  } catch (error) {
    console.error('❌ AUTH CHECK ERROR:', error);
    res.clearCookie('token');
    res.json({
      success: false,
      isAuthenticated: false
    });
  }
};

// ----------------------------
// @desc Emergency Simple Register
// ----------------------------
const simpleRegister = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    console.log('🆘 SIMPLE REGISTER ATTEMPT:', { name, email });

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Check existing
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create minimal user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: 'user',
      status: 'Active',
      profilePhoto: '/images/default-avatar.png'
    });

    await user.save();
    console.log('🆘 SIMPLE USER CREATED:', user._id);

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie('token', token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please login.',
      redirectUrl: '/auth'
    });

  } catch (error) {
    console.error('🆘 SIMPLE REGISTER ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Simple registration failed',
      error: error.message
    });
  }
};

module.exports = {
  getAuthPage,
  register,
  login,
  logout,
  checkAuth,
  sendWelcomeEmail,
  simpleRegister
};