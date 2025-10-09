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

// ✅ Database connection
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

const app = express();

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

    // ✅ SET req.user
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

// ✅ SIMPLE GLOBAL VARIABLES MIDDLEWARE (NO FLASH)
app.use((req, res, next) => {
  // Simple success/error messages from query params
  if (req.query.success) {
    res.locals.success = req.query.success;
  }
  if (req.query.error) {
    res.locals.error = req.query.error;
  }
  if (req.query.message) {
    res.locals.message = req.query.message;
  }
  
  // User data
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
// ✅ ROUTE IMPORTS
// ========================
const userAttendanceRoutes = require('./routes/user/attendanceRoutes');
const departmentRoutes = require('./routes/admin/departmentRoutes');
const userFeedbackRoutes = require('./routes/user/feedbackRoutes');
const adminFeedbackRoutes = require('./routes/admin/feedbackRoutes');
const adminDashboardRoutes = require('./routes/admin/dashboardRoutes');
const userDashboardRoutes = require('./routes/user/dashboardRoutes');
const userLeaveRoutes = require('./routes/user/leavesRoutes');
const adminLeaveRoutes = require('./routes/admin/leavesRoutes');
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const employeeRoutes = require('./routes/admin/employeeRoutes');
const profileRoutes = require('./routes/user/profileRoutes');
const adminPerformanceRoutes = require('./routes/admin/performanceRoutes');
const adminAttendanceRoutes = require('./routes/admin/attendanceRoutes');

// ========================
// ✅ MOUNT ROUTES
// ========================
app.use('/user/attendance', userAttendanceRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/user/leaves', userLeaveRoutes);
app.use('/admin/leaves', adminLeaveRoutes);
app.use('/user/feedback', userFeedbackRoutes);
app.use('/admin/feedback', adminFeedbackRoutes);
app.use('/admin/dashboard', adminDashboardRoutes);
app.use('/user/dashboard', userDashboardRoutes);
app.use('/auth', authRoutes);
app.use('/test', testRoutes);
app.use('/admin/employees', employeeRoutes);
app.use('/user/profile', profileRoutes);
app.use('/admin/performance', adminPerformanceRoutes);
app.use('/admin/attendance', adminAttendanceRoutes);

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
// ✅ EMERGENCY ROUTES (SIMPLE & WORKING)
// ========================

// 🚨 SIMPLE USER DASHBOARD ROUTE
app.get('/user/dashboard', async (req, res) => {
  console.log('🚨 EMERGENCY DASHBOARD ROUTE CALLED');
  
  try {
    // ✅ DIRECT JWT VERIFICATION
    const token = req.cookies.token;
    
    if (!token) {
      console.log('❌ No token');
      return res.redirect('/auth');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-secret-key');
    console.log(`🔐 Direct JWT: ${decoded.email}`);
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log(`❌ User not found`);
      res.clearCookie('token');
      return res.redirect('/auth');
    }

    console.log(`✅ Rendering dashboard for: ${user.email}`);
    
    // ✅ RENDER WITH DIRECT USER DATA
    res.render('user/dashboard', {
      pageTitle: 'User Dashboard - CRM System',
      layout: 'layouts/user-base', 
      user: user
    });

  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.clearCookie('token');
    res.redirect('/auth');
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
      console.log('❤️ Health Check: http://localhost:' + PORT + '/health');
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