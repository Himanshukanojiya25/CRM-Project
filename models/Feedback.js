const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // ✅ FEEDBACK CATEGORY & TYPE
  category: {
    type: String,
    enum: ['general', 'bug', 'feature', 'complaint', 'appreciation', 'suggestion'],
    default: 'general',
    required: true
  },
  
  // ✅ FEEDBACK PRIORITY
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // ✅ FEEDBACK STATUS
  status: {
    type: String,
    enum: ['pending', 'under_review', 'in_progress', 'resolved', 'rejected', 'closed'],
    default: 'pending'
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
  
  // ✅ AUTO-CALCULATED FIELDS
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
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  lastActivityAt: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// ✅ INDEXES FOR BETTER PERFORMANCE
feedbackSchema.index({ user: 1, createdAt: -1 });
feedbackSchema.index({ category: 1, status: 1 });
feedbackSchema.index({ priority: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ 'adminResponse.respondedAt': 1 });

// ✅ VIRTUAL FIELDS
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

// ✅ STATIC METHODS
feedbackSchema.statics.getByStatus = function(status) {
  return this.find({ status: status }).populate('user', 'name email profilePhoto').sort({ createdAt: -1 });
};

feedbackSchema.statics.getByCategory = function(category) {
  return this.find({ category: category }).populate('user', 'name email profilePhoto').sort({ createdAt: -1 });
};

feedbackSchema.statics.getHighPriority = function() {
  return this.find({ 
    $or: [
      { priority: 'high' }, 
      { priority: 'urgent' }
    ],
    status: { $in: ['pending', 'under_review', 'in_progress'] }
  }).populate('user', 'name email profilePhoto').sort({ createdAt: -1 });
};

feedbackSchema.statics.getUserFeedback = function(userId) {
  return this.find({ user: userId })
    .populate('user', 'name email profilePhoto')
    .populate('adminResponse.respondedBy', 'name email')
    .populate('resolutionDetails.resolvedBy', 'name email')
    .sort({ createdAt: -1 });
};

// ✅ PRE-SAVE MIDDLEWARE
feedbackSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-generate tags based on category and content
  if (this.isModified('category') || this.isModified('title')) {
    const baseTags = [this.category];
    
    // Add urgency tags
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
  
  next();
});

// ✅ TOJSON TRANSFORM
feedbackSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Feedback', feedbackSchema);