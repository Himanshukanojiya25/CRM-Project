const express = require('express');
const router = express.Router();
const { getEmployeePage } = require('../../controllers/admin/employeeController');
const { isAuthenticated } = require('../../middlewares/authMiddleware'); // ✅ fixed
const roleMiddleware = require('../../middlewares/roleMiddleware');

router.get('/', isAuthenticated, roleMiddleware(['admin']), getEmployeePage);

module.exports = router;
