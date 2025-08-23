const nodemailer = require('nodemailer');

// ✅ Main email function
const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"CRM Notification" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  };

  await transporter.sendMail(mailOptions);
};

// ✅ Welcome email function (NEW ADDITION)
const sendWelcomeEmail = async (employeeEmail, employeeName, temporaryPassword) => {
  const loginLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/login`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .credentials { 
                background: #f8f9fa; 
                padding: 15px; 
                border-radius: 5px; 
                border-left: 4px solid #007bff;
                margin: 15px 0;
            }
            .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
            .button {
                background: #007bff;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
                margin: 10px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>Welcome to Our CRM System!</h2>
        </div>
        
        <div class="content">
            <p>Dear <strong>${employeeName}</strong>,</p>
            
            <p>Your employee account has been successfully created in our CRM System.</p>
            
            <div class="credentials">
                <h3>Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${employeeEmail}</p>
                <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
                <p><strong>Login URL:</strong> <a href="${loginLink}">${loginLink}</a></p>
            </div>
            
            <p>For security reasons, please change your password after first login.</p>
            
            <a href="${loginLink}" class="button">Login to CRM</a>
        </div>
        
        <div class="footer">
            <p>© 2024 Company CRM System. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
        </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Our CRM System!
    
    Dear ${employeeName},
    
    Your employee account has been created.
    
    Login Details:
    Email: ${employeeEmail}
    Temporary Password: ${temporaryPassword}
    Login URL: ${loginLink}
    
    Please change your password after first login.
  `;

  await sendEmail({
    to: employeeEmail,
    subject: `Welcome to CRM System, ${employeeName}!`,
    text,
    html
  });
};

// ✅ Export both functions
module.exports = {
  sendEmail,
  sendWelcomeEmail
};