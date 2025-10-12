const express = require('express');
const router = express.Router();
const departmentReportsController = require('../../controllers/admin/departmentReportsController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['admin', 'hr_manager', 'department_head', 'analyst']));

// Report generation
router.post('/generate', departmentReportsController.generateDepartmentReport);
router.post('/generate/comparative', departmentReportsController.generateComparativeReport);
router.post('/generate/trend', departmentReportsController.generateTrendReport);
router.post('/generate/workforce', departmentReportsController.generateWorkforceReport);
router.post('/generate/budget', departmentReportsController.generateBudgetReport);
router.post('/generate/executive', departmentReportsController.generateExecutiveSummary);

// Report templates and configurations
router.get('/templates', departmentReportsController.getReportTemplates);
router.get('/configurations', departmentReportsController.getSavedConfigurations);
router.post('/configurations', departmentReportsController.saveReportConfiguration);

// Automated reports
router.post('/schedule', departmentReportsController.scheduleReport);

// Report history
router.get('/history', departmentReportsController.getReportHistory);

module.exports = router;