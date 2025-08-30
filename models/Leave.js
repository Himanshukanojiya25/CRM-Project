const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  leaveType: {
    type: String,
    enum: ['full-day', 'half-day'],
    required: true,
    default: 'full-day'
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date,
    required: function() {
      return this.leaveType === 'full-day';
    }
  },
  reason: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  days: {
    type: Number,
    default: 1,
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  }
}, { 
  timestamps: true 
});

// Calculate days before saving
leaveSchema.pre('save', function(next) {
  if (this.leaveType === 'full-day' && this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  } else {
    this.days = 1; // Half-day is always 1 day
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);