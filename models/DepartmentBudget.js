const mongoose = require('mongoose');

const departmentBudgetSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true
  },
  fiscalYear: {
    type: Number,
    required: true,
    min: [2000, 'Fiscal year must be after 2000'],
    max: [2100, 'Fiscal year cannot exceed 2100'],
    default: new Date().getFullYear()
  },
  
  // Budget Allocation
  allocatedBudget: {
    type: Number,
    required: true,
    min: [0, 'Budget cannot be negative'],
    default: 0
  },
  utilizedBudget: {
    type: Number,
    default: 0,
    min: [0, 'Utilized budget cannot be negative']
  },
  
  // Budget Categories
  categories: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    allocated: {
      type: Number,
      required: true,
      min: 0
    },
    utilized: {
      type: Number,
      default: 0,
      min: 0
    },
    description: String,
    color: {
      type: String,
      default: '#3B82F6'
    },
    status: {
      type: String,
      enum: ['on-track', 'over-budget', 'under-utilized'],
      default: 'on-track'
    }
  }],
  
  // Budget Timeline
  timeline: {
    planning: { type: Date, default: Date.now },
    approval: Date,
    execution: Date,
    closure: Date
  },
  
  // Approval Workflow
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under-review', 'approved', 'rejected', 'active', 'closed', 'cancelled'],
    default: 'draft'
  },
  approvalHistory: [{
    action: String,
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: { type: Date, default: Date.now },
    comments: String,
    status: String
  }],
  
  // Financial Metrics
  metrics: {
    utilizationRate: Number,
    costPerEmployee: Number,
    roi: Number,
    variance: Number,
    forecast: Number
  },
  
  // Documents & Attachments
  documents: [{
    name: String,
    fileUrl: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: { type: Date, default: Date.now },
    size: Number,
    type: String
  }],
  
  // Notes & Comments
  notes: String,
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date
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
departmentBudgetSchema.virtual('utilizationPercentage').get(function() {
  if (this.allocatedBudget === 0) return 0;
  return Number(((this.utilizedBudget / this.allocatedBudget) * 100).toFixed(2));
});

departmentBudgetSchema.virtual('remainingBudget').get(function() {
  return this.allocatedBudget - this.utilizedBudget);
});

departmentBudgetSchema.virtual('isOverBudget').get(function() {
  return this.utilizedBudget > this.allocatedBudget;
});

departmentBudgetSchema.virtual('monthlyAllocation').get(function() {
  return this.allocatedBudget / 12;
});

// Indexes
departmentBudgetSchema.index({ department: 1, fiscalYear: 1 }, { unique: true });
departmentBudgetSchema.index({ status: 1 });
departmentBudgetSchema.index({ 'timeline.planning': 1 });

// Pre-save middleware
departmentBudgetSchema.pre('save', function(next) {
  // Calculate category utilization
  this.categories.forEach(category => {
    const utilization = (category.utilized / category.allocated) * 100;
    if (utilization > 100) category.status = 'over-budget';
    else if (utilization < 50) category.status = 'under-utilized';
    else category.status = 'on-track';
  });
  
  // Update overall utilization rate
  this.metrics.utilizationRate = this.utilizationPercentage;
  
  next();
});

// Static Methods
departmentBudgetSchema.statics.getBudgetSummary = async function(fiscalYear) {
  const matchStage = fiscalYear ? { fiscalYear } : {};
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        totalAllocated: { $sum: '$allocatedBudget' },
        totalUtilized: { $sum: '$utilizedBudget' },
        count: { $sum: 1 },
        avgUtilization: { $avg: '$metrics.utilizationRate' }
      }
    }
  ]);
};

departmentBudgetSchema.statics.getDepartmentBudgets = async function(departmentId) {
  return this.find({ department: departmentId })
    .populate('createdBy', 'firstName lastName email')
    .sort({ fiscalYear: -1 });
};

// Instance Methods
departmentBudgetSchema.methods.addExpense = async function(categoryName, amount) {
  const category = this.categories.find(cat => cat.name === categoryName);
  if (!category) {
    throw new Error(`Category ${categoryName} not found`);
  }
  
  category.utilized += amount;
  this.utilizedBudget += amount;
  
  await this.save();
};

departmentBudgetSchema.methods.getCategoryUtilization = function(categoryName) {
  const category = this.categories.find(cat => cat.name === categoryName);
  if (!category || category.allocated === 0) return 0;
  return (category.utilized / category.allocated) * 100;
};

departmentBudgetSchema.methods.forecastRemaining = function() {
  const currentMonth = new Date().getMonth() + 1;
  const remainingMonths = 12 - currentMonth;
  const monthlySpend = this.utilizedBudget / currentMonth;
  
  return {
    projectedYearEnd: this.utilizedBudget + (monthlySpend * remainingMonths),
    monthlyAverage: monthlySpend,
    remainingMonths: remainingMonths
  };
};

module.exports = mongoose.model('DepartmentBudget', departmentBudgetSchema);