const mongoose = require('mongoose');

const salesActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Call', 'Email', 'Meeting', 'Demo', 'Proposal', 'Follow-up'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  description: String,
  deal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesDeal'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledDate: Date,
  completedDate: Date,
  duration: Number, // in minutes
  outcome: {
    type: String,
    enum: ['Positive', 'Neutral', 'Negative', 'Rescheduled', 'Cancelled']
  },
  notes: String,
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  }
}, { 
  timestamps: true 
});

// Indexes
salesActivitySchema.index({ assignedTo: 1, scheduledDate: 1 });
salesActivitySchema.index({ deal: 1 });
salesActivitySchema.index({ type: 1 });

module.exports = mongoose.model('SalesActivity', salesActivitySchema);