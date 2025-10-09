const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport');

// ========================
// 📄 PAGE ROUTES
// ========================

// GET Combined Auth Page (Login + Register)
router.get('/', authController.getAuthPage);
router.get('/login', authController.getAuthPage);
router.get('/register', authController.getAuthPage);

// ========================
// 🔐 LOCAL AUTH ROUTES
// ========================

// POST Register - User Registration
router.post('/register', authController.register);

// POST Simple Register - Emergency backup
router.post('/simple-register', authController.simpleRegister);

// POST Login - User Login
router.post('/login', authController.login);

// GET Logout - User Logout
router.get('/logout', authController.logout);

// GET Check Auth Status
router.get('/check', authController.checkAuth);

// ========================
// 🔗 SOCIAL AUTH ROUTES (FIXED)
// ========================

// ✅ Google Auth Routes (FIXED)
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// Google Auth Callback (FIXED)
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/auth?error=google_auth_failed',
    session: false  // ✅ IMPORTANT: Disable session for API-based auth
  }),
  (req, res) => {
    try {
      console.log('✅ Google Auth Success - User:', req.user.email);
      
      // Generate JWT token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { 
          id: req.user._id, 
          email: req.user.email,
          role: req.user.role 
        },
        process.env.JWT_SECRET || 'your-fallback-secret-key',
        { expiresIn: '1d' }
      );

      // Set cookie
      res.cookie('token', token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
      });

      const redirectUrl = req.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      console.log('🔄 Redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ Google callback error:', error);
      res.redirect('/auth?error=auth_failed');
    }
  }
);

// ✅ GitHub Auth Routes (FIXED)
router.get('/github',
  passport.authenticate('github', { 
    scope: ['user:email'] 
  })
);

// GitHub Auth Callback (FIXED)
router.get('/github/callback',
  passport.authenticate('github', { 
    failureRedirect: '/auth?error=github_auth_failed',
    session: false  // ✅ IMPORTANT: Disable session for API-based auth
  }),
  (req, res) => {
    try {
      console.log('✅ GitHub Auth Success - User:', req.user.email);
      
      // Generate JWT token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { 
          id: req.user._id, 
          email: req.user.email,
          role: req.user.role 
        },
        process.env.JWT_SECRET || 'your-fallback-secret-key',
        { expiresIn: '1d' }
      );

      // Set cookie
      res.cookie('token', token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
      });

      const redirectUrl = req.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      console.log('🔄 Redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ GitHub callback error:', error);
      res.redirect('/auth?error=auth_failed');
    }
  }
);

// ========================
// 🔧 TEST ROUTES
// ========================

// Test route to check if auth is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;