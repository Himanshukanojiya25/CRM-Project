// models/Performance.js
const mongoose = require('mongoose'); // Don't forget to require mongoose

const performanceSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  metrics: {
    attendance: { 
      type: Number,
      min: 0,
      max: 100,
      default: 0 
    },
    tasksCompleted: { 
      type: Number,
      default: 0 
    }
  },
  reviewDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Performance', performanceSchema);