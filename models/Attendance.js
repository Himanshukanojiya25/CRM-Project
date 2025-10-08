const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
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
    enum: ['present', 'absent', 'half-day', 'late'],
    default: 'present'
  },
  ipAddress: String,
  deviceType: String,
  // New fields for archiving
  monthYear: {
    type: String, // Format: "2024-12"
    index: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date
}, { timestamps: true });

// Auto-calculate monthYear before saving
attendanceSchema.pre('save', function(next) {
  if (this.date) {
    const date = new Date(this.date);
    this.monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);