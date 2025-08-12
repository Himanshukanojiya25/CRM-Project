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
  deviceType: String
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
