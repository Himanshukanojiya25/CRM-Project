const express = require('express');
const router = express.Router();
const { adminAuth } = require('../../middleware/auth');

// 📊 Dashboard - WITH TEMPORARY DATA
router.get('/', adminAuth, (req, res) => {
  console.log('💰 Salary Dashboard accessed by:', req.user.email);
  
  // ✅ TEMPORARY DATA DIRECTLY PASS KARO
  const dashboardData = {
    totalPaid: '2,45,000',
    employeesPaid: 15,
    pendingSalaries: 5,
    completionRate: 75,
    recentTransactions: [
      {
        employee: {
          name: 'John Doe',
          profilePhoto: '/images/default-avatar.png',
          designation: 'Software Engineer'
        },
        monthYear: '2024-12',
        netSalary: '45,000'
      },
      {
        employee: {
          name: 'Jane Smith', 
          profilePhoto: '/images/default-avatar.png',
          designation: 'HR Manager'
        },
        monthYear: '2024-12',
        netSalary: '65,000'
      }
    ]
  };

  res.render('admin/salary/dashboard', {
    pageTitle: 'Salary Management - CRM Admin',
    user: req.user,
    currentUrl: '/admin/salary',
    layout: 'layouts/admin-base',
    ...dashboardData
  });
});

// 💰 Credit Salary
router.get('/credit', adminAuth, (req, res) => {
  res.render('admin/salary/credit-salary', {
    pageTitle: 'Credit Salary - CRM Admin',
    user: req.user,
    currentUrl: '/admin/salary/credit',
    layout: 'layouts/admin-base'
  });
});

// 👥 Employee List
router.get('/employee-list', adminAuth, (req, res) => {
  res.render('admin/salary/employee-list', {
    pageTitle: 'Employee Salary List - CRM Admin',
    user: req.user,
    currentUrl: '/admin/salary/employee-list',
    layout: 'layouts/admin-base'
  });
});

// 📜 Salary History
router.get('/history', adminAuth, (req, res) => {
  res.render('admin/salary/history', {
    pageTitle: 'Salary History - CRM Admin',
    user: req.user,
    currentUrl: '/admin/salary/history',
    layout: 'layouts/admin-base'
  });
});

module.exports = router;