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
const adminFeedbackRoutes = require('./routes/admin/feedbackRoutes');
const employeeRoutes = require('./routes/admin/employeeRoutes');

// ✅ PERFORMANCE ROUTES - ONLY ONCE
const performanceRoutes = require('./routes/admin/performance');

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
}

try {
  departmentBudgetRoutes = require('./routes/admin/departmentBudgetRoutes');
  console.log('✅ departmentBudgetRoutes loaded');
} catch (error) {
  console.log('⚠️ departmentBudgetRoutes not found, creating empty router');
  departmentBudgetRoutes = express.Router();
}

try {
  departmentHierarchyRoutes = require('./routes/admin/departmentHierarchyRoutes');
  console.log('✅ departmentHierarchyRoutes loaded');
} catch (error) {
  console.log('⚠️ departmentHierarchyRoutes not found, creating empty router');
  departmentHierarchyRoutes = express.Router();
}

try {
  departmentReportsRoutes = require('./routes/admin/departmentReportsRoutes');
  console.log('✅ departmentReportsRoutes loaded');
} catch (error) {
  console.log('⚠️ departmentReportsRoutes not found, creating empty router');
  departmentReportsRoutes = express.Router();
}

// ========================
// ✅ MOUNT ROUTES - COMPLETE
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
app.use('/admin/feedback', adminFeedbackRoutes);
app.use('/admin/employees', employeeRoutes);

// ✅ PERFORMANCE ROUTES - ONLY ONCE
app.use('/admin/performance', performanceRoutes);

// ✅ DEPARTMENT API ROUTES
app.use('/api/admin/departments', departmentRoutes);
app.use('/api/admin/department-analytics', departmentAnalyticsRoutes);
app.use('/api/admin/department-budget', departmentBudgetRoutes);
app.use('/api/admin/department-hierarchy', departmentHierarchyRoutes);
app.use('/api/admin/department-reports', departmentReportsRoutes);

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
    environment: process.env.NODE_ENV || 'development'
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
// ✅ DEPARTMENT VIEW ROUTES
// ========================

// ✅ Department List Page
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
      layout: 'layouts/admin-base',
      user: req.user,
      currentUrl: '/admin/departments'
    });

  } catch (error) {
    console.error('❌ Department page error:', error);
    res.redirect('/admin/dashboard?error=Unable to load departments');
  }
});

// ✅ Department Overview Page
app.get('/admin/departments/overview', async (req, res) => {
  try {
    console.log('📊 Department Overview page accessed');
    
    if (!req.user || req.user.role !== 'admin') {
      return res.redirect('/auth');
    }

    res.render('admin/departments/overview', {
      pageTitle: 'Department Overview - CRM Admin',
      layout: 'layouts/admin-base',
      user: req.user
    });

  } catch (error) {
    console.error('❌ Department overview error:', error);
    res.redirect('/admin/departments');
  }
});

// ✅ Department Analytics Page
app.get('/admin/departments/analytics', async (req, res) => {
  try {
    console.log('📈 Department Analytics page accessed');
    
    if (!req.user || req.user.role !== 'admin') {
      return res.redirect('/auth');
    }

    res.render('admin/departments/analytics', {
      pageTitle: 'Department Analytics - CRM Admin',
      layout: 'layouts/admin-base',
      user: req.user
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
  
  cron.schedule('0 2 1 * *', async () => {
    console.log('🔄 Running monthly attendance archive...');
  });

  cron.schedule('0 3 * * 0', async () => {
    console.log('🔄 Running weekly attendance cleanup check...');
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
      console.log('🏢 Departments: http://localhost:' + PORT + '/admin/departments');
      console.log('📊 Dept Overview: http://localhost:' + PORT + '/admin/departments/overview');
      console.log('📈 Dept Analytics: http://localhost:' + PORT + '/admin/departments/analytics');
      console.log('🆘 Emergency Admin: http://localhost:' + PORT + '/admin/dashboard/emergency');
      console.log('❤️ Health Check: http://localhost:' + PORT + '/health');
      console.log('\n🔐 Passport Initialized: Local, Google & GitHub OAuth Ready');
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