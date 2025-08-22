const express = require('express');
const session = require('express-session'); // ✅ Naya import
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

dotenv.config();

const app = express();

// ✅ Security Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:8080', credentials: true })); // ✅ Port 8080 kar diya

// ✅ Rate Limiting (Login protection)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// ✅ Logging
app.use(morgan('combined'));

// ✅ Body Parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ✅ Session Middleware (Body parsing ke baad)
app.use(session({
  secret: process.env.JWT_SECRET || 'your_secret_key', // Session encryption key
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // HTTPS nahi hai toh false rakho
}));

// ✅ Passport Initialization (app define ke baad)
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
app.set('layout', 'layouts/user-base'); // Default layout

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

// ✅ Base route
app.get('/', (req, res) => res.send('CRM Backend Running'));

// ✅ Dashboard route with layout override example
app.get("/dashboard", (req, res) => {
  res.render("dashboard/index", { title: "Dashboard", layout: 'layouts/user-base' });
});

// ✅ Test Email Route (Temporary - remove later)
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

// ✅ Error Handler
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

// ✅ Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));