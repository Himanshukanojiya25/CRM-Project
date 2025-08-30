const Leave = require('../../models/Leave');
const moment = require('moment');

// Renders the leave application page with the form
exports.renderApplyPage = (req, res) => {
  res.render('user/leaves/apply', {
    errorMessage: null,
    pageTitle: 'Apply for Leave - CRM',
    layout: 'layouts/user-base' // ✅ Layout specify karo
  });
};

// Handles the leave application form submission
exports.applyLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason, leaveType } = req.body;
    const userId = req.user.id; // ✅ req.user._id -> req.user.id

    if (!startDate || !reason) {
      return res.render('user/leaves/apply', {
        errorMessage: 'Please fill out all required fields.',
        pageTitle: 'Apply for Leave - CRM',
        layout: 'layouts/user-base'
      });
    }

    let daysRequested = 0;
    if (leaveType === 'half-day') {
      daysRequested = 0.5;
    } else {
      if (!endDate) {
        return res.render('user/leaves/apply', {
          errorMessage: 'Please provide an end date for full-day leave.',
          pageTitle: 'Apply for Leave - CRM',
          layout: 'layouts/user-base'
        });
      }
      const start = moment(startDate);
      const end = moment(endDate);
      daysRequested = end.diff(start, 'days') + 1;
    }

    // ✅ Updated according to new schema
    const newLeave = await Leave.create({
      user: userId, // ✅ employeeId -> user
      leaveType: leaveType, // ✅ type -> leaveType
      startDate: new Date(startDate),
      endDate: leaveType === 'full-day' ? new Date(endDate) : new Date(startDate),
      reason: reason,
      status: 'pending',
      days: daysRequested
    });

    console.log('Leave submitted:', newLeave);
    res.redirect('/user/leaves?success=Leave applied successfully');
  } catch (error) {
    console.error('Apply Leave Error:', error);
    res.render('user/leaves/apply', {
      errorMessage: 'Failed to submit leave application. Please try again.',
      pageTitle: 'Apply for Leave - CRM',
      layout: 'layouts/user-base'
    });
  }
};

// Existing function to get the user's leave history
exports.getMyLeaves = async (req, res) => {
  try {
    const userId = req.user.id;
    const myLeaves = await Leave.find({ user: userId }).sort({ createdAt: -1 });
    
    res.render('user/leaves/list', { 
      leaves: myLeaves,
      pageTitle: 'My Leaves - CRM',
      layout: 'layouts/user-base',
      successMessage: req.query.success // ✅ Success message handle
    });
  } catch (error) {
    console.error('My Leaves Error:', error);
    res.status(500).render('error', {
      message: 'Server Error',
      pageTitle: 'Error - CRM',
      layout: 'layouts/user-base'
    });
  }
};