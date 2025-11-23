const express = require('express');
const router = express.Router();
const dashboardController = require('../../../controllers/admin/performance/dashboardController');

console.log('✅ Performance routes loaded');

// ✅ TEST ROUTE - HARDCODE ADMIN LAYOUT
router.get('/test-layout', (req, res) => {
  console.log('🔧 Testing admin layout...');
  
  const kpiData = {
    totalRevenue: 1250000,
    dealsWon: 15,
    totalActivities: 42,
    pipelineValue: 850000,
    conversionRate: 25.5,
    avgDealSize: 83000
  };
  
  // ✅ EXPLICITLY SET ADMIN LAYOUT
  res.render('admin/performance/dashboard', {
    title: 'Performance Dashboard',
    pageTitle: 'Performance Analytics - CRM Admin',
    kpiData: kpiData,
    user: req.user || { name: 'Admin User', role: 'admin' },
    currentUrl: '/admin/performance/test-layout',
    layout: 'layouts/admin-base'  // ✅ HARDCODED
  });
});

// Main performance dashboard
router.get('/', dashboardController.getDashboard);

// API endpoint for KPI data
router.get('/kpi-data', dashboardController.getKPIData);

module.exports = router;