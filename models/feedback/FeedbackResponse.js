const mongoose = require('mongoose');

const feedbackResponseSchema = new mongoose.Schema({
    feedback: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback',
        required: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    isInternal: {
        type: Boolean,
        default: false
    },
    internalNote: {
        type: String,
        trim: true
    },
    attachments: [{
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String
    }],
    templateUsed: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeedbackTemplate'
    },
    sentVia: {
        type: String,
        enum: ['email', 'system', 'both'],
        default: 'system'
    },
    emailStatus: {
        sent: Boolean,
        delivered: Boolean,
        opened: Boolean,
        error: String
    }
}, {
    timestamps: true
});

// Indexes
feedbackResponseSchema.index({ feedback: 1, createdAt: -1 });
feedbackResponseSchema.index({ admin: 1 });
feedbackResponseSchema.index({ createdAt: 1 });

module.exports = mongoose.model('FeedbackResponse', feedbackResponseSchema);