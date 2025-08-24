const express = require('express');
const router = express.Router();

const { isAuthenticated } = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const { getDashboard } = require('../../controllers/user/dashboardController'); // ✅ getDashboard hi import karo

// GET /user/dashboard - User dashboard page
router.get('/dashboard', 
  isAuthenticated, 
  roleMiddleware(['user']), 
  getDashboard // ✅ getDashboard hi use karo
);

module.exports = router;