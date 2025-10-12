const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ✅ ADDED: sendEmail function
const sendEmail = async (emailOptions) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailOptions.to,
      subject: emailOptions.subject,
      text: emailOptions.text,
      html: emailOptions.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};

// ✅ FIXED: Export both transporter and sendEmail
module.exports = {
  transporter,
  sendEmail
};