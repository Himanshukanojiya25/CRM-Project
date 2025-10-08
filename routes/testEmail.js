const express = require('express');
const router = express.Router();
const emailService = require('../services/email/emailService');

// TEST EMAIL ROUTE - UPDATED
router.get('/send-test-email', async (req, res) => {
    try {
        console.log('🌐 Test email endpoint called');
        
        const testEmail = 'himanshukanojiya27@gmail.com';
        const result = await emailService.sendTestEmail(testEmail);
        
        res.json({
            success: true,
            message: '✅ Test email sent successfully!',
            data: {
                to: testEmail,
                messageId: result.messageId,
                timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
            },
            nextSteps: 'Now integrate with your leave controllers!'
        });
        
    } catch (error) {
        console.error('❌ Route error:', error);
        res.status(500).json({
            success: false,
            message: '❌ Failed to send test email',
            error: error.message,
            solution: 'Check your Gmail App Password and internet connection'
        });
    }
});

module.exports = router;