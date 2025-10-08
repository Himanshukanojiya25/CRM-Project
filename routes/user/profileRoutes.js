const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  getEditProfile,
  updateProfile, 
  uploadProfilePhoto, 
  uploadCoverPhoto,
  uploadDocument,
  fixUserData
} = require('../../controllers/user/profileController');
const { isAuthenticated } = require('../../middlewares/authMiddleware');
const { uploadProfile, uploadCover, uploadDocument: docUpload } = require('../../config/multer');

// =============================================
// 📋 PROFILE ROUTES - MAIN FUNCTIONALITY
// =============================================

// GET Routes - Profile Pages
router.get('/', isAuthenticated, getProfile);
router.get('/edit', isAuthenticated, getEditProfile);

// POST Routes - Profile Actions
router.post('/update', isAuthenticated, updateProfile);
router.post('/upload-profile-photo', isAuthenticated, uploadProfile.single('profilePhoto'), uploadProfilePhoto);
router.post('/upload-cover-photo', isAuthenticated, uploadCover.single('coverPhoto'), uploadCoverPhoto);
router.post('/upload-document', isAuthenticated, docUpload.single('document'), uploadDocument);

// =============================================
// 🛠️ DEBUG & UTILITY ROUTES 
// =============================================

const User = require('../../models/User');

// Debug route to check user data
router.get('/debug-data', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -__v -createdAt -updatedAt')
      .populate('department', 'name')
      .populate('reportingManager', 'name email designation');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Enhanced debug response
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
        profilePicture: user.profilePicture,
        employeeType: user.employeeType,
        workLocation: user.workLocation,
        shiftTimings: user.shiftTimings,
        employeeStatus: user.employeeStatus,
        totalLeaves: user.totalLeaves,
        leavesTaken: user.leavesTaken,
        attendancePercentage: user.attendancePercentage,
        performanceRating: user.performanceRating,
        
        // Personal Info
        phone: user.phone,
        personalEmail: user.personalEmail,
        gender: user.gender,
        bloodGroup: user.bloodGroup,
        dob: user.dob,
        
        // Address Info
        currentAddress: user.currentAddress,
        currentAddressSimple: user.currentAddressSimple,
        permanentAddress: user.permanentAddress,
        permanentAddressSimple: user.permanentAddressSimple,
        
        // Emergency Contact
        emergencyContact: user.emergencyContact,
        emergencyContactName: user.emergencyContactName,
        emergencyContactNumber: user.emergencyContactNumber,
        
        // Skills
        skills: user.skills,
        skillsSimple: user.skillsSimple,
        
        // Education
        qualification: user.qualification,
        university: user.university,
        yearOfPassing: user.yearOfPassing,
        percentage: user.percentage,
        
        // Experience
        previousCompany: user.previousCompany,
        previousDesignation: user.previousDesignation,
        experienceYears: user.experienceYears,
        
        // Bank Details
        bankDetails: user.bankDetails,
        bankName: user.bankName,
        accountNumber: user.accountNumber,
        
        // Social Links
        socialLinks: user.socialLinks,
        linkedinProfile: user.linkedinProfile,
        twitterProfile: user.twitterProfile
      },
      virtualFields: {
        leavesRemaining: (user.totalLeaves || 12) - (user.leavesTaken || 0),
        profileCompletion: user.profileCompletion || 0
      },
      timestamps: {
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastProfileUpdate: user.lastProfileUpdate
      }
    });
  } catch (error) {
    console.error('❌ Debug data error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Fix user data utility route
router.get('/fix-data', isAuthenticated, fixUserData);

// Update database with default values (Admin only)
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
        coverPhoto: user.coverPhoto || { url: '/images/default-cover.jpg' },
        employeeType: user.employeeType || 'Full-time',
        workLocation: user.workLocation || 'Office',
        shiftTimings: user.shiftTimings || '9:30 AM - 6:30 PM',
        employeeStatus: user.employeeStatus || 'Probation',
        totalLeaves: user.totalLeaves || 12,
        leavesTaken: user.leavesTaken || 0,
        attendancePercentage: user.attendancePercentage || 100,
        performanceRating: user.performanceRating || 0,
        
        // Ensure simple fields exist
        currentAddressSimple: user.currentAddressSimple || (user.currentAddress?.street || ''),
        permanentAddressSimple: user.permanentAddressSimple || (user.permanentAddress?.street || ''),
        emergencyContactName: user.emergencyContactName || (user.emergencyContact?.name || ''),
        emergencyContactNumber: user.emergencyContactNumber || (user.emergencyContact?.phone || ''),
        skillsSimple: user.skillsSimple || (user.skills ? user.skills.map(skill => skill.name) : [])
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
        designation: updatedUser.designation,
        skillsCount: updatedUser.skillsSimple?.length || 0
      });
    }
    
    res.json({
      success: true,
      message: `✅ Successfully updated ${updatedCount} users with default values`,
      updatedCount,
      results: updateResults
    });
  } catch (error) {
    console.error('❌ Update DB error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// =============================================
// 🔧 HEALTH CHECK & MONITORING ROUTES
// =============================================

// Health check route for profile system
router.get('/health', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name email role status');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    // Check database connection
    const dbStatus = await User.db.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check file upload directories
    const uploadDirs = {
      profiles: fs.existsSync(path.join(__dirname, '../../public/uploads/profiles')),
      covers: fs.existsSync(path.join(__dirname, '../../public/uploads/covers')),
      documents: fs.existsSync(path.join(__dirname, '../../public/uploads/documents'))
    };

    res.json({
      success: true,
      message: '✅ Profile system is working correctly',
      system: {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        database: dbStatus
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      uploads: uploadDirs,
      routes: {
        available: [
          'GET /user/profile',
          'GET /user/profile/edit', 
          'POST /user/profile/update',
          'POST /user/profile/upload-profile-photo',
          'POST /user/profile/upload-cover-photo',
          'POST /user/profile/upload-document',
          'GET /user/profile/debug-data',
          'GET /user/profile/health'
        ]
      }
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Profile system health check failed',
      error: error.message
    });
  }
});

// Profile statistics route
router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const stats = {
      profile: {
        completion: user.profileCompletion || 0,
        lastUpdate: user.lastProfileUpdate,
        fieldsFilled: await calculateFilledFields(user)
      },
      professional: {
        leaves: {
          total: user.totalLeaves || 12,
          taken: user.leavesTaken || 0,
          remaining: (user.totalLeaves || 12) - (user.leavesTaken || 0)
        },
        attendance: user.attendancePercentage || 100,
        performance: user.performanceRating || 0
      },
      documents: {
        profilePhoto: !!(user.profilePhoto && user.profilePhoto !== '/images/default-avatar.png'),
        coverPhoto: !!(user.coverPhoto && user.coverPhoto.url !== '/images/default-cover.jpg'),
        totalUploads: await countUserDocuments(user)
      }
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// 🛠️ HELPER FUNCTIONS
// =============================================

// Helper function to calculate filled fields
async function calculateFilledFields(user) {
  const fields = [
    'name', 'email', 'phone', 'designation', 'employeeId',
    'personalEmail', 'gender', 'bloodGroup', 'dob',
    'currentAddressSimple', 'permanentAddressSimple',
    'emergencyContactName', 'emergencyContactNumber',
    'qualification', 'university', 'yearOfPassing',
    'previousCompany', 'previousDesignation', 'experienceYears'
  ];

  let filled = 0;
  fields.forEach(field => {
    if (user[field] && user[field] !== '' && user[field] !== 'Not assigned') {
      filled++;
    }
  });

  // Check skills
  if (user.skillsSimple && user.skillsSimple.length > 0) {
    filled++;
  } else if (user.skills && user.skills.length > 0) {
    filled++;
  }

  // Check profile photo
  if (user.profilePhoto && user.profilePhoto !== '/images/default-avatar.png') {
    filled++;
  }

  return filled;
}

// Helper function to count user documents
async function countUserDocuments(user) {
  let count = 0;
  
  // Check profile picture
  if (user.profilePicture && user.profilePicture.url !== '/images/default-avatar.png') {
    count++;
  }
  
  // Check cover photo
  if (user.coverPhoto && user.coverPhoto.url !== '/images/default-cover.jpg') {
    count++;
  }
  
  // Check documents object
  if (user.documents) {
    Object.values(user.documents).forEach(doc => {
      if (doc && doc !== '') count++;
    });
  }
  
  return count;
}

// Import required modules for helper functions
const fs = require('fs');
const path = require('path');

// =============================================
// 📤 EXPORT ROUTER
// =============================================

module.exports = router;