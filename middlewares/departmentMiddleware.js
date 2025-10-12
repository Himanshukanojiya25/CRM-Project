// ===== DEPARTMENT CUSTOM MIDDLEWARE =====
// Advanced middleware for department operations

const Department = require('../models/Department');
const departmentHelpers = require('../utils/department/departmentHelpers');

// ===== AUTHORIZATION MIDDLEWARE =====

/**
 * Check if user has permission to manage departments
 */
const authorizeDepartmentAccess = (requiredRole = 'admin') => {
    return (req, res, next) => {
        try {
            const user = req.user;
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }
            
            const userRoles = user.roles || [];
            const hasPermission = userRoles.includes(requiredRole) || 
                                 userRoles.includes('super_admin');
            
            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to access department resources',
                    code: 'INSUFFICIENT_PERMISSIONS'
                });
            }
            
            next();
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization check failed',
                code: 'AUTHORIZATION_ERROR'
            });
        }
    };
};

/**
 * Check if user can access specific department
 */
const authorizeDepartmentAction = (action = 'view') => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            const departmentId = req.params.id || req.body.departmentId;
            
            if (!departmentId) {
                return next(); // No specific department to check
            }
            
            const department = await Department.findById(departmentId);
            if (!department) {
                return res.status(404).json({
                    success: false,
                    message: 'Department not found',
                    code: 'DEPARTMENT_NOT_FOUND'
                });
            }
            
            // Super admins can do anything
            if (user.roles.includes('super_admin')) {
                return next();
            }
            
            // Department managers can manage their own departments
            if (department.manager && department.manager.toString() === user._id.toString()) {
                return next();
            }
            
            // Check role-based permissions
            const permissions = {
                'admin': ['view', 'edit', 'delete', 'manage'],
                'hr_manager': ['view', 'edit'],
                'department_head': ['view', 'edit'],
                'employee': ['view']
            };
            
            let hasPermission = false;
            user.roles.forEach(role => {
                if (permissions[role] && permissions[role].includes(action)) {
                    hasPermission = true;
                }
            });
            
            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: `You don't have permission to ${action} this department`,
                    code: 'ACTION_NOT_PERMITTED'
                });
            }
            
            next();
        } catch (error) {
            console.error('Department action authorization error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization check failed',
                code: 'AUTHORIZATION_ERROR'
            });
        }
    };
};

// ===== DATA PROCESSING MIDDLEWARE =====

/**
 * Sanitize department data before processing
 */
const sanitizeDepartmentData = (req, res, next) => {
    try {
        if (req.body) {
            // Sanitize string fields
            if (req.body.name) req.body.name = req.body.name.trim();
            if (req.body.code) req.body.code = req.body.code.trim().toUpperCase();
            if (req.body.description) req.body.description = req.body.description.trim();
            
            // Sanitize budget data
            if (req.body.budget) {
                if (req.body.budget.allocated) {
                    req.body.budget.allocated = parseFloat(req.body.budget.allocated) || 0;
                }
                if (req.body.budget.utilized) {
                    req.body.budget.utilized = parseFloat(req.body.budget.utilized) || 0;
                }
            }
            
            // Sanitize metrics data
            if (req.body.metrics) {
                Object.keys(req.body.metrics).forEach(key => {
                    if (typeof req.body.metrics[key] === 'string') {
                        req.body.metrics[key] = parseFloat(req.body.metrics[key]) || 0;
                    }
                });
            }
            
            // Set createdBy/updatedBy
            if (req.user && req.method === 'POST') {
                req.body.createdBy = req.user._id;
            }
            if (req.user && (req.method === 'PUT' || req.method === 'PATCH')) {
                req.body.updatedBy = req.user._id;
            }
        }
        
        next();
    } catch (error) {
        console.error('Data sanitization error:', error);
        res.status(500).json({
            success: false,
            message: 'Data processing failed',
            code: 'DATA_PROCESSING_ERROR'
        });
    }
};

/**
 * Populate department data with related information
 */
const populateDepartmentData = (populateFields = ['manager', 'parentDepartment']) => {
    return async (req, res, next) => {
        try {
            if (req.department) {
                await req.department.populate(populateFields);
            }
            next();
        } catch (error) {
            console.error('Population error:', error);
            next(); // Continue without population
        }
    };
};

// ===== CACHE MIDDLEWARE =====

/**
 * Cache department data for performance
 */
const cacheDepartmentData = (duration = 300) => { // 5 minutes default
    return async (req, res, next) => {
        // Skip caching for non-GET requests
        if (req.method !== 'GET') {
            return next();
        }
        
        const cacheKey = departmentHelpers.generateCacheKey(
            'api',
            req.originalUrl,
            req.query
        );
        
        try {
            // Check cache (mock implementation - integrate with your cache system)
            // const cachedData = await redis.get(cacheKey);
            
            // if (cachedData) {
            //     return res.json(JSON.parse(cachedData));
            // }
            
            // Override res.json to cache response
            const originalJson = res.json;
            res.json = function(data) {
                // Cache successful responses
                if (data.success) {
                    // await redis.setex(cacheKey, duration, JSON.stringify(data));
                }
                originalJson.call(this, data);
            };
            
            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next(); // Continue without caching
        }
    };
};

/**
 * Clear department cache after modifications
 */
const clearDepartmentCache = async (req, res, next) => {
    // Skip cache clearing for GET requests
    if (req.method === 'GET') {
        return next();
    }
    
    try {
        const departmentId = req.params.id || req.body.departmentId;
        
        // Clear specific department cache
        if (departmentId) {
            await departmentHelpers.clearDepartmentCache(departmentId);
        }
        
        // Clear department list cache
        await departmentHelpers.clearDepartmentCache();
        
        next();
    } catch (error) {
        console.error('Cache clearing error:', error);
        next(); // Continue without cache clearing
    }
};

// ===== AUDIT LOGGING MIDDLEWARE =====

/**
 * Log department-related actions
 */
const logDepartmentAction = (action) => {
    return async (req, res, next) => {
        try {
            const departmentId = req.params.id || req.body.departmentId;
            const user = req.user;
            
            // Log the action (mock implementation)
            const logEntry = {
                action: action,
                departmentId: departmentId,
                userId: user?._id,
                userEmail: user?.email,
                timestamp: new Date(),
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                method: req.method,
                url: req.originalUrl,
                body: action.includes('view') ? null : req.body // Don't log body for view actions
            };
            
            console.log('Department Action:', logEntry);
            
            // Here you would save to your audit log database
            // await AuditLog.create(logEntry);
            
            next();
        } catch (error) {
            console.error('Audit logging error:', error);
            next(); // Continue without logging
        }
    };
};

// ===== RATE LIMITING MIDDLEWARE =====

/**
 * Rate limit department API calls
 */
const rateLimitDepartmentRequests = (windowMs = 15 * 60 * 1000, maxRequests = 100) => { // 15 minutes, 100 requests
    const requests = new Map();
    
    return (req, res, next) => {
        const key = req.user ? req.user._id : req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Clean up old entries
        for (let [k, timestamps] of requests) {
            timestamps = timestamps.filter(timestamp => timestamp > windowStart);
            if (timestamps.length === 0) {
                requests.delete(k);
            } else {
                requests.set(k, timestamps);
            }
        }
        
        // Check rate limit
        const userRequests = requests.get(key) || [];
        if (userRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000)
            });
        }
        
        // Add current request
        userRequests.push(now);
        requests.set(key, userRequests);
        
        next();
    };
};

// ===== ERROR HANDLING MIDDLEWARE =====

/**
 * Handle department-specific errors
 */
const departmentErrorHandler = (err, req, res, next) => {
    console.error('Department Error:', err);
    
    // MongoDB duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            success: false,
            message: `${field} already exists`,
            code: 'DUPLICATE_ENTRY',
            field: field
        });
    }
    
    // MongoDB validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => ({
            field: error.path,
            message: error.message
        }));
        
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors,
            code: 'VALIDATION_ERROR'
        });
    }
    
    // Department not found
    if (err.message === 'Department not found') {
        return res.status(404).json({
            success: false,
            message: 'Department not found',
            code: 'DEPARTMENT_NOT_FOUND'
        });
    }
    
    // Circular reference error
    if (err.message.includes('circular reference')) {
        return res.status(400).json({
            success: false,
            message: err.message,
            code: 'CIRCULAR_REFERENCE_ERROR'
        });
    }
    
    // Default error
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR'
    });
};

// ===== DEPARTMENT LOADING MIDDLEWARE =====

/**
 * Load department by ID and attach to request
 */
const loadDepartmentById = async (req, res, next) => {
    try {
        const departmentId = req.params.id;
        
        if (!departmentId) {
            return next();
        }
        
        const department = await Department.findById(departmentId);
        
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found',
                code: 'DEPARTMENT_NOT_FOUND'
            });
        }
        
        req.department = department;
        next();
    } catch (error) {
        console.error('Department loading error:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading department',
            code: 'DEPARTMENT_LOAD_ERROR'
        });
    }
};

// ===== REQUEST TRANSFORMATION MIDDLEWARE =====

/**
 * Transform request data for department operations
 */
const transformDepartmentRequest = (req, res, next) => {
    // Transform query parameters for MongoDB
    if (req.query) {
        const transformedQuery = { ...req.query };
        
        // Convert string numbers to actual numbers
        if (transformedQuery.page) transformedQuery.page = parseInt(transformedQuery.page);
        if (transformedQuery.limit) transformedQuery.limit = parseInt(transformedQuery.limit);
        if (transformedQuery.minEmployees) transformedQuery.minEmployees = parseInt(transformedQuery.minEmployees);
        if (transformedQuery.maxEmployees) transformedQuery.maxEmployees = parseInt(transformedQuery.maxEmployees);
        if (transformedQuery.minPerformance) transformedQuery.minPerformance = parseInt(transformedQuery.minPerformance);
        if (transformedQuery.maxPerformance) transformedQuery.maxPerformance = parseInt(transformedQuery.maxPerformance);
        
        req.transformedQuery = transformedQuery;
    }
    
    next();
};

// ===== RESPONSE ENHANCEMENT MIDDLEWARE =====

/**
 * Enhance response with metadata
 */
const enhanceDepartmentResponse = (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
        if (data && typeof data === 'object' && data.success !== undefined) {
            // Add metadata to successful responses
            if (data.success) {
                data.metadata = {
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    ...data.metadata
                };
                
                // Add pagination info if available
                if (data.pagination) {
                    data.metadata.pagination = data.pagination;
                }
            }
        }
        
        originalJson.call(this, data);
    };
    
    next();
};

// ===== EXPORT ALL MIDDLEWARE =====

module.exports = {
    // Authorization
    authorizeDepartmentAccess,
    authorizeDepartmentAction,
    
    // Data Processing
    sanitizeDepartmentData,
    populateDepartmentData,
    transformDepartmentRequest,
    
    // Caching
    cacheDepartmentData,
    clearDepartmentCache,
    
    // Logging & Monitoring
    logDepartmentAction,
    rateLimitDepartmentRequests,
    
    // Error Handling
    departmentErrorHandler,
    
    // Data Loading
    loadDepartmentById,
    
    // Response Enhancement
    enhanceDepartmentResponse
};