// ===== DEPARTMENT MANAGEMENT UTILITY FUNCTIONS =====
// Advanced helper functions for department operations

const departmentHelpers = {
    
    // ===== VALIDATION HELPERS =====
    
    /**
     * Validate department data with comprehensive checks
     */
    validateDepartmentData: (data) => {
        const errors = [];
        
        // Name validation
        if (!data.name || data.name.trim().length === 0) {
            errors.push('Department name is required');
        } else if (data.name.length > 100) {
            errors.push('Department name cannot exceed 100 characters');
        }
        
        // Code validation
        if (!data.code || data.code.trim().length === 0) {
            errors.push('Department code is required');
        } else if (!/^[A-Z0-9]{2,10}$/.test(data.code)) {
            errors.push('Department code must be 2-10 uppercase alphanumeric characters');
        }
        
        // Description validation
        if (data.description && data.description.length > 500) {
            errors.push('Description cannot exceed 500 characters');
        }
        
        // Budget validation
        if (data.budget && data.budget.allocated) {
            if (data.budget.allocated < 0) {
                errors.push('Budget allocated cannot be negative');
            }
            if (data.budget.utilized && data.budget.utilized < 0) {
                errors.push('Budget utilized cannot be negative');
            }
        }
        
        // Color validation
        if (data.settings && data.settings.color) {
            const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
            if (!colorRegex.test(data.settings.color)) {
                errors.push('Invalid color format. Use hex format (#RRGGBB)');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },
    
    /**
     * Validate department code uniqueness
     */
    validateDepartmentCodeUniqueness: async (code, departmentId = null) => {
        try {
            const Department = require('../models/Department');
            const query = { code: code.toUpperCase() };
            
            if (departmentId) {
                query._id = { $ne: departmentId };
            }
            
            const existingDept = await Department.findOne(query);
            return !existingDept;
        } catch (error) {
            console.error('Error validating department code:', error);
            return false;
        }
    },
    
    // ===== DATA TRANSFORMATION HELPERS =====
    
    /**
     * Transform department data for API responses
     */
    transformDepartmentData: (department) => {
        if (!department) return null;
        
        const transformed = {
            _id: department._id,
            name: department.name,
            code: department.code,
            description: department.description,
            status: department.status,
            createdAt: department.createdAt,
            updatedAt: department.updatedAt
        };
        
        // Add populated fields if they exist
        if (department.manager) {
            transformed.manager = {
                _id: department.manager._id,
                firstName: department.manager.firstName,
                lastName: department.manager.lastName,
                email: department.manager.email,
                avatar: department.manager.avatar
            };
        }
        
        if (department.parentDepartment) {
            transformed.parentDepartment = {
                _id: department.parentDepartment._id,
                name: department.parentDepartment.name,
                code: department.parentDepartment.code
            };
        }
        
        // Add metrics with calculated values
        transformed.metrics = {
            employeeCount: department.metrics?.employeeCount || 0,
            performanceScore: department.metrics?.performanceScore || 0,
            utilizationRate: department.metrics?.utilizationRate || 0,
            satisfactionScore: department.metrics?.satisfactionScore || 0
        };
        
        // Add budget information
        transformed.budget = {
            allocated: department.budget?.allocated || 0,
            utilized: department.budget?.utilized || 0,
            fiscalYear: department.budget?.fiscalYear || new Date().getFullYear(),
            utilizationPercentage: department.budget?.utilizationPercentage || 0
        };
        
        // Add settings
        transformed.settings = department.settings || {
            color: '#3B82F6',
            approvalWorkflow: true,
            autoAssign: false,
            notifications: true
        };
        
        // Add contact information
        if (department.contact) {
            transformed.contact = department.contact;
        }
        
        return transformed;
    },
    
    /**
     * Build department hierarchy tree
     */
    buildDepartmentHierarchy: (departments, parentId = null) => {
        const tree = [];
        
        departments
            .filter(dept => {
                if (parentId === null) return !dept.parentDepartment;
                return dept.parentDepartment && dept.parentDepartment.toString() === parentId.toString();
            })
            .forEach(dept => {
                const node = {
                    _id: dept._id,
                    name: dept.name,
                    code: dept.code,
                    manager: dept.manager,
                    metrics: dept.metrics,
                    settings: dept.settings,
                    children: departmentHelpers.buildDepartmentHierarchy(departments, dept._id)
                };
                tree.push(node);
            });
        
        return tree;
    },
    
    /**
     * Flatten department hierarchy for select dropdowns
     */
    flattenDepartmentHierarchy: (departments, level = 0) => {
        let flatList = [];
        
        departments.forEach(dept => {
            const prefix = '─ '.repeat(level);
            flatList.push({
                value: dept._id,
                label: `${prefix}${dept.name} (${dept.code})`,
                level: level
            });
            
            if (dept.children && dept.children.length > 0) {
                flatList = flatList.concat(departmentHelpers.flattenDepartmentHierarchy(dept.children, level + 1));
            }
        });
        
        return flatList;
    },
    
    // ===== ANALYTICS HELPERS =====
    
    /**
     * Calculate department health score
     */
    calculateHealthScore: (metrics) => {
        let score = 0;
        
        // Performance weight: 35%
        score += (metrics.performance / 100) * 35;
        
        // Budget utilization weight: 25% (inverse - lower utilization is better)
        score += ((100 - Math.min(metrics.utilization, 100)) / 100) * 25;
        
        // Employee ratio weight: 20%
        score += (metrics.activeRatio / 100) * 20;
        
        // Attendance weight: 15%
        score += (metrics.attendance / 100) * 15;
        
        // Size factor weight: 5% (larger departments get slight boost)
        const sizeFactor = Math.min(metrics.employeeCount / 50, 1) * 5;
        score += sizeFactor;
        
        return Math.min(Math.round(score), 100);
    },
    
    /**
     * Get performance trend based on score
     */
    getPerformanceTrend: (score) => {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'average';
        return 'poor';
    },
    
    /**
     * Get performance grade
     */
    getPerformanceGrade: (score) => {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
    },
    
    /**
     * Get budget utilization status
     */
    getBudgetStatus: (utilization) => {
        if (utilization < 50) return 'under-utilized';
        if (utilization < 80) return 'optimal';
        if (utilization < 95) return 'over-utilized';
        return 'critical';
    },
    
    /**
     * Calculate average working hours from attendance records
     */
    calculateAverageHours: (attendanceRecords) => {
        if (!attendanceRecords || attendanceRecords.length === 0) return 0;
        
        const totalHours = attendanceRecords.reduce((sum, record) => {
            if (record.hoursWorked) return sum + record.hoursWorked;
            return sum + 8; // Default 8 hours
        }, 0);
        
        return (totalHours / attendanceRecords.length).toFixed(1);
    },
    
    /**
     * Get health level based on score
     */
    getHealthLevel: (score) => {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        return 'poor';
    },
    
    /**
     * Generate recommendations based on department metrics
     */
    generateRecommendations: (department, employees) => {
        const recommendations = [];
        const performance = department.metrics?.performanceScore || 0;
        const utilization = department.budget?.utilizationPercentage || 0;
        const employeeCount = employees.length;
        
        // Performance-based recommendations
        if (performance < 70) {
            recommendations.push('Implement targeted training programs to improve team performance');
            recommendations.push('Consider team-building activities to boost collaboration');
        }
        
        if (performance > 90) {
            recommendations.push('Maintain current performance levels with regular monitoring');
            recommendations.push('Share best practices with other departments');
        }
        
        // Budget-based recommendations
        if (utilization > 80) {
            recommendations.push('Review budget allocation and spending patterns');
            recommendations.push('Consider requesting additional budget for next quarter');
        }
        
        if (utilization < 40) {
            recommendations.push('Utilize allocated budget more effectively for team development');
            recommendations.push('Plan strategic investments for department growth');
        }
        
        // Team size recommendations
        if (employeeCount > 50) {
            recommendations.push('Consider splitting department into smaller teams for better management');
        }
        
        if (employeeCount < 10) {
            recommendations.push('Evaluate department resource allocation and staffing needs');
        }
        
        // Default recommendation if none apply
        if (recommendations.length === 0) {
            recommendations.push('Department is performing well. Maintain current strategies and monitor key metrics.');
        }
        
        return recommendations;
    },
    
    // ===== DATE & TIME HELPERS =====
    
    /**
     * Calculate period dates for analytics
     */
    calculatePeriodDates: (period) => {
        const now = new Date();
        let startDate = new Date();
        
        switch (period) {
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(now.getDate() - 90);
                break;
            case '6m':
                startDate.setMonth(now.getMonth() - 6);
                break;
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setDate(now.getDate() - 30); // Default to 30 days
        }
        
        return {
            startDate: startDate,
            endDate: now
        };
    },
    
    /**
     * Format date for display
     */
    formatDate: (date, format = 'standard') => {
        if (!date) return 'N/A';
        
        const d = new Date(date);
        
        switch (format) {
            case 'short':
                return d.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
            case 'long':
                return d.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            case 'time':
                return d.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            default:
                return d.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                });
        }
    },
    
    // ===== BUDGET HELPERS =====
    
    /**
     * Calculate budget forecast
     */
    calculateBudgetForecast: (budget, period = '3m') => {
        const currentMonth = new Date().getMonth() + 1;
        const remainingMonths = 12 - currentMonth;
        const monthlySpend = budget.utilized / currentMonth;
        
        const forecast = {
            projectedYearEnd: budget.utilized + (monthlySpend * remainingMonths),
            monthlyAverage: monthlySpend,
            remainingMonths: remainingMonths,
            projectedUtilization: ((budget.utilized + (monthlySpend * remainingMonths)) / budget.allocated) * 100
        };
        
        return forecast;
    },
    
    /**
     * Generate budget recommendations
     */
    generateBudgetRecommendations: (budget) => {
        const recommendations = [];
        const utilization = budget.utilizationPercentage;
        
        if (utilization < 40) {
            recommendations.push('Consider reallocating unused funds to other departments');
            recommendations.push('Plan for strategic investments or team development programs');
            recommendations.push('Evaluate department resource requirements for next fiscal year');
        } else if (utilization > 90) {
            recommendations.push('Monitor spending closely to avoid budget overruns');
            recommendations.push('Consider requesting additional budget allocation');
            recommendations.push('Review expense categories for optimization opportunities');
        } else {
            recommendations.push('Budget utilization is within optimal range');
            recommendations.push('Continue current spending patterns with regular monitoring');
        }
        
        return recommendations;
    },
    
    // ===== EXPORT HELPERS =====
    
    /**
     * Convert departments data to CSV format
     */
    convertToCSV: (departments) => {
        if (!departments || departments.length === 0) {
            return 'No data available';
        }
        
        const headers = [
            'Name',
            'Code', 
            'Manager',
            'Employee Count',
            'Performance Score',
            'Budget Allocated',
            'Budget Utilized',
            'Utilization Rate',
            'Status',
            'Created Date'
        ].join(',');
        
        const rows = departments.map(dept => {
            const managerName = dept.manager ? 
                `${dept.manager.firstName} ${dept.manager.lastName}` : 'Not Assigned';
            
            return [
                `"${dept.name}"`,
                dept.code,
                `"${managerName}"`,
                dept.metrics?.employeeCount || 0,
                `${dept.metrics?.performanceScore || 0}%`,
                `$${dept.budget?.allocated || 0}`,
                `$${dept.budget?.utilized || 0}`,
                `${dept.budget?.utilizationPercentage || 0}%`,
                dept.status,
                departmentHelpers.formatDate(dept.createdAt)
            ].join(',');
        });
        
        return [headers, ...rows].join('\n');
    },
    
    /**
     * Generate Excel file buffer (mock implementation)
     */
    convertToExcel: async (departments) => {
        // In a real implementation, this would use a library like exceljs
        // For now, return a mock implementation
        console.log('Generating Excel file for', departments.length, 'departments');
        
        // Mock implementation - return CSV as fallback
        return departmentHelpers.convertToCSV(departments);
    },
    
    /**
     * Generate PDF report (mock implementation)
     */
    generatePDFReport: async (reportData) => {
        // In a real implementation, this would use a library like pdfkit
        console.log('Generating PDF report for department:', reportData.department?.name);
        
        // Mock implementation
        return Buffer.from('PDF report would be generated here');
    },
    
    // ===== SEARCH & FILTER HELPERS =====
    
    /**
     * Build MongoDB query from filters
     */
    buildDepartmentQuery: (filters) => {
        const query = {};
        
        // Text search across multiple fields
        if (filters.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { code: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } },
                { 'contact.email': { $regex: filters.search, $options: 'i' } }
            ];
        }
        
        // Status filter
        if (filters.status) {
            query.status = filters.status;
        }
        
        // Manager filter
        if (filters.manager) {
            query.manager = filters.manager;
        }
        
        // Parent department filter
        if (filters.parentDepartment) {
            if (filters.parentDepartment === 'null') {
                query.parentDepartment = null;
            } else {
                query.parentDepartment = filters.parentDepartment;
            }
        }
        
        // Employee count range filter
        if (filters.minEmployees || filters.maxEmployees) {
            query['metrics.employeeCount'] = {};
            if (filters.minEmployees) query['metrics.employeeCount'].$gte = parseInt(filters.minEmployees);
            if (filters.maxEmployees) query['metrics.employeeCount'].$lte = parseInt(filters.maxEmployees);
        }
        
        // Performance score range filter
        if (filters.minPerformance || filters.maxPerformance) {
            query['metrics.performanceScore'] = {};
            if (filters.minPerformance) query['metrics.performanceScore'].$gte = parseInt(filters.minPerformance);
            if (filters.maxPerformance) query['metrics.performanceScore'].$lte = parseInt(filters.maxPerformance);
        }
        
        // Tags filter
        if (filters.tags && filters.tags.length > 0) {
            query.tags = { $in: filters.tags };
        }
        
        return query;
    },
    
    /**
     * Build sort options from sort parameters
     */
    buildSortOptions: (sortBy = 'name', sortOrder = 'asc') => {
        const sort = {};
        const sortFields = sortBy.split(',');
        const sortOrders = sortOrder.split(',');
        
        sortFields.forEach((field, index) => {
            const order = sortOrders[index] === 'desc' ? -1 : 1;
            sort[field.trim()] = order;
        });
        
        return sort;
    },
    
    // ===== HIERARCHY MANAGEMENT =====
    
    /**
     * Check for circular references in department hierarchy
     */
    checkCircularReference: async (departmentId, potentialParentId) => {
        const Department = require('../models/Department');
        
        if (departmentId.toString() === potentialParentId.toString()) {
            return true; // Self-reference
        }
        
        let currentId = potentialParentId;
        const visited = new Set();
        
        while (currentId) {
            if (visited.has(currentId.toString())) {
                return true; // Circular reference detected
            }
            
            visited.add(currentId.toString());
            
            if (currentId.toString() === departmentId.toString()) {
                return true; // Circular reference found
            }
            
            const parentDept = await Department.findById(currentId).select('parentDepartment');
            if (!parentDept || !parentDept.parentDepartment) {
                break;
            }
            
            currentId = parentDept.parentDepartment;
        }
        
        return false;
    },
    
    /**
     * Get all descendant departments
     */
    getDescendantDepartments: async (departmentId) => {
        const Department = require('../models/Department');
        const descendants = [];
        
        const getChildren = async (parentId) => {
            const children = await Department.find({ parentDepartment: parentId }).select('_id name code');
            
            for (const child of children) {
                descendants.push(child);
                await getChildren(child._id);
            }
        };
        
        await getChildren(departmentId);
        return descendants;
    },
    
    // ===== PERFORMANCE CALCULATIONS =====
    
    /**
     * Calculate department performance metrics
     */
    calculatePerformanceMetrics: async (departmentId) => {
        const Department = require('../models/Department');
        const Employee = require('../models/Employee');
        
        try {
            const employees = await Employee.find({ department: departmentId, status: 'active' });
            const totalEmployees = employees.length;
            
            if (totalEmployees === 0) {
                return {
                    employeeCount: 0,
                    performanceScore: 0,
                    averageTenure: 0,
                    skillDiversity: 0
                };
            }
            
            // Calculate average performance score
            const avgPerformance = employees.reduce((sum, emp) => 
                sum + (emp.performanceScore || 0), 0) / totalEmployees;
            
            // Calculate average tenure
            const currentDate = new Date();
            const totalTenure = employees.reduce((sum, emp) => {
                const joinDate = new Date(emp.joinDate || currentDate);
                const tenureMonths = (currentDate - joinDate) / (1000 * 60 * 60 * 24 * 30);
                return sum + Math.max(0, tenureMonths);
            }, 0);
            const averageTenure = totalTenure / totalEmployees;
            
            // Calculate skill diversity (mock implementation)
            const skillDiversity = Math.min(employees.length / 10, 1) * 100;
            
            return {
                employeeCount: totalEmployees,
                performanceScore: Math.round(avgPerformance),
                averageTenure: Math.round(averageTenure * 10) / 10,
                skillDiversity: Math.round(skillDiversity)
            };
        } catch (error) {
            console.error('Error calculating performance metrics:', error);
            return {
                employeeCount: 0,
                performanceScore: 0,
                averageTenure: 0,
                skillDiversity: 0
            };
        }
    },
    
    // ===== NOTIFICATION HELPERS =====
    
    /**
     * Send department-related notifications
     */
    sendDepartmentNotification: async (department, type, data = {}) => {
        // Mock implementation - in real app, integrate with notification service
        console.log(`Sending ${type} notification for department:`, department.name);
        
        const notifications = {
            'department_created': `New department "${department.name}" has been created`,
            'department_updated': `Department "${department.name}" has been updated`,
            'department_archived': `Department "${department.name}" has been archived`,
            'budget_alert': `Budget alert for department "${department.name}": ${data.message}`
        };
        
        const message = notifications[type] || `Notification for department "${department.name}"`;
        
        // Here you would integrate with your notification system
        // (email, push notifications, in-app notifications, etc.)
        
        return {
            success: true,
            message: 'Notification sent successfully',
            type: type
        };
    },
    
    // ===== DATA CLEANUP HELPERS =====
    
    /**
     * Sanitize department data before saving
     */
    sanitizeDepartmentData: (data) => {
        const sanitized = { ...data };
        
        // Trim string fields
        if (sanitized.name) sanitized.name = sanitized.name.trim();
        if (sanitized.code) sanitized.code = sanitized.code.trim().toUpperCase();
        if (sanitized.description) sanitized.description = sanitized.description.trim();
        
        // Ensure budget values are numbers
        if (sanitized.budget) {
            if (sanitized.budget.allocated) {
                sanitized.budget.allocated = parseFloat(sanitized.budget.allocated) || 0;
            }
            if (sanitized.budget.utilized) {
                sanitized.budget.utilized = parseFloat(sanitized.budget.utilized) || 0;
            }
        }
        
        // Ensure metrics values are numbers
        if (sanitized.metrics) {
            Object.keys(sanitized.metrics).forEach(key => {
                if (typeof sanitized.metrics[key] === 'string') {
                    sanitized.metrics[key] = parseFloat(sanitized.metrics[key]) || 0;
                }
            });
        }
        
        return sanitized;
    },
    
    // ===== CACHE HELPERS =====
    
    /**
     * Generate cache key for department data
     */
    generateCacheKey: (type, identifier, params = {}) => {
        const paramString = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        
        return `dept:${type}:${identifier}${paramString ? `?${paramString}` : ''}`;
    },
    
    /**
     * Clear department-related cache
     */
    clearDepartmentCache: async (departmentId = null) => {
        // Mock implementation - in real app, integrate with your cache system
        console.log('Clearing department cache for:', departmentId || 'all departments');
        
        // Here you would clear Redis cache, memory cache, etc.
        
        return {
            success: true,
            message: departmentId ? 
                `Cache cleared for department ${departmentId}` : 
                'All department cache cleared'
        };
    }
};

module.exports = departmentHelpers;