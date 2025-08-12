// routes/admin/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const { getAllAttendance } = require('../../controllers/admin/attendanceController');

router.get('/attendance/all', isAuthenticated, roleMiddleware(['admin']), getAllAttendance);

module.exports = router;
