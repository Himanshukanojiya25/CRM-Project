const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  monthYear: {
    type: String,
    required: true
  },
  checkIn: {
    type: Date
  },
  checkOut: {
    type: Date
  },
  totalHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'holiday'],
    default: 'absent'
  },
  ipAddress: {
    type: String
  },
  deviceType: {
    type: String
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// ✅ FIXED: Pre-validate middleware (more reliable)
attendanceSchema.pre('validate', function(next) {
  if (this.date && !this.monthYear) {
    const date = new Date(this.date);
    this.monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  next();
});

// Index for better query performance
attendanceSchema.index({ user: 1, date: 1 });
attendanceSchema.index({ user: 1, monthYear: 1 });
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);