const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts'); // ✅ Add this
dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/user', require('./routes/user/dashboardRoutes'));

// ✅ Route Imports (match your actual filenames)
const userAttendanceRoutes = require('./routes/user/attendanceRoutes');
const departmentRoutes = require('./routes/admin/departmentRoutes');
const userFeedbackRoutes = require('./routes/user/feedbackRoutes');
const adminFeedbackRoutes = require('./routes/admin/feedbackRoutes');
const adminDashboardRoutes = require('./routes/admin/dashboardRoutes');
const userDashboardRoutes = require('./routes/user/dashboardRoutes'); // ✅ Only once!
const userLeaveRoutes = require('./routes/user/leavesRoutes');
const adminLeaveRoutes = require('./routes/admin/leavesRoutes');
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const employeeRoutes = require('./routes/admin/employeeRoutes');
   

app.set('view engine', 'ejs'); // ✅ Set view engine to EJS
app.set('views', path.join(__dirname, 'views'));
// app.set('layout', false); // disable default layout
app.use(expressLayouts);                               // ✅ this is most important
app.set('layout', 'layouts/user-base'); // ✅ This will apply to ALL pages



// ✅ Mount Routes 

app.use('/user/attendance', userAttendanceRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/user/leaves', userLeaveRoutes);
app.use('/admin/leaves', adminLeaveRoutes);
app.use('/user/feedback', userFeedbackRoutes);
app.use('/admin/feedback', adminFeedbackRoutes);
app.use('/admin/dashboard', adminDashboardRoutes);
app.use('/user/dashboard', userDashboardRoutes); // ✅ Clean mount
app.use('/auth', authRoutes);
app.use('/test', testRoutes);
app.use('/admin/employees', employeeRoutes);

// ✅ Middleware to set common locals
app.set('view engine', 'ejs'); // ✅ Set view engine to EJS
app.set('views', path.join(__dirname, 'views'));


// ✅ Base route
app.get('/', (req, res) => res.send('CRM Backend Running'));

// ✅ Example route for dashboard
app.get("/dashboard", (req, res) => {
  res.render("dashboard/index", { title: "Dashboard" });
});


// ✅ Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// ✅ DB Connection
mongoose.connect(process.env.DB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ✅ Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
