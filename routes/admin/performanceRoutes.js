// routes/admin/performanceRoutes.js
const express = require('express');
const router = express.Router();

// ✅ Add basic route to make it work
router.get('/', (req, res) => {
    res.json({ message: 'Performance routes working' });
});

module.exports = router; // ✅ Yeh line must hai