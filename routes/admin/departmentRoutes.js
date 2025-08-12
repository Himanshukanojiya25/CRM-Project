const express = require('express');
const router = express.Router();
const departmentController = require('../../controllers/admin/departmentController');

// Test route to verify basic routing works
router.get('/test', (req, res) => {
  res.json({ message: "Basic route working" });
});

// Your actual routes
router.post('/', departmentController.createDepartment);
router.get('/', departmentController.getAllDepartments);

// CRUCIAL: Must export just the router
module.exports = router; // NOT module.exports = { router }