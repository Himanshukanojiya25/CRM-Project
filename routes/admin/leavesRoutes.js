const express = require('express');
const router = express.Router();
const leavesController = require('../../controllers/admin/leavesController');
const { isAuthenticated } = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');

// Route to get all pending leaves for admin
router.get('/', isAuthenticated, roleMiddleware(['admin']), leavesController.getPendingLeaves);

// Route to approve a specific leave request
router.post('/approve/:id', isAuthenticated, roleMiddleware(['admin']), leavesController.approveLeave);

// Route to reject a specific leave request
router.post('/reject/:id', isAuthenticated, roleMiddleware(['admin']), leavesController.rejectLeave);

module.exports = router;