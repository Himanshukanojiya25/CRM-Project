const express = require('express');
const router = express.Router();
const departmentHierarchyController = require('../../controllers/admin/departmentHierarchyController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['admin', 'hr_manager']));

// Organization chart and hierarchy
router.get('/org-chart', departmentHierarchyController.getOrganizationChart);
router.get('/tree', departmentHierarchyController.getDepartmentTree);
router.get('/lineage/:id', departmentHierarchyController.getDepartmentLineage);
router.get('/relationships/:id', departmentHierarchyController.getDepartmentRelationships);

// Hierarchy management
router.put('/update', departmentHierarchyController.updateHierarchy);
router.post('/bulk-update', departmentHierarchyController.bulkUpdateHierarchy);

// Hierarchy analytics
router.get('/stats', departmentHierarchyController.getHierarchyStats);
router.get('/search', departmentHierarchyController.searchInHierarchy);
router.get('/validate', departmentHierarchyController.validateHierarchy);

// Export hierarchy
router.get('/export', departmentHierarchyController.exportHierarchy);
router.get('/export/excel', (req, res) => {
  req.query.format = 'excel';
  departmentHierarchyController.exportHierarchy(req, res);
});
router.get('/export/csv', (req, res) => {
  req.query.format = 'csv';
  departmentHierarchyController.exportHierarchy(req, res);
});

module.exports = router;