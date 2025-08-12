// routes/user/leavesRoutes.js

const express = require('express');
const router = express.Router();
const { applyLeave, getMyLeaves } = require('../../controllers/user/leavesController');
const { isAuthenticated } = require('../../middlewares/authMiddleware');

router.post('/apply', isAuthenticated, applyLeave);
router.get('/my-leaves', isAuthenticated, getMyLeaves);

module.exports = router;
