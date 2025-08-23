const express = require('express');
const router = express.Router();
const { 
  getEmployeePage, 
  createEmployee, 
  deleteEmployee 
} = require('../../controllers/admin/employeeController');
const { isAuthenticated } = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');

// GET /admin/employees - List page
router.get('/', isAuthenticated, roleMiddleware(['admin']), getEmployeePage);

// POST /admin/employees - Create new employee
router.post('/', isAuthenticated, roleMiddleware(['admin']), createEmployee);

// DELETE /admin/employees/:id - Delete employee
router.delete('/:id', isAuthenticated, roleMiddleware(['admin']), deleteEmployee);

module.exports = router;