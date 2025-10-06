const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: [
      'leave_approved', 
      'leave_rejected', 
      'leave_applied',
      'feedback_response',
      'attendance_reminder',
      'announcement',
      'system',
      'general'
    ],
    default: 'general'
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['leave', 'feedback', 'attendance', 'announcement', 'none']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  actionUrl: {
    type: String,
    trim: true
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ type: 1 });

// Static method to create notification
notificationSchema.statics.createNotification = function(notificationData) {
  return this.create(notificationData);
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, limit = 10) {
  return this.find({
    user: userId
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to mark as read
notificationSchema.statics.markAsRead = function(notificationId, userId) {
  return this.findOneAndUpdate(
    {
      _id: notificationId,
      user: userId
    },
    {
      isRead: true,
      readAt: new Date()
    },
    { new: true }
  );
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    {
      user: userId,
      isRead: false
    },
    {
      isRead: true,
      readAt: new Date()
    }
  );
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);