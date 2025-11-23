const { sendEmail } = require('../../../utils/emailSender');
const User = require('../../../models/User');

class NotificationService {
    
    // Send feedback assignment notification
    async sendAssignmentNotification(assignment, feedback) {
        try {
            const assignedUser = await User.findById(assignment.assignedTo);
            const assignedBy = await User.findById(assignment.assignedBy);
            
            if (!assignedUser || !assignedUser.email) {
                console.log('Assigned user not found or no email');
                return;
            }

            const emailData = {
                to: assignedUser.email,
                subject: `New Feedback Assigned - ${feedback.subject}`,
                template: 'feedback-assigned',
                context: {
                    userName: assignedUser.name,
                    assignedByName: assignedBy.name,
                    feedbackSubject: feedback.subject,
                    feedbackPriority: feedback.priority,
                    feedbackMessage: feedback.message.substring(0, 200) + '...',
                    dueDate: assignment.dueDate ? assignment.dueDate.toDateString() : 'Not specified',
                    feedbackLink: `${process.env.APP_URL}/admin/feedback/${feedback._id}`
                }
            };

            await sendEmail(emailData);
            
            // Also send internal notification (you can integrate with socket.io for real-time)
            await this.sendInternalNotification(assignedUser._id, {
                type: 'feedback_assigned',
                title: 'New Feedback Assigned',
                message: `You have been assigned to handle: ${feedback.subject}`,
                link: `/admin/feedback/${feedback._id}`,
                priority: feedback.priority
            });

            return true;
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
                return;
            }

            const emailData = {
                to: user.email,
                subject: `Response to your feedback: ${feedback.subject}`,
                template: 'feedback-response',
                context: {
                    userName: user.name,
                    adminName: admin.name,
                    feedbackSubject: feedback.subject,
                    responseMessage: response.message,
                    responseDate: new Date().toLocaleDateString(),
                    feedbackLink: `${process.env.APP_URL}/feedback/${feedback._id}`
                }
            };

            await sendEmail(emailData);
            return true;
        } catch (error) {
            console.error('Response notification failed:', error);
            return false;
        }
    }

    // Send SLA breach notification
    async sendSLABreachNotification(feedback) {
        try {
            const admins = await User.find({ role: 'admin', isActive: true });
            
            const notificationPromises = admins.map(admin => {
                const emailData = {
                    to: admin.email,
                    subject: `🚨 SLA Breach - Feedback #${feedback._id}`,
                    template: 'sla-breach',
                    context: {
                        adminName: admin.name,
                        feedbackId: feedback._id,
                        feedbackSubject: feedback.subject,
                        userName: feedback.user.name,
                        hoursOpen: Math.round((new Date() - new Date(feedback.createdAt)) / (1000 * 60 * 60)),
                        feedbackLink: `${process.env.APP_URL}/admin/feedback/${feedback._id}`
                    }
                };
                return sendEmail(emailData);
            });

            await Promise.all(notificationPromises);
            return true;
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
            
            const Feedback = require('../models/feedback/Feedback');
            
            const summary = await Feedback.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(yesterday.setHours(0, 0, 0, 0)),
                            $lt: new Date(yesterday.setHours(23, 59, 59, 999))
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
                        ]
                    }
                }
            ]);

            const admins = await User.find({ role: 'admin', isActive: true });
            
            const emailPromises = admins.map(admin => {
                const emailData = {
                    to: admin.email,
                    subject: `📊 Daily Feedback Summary - ${new Date().toDateString()}`,
                    template: 'daily-summary',
                    context: {
                        adminName: admin.name,
                        date: new Date().toDateString(),
                        totalFeedback: summary[0]?.total[0]?.count || 0,
                        unresolved: summary[0]?.unresolved[0]?.count || 0,
                        byStatus: summary[0]?.byStatus || [],
                        byPriority: summary[0]?.byPriority || []
                    }
                };
                return sendEmail(emailData);
            });

            await Promise.all(emailPromises);
            return true;
        } catch (error) {
            console.error('Daily summary notification failed:', error);
            return false;
        }
    }

    // Internal notification system (for real-time updates)
    async sendInternalNotification(userId, notification) {
        try {
            // This would integrate with your real-time notification system
            // For example, using Socket.io, database notifications, etc.
            
            const Notification = require('../models/Notification'); // If you have a notification model
            
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

            // Emit socket event if user is online
            if (global.io) {
                global.io.to(`user_${userId}`).emit('new_notification', newNotification);
            }

            return true;
        } catch (error) {
            console.error('Internal notification failed:', error);
            return false;
        }
    }

    // Escalation notification for high-priority feedback
    async sendEscalationNotification(feedback, escalationLevel) {
        try {
            const supervisors = await User.find({ 
                role: { $in: ['admin', 'supervisor'] }, 
                isActive: true 
            });

            const emailPromises = supervisors.map(supervisor => {
                const emailData = {
                    to: supervisor.email,
                    subject: `⚠️ Escalation Level ${escalationLevel} - ${feedback.subject}`,
                    template: 'escalation-notification',
                    context: {
                        supervisorName: supervisor.name,
                        escalationLevel: escalationLevel,
                        feedbackId: feedback._id,
                        feedbackSubject: feedback.subject,
                        assignedTo: feedback.assignedTo?.name || 'Unassigned',
                        hoursOpen: Math.round((new Date() - new Date(feedback.createdAt)) / (1000 * 60 * 60)),
                        feedbackLink: `${process.env.APP_URL}/admin/feedback/${feedback._id}`
                    }
                };
                return sendEmail(emailData);
            });

            await Promise.all(emailPromises);
            return true;
        } catch (error) {
            console.error('Escalation notification failed:', error);
            return false;
        }
    }
}

module.exports = new NotificationService();