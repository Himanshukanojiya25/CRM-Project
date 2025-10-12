const Department = require('../../models/Department');
const Employee = require('../../models/Employee');
const DepartmentBudget = require('../../models/DepartmentBudget');
const DepartmentHierarchy = require('../../models/DepartmentHierarchy');
const departmentHelpers = require('../../utils/department/departmentHelpers');

const departmentService = {
  
  // Get departments with advanced filtering
  getDepartments: async (filters = {}) => {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      manager,
      parentDepartment,
      sortBy = 'name',
      sortOrder = 'asc',
      minEmployees,
      maxEmployees,
      minPerformance,
      maxPerformance,
      tags
    } = filters;

    // Build filter object
    let filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'contact.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) filter.status = status;
    if (manager) filter.manager = manager;
    
    if (parentDepartment) {
      filter.parentDepartment = parentDepartment === 'null' ? null : parentDepartment;
    }
    
    if (minEmployees || maxEmployees) {
      filter['metrics.employeeCount'] = {};
      if (minEmployees) filter['metrics.employeeCount'].$gte = parseInt(minEmployees);
      if (maxEmployees) filter['metrics.employeeCount'].$lte = parseInt(maxEmployees);
    }
    
    if (minPerformance || maxPerformance) {
      filter['metrics.performanceScore'] = {};
      if (minPerformance) filter['metrics.performanceScore'].$gte = parseInt(minPerformance);
      if (maxPerformance) filter['metrics.performanceScore'].$lte = parseInt(maxPerformance);
    }
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    // Build sort object
    const sort = {};
    const sortFields = sortBy.split(',');
    const sortOrders = sortOrder.split(',');
    
    sortFields.forEach((field, index) => {
      const order = sortOrders[index] === 'desc' ? -1 : 1;
      sort[field.trim()] = order;
    });

    // Population options
    const populateOptions = [
      { path: 'manager', select: 'firstName lastName email avatar position' },
      { path: 'parentDepartment', select: 'name code' },
      { path: 'assistantManagers', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ];

    const departments = await Department.find(filter)
      .populate(populateOptions)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Department.countDocuments(filter);

    // Calculate statistics
    const stats = await Department.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: '$metrics.employeeCount' },
          avgPerformance: { $avg: '$metrics.performanceScore' },
          totalBudget: { $sum: '$budget.allocated' },
          avgUtilization: { $avg: '$budget.utilizationPercentage' },
          departmentCount: { $sum: 1 }
        }
      }
    ]);

    return {
      departments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      statistics: stats[0] || {
        totalEmployees: 0,
        avgPerformance: 0,
        totalBudget: 0,
        avgUtilization: 0,
        departmentCount: 0
      },
      filters: {
        search,
        status,
        applied: Object.keys(filter).length > 0
      }
    };
  },

  // Get single department by ID
  getDepartmentById: async (id, include = 'basic') => {
    const populateOptions = [
      { path: 'manager', select: 'firstName lastName email avatar position phone' },
      { path: 'parentDepartment', select: 'name code manager' },
      { path: 'assistantManagers', select: 'firstName lastName email position' },
      { path: 'createdBy', select: 'firstName lastName email' },
      { path: 'updatedBy', select: 'firstName lastName email' }
    ];

    if (include === 'detailed' || include === 'full') {
      populateOptions.push(
        { 
          path: 'employeeDetails', 
          select: 'firstName lastName email position status joinDate performanceScore',
          match: { status: 'active' }
        }
      );
    }

    if (include === 'full') {
      populateOptions.push(
        { path: 'subDepartments', select: 'name code metrics.employeeCount' }
      );
    }

    const department = await Department.findById(id)
      .populate(populateOptions)
      .lean();

    if (!department) return null;

    // Enhance with additional data
    if (include === 'full') {
      // Get budget information
      const budget = await DepartmentBudget.findOne({
        department: id,
        fiscalYear: new Date().getFullYear()
      });
      
      // Get hierarchy information
      const hierarchy = await DepartmentHierarchy.findOne({
        parentDepartment: id,
        isActive: true
      }).populate('childDepartments.department', 'name code');

      department.budgetDetails = budget;
      department.hierarchy = hierarchy;
      
      // Calculate real-time metrics
      department.realTimeMetrics = await departmentHelpers.calculateRealTimeMetrics(id);
    }

    return department;
  },

  // Create new department
  createDepartment: async (departmentData) => {
    const department = new Department(departmentData);
    await department.save();

    // Create initial budget record
    const budget = new DepartmentBudget({
      department: department._id,
      fiscalYear: new Date().getFullYear(),
      allocatedBudget: departmentData.budget?.allocated || 0,
      createdBy: departmentData.createdBy
    });
    await budget.save();

    // Update hierarchy if parent department is specified
    if (departmentData.parentDepartment) {
      await departmentHelpers.updateDepartmentHierarchy(
        departmentData.parentDepartment,
        department._id,
        'direct',
        1,
        departmentData.createdBy
      );
    }

    return department.populate([
      { path: 'manager', select: 'firstName lastName email' },
      { path: 'parentDepartment', select: 'name code' }
    ]);
  },

  // Update department
  updateDepartment: async (id, updateData) => {
    const department = await Department.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate([
      { path: 'manager', select: 'firstName lastName email' },
      { path: 'parentDepartment', select: 'name code' },
      { path: 'assistantManagers', select: 'firstName lastName email' }
    ]);

    if (department && updateData.budget) {
      // Update budget record
      await DepartmentBudget.findOneAndUpdate(
        { department: id, fiscalYear: new Date().getFullYear() },
        { 
          allocatedBudget: updateData.budget.allocated,
          updatedBy: updateData.updatedBy
        },
        { upsert: true, new: true }
      );
    }

    return department;
  },

  // Delete department (soft delete)
  deleteDepartment: async (id, permanent = false, userId) => {
    const department = await Department.findById(id);
    
    if (!department) {
      return {
        success: false,
        message: 'Department not found',
        code: 'DEPARTMENT_NOT_FOUND'
      };
    }

    if (permanent) {
      // Check if department has employees
      const employeeCount = await Employee.countDocuments({ department: id });
      if (employeeCount > 0) {
        return {
          success: false,
          message: 'Cannot delete department with active employees',
          code: 'DEPARTMENT_HAS_EMPLOYEES'
        };
      }

      await Department.findByIdAndDelete(id);
      await DepartmentBudget.deleteMany({ department: id });
      await DepartmentHierarchy.updateMany(
        { $or: [{ parentDepartment: id }, { 'childDepartments.department': id }] },
        { $pull: { childDepartments: { department: id } } }
      );

      return {
        success: true,
        message: 'Department permanently deleted',
        department: null
      };
    } else {
      // Soft delete (archive)
      department.status = 'archived';
      department.updatedBy = userId;
      await department.save();

      return {
        success: true,
        message: 'Department archived successfully',
        department
      };
    }
  },

  // Restore archived department
  restoreDepartment: async (id, userId) => {
    const department = await Department.findOne({ _id: id, status: 'archived' });
    
    if (!department) return null;

    department.status = 'active';
    department.updatedBy = userId;
    await department.save();

    return department;
  },

  // Get department analytics
  getDepartmentAnalytics: async (id, period = '30d') => {
    const department = await Department.findById(id);
    if (!department) return null;

    const employees = await Employee.find({ department: id });
    const employeeIds = employees.map(emp => emp._id);

    // Calculate period dates
    const { startDate, endDate } = departmentHelpers.calculatePeriodDates(period);

    // Get comprehensive analytics
    const analytics = {
      overview: await departmentHelpers.getDepartmentOverview(department, employees),
      performance: await departmentHelpers.getPerformanceAnalytics(department, employees, period),
      budget: await departmentHelpers.getBudgetAnalytics(department, period),
      attendance: await departmentHelpers.getAttendanceAnalytics(employeeIds, startDate, endDate),
      workforce: await departmentHelpers.getWorkforceAnalytics(employees),
      trends: await departmentHelpers.getTrendAnalytics(id, period),
      recommendations: departmentHelpers.generateRecommendations(department, employees)
    };

    return analytics;
  },

  // Bulk update departments
  bulkUpdateDepartments: async (departmentIds, updateData, userId) => {
    const results = {
      updatedCount: 0,
      failedCount: 0,
      errors: []
    };

    for (const deptId of departmentIds) {
      try {
        updateData.updatedBy = userId;
        await Department.findByIdAndUpdate(deptId, updateData, { runValidators: true });
        results.updatedCount++;
      } catch (error) {
        results.failedCount++;
        results.errors.push({
          departmentId: deptId,
          error: error.message
        });
      }
    }

    return results;
  },

  // Export departments data
  exportDepartments: async (filters = {}, format = 'json') => {
    const { departments } = await departmentService.getDepartments({
      ...filters,
      limit: 1000 // Export limit
    });

    if (format === 'csv') {
      return departmentHelpers.convertToCSV(departments);
    }

    if (format === 'excel') {
      return departmentHelpers.convertToExcel(departments);
    }

    return departments;
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const stats = await Department.aggregate([
      {
        $group: {
          _id: null,
          totalDepartments: { $sum: 1 },
          activeDepartments: { 
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
          },
          totalEmployees: { $sum: '$metrics.employeeCount' },
          totalBudget: { $sum: '$budget.allocated' },
          avgPerformance: { $avg: '$metrics.performanceScore' },
          avgUtilization: { $avg: '$budget.utilizationPercentage' }
        }
      }
    ]);

    const statusDistribution = await Department.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const performanceDistribution = await Department.aggregate([
      {
        $bucket: {
          groupBy: '$metrics.performanceScore',
          boundaries: [0, 50, 70, 85, 100],
          default: 'other',
          output: {
            count: { $sum: 1 },
            avgEmployees: { $avg: '$metrics.employeeCount' }
          }
        }
      }
    ]);

    return {
      overview: stats[0] || {
        totalDepartments: 0,
        activeDepartments: 0,
        totalEmployees: 0,
        totalBudget: 0,
        avgPerformance: 0,
        avgUtilization: 0
      },
      statusDistribution,
      performanceDistribution,
      recentActivity: await departmentHelpers.getRecentDepartmentActivity()
    };
  },

  // Search departments
  searchDepartments: async (query, field = 'all', limit = 10) => {
    let searchFilter = {};

    switch (field) {
      case 'name':
        searchFilter.name = { $regex: query, $options: 'i' };
        break;
      case 'code':
        searchFilter.code = { $regex: query, $options: 'i' };
        break;
      case 'manager':
        const managers = await Employee.find({
          $or: [
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } }
          ]
        }).select('_id');
        
        searchFilter.manager = { $in: managers.map(m => m._id) };
        break;
      default:
        searchFilter.$or = [
          { name: { $regex: query, $options: 'i' } },
          { code: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ];
    }

    return Department.find(searchFilter)
      .populate('manager', 'firstName lastName email')
      .populate('parentDepartment', 'name code')
      .limit(limit)
      .select('name code manager metrics.employeeCount metrics.performanceScore status')
      .lean();
  },

  // Update department hierarchy
  updateDepartmentHierarchy: async (departmentId, parentDepartmentId, relationshipType = 'direct', level = 1, userId) => {
    try {
      // Check for circular reference
      if (parentDepartmentId) {
        const isCircular = await departmentHelpers.checkCircularReference(departmentId, parentDepartmentId);
        if (isCircular) {
          return {
            success: false,
            message: 'Circular reference detected in department hierarchy',
            code: 'CIRCULAR_REFERENCE'
          };
        }
      }

      // Update department's parent
      const department = await Department.findByIdAndUpdate(
        departmentId,
        { 
          parentDepartment: parentDepartmentId,
          updatedBy: userId
        },
        { new: true }
      ).populate('parentDepartment', 'name code');

      if (!department) {
        return {
          success: false,
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND'
        };
      }

      // Update hierarchy records
      if (parentDepartmentId) {
        await departmentHelpers.addChildToParent(parentDepartmentId, departmentId, relationshipType, level, userId);
      }

      // Remove from previous parent
      await DepartmentHierarchy.updateMany(
        { 'childDepartments.department': departmentId },
        { $pull: { childDepartments: { department: departmentId } } }
      );

      return {
        success: true,
        message: 'Department hierarchy updated successfully',
        department
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        code: 'HIERARCHY_UPDATE_FAILED'
      };
    }
  },

  // Get department employees
  getDepartmentEmployees: async (departmentId, page = 1, limit = 10, status = 'active') => {
    const department = await Department.findById(departmentId).select('name code');
    if (!department) return null;

    const employeeFilter = { department: departmentId };
    if (status !== 'all') {
      employeeFilter.status = status;
    }

    const employees = await Employee.find(employeeFilter)
      .select('firstName lastName email position department status joinDate performanceScore avatar')
      .populate('position', 'title level')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ firstName: 1, lastName: 1 });

    const total = await Employee.countDocuments(employeeFilter);

    return {
      employees,
      department,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      },
      employeeCount: total
    };
  },

  // Get departments for dropdown
  getDepartmentsForDropdown: async (includeArchived = false) => {
    const filter = includeArchived ? {} : { status: 'active' };
    
    return Department.find(filter)
      .select('name code parentDepartment settings.color')
      .populate('parentDepartment', 'name code')
      .sort({ name: 1 })
      .lean();
  },

  // Sync department metrics
  syncDepartmentMetrics: async (departmentId = null) => {
    const filter = departmentId ? { _id: departmentId } : { status: 'active' };
    const departments = await Department.find(filter);

    for (const department of departments) {
      await department.updateEmployeeCount();
      await department.calculatePerformance();
    }

    return {
      synced: departments.length,
      timestamp: new Date()
    };
  }
};

module.exports = departmentService;