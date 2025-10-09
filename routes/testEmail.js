const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// ✅ Test Email Route
router.get('/test-email', async (req, res) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).send('Email configuration missing. Check .env file.');
    }

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.verify();
    console.log('✅ Email server connection verified');

    let info = await transporter.sendMail({
      from: `"CRM Team" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'Test Email from CRM - Server Check',
      text: 'Yeah! Mail aa gaya! Kaam kar raha hai! 🚀\n\nThis is a test email from your CRM server.',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
            .content { padding: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CRM System Test Email</h1>
              <p>Yeah! Mail aa gaya! Kaam kar raha hai! 🚀</p>
            </div>
            <div class="content">
              <p>This is a test email from your CRM server to verify email configuration.</p>
              <div style="text-align: center; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <strong>Server Time:</strong> ${new Date().toISOString()}<br>
                <strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}
              </div>
            </div>
            <div class="footer">
              <p>© 2025 CRM System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('✅ Test email sent successfully. Message ID:', info.messageId);
    res.send('Email sent successfully! Check your inbox.');
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    res.status(500).send('Email test failed: ' + error.message);
  }
});

module.exports = router;