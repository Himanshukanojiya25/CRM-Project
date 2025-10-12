const Department = require('../../models/Department');
const Employee = require('../../models/Employee');
const DepartmentBudget = require('../../models/DepartmentBudget');
const DepartmentHierarchy = require('../../models/DepartmentHierarchy');
const { validationResult } = require('express-validator');
const departmentService = require('../../services/admin/departmentService');
const departmentHelpers = require('../../utils/department/departmentHelpers');

const departmentController = {
  
  // Get all departments with advanced filtering, sorting, and pagination
  getAllDepartments: async (req, res) => {
    try {
      const result = await departmentService.getDepartments(req.query);
      
      res.json({
        success: true,
        data: result.departments,
        pagination: result.pagination,
        statistics: result.statistics,
        filters: result.filters
      });
    } catch (error) {
      console.error('Get departments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch departments',
        error: error.message,
        code: 'DEPARTMENT_FETCH_ERROR'
      });
    }
  },

  // Get single department with comprehensive details
  getDepartmentById: async (req, res) => {
    try {
      const { id } = req.params;
      const { include = 'basic' } = req.query;

      const department = await departmentService.getDepartmentById(id, include);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: department,
        metadata: {
          retrievedAt: new Date(),
          includes: include
        }
      });
    } catch (error) {
      console.error('Get department error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch department',
        error: error.message,
        code: 'DEPARTMENT_FETCH_ERROR'
      });
    }
  },

  // Create new department with comprehensive validation
  createDepartment: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const departmentData = {
        ...req.body,
        code: req.body.code.toUpperCase(),
        createdBy: req.user._id
      };

      const department = await departmentService.createDepartment(departmentData);

      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: department,
        metadata: {
          created: true,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Create department error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Department code already exists',
          code: 'DUPLICATE_CODE'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create department',
        error: error.message,
        code: 'DEPARTMENT_CREATE_ERROR'
      });
    }
  },

  // Update department with comprehensive handling
  updateDepartment: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { id } = req.params;
      const updateData = { 
        ...req.body,
        updatedBy: req.user._id
      };

      if (req.body.code) {
        updateData.code = req.body.code.toUpperCase();
      }

      const department = await departmentService.updateDepartment(id, updateData);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Department updated successfully',
        data: department,
        metadata: {
          updated: true,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Update department error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Department code already exists',
          code: 'DUPLICATE_CODE'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to update department',
        error: error.message,
        code: 'DEPARTMENT_UPDATE_ERROR'
      });
    }
  },

  // Delete department (soft delete with archiving)
  deleteDepartment: async (req, res) => {
    try {
      const { id } = req.params;
      const { permanent = false } = req.query;

      const result = await departmentService.deleteDepartment(id, permanent, req.user._id);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
          code: result.code
        });
      }

      res.json({
        success: true,
        message: result.message,
        data: result.department,
        metadata: {
          deleted: true,
          permanent: permanent,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Delete department error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete department',
        error: error.message,
        code: 'DEPARTMENT_DELETE_ERROR'
      });
    }
  },

  // Restore archived department
  restoreDepartment: async (req, res) => {
    try {
      const { id } = req.params;

      const department = await departmentService.restoreDepartment(id, req.user._id);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found or not archived',
          code: 'DEPARTMENT_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Department restored successfully',
        data: department,
        metadata: {
          restored: true,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Restore department error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restore department',
        error: error.message,
        code: 'DEPARTMENT_RESTORE_ERROR'
      });
    }
  },

  // Get department analytics
  getDepartmentAnalytics: async (req, res) => {
    try {
      const { id } = req.params;
      const { period = '30d' } = req.query;

      const analytics = await departmentService.getDepartmentAnalytics(id, period);

      if (!analytics) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: analytics,
        metadata: {
          period: period,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Department analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate department analytics',
        error: error.message,
        code: 'ANALYTICS_ERROR'
      });
    }
  },

  // Bulk operations
  bulkUpdateDepartments: async (req, res) => {
    try {
      const { departmentIds, updateData } = req.body;

      if (!departmentIds || !Array.isArray(departmentIds) || departmentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Department IDs are required',
          code: 'INVALID_INPUT'
        });
      }

      const result = await departmentService.bulkUpdateDepartments(
        departmentIds, 
        updateData, 
        req.user._id
      );

      res.json({
        success: true,
        message: `Successfully updated ${result.updatedCount} departments`,
        data: result,
        metadata: {
          total: departmentIds.length,
          updated: result.updatedCount,
          failed: result.failedCount,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Bulk update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk update',
        error: error.message,
        code: 'BULK_UPDATE_ERROR'
      });
    }
  },

  // Export departments data
  exportDepartments: async (req, res) => {
    try {
      const { format = 'json', ...filters } = req.query;

      const exportData = await departmentService.exportDepartments(filters, format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=departments-${Date.now()}.csv`);
        return res.send(exportData);
      }

      if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=departments-${Date.now()}.xlsx`);
        return res.send(exportData);
      }

      res.json({
        success: true,
        data: exportData,
        metadata: {
          format: format,
          exportedAt: new Date(),
          recordCount: exportData.length
        }
      });
    } catch (error) {
      console.error('Export departments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export departments',
        error: error.message,
        code: 'EXPORT_ERROR'
      });
    }
  },

  // Get department dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      const stats = await departmentService.getDashboardStats();

      res.json({
        success: true,
        data: stats,
        metadata: {
          generatedAt: new Date(),
          period: 'all-time'
        }
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: error.message,
        code: 'STATS_ERROR'
      });
    }
  },

  // Search departments with advanced options
  searchDepartments: async (req, res) => {
    try {
      const { q, field = 'all', limit = 10 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long',
          code: 'INVALID_QUERY'
        });
      }

      const results = await departmentService.searchDepartments(q, field, parseInt(limit));

      res.json({
        success: true,
        data: results,
        metadata: {
          query: q,
          field: field,
          resultCount: results.length,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Search departments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search departments',
        error: error.message,
        code: 'SEARCH_ERROR'
      });
    }
  },

  // Update department hierarchy
  updateDepartmentHierarchy: async (req, res) => {
    try {
      const { id } = req.params;
      const { parentDepartment, relationshipType, level } = req.body;

      const result = await departmentService.updateDepartmentHierarchy(
        id, 
        parentDepartment, 
        relationshipType, 
        level, 
        req.user._id
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          code: result.code
        });
      }

      res.json({
        success: true,
        message: 'Department hierarchy updated successfully',
        data: result.department,
        metadata: {
          updated: true,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Update hierarchy error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update department hierarchy',
        error: error.message,
        code: 'HIERARCHY_UPDATE_ERROR'
      });
    }
  },

  // Get department employees with pagination
  getDepartmentEmployees: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, status = 'active' } = req.query;

      const result = await departmentService.getDepartmentEmployees(
        id, 
        parseInt(page), 
        parseInt(limit), 
        status
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: result.employees,
        pagination: result.pagination,
        department: result.department,
        metadata: {
          employeeCount: result.employeeCount,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Get department employees error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch department employees',
        error: error.message,
        code: 'EMPLOYEES_FETCH_ERROR'
      });
    }
  }
};

module.exports = departmentController;