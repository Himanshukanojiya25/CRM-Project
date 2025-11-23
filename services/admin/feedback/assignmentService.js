const FeedbackAssignment = require('../../../models/feedback/FeedbackAssignment');
const Feedback = require('../../../models/feedback/Feedback');
const notificationService = require('./notificationService');

class AssignmentService {
    
    // Get all assignments with filtering
    async getAssignments({
        page = 1,
        limit = 10,
        status,
        assignedTo,
        dateFrom,
        dateTo
    }) {
        try {
            const filter = {};

            if (status) filter.status = status;
            if (assignedTo) filter.assignedTo = assignedTo;

            // Date range filter
            if (dateFrom || dateTo) {
                filter.createdAt = {};
                if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
                if (dateTo) filter.createdAt.$lte = new Date(dateTo);
            }

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: { createdAt: -1 },
                populate: [
                    { path: 'feedback', select: 'subject priority status' },
                    { path: 'assignedTo', select: 'name email avatar' },
                    { path: 'assignedBy', select: 'name email' }
                ],
                lean: true
            };

            const result = await FeedbackAssignment.paginate(filter, options);
            
            return {
                assignments: result.docs,
                pagination: {
                    currentPage: result.page,
                    totalPages: result.totalPages,
                    totalItems: result.totalDocs,
                    hasNext: result.hasNextPage,
                    hasPrev: result.hasPrevPage
                }
            };
        } catch (error) {
            throw new Error(`Failed to fetch assignments: ${error.message}`);
        }
    }

    // Create new assignment
    async createAssignment(assignmentData) {
        try {
            const assignment = new FeedbackAssignment(assignmentData);
            await assignment.save();

            // Update the main feedback assignment
            await Feedback.findByIdAndUpdate(assignmentData.feedback, {
                assignedTo: assignmentData.assignedTo,
                status: 'in_progress'
            });

            // Get feedback details for notification
            const feedback = await Feedback.findById(assignmentData.feedback)
                .populate('user', 'name email');

            // Send notification
            await notificationService.sendAssignmentNotification(assignment, feedback);

            return assignment;
        } catch (error) {
            throw new Error(`Failed to create assignment: ${error.message}`);
        }
    }

    // Update assignment
    async updateAssignment(assignmentId, updates) {
        try {
            const assignment = await FeedbackAssignment.findByIdAndUpdate(
                assignmentId,
                { ...updates, updatedAt: new Date() },
                { new: true, runValidators: true }
            ).populate('feedback');

            if (!assignment) {
                throw new Error('Assignment not found');
            }

            return assignment;
        } catch (error) {
            throw new Error(`Failed to update assignment: ${error.message}`);
        }
    }

    // Get assignments for specific user
    async getUserAssignments({
        userId,
        page = 1,
        limit = 10,
        status
    }) {
        try {
            const filter = { assignedTo: userId };
            if (status) filter.status = status;

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: { createdAt: -1 },
                populate: [
                    { path: 'feedback', select: 'subject priority status createdAt' },
                    { path: 'assignedBy', select: 'name email' }
                ],
                lean: true
            };

            const result = await FeedbackAssignment.paginate(filter, options);
            
            return {
                assignments: result.docs,
                pagination: {
                    currentPage: result.page,
                    totalPages: result.totalPages,
                    totalItems: result.totalDocs,
                    hasNext: result.hasNextPage,
                    hasPrev: result.hasPrevPage
                }
            };
        } catch (error) {
            throw new Error(`Failed to fetch user assignments: ${error.message}`);
        }
    }

    // Get team performance metrics
    async getTeamPerformance(timeRange = '30d') {
        try {
            const dateFilter = this.getDateFilter(timeRange);
            
            const performance = await FeedbackAssignment.aggregate([
                {
                    $match: {
                        ...dateFilter,
                        status: 'completed'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'assignedTo',
                        foreignField: '_id',
                        as: 'assignedUser'
                    }
                },
                { $unwind: '$assignedUser' },
                {
                    $group: {
                        _id: '$assignedTo',
                        adminName: { $first: '$assignedUser.name' },
                        adminEmail: { $first: '$assignedUser.email' },
                        totalCompleted: { $sum: 1 },
                        avgCompletionTime: { $avg: '$completionTime' }
                    }
                },
                {
                    $lookup: {
                        from: 'feedbackassignments',
                        localField: '_id',
                        foreignField: 'assignedTo',
                        as: 'allAssignments'
                    }
                },
                {
                    $project: {
                        adminName: 1,
                        adminEmail: 1,
                        totalCompleted: 1,
                        totalAssigned: { $size: '$allAssignments' },
                        completionRate: {
                            $round: [
                                { 
                                    $multiply: [
                                        { $divide: ['$totalCompleted', { $size: '$allAssignments' }] }, 
                                        100 
                                    ] 
                                }, 
                                2 
                            ]
                        },
                        avgCompletionTime: { $round: ['$avgCompletionTime', 2] }
                    }
                },
                { $sort: { completionRate: -1 } }
            ]);

            return performance;
        } catch (error) {
            throw new Error(`Failed to get team performance: ${error.message}`);
        }
    }

    // Helper method for date filtering
    getDateFilter(timeRange) {
        const now = new Date();
        const filter = { createdAt: {} };

        switch (timeRange) {
            case '7d':
                filter.createdAt.$gte = new Date(now.setDate(now.getDate() - 7));
                break;
            case '30d':
                filter.createdAt.$gte = new Date(now.setDate(now.getDate() - 30));
                break;
            case '90d':
                filter.createdAt.$gte = new Date(now.setDate(now.getDate() - 90));
                break;
            case '1y':
                filter.createdAt.$gte = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
        }

        filter.createdAt.$lte = new Date();
        return filter;
    }
}

module.exports = new AssignmentService();