const express = require('express');
const router = express.Router();

const { isAuthenticated, roleMiddleware } = require('../../middlewares/authMiddleware');
const { getAllFeedbacks, deleteFeedback } = require('../../controllers/admin/feedbackController');

router.get('/', isAuthenticated, roleMiddleware(['admin']), getAllFeedbacks);
router.delete('/:id', isAuthenticated, roleMiddleware(['admin']), deleteFeedback);

module.exports = router;
