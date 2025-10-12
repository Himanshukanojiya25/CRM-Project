const Department = require('../../models/Department');
const Employee = require('../../models/Employee');
const Attendance = require('../../models/Attendance');
const DepartmentBudget = require('../../models/DepartmentBudget');
const departmentService = require('../../services/admin/departmentService');
const departmentHelpers = require('../../utils/department/departmentHelpers');

const departmentReportsController = {
  
  // Generate comprehensive department report
  generateDepartmentReport: async (req, res) => {
    try {
      const { departmentId, reportType, startDate, endDate, sections, format } = req.body;
      
      const department = await Department.findById(departmentId)
        .populate('manager', 'firstName lastName email avatar')
        .populate('parentDepartment', 'name code')
        .populate('assistantManagers', 'firstName lastName email position');

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND'
        });
      }

      const employees = await Employee.find({ department: departmentId });
      const employeeIds = employees.map(emp => emp._id);

      // Get comprehensive data based on report type
      const reportData = await departmentHelpers.generateReportData(
        department,
        employees,
        reportType,
        startDate,
        endDate,
        sections
      );

      const report = {
        metadata: {
          reportId: `DEPT-${departmentId}-${Date.now()}`,
          generatedAt: new Date(),
          period: {
            start: startDate,
            end: endDate
          },
          reportType: reportType,
          generatedBy: {
            userId: req.user._id,
            timestamp: new Date()
          }
        },
        department: {
          _id: department._id,
          name: department.name,
          code: department.code,
          manager: department.manager,
          parentDepartment: department.parentDepartment,
          assistantManagers: department.assistantManagers,
          contact: department.contact,
          settings: department.settings
        },
        ...reportData
      };

      // Handle different output formats
      if (format === 'pdf') {
        const pdfBuffer = await departmentHelpers.generatePDFReport(report);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=department-report-${department.code}-${Date.now()}.pdf`);
        return res.send(pdfBuffer);
      }

      if (format === 'excel') {
        const excelBuffer = await departmentHelpers.generateExcelReport(report);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=department-report-${department.code}-${Date.now()}.xlsx`);
        return res.send(excelBuffer);
      }

      res.json({
        success: true,
        data: report,
        message: 'Department report generated successfully',
        metadata: {
          reportId: report.metadata.reportId,
          format: format || 'json',
          sections: sections || 'all',
          employeeCount: employees.length
        }
      });

    } catch (error) {
      console.error('Department report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate department report',
        error: error.message,
        code: 'REPORT_GENERATION_ERROR'
      });
    }
  },

  // Generate comparative department report
  generateComparativeReport: async (req, res) => {
    try {
      const { departmentIds, reportType, startDate, endDate, metrics, format } = req.body;

      if (!departmentIds || !Array.isArray(departmentIds) || departmentIds.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'At least two department IDs are required for comparative report',
          code: 'INVALID_INPUT'
        });
      }

      const comparativeData = await departmentHelpers.generateComparativeReportData(
        departmentIds,
        reportType,
        startDate,
        endDate,
        metrics
      );

      const report = {
        metadata: {
          reportId: `COMP-${Date.now()}`,
          generatedAt: new Date(),
          period: { start: startDate, end: endDate },
          reportType: `comparative_${reportType}`,
          departments: departmentIds,
          metrics: metrics
        },
        ...comparativeData
      };

      if (format === 'pdf') {
        const pdfBuffer = await departmentHelpers.generateComparativePDF(report);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=comparative-report-${Date.now()}.pdf`);
        return res.send(pdfBuffer);
      }

      if (format === 'excel') {
        const excelBuffer = await departmentHelpers.generateComparativeExcel(report);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=comparative-report-${Date.now()}.xlsx`);
        return res.send(excelBuffer);
      }

      res.json({
        success: true,
        data: report,
        message: 'Comparative report generated successfully',
        metadata: {
          reportId: report.metadata.reportId,
          departmentCount: departmentIds.length,
          format: format || 'json'
        }
      });

    } catch (error) {
      console.error('Comparative report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate comparative report',
        error: error.message,
        code: 'COMPARATIVE_REPORT_ERROR'
      });
    }
  },

  // Generate trend analysis report
  generateTrendReport: async (req, res) => {
    try {
      const { departmentId, metrics, period, granularity, format } = req.body;

      const trendData = await departmentHelpers.generateTrendAnalysis(
        departmentId,
        metrics,
        period,
        granularity
      );

      const report = {
        metadata: {
          reportId: `TREND-${departmentId}-${Date.now()}`,
          generatedAt: new Date(),
          period: period,
          granularity: granularity,
          metrics: metrics
        },
        ...trendData
      };

      if (format === 'pdf') {
        const pdfBuffer = await departmentHelpers.generateTrendPDF(report);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=trend-report-${departmentId}-${Date.now()}.pdf`);
        return res.send(pdfBuffer);
      }

      res.json({
        success: true,
        data: report,
        message: 'Trend analysis report generated successfully',
        metadata: {
          reportId: report.metadata.reportId,
          dataPoints: trendData.trends.length,
          period: period
        }
      });

    } catch (error) {
      console.error('Trend report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate trend report',
        error: error.message,
        code: 'TREND_REPORT_ERROR'
      });
    }
  },

  // Generate workforce analytics report
  generateWorkforceReport: async (req, res) => {
    try {
      const { departmentId, reportType, filters, format } = req.body;

      const workforceData = await departmentHelpers.generateWorkforceAnalytics(
        departmentId,
        reportType,
        filters
      );

      const report = {
        metadata: {
          reportId: `WORKFORCE-${departmentId}-${Date.now()}`,
          generatedAt: new Date(),
          reportType: reportType,
          filters: filters
        },
        ...workforceData
      };

      if (format === 'pdf') {
        const pdfBuffer = await departmentHelpers.generateWorkforcePDF(report);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=workforce-report-${departmentId}-${Date.now()}.pdf`);
        return res.send(pdfBuffer);
      }

      res.json({
        success: true,
        data: report,
        message: 'Workforce analytics report generated successfully',
        metadata: {
          reportId: report.metadata.reportId,
          employeeCount: workforceData.summary.totalEmployees,
          reportType: reportType
        }
      });

    } catch (error) {
      console.error('Workforce report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate workforce report',
        error: error.message,
        code: 'WORKFORCE_REPORT_ERROR'
      });
    }
  },

  // Generate budget performance report
  generateBudgetReport: async (req, res) => {
    try {
      const { departmentId, fiscalYear, includeForecast, format } = req.body;

      const budgetData = await departmentHelpers.generateBudgetPerformanceReport(
        departmentId,
        fiscalYear,
        includeForecast
      );

      const report = {
        metadata: {
          reportId: `BUDGET-${departmentId}-${fiscalYear}-${Date.now()}`,
          generatedAt: new Date(),
          fiscalYear: fiscalYear,
          includeForecast: includeForecast
        },
        ...budgetData
      };

      if (format === 'pdf') {
        const pdfBuffer = await departmentHelpers.generateBudgetPDF(report);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=budget-report-${departmentId}-${fiscalYear}-${Date.now()}.pdf`);
        return res.send(pdfBuffer);
      }

      res.json({
        success: true,
        data: report,
        message: 'Budget performance report generated successfully',
        metadata: {
          reportId: report.metadata.reportId,
          fiscalYear: fiscalYear,
          utilization: budgetData.overview.utilizationRate
        }
      });

    } catch (error) {
      console.error('Budget report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate budget report',
        error: error.message,
        code: 'BUDGET_REPORT_ERROR'
      });
    }
  },

  // Generate executive summary report
  generateExecutiveSummary: async (req, res) => {
    try {
      const { departmentId, period, sections, format } = req.body;

      const executiveSummary = await departmentHelpers.generateExecutiveSummary(
        departmentId,
        period,
        sections
      );

      const report = {
        metadata: {
          reportId: `EXEC-${departmentId}-${Date.now()}`,
          generatedAt: new Date(),
          period: period,
          sections: sections
        },
        ...executiveSummary
      };

      if (format === 'pdf') {
        const pdfBuffer = await departmentHelpers.generateExecutivePDF(report);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=executive-summary-${departmentId}-${Date.now()}.pdf`);
        return res.send(pdfBuffer);
      }

      res.json({
        success: true,
        data: report,
        message: 'Executive summary generated successfully',
        metadata: {
          reportId: report.metadata.reportId,
          period: period,
          sectionCount: sections ? sections.length : 'all'
        }
      });

    } catch (error) {
      console.error('Executive summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate executive summary',
        error: error.message,
        code: 'EXECUTIVE_SUMMARY_ERROR'
      });
    }
  },

  // Get available report templates
  getReportTemplates: async (req, res) => {
    try {
      const templates = await departmentHelpers.getReportTemplates();

      res.json({
        success: true,
        data: templates,
        metadata: {
          templateCount: templates.length,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Report templates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch report templates',
        error: error.message,
        code: 'TEMPLATES_ERROR'
      });
    }
  },

  // Save report configuration
  saveReportConfiguration: async (req, res) => {
    try {
      const { name, configuration, isTemplate = false } = req.body;

      const savedConfig = await departmentHelpers.saveReportConfiguration(
        name,
        configuration,
        isTemplate,
        req.user._id
      );

      res.json({
        success: true,
        data: savedConfig,
        message: 'Report configuration saved successfully',
        metadata: {
          configId: savedConfig._id,
          isTemplate: isTemplate,
          savedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Save report config error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save report configuration',
        error: error.message,
        code: 'SAVE_CONFIG_ERROR'
      });
    }
  },

  // Get saved report configurations
  getSavedConfigurations: async (req, res) => {
    try {
      const { type = 'user' } = req.query; // user or template

      const configurations = await departmentHelpers.getSavedConfigurations(
        type,
        req.user._id
      );

      res.json({
        success: true,
        data: configurations,
        metadata: {
          type: type,
          count: configurations.length,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Get configurations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch saved configurations',
        error: error.message,
        code: 'CONFIGURATIONS_ERROR'
      });
    }
  },

  // Schedule automated reports
  scheduleReport: async (req, res) => {
    try {
      const { configuration, schedule, recipients, format } = req.body;

      const scheduledReport = await departmentHelpers.scheduleAutomatedReport(
        configuration,
        schedule,
        recipients,
        format,
        req.user._id
      );

      res.json({
        success: true,
        data: scheduledReport,
        message: 'Report scheduled successfully',
        metadata: {
          scheduleId: scheduledReport._id,
          nextRun: scheduledReport.nextRun,
          frequency: scheduledReport.schedule.frequency,
          recipientCount: recipients.length
        }
      });

    } catch (error) {
      console.error('Schedule report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule report',
        error: error.message,
        code: 'SCHEDULE_REPORT_ERROR'
      });
    }
  },

  // Get report history
  getReportHistory: async (req, res) => {
    try {
      const { departmentId, page = 1, limit = 10 } = req.query;

      const history = await departmentHelpers.getReportHistory(
        departmentId,
        parseInt(page),
        parseInt(limit),
        req.user._id
      );

      res.json({
        success: true,
        data: history.reports,
        pagination: history.pagination,
        metadata: {
          departmentId: departmentId,
          totalReports: history.pagination.total,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Report history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch report history',
        error: error.message,
        code: 'REPORT_HISTORY_ERROR'
      });
    }
  }
};

module.exports = departmentReportsController;