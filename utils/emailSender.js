const nodemailer = require('nodemailer');

// ✅ Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ✅ Verify email connection
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Email transporter failed:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

// ✅ Main email function
const sendEmail = async ({ to, subject, text, html, cc, bcc }) => {
    try {
        const mailOptions = {
            from: `"CRM System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
            cc,
            bcc
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}: ${result.messageId}`);
        return { 
            success: true, 
            messageId: result.messageId,
            response: result.response 
        };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
};

// ✅ Welcome email function
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

    return await sendEmail({
        to: employeeEmail,
        subject: `Welcome to CRM System, ${employeeName}!`,
        text,
        html
    });
};

// ========================
// ✅ FEEDBACK MODULE EMAIL TEMPLATES
// ========================

// ✅ Feedback Assignment Notification
const sendFeedbackAssignmentEmail = async (assignmentData) => {
    const { 
        assignedToEmail, 
        assignedToName, 
        assignedByName, 
        feedbackSubject, 
        feedbackPriority, 
        feedbackMessage,
        dueDate,
        feedbackLink 
    } = assignmentData;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background: #007bff; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .priority-high { border-left: 4px solid #dc3545; background: #f8d7da; padding: 10px; }
                .priority-medium { border-left: 4px solid #ffc107; background: #fff3cd; padding: 10px; }
                .priority-low { border-left: 4px solid #28a745; background: #d4edda; padding: 10px; }
                .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
                .button {
                    background: #007bff;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 5px;
                    display: inline-block;
                    margin: 15px 0;
                }
                .feedback-details { 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 5px; 
                    margin: 15px 0;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>📋 New Feedback Assignment</h2>
            </div>
            
            <div class="content">
                <p>Hello <strong>${assignedToName}</strong>,</p>
                
                <p>You have been assigned a new feedback by <strong>${assignedByName}</strong>.</p>
                
                <div class="feedback-details">
                    <h3>Feedback Details:</h3>
                    <p><strong>Subject:</strong> ${feedbackSubject}</p>
                    <p><strong>Priority:</strong> 
                        <span class="priority-${feedbackPriority}">
                            ${feedbackPriority.toUpperCase()}
                        </span>
                    </p>
                    <p><strong>Message Preview:</strong> ${feedbackMessage.substring(0, 200)}...</p>
                    ${dueDate ? `<p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
                </div>
                
                <p style="text-align: center;">
                    <a href="${feedbackLink}" class="button">View & Respond to Feedback</a>
                </p>
                
                <p><em>Please respond to this feedback within 24 hours.</em></p>
            </div>
            
            <div class="footer">
                <p>© 2024 CRM System - Feedback Management</p>
                <p>This is an automated notification, please do not reply.</p>
            </div>
        </body>
        </html>
    `;

    const text = `
        New Feedback Assignment
        
        Hello ${assignedToName},
        
        You have been assigned a new feedback by ${assignedByName}.
        
        Feedback Details:
        Subject: ${feedbackSubject}
        Priority: ${feedbackPriority}
        Message: ${feedbackMessage.substring(0, 150)}...
        ${dueDate ? `Due Date: ${new Date(dueDate).toLocaleDateString()}` : ''}
        
        Please respond within 24 hours.
        
        View Feedback: ${feedbackLink}
    `;

    return await sendEmail({
        to: assignedToEmail,
        subject: `📋 New Feedback Assigned: ${feedbackSubject}`,
        text,
        html
    });
};

// ✅ Feedback Response Notification to User
const sendFeedbackResponseEmail = async (responseData) => {
    const {
        userEmail,
        userName,
        adminName,
        feedbackSubject,
        responseMessage,
        feedbackLink
    } = responseData;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background: #28a745; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .response { 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 5px; 
                    border-left: 4px solid #28a745;
                    margin: 15px 0;
                }
                .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
                .button {
                    background: #28a745;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 5px;
                    display: inline-block;
                    margin: 15px 0;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>📨 Response to Your Feedback</h2>
            </div>
            
            <div class="content">
                <p>Dear <strong>${userName}</strong>,</p>
                
                <p>Thank you for your feedback. Here is a response from our team:</p>
                
                <div class="response">
                    <h3>Response from ${adminName}:</h3>
                    <p>${responseMessage}</p>
                </div>
                
                <p style="text-align: center;">
                    <a href="${feedbackLink}" class="button">View Full Conversation</a>
                </p>
                
                <p>If you have any further questions, please reply to this email.</p>
            </div>
            
            <div class="footer">
                <p>© 2024 CRM System - Customer Support</p>
                <p>This is an automated response, but you can reply to this email.</p>
            </div>
        </body>
        </html>
    `;

    const text = `
        Response to Your Feedback
        
        Dear ${userName},
        
        Thank you for your feedback. Here is a response from our team:
        
        Response from ${adminName}:
        ${responseMessage}
        
        View Full Conversation: ${feedbackLink}
        
        If you have further questions, please reply to this email.
    `;

    return await sendEmail({
        to: userEmail,
        subject: `📨 Response to your feedback: ${feedbackSubject}`,
        text,
        html
    });
};

// ✅ SLA Breach Notification to Admins
const sendSLABreachEmail = async (breachData) => {
    const {
        adminEmail,
        adminName,
        feedbackId,
        feedbackSubject,
        userName,
        hoursOpen,
        feedbackLink
    } = breachData;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .alert { 
                    background: #f8d7da; 
                    padding: 15px; 
                    border-radius: 5px; 
                    border-left: 4px solid #dc3545;
                    margin: 15px 0;
                }
                .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
                .button {
                    background: #dc3545;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 5px;
                    display: inline-block;
                    margin: 15px 0;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>🚨 SLA Breach Alert</h2>
            </div>
            
            <div class="content">
                <p>Hello <strong>${adminName}</strong>,</p>
                
                <div class="alert">
                    <h3>⚠️ SLA Breach Detected</h3>
                    <p><strong>Feedback ID:</strong> ${feedbackId}</p>
                    <p><strong>Subject:</strong> ${feedbackSubject}</p>
                    <p><strong>From User:</strong> ${userName}</p>
                    <p><strong>Time Open:</strong> ${hoursOpen} hours</p>
                    <p><strong>Status:</strong> Exceeded 24-hour response SLA</p>
                </div>
                
                <p style="text-align: center;">
                    <a href="${feedbackLink}" class="button">Take Action Now</a>
                </p>
                
                <p><em>Please address this feedback immediately to maintain service quality.</em></p>
            </div>
            
            <div class="footer">
                <p>© 2024 CRM System - SLA Monitoring</p>
                <p>This is an automated alert, please do not reply.</p>
            </div>
        </body>
        </html>
    `;

    const text = `
        🚨 SLA Breach Alert
        
        Hello ${adminName},
        
        SLA BREACH DETECTED:
        Feedback ID: ${feedbackId}
        Subject: ${feedbackSubject}
        From User: ${userName}
        Time Open: ${hoursOpen} hours
        Status: Exceeded 24-hour response SLA
        
        Please address this feedback immediately.
        
        Take Action: ${feedbackLink}
    `;

    return await sendEmail({
        to: adminEmail,
        subject: `🚨 SLA Breach - Feedback #${feedbackId}`,
        text,
        html
    });
};

// ✅ Export all functions
module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendFeedbackAssignmentEmail,
    sendFeedbackResponseEmail,
    sendSLABreachEmail
};