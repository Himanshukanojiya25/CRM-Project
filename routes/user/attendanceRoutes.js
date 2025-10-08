const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middlewares/authMiddleware');
const { 
  getAttendancePage,
  checkIn, 
  checkOut, 
  getMonthlyRecords,
  archiveOldAttendance,
  todayStatus 
} = require('../../controllers/user/attendanceController');

// ✅ Route: Attendance Page (RENDER EJS)
router.get('/', isAuthenticated, getAttendancePage);

// ✅ Route: User Check-In (API)
router.post('/check-in', isAuthenticated, checkIn);

// ✅ Route: User Check-Out (API)
router.post('/check-out', isAuthenticated, checkOut);

// ✅ Route: Get Monthly Records (API)
router.get('/monthly/:monthYear?', isAuthenticated, getMonthlyRecords);

// ✅ Route: Archive Old Data (API - Can be called via cron job)
router.post('/archive', isAuthenticated, archiveOldAttendance);

// ✅ Route: Today's Status (API)
router.get('/today-status', isAuthenticated, todayStatus);

module.exports = router;