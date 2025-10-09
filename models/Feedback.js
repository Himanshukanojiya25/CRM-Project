const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // ✅ FEEDBACK CATEGORY & TYPE
  category: {
    type: String,
    enum: ['general', 'bug', 'feature', 'complaint', 'appreciation', 'suggestion'],
    default: 'general',
    required: true,
    index: true
  },
  
  // ✅ FEEDBACK PRIORITY
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  
  // ✅ FEEDBACK STATUS
  status: {
    type: String,
    enum: ['pending', 'under_review', 'in_progress', 'resolved', 'rejected', 'closed'],
    default: 'pending',
    index: true
  },
  
  // ✅ RATING SYSTEM (1-5 stars)
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  
  // ✅ MAIN FEEDBACK CONTENT
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  // ✅ ATTACHMENTS & MEDIA
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
  
  // ✅ SCREENSHOT/IMAGE SUPPORT
  screenshots: [{
    filename: String,
    originalName: String,
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ✅ TAGS FOR BETTER ORGANIZATION
  tags: [{
    type: String,
    trim: true
  }],
  
  // ✅ ADMIN RESPONSE SYSTEM
  adminResponse: {
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    respondedAt: {
      type: Date,
      default: null
    },
    internalNotes: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  
  // ✅ FOLLOW-UP SYSTEM
  followUps: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    attachments: [{
      filename: String,
      originalName: String,
      url: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ✅ RESOLUTION DETAILS
  resolutionDetails: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    versionFixed: {
      type: String,
      trim: true
    }
  },
  
  // ✅ METADATA & ANALYTICS
  pageUrl: {
    type: String,
    trim: true
  },
  
  browserInfo: {
    userAgent: String,
    browser: String,
    version: String,
    os: String,
    platform: String
  },
  
  deviceType: {
    type: String,
    enum: ['desktop', 'tablet', 'mobile', 'unknown'],
    default: 'unknown'
  },
  
  // ✅ AUTO-CALCULATED FIELDS FOR REAL-TIME DASHBOARD
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
  
  // ✅ SYSTEM FIELDS
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  isPublic: {
    type: Boolean,
    default: false
  },
  
  upvotes: {
    type: Number,
    default: 0
  },
  
  // ✅ TIMESTAMPS
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  lastActivityAt: {
    type: Date,
    default: Date.now
  },

  // ✅ ARCHIVING SUPPORT
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  
  archivedAt: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ COMPOUND INDEXES FOR BETTER PERFORMANCE
feedbackSchema.index({ user: 1, createdAt: -1 });
feedbackSchema.index({ user: 1, status: 1 });
feedbackSchema.index({ category: 1, status: 1 });
feedbackSchema.index({ priority: 1, status: 1 });
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ year: 1, month: 1 });

// ✅ VIRTUAL FIELDS FOR REAL-TIME DASHBOARD
feedbackSchema.virtual('responseTime').get(function() {
  if (this.adminResponse && this.adminResponse.respondedAt && this.createdAt) {
    return this.adminResponse.respondedAt - this.createdAt;
  }
  return null;
});

feedbackSchema.virtual('isResolved').get(function() {
  return this.status === 'resolved' || this.status === 'closed';
});

feedbackSchema.virtual('hasResponse').get(function() {
  return !!(this.adminResponse && this.adminResponse.message);
});

feedbackSchema.virtual('daysOpen').get(function() {
  if (this.isResolved && this.resolutionDetails.resolvedAt) {
    return Math.ceil((this.resolutionDetails.resolvedAt - this.createdAt) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

feedbackSchema.virtual('isUrgent').get(function() {
  return this.priority === 'urgent' || this.priority === 'high';
});

feedbackSchema.virtual('isPending').get(function() {
  return this.status === 'pending' || this.status === 'under_review';
});

feedbackSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// ✅ PRE-SAVE MIDDLEWARE
feedbackSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-calculate year and month for filtering
  const createdDate = new Date(this.createdAt);
  this.year = createdDate.getFullYear();
  this.month = createdDate.getMonth() + 1;
  
  // Auto-generate tags based on category and content
  if (this.isModified('category') || this.isModified('title')) {
    const baseTags = [this.category];
    
    // Add priority tags
    if (this.priority === 'urgent' || this.priority === 'high') {
      baseTags.push('urgent');
    }
    
    // Add content-based tags from title
    const titleWords = this.title.toLowerCase().split(' ');
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    titleWords.forEach(word => {
      if (word.length > 3 && !commonWords.includes(word)) {
        baseTags.push(word);
      }
    });
    
    this.tags = [...new Set(baseTags)]; // Remove duplicates
  }
  
  // Update last activity timestamp
  if (this.isModified() && !this.isModified('lastActivityAt')) {
    this.lastActivityAt = new Date();
  }
  
  next();
});

// ✅ INSTANCE METHODS
feedbackSchema.methods.addFollowUp = function(userId, message, attachments = []) {
  this.followUps.push({
    user: userId,
    message: message,
    attachments: attachments
  });
  this.lastActivityAt = new Date();
  return this.save();
};

feedbackSchema.methods.markAsResolved = function(adminId, notes, version = null) {
  this.status = 'resolved';
  this.resolutionDetails = {
    resolvedBy: adminId,
    resolutionNotes: notes,
    resolvedAt: new Date(),
    versionFixed: version
  };
  this.lastActivityAt = new Date();
  return this.save();
};

feedbackSchema.methods.addAdminResponse = function(adminId, message, internalNotes = '') {
  this.adminResponse = {
    respondedBy: adminId,
    message: message,
    respondedAt: new Date(),
    internalNotes: internalNotes
  };
  this.lastActivityAt = new Date();
  return this.save();
};

feedbackSchema.methods.changeStatus = function(newStatus) {
  this.status = newStatus;
  this.lastActivityAt = new Date();
  return this.save();
};

feedbackSchema.methods.calculateSatisfaction = function() {
  if (!this.rating) return null;
  
  // Simple satisfaction score based on rating
  return (this.rating / 5) * 100;
};

// ✅ STATIC METHODS FOR REAL-TIME DASHBOARD
feedbackSchema.statics.getByStatus = function(status) {
  return this.find({ status: status })
    .populate('user', 'name email profilePhoto')
    .populate('adminResponse.respondedBy', 'name email')
    .sort({ createdAt: -1 });
};

feedbackSchema.statics.getByCategory = function(category) {
  return this.find({ category: category })
    .populate('user', 'name email profilePhoto')
    .sort({ createdAt: -1 });
};

feedbackSchema.statics.getHighPriority = function() {
  return this.find({ 
    $or: [
      { priority: 'high' }, 
      { priority: 'urgent' }
    ],
    status: { $in: ['pending', 'under_review', 'in_progress'] }
  })
  .populate('user', 'name email profilePhoto')
  .sort({ createdAt: -1 });
};

feedbackSchema.statics.getUserFeedback = function(userId, limit = null) {
  const query = this.find({ user: userId })
    .populate('user', 'name email profilePhoto')
    .populate('adminResponse.respondedBy', 'name email')
    .populate('resolutionDetails.resolvedBy', 'name email')
    .sort({ createdAt: -1 });
  
  if (limit) {
    query.limit(limit);
  }
  
  return query;
};

feedbackSchema.statics.getPendingFeedback = function(userId) {
  return this.countDocuments({
    user: userId,
    status: { $in: ['pending', 'under_review'] }
  });
};

feedbackSchema.statics.getRecentFeedback = function(userId, limit = 10) {
  return this.find({
    user: userId
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .select('title category status priority createdAt rating')
  .lean();
};

feedbackSchema.statics.getFeedbackStats = function(userId, year = null) {
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
        averageRating: { $avg: '$rating' }
      }
    }
  ]);
};

feedbackSchema.statics.getCategoryStats = function(userId, year = null) {
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
        _id: '$category',
        count: { $sum: 1 },
        averageRating: { $avg: '$rating' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// ✅ BULK OPERATIONS FOR PERFORMANCE
feedbackSchema.statics.bulkArchive = function(userId, beforeDate) {
  return this.updateMany(
    {
      user: userId,
      createdAt: { $lt: beforeDate },
      isArchived: false,
      status: { $in: ['resolved', 'closed', 'rejected'] }
    },
    {
      $set: {
        isArchived: true,
        archivedAt: new Date()
      }
    }
  );
};

// ✅ ANALYTICS METHODS
feedbackSchema.statics.getResponseTimeMetrics = function(userId) {
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        'adminResponse.respondedAt': { $exists: true }
      }
    },
    {
      $project: {
        responseTime: {
          $divide: [
            { $subtract: ['$adminResponse.respondedAt', '$createdAt'] },
            1000 * 60 * 60 * 24 // Convert to days
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        averageResponseTime: { $avg: '$responseTime' },
        minResponseTime: { $min: '$responseTime' },
        maxResponseTime: { $max: '$responseTime' }
      }
    }
  ]);
};

module.exports = mongoose.model('Feedback', feedbackSchema);