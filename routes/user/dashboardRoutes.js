const express = require('express');
const router = express.Router();

const { isAuthenticated } = require('../../middlewares/authMiddleware');
const { getDashboard, getDashboardData } = require('../../controllers/user/dashboardController');

// ✅ CORRECT ROUTES - Remove extra /dashboard
router.get('/', isAuthenticated, getDashboard);           // This becomes /user/dashboard
router.get('/data', isAuthenticated, getDashboardData);   // This becomes /user/dashboard/data

module.exports = router;