const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const feedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    category: {
        type: String,
        enum: ['bug', 'feature_request', 'complaint', 'appreciation', 'general'],
        default: 'general'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['new', 'acknowledged', 'in_progress', 'resolved', 'closed'],
        default: 'new'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    tags: [{
        type: String,
        trim: true
    }],
    source: {
        type: String,
        enum: ['web', 'mobile', 'email', 'api'],
        default: 'web'
    },
    attachments: [{
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    metadata: {
        ipAddress: String,
        userAgent: String,
        browser: String,
        os: String,
        device: String
    },
    sentiment: {
        score: Number,
        label: {
            type: String,
            enum: ['positive', 'negative', 'neutral']
        },
        confidence: Number
    },
    slaBreached: {
        type: Boolean,
        default: false
    },
    responseTime: Number, // in hours
    resolutionTime: Number, // in hours
    satisfactionScore: Number // 1-5
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for responses
feedbackSchema.virtual('responses', {
    ref: 'FeedbackResponse',
    localField: '_id',
    foreignField: 'feedback'
});

// Virtual for assignments history
feedbackSchema.virtual('assignments', {
    ref: 'FeedbackAssignment',
    localField: '_id',
    foreignField: 'feedback'
});

// Indexes for performance
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ assignedTo: 1, status: 1 });
feedbackSchema.index({ user: 1, createdAt: -1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ category: 1 });
feedbackSchema.index({ 'sentiment.label': 1 });

// Static methods
feedbackSchema.statics.getStats = async function(adminId) {
    return await this.aggregate([
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
                avgRating: [
                    { $group: { _id: null, avg: { $avg: "$rating" } } }
                ]
            }
        }
    ]);
};

// Instance methods
feedbackSchema.methods.calculateSLA = function() {
    const now = new Date();
    const created = new Date(this.createdAt);
    const hoursDiff = (now - created) / (1000 * 60 * 60);
    
    this.slaBreached = hoursDiff > 24; // 24 hours SLA
    this.responseTime = hoursDiff;
    
    return this;
};

feedbackSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Feedback', feedbackSchema);