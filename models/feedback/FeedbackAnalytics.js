const mongoose = require('mongoose');

const feedbackAnalyticsSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    timeRange: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
        required: true
    },
    totalFeedbacks: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
    sentimentDistribution: {
        positive: { type: Number, default: 0 },
        negative: { type: Number, default: 0 },
        neutral: { type: Number, default: 0 }
    },
    statusDistribution: {
        new: { type: Number, default: 0 },
        acknowledged: { type: Number, default: 0 },
        in_progress: { type: Number, default: 0 },
        resolved: { type: Number, default: 0 },
        closed: { type: Number, default: 0 }
    },
    priorityDistribution: {
        low: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        high: { type: Number, default: 0 },
        critical: { type: Number, default: 0 }
    },
    categoryDistribution: {
        bug: { type: Number, default: 0 },
        feature_request: { type: Number, default: 0 },
        complaint: { type: Number, default: 0 },
        appreciation: { type: Number, default: 0 },
        general: { type: Number, default: 0 }
    },
    responseTimeMetrics: {
        averageResponseTime: { type: Number, default: 0 },
        averageResolutionTime: { type: Number, default: 0 },
        slaBreaches: { type: Number, default: 0 }
    },
    teamPerformance: [{
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        assignedCount: { type: Number, default: 0 },
        resolvedCount: { type: Number, default: 0 },
        averageResolutionTime: { type: Number, default: 0 },
        satisfactionScore: { type: Number, default: 0 }
    }],
    trendData: {
        feedbackVolume: [{
            date: Date,
            count: Number
        }],
        ratingTrend: [{
            date: Date,
            averageRating: Number
        }],
        sentimentTrend: [{
            date: Date,
            positive: Number,
            negative: Number,
            neutral: Number
        }]
    },
    insights: [{
        type: {
            type: String,
            enum: ['warning', 'info', 'success', 'danger']
        },
        title: String,
        message: String,
        priority: {
            type: String,
            enum: ['low', 'medium', 'high']
        }
    }]
}, {
    timestamps: true
});

// Index for efficient querying
feedbackAnalyticsSchema.index({ date: 1, timeRange: 1 });
feedbackAnalyticsSchema.index({ createdAt: -1 });

// Static method to get latest analytics
feedbackAnalyticsSchema.statics.getLatestAnalytics = async function(timeRange = 'daily') {
    return await this.findOne({ timeRange })
        .sort({ date: -1 })
        .limit(1);
};

// Static method to generate analytics for a time period
feedbackAnalyticsSchema.statics.generateAnalytics = async function(timeRange, startDate, endDate) {
    // This would contain the logic to generate analytics data
    // based on feedbacks in the given time period
    return {
        timeRange,
        startDate,
        endDate,
        generatedAt: new Date()
    };
};

module.exports = mongoose.model('FeedbackAnalytics', feedbackAnalyticsSchema);