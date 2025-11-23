const Feedback = require('../../../models/feedback/Feedback');
const FeedbackAnalytics = require('../../../models/feedback/FeedbackAnalytics');
const FeedbackAssignment = require('../../../models/feedback/FeedbackAssignment');

class AnalyticsService {
    
    // Generate comprehensive analytics
    async generateAnalytics(timeRange = '30d') {
        try {
            const dateFilter = this.getDateFilter(timeRange);
            
            const [
                basicStats,
                trendData,
                categoryAnalysis,
                sentimentTrends,
                teamPerformance
            ] = await Promise.all([
                this.getBasicStats(dateFilter),
                this.getTrendAnalysis(dateFilter, timeRange),
                this.getCategoryAnalysis(dateFilter),
                this.getSentimentTrends(dateFilter, timeRange),
                this.getTeamPerformance(dateFilter)
            ]);

            // Save analytics data
            await this.saveAnalyticsData({
                date: new Date(),
                timeRange,
                ...basicStats,
                trendData,
                categoryAnalysis,
                sentimentTrends,
                teamPerformance
            });

            return {
                overview: basicStats,
                trends: trendData,
                categories: categoryAnalysis,
                sentiments: sentimentTrends,
                team: teamPerformance
            };
        } catch (error) {
            throw new Error(`Failed to generate analytics: ${error.message}`);
        }
    }

    // Get basic statistics
    async getBasicStats(dateFilter) {
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
                    byRating: [
                        { $group: { _id: "$rating", count: { $sum: 1 } } }
                    ],
                    avgMetrics: [
                        { 
                            $group: { 
                                _id: null,
                                avgRating: { $avg: "$rating" },
                                avgResponseTime: { $avg: "$responseTime" },
                                avgResolutionTime: { $avg: "$resolutionTime" }
                            }
                        }
                    ],
                    slaBreaches: [
                        { $match: { slaBreached: true } },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        return this.formatBasicStats(stats[0]);
    }

    // Get trend analysis
    async getTrendAnalysis(dateFilter, timeRange) {
        const groupFormat = this.getGroupFormat(timeRange);
        
        const trends = await Feedback.aggregate([
            { $match: { createdAt: dateFilter } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: groupFormat, date: "$createdAt" } },
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
    }

    // Get category analysis
    async getCategoryAnalysis(dateFilter) {
        return await Feedback.aggregate([
            { $match: { createdAt: dateFilter } },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                    avgRating: { $avg: "$rating" },
                    avgResolutionTime: { $avg: "$resolutionTime" },
                    satisfactionScore: { $avg: "$satisfactionScore" }
                }
            },
            {
                $project: {
                    category: "$_id",
                    count: 1,
                    avgRating: { $round: ["$avgRating", 2] },
                    avgResolutionTime: { $round: ["$avgResolutionTime", 2] },
                    satisfactionScore: { $round: ["$satisfactionScore", 2] }
                }
            },
            { $sort: { count: -1 } }
        ]);
    }

    // Get sentiment trends
    async getSentimentTrends(dateFilter, timeRange) {
        const groupFormat = this.getGroupFormat(timeRange);
        
        return await Feedback.aggregate([
            { $match: { createdAt: dateFilter } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: groupFormat, date: "$createdAt" } },
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
                            avgScore: { $round: ["$avgScore", 3] }
                        }
                    },
                    total: { $sum: "$count" }
                }
            },
            { $sort: { _id: 1 } }
        ]);
    }

    // Get team performance
    async getTeamPerformance(dateFilter) {
        return await Feedback.aggregate([
            {
                $match: {
                    ...dateFilter,
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
    }

    // Helper methods
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
            default:
                filter.createdAt.$gte = new Date(now.setDate(now.getDate() - 30));
        }

        filter.createdAt.$lte = new Date();
        return filter;
    }

    getGroupFormat(timeRange) {
        switch (timeRange) {
            case '7d': return '%Y-%m-%d';
            case '30d': return '%Y-%m-%d';
            case '90d': return '%Y-%m-%U';
            case '1y': return '%Y-%m';
            default: return '%Y-%m-%d';
        }
    }

    formatBasicStats(stats) {
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
            byRating: stats.byRating.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            avgRating: stats.avgMetrics[0]?.avgRating || 0,
            avgResponseTime: stats.avgMetrics[0]?.avgResponseTime || 0,
            avgResolutionTime: stats.avgMetrics[0]?.avgResolutionTime || 0,
            slaBreaches: stats.slaBreaches[0]?.count || 0
        };
    }

    async saveAnalyticsData(data) {
        try {
            const analytics = new FeedbackAnalytics(data);
            await analytics.save();
            return analytics;
        } catch (error) {
            console.error('Failed to save analytics data:', error);
        }
    }
}

module.exports = new AnalyticsService();