const express = require('express');
const router = express.Router();
const feedbackController = require('../../../controllers/admin/feedback/feedbackController');
const { body, param, query } = require('express-validator');
const { authenticate, authorize } = require('../../../middlewares/authMiddleware');
const feedbackMiddleware = require('../../../middlewares/feedback/feedbackMiddleware');

// Apply authentication and authorization to all routes
router.use(authenticate);
router.use(authorize('admin'));

// ✅ ADD THIS 1 LINE ONLY - HTML Page route
router.get('/html', feedbackController.getFeedbackPage);

// Validation rules
const statusValidation = body('status')
    .isIn(['new', 'acknowledged', 'in_progress', 'resolved', 'closed', 'pending', 'responded'])
    .withMessage('Invalid status value');

const responseValidation = [
    body('message')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Response message is required'),
    body('isInternal')
        .optional()
        .isBoolean()
        .withMessage('isInternal must be a boolean'),
    body('sentVia')
        .optional()
        .isIn(['email', 'system', 'both'])
        .withMessage('Invalid sentVia value')
];

const assignmentValidation = [
    body('assignedTo')
        .isMongoId()
        .withMessage('Valid assignedTo user ID is required'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Invalid priority value'),
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Due date must be a valid date')
];

// 🔥 MAIN FEEDBACK LIST ROUTE - This will show real data
router.get('/', 
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('status').optional().isIn(['new', 'acknowledged', 'in_progress', 'resolved', 'closed', 'pending', 'responded']),
        query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
        query('rating').optional().isInt({ min: 1, max: 5 }),
        query('category').optional().isIn(['bug', 'feature_request', 'complaint', 'appreciation', 'general', 'feature', 'positive', 'support']),
        query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'rating', 'priority']),
        query('sortOrder').optional().isIn(['asc', 'desc'])
    ],
    feedbackController.getFeedbacks
);

// TEST ROUTE - For debugging (remove this later)
router.get('/test-data', (req, res) => {
    console.log('🧪 Test data route called');
    
    const sampleData = [
        {
            _id: '1',
            title: "Login page loading too slow",
            description: "The login page is taking more than 10 seconds to load after recent update.",
            category: "bug",
            status: "pending",
            priority: "high",
            rating: 4.2,
            user: {
                name: "John Smith",
                email: "john.smith@example.com"
            },
            assignedTo: null,
            responses: [],
            createdAt: new Date('2024-01-15T10:30:00Z'),
            updatedAt: new Date('2024-01-15T10:30:00Z')
        },
        {
            _id: '2',
            title: "Great customer support experience",
            description: "I wanted to appreciate the quick response and helpful attitude of your support team.",
            category: "positive", 
            status: "resolved",
            priority: "low",
            rating: 5.0,
            user: {
                name: "Sarah Johnson",
                email: "sarah.j@example.com"
            },
            assignedTo: {
                name: "Mike Chen",
                email: "mike.chen@company.com"
            },
            responses: [
                {
                    message: "Thank you for your kind words! We're glad we could help.",
                    admin: {
                        name: "Mike Chen",
                        email: "mike.chen@company.com"
                    },
                    createdAt: new Date('2024-01-14T15:20:00Z')
                }
            ],
            createdAt: new Date('2024-01-14T14:45:00Z'),
            updatedAt: new Date('2024-01-14T15:20:00Z')
        },
        {
            _id: '3',
            title: "Feature request: Dark mode theme",
            description: "Please consider adding a dark mode theme option for better night usage.",
            category: "feature",
            status: "in-progress",
            priority: "medium",
            rating: 4.5,
            user: {
                name: "Alex Rodriguez",
                email: "alex.r@example.com"
            },
            assignedTo: {
                name: "Emily Parker", 
                email: "emily.p@company.com"
            },
            responses: [
                {
                    message: "Great suggestion! We've added this to our development roadmap.",
                    admin: {
                        name: "Emily Parker",
                        email: "emily.p@company.com"
                    },
                    createdAt: new Date('2024-01-13T11:15:00Z')
                }
            ],
            createdAt: new Date('2024-01-13T09:30:00Z'),
            updatedAt: new Date('2024-01-13T11:15:00Z')
        }
    ];
    
    res.json({
        success: true,
        data: sampleData,
        pagination: {
            page: 1,
            limit: 10,
            total: sampleData.length,
            pages: 1
        },
        message: 'Sample feedback data loaded successfully'
    });
});

// HEALTH CHECK ROUTE
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Feedback routes are healthy',
        timestamp: new Date().toISOString(),
        user: req.user ? req.user.email : 'unknown'
    });
});

// STATISTICS ROUTES
router.get('/stats/overview',
    [
        query('timeRange').optional().isIn(['7d', '30d', '90d', '1y'])
    ],
    feedbackController.getStats
);

// SINGLE FEEDBACK ROUTES
router.get('/:id',
    [
        param('id').isMongoId().withMessage('Valid feedback ID is required'),
        feedbackMiddleware.canAccessFeedback
    ],
    feedbackController.getFeedback
);

router.put('/:id/status',
    [
        param('id').isMongoId().withMessage('Valid feedback ID is required'),
        statusValidation,
        feedbackMiddleware.canModifyFeedback
    ],
    feedbackController.updateStatus
);

router.post('/:id/response',
    [
        param('id').isMongoId().withMessage('Valid feedback ID is required'),
        ...responseValidation,
        feedbackMiddleware.validateResponseAccess
    ],
    feedbackController.addResponse
);

router.post('/:id/assign',
    [
        param('id').isMongoId().withMessage('Valid feedback ID is required'),
        ...assignmentValidation,
        feedbackMiddleware.canAssignFeedback
    ],
    feedbackController.assignFeedback
);

// BULK OPERATIONS
router.put('/bulk-update',
    [
        body('feedbackIds')
            .isArray({ min: 1 })
            .withMessage('At least one feedback ID is required'),
        body('feedbackIds.*')
            .isMongoId()
            .withMessage('Each feedback ID must be valid'),
        body('updates')
            .isObject()
            .withMessage('Updates must be an object'),
        feedbackMiddleware.validateBulkOperations
    ],
    feedbackController.bulkUpdate
);

router.delete('/:id',
    [
        param('id').isMongoId().withMessage('Valid feedback ID is required'),
        feedbackMiddleware.canModifyFeedback
    ],
    feedbackController.deleteFeedback
);

// CATCH ALL ROUTE - For undefined routes
router.all('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Feedback route not found: ${req.method} ${req.originalUrl}`,
        availableRoutes: [
            'GET    /admin/feedback',
            'GET    /admin/feedback/test-data',
            'GET    /admin/feedback/health', 
            'GET    /admin/feedback/stats/overview',
            'GET    /admin/feedback/:id',
            'PUT    /admin/feedback/:id/status',
            'POST   /admin/feedback/:id/response',
            'POST   /admin/feedback/:id/assign',
            'PUT    /admin/feedback/bulk-update',
            'DELETE /admin/feedback/:id'
        ]
    });
});

module.exports = router;