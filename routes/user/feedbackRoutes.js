const express = require('express');
const router = express.Router();

const { isAuthenticated } = require('../../middlewares/authMiddleware');
const { submitFeedback, getMyFeedbacks } = require('../../controllers/user/feedbackController');

router.post('/submit', isAuthenticated, submitFeedback);
router.get('/my-feedbacks', isAuthenticated, getMyFeedbacks);

module.exports = router;
