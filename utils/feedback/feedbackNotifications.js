const { 
    sendFeedbackAssignmentEmail, 
    sendFeedbackResponseEmail, 
    sendSLABreachEmail 
} = require('../emailSender');
const User = require('../../models/User');
const Feedback = require('../../models/feedback/Feedback');

class FeedbackNotifications {
    
    // Send feedback assignment notification
    async sendAssignmentNotification(assignment, feedback) {
        try {
            const assignedToUser = await User.findById(assignment.assignedTo);
            const assignedByUser = await User.findById(assignment.assignedBy);

            if (!assignedToUser || !assignedToUser.email) {
                console.log('Assigned user not found or no email');
                return false;
            }

            const notificationData = {
                assignedToEmail: assignedToUser.email,
                assignedToName: assignedToUser.name,
                assignedByName: assignedByUser.name,
                feedbackSubject: feedback.subject,
                feedbackPriority: feedback.priority,
                feedbackMessage: feedback.message.substring(0, 200) + '...',
                dueDate: assignment.dueDate,
                feedbackLink: `${process.env.APP_URL}/admin/feedback/${feedback._id}`
            };

            const result = await sendFeedbackAssignmentEmail(notificationData);

            // Also send internal notification
            await this.sendInternalNotification(assignedToUser._id, {
                type: 'feedback_assigned',
                title: 'New Feedback Assigned',
                message: `You have been assigned to handle: ${feedback.subject}`,
                link: `/admin/feedback/${feedback._id}`,
                priority: feedback.priority
            });

            return result.success;
        } catch (error) {
            console.error('Assignment notification failed:', error);
            return false;
        }
    }

    // Send response notification to user
    async sendResponseNotification(feedback, response, admin) {
        try {
            const user = await User.findById(feedback.user);
            
            if (!user || !user.email) {
                console.log('User not found or no email');
                return false;
            }

            const notificationData = {
                userEmail: user.email,
                userName: user.name,
                adminName: admin.name,
                feedbackSubject: feedback.subject,
                responseMessage: response.message,
                feedbackLink: `${process.env.APP_URL}/feedback/${feedback._id}`
            };

            const result = await sendFeedbackResponseEmail(notificationData);
            return result.success;
        } catch (error) {
            console.error('Response notification failed:', error);
            return false;
        }
    }

    // Send SLA breach notification
    async sendSLABreachNotification(feedback) {
        try {
            const admins = await User.find({ 
                role: 'admin', 
                isActive: true,
                email: { $exists: true, $ne: null }
            });

            const user = await User.findById(feedback.user);
            const hoursOpen = Math.round((new Date() - new Date(feedback.createdAt)) / (1000 * 60 * 60));

            const notificationPromises = admins.map(admin => {
                const notificationData = {
                    adminEmail: admin.email,
                    adminName: admin.name,
                    feedbackId: feedback._id,
                    feedbackSubject: feedback.subject,
                    userName: user?.name || 'Customer',
                    hoursOpen: hoursOpen,
                    feedbackLink: `${process.env.APP_URL}/admin/feedback/${feedback._id}`
                };

                return sendSLABreachEmail(notificationData);
            });

            const results = await Promise.allSettled(notificationPromises);
            
            // Log results
            const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
            console.log(`SLA breach notifications sent: ${successful}/${admins.length}`);

            return successful > 0;
        } catch (error) {
            console.error('SLA breach notification failed:', error);
            return false;
        }
    }

    // Send daily summary to admin team
    async sendDailySummary() {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
            const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));

            const summary = await Feedback.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: startOfDay,
                            $lt: endOfDay
                        }
                    }
                },
                {
                    $facet: {
                        total: [{ $count: "count" }],
                        byStatus: [
                            { $group: { _id: "$status", count: { $sum: 1 } } }
                        ],
                        byPriority: [
                            { $group: { _id: "$priority", count: { $sum: 1 } } }
                        ],
                        unresolved: [
                            { $match: { status: { $in: ['new', 'in_progress'] } } },
                            { $count: "count" }
                        ],
                        slaBreaches: [
                            { $match: { slaBreached: true } },
                            { $count: "count" }
                        ]
                    }
                }
            ]);

            const admins = await User.find({ 
                role: 'admin', 
                isActive: true,
                email: { $exists: true, $ne: null }
            });

            const emailPromises = admins.map(admin => {
                return this.sendDailySummaryEmail(admin, summary[0], yesterday);
            });

            await Promise.allSettled(emailPromises);
            return true;
        } catch (error) {
            console.error('Daily summary notification failed:', error);
            return false;
        }
    }

    // Send escalation notification
    async sendEscalationNotification(feedback, escalationLevel) {
        try {
            const supervisors = await User.find({ 
                role: { $in: ['admin', 'supervisor'] }, 
                isActive: true 
            });

            const user = await User.findById(feedback.user);
            const assignedTo = await User.findById(feedback.assignedTo);
            const hoursOpen = Math.round((new Date() - new Date(feedback.createdAt)) / (1000 * 60 * 60));

            const emailPromises = supervisors.map(supervisor => {
                const emailData = {
                    to: supervisor.email,
                    subject: `⚠️ Escalation Level ${escalationLevel} - ${feedback.subject}`,
                    html: this.generateEscalationEmail(supervisor, feedback, escalationLevel, assignedTo, user, hoursOpen)
                };

                // Using main sendEmail function
                const { sendEmail } = require('../emailSender');
                return sendEmail(emailData);
            });

            await Promise.allSettled(emailPromises);
            return true;
        } catch (error) {
            console.error('Escalation notification failed:', error);
            return false;
        }
    }

    // Internal notification system
    async sendInternalNotification(userId, notification) {
        try {
            // This would integrate with your real-time notification system
            // For example, using Socket.io, database notifications, etc.
            
            // Simulate saving to database
            const Notification = require('../../models/Notification'); // If you have this model
            
            if (Notification) {
                const newNotification = new Notification({
                    user: userId,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    link: notification.link,
                    priority: notification.priority,
                    isRead: false
                });

                await newNotification.save();
            }

            // Emit socket event if user is online
            if (global.io) {
                global.io.to(`user_${userId}`).emit('new_notification', notification);
            }

            console.log(`Internal notification sent to user ${userId}: ${notification.title}`);
            return true;
        } catch (error) {
            console.error('Internal notification failed:', error);
            return false;
        }
    }

    // Monitor and send SLA breach alerts
    async monitorSLA() {
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            const overdueFeedbacks = await Feedback.find({
                status: { $in: ['new', 'acknowledged', 'in_progress'] },
                createdAt: { $lte: twentyFourHoursAgo },
                slaBreached: false
            }).populate('user', 'name email');

            let breachCount = 0;

            for (const feedback of overdueFeedbacks) {
                // Mark as SLA breached
                feedback.slaBreached = true;
                await feedback.save();

                // Send notification
                await this.sendSLABreachNotification(feedback);
                breachCount++;
            }

            console.log(`SLA monitoring: ${breachCount} breaches detected and notified`);
            return breachCount;
        } catch (error) {
            console.error('SLA monitoring failed:', error);
            return 0;
        }
    }

    // Helper methods
    async sendDailySummaryEmail(admin, summary, date) {
        const { sendEmail } = require('../emailSender');
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background: #007bff; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .stats { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
                    .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>📊 Daily Feedback Summary</h2>
                </div>
                
                <div class="content">
                    <p>Hello <strong>${admin.name}</strong>,</p>
                    
                    <div class="stats">
                        <h3>Summary for ${date.toDateString()}:</h3>
                        <p><strong>Total Feedbacks:</strong> ${summary.total[0]?.count || 0}</p>
                        <p><strong>Unresolved:</strong> ${summary.unresolved[0]?.count || 0}</p>
                        <p><strong>SLA Breaches:</strong> ${summary.slaBreaches[0]?.count || 0}</p>
                    </div>
                    
                    <p>Login to CRM to view details: <a href="${process.env.APP_URL}/admin/feedback">View Feedbacks</a></p>
                </div>
                
                <div class="footer">
                    <p>© 2024 CRM System - Automated Daily Report</p>
                </div>
            </body>
            </html>
        `;

        const text = `
            Daily Feedback Summary - ${date.toDateString()}
            
            Hello ${admin.name},
            
            Summary:
            - Total Feedbacks: ${summary.total[0]?.count || 0}
            - Unresolved: ${summary.unresolved[0]?.count || 0}
            - SLA Breaches: ${summary.slaBreaches[0]?.count || 0}
            
            Login to CRM to view details: ${process.env.APP_URL}/admin/feedback
        `;

        return await sendEmail({
            to: admin.email,
            subject: `📊 Daily Feedback Summary - ${date.toDateString()}`,
            text,
            html
        });
    }

    generateEscalationEmail(supervisor, feedback, level, assignedTo, user, hoursOpen) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background: #ffc107; color: #333; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .alert { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
                    .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>⚠️ Feedback Escalation - Level ${level}</h2>
                </div>
                
                <div class="content">
                    <p>Hello <strong>${supervisor.name}</strong>,</p>
                    
                    <div class="alert">
                        <h3>Feedback Requires Attention</h3>
                        <p><strong>Subject:</strong> ${feedback.subject}</p>
                        <p><strong>From:</strong> ${user?.name || 'Customer'}</p>
                        <p><strong>Assigned To:</strong> ${assignedTo?.name || 'Unassigned'}</p>
                        <p><strong>Time Open:</strong> ${hoursOpen} hours</p>
                        <p><strong>Escalation Level:</strong> ${level}</p>
                    </div>
                    
                    <p>Please review and take appropriate action.</p>
                    <p><a href="${process.env.APP_URL}/admin/feedback/${feedback._id}">View Feedback Details</a></p>
                </div>
                
                <div class="footer">
                    <p>© 2024 CRM System - Escalation Notification</p>
                </div>
            </body>
            </html>
        `;
    }
}

module.exports = new FeedbackNotifications();