const Department = require('../../models/Department');
const Employee = require('../../models/Employee');
const Attendance = require('../../models/Attendance');
const departmentService = require('../../services/admin/departmentService');
const departmentHelpers = require('../../utils/department/departmentHelpers');

const departmentAnalyticsController = {
  
  // Get comprehensive department analytics
  getDepartmentAnalytics: async (req, res) => {
    try {
      const departmentId = req.params.id;
      const { period = '30d', compare = false } = req.query;
      
      const department = await Department.findById(departmentId)
        .populate('manager', 'firstName lastName email avatar')
        .populate('parentDepartment', 'name code')
        .populate('assistantManagers', 'firstName lastName email');

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND'
        });
      }

      // Get department employees
      const employees = await Employee.find({ department: departmentId });
      
      // Calculate various metrics
      const totalEmployees = employees.length;
      const activeEmployees = employees.filter(emp => emp.status === 'active').length;
      
      // Attendance analytics (based on period)
      const { startDate, endDate } = departmentHelpers.calculatePeriodDates(period);
      
      const attendanceRecords = await Attendance.find({
        employee: { $in: employees.map(emp => emp._id) },
        date: { $gte: startDate, $lte: endDate }
      });

      // Performance metrics
      const avgPerformance = department.metrics.performanceScore || 0;
      const budgetUtilization = department.budget.utilizationPercentage || 0;
      
      // Department health score
      const healthScore = departmentHelpers.calculateHealthScore({
        performance: avgPerformance,
        utilization: budgetUtilization,
        employeeCount: totalEmployees,
        activeRatio: totalEmployees > 0 ? (activeEmployees / totalEmployees) * 100 : 0,
        attendance: attendanceRecords.length > 0 ? 
          (attendanceRecords.filter(r => r.status === 'present').length / attendanceRecords.length) * 100 : 0
      });

      // Trend analysis
      const trends = await departmentHelpers.calculateTrends(departmentId, period);

      // Comparative analysis
      let comparativeData = null;
      if (compare === 'true') {
        comparativeData = await departmentHelpers.getComparativeAnalysis(departmentId);
      }

      const analytics = {
        department: {
          _id: department._id,
          name: department.name,
          code: department.code,
          manager: department.manager,
          parentDepartment: department.parentDepartment,
          assistantManagers: department.assistantManagers
        },
        overview: {
          totalEmployees,
          activeEmployees,
          inactiveEmployees: totalEmployees - activeEmployees,
          employeeGrowth: trends.employeeGrowth,
          manager: department.manager,
          parentDepartment: department.parentDepartment,
          status: department.status,
          created: department.createdAt
        },
        performance: {
          score: avgPerformance,
          trend: departmentHelpers.getPerformanceTrend(avgPerformance),
          grade: departmentHelpers.getPerformanceGrade(avgPerformance),
          distribution: await departmentHelpers.getPerformanceDistribution(employees),
          history: trends.performanceHistory
        },
        budget: {
          allocated: department.budget.allocated,
          utilized: department.budget.utilized,
          remaining: department.budget.allocated - department.budget.utilized,
          utilizationRate: budgetUtilization,
          status: departmentHelpers.getBudgetStatus(budgetUtilization),
          trends: trends.budgetTrends,
          forecast: departmentHelpers.forecastBudget(department.budget, period)
        },
        attendance: {
          present: attendanceRecords.filter(record => record.status === 'present').length,
          absent: attendanceRecords.filter(record => record.status === 'absent').length,
          late: attendanceRecords.filter(record => record.status === 'late').length,
          leave: attendanceRecords.filter(record => record.status === 'leave').length,
          totalRecords: attendanceRecords.length,
          attendanceRate: attendanceRecords.length > 0 ? 
            (attendanceRecords.filter(record => record.status === 'present').length / attendanceRecords.length) * 100 : 0,
          averageHours: departmentHelpers.calculateAverageHours(attendanceRecords),
          trends: trends.attendanceTrends
        },
        workforce: {
          composition: departmentHelpers.getWorkforceComposition(employees),
          tenure: departmentHelpers.calculateAverageTenure(employees),
          skills: await departmentHelpers.analyzeSkills(employees),
          diversity: departmentHelpers.calculateDiversityMetrics(employees)
        },
        health: {
          score: healthScore,
          level: departmentHelpers.getHealthLevel(healthScore),
          factors: departmentHelpers.analyzeHealthFactors(department, employees),
          recommendations: departmentHelpers.generateRecommendations(department, employees),
          riskLevel: departmentHelpers.assessRiskLevel(healthScore, department.metrics)
        },
        trends: trends,
        comparative: comparativeData,
        period: {
          start: startDate,
          end: endDate,
          label: period
        }
      };

      res.json({
        success: true,
        data: analytics,
        metadata: {
          generatedAt: new Date(),
          period: period,
          employeeCount: totalEmployees,
          dataPoints: {
            attendance: attendanceRecords.length,
            performance: employees.length,
            budget: 1
          }
        }
      });

    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate department analytics',
        error: error.message,
        code: 'ANALYTICS_GENERATION_ERROR'
      });
    }
  },

  // Get analytics comparison between departments
  getComparativeAnalytics: async (req, res) => {
    try {
      const { departments, metrics = 'all', period = '30d' } = req.body;

      if (!departments || !Array.isArray(departments) || departments.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Department IDs are required',
          code: 'INVALID_INPUT'
        });
      }

      const comparativeData = await departmentHelpers.getComparativeAnalytics(departments, metrics, period);

      res.json({
        success: true,
        data: comparativeData,
        metadata: {
          comparedDepartments: departments.length,
          metrics: metrics,
          period: period,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Comparative analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate comparative analytics',
        error: error.message,
        code: 'COMPARATIVE_ANALYTICS_ERROR'
      });
    }
  },

  // Get real-time department metrics
  getRealTimeMetrics: async (req, res) => {
    try {
      const departmentId = req.params.id;

      const realTimeMetrics = await departmentHelpers.getRealTimeMetrics(departmentId);

      if (!realTimeMetrics) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: realTimeMetrics,
        metadata: {
          isRealTime: true,
          updatedAt: new Date(),
          refreshRate: '5 minutes'
        }
      });

    } catch (error) {
      console.error('Real-time metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch real-time metrics',
        error: error.message,
        code: 'REAL_TIME_METRICS_ERROR'
      });
    }
  },

  // Get department analytics trends over time
  getTrendAnalytics: async (req, res) => {
    try {
      const departmentId = req.params.id;
      const { metric = 'performance', period = '6m', granularity = 'weekly' } = req.query;

      const trends = await departmentHelpers.getMetricTrends(departmentId, metric, period, granularity);

      res.json({
        success: true,
        data: trends,
        metadata: {
          metric: metric,
          period: period,
          granularity: granularity,
          dataPoints: trends.length,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Trend analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate trend analytics',
        error: error.message,
        code: 'TREND_ANALYTICS_ERROR'
      });
    }
  },

  // Export analytics data
  exportAnalytics: async (req, res) => {
    try {
      const departmentId = req.params.id;
      const { format = 'pdf', period = '30d' } = req.query;

      const analytics = await departmentService.getDepartmentAnalytics(departmentId, period);

      if (!analytics) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND'
        });
      }

      const exportData = await departmentHelpers.exportAnalytics(analytics, format);

      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${departmentId}-${Date.now()}.pdf`);
        return res.send(exportData);
      }

      if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${departmentId}-${Date.now()}.xlsx`);
        return res.send(exportData);
      }

      res.json({
        success: true,
        data: exportData,
        metadata: {
          format: format,
          period: period,
          exportedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Export analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export analytics',
        error: error.message,
        code: 'ANALYTICS_EXPORT_ERROR'
      });
    }
  },

  // Get department KPI dashboard
  getKPIDashboard: async (req, res) => {
    try {
      const departmentId = req.params.id;
      const { period = '30d' } = req.query;

      const kpiData = await departmentHelpers.getKPIDashboard(departmentId, period);

      if (!kpiData) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: kpiData,
        metadata: {
          period: period,
          kpiCount: Object.keys(kpiData.kpis).length,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('KPI dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate KPI dashboard',
        error: error.message,
        code: 'KPI_DASHBOARD_ERROR'
      });
    }
  },

  // Get predictive analytics
  getPredictiveAnalytics: async (req, res) => {
    try {
      const departmentId = req.params.id;
      const { horizon = '3m' } = req.query;

      const predictions = await departmentHelpers.getPredictiveAnalytics(departmentId, horizon);

      res.json({
        success: true,
        data: predictions,
        metadata: {
          horizon: horizon,
          confidence: predictions.confidence,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Predictive analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate predictive analytics',
        error: error.message,
        code: 'PREDICTIVE_ANALYTICS_ERROR'
      });
    }
  }
};

// Export helper functions for use in other modules
departmentAnalyticsController.calculateHealthScore = departmentHelpers.calculateHealthScore;
departmentAnalyticsController.getPerformanceTrend = departmentHelpers.getPerformanceTrend;
departmentAnalyticsController.getPerformanceGrade = departmentHelpers.getPerformanceGrade;
departmentAnalyticsController.getBudgetStatus = departmentHelpers.getBudgetStatus;
departmentAnalyticsController.calculateAverageHours = departmentHelpers.calculateAverageHours;
departmentAnalyticsController.getHealthLevel = departmentHelpers.getHealthLevel;
departmentAnalyticsController.generateRecommendations = departmentHelpers.generateRecommendations;

module.exports = departmentAnalyticsController;