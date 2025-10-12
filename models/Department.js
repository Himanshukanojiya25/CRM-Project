const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    maxlength: [100, 'Department name cannot exceed 100 characters'],
    index: true
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    match: [/^[A-Z0-9]{2,10}$/, 'Department code must be 2-10 uppercase alphanumeric characters'],
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Hierarchy & Structure
  parentDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
    validate: {
      validator: function(v) {
        return !v || !this._id || !v.equals(this._id);
      },
      message: 'Department cannot be its own parent'
    }
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  assistantManagers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  
  // Budget & Financials
  budget: {
    allocated: { 
      type: Number, 
      default: 0,
      min: [0, 'Budget cannot be negative']
    },
    utilized: { 
      type: Number, 
      default: 0,
      min: [0, 'Utilized amount cannot be negative']
    },
    fiscalYear: { 
      type: Number, 
      default: new Date().getFullYear()
    },
    categories: [{
      name: String,
      allocated: Number,
      utilized: Number,
      color: { type: String, default: '#3B82F6' }
    }]
  },
  
  // Contact Information
  contact: {
    email: {
      type: String,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: String,
    location: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' }
    }
  },
  
  // Settings & Configuration
  settings: {
    color: { 
      type: String, 
      default: '#3B82F6',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format']
    },
    approvalWorkflow: { type: Boolean, default: true },
    autoAssign: { type: Boolean, default: false },
    notifications: { 
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
      sms: { type: Boolean, default: false }
    },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
      timezone: { type: String, default: 'Asia/Kolkata' }
    }
  },
  
  // Performance Metrics
  metrics: {
    employeeCount: { type: Number, default: 0 },
    performanceScore: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 100
    },
    utilizationRate: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 100
    },
    satisfactionScore: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 100
    },
    turnoverRate: { type: Number, default: 0 },
    productivityScore: { type: Number, default: 0 }
  },
  
  // Status & Lifecycle
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived', 'suspended'],
    default: 'active'
  },
  
  // Metadata
  tags: [String],
  goals: [{
    title: String,
    description: String,
    target: Number,
    current: { type: Number, default: 0 },
    deadline: Date,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending'
    }
  }],
  
  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
departmentSchema.virtual('budget.utilizationPercentage').get(function() {
  if (this.budget.allocated === 0) return 0;
  return Number(((this.budget.utilized / this.budget.allocated) * 100).toFixed(2));
});

departmentSchema.virtual('budget.remaining').get(function() {
  return this.budget.allocated - this.budget.utilized;
});

departmentSchema.virtual('employeeDetails', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'department'
});

departmentSchema.virtual('subDepartments', {
  ref: 'Department',
  localField: '_id',
  foreignField: 'parentDepartment'
});

// Indexes for performance
departmentSchema.index({ status: 1, createdAt: -1 });
departmentSchema.index({ 'metrics.performanceScore': -1 });
departmentSchema.index({ parentDepartment: 1 });
departmentSchema.index({ code: 1 }, { unique: true });

// Pre-save middleware
departmentSchema.pre('save', function(next) {
  if (this.isModified('budget') || this.isNew) {
    this.budget.utilized = Math.min(this.budget.utilized, this.budget.allocated);
  }
  next();
});

// Static Methods
departmentSchema.statics.getActiveDepartments = function() {
  return this.find({ status: 'active' })
    .populate('manager', 'firstName lastName email avatar')
    .populate('parentDepartment', 'name code')
    .sort({ name: 1 });
};

departmentSchema.statics.getDepartmentStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalEmployees: { $sum: '$metrics.employeeCount' },
        avgPerformance: { $avg: '$metrics.performanceScore' },
        totalBudget: { $sum: '$budget.allocated' }
      }
    }
  ]);
  
  return stats;
};

// Instance Methods
departmentSchema.methods.updateEmployeeCount = async function() {
  const Employee = mongoose.model('Employee');
  const count = await Employee.countDocuments({ 
    department: this._id, 
    status: 'active' 
  });
  this.metrics.employeeCount = count;
  await this.save();
};

departmentSchema.methods.calculatePerformance = async function() {
  const Employee = mongoose.model('Employee');
  const employees = await Employee.find({ department: this._id });
  
  if (employees.length === 0) {
    this.metrics.performanceScore = 0;
    return;
  }
  
  const avgPerformance = employees.reduce((sum, emp) => 
    sum + (emp.performanceScore || 0), 0) / employees.length;
  
  this.metrics.performanceScore = Number(avgPerformance.toFixed(2));
  await this.save();
};

departmentSchema.methods.getHierarchy = async function() {
  const hierarchy = [];
  let currentDept = this;
  
  while (currentDept) {
    hierarchy.unshift({
      _id: currentDept._id,
      name: currentDept.name,
      code: currentDept.code
    });
    
    if (currentDept.parentDepartment) {
      currentDept = await this.model('Department')
        .findById(currentDept.parentDepartment)
        .select('name code parentDepartment');
    } else {
      currentDept = null;
    }
  }
  
  return hierarchy;
};

// Query Helpers
departmentSchema.query.byStatus = function(status) {
  return this.where({ status });
};

departmentSchema.query.byPerformance = function(minScore = 0) {
  return this.where('metrics.performanceScore').gte(minScore);
};

departmentSchema.query.withBudgetInfo = function() {
  return this.select('name code budget metrics status');
};

module.exports = mongoose.model('Department', departmentSchema);