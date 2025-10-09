const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  leaveType: {
    type: String,
    enum: ['full-day', 'half-day', 'short-leave'],
    required: true,
    default: 'full-day'
  },
  startDate: { 
    type: Date, 
    required: true,
    index: true
  },
  endDate: { 
    type: Date,
    required: function() {
      return this.leaveType === 'full-day';
    }
  },
  reason: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 1000
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'cancelled'], 
    default: 'pending',
    index: true
  },
  days: {
    type: Number,
    default: 1,
    required: true,
    min: 0.5,
    max: 90
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // ✅ ENHANCED FIELDS FOR REAL-TIME DASHBOARD
  leaveCategory: {
    type: String,
    enum: ['casual', 'sick', 'earned', 'maternity', 'paternity', 'emergency', 'other'],
    default: 'casual',
    required: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // ✅ DATES FOR FILTERING AND REPORTING
  applicationDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  year: {
    type: Number,
    index: true
  },
  
  month: {
    type: Number,
    min: 1,
    max: 12,
    index: true
  },
  
  // ✅ ADDITIONAL METADATA
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
  
  contactInfo: {
    phone: String,
    emergencyContact: String,
    address: String
  },
  
  // ✅ WORK HANDOVER
  handoverTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  handoverNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // ✅ AUTO-RETURN CALCULATION
  expectedReturn: {
    type: Date
  },
  
  actualReturn: {
    type: Date
  },
  
  // ✅ SYSTEM FIELDS
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  
  archivedAt: Date,

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ COMPOUND INDEXES FOR BETTER PERFORMANCE
leaveSchema.index({ user: 1, startDate: 1 });
leaveSchema.index({ user: 1, status: 1 });
leaveSchema.index({ user: 1, year: 1 });
leaveSchema.index({ status: 1, startDate: 1 });
leaveSchema.index({ leaveCategory: 1, status: 1 });

// ✅ VIRTUAL FIELDS FOR REAL-TIME CALCULATIONS
leaveSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

leaveSchema.virtual('isApproved').get(function() {
  return this.status === 'approved';
});

leaveSchema.virtual('isRejected').get(function() {
  return this.status === 'rejected';
});

leaveSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'approved' && 
         new Date(this.startDate) <= now && 
         (!this.endDate || new Date(this.endDate) >= now);
});

leaveSchema.virtual('isUpcoming').get(function() {
  return this.status === 'approved' && new Date(this.startDate) > new Date();
});

leaveSchema.virtual('isPast').get(function() {
  return this.endDate ? new Date(this.endDate) < new Date() : new Date(this.startDate) < new Date();
});

leaveSchema.virtual('duration').get(function() {
  if (this.leaveType === 'full-day' && this.startDate && this.endDate) {
    const diffTime = Math.abs(new Date(this.endDate) - new Date(this.startDate));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  return this.days;
});

leaveSchema.virtual('formattedPeriod').get(function() {
  const start = new Date(this.startDate).toLocaleDateString();
  if (this.leaveType === 'full-day' && this.endDate) {
    const end = new Date(this.endDate).toLocaleDateString();
    return `${start} to ${end}`;
  }
  return start;
});

leaveSchema.virtual('daysRemaining').get(function() {
  if (this.isUpcoming) {
    const now = new Date();
    const start = new Date(this.startDate);
    const diffTime = Math.abs(start - now);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// ✅ PRE-SAVE MIDDLEWARE FOR AUTO-CALCULATIONS
leaveSchema.pre('save', function(next) {
  // Auto-calculate year and month for filtering
  const startDate = new Date(this.startDate);
  this.year = startDate.getFullYear();
  this.month = startDate.getMonth() + 1;
  
  // Auto-calculate days based on leave type
  if (this.leaveType === 'full-day' && this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end - start);
    this.days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
  } else if (this.leaveType === 'half-day') {
    this.days = 0.5;
    this.endDate = this.startDate; // Half-day doesn't have end date
  } else if (this.leaveType === 'short-leave') {
    this.days = 0.25; // 2 hours
    this.endDate = this.startDate;
  }
  
  // Set application date if not set
  if (!this.applicationDate) {
    this.applicationDate = new Date();
  }
  
  // Calculate expected return date
  if (this.leaveType === 'full-day' && this.endDate) {
    this.expectedReturn = new Date(this.endDate);
    this.expectedReturn.setDate(this.expectedReturn.getDate() + 1);
  } else {
    this.expectedReturn = new Date(this.startDate);
    this.expectedReturn.setDate(this.expectedReturn.getDate() + 1);
  }
  
  next();
});

// ✅ INSTANCE METHODS
leaveSchema.methods.approve = function(approvedBy, notes = '') {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  if (notes) {
    this.handoverNotes = notes;
  }
  return this.save();
};

leaveSchema.methods.reject = function(rejectionReason) {
  this.status = 'rejected';
  this.rejectionReason = rejectionReason;
  return this.save();
};

leaveSchema.methods.cancel = function() {
  if (this.status === 'pending') {
    this.status = 'cancelled';
    return this.save();
  }
  return Promise.reject(new Error('Only pending leaves can be cancelled'));
};

leaveSchema.methods.isOverlapping = function() {
  const startDate = new Date(this.startDate);
  const endDate = this.endDate ? new Date(this.endDate) : new Date(this.startDate);
  
  return this.model('Leave').findOne({
    user: this.user,
    status: { $in: ['pending', 'approved'] },
    _id: { $ne: this._id },
    $or: [
      {
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
      },
      {
        startDate: { $lte: startDate },
        endDate: { $gte: endDate }
      }
    ]
  });
};

// ✅ STATIC METHODS FOR REAL-TIME DASHBOARD
leaveSchema.statics.getUserLeaves = function(userId, year = null) {
  const match = { user: userId };
  if (year) {
    match.year = year;
  }
  
  return this.find(match)
    .sort({ startDate: -1 })
    .populate('user', 'name email employeeId')
    .populate('approvedBy', 'name')
    .populate('handoverTo', 'name')
    .lean();
};

leaveSchema.statics.getPendingLeaves = function(userId) {
  return this.countDocuments({
    user: userId,
    status: 'pending'
  });
};

leaveSchema.statics.getApprovedLeaves = function(userId, year = null) {
  const match = { 
    user: userId, 
    status: 'approved' 
  };
  
  if (year) {
    match.year = year;
  }
  
  return this.countDocuments(match);
};

leaveSchema.statics.getUpcomingLeaves = function(userId, limit = 5) {
  return this.find({
    user: userId,
    status: 'approved',
    startDate: { $gte: new Date() }
  })
  .sort({ startDate: 1 })
  .limit(limit)
  .select('startDate endDate leaveType reason leaveCategory')
  .lean();
};

leaveSchema.statics.getRecentLeaves = function(userId, limit = 10) {
  return this.find({
    user: userId
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .select('startDate endDate status reason leaveType days leaveCategory')
  .lean();
};

leaveSchema.statics.getLeaveStats = function(userId, year = null) {
  const currentYear = year || new Date().getFullYear();
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        year: currentYear
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalDays: { $sum: '$days' },
        averageDays: { $avg: '$days' }
      }
    }
  ]);
};

leaveSchema.statics.getCategoryStats = function(userId, year = null) {
  const currentYear = year || new Date().getFullYear();
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        year: currentYear,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$leaveCategory',
        count: { $sum: 1 },
        totalDays: { $sum: '$days' }
      }
    },
    {
      $sort: { totalDays: -1 }
    }
  ]);
};

// ✅ BULK OPERATIONS FOR PERFORMANCE
leaveSchema.statics.bulkArchive = function(userId, beforeDate) {
  return this.updateMany(
    {
      user: userId,
      startDate: { $lt: beforeDate },
      isArchived: false
    },
    {
      $set: {
        isArchived: true,
        archivedAt: new Date()
      }
    }
  );
};

// ✅ VALIDATION METHODS
leaveSchema.methods.validateLeaveBalance = async function(leaveBalances) {
  const leaveCategory = this.leaveCategory;
  const requestedDays = this.days;
  
  if (leaveBalances[leaveCategory] && leaveBalances[leaveCategory] >= requestedDays) {
    return true;
  }
  
  return false;
};

module.exports = mongoose.model('Leave', leaveSchema);