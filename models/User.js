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
      // ✅ Password required only for local signup, not for OAuth
      return !this.googleId && !this.githubId;
    }
  },
  googleId: {
    type: String,
    default: null
  },
  githubId: {
    type: String, 
    default: null
  },
  age: {
    type: Number
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;