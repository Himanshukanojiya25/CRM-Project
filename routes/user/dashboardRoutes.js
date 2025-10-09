const express = require('express');
const router = express.Router();

const { isAuthenticated } = require('../../middlewares/authMiddleware');
const { getDashboard, getDashboardData } = require('../../controllers/user/dashboardController');

// ✅ SIMPLE ROUTES - No complex middleware
router.get('/dashboard', isAuthenticated, getDashboard);
router.get('/dashboard/data', isAuthenticated, getDashboardData);

module.exports = router;