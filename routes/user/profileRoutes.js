const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  uploadProfilePhoto, 
  uploadCoverPhoto,
  uploadDocument,
  getEditProfile 
} = require('../../controllers/user/profileController');
const { isAuthenticated } = require('../../middlewares/authMiddleware');
const { uploadProfile, uploadCover, uploadDocument: docUpload } = require('../../config/multer');

// GET Routes - Profile Pages
router.get('/', isAuthenticated, getProfile);
router.get('/edit', isAuthenticated, getEditProfile);

// POST Routes - Profile Actions
router.post('/update', isAuthenticated, updateProfile);
router.post('/upload-profile-photo', isAuthenticated, uploadProfile.single('profilePhoto'), uploadProfilePhoto);
router.post('/upload-cover-photo', isAuthenticated, uploadCover.single('coverPhoto'), uploadCoverPhoto);
router.post('/upload-document', isAuthenticated, docUpload.single('document'), uploadDocument);

// ✅ ENHANCED DEBUG ROUTES (WITH PROPER IMPORTS)
const User = require('../../models/User');

// Debug route to check user data
router.get('/debug-data', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('department', 'name')
      .populate('reportingManager', 'name email designation');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        designation: user.designation,
        department: user.department,
        reportingManager: user.reportingManager,
        profilePhoto: user.profilePhoto,
        employeeType: user.employeeType,
        workLocation: user.workLocation,
        shiftTimings: user.shiftTimings,
        employeeStatus: user.employeeStatus,
        totalLeaves: user.totalLeaves,
        leavesTaken: user.leavesTaken,
        attendancePercentage: user.attendancePercentage,
        performanceRating: user.performanceRating,
        hasNewFields: !!(user.employeeId && user.designation)
      },
      virtualFields: {
        leavesRemaining: (user.totalLeaves || 12) - (user.leavesTaken || 0),
        totalExperience: user.totalExperience || 'Not calculated',
        age: user.age || 'Not calculated'
      }
    });
  } catch (error) {
    console.error('Debug data error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Debug route to update database with default values
router.get('/update-db', isAuthenticated, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const users = await User.find();
    
    let updatedCount = 0;
    const updateResults = [];

    for (const user of users) {
      const updateData = {
        employeeId: user.employeeId || `EMP${1000 + updatedCount}`,
        designation: user.designation || 'Employee',
        profilePhoto: user.profilePhoto || '/images/default-avatar.png',
        coverPhoto: user.coverPhoto || '/images/default-cover.jpg',
        employeeType: user.employeeType || 'Full-time',
        workLocation: user.workLocation || 'Office',
        shiftTimings: user.shiftTimings || '9:30 AM - 6:30 PM',
        employeeStatus: user.employeeStatus || 'Probation',
        totalLeaves: user.totalLeaves || 12,
        leavesTaken: user.leavesTaken || 0,
        attendancePercentage: user.attendancePercentage || 100,
        performanceRating: user.performanceRating || 0
      };
      
      const updatedUser = await User.findByIdAndUpdate(
        user._id, 
        updateData, 
        { new: true }
      );
      
      updatedCount++;
      updateResults.push({
        userId: user._id,
        name: user.name,
        employeeId: updatedUser.employeeId,
        designation: updatedUser.designation
      });
    }
    
    res.json({
      success: true,
      message: `Successfully updated ${updatedCount} users with default values`,
      updatedCount,
      results: updateResults
    });
  } catch (error) {
    console.error('Update DB error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check route for profile
router.get('/health', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    message: 'Profile routes are working correctly',
    user: {
      id: req.user._id,
      name: req.user.name,
      role: req.user.role
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;