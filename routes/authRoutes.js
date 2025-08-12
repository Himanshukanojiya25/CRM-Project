const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// GET Routes
router.get('/login', authController.getLogin);
router.get('/register', authController.getRegister);
router.get('/logout', authController.logout);

// POST Routes
router.post('/login', authController.login);
router.post('/register', authController.register);

module.exports = router;
