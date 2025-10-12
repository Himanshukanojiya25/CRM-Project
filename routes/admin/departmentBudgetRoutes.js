const express = require('express');
const router = express.Router();
const departmentBudgetController = require('../../controllers/admin/departmentBudgetController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['admin', 'finance_manager', 'department_head']));

// Budget allocation and management
router.post('/allocate', departmentBudgetController.allocateBudget);
router.put('/utilization', departmentBudgetController.updateBudgetUtilization);
router.post('/expense', departmentBudgetController.addExpense);

// Budget approval workflow
router.post('/submit', departmentBudgetController.submitBudgetForApproval);
router.post('/review', departmentBudgetController.reviewBudget);

// Budget reports and analytics
router.get('/overview', departmentBudgetController.getBudgetOverview);
router.get('/:departmentId/:year', departmentBudgetController.getBudgetReports);
router.get('/:departmentId/:year/forecast', departmentBudgetController.getBudgetForecast);

// Export budget data
router.get('/:departmentId/:year/export', departmentBudgetController.exportBudgetData);
router.get('/:departmentId/:year/export/excel', (req, res) => {
  req.query.format = 'excel';
  departmentBudgetController.exportBudgetData(req, res);
});
router.get('/:departmentId/:year/export/pdf', (req, res) => {
  req.query.format = 'pdf';
  departmentBudgetController.exportBudgetData(req, res);
});

module.exports = router;