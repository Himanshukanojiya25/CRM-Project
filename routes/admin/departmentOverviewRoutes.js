const express = require('express');
const router = express.Router();
const departmentController = require('../../controllers/admin/departmentController');
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['admin', 'super_admin']));

// View routes
router.get('/overview', (req, res) => {
  res.render('admin/departments/overview', {
    pageTitle: 'Department Overview - CRM Admin',
    layout: 'layouts/admin-base',
    user: req.user
  });
});

router.get('/analytics', (req, res) => {
  res.render('admin/departments/analytics', {
    pageTitle: 'Department Analytics - CRM Admin',
    layout: 'layouts/admin-base',
    user: req.user
  });
});

module.exports = router;