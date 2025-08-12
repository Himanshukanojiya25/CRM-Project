const express = require('express');
const router = express.Router();

const { isAuthenticated } = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const { getDashboard } = require('../../controllers/user/dashboardController');

router.get('/dashboard', isAuthenticated, roleMiddleware(['user']), getDashboard);

module.exports = router; // ✅ Important
