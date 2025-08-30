// routes/user/leavesRoutes.js

const express = require('express');
const router = express.Router();
const { applyLeave, getMyLeaves, renderApplyPage } = require('../../controllers/user/leavesController');
const { isAuthenticated } = require('../../middlewares/authMiddleware');

// Route to render the leave application page
router.get('/apply', isAuthenticated, renderApplyPage);

// Route to handle the leave application form submission
router.post('/apply', isAuthenticated, applyLeave);

// Route to get the user's leave history
router.get('/', isAuthenticated, getMyLeaves);

module.exports = router;