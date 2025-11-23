const feedbackService = require('../../../services/admin/feedback/feedbackService');
const Feedback = require('../../../models/feedback/Feedback');
const asyncHandler = require('express-async-handler');

class FeedbackAnalyticsController {
    
    // @desc    Get comprehensive analytics
    // @route   GET /admin/feedback/analytics/dashboard
    // @access  Private/Admin
    getDashboardAnalytics = asyncHandler(async (req, res) => {
        try {
            const { timeRange = '30d' } = req.query;

            const [
                basicStats,
                trendData,
                teamPerformance,
                categoryAnalysis,
                sentimentTrends
            ] = await Promise.all([
                feedbackService.getFeedbackStats(timeRange),
                this.getTrendAnalysis(timeRange),
                this.getTeamPerformance(timeRange),
                this.getCategoryAnalysis(timeRange),
                this.getSentimentTrends(timeRange)
            ]);

            res.json({
                success: true,
                data: {
                    overview: basicStats,
                    trends: trendData,
                    teamPerformance,
                    categoryAnalysis,
                    sentimentTrends
                },
                message: 'Analytics data fetched successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Get trend analysis
    // @route   GET /admin/feedback/analytics/trends
    // @access  Private/Admin
    getTrendAnalysis = asyncHandler(async (timeRange) => {
        const dateFormat = this.getDateFormat(timeRange);
        
        const trends = await Feedback.aggregate([
            {
                $match: this.getTimeFilter(timeRange)
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: dateFormat, date: "$createdAt" } },
                        status: "$status"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.date",
                    statuses: {
                        $push: {
                            status: "$_id.status",
                            count: "$count"
                        }
                    },
                    total: { $sum: "$count" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return trends;
    });

    // @desc    Get team performance metrics
    // @route   GET /admin/feedback/analytics/team-performance
    // @access  Private/Admin
    getTeamPerformance = asyncHandler(async (timeRange) => {
        const performance = await Feedback.aggregate([
            {
                $match: {
                    ...this.getTimeFilter(timeRange),
                    assignedTo: { $exists: true, $ne: null }
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
                    totalAssigned: { $sum: 1 },
                    resolved: {
                        $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] }
                    },
                    avgResolutionTime: { $avg: '$resolutionTime' },
                    avgResponseTime: { $avg: '$responseTime' },
                    avgSatisfaction: { $avg: '$satisfactionScore' }
                }
            },
            {
                $project: {
                    adminName: 1,
                    adminEmail: 1,
                    totalAssigned: 1,
                    resolved: 1,
                    resolutionRate: {
                        $round: [
                            { $multiply: [{ $divide: ['$resolved', '$totalAssigned'] }, 100] },
                            2
                        ]
                    },
                    avgResolutionTime: { $round: ['$avgResolutionTime', 2] },
                    avgResponseTime: { $round: ['$avgResponseTime', 2] },
                    avgSatisfaction: { $round: ['$avgSatisfaction', 2] }
                }
            },
            { $sort: { resolutionRate: -1 } }
        ]);

        return performance;
    });

    // @desc    Export analytics data
    // @route   GET /admin/feedback/analytics/export
    // @access  Private/Admin
    exportAnalytics = asyncHandler(async (req, res) => {
        try {
            const { format = 'json', timeRange = '30d' } = req.query;
            
            const analytics = await this.getDashboardAnalytics(timeRange);

            if (format === 'csv') {
                // Implement CSV export logic
                const csvData = this.convertToCSV(analytics);
                
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=feedback-analytics.csv');
                return res.send(csvData);
            }

            if (format === 'excel') {
                // Implement Excel export logic
                const excelBuffer = await this.convertToExcel(analytics);
                
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=feedback-analytics.xlsx');
                return res.send(excelBuffer);
            }

            // Default JSON response
            res.json({
                success: true,
                data: analytics,
                message: 'Analytics data exported successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // Helper methods
    getTimeFilter(timeRange) {
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
            default:
                filter.createdAt.$gte = new Date(now.setDate(now.getDate() - 30));
        }

        filter.createdAt.$lte = new Date();
        return filter;
    }

    getDateFormat(timeRange) {
        switch (timeRange) {
            case '7d': return '%Y-%m-%d';
            case '30d': return '%Y-%m-%d';
            case '90d': return '%Y-%m-%U'; // Weekly
            case '1y': return '%Y-%m'; // Monthly
            default: return '%Y-%m-%d';
        }
    }

    async getCategoryAnalysis(timeRange) {
        return await Feedback.aggregate([
            { $match: this.getTimeFilter(timeRange) },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    avgRating: { $avg: '$rating' },
                    avgResolutionTime: { $avg: '$resolutionTime' }
                }
            },
            {
                $project: {
                    category: '$_id',
                    count: 1,
                    avgRating: { $round: ['$avgRating', 2] },
                    avgResolutionTime: { $round: ['$avgResolutionTime', 2] },
                    percentage: {
                        $round: [
                            {
                                $multiply: [
                                    { $divide: ['$count', { $size: '$count' }] },
                                    100
                                ]
                            },
                            2
                        ]
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);
    }

    async getSentimentTrends(timeRange) {
        return await Feedback.aggregate([
            { $match: this.getTimeFilter(timeRange) },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: this.getDateFormat(timeRange), date: "$createdAt" } },
                        sentiment: "$sentiment.label"
                    },
                    count: { $sum: 1 },
                    avgScore: { $avg: "$sentiment.score" }
                }
            },
            {
                $group: {
                    _id: "$_id.date",
                    sentiments: {
                        $push: {
                            sentiment: "$_id.sentiment",
                            count: "$count",
                            avgScore: { $round: ["$avgScore", 2] }
                        }
                    },
                    total: { $sum: "$count" }
                }
            },
            { $sort: { _id: 1 } }
        ]);
    }

    convertToCSV(data) {
        // Implementation for CSV conversion
        return "CSV data implementation";
    }

    async convertToExcel(data) {
        // Implementation for Excel conversion
        return Buffer.from("Excel data implementation");
    }
}

module.exports = new FeedbackAnalyticsController();