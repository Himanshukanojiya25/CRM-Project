const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middlewares/authMiddleware');
const { 
  getAttendancePage,  // ✅ Import naya function
  checkIn, 
  checkOut, 
  myRecords, 
  todayStatus 
} = require('../../controllers/user/attendanceController');

// ✅ Route: Attendance Page (RENDER EJS)
router.get('/', isAuthenticated, getAttendancePage);

// ✅ Route: User Check-In (API)
router.post('/check-in', isAuthenticated, checkIn);

// ✅ Route: User Check-Out (API)
router.post('/check-out', isAuthenticated, checkOut);

// ✅ Route: Get All Records (API)
router.get('/my-records', isAuthenticated, myRecords);

// ✅ Route: Today's Status (API)
router.get('/today-status', isAuthenticated, todayStatus);

module.exports = router;