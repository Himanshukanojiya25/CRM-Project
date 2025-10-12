const Department = require('../../models/Department');
const DepartmentBudget = require('../../models/DepartmentBudget');
const departmentService = require('../../services/admin/departmentService');
const departmentHelpers = require('../../utils/department/departmentHelpers');

const departmentBudgetController = {
  
  // Allocate budget to department
  allocateBudget: async (req, res) => {
    try {
      const { departmentId, allocatedAmount, fiscalYear, categories, notes } = req.body;
      
      const department = await Department.findById(departmentId);
      
      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND'
        });
      }

      // Check if budget already exists for this fiscal year
      const existingBudget = await DepartmentBudget.findOne({
        department: departmentId,
        fiscalYear: fiscalYear || new Date().getFullYear()
      });

      let budget;
      
      if (existingBudget) {
        // Update existing budget
        existingBudget.allocatedBudget = allocatedAmount;
        existingBudget.categories = categories || existingBudget.categories;
        existingBudget.notes = notes;
        existingBudget.updatedBy = req.user._id;
        existingBudget.status = 'approved';
        
        budget = await existingBudget.save();
      } else {
        // Create new budget
        budget = new DepartmentBudget({
          department: departmentId,
          allocatedBudget: allocatedAmount,
          fiscalYear: fiscalYear || new Date().getFullYear(),
          categories: categories || [],
          notes: notes,
          status: 'approved',
          timeline: {
            planning: new Date(),
            approval: new Date()
          },
          createdBy: req.user._id
        });
        
        await budget.save();
      }

      // Update department's budget information
      department.budget = {
        allocated: allocatedAmount,
        utilized: department.budget.utilized || 0,
        fiscalYear: fiscalYear || new Date().getFullYear()
      };
      await department.save();

      res.json({
        success: true,
        message: 'Budget allocated successfully',
        data: budget,
        metadata: {
          department: department.name,
          fiscalYear: budget.fiscalYear,
          allocated: budget.allocatedBudget,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('Budget allocation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to allocate budget',
        error: error.message,
        code: 'BUDGET_ALLOCATION_ERROR'
      });
    }
  },

  // Update budget utilization
  updateBudgetUtilization: async (req, res) => {
    try {
      const { departmentId, utilizedAmount, categoryUtilizations, notes } = req.body;
      
      const department = await Department.findById(departmentId);
      
      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND'
        });
      }

      const currentYear = new Date().getFullYear();
      let budget = await DepartmentBudget.findOne({
        department: departmentId,
        fiscalYear: currentYear
      });

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found for current fiscal year',
          code: 'BUDGET_NOT_FOUND'
        });
      }

      // Update overall utilization
      budget.utilizedBudget = utilizedAmount;
      budget.updatedBy = req.user._id;
      
      // Update category utilizations if provided
      if (categoryUtilizations && Array.isArray(categoryUtilizations)) {
        categoryUtilizations.forEach(catUtil => {
          const category = budget.categories.find(cat => cat.name === catUtil.name);
          if (category) {
            category.utilized = catUtil.utilized;
          }
        });
      }

      await budget.save();

      // Update department's budget utilization
      department.budget.utilized = utilizedAmount;
      await department.save();

      res.json({
        success: true,
        message: 'Budget utilization updated successfully',
        data: budget,
        metadata: {
          utilizationRate: budget.utilizationPercentage,
          remainingBudget: budget.remainingBudget,
          isOverBudget: budget.isOverBudget,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('Budget utilization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update budget utilization',
        error: error.message,
        code: 'BUDGET_UTILIZATION_ERROR'
      });
    }
  },

  // Get budget reports with advanced analytics
  getBudgetReports: async (req, res) => {
    try {
      const { departmentId, year } = req.params;
      const { includeForecast = false, includeHistory = false } = req.query;
      
      const department = await Department.findById(departmentId);
      
      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND'
        });
      }

      const fiscalYear = parseInt(year) || new Date().getFullYear();
      const budget = await DepartmentBudget.findOne({
        department: departmentId,
        fiscalYear: fiscalYear
      });

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: `Budget not found for fiscal year ${fiscalYear}`,
          code: 'BUDGET_NOT_FOUND'
        });
      }

      // Generate comprehensive reports
      const reports = {
        department: {
          _id: department._id,
          name: department.name,
          code: department.code,
          manager: department.manager
        },
        budget: {
          allocated: budget.allocatedBudget,
          utilized: budget.utilizedBudget,
          remaining: budget.remainingBudget,
          utilizationRate: budget.utilizationPercentage,
          status: budget.status,
          fiscalYear: budget.fiscalYear
        },
        categories: budget.categories.map(cat => ({
          name: cat.name,
          allocated: cat.allocated,
          utilized: cat.utilized,
          remaining: cat.allocated - cat.utilized,
          utilizationRate: cat.allocated > 0 ? (cat.utilized / cat.allocated) * 100 : 0,
          status: cat.status,
          color: cat.color
        })),
        utilization: {
          percentage: budget.utilizationPercentage,
          status: departmentHelpers.getBudgetStatus(budget.utilizationPercentage),
          remaining: budget.remainingBudget,
          monthlyBreakdown: await departmentHelpers.getMonthlyBudgetBreakdown(departmentId, fiscalYear),
          categoryBreakdown: budget.categories.reduce((acc, cat) => {
            acc[cat.name] = {
              utilized: cat.utilized,
              allocated: cat.allocated,
              percentage: (cat.utilized / cat.allocated) * 100
            };
            return acc;
          }, {})
        },
        trends: await departmentHelpers.generateBudgetTrends(departmentId, fiscalYear, includeHistory),
        recommendations: departmentHelpers.generateBudgetRecommendations(budget),
        alerts: departmentHelpers.generateBudgetAlerts(budget)
      };

      // Include forecast if requested
      if (includeForecast === 'true') {
        reports.forecast = budget.forecastRemaining();
      }

      // Include budget history if requested
      if (includeHistory === 'true') {
        reports.history = await DepartmentBudget.find({
          department: departmentId,
          fiscalYear: { $lt: fiscalYear }
        }).sort({ fiscalYear: -1 }).limit(5);
      }

      res.json({
        success: true,
        data: reports,
        metadata: {
          fiscalYear: fiscalYear,
          reportType: 'budget',
          generatedAt: new Date(),
          includes: {
            forecast: includeForecast === 'true',
            history: includeHistory === 'true'
          }
        }
      });

    } catch (error) {
      console.error('Budget reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate budget reports',
        error: error.message,
        code: 'BUDGET_REPORTS_ERROR'
      });
    }
  },

  // Submit budget for approval
  submitBudgetForApproval: async (req, res) => {
    try {
      const { departmentId, fiscalYear } = req.body;
      
      const budget = await DepartmentBudget.findOne({
        department: departmentId,
        fiscalYear: fiscalYear || new Date().getFullYear()
      });

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found',
          code: 'BUDGET_NOT_FOUND'
        });
      }

      if (budget.status !== 'draft') {
        return res.status(400).json({
          success: false,
          message: `Budget is already in ${budget.status} status`,
          code: 'INVALID_BUDGET_STATUS'
        });
      }

      budget.status = 'submitted';
      budget.timeline.submission = new Date();
      budget.updatedBy = req.user._id;
      
      // Add to approval history
      budget.approvalHistory.push({
        action: 'submitted',
        by: req.user._id,
        date: new Date(),
        comments: 'Budget submitted for approval',
        status: 'submitted'
      });

      await budget.save();

      res.json({
        success: true,
        message: 'Budget submitted for approval successfully',
        data: budget,
        metadata: {
          currentStatus: budget.status,
          submittedAt: budget.timeline.submission,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('Budget submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit budget for approval',
        error: error.message,
        code: 'BUDGET_SUBMISSION_ERROR'
      });
    }
  },

  // Approve/reject budget
  reviewBudget: async (req, res) => {
    try {
      const { departmentId, fiscalYear, action, comments } = req.body;
      
      if (!['approved', 'rejected'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Action must be either "approved" or "rejected"',
          code: 'INVALID_ACTION'
        });
      }

      const budget = await DepartmentBudget.findOne({
        department: departmentId,
        fiscalYear: fiscalYear || new Date().getFullYear()
      });

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found',
          code: 'BUDGET_NOT_FOUND'
        });
      }

      if (budget.status !== 'submitted' && budget.status !== 'under-review') {
        return res.status(400).json({
          success: false,
          message: `Budget cannot be ${action} from current status: ${budget.status}`,
          code: 'INVALID_BUDGET_STATUS'
        });
      }

      budget.status = action;
      budget.timeline.approval = new Date();
      budget.updatedBy = req.user._id;
      
      // Add to approval history
      budget.approvalHistory.push({
        action: action,
        by: req.user._id,
        date: new Date(),
        comments: comments || `Budget ${action}`,
        status: action
      });

      await budget.save();

      // If approved, update department budget
      if (action === 'approved') {
        const department = await Department.findById(departmentId);
        if (department) {
          department.budget = {
            allocated: budget.allocatedBudget,
            utilized: department.budget.utilized || 0,
            fiscalYear: budget.fiscalYear
          };
          await department.save();
        }
      }

      res.json({
        success: true,
        message: `Budget ${action} successfully`,
        data: budget,
        metadata: {
          currentStatus: budget.status,
          reviewedBy: req.user._id,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('Budget review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to review budget',
        error: error.message,
        code: 'BUDGET_REVIEW_ERROR'
      });
    }
  },

  // Get budget overview for multiple departments
  getBudgetOverview: async (req, res) => {
    try {
      const { fiscalYear, departments, status } = req.query;
      
      const filter = {};
      if (fiscalYear) filter.fiscalYear = parseInt(fiscalYear);
      if (departments) {
        const deptArray = Array.isArray(departments) ? departments : [departments];
        filter.department = { $in: deptArray };
      }
      if (status) filter.status = status;

      const budgets = await DepartmentBudget.find(filter)
        .populate('department', 'name code manager metrics.employeeCount')
        .populate('createdBy', 'firstName lastName')
        .sort({ fiscalYear: -1, 'department.name': 1 });

      // Calculate summary statistics
      const summary = {
        totalAllocated: budgets.reduce((sum, budget) => sum + budget.allocatedBudget, 0),
        totalUtilized: budgets.reduce((sum, budget) => sum + budget.utilizedBudget, 0),
        totalRemaining: budgets.reduce((sum, budget) => sum + budget.remainingBudget, 0),
        averageUtilization: budgets.length > 0 ? 
          budgets.reduce((sum, budget) => sum + budget.utilizationPercentage, 0) / budgets.length : 0,
        departmentCount: budgets.length,
        statusDistribution: budgets.reduce((acc, budget) => {
          acc[budget.status] = (acc[budget.status] || 0) + 1;
          return acc;
        }, {})
      };

      res.json({
        success: true,
        data: {
          budgets,
          summary
        },
        metadata: {
          fiscalYear: fiscalYear || 'all',
          departmentCount: budgets.length,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Budget overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch budget overview',
        error: error.message,
        code: 'BUDGET_OVERVIEW_ERROR'
      });
    }
  },

  // Add expense to budget category
  addExpense: async (req, res) => {
    try {
      const { departmentId, categoryName, amount, description, date } = req.body;
      
      const budget = await DepartmentBudget.findOne({
        department: departmentId,
        fiscalYear: new Date().getFullYear()
      });

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found for current fiscal year',
          code: 'BUDGET_NOT_FOUND'
        });
      }

      await budget.addExpense(categoryName, amount);

      // Add expense record to history
      budget.expenseHistory = budget.expenseHistory || [];
      budget.expenseHistory.push({
        category: categoryName,
        amount: amount,
        description: description,
        date: date || new Date(),
        addedBy: req.user._id
      });

      await budget.save();

      // Update department's utilized budget
      const department = await Department.findById(departmentId);
      if (department) {
        department.budget.utilized = budget.utilizedBudget;
        await department.save();
      }

      res.json({
        success: true,
        message: 'Expense added successfully',
        data: budget,
        metadata: {
          category: categoryName,
          amount: amount,
          newUtilization: budget.utilizationPercentage,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('Add expense error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add expense',
        error: error.message,
        code: 'EXPENSE_ADD_ERROR'
      });
    }
  },

  // Get budget forecasting
  getBudgetForecast: async (req, res) => {
    try {
      const { departmentId, fiscalYear } = req.params;
      
      const budget = await DepartmentBudget.findOne({
        department: departmentId,
        fiscalYear: parseInt(fiscalYear) || new Date().getFullYear()
      });

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found',
          code: 'BUDGET_NOT_FOUND'
        });
      }

      const forecast = departmentHelpers.generateBudgetForecast(budget);

      res.json({
        success: true,
        data: forecast,
        metadata: {
          fiscalYear: budget.fiscalYear,
          confidence: forecast.confidence,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Budget forecast error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate budget forecast',
        error: error.message,
        code: 'BUDGET_FORECAST_ERROR'
      });
    }
  },

  // Export budget data
  exportBudgetData: async (req, res) => {
    try {
      const { departmentId, fiscalYear, format = 'excel' } = req.query;

      const budget = await DepartmentBudget.findOne({
        department: departmentId,
        fiscalYear: parseInt(fiscalYear) || new Date().getFullYear()
      }).populate('department', 'name code');

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found',
          code: 'BUDGET_NOT_FOUND'
        });
      }

      const exportData = await departmentHelpers.exportBudgetData(budget, format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=budget-${departmentId}-${fiscalYear}-${Date.now()}.csv`);
        return res.send(exportData);
      }

      if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=budget-${departmentId}-${fiscalYear}-${Date.now()}.xlsx`);
        return res.send(exportData);
      }

      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=budget-${departmentId}-${fiscalYear}-${Date.now()}.pdf`);
        return res.send(exportData);
      }

      res.json({
        success: true,
        data: exportData,
        metadata: {
          format: format,
          fiscalYear: fiscalYear,
          exportedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Budget export error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export budget data',
        error: error.message,
        code: 'BUDGET_EXPORT_ERROR'
      });
    }
  }
};

module.exports = departmentBudgetController;