const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../middlewares/authMiddleware');

router.use(authenticate);
router.use(authorize('admin'));

// Templates list
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Feedback Templates API Working', 
        data: {
            templates: [
                {
                    id: 1,
                    name: 'Bug Acknowledgment',
                    content: 'Thank you for reporting this issue...',
                    category: 'bug'
                }
            ]
        }
    });
});

module.exports = router;