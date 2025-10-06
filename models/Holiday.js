const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['national', 'regional', 'company', 'optional'],
    default: 'national'
  },
  description: {
    type: String,
    trim: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  applicableDepartments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
holidaySchema.index({ date: 1 });
holidaySchema.index({ isActive: 1 });

// Static method to get upcoming holidays
holidaySchema.statics.getUpcomingHolidays = function(days = 30) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    },
    isActive: true
  }).sort({ date: 1 });
};

module.exports = mongoose.model('Holiday', holidaySchema);