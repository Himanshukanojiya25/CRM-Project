const express = require('express');
const router = express.Router();
const dashboardController = require('../../../controllers/admin/performance/dashboardController');

// Main dashboard page
router.get('/', dashboardController.getDashboard);

// API endpoint for KPI data (AJAX calls ke liye)
router.get('/kpi-data', dashboardController.getKPIData);

module.exports = router;