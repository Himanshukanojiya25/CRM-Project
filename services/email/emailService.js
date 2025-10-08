const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const emailConfig = require('./emailConfig');
const User = require('../../models/User'); // ✅ User model import

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport(emailConfig);
        this.verifyConnection();
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Email server connected successfully');
        } catch (error) {
            console.error('❌ Email connection failed:', error);
        }
    }

    // ✅ 1. USER LEAVE APPLY - Admin ko email
    async sendLeaveApplicationToAdmin(leaveData) {
        try {
            // Saare admin users ke emails fetch karo
            const admins = await User.find({ role: 'admin' }).select('email name');
            const adminEmails = admins.map(admin => admin.email);

            if (adminEmails.length === 0) {
                console.log('⚠️ No admin users found for email notification');
                return;
            }

            const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; }
                    .email-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(45deg, #007bff, #0056b3); color: white; padding: 40px 30px; text-align: center; }
                    .content { padding: 40px 30px; color: #333; }
                    .details-card { background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #007bff; }
                    .btn { display: inline-block; background: linear-gradient(45deg, #28a745, #20c997); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; }
                    .footer { background: #343a40; color: white; padding: 20px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1>📋 New Leave Application</h1>
                        <p>CRM System - Action Required</p>
                    </div>
                    <div class="content">
                        <h2>Employee Leave Request</h2>
                        <p>A new leave application has been submitted and requires your approval.</p>
                        
                        <div class="details-card">
                            <h3>Application Details</h3>
                            <p><strong>Employee:</strong> ${leaveData.user.name}</p>
                            <p><strong>Email:</strong> ${leaveData.user.email}</p>
                            <p><strong>Leave Type:</strong> ${leaveData.leaveType}</p>
                            <p><strong>From:</strong> ${new Date(leaveData.startDate).toLocaleDateString()}</p>
                            <p><strong>To:</strong> ${new Date(leaveData.endDate).toLocaleDateString()}</p>
                            <p><strong>Reason:</strong> ${leaveData.reason}</p>
                            <p><strong>Applied On:</strong> ${new Date(leaveData.createdAt).toLocaleString()}</p>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:8080/admin/leaves" class="btn">Review Application</a>
                        </div>

                        <p style="text-align: center; color: #666;">
                            Please review this request within 24 hours.
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 Company CRM. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            `;

            const mailOptions = {
                from: {
                    name: 'CRM System',
                    address: process.env.EMAIL_USER
                },
                to: adminEmails,
                subject: `📋 New Leave Application - ${leaveData.user.name}`,
                html: emailHTML
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Leave application email sent to admins');
            return result;

        } catch (error) {
            console.error('❌ Error sending leave application email:', error);
            // Email fail hone par system na ruke
        }
    }

    // ✅ 2. LEAVE APPROVED - User ko email
    async sendLeaveApprovedEmail(leaveData) {
        try {
            const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; }
                    .email-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(45deg, #28a745, #20c997); color: white; padding: 40px 30px; text-align: center; }
                    .content { padding: 40px 30px; color: #333; }
                    .details-card { background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #28a745; }
                    .btn { display: inline-block; background: linear-gradient(45deg, #007bff, #0056b3); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; }
                    .footer { background: #343a40; color: white; padding: 20px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1>✅ Leave Approved!</h1>
                        <p>CRM System - Good News</p>
                    </div>
                    <div class="content">
                        <h2>Your Leave Request Has Been Approved</h2>
                        <p>Great news! Your leave request has been approved by the admin.</p>
                        
                        <div class="details-card">
                            <h3>Leave Details</h3>
                            <p><strong>Employee:</strong> ${leaveData.user.name}</p>
                            <p><strong>Leave Type:</strong> ${leaveData.leaveType}</p>
                            <p><strong>From:</strong> ${new Date(leaveData.startDate).toLocaleDateString()}</p>
                            <p><strong>To:</strong> ${new Date(leaveData.endDate).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">APPROVED</span></p>
                            <p><strong>Approved On:</strong> ${new Date(leaveData.approvedAt).toLocaleString()}</p>
                            ${leaveData.rejectionReason ? `<p><strong>Remarks:</strong> ${leaveData.rejectionReason}</p>` : ''}
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:8080/user/leaves" class="btn">View Leave Status</a>
                        </div>

                        <p style="text-align: center; color: #666;">
                            Enjoy your time off! 🌴
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 Company CRM. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            `;

            const mailOptions = {
                from: {
                    name: 'CRM System',
                    address: process.env.EMAIL_USER
                },
                to: leaveData.user.email,
                subject: `✅ Leave Approved - ${leaveData.leaveType} Leave`,
                html: emailHTML
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Leave approved email sent to:', leaveData.user.email);
            return result;

        } catch (error) {
            console.error('❌ Error sending leave approved email:', error);
        }
    }

    // ✅ 3. LEAVE REJECTED - User ko email
    async sendLeaveRejectedEmail(leaveData) {
        try {
            const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; }
                    .email-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(45deg, #dc3545, #c82333); color: white; padding: 40px 30px; text-align: center; }
                    .content { padding: 40px 30px; color: #333; }
                    .details-card { background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #dc3545; }
                    .btn { display: inline-block; background: linear-gradient(45deg, #6c757d, #495057); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; }
                    .footer { background: #343a40; color: white; padding: 20px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1>❌ Leave Rejected</h1>
                        <p>CRM System - Notification</p>
                    </div>
                    <div class="content">
                        <h2>Your Leave Request Has Been Rejected</h2>
                        <p>We regret to inform you that your leave request has been rejected.</p>
                        
                        <div class="details-card">
                            <h3>Leave Details</h3>
                            <p><strong>Employee:</strong> ${leaveData.user.name}</p>
                            <p><strong>Leave Type:</strong> ${leaveData.leaveType}</p>
                            <p><strong>From:</strong> ${new Date(leaveData.startDate).toLocaleDateString()}</p>
                            <p><strong>To:</strong> ${new Date(leaveData.endDate).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">REJECTED</span></p>
                            <p><strong>Rejected On:</strong> ${new Date(leaveData.approvedAt).toLocaleString()}</p>
                            <p><strong>Reason:</strong> ${leaveData.rejectionReason || 'No reason provided'}</p>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:8080/user/leaves" class="btn">View Leave Status</a>
                        </div>

                        <p style="text-align: center; color: #666;">
                            Please contact HR if you have any questions.
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 Company CRM. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            `;

            const mailOptions = {
                from: {
                    name: 'CRM System',
                    address: process.env.EMAIL_USER
                },
                to: leaveData.user.email,
                subject: `❌ Leave Rejected - ${leaveData.leaveType} Leave`,
                html: emailHTML
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Leave rejected email sent to:', leaveData.user.email);
            return result;

        } catch (error) {
            console.error('❌ Error sending leave rejected email:', error);
        }
    }

    // TEST EMAIL FUNCTION (Existing)
    async sendTestEmail(toEmail = 'himanshukanojiya27@gmail.com') {
        // ... (same test email code as before)
    }
}

module.exports = new EmailService();