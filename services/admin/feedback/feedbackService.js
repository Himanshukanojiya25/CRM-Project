const Feedback = require('../../../models/feedback/Feedback');
const FeedbackResponse = require('../../../models/feedback/FeedbackResponse');
const FeedbackAssignment = require('../../../models/feedback/FeedbackAssignment');
const { sendEmailNotification } = require('../../../utils/emailSender');
const { calculateSentiment } = require('../../../utils/feedback/feedbackAnalytics');

class FeedbackService {
    // Create new feedback
    async createFeedback(feedbackData) {
        try {
            // Calculate sentiment
            const sentiment = await calculateSentiment(feedbackData.message);
            
            const feedback = new Feedback({
                ...feedbackData,
                sentiment
            });

            await feedback.save();
            
            // Trigger notifications
            await this.triggerNotifications(feedback);
            
            return feedback;
        } catch (error) {
            throw new Error(`Failed to create feedback: ${error.message}`);
        }
    }

    // Get all feedback with advanced filtering
    async getFeedbacks({
        page = 1,
        limit = 10,
        status,
        priority,
        rating,
        category,
        assignedTo,
        dateFrom,
        dateTo,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    }) {
        try {
            const filter = {};

            // Build filter object
            if (status) filter.status = status;
            if (priority) filter.priority = priority;
            if (rating) filter.rating = rating;
            if (category) filter.category = category;
            if (assignedTo) filter.assignedTo = assignedTo;

            // Date range filter
            if (dateFrom || dateTo) {
                filter.createdAt = {};
                if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
                if (dateTo) filter.createdAt.$lte = new Date(dateTo);
            }

            // Search filter
            if (search) {
                filter.$or = [
                    { subject: { $regex: search, $options: 'i' } },
                    { message: { $regex: search, $options: 'i' } },
                    { 'user.name': { $regex: search, $options: 'i' } },
                    { 'user.email': { $regex: search, $options: 'i' } }
                ];
            }

            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort,
                populate: [
                    { path: 'user', select: 'name email avatar' },
                    { path: 'assignedTo', select: 'name email' },
                    { path: 'responses' }
                ],
                lean: true
            };

            const result = await Feedback.paginate(filter, options);
            
            return {
                feedbacks: result.docs,
                pagination: {
                    currentPage: result.page,
                    totalPages: result.totalPages,
                    totalItems: result.totalDocs,
                    hasNext: result.hasNextPage,
                    hasPrev: result.hasPrevPage
                }
            };
        } catch (error) {
            throw new Error(`Failed to fetch feedbacks: ${error.message}`);
        }
    }

    // Update feedback status
    async updateFeedbackStatus(feedbackId, status, adminId) {
        try {
            const feedback = await Feedback.findById(feedbackId);
            if (!feedback) {
                throw new Error('Feedback not found');
            }

            feedback.status = status;
            feedback.assignedTo = adminId; // Auto-assign when status changes

            if (status === 'resolved' || status === 'closed') {
                feedback.resolutionTime = this.calculateResolutionTime(feedback.createdAt);
            }

            await feedback.save();

            // Log status change
            await this.logStatusChange(feedbackId, status, adminId);

            return feedback;
        } catch (error) {
            throw new Error(`Failed to update status: ${error.message}`);
        }
    }

    // Add response to feedback
    async addResponse(feedbackId, responseData) {
        try {
            const feedback = await Feedback.findById(feedbackId);
            if (!feedback) {
                throw new Error('Feedback not found');
            }

            const response = new FeedbackResponse({
                feedback: feedbackId,
                ...responseData
            });

            await response.save();

            // Update feedback status if needed
            if (feedback.status === 'new') {
                feedback.status = 'in_progress';
                await feedback.save();
            }

            // Send email notification if applicable
            if (response.sentVia === 'email' || response.sentVia === 'both') {
                await this.sendResponseEmail(feedback, response);
            }

            return response;
        } catch (error) {
            throw new Error(`Failed to add response: ${error.message}`);
        }
    }

    // Assign feedback to team member
    async assignFeedback(feedbackId, assignmentData) {
        try {
            const assignment = new FeedbackAssignment({
                feedback: feedbackId,
                ...assignmentData
            });

            await assignment.save();

            // Update main feedback assignment
            await Feedback.findByIdAndUpdate(feedbackId, {
                assignedTo: assignmentData.assignedTo,
                status: 'in_progress'
            });

            // Send notification to assigned user
            await this.sendAssignmentNotification(assignment);

            return assignment;
        } catch (error) {
            throw new Error(`Failed to assign feedback: ${error.message}`);
        }
    }

    // Get feedback statistics
    async getFeedbackStats(timeRange = '30d') {
        try {
            const dateFilter = this.getDateFilter(timeRange);
            
            const stats = await Feedback.aggregate([
                { $match: { createdAt: dateFilter } },
                {
                    $facet: {
                        total: [{ $count: "count" }],
                        byStatus: [
                            { $group: { _id: "$status", count: { $sum: 1 } } }
                        ],
                        byPriority: [
                            { $group: { _id: "$priority", count: { $sum: 1 } } }
                        ],
                        byCategory: [
                            { $group: { _id: "$category", count: { $sum: 1 } } }
                        ],
                        byRating: [
                            { $group: { _id: "$rating", count: { $sum: 1 } } }
                        ],
                        sentiment: [
                            { $group: { 
                                _id: "$sentiment.label", 
                                count: { $sum: 1 },
                                avgScore: { $avg: "$sentiment.score" }
                            }}
                        ],
                        responseTime: [
                            { $group: {
                                _id: null,
                                avgResponseTime: { $avg: "$responseTime" },
                                avgResolutionTime: { $avg: "$resolutionTime" }
                            }}
                        ],
                        timeline: [
                            {
                                $group: {
                                    _id: {
                                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                                    },
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { _id: 1 } }
                        ]
                    }
                }
            ]);

            return this.formatStats(stats[0]);
        } catch (error) {
            throw new Error(`Failed to get stats: ${error.message}`);
        }
    }

    // Helper methods
    calculateResolutionTime(createdAt) {
        const now = new Date();
        return (now - new Date(createdAt)) / (1000 * 60 * 60); // hours
    }

    getDateFilter(timeRange) {
        const now = new Date();
        const filter = { $gte: new Date(now.setDate(now.getDate() - 30)) }; // Default 30 days
        
        switch (timeRange) {
            case '7d':
                filter.$gte = new Date(now.setDate(now.getDate() - 7));
                break;
            case '30d':
                filter.$gte = new Date(now.setDate(now.getDate() - 30));
                break;
            case '90d':
                filter.$gte = new Date(now.setDate(now.getDate() - 90));
                break;
            case '1y':
                filter.$gte = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
        }
        
        return filter;
    }

    formatStats(stats) {
        return {
            total: stats.total[0]?.count || 0,
            byStatus: stats.byStatus.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            byPriority: stats.byPriority.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            byCategory: stats.byCategory.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            byRating: stats.byRating.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            sentiment: stats.sentiment,
            responseMetrics: stats.responseTime[0] || {},
            timeline: stats.timeline
        };
    }

    async triggerNotifications(feedback) {
        // Implementation for email/slack notifications
        // This would integrate with your notification system
    }

    async sendResponseEmail(feedback, response) {
        // Implementation for sending email responses
    }

    async sendAssignmentNotification(assignment) {
        // Implementation for assignment notifications
    }

    async logStatusChange(feedbackId, status, adminId) {
        // Implementation for audit logging
    }
}

module.exports = new FeedbackService();