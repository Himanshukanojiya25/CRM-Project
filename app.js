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
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');

// ✅ NEW: Swagger import
const swaggerDocs = require('./config/swagger');

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
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:", "https://cdnjs.cloudflare.com"], // ✅ ADDED: blob: for file uploads
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

// ✅ Session Middleware (FIXED - MongoStore added)
app.use(session({
  secret: process.env.JWT_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.DB_URI,
    collectionName: 'sessions'
  }),
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ✅ Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// ✅ Flash Middleware
app.use(flash());

// ✅ Global flash variables (har view me available)
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// ✅ Passport Config
require('./config/passport');

// ✅ ✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
// ✅ FIXED: Static Files Configuration - TERI FOLDER STRUCTURE KE HISAB SE
// ✅ ✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅

// ✅ Serve main public directory
app.use(express.static(path.join(__dirname, 'public')));

// ✅ ✅✅✅✅✅ CRITICAL FIX: Serve uploads folder with proper path
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ✅ ✅✅✅✅✅ SPECIFIC FIX: Serve feedback uploads directly - TERI STRUCTURE KE HISAB SE
app.use('/uploads/feedback/attachments', express.static(path.join(__dirname, 'public/uploads/feedback/attachments')));
app.use('/uploads/feedback/screenshots', express.static(path.join(__dirname, 'public/uploads/feedback/screenshots')));

// ✅ ✅✅✅✅✅ ADDITIONAL: Serve other upload folders bhi
app.use('/uploads/covers', express.static(path.join(__dirname, 'public/uploads/covers')));
app.use('/uploads/documents', express.static(path.join(__dirname, 'public/uploads/documents')));
app.use('/uploads/profiles', express.static(path.join(__dirname, 'public/uploads/profiles')));

// ✅ Log static file serving (for debugging)
console.log('📁 Static file paths configured:');
console.log('   - Public directory:', path.join(__dirname, 'public'));
console.log('   - Uploads directory:', path.join(__dirname, 'public/uploads'));
console.log('   - Feedback attachments:', path.join(__dirname, 'public/uploads/feedback/attachments'));
console.log('   - Feedback screenshots:', path.join(__dirname, 'public/uploads/feedback/screenshots'));

// ✅ EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('view cache', false);
app.use(expressLayouts);
app.set('layout', 'layouts/user-base');

// ✅ Default page title middleware
app.use((req, res, next) => {
  if (!res.locals.pageTitle) {
    res.locals.pageTitle = "CRM System";
  }
  next();
});

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
const profileRoutes = require('./routes/user/profileRoutes');

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
app.use('/user/profile', profileRoutes);

// ✅ Base route
app.get('/', (req, res) => res.send('CRM Backend Running'));

// ✅ Dashboard routes
app.get("/dashboard", (req, res) => {
  if (!req.user) {
    return res.redirect('/auth/login');
  }
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

// ✅ Test File Upload Route (NEW ADDED)
app.get('/test-upload', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test File Upload</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .form-group { margin: 15px 0; }
            label { display: block; margin-bottom: 5px; }
            input, button { padding: 8px 12px; }
            .success { color: green; }
            .error { color: red; }
        </style>
    </head>
    <body>
        <h1>Test File Upload</h1>
        
        <form action="/user/feedback" method="POST" enctype="multipart/form-data">
            <div class="form-group">
                <label>Title:</label>
                <input type="text" name="title" value="Test Feedback" required>
            </div>
            
            <div class="form-group">
                <label>Message:</label>
                <textarea name="message" required>This is a test feedback message</textarea>
            </div>
            
            <div class="form-group">
                <label>Screenshots:</label>
                <input type="file" name="screenshots" multiple accept="image/*">
                <small>Select multiple screenshots</small>
            </div>

            <div class="form-group">
                <label>Attachments:</label>
                <input type="file" name="attachments" multiple accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar">
                <small>Select multiple attachments</small>
            </div>

            <button type="submit">Test Upload</button>
        </form>
        
        <hr>
        <h2>Check if files are accessible:</h2>
        <a href="/uploads/feedback/screenshots/" target="_blank">Screenshots Folder</a><br>
        <a href="/uploads/feedback/attachments/" target="_blank">Attachments Folder</a>
        
        <hr>
        <h2>Upload Directory Status:</h2>
        <div id="status"></div>
        
        <script>
            // Check if upload directories are accessible
            async function checkDirectories() {
                const statusDiv = document.getElementById('status');
                const directories = [
                    '/uploads/feedback/screenshots/',
                    '/uploads/feedback/attachments/'
                ];
                
                for (const dir of directories) {
                    try {
                        const response = await fetch(dir);
                        statusDiv.innerHTML += \`<p class="\${response.ok ? 'success' : 'error'}">\${dir} - \${response.ok ? '✅ Accessible' : '❌ Not accessible'}</p>\`;
                    } catch (error) {
                        statusDiv.innerHTML += \`<p class="error">\${dir} - ❌ Error: \${error.message}</p>\`;
                    }
                }
            }
            
            checkDirectories();
        </script>
    </body>
    </html>
  `);
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
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads accessible at: http://localhost:${PORT}/uploads/`);
  console.log(`🔧 Test upload page: http://localhost:${PORT}/test-upload`);
  console.log(`📚 Swagger Docs available at http://localhost:${PORT}/api-docs`);
  swaggerDocs(app);
});