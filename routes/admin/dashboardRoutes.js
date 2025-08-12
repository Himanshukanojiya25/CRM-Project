const express = require('express');
const router = express.Router();

// ✅ Middlewares
const { isAuthenticated, roleMiddleware } = require('../../middlewares/authMiddleware');

// ✅ Controller
const { getAdminDashboard } = require('../../controllers/admin/dashboardController');

// 📌 Admin Dashboard route
router.get(
  '/',
  isAuthenticated,
  roleMiddleware(['admin']),
  getAdminDashboard
);

module.exports = router;
