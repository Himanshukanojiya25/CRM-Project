const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // === AUTHENTICATION & BASIC INFO ===
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.githubId;
    },
    minlength: [6, 'Password must be at least 6 characters long']
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'hr', 'manager', 'developer'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Resigned', 'Terminated', 'Suspended'],
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

  // === PROFILE PICTURE & MEDIA ===
  profilePicture: {
    url: { type: String, default: '/images/default-avatar.png' },
    filename: { type: String, default: '' },
    originalName: { type: String, default: '' },
    uploadDate: { type: Date, default: Date.now },
    size: { type: Number, default: 0 },
    mimeType: { type: String, default: '' }
  },
  profilePhoto: {
    type: String,
    default: '/images/default-avatar.png'
  },
  coverPhoto: {
    url: { type: String, default: '/images/default-cover.jpg' },
    filename: { type: String, default: '' },
    originalName: { type: String, default: '' }
  },

  // === PERSONAL INFORMATION ===
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  designation: {
    type: String,
    default: '',
    trim: true
  },
  dob: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say', ''],
    default: ''
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
    default: ''
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed', ''],
    default: ''
  },
  spouseName: {
    type: String,
    default: '',
    trim: true
  },
  anniversaryDate: {
    type: Date,
    default: null
  },
  fatherName: {
    type: String,
    default: '',
    trim: true
  },
  motherName: {
    type: String,
    default: '',
    trim: true
  },
  nationality: {
    type: String,
    default: 'Indian'
  },

  // === CONTACT INFORMATION ===
  personalEmail: {
    type: String,
    default: '',
    trim: true,
    lowercase: true
  },
  emergencyContact: {
    name: { type: String, default: '', trim: true },
    relationship: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true }
  },
  emergencyContactName: {
    type: String,
    default: '',
    trim: true
  },
  emergencyContactNumber: {
    type: String,
    default: '',
    trim: true
  },
  alternateContacts: [{
    name: { type: String, trim: true },
    relationship: { type: String, trim: true },
    phone: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false }
  }],
  personalPhone: {
    type: String,
    default: '',
    trim: true
  },

  // === ADDRESS INFORMATION ===
  currentAddress: {
    street: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    pincode: { type: String, default: '', trim: true },
    country: { type: String, default: 'India', trim: true }
  },
  currentAddressSimple: {
    type: String,
    default: '',
    trim: true
  },
  permanentAddress: {
    street: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    pincode: { type: String, default: '', trim: true },
    country: { type: String, default: 'India', trim: true }
  },
  permanentAddressSimple: {
    type: String,
    default: '',
    trim: true
  },
  sameAsPermanent: {
    type: Boolean,
    default: false
  },

  // === PROFESSIONAL INFORMATION ===
  employeeType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Intern', 'Trainee', ''],
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
    default: '',
    trim: true
  },
  employeeStatus: {
    type: String,
    enum: ['Probation', 'Confirmed', 'Notice Period', ''],
    default: 'Probation'
  },
  workMode: {
    type: String,
    enum: ['Office', 'Remote', 'Hybrid', ''],
    default: 'Office'
  },
  preferredShift: {
    type: String,
    default: '9:30 AM - 6:30 PM'
  },

  // === LEAVE & ATTENDANCE ===
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
    default: 100,
    min: 0,
    max: 100
  },

  // === GOVERNMENT IDS ===
  aadharNumber: {
    type: String,
    default: '',
    trim: true
  },
  panNumber: {
    type: String,
    default: '',
    trim: true
  },
  passportNumber: {
    type: String,
    default: '',
    trim: true
  },
  drivingLicense: {
    type: String,
    default: '',
    trim: true
  },
  voterId: {
    type: String,
    default: '',
    trim: true
  },

  // === FINANCIAL & BANK DETAILS ===
  uanNumber: {
    type: String,
    default: '',
    trim: true
  },
  pfNumber: {
    type: String,
    default: '',
    trim: true
  },
  esicNumber: {
    type: String,
    default: '',
    trim: true
  },
  bankDetails: {
    bankName: { type: String, default: '', trim: true },
    accountNumber: { type: String, default: '', trim: true },
    accountHolderName: { type: String, default: '', trim: true },
    ifscCode: { type: String, default: '', trim: true },
    branchName: { type: String, default: '', trim: true },
    accountType: { type: String, enum: ['Savings', 'Current', ''], default: 'Savings' }
  },
  bankName: {
    type: String,
    default: '',
    trim: true
  },
  accountNumber: {
    type: String,
    default: '',
    trim: true
  },
  ifscCode: {
    type: String,
    default: '',
    trim: true
  },
  branchName: {
    type: String,
    default: '',
    trim: true
  },
  accountType: {
    type: String,
    enum: ['Savings', 'Current', ''],
    default: 'Savings'
  },

  // === SALARY DETAILS ===
  salaryDetails: {
    basicSalary: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    salaryRevisionDate: { type: Date, default: null }
  },

  // === EDUCATION DETAILS ===
  education: [{
    degree: { type: String, required: true, trim: true },
    institution: { type: String, required: true, trim: true },
    university: { type: String, default: '', trim: true },
    yearOfPassing: { type: Number, required: true },
    percentage: { type: String, default: '', trim: true },
    cgpa: { type: String, default: '', trim: true },
    stream: { type: String, default: '', trim: true },
    documents: [{ type: String }],
    isHighest: { type: Boolean, default: false }
  }],
  qualification: {
    type: String,
    default: '',
    trim: true
  },
  university: {
    type: String,
    default: '',
    trim: true
  },
  yearOfPassing: {
    type: Number,
    default: null
  },
  percentage: {
    type: String,
    default: '',
    trim: true
  },

  // === WORK EXPERIENCE ===
  workExperience: [{
    company: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, default: null },
    isCurrent: { type: Boolean, default: false },
    responsibilities: { type: String, default: '', trim: true },
    salary: { type: String, default: '', trim: true },
    location: { type: String, default: '', trim: true },
    documents: [{ type: String }]
  }],
  previousCompany: {
    type: String,
    default: '',
    trim: true
  },
  previousDesignation: {
    type: String,
    default: '',
    trim: true
  },
  experienceYears: {
    type: Number,
    default: 0
  },

  // === SKILLS & CERTIFICATIONS ===
  skills: [{
    name: { type: String, required: true, trim: true },
    proficiency: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Intermediate'
    },
    yearsOfExperience: { type: Number, default: 0 },
    isPrimary: { type: Boolean, default: false }
  }],
  skillsSimple: [{
    type: String,
    trim: true
  }],
  certifications: [{
    name: { type: String, required: true, trim: true },
    issuingOrganization: { type: String, required: true, trim: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, default: null },
    credentialId: { type: String, default: '', trim: true },
    credentialUrl: { type: String, default: '', trim: true },
    document: { type: String, default: '' }
  }],

  // === DOCUMENTS ===
  documents: {
    aadharFront: { type: String, default: '' },
    aadharBack: { type: String, default: '' },
    panCard: { type: String, default: '' },
    passport: { type: String, default: '' },
    drivingLicense: { type: String, default: '' },
    voterId: { type: String, default: '' },
    resume: { type: String, default: '' },
    offerLetter: { type: String, default: '' },
    experienceLetter: { type: String, default: '' },
    salarySlip: { type: String, default: '' },
    educationCertificates: [{ type: String }],
    otherDocuments: [{ type: String }]
  },

  // === SOCIAL MEDIA & LINKS ===
  socialLinks: {
    linkedin: { type: String, default: '', trim: true },
    twitter: { type: String, default: '', trim: true },
    github: { type: String, default: '', trim: true },
    portfolio: { type: String, default: '', trim: true },
    facebook: { type: String, default: '', trim: true },
    instagram: { type: String, default: '', trim: true }
  },
  linkedinProfile: {
    type: String,
    default: '',
    trim: true
  },
  twitterProfile: {
    type: String,
    default: '',
    trim: true
  },

  // === PERFORMANCE & APPRAISAL ===
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
  performanceRemarks: {
    type: String,
    default: ''
  },

  // === SECURITY & PREFERENCES ===
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
    push: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: true },
    securityAlerts: { type: Boolean, default: true }
  },
  profileCompletion: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  themePreference: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'light'
  },
  languagePreference: {
    type: String,
    default: 'en'
  },

  // === SYSTEM FIELDS ===
  lastProfileUpdate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // === EMAIL VERIFICATION ===
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },

  // === PASSWORD RESET ===
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// === VIRTUAL FIELDS ===
userSchema.virtual('leavesRemaining').get(function() {
  return this.totalLeaves - this.leavesTaken;
});

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

userSchema.virtual('fullName').get(function() {
  return this.name;
});

userSchema.virtual('displayName').get(function() {
  return this.name.split(' ')[0];
});

userSchema.virtual('skillsArray').get(function() {
  if (this.skillsSimple && this.skillsSimple.length > 0) {
    return this.skillsSimple;
  }
  if (this.skills && this.skills.length > 0) {
    return this.skills.map(skill => skill.name);
  }
  return [];
});

userSchema.virtual('currentAddressString').get(function() {
  if (this.currentAddressSimple && this.currentAddressSimple !== '') {
    return this.currentAddressSimple;
  }
  if (this.currentAddress && this.currentAddress.street) {
    const addr = this.currentAddress;
    return `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}, ${addr.country}`;
  }
  return '';
});

userSchema.virtual('permanentAddressString').get(function() {
  if (this.permanentAddressSimple && this.permanentAddressSimple !== '') {
    return this.permanentAddressSimple;
  }
  if (this.permanentAddress && this.permanentAddress.street) {
    const addr = this.permanentAddress;
    return `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}, ${addr.country}`;
  }
  return '';
});

// === FIXED PASSWORD HASHING MIDDLEWARE ===
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt
    const salt = await bcrypt.genSalt(12);
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
    console.log(`🔐 Password hashed for user: ${this.email}`);
    next();
  } catch (error) {
    console.error('❌ Password hashing error:', error);
    next(error);
  }
});

// === FIXED PASSWORD COMPARISON METHOD ===
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!this.password) {
      console.log(`❌ No password found for user: ${this.email}`);
      return false;
    }
    
    console.log(`🔐 Comparing password for user: ${this.email}`);
    console.log(`📝 Candidate password length: ${candidatePassword ? candidatePassword.length : 'null'}`);
    console.log(`📝 Stored password hash: ${this.password ? 'Exists' : 'Missing'}`);
    
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log(`✅ Password match result for ${this.email}: ${isMatch}`);
    
    return isMatch;
  } catch (error) {
    console.error(`❌ Password comparison error for ${this.email}:`, error);
    return false;
  }
};

// === METHODS ===
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

userSchema.methods.calculateNetSalary = function() {
  const { basicSalary, hra, allowances, deductions } = this.salaryDetails;
  this.salaryDetails.netSalary = basicSalary + hra + allowances - deductions;
  return this.salaryDetails.netSalary;
};

// ✅ FIXED PROFILE COMPLETION METHOD
userSchema.methods.calculateProfileCompletion = function() {
  let completion = 0;
  
  // ✅ SAFE FIELD CHECKING - Fixed version
  const fields = [
    this.name, 
    this.email, 
    this.phone, 
    this.designation, 
    this.dob, 
    this.gender, 
    this.personalEmail, 
    this.currentAddressString,
    // Safe check for bankName
    this.bankName || (this.bankDetails && this.bankDetails.bankName ? this.bankDetails.bankName : ''),
    // Safe check for profile photo
    this.profilePhoto || (this.profilePicture && this.profilePicture.url ? this.profilePicture.url : '')
  ];
  
  const completedFields = fields.filter(field => {
    if (!field) return false;
    
    // ✅ SAFE OBJECT CHECK - Fixed this part
    if (typeof field === 'object' && field !== null) {
      const values = Object.values(field);
      return values.some(val => val !== null && val !== undefined && val !== '');
    }
    
    return field !== null && field !== undefined && field !== '';
  }).length;
  
  this.profileCompletion = fields.length > 0 ? Math.round((completedFields / fields.length) * 100) : 0;
  return this.profileCompletion;
};

userSchema.methods.getEmergencyContact = function() {
  if (this.emergencyContactName) {
    return {
      name: this.emergencyContactName,
      phone: this.emergencyContactNumber
    };
  }
  return this.emergencyContact.name ? this.emergencyContact : null;
};

userSchema.methods.getSkillsArray = function() {
  if (this.skillsSimple && this.skillsSimple.length > 0) {
    return this.skillsSimple;
  }
  if (this.skills && this.skills.length > 0) {
    return this.skills.map(skill => skill.name);
  }
  return [];
};

// === FIXED PRE-SAVE MIDDLEWARE FOR DATA SYNC ===
userSchema.pre('save', function(next) {
  // Auto-generate employeeId if not present
  if (this.isNew && !this.employeeId) {
    this.employeeId = `EMP${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  // Auto-calculate net salary before save
  if (this.isModified('salaryDetails')) {
    this.calculateNetSalary();
  }
  
  // Auto-calculate profile completion
  this.calculateProfileCompletion();
  
  // Update last profile update timestamp
  if (this.isModified()) {
    this.lastProfileUpdate = new Date();
  }
  
  next();
});

// === STATIC METHODS ===
userSchema.statics.findByEmployeeId = function(employeeId) {
  return this.findOne({ employeeId });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ status: 'Active' });
};

userSchema.statics.findByDepartment = function(departmentId) {
  return this.find({ department: departmentId });
};

userSchema.statics.updateProfileCompletionForAll = async function() {
  const users = await this.find();
  for (const user of users) {
    user.calculateProfileCompletion();
    await user.save();
  }
  return users.length;
};

// === INDEXES ===
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ department: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'currentAddress.city': 1 });
userSchema.index({ joiningDate: 1 });
userSchema.index({ profileCompletion: -1 });

module.exports = mongoose.model('User', userSchema);