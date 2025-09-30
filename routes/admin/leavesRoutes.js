const express = require('express');
const router = express.Router();
const { getPendingLeaves, approveLeave, rejectLeave, getLeavesDebug } = require('../../controllers/admin/leavesController');
const { isAuthenticated } = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');

router.get('/', isAuthenticated, roleMiddleware(['admin']), getPendingLeaves);
router.post('/approve/:id', isAuthenticated, roleMiddleware(['admin']), approveLeave);
router.post('/reject/:id', isAuthenticated, roleMiddleware(['admin']), rejectLeave);

// ✅ Add debug route
router.get('/api/debug', isAuthenticated, roleMiddleware(['admin']), getLeavesDebug);

module.exports = router;