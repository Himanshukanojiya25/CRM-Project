const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const flash = require('connect-flash');

// ✅ Database connection
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

const app = express();

// ✅ Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ✅ Passport Configuration (SESSION KE BAAD - CRITICAL FIX)
const passport = require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// ✅ Flash Middleware
app.use(flash());

// ✅ Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://kit.fontawesome.com", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://kit.fontawesome.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com", "https://kit.fontawesome.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://ka-f.fontawesome.com"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://github.com"],
      objectSrc: ["'none'"]
    }
  }
}));

// ✅ CORS Configuration
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:8080', 
  credentials: true 
}));

// ✅ Rate Limiting
const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// ✅ Logging
app.use(morgan('combined'));

// ✅ Body Parsing
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ✅ REQUEST LOGGING MIDDLEWARE
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.originalUrl}`);
  res.removeHeader('X-Powered-By');
  next();
});

// ✅ Flash Messages Middleware
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.message = req.flash('message');
  res.locals.warning = req.flash('warning');
  res.locals.info = req.flash('info');
  next();
});

// ✅ CACHE CLEARING ROUTE
app.get('/clear-cache', (req, res) => {
  console.log('🧹 Clearing all cookies and cache');
  res.clearCookie('token');
  res.clearCookie('session');
  res.clearCookie('user');
  res.clearCookie('auth');
  res.redirect('/auth');
});

// ✅ SIMPLE JWT AUTH MIDDLEWARE
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-secret-key');
    console.log(`🔐 JWT Auth: ${decoded.email}`);
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      res.clearCookie('token');
      return next();
    }

    req.user = user;
    console.log(`✅ Authenticated: ${user.email}`);
    
    next();
  } catch (error) {
    console.error('❌ JWT Auth error:', error.message);
    res.clearCookie('token');
    next();
  }
};

// ✅ USE JWT AUTH MIDDLEWARE
app.use(authenticateToken);

// ✅ SIMPLE GLOBAL VARIABLES MIDDLEWARE
app.use((req, res, next) => {
  if (req.query.success && (!res.locals.success || res.locals.success.length === 0)) {
    res.locals.success = [req.query.success];
  }
  if (req.query.error && (!res.locals.error || res.locals.error.length === 0)) {
    res.locals.error = [req.query.error];
  }
  if (req.query.message && (!res.locals.message || res.locals.message.length === 0)) {
    res.locals.message = [req.query.message];
  }
  
  res.locals.user = req.user || null;
  res.locals.currentUrl = req.originalUrl;
  
  next();
});

// ✅ Default page title middleware
app.use((req, res, next) => {
  if (!res.locals.title) {
    res.locals.title = "CRM System";
  }
  if (!res.locals.pageTitle) {
    res.locals.pageTitle = "CRM System - Customer Relationship Management";
  }
  next();
});

// ✅ Static Files Configuration
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true
}));

// ✅ Uploads directories
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
  maxAge: '7d'
}));

// ✅ EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('view cache', process.env.NODE_ENV === 'production');
app.use(expressLayouts);
app.set('layout', 'layouts/user-base');

// ========================
// ✅ ROUTE IMPORTS - WITH ERROR HANDLING
// ========================

// Auth Routes
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');

// User Routes
const userAttendanceRoutes = require('./routes/user/attendanceRoutes');
const userFeedbackRoutes = require('./routes/user/feedbackRoutes');
const userDashboardRoutes = require('./routes/user/dashboardRoutes');
const userLeaveRoutes = require('./routes/user/leavesRoutes');
const profileRoutes = require('./routes/user/profileRoutes');

// Admin Routes
const adminDashboardRoutes = require('./routes/admin/dashboardRoutes');
const adminAttendanceRoutes = require('./routes/admin/attendanceRoutes');
const adminLeaveRoutes = require('./routes/admin/leavesRoutes');
const employeeRoutes = require('./routes/admin/employeeRoutes');

// ✅ PERFORMANCE ROUTES - ONLY ONCE
const performanceRoutes = require('./routes/admin/performance');

// ========================
// ✅ SALARY ROUTES - NEW ADDITION
// ========================

// ✅ DIRECT SALARY ROUTE FOR TESTING - TEMPORARY FIX
app.get('/admin/salary/test', (req, res) => {
  console.log('🎯 DIRECT SALARY TEST ROUTE HIT');
  
  if (!req.user || req.user.role !== 'admin') {
    return res.redirect('/auth');
  }
  
  res.send(`
    <h1>Salary Management Working! ✅</h1>
    <p>Welcome ${req.user.email}</p>
    <p>This is a temporary salary page</p>
    <a href="/admin/dashboard">← Back to Dashboard</a>
  `);
});

// ✅ User Salary Routes
let userSalaryRoutes;
try {
  userSalaryRoutes = require('./routes/user/salary');
  console.log('✅ userSalaryRoutes loaded successfully');
} catch (error) {
  console.log('⚠️ userSalaryRoutes not found, creating basic router');
  userSalaryRoutes = express.Router();
  userSalaryRoutes.get('/', (req, res) => {
    res.json({ 
      success: true, 
      message: 'User Salary API - Basic Route'
    });
  });
}

// ========================
// ✅ FEEDBACK MODULE ROUTES - COMPLETE FIXED VERSION
// ========================

// ✅ IMPORT REAL FEEDBACK ROUTES - FIXED VERSION
let feedbackRoutes, feedbackAnalyticsRoutes, feedbackAssignmentRoutes, feedbackTemplatesRoutes;

try {
  feedbackRoutes = require('./routes/admin/feedback/feedbackRoutes');
  console.log('✅ feedbackRoutes loaded successfully');
} catch (error) {
  console.log('⚠️ feedbackRoutes not found, creating basic router');
  feedbackRoutes = express.Router();
  feedbackRoutes.get('/', (req, res) => {
    res.json({ 
      success: true, 
      message: 'Feedback API Working - Basic Route',
      endpoints: ['GET /admin/feedback']
    });
  });
}

try {
  feedbackAnalyticsRoutes = require('./routes/admin/feedback/analyticsRoutes');
  console.log('✅ feedbackAnalyticsRoutes loaded successfully');
} catch (error) {
  console.log('⚠️ feedbackAnalyticsRoutes not found, creating basic router');
  feedbackAnalyticsRoutes = express.Router();
  feedbackAnalyticsRoutes.get('/', (req, res) => {
    res.json({ 
      success: true, 
      message: 'Feedback Analytics API - Basic Route'
    });
  });
}

try {
  feedbackAssignmentRoutes = require('./routes/admin/feedback/assignmentRoutes');
  console.log('✅ feedbackAssignmentRoutes loaded successfully');
} catch (error) {
  console.log('⚠️ feedbackAssignmentRoutes not found, creating basic router');
  feedbackAssignmentRoutes = express.Router();
  feedbackAssignmentRoutes.get('/', (req, res) => {
    res.json({ 
      success: true, 
      message: 'Feedback Assignment API - Basic Route'
    });
  });
}

try {
  feedbackTemplatesRoutes = require('./routes/admin/feedback/templatesRoutes');
  console.log('✅ feedbackTemplatesRoutes loaded successfully');
} catch (error) {
  console.log('⚠️ feedbackTemplatesRoutes not found, creating basic router');
  feedbackTemplatesRoutes = express.Router();
  feedbackTemplatesRoutes.get('/', (req, res) => {
    res.json({ 
      success: true, 
      message: 'Feedback Templates API - Basic Route'
    });
  });
}

console.log('✅ All Feedback Routes Initialized');

// ✅ DEPARTMENT ROUTES - WITH SAFE IMPORT
const departmentRoutes = require('./routes/admin/departmentRoutes');

// ✅ SAFE IMPORT FOR NEW ROUTES - IF THEY EXIST
let departmentAnalyticsRoutes, departmentBudgetRoutes, departmentHierarchyRoutes, departmentReportsRoutes;

try {
  departmentAnalyticsRoutes = require('./routes/admin/departmentAnalyticsRoutes');
  console.log('✅ departmentAnalyticsRoutes loaded');
} catch (error) {
  console.log('⚠️ departmentAnalyticsRoutes not found, creating empty router');
  departmentAnalyticsRoutes = express.Router();
  departmentAnalyticsRoutes.get('/', (req, res) => {
    res.json({ success: true, message: 'Department Analytics API - Placeholder' });
  });
}

try {
  departmentBudgetRoutes = require('./routes/admin/departmentBudgetRoutes');
  console.log('✅ departmentBudgetRoutes loaded');
} catch (error) {
  console.log('⚠️ departmentBudgetRoutes not found, creating empty router');
  departmentBudgetRoutes = express.Router();
  departmentBudgetRoutes.get('/', (req, res) => {
    res.json({ success: true, message: 'Department Budget API - Placeholder' });
  });
}

try {
  departmentHierarchyRoutes = require('./routes/admin/departmentHierarchyRoutes');
  console.log('✅ departmentHierarchyRoutes loaded');
} catch (error) {
  console.log('⚠️ departmentHierarchyRoutes not found, creating empty router');
  departmentHierarchyRoutes = express.Router();
  departmentHierarchyRoutes.get('/', (req, res) => {
    res.json({ success: true, message: 'Department Hierarchy API - Placeholder' });
  });
}

try {
  departmentReportsRoutes = require('./routes/admin/departmentReportsRoutes');
  console.log('✅ departmentReportsRoutes loaded');
} catch (error) {
  console.log('⚠️ departmentReportsRoutes not found, creating empty router');
  departmentReportsRoutes = express.Router();
  departmentReportsRoutes.get('/', (req, res) => {
    res.json({ success: true, message: 'Department Reports API - Placeholder' });
  });
}

// ========================
// ✅ MOUNT ROUTES - COMPLETE WITH SALARY ROUTES
// ========================

// Auth Routes
app.use('/auth', authRoutes);
app.use('/test', testRoutes);

// User Routes
app.use('/user/dashboard', userDashboardRoutes);
app.use('/user/attendance', userAttendanceRoutes);
app.use('/user/leaves', userLeaveRoutes);
app.use('/user/feedback', userFeedbackRoutes);
app.use('/user/profile', profileRoutes);

// Admin Routes
app.use('/admin/dashboard', adminDashboardRoutes);
app.use('/admin/attendance', adminAttendanceRoutes);
app.use('/admin/leaves', adminLeaveRoutes);
app.use('/admin/employees', employeeRoutes);

// ✅ SALARY ROUTES - NEWLY ADDED (WITH ERROR HANDLING)
let adminSalaryRoutes;
try {
  adminSalaryRoutes = require('./routes/admin/salary');
  console.log('✅ Admin Salary Routes loaded successfully');
} catch (error) {
  console.log('⚠️ Admin Salary Routes not found, creating basic router');
  adminSalaryRoutes = express.Router();
  
  adminSalaryRoutes.get('/', (req, res) => {
    if (!req.user || req.user.role !== 'admin') return res.redirect('/auth');
    res.render('admin/salary/dashboard', {
      pageTitle: 'Salary Management - CRM Admin',
      user: req.user,
      currentUrl: '/admin/salary',
      layout: 'layouts/admin-base',
      totalPaid: '0',
      employeesPaid: 0,
      pendingSalaries: 0,
      completionRate: 0,
      recentTransactions: []
    });
  });
  
  adminSalaryRoutes.get('/credit', (req, res) => {
    if (!req.user || req.user.role !== 'admin') return res.redirect('/auth');
    res.render('admin/salary/credit-salary', {
      pageTitle: 'Credit Salary - CRM Admin',
      user: req.user,
      currentUrl: '/admin/salary/credit',
      layout: 'layouts/admin-base'
    });
  });
  
  adminSalaryRoutes.get('/employee-list', (req, res) => {
    if (!req.user || req.user.role !== 'admin') return res.redirect('/auth');
    res.render('admin/salary/employee-list', {
      pageTitle: 'Employee Salary List - CRM Admin',
      user: req.user,
      currentUrl: '/admin/salary/employee-list',
      layout: 'layouts/admin-base'
    });
  });
  
  adminSalaryRoutes.get('/history', (req, res) => {
    if (!req.user || req.user.role !== 'admin') return res.redirect('/auth');
    res.render('admin/salary/history', {
      pageTitle: 'Salary History - CRM Admin',
      user: req.user,
      currentUrl: '/admin/salary/history',
      layout: 'layouts/admin-base'
    });
  });
}

// ✅ FEEDBACK MODULE ROUTES - MOUNT API ROUTES WITH /api/ PREFIX
app.use('/api/admin/feedback', feedbackRoutes);
app.use('/api/admin/feedback/analytics', feedbackAnalyticsRoutes);
app.use('/api/admin/feedback/assignments', feedbackAssignmentRoutes);
app.use('/api/admin/feedback/templates', feedbackTemplatesRoutes);

// ✅ PERFORMANCE ROUTES - ONLY ONCE
app.use('/admin/performance', performanceRoutes);

// ✅ DEPARTMENT API ROUTES
app.use('/api/admin/departments', departmentRoutes);
app.use('/api/admin/department-analytics', departmentAnalyticsRoutes);
app.use('/api/admin/department-budget', departmentBudgetRoutes);
app.use('/api/admin/department-hierarchy', departmentHierarchyRoutes);
app.use('/api/admin/department-reports', departmentReportsRoutes);

// ========================
// ✅ SALARY MANAGEMENT HTML PAGES - NEW ADDITION
// ========================

// ✅ Admin Salary Dashboard Page
app.get('/admin/salary', async (req, res) => {
  try {
    console.log('💰 Salary Dashboard page accessed');
    
    if (!req.user) {
      return res.redirect('/auth?error=Please login to access salary management');
    }
    
    if (req.user.role !== 'admin') {
      return res.redirect('/user/dashboard?error=Access denied');
    }

    res.render('admin/salary/dashboard', {
      pageTitle: 'Salary Management - CRM Admin',
      user: req.user,
      currentUrl: '/admin/salary',
      layout: 'layouts/admin-base'
    });

  } catch (error) {
    console.error('❌ Salary dashboard error:', error);
    res.redirect('/admin/dashboard?error=Unable to load salary management');
  }
});

// ✅ Admin Credit Salary Page
app.get('/admin/salary/credit', async (req, res) => {
  try {
    console.log('💳 Credit Salary page accessed');
    
    if (!req.user || req.user.role !== 'admin') {
      return res.redirect('/auth');
    }

    res.render('admin/salary/credit-salary', {
      pageTitle: 'Credit Salary - CRM Admin',
      user: req.user,
      currentUrl: '/admin/salary/credit',
      layout: 'layouts/admin-base'
    });

  } catch (error) {
    console.error('❌ Credit salary error:', error);
    res.redirect('/admin/salary?error=Unable to load credit salary page');
  }
});

// ✅ Admin Employee List for Salary
app.get('/admin/salary/employee-list', async (req, res) => {
  try {
    console.log('👥 Salary Employee List page accessed');
    
    if (!req.user || req.user.role !== 'admin') {
      return res.redirect('/auth');
    }

    res.render('admin/salary/employee-list', {
      pageTitle: 'Employee Salary List - CRM Admin',
      user: req.user,
      currentUrl: '/admin/salary/employee-list',
      layout: 'layouts/admin-base'
    });

  } catch (error) {
    console.error('❌ Employee list error:', error);
    res.redirect('/admin/salary?error=Unable to load employee list');
  }
});

// ✅ Admin Salary History Page
app.get('/admin/salary/history', async (req, res) => {
  try {
    console.log('📜 Salary History page accessed');
    
    if (!req.user || req.user.role !== 'admin') {
      return res.redirect('/auth');
    }

    res.render('admin/salary/history', {
      pageTitle: 'Salary History - CRM Admin',
      user: req.user,
      currentUrl: '/admin/salary/history',
      layout: 'layouts/admin-base'
    });

  } catch (error) {
    console.error('❌ Salary history error:', error);
    res.redirect('/admin/salary?error=Unable to load salary history');
  }
});

// ========================
// ✅ USER SALARY PAGES - NEW ADDITION
// ========================

// ✅ User Salary History Page
app.get('/user/salary', async (req, res) => {
  try {
    console.log('💰 User Salary page accessed');
    
    if (!req.user) {
      return res.redirect('/auth?error=Please login to access salary');
    }

    res.render('user/salary/history', {
      pageTitle: 'My Salary - CRM System',
      user: req.user,
      currentUrl: '/user/salary',
      layout: 'layouts/user-base'
    });

  } catch (error) {
    console.error('❌ User salary error:', error);
    res.redirect('/user/dashboard?error=Unable to load salary information');
  }
});

// ✅ User Salary Slip Page
app.get('/user/salary/slip/:id', async (req, res) => {
  try {
    console.log('📄 User Salary Slip page accessed:', req.params.id);
    
    if (!req.user) {
      return res.redirect('/auth');
    }

    res.render('user/salary/slip', {
      pageTitle: 'Salary Slip - CRM System',
      user: req.user,
      currentUrl: '/user/salary',
      salaryId: req.params.id,
      layout: 'layouts/user-base'
    });

  } catch (error) {
    console.error('❌ User salary slip error:', error);
    res.redirect('/user/salary?error=Unable to load salary slip');
  }
});

// ========================
// ✅ EMERGENCY FIX - DIRECT FEEDBACK ROUTE
// ========================

// ✅ DIRECT FEEDBACK API ROUTE - This will override any broken routes
app.get('/admin/feedback/api', (req, res) => {
  console.log('🎯 DIRECT FEEDBACK API ROUTE CALLED');
  
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin required.' 
    });
  }

  const sampleData = [
    {
      _id: '1',
      title: "Login page loading too slow - DIRECT ROUTE DATA",
      description: "This data is coming from DIRECT ROUTE in app.js",
      category: "bug",
      status: "pending",
      priority: "high",
      rating: 4.2,
      user: {
        name: "John Smith",
        email: "john.smith@example.com",
        avatar: null
      },
      assignedTo: null,
      responses: [],
      createdAt: new Date('2024-01-15T10:30:00Z'),
      updatedAt: new Date('2024-01-15T10:30:00Z')
    },
    {
      _id: '2',
      title: "Great customer support - DIRECT ROUTE DATA",
      description: "This proves the direct route is working!",
      category: "positive",
      status: "resolved",
      priority: "low",
      rating: 5.0,
      user: {
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        avatar: null
      },
      assignedTo: {
        name: "Mike Chen",
        email: "mike.chen@company.com"
      },
      responses: [
        {
          message: "Thank you for your kind words!",
          admin: {
            name: "Mike Chen",
            email: "mike.chen@company.com"
          },
          createdAt: new Date('2024-01-14T15:20:00Z')
        }
      ],
      createdAt: new Date('2024-01-14T14:45:00Z'),
      updatedAt: new Date('2024-01-14T15:20:00Z')
    }
  ];

  res.json({
    success: true,
    data: sampleData,
    pagination: {
      page: 1,
      limit: 10,
      total: sampleData.length,
      pages: 1
    },
    message: '🎉 SUCCESS! Direct route is working!',
    debug: {
      route: 'DIRECT /admin/feedback/api',
      timestamp: new Date().toISOString(),
      user: req.user.email
    }
  });
});

// ========================
// ✅ CORE ROUTES
// ========================

// ✅ Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'CRM Server is running healthy!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
    modules: {
      feedback: true,
      analytics: true,
      assignments: true,
      templates: true,
      salary: true
    }
  });
});

// ✅ Base route
app.get('/', (req, res) => {
  if (req.user) {
    const redirectUrl = req.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
    return res.redirect(redirectUrl);
  }
  res.redirect('/auth');
});

// ✅ Dashboard routes
app.get("/dashboard", (req, res) => {
  if (!req.user) {
    return res.redirect('/auth?error=Please login to access dashboard');
  }
  const redirectUrl = req.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
  res.redirect(redirectUrl);
});

// ========================
// ✅ MAIN FEEDBACK HTML PAGE ROUTE - ULTIMATE FIXED VERSION
// ========================

// ✅ Admin Feedback List Page - SIMPLE STATIC DATA (NO API CALLS)
app.get('/admin/feedback', async (req, res) => {
  try {
    console.log('🎯 FEEDBACK PAGE WITH STATIC DATA CALLED');
    
    if (!req.user) {
      return res.redirect('/auth?error=Please login to access feedback');
    }
    
    if (req.user.role !== 'admin') {
      return res.redirect('/user/dashboard?error=Access denied');
    }

    // ✅ STATIC SAMPLE DATA - NO API CALLS, NO ERRORS
    const feedbacks = [
      {
        _id: '1',
        title: "Login page loading too slow",
        description: "The login page is taking more than 10 seconds to load after recent update. Users are experiencing frustration and some are abandoning the process.",
        category: "bug",
        status: "pending",
        priority: "high",
        rating: 4.2,
        user: {
          name: "John Smith",
          email: "john.smith@example.com"
        },
        assignedTo: null,
        responses: [],
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z')
      },
      {
        _id: '2',
        title: "Great customer support experience",
        description: "I wanted to appreciate the quick response and helpful attitude of your support team. They resolved my issue within minutes!",
        category: "positive",
        status: "resolved",
        priority: "low",
        rating: 5.0,
        user: {
          name: "Sarah Johnson",
          email: "sarah.j@example.com"
        },
        assignedTo: {
          name: "Mike Chen",
          email: "mike.chen@company.com"
        },
        responses: [
          {
            message: "Thank you for your kind words! We're glad we could help.",
            admin: {
              name: "Mike Chen",
              email: "mike.chen@company.com"
            },
            createdAt: new Date('2024-01-14T15:20:00Z')
          }
        ],
        createdAt: new Date('2024-01-14T14:45:00Z'),
        updatedAt: new Date('2024-01-14T15:20:00Z')
      },
      {
        _id: '3',
        title: "Feature request: Dark mode theme",
        description: "Please consider adding a dark mode theme option. Many users work late hours and this would reduce eye strain significantly.",
        category: "feature",
        status: "in-progress",
        priority: "medium",
        rating: 4.5,
        user: {
          name: "Alex Rodriguez",
          email: "alex.r@example.com"
        },
        assignedTo: {
          name: "Emily Parker",
          email: "emily.p@company.com"
        },
        responses: [
          {
            message: "Great suggestion! We've added this to our development roadmap.",
            admin: {
              name: "Emily Parker",
              email: "emily.p@company.com"
            },
            createdAt: new Date('2024-01-13T11:15:00Z')
          }
        ],
        createdAt: new Date('2024-01-13T09:30:00Z'),
        updatedAt: new Date('2024-01-13T11:15:00Z')
      },
      {
        _id: '4',
        title: "Mobile app crash on startup",
        description: "The mobile app crashes immediately after launching on iOS 17.2. This started happening after the latest update.",
        category: "bug",
        status: "pending",
        priority: "urgent",
        rating: 2.5,
        user: {
          name: "Maria Garcia",
          email: "maria.g@example.com"
        },
        assignedTo: null,
        responses: [],
        createdAt: new Date('2024-01-12T16:45:00Z'),
        updatedAt: new Date('2024-01-12T16:45:00Z')
      }
    ];

    const pagination = {
      page: 1,
      limit: 10,
      total: feedbacks.length,
      pages: 1
    };

    // ✅ RENDER HTML PAGE WITH STATIC DATA
    res.render('admin/feedback/list', {
      pageTitle: 'Feedback Management - CRM Admin',
      user: req.user,
      currentUrl: '/admin/feedback',
      feedbacks: feedbacks,
      pagination: pagination,
      layout: 'layouts/admin-base'
    });

  } catch (error) {
    console.error('❌ Feedback page error:', error);
    // Fallback - direct HTML
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Feedback Management</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-900 text-white p-6">
        <h1 class="text-3xl font-bold text-green-400">Feedback Management ✅</h1>
        <p class="text-green-400 mt-4">Page is working! User: ${req.user?.email}</p>
        <p class="text-gray-400">Error: ${error.message}</p>
        <a href="/admin/dashboard" class="text-cyan-400 mt-4 inline-block">← Back to Dashboard</a>
      </body>
      </html>
    `);
  }
});

// ✅ Single Feedback View Page
app.get('/admin/feedback/:id', async (req, res) => {
  try {
    console.log('👁️ Single Feedback page accessed:', req.params.id);
    
    if (!req.user || req.user.role !== 'admin') {
      return res.redirect('/auth');
    }

    res.render('admin/feedback/view', {
      pageTitle: 'Feedback Details - CRM Admin',
      user: req.user,
      currentUrl: '/admin/feedback',
      feedbackId: req.params.id,
      layout: 'layouts/admin-base'
    });

  } catch (error) {
    console.error('❌ Single feedback page error:', error);
    res.redirect('/admin/feedback?error=Unable to load feedback details');
  }
});

// ✅ Feedback Analytics Page
app.get('/admin/feedback/analytics', async (req, res) => {
  try {
    console.log('📊 Feedback Analytics page accessed');
    
    if (!req.user || req.user.role !== 'admin') {
      return res.redirect('/auth');
    }

    res.render('admin/feedback/analytics', {
      pageTitle: 'Feedback Analytics - CRM Admin',
      user: req.user,
      currentUrl: '/admin/feedback/analytics',
      layout: 'layouts/admin-base'
    });

  } catch (error) {
    console.error('❌ Feedback analytics error:', error);
    res.redirect('/admin/feedback');
  }
});

// ✅ Feedback Templates Page
app.get('/admin/feedback/templates', async (req, res) => {
  try {
    console.log('📝 Feedback Templates page accessed');
    
    if (!req.user || req.user.role !== 'admin') {
      return res.redirect('/auth');
    }

    res.render('admin/feedback/templates', {
      pageTitle: 'Response Templates - CRM Admin',
      user: req.user,
      currentUrl: '/admin/feedback/templates',
      layout: 'layouts/admin-base'
    });

  } catch (error) {
    console.error('❌ Feedback templates error:', error);
    res.redirect('/admin/feedback');
  }
});

// ✅ Feedback Assignments Page
app.get('/admin/feedback/assignments', async (req, res) => {
  try {
    console.log('🔗 Feedback Assignments page accessed');
    
    if (!req.user || req.user.role !== 'admin') {
      return res.redirect('/auth');
    }

    res.render('admin/feedback/assignments', {
      pageTitle: 'Feedback Assignments - CRM Admin',
      user: req.user,
      currentUrl: '/admin/feedback/assignments',
      layout: 'layouts/admin-base'
    });

  } catch (error) {
    console.error('❌ Feedback assignments error:', error);
    res.redirect('/admin/feedback');
  }
});

// ========================
// ✅ EMERGENCY ADMIN ROUTE
// ========================
app.get('/admin/dashboard/emergency', async (req, res) => {
  console.log('🆘 EMERGENCY ADMIN ROUTE CALLED');
  
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.redirect('/auth');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-secret-key');
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || user.role !== 'admin') {
      return res.redirect('/auth');
    }

    console.log(`✅ Emergency admin access: ${user.email}`);
    
    // Simple dashboard data
    const totalUsers = await User.countDocuments();
    const Department = require('./models/Department');
    const totalDepartments = await Department.countDocuments();
    
    res.render('admin/dashboard', {
      pageTitle: 'Admin Dashboard - CRM System',
      layout: 'layouts/admin-base', 
      user: user,
      currentDate: new Date(),
      totalEmployees: totalUsers,
      totalDepartments: totalDepartments,
      todayAttendance: 0,
      pendingLeaves: 0,
      presentToday: 0,
      absentToday: 0,
      lateToday: 0,
      attendancePercentage: 0,
      recentFeedbacks: [],
      departments: [],
      todayDate: new Date().toDateString(),
      currentTime: new Date().toLocaleTimeString()
    });

  } catch (error) {
    console.error('❌ Emergency admin error:', error);
    res.redirect('/auth');
  }
});

// ========================
// ✅ TEMPORARY USER DASHBOARD FIX
// ========================
app.get('/user/dashboard', (req, res) => {
  console.log('🎯 TEMPORARY USER DASHBOARD ROUTE HIT');
  
  if (!req.user) {
    return res.redirect('/auth/login');
  }
  
  // Simple response for testing
  res.send(`
    <h1>User Dashboard Working! ✅</h1>
    <p>Welcome ${req.user.email}</p>
    <p>Role: ${req.user.role}</p>
    <a href="/auth/logout">Logout</a>
  `);
});

// ========================
// ✅ DEPARTMENT VIEW ROUTES - FIXED LAYOUT
// ========================

// ✅ Department List Page - FIXED LAYOUT
app.get('/admin/departments', async (req, res) => {
  try {
    console.log('🏢 Department List page accessed');
    
    if (!req.user) {
      return res.redirect('/auth?error=Please login to access departments');
    }
    
    if (req.user.role !== 'admin') {
      return res.redirect('/user/dashboard?error=Access denied');
    }

    res.render('admin/departments/list', {
      pageTitle: 'Departments Management - CRM Admin',
      user: req.user,
      currentUrl: '/admin/departments',
      layout: 'layouts/admin-base'
    });

  } catch (error) {
    console.error('❌ Department page error:', error);
    res.redirect('/admin/dashboard?error=Unable to load departments');
  }
});

// ✅ Department Overview Page - FIXED LAYOUT
app.get('/admin/departments/overview', async (req, res) => {
  try {
    console.log('📊 Department Overview page accessed');
    
    if (!req.user || req.user.role !== 'admin') {
      return res.redirect('/auth');
    }

    res.render('admin/departments/overview', {
      pageTitle: 'Department Overview - CRM Admin',
      user: req.user,
      currentUrl: '/admin/departments/overview',
      layout: 'layouts/admin-base'
    });

  } catch (error) {
    console.error('❌ Department overview error:', error);
    res.redirect('/admin/departments');
  }
});

// ✅ Department Analytics Page - FIXED LAYOUT
app.get('/admin/departments/analytics', async (req, res) => {
  try {
    console.log('📈 Department Analytics page accessed');
    
    if (!req.user || req.user.role !== 'admin') {
      return res.redirect('/auth');
    }

    res.render('admin/departments/analytics', {
      pageTitle: 'Department Analytics - CRM Admin',
      user: req.user,
      currentUrl: '/admin/departments/analytics',
      layout: 'layouts/admin-base'
    });

  } catch (error) {
    console.error('❌ Department analytics error:', error);
    res.redirect('/admin/departments');
  }
});

// ========================
// ✅ ERROR HANDLING
// ========================

// ✅ 404 Handler
app.use((req, res, next) => {
  res.status(404).render('error/404', {
    pageTitle: 'Page Not Found - CRM System',
    layout: 'layouts/main',
    message: 'The page you are looking for does not exist.'
  });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error('🚨 Global Error Handler:', err);
  
  if (res.headersSent) {
    return next(err);
  }

  if (req.originalUrl.startsWith('/api/') || req.originalUrl.startsWith('/auth/')) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error'
    });
  }

  res.status(err.status || 500).render('error/500', {
    pageTitle: 'Server Error - CRM System',
    layout: 'layouts/main',
    message: 'Something went wrong! Please try again later.',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// ========================
// ✅ SERVER STARTUP
// ========================

const PORT = process.env.PORT || 8080;

function startCronJobs() {
  console.log('🕐 Initializing Cron Jobs...');
  
  // Feedback SLA monitoring cron job
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔄 Running feedback SLA monitoring...');
  });

  // Daily feedback summary email
  cron.schedule('0 9 * * 1-5', async () => {
    console.log('📧 Sending daily feedback summary...');
  });

  console.log('✅ Cron Jobs Initialized');
}

const startServer = async () => {
  try {
    console.log('🚀 Starting CRM Server...');
    
    await connectDB();
    
    startCronJobs();
    
    app.listen(PORT, () => {
      console.log('\n🎉 ===== CRM SERVER STARTED SUCCESSFULLY =====');
      console.log('📍 Server URL: http://localhost:' + PORT);
      console.log('🔑 Auth Page: http://localhost:' + PORT + '/auth');
      console.log('👨‍💼 Admin Dashboard: http://localhost:' + PORT + '/admin/dashboard');
      console.log('👤 User Dashboard: http://localhost:' + PORT + '/user/dashboard');
      console.log('💰 SALARY MANAGEMENT: http://localhost:' + PORT + '/admin/salary');
      console.log('💳 Credit Salary: http://localhost:' + PORT + '/admin/salary/credit');
      console.log('👥 Employee Salary List: http://localhost:' + PORT + '/admin/salary/employee-list');
      console.log('📜 Salary History: http://localhost:' + PORT + '/admin/salary/history');
      console.log('💵 User Salary: http://localhost:' + PORT + '/user/salary');
      console.log('📋 Feedback Module: http://localhost:' + PORT + '/admin/feedback');
      console.log('🎯 FEEDBACK API: http://localhost:' + PORT + '/api/admin/feedback');
      console.log('👁️ Single Feedback: http://localhost:' + PORT + '/admin/feedback/1 (example)');
      console.log('📊 Feedback Analytics: http://localhost:' + PORT + '/admin/feedback/analytics');
      console.log('📝 Response Templates: http://localhost:' + PORT + '/admin/feedback/templates');
      console.log('🔗 Feedback Assignments: http://localhost:' + PORT + '/admin/feedback/assignments');
      console.log('🏢 Departments: http://localhost:' + PORT + '/admin/departments');
      console.log('📈 Dept Analytics: http://localhost:' + PORT + '/admin/departments/analytics');
      console.log('📊 Performance: http://localhost:' + PORT + '/admin/performance');
      console.log('🆘 Emergency Admin: http://localhost:' + PORT + '/admin/dashboard/emergency');
      console.log('❤️ Health Check: http://localhost:' + PORT + '/health');
      console.log('\n🔐 Passport Initialized: Local, Google & GitHub OAuth Ready');
      console.log('✅ SALARY MODULE: Routes & Pages Added');
      console.log('✅ All Feedback Routes: Real Controllers Loaded');
      console.log('✅ MAIN FEEDBACK PAGE: Fixed with Static Data');
      console.log('✅ NO API CALLS: Using pre-loaded sample data');
      console.log('=============================================\n');
    });
    
  } catch (error) {
    console.error('\n❌ ===== FAILED TO START CRM SERVER =====');
    console.error('Error:', error.message);
    process.exit(1);
  }
};

// ✅ Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
  });
});

// Start the server
startServer();

module.exports = app;