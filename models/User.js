const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.githubId;
    }
  },
  phone: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'hr', 'manager', 'developer'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Resigned'],
    default: 'Active'
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  googleId: {
    type: String,
    default: null
  },
  githubId: {
    type: String, 
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);