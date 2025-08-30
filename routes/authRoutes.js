const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport');

// GET Combined Auth Page
router.get('/', authController.getAuthPage);
router.get('/login', authController.getAuthPage);
router.get('/register', authController.getAuthPage);

// ✅ Google Auth Routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// ✅ GitHub Auth Routes (ADD KARO YAHAN)
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/auth' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// POST handlers
router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/logout', authController.logout);

module.exports = router;

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Himanshu Kanojiya
 *               email:
 *                 type: string
 *                 example: himanshu@example.com
 *               password:
 *                 type: string
 *                 example: your_password_here
 *     responses:
 *       201:
 *         description: User registered successfully
 */
