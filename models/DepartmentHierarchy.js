const mongoose = require('mongoose');

const departmentHierarchySchema = new mongoose.Schema({
  parentDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true
  },
  childDepartments: [{
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    relationshipType: {
      type: String,
      enum: ['direct', 'matrix', 'dotted-line', 'support', 'collaborative'],
      default: 'direct'
    },
    reportingWeight: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    effectiveDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date
  }],
  
  // Hierarchy Configuration
  organizationLevel: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
    max: 10
  },
  maxDepth: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },
  
  // Visualization Data
  chartData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  layout: {
    type: String,
    enum: ['vertical', 'horizontal', 'radial', 'organic'],
    default: 'vertical'
  },
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DepartmentHierarchy'
  },
  
  // Status & Activation
  isActive: {
    type: Boolean,
    default: true
  },
  activationDate: Date,
  deactivationDate: Date,
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Metadata
  tags: [String],
  description: String,
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
departmentHierarchySchema.virtual('childCount').get(function() {
  return this.childDepartments.length;
});

departmentHierarchySchema.virtual('activeChildren').get(function() {
  return this.childDepartments.filter(child => !child.endDate || child.endDate > new Date());
});

// Indexes
departmentHierarchySchema.index({ parentDepartment: 1, isActive: 1 });
departmentHierarchySchema.index({ 'childDepartments.department': 1 });
departmentHierarchySchema.index({ organizationLevel: 1 });

// Static Methods
departmentHierarchySchema.statics.getFullHierarchy = async function() {
  return this.find({ isActive: true })
    .populate('parentDepartment', 'name code manager settings.color')
    .populate('childDepartments.department', 'name code manager metrics.employeeCount metrics.performanceScore status')
    .populate('createdBy', 'firstName lastName email')
    .sort({ organizationLevel: 1 });
};

departmentHierarchySchema.statics.getDepartmentTree = async function(departmentId) {
  const hierarchy = await this.findOne({ 
    parentDepartment: departmentId, 
    isActive: true 
  }).populate('childDepartments.department');
  
  if (!hierarchy) return null;
  
  // Recursively build tree
  const buildTree = async (deptId) => {
    const nodeHierarchy = await this.findOne({ 
      parentDepartment: deptId, 
      isActive: true 
    }).populate('childDepartments.department');
    
    if (!nodeHierarchy) return null;
    
    const children = await Promise.all(
      nodeHierarchy.childDepartments.map(async (child) => ({
        department: child.department,
        relationship: child.relationshipType,
        level: child.level,
        children: await buildTree(child.department._id)
      }))
    );
    
    return children.filter(child => child !== null);
  };
  
  return {
    root: hierarchy.parentDepartment,
    children: await Promise.all(
      hierarchy.childDepartments.map(async (child) => ({
        department: child.department,
        relationship: child.relationshipType,
        level: child.level,
        children: await buildTree(child.department._id)
      }))
    )
  };
};

// Instance Methods
departmentHierarchySchema.methods.isAncestorOf = function(departmentId) {
  return this.childDepartments.some(child => 
    child.department.toString() === departmentId.toString()
  );
};

departmentHierarchySchema.methods.getDirectReports = function() {
  return this.childDepartments
    .filter(child => child.relationshipType === 'direct')
    .map(child => child.department);
};

departmentHierarchySchema.methods.addChildDepartment = async function(childDeptId, options = {}) {
  const existingChild = this.childDepartments.find(
    child => child.department.toString() === childDeptId.toString()
  );
  
  if (existingChild) {
    throw new Error('Department is already a child');
  }
  
  this.childDepartments.push({
    department: childDeptId,
    level: options.level || 1,
    relationshipType: options.relationshipType || 'direct',
    reportingWeight: options.reportingWeight || 100,
    effectiveDate: options.effectiveDate || new Date()
  });
  
  await this.save();
};

departmentHierarchySchema.methods.removeChildDepartment = async function(childDeptId) {
  this.childDepartments = this.childDepartments.filter(
    child => child.department.toString() !== childDeptId.toString()
  );
  
  await this.save();
};

departmentHierarchySchema.methods.updateRelationship = async function(childDeptId, updates) {
  const child = this.childDepartments.find(
    child => child.department.toString() === childDeptId.toString()
  );
  
  if (!child) {
    throw new Error('Child department not found');
  }
  
  Object.assign(child, updates);
  await this.save();
};

// Query Helpers
departmentHierarchySchema.query.active = function() {
  return this.where({ isActive: true });
};

departmentHierarchySchema.query.byLevel = function(level) {
  return this.where({ organizationLevel: level });
};

departmentHierarchySchema.query.withChildren = function() {
  return this.populate('childDepartments.department');
};

module.exports = mongoose.model('DepartmentHierarchy', departmentHierarchySchema);