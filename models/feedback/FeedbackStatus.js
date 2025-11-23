const mongoose = require('mongoose');

const feedbackStatusSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        required: true,
        default: '#6c757d'
    },
    icon: {
        type: String,
        default: '📝'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    isInitial: {
        type: Boolean,
        default: false
    },
    isFinal: {
        type: Boolean,
        default: false
    },
    allowedTransitions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeedbackStatus'
    }],
    autoActions: {
        sendEmail: { type: Boolean, default: false },
        emailTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'FeedbackTemplate' },
        assignTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatePriority: { type: String, enum: ['low', 'medium', 'high', 'critical'] }
    },
    metadata: {
        feedbackCount: { type: Number, default: 0 },
        averageTimeInStatus: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Pre-save middleware to generate slug
feedbackStatusSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
    next();
});

// Static method to get active statuses in order
feedbackStatusSchema.statics.getActiveStatuses = function() {
    return this.find({ isActive: true }).sort({ order: 1 });
};

// Static method to get initial status
feedbackStatusSchema.statics.getInitialStatus = function() {
    return this.findOne({ isInitial: true, isActive: true });
};

// Static method to get final statuses
feedbackStatusSchema.statics.getFinalStatuses = function() {
    return this.find({ isFinal: true, isActive: true });
};

// Static method to get next possible statuses
feedbackStatusSchema.statics.getNextStatuses = async function(currentStatusId) {
    const currentStatus = await this.findById(currentStatusId).populate('allowedTransitions');
    return currentStatus ? currentStatus.allowedTransitions : [];
};

// Instance method to update statistics
feedbackStatusSchema.methods.updateStatistics = async function() {
    const Feedback = require('./Feedback');
    
    const stats = await Feedback.aggregate([
        { $match: { status: this.slug } },
        {
            $group: {
                _id: null,
                feedbackCount: { $sum: 1 },
                averageTimeInStatus: { $avg: '$responseTime' }
            }
        }
    ]);

    if (stats.length > 0) {
        this.metadata = {
            feedbackCount: stats[0].feedbackCount,
            averageTimeInStatus: Math.round(stats[0].averageTimeInStatus * 100) / 100
        };
        await this.save();
    }
};

// Virtual for transition names
feedbackStatusSchema.virtual('transitionNames').get(function() {
    return this.allowedTransitions.map(t => t.name);
});

module.exports = mongoose.model('FeedbackStatus', feedbackStatusSchema);