const express = require('express');
const router = express.Router();

const { getAllLeaves } = require('../../controllers/admin/leavesController');
const { isAuthenticated } = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware'); // ✅ correct import

router.get('/admin-leaves', isAuthenticated, roleMiddleware(['admin']), getAllLeaves);

module.exports = router;
