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
  },

  // ✅ PROFESSIONAL FIELDS
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  designation: {
    type: String,
    default: ''
  },
  profilePhoto: {
    type: String,
    default: '/images/default-avatar.png'
  },
  coverPhoto: {
    type: String,
    default: '/images/default-cover.jpg'
  },
  dob: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: ''
  },
  personalEmail: {
    type: String,
    default: ''
  },
  emergencyContactNumber: {
    type: String,
    default: ''
  },
  emergencyContactName: {
    type: String,
    default: ''
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
    default: ''
  },
  currentAddress: {
    type: String,
    default: ''
  },
  permanentAddress: {
    type: String,
    default: ''
  },
  employeeType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Intern', ''],
    default: 'Full-time'
  },
  workLocation: {
    type: String,
    enum: ['Office', 'Remote', 'Hybrid', ''],
    default: 'Office'
  },
  shiftTimings: {
    type: String,
    default: '9:30 AM - 6:30 PM'
  },
  reportingManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  team: {
    type: String,
    default: ''
  },
  employeeStatus: {
    type: String,
    enum: ['Probation', 'Confirmed', ''],
    default: 'Probation'
  },
  totalLeaves: {
    type: Number,
    default: 12
  },
  leavesTaken: {
    type: Number,
    default: 0
  },
  attendancePercentage: {
    type: Number,
    default: 100
  },
  lastLogin: {
    type: Date,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true }
  },

  // ✅ NEW: GOVERNMENT IDS & DOCUMENTS
  aadharNumber: {
    type: String,
    default: ''
  },
  panNumber: {
    type: String,
    default: ''
  },
  passportNumber: {
    type: String,
    default: ''
  },
  drivingLicense: {
    type: String,
    default: ''
  },
  uanNumber: {
    type: String,
    default: ''
  },
  pfNumber: {
    type: String,
    default: ''
  },
  esicNumber: {
    type: String,
    default: ''
  },

  // ✅ NEW: BANK DETAILS
  bankName: {
    type: String,
    default: ''
  },
  accountNumber: {
    type: String,
    default: ''
  },
  ifscCode: {
    type: String,
    default: ''
  },
  branchName: {
    type: String,
    default: ''
  },
  accountType: {
    type: String,
    enum: ['Savings', 'Current', ''],
    default: 'Savings'
  },

  // ✅ NEW: EDUCATION DETAILS
  qualification: {
    type: String,
    default: ''
  },
  university: {
    type: String,
    default: ''
  },
  yearOfPassing: {
    type: Number,
    default: null
  },
  percentage: {
    type: String,
    default: ''
  },

  // ✅ NEW: EXPERIENCE DETAILS
  previousCompany: {
    type: String,
    default: ''
  },
  previousDesignation: {
    type: String,
    default: ''
  },
  experienceYears: {
    type: Number,
    default: 0
  },
  skills: [{
    type: String
  }],

  // ✅ NEW: DOCUMENT PATHS
  aadharDocument: {
    type: String,
    default: ''
  },
  panDocument: {
    type: String,
    default: ''
  },
  resumeDocument: {
    type: String,
    default: ''
  },
  offerLetterDocument: {
    type: String,
    default: ''
  },
  experienceLetterDocument: {
    type: String,
    default: ''
  },

  // ✅ NEW: ADDITIONAL CONTACTS
  alternatePhone: {
    type: String,
    default: ''
  },
  personalPhone: {
    type: String,
    default: ''
  },

  // ✅ NEW: SOCIAL MEDIA
  linkedinProfile: {
    type: String,
    default: ''
  },
  twitterProfile: {
    type: String,
    default: ''
  },

  // ✅ NEW: WORK PREFERENCES
  preferredShift: {
    type: String,
    default: '9:30 AM - 6:30 PM'
  },
  workMode: {
    type: String,
    enum: ['Office', 'Remote', 'Hybrid', ''],
    default: 'Office'
  },

  // ✅ NEW: PERFORMANCE FIELDS
  performanceRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  lastAppraisalDate: {
    type: Date,
    default: null
  },
  nextAppraisalDate: {
    type: Date,
    default: null
  },

  // ✅ NEW: SALARY DETAILS
  basicSalary: {
    type: Number,
    default: 0
  },
  hra: {
    type: Number,
    default: 0
  },
  allowances: {
    type: Number,
    default: 0
  },
  deductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Virtual for remaining leaves
userSchema.virtual('leavesRemaining').get(function() {
  return this.totalLeaves - this.leavesTaken;
});

// ✅ Virtual for total experience
userSchema.virtual('totalExperience').get(function() {
  if (this.joiningDate) {
    const joinDate = new Date(this.joiningDate);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - joinDate);
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    return `${diffYears} years ${diffMonths} months`;
  }
  return '0 years';
});

// ✅ Virtual for age calculation
userSchema.virtual('age').get(function() {
  if (this.dob) {
    const birthDate = new Date(this.dob);
    const currentDate = new Date();
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  return null;
});

// ✅ Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// ✅ Method to calculate net salary
userSchema.methods.calculateNetSalary = function() {
  this.netSalary = this.basicSalary + this.hra + this.allowances - this.deductions;
  return this.netSalary;
};

module.exports = mongoose.model('User', userSchema);