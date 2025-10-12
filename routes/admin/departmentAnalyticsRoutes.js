const express = require('express');
const router = express.Router();
const departmentAnalyticsController = require('../../controllers/admin/departmentAnalyticsController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['admin', 'hr_manager', 'department_head', 'analyst']));

// Department analytics
router.get('/:id', departmentAnalyticsController.getDepartmentAnalytics);
router.get('/:id/real-time', departmentAnalyticsController.getRealTimeMetrics);
router.get('/:id/trends', departmentAnalyticsController.getTrendAnalytics);
router.get('/:id/kpi-dashboard', departmentAnalyticsController.getKPIDashboard);
router.get('/:id/predictive', departmentAnalyticsController.getPredictiveAnalytics);

// Comparative analytics
router.post('/comparative', departmentAnalyticsController.getComparativeAnalytics);

// Export analytics
router.get('/:id/export', departmentAnalyticsController.exportAnalytics);
router.get('/:id/export/pdf', (req, res) => {
  req.query.format = 'pdf';
  departmentAnalyticsController.exportAnalytics(req, res);
});
router.get('/:id/export/excel', (req, res) => {
  req.query.format = 'excel';
  departmentAnalyticsController.exportAnalytics(req, res);
});

module.exports = router;