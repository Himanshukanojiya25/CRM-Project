const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../middlewares/authMiddleware');

router.use(authenticate);
router.use(authorize('admin'));

// Analytics dashboard data
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Feedback Analytics API Working',
        data: {
            totalFeedback: 1247,
            responded: 894,
            pending: 218,
            averageRating: 4.2,
            responseTime: '2.4 hours',
            satisfactionScore: 8.7,
            categoryDistribution: {
                bug: 35,
                feature: 28,
                general: 22,
                support: 15
            }
        },
        endpoints: [
            'GET /admin/feedback/analytics',
            'GET /admin/feedback/analytics/team-performance', 
            'GET /admin/feedback/analytics/export'
        ]
    });
});

module.exports = router;