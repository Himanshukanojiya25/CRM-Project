const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true // har leave ek user se linked hoga
  },
  leaveType: {
    type: String,
    enum: ['full-day', 'half-day'], // sirf 2 options
    required: true,
    default: 'full-day'
  },
  startDate: { 
    type: Date, 
    required: true // leave ka start date
  },
  endDate: { 
    type: Date,
    required: function() {
      // ✅ Agar leave full-day hai tabhi endDate required hoga
      return this.leaveType === 'full-day';
    }
  },
  reason: { 
    type: String, 
    required: true // leave ka reason dena zaroori hai
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' // by default pending hi rahega
  },
  days: {
    type: Number,
    default: 1,
    required: true // kitne din ka leave hai
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // kisne approve kiya
  },
  approvedAt: {
    type: Date // approve hone ka time
  },
  rejectionReason: {
    type: String // agar reject hua to reason
  }
}, { 
  timestamps: true // createdAt aur updatedAt dono auto add honge
});

// ✅ Pre-save hook -> leave days calculate karna
leaveSchema.pre('save', function(next) {
  if (this.leaveType === 'full-day' && this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    // difference ko days me convert karke +1 (inclusive dates)
    this.days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  } else {
    this.days = 1; // half-day hamesha 1 hi rahega
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);
