const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const nodemailer = require('nodemailer');
const passport = require('passport');

// ✅ NEW: Swagger import
const swaggerDocs = require('./config/swagger');  // <<-- ADD THIS LINE

dotenv.config();

const app = express();

// ✅ Security Middleware with CSP configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://kit.fontawesome.com", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://kit.fontawesome.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com", "https://kit.fontawesome.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "http:", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://github.com"],
      objectSrc: ["'none'"]
    }
  }
}));

// ✅ CORS Configuration
app.use(cors({ 
  origin: 'http://localhost:8080', 
  credentials: true 
}));

// ✅ Rate Limiting (Login protection)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// ✅ Logging
app.use(morgan('combined'));

// ✅ Body Parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ✅ Session Middleware
app.use(session({
  secret: process.env.JWT_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ✅ Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// ✅ Passport Config
require('./config/passport');

// ✅ Static Files
app.use(express.static(path.join(__dirname, 'public')));

// ✅ EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/user-base');

// ✅ Route Imports
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

// ❌ TEMPORARY: Performance routes comment out
// const adminPerformanceRoutes = require('./routes/admin/performanceRoutes');

// ✅ Mount Routes
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
// ❌ TEMPORARY: Performance routes comment out
// app.use('/admin/performance', adminPerformanceRoutes);

// ✅ Base route
app.get('/', (req, res) => res.send('CRM Backend Running'));

// ✅ Dashboard routes
app.get("/dashboard", (req, res) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.redirect('/auth/login');
  }
  
  // Redirect based on user role
  if (req.user.role === 'admin') {
    res.redirect('/admin/dashboard');
  } else {
    res.redirect('/user/dashboard');
  }
});

// ✅ Admin Dashboard Route
app.get('/admin/dashboard', (req, res) => {
  res.render('admin/dashboard', { 
    pageTitle: 'Admin Dashboard',
    layout: 'layouts/admin-base'
  });
});

// ✅ User Dashboard Route
app.get('/user/dashboard', (req, res) => {
  res.render('user/dashboard', { 
    pageTitle: 'User Dashboard',
    layout: 'layouts/user-base'
  });
});

// ✅ Test Email Route
app.get('/test-email', async (req, res) => {
  try {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    let info = await transporter.sendMail({
      from: `"CRM Team" <${process.env.EMAIL_USER}>`,
      to: 'recipient@gmail.com',
      subject: 'Test Email from CRM',
      text: 'Yeah! Mail aa gaya! Kaam kar raha hai! 🚀',
      html: '<b>Yeah! Mail aa gaya! Kaam kar raha hai! 🚀</b>'
    });

    console.log('Message sent: %s', info.messageId);
    res.send('Email sent successfully!');
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).send('Error sending email');
  }
});

// ✅ Test delete route (for debugging)
app.delete('/test-delete/:id', async (req, res) => {
  try {
    console.log('🧪 Test delete for ID:', req.params.id);
    res.json({ message: 'Test successful', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Error Handler (Swagger se pehle bhi chalega)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// ✅ DB Connection
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// ✅ Start Server (sirf ek baar)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
  swaggerDocs(app); // <<-- ✅ NOW called correctly after server start
});
