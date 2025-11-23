const mongoose = require('mongoose');

const feedbackCategorySchema = new mongoose.Schema({
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
    autoAssignTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    responseTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeedbackTemplate'
    },
    slaHours: {
        type: Number,
        default: 24
    },
    metadata: {
        totalFeedbacks: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        averageResolutionTime: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Pre-save middleware to generate slug
feedbackCategorySchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
    next();
});

// Static method to get active categories
feedbackCategorySchema.statics.getActiveCategories = function() {
    return this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to get category by slug
feedbackCategorySchema.statics.findBySlug = function(slug) {
    return this.findOne({ slug, isActive: true });
};

// Instance method to update statistics
feedbackCategorySchema.methods.updateStatistics = async function() {
    const Feedback = require('./Feedback');
    
    const stats = await Feedback.aggregate([
        { $match: { category: this.slug } },
        {
            $group: {
                _id: null,
                totalFeedbacks: { $sum: 1 },
                averageRating: { $avg: '$rating' },
                averageResolutionTime: { $avg: '$resolutionTime' }
            }
        }
    ]);

    if (stats.length > 0) {
        this.metadata = {
            totalFeedbacks: stats[0].totalFeedbacks,
            averageRating: Math.round(stats[0].averageRating * 100) / 100,
            averageResolutionTime: Math.round(stats[0].averageResolutionTime * 100) / 100
        };
        await this.save();
    }
};

module.exports = mongoose.model('FeedbackCategory', feedbackCategorySchema);