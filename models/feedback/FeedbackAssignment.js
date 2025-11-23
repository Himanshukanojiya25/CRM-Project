const mongoose = require('mongoose');

const feedbackAssignmentSchema = new mongoose.Schema({
    feedback: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        trim: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    dueDate: Date,
    status: {
        type: String,
        enum: ['active', 'completed', 'reassigned', 'cancelled'],
        default: 'active'
    },
    notes: String
}, {
    timestamps: true
});

// Indexes
feedbackAssignmentSchema.index({ feedback: 1 });
feedbackAssignmentSchema.index({ assignedTo: 1, status: 1 });
feedbackAssignmentSchema.index({ dueDate: 1 });

module.exports = mongoose.model('FeedbackAssignment', feedbackAssignmentSchema);