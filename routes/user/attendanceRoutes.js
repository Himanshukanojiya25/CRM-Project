const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middlewares/authMiddleware');
const { checkIn, checkOut, myRecords } = require('../../controllers/user/attendanceController');

// ✅ Route: User Check-In
router.post('/check-in', isAuthenticated, checkIn);

// ✅ Route: User Check-Out
router.post('/check-out', isAuthenticated, checkOut);

// ✅ Route: Get All Records of Logged-in User
router.get('/my-records', isAuthenticated, myRecords);

module.exports = router;
