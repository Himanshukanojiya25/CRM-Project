const Department = require('../../models/Department');
const DepartmentHierarchy = require('../../models/DepartmentHierarchy');
const departmentService = require('../../services/admin/departmentService');
const departmentHelpers = require('../../utils/department/departmentHelpers');

const departmentHierarchyController = {
  
  // Get organization chart data
  getOrganizationChart: async (req, res) => {
    try {
      const { layout = 'vertical', depth = 3, includeMetrics = false } = req.query;

      const hierarchies = await DepartmentHierarchy.getFullHierarchy();

      const chartData = departmentHelpers.buildHierarchy(hierarchies, {
        layout,
        maxDepth: parseInt(depth),
        includeMetrics: includeMetrics === 'true'
      });

      res.json({
        success: true,
        data: chartData,
        metadata: {
          layout: layout,
          depth: depth,
          totalDepartments: chartData.totalDepartments,
          totalEmployees: chartData.totalEmployees,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Organization chart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate organization chart',
        error: error.message,
        code: 'ORG_CHART_ERROR'
      });
    }
  },

  // Get department tree for dropdowns and navigation
  getDepartmentTree: async (req, res) => {
    try {
      const { format = 'nested', includeArchived = false } = req.query;

      const departments = await Department.find({
        status: includeArchived === 'true' ? { $in: ['active', 'archived'] } : 'active'
      })
        .select('name code parentDepartment settings.color metrics.employeeCount')
        .populate('parentDepartment', 'name code')
        .sort({ name: 1 });

      let treeData;
      
      if (format === 'flat') {
        treeData = departmentHelpers.buildFlatTree(departments);
      } else if (format === 'select') {
        treeData = departmentHelpers.buildSelectTree(departments);
      } else {
        treeData = departmentHelpers.buildNestedTree(departments);
      }

      res.json({
        success: true,
        data: treeData,
        metadata: {
          format: format,
          departmentCount: departments.length,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Department tree error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate department tree',
        error: error.message,
        code: 'DEPARTMENT_TREE_ERROR'
      });
    }
  },

  // Update department hierarchy
  updateHierarchy: async (req, res) => {
    try {
      const { departmentId, parentDepartmentId, relationshipType, level, notes } = req.body;

      const result = await departmentService.updateDepartmentHierarchy(
        departmentId, 
        parentDepartmentId, 
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
          parentDepartment: parentDepartmentId,
          relationshipType: relationshipType,
          level: level,
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

  // Get department lineage (ancestors and descendants)
  getDepartmentLineage: async (req, res) => {
    try {
      const departmentId = req.params.id;
      const { includeSiblings = false } = req.query;

      const department = await Department.findById(departmentId);
      
      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND'
        });
      }

      const lineage = await departmentHelpers.getDepartmentLineage(departmentId, includeSiblings === 'true');

      res.json({
        success: true,
        data: lineage,
        metadata: {
          department: department.name,
          depth: lineage.ancestors.length,
          descendantCount: lineage.descendants.length,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Department lineage error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch department lineage',
        error: error.message,
        code: 'LINEAGE_ERROR'
      });
    }
  },

  // Bulk update hierarchy
  bulkUpdateHierarchy: async (req, res) => {
    try {
      const { updates } = req.body;

      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({
          success: false,
          message: 'Updates array is required',
          code: 'INVALID_INPUT'
        });
      }

      const results = {
        successful: 0,
        failed: 0,
        errors: []
      };

      for (const update of updates) {
        try {
          const result = await departmentService.updateDepartmentHierarchy(
            update.departmentId,
            update.parentDepartmentId,
            update.relationshipType,
            update.level,
            req.user._id
          );

          if (result.success) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push({
              departmentId: update.departmentId,
              error: result.message
            });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            departmentId: update.departmentId,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        data: results,
        metadata: {
          total: updates.length,
          successful: results.successful,
          failed: results.failed,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('Bulk hierarchy update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk hierarchy update',
        error: error.message,
        code: 'BULK_HIERARCHY_ERROR'
      });
    }
  },

  // Get hierarchy statistics
  getHierarchyStats: async (req, res) => {
    try {
      const stats = await departmentHelpers.getHierarchyStatistics();

      res.json({
        success: true,
        data: stats,
        metadata: {
          generatedAt: new Date(),
          totalDepartments: stats.totalDepartments,
          maxDepth: stats.maxDepth
        }
      });

    } catch (error) {
      console.error('Hierarchy stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch hierarchy statistics',
        error: error.message,
        code: 'HIERARCHY_STATS_ERROR'
      });
    }
  },

  // Search departments in hierarchy
  searchInHierarchy: async (req, res) => {
    try {
      const { q, scope = 'all', limit = 20 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long',
          code: 'INVALID_QUERY'
        });
      }

      const results = await departmentHelpers.searchInHierarchy(q, scope, parseInt(limit));

      res.json({
        success: true,
        data: results,
        metadata: {
          query: q,
          scope: scope,
          resultCount: results.length,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('Hierarchy search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search in hierarchy',
        error: error.message,
        code: 'HIERARCHY_SEARCH_ERROR'
      });
    }
  },

  // Export hierarchy data
  exportHierarchy: async (req, res) => {
    try {
      const { format = 'json', includeDetails = false } = req.query;

      const exportData = await departmentHelpers.exportHierarchyData(format, includeDetails === 'true');

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=department-hierarchy-${Date.now()}.csv`);
        return res.send(exportData);
      }

      if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=department-hierarchy-${Date.now()}.xlsx`);
        return res.send(exportData);
      }

      res.json({
        success: true,
        data: exportData,
        metadata: {
          format: format,
          includesDetails: includeDetails === 'true',
          exportedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Hierarchy export error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export hierarchy data',
        error: error.message,
        code: 'HIERARCHY_EXPORT_ERROR'
      });
    }
  },

  // Validate hierarchy for issues
  validateHierarchy: async (req, res) => {
    try {
      const issues = await departmentHelpers.validateHierarchy();

      res.json({
        success: true,
        data: issues,
        metadata: {
          totalIssues: issues.length,
          criticalCount: issues.filter(issue => issue.severity === 'critical').length,
          warningCount: issues.filter(issue => issue.severity === 'warning').length,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Hierarchy validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate hierarchy',
        error: error.message,
        code: 'HIERARCHY_VALIDATION_ERROR'
      });
    }
  },

  // Get department relationships
  getDepartmentRelationships: async (req, res) => {
    try {
      const departmentId = req.params.id;

      const relationships = await departmentHelpers.getDepartmentRelationships(departmentId);

      res.json({
        success: true,
        data: relationships,
        metadata: {
          departmentId: departmentId,
          relationshipCount: Object.keys(relationships).length,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Department relationships error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch department relationships',
        error: error.message,
        code: 'RELATIONSHIPS_ERROR'
      });
    }
  }
};

module.exports = departmentHierarchyController;