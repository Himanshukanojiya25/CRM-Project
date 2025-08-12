const express = require('express');
const router = express.Router();

// User Dashboard Routes with `page` passed for sidebar highlighting
router.get('/user/dashboard', (req, res) => {
  res.render('user/dashboard', { page: 'dashboard' });
});

router.get('/user/attendance', (req, res) => {
  res.render('user/attendance', { page: 'attendance' });
});

router.get('/user/leaves', (req, res) => {
  res.render('user/leaves', { page: 'leaves' });
});

router.get('/user/feedback', (req, res) => {
  res.render('user/feedback', { page: 'feedback' });
});

router.get('/user/profile', (req, res) => {
  res.render('user/profile', { page: 'profile' });
});

module.exports = router;
