const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
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
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'admins', 'users', 'specific_departments'],
    default: 'all'
  },
  departments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attachments: [{
    filename: String,
    originalName: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
announcementSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
announcementSchema.index({ targetAudience: 1 });
announcementSchema.index({ createdAt: -1 });

// Static method to get active announcements
announcementSchema.statics.getActiveAnnouncements = function(userDepartment = null) {
  const now = new Date();
  
  let query = {
    isActive: true,
    startDate: { $lte: now }
  };
  
  // Handle endDate (if exists, should be in future)
  query.$or = [
    { endDate: { $exists: false } },
    { endDate: { $gte: now } }
  ];
  
  // Handle target audience
  if (userDepartment) {
    query.$or = [
      { targetAudience: 'all' },
      { targetAudience: 'users' },
      { 
        targetAudience: 'specific_departments',
        departments: { $in: [userDepartment] }
      }
    ];
  } else {
    query.$or = [
      { targetAudience: 'all' },
      { targetAudience: 'users' }
    ];
  }
  
  return this.find(query)
    .populate('createdBy', 'name profilePhoto')
    .sort({ priority: -1, createdAt: -1 });
};

module.exports = mongoose.model('Announcement', announcementSchema);