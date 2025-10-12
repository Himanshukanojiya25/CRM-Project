const express = require('express');
const router = express.Router();

console.log('✅ Performance routes loaded'); // Ye terminal mein dikhna chahiye

// Main performance dashboard
router.get('/', (req, res) => {
  console.log('🎯 PERFORMANCE DASHBOARD ROUTE HIT!');
  
  const kpiData = {
    totalRevenue: 1250000,
    dealsWon: 15,
    totalActivities: 42,
    pipelineValue: 850000,
    conversionRate: 25.5,
    avgDealSize: 83000
  };
  
  res.render('admin/performance/dashboard', {
    title: 'Performance Dashboard',
    kpiData: kpiData,
    user: req.user || { name: 'Admin User' }
  });
});

module.exports = router;