const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../middlewares/authMiddleware');

router.use(authenticate);
router.use(authorize('admin'));

// Assignment list
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Feedback Assignment API Working',
        data: {
            assignments: [
                {
                    id: 1,
                    feedbackId: 'FB-1247',
                    title: 'Login page loading too slow',
                    assignedTo: 'Sarah Johnson',
                    dueDate: 'Today, 5:00 PM',
                    status: 'in-progress'
                }
            ]
        }
    });
});

module.exports = router;