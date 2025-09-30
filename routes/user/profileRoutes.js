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

// GET Routes
router.get('/', isAuthenticated, getProfile);
router.get('/edit', isAuthenticated, getEditProfile);

// POST Routes
router.post('/update', isAuthenticated, updateProfile);
router.post('/upload-profile-photo', isAuthenticated, uploadProfile.single('profilePhoto'), uploadProfilePhoto);
router.post('/upload-cover-photo', isAuthenticated, uploadCover.single('coverPhoto'), uploadCoverPhoto);
router.post('/upload-document', isAuthenticated, docUpload.single('document'), uploadDocument);

// ✅ TEMPORARY ROUTES FOR DEBUGGING - REMOVE LATER
router.get('/debug-data', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user: {
        name: user.name,
        employeeId: user.employeeId,
        designation: user.designation,
        hasNewFields: !!(user.employeeId && user.designation),
        allData: user
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/update-db', isAuthenticated, async (req, res) => {
  try {
    const users = await User.find();
    
    let updatedCount = 0;
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
        attendancePercentage: user.attendancePercentage || 100
      };
      
      await User.findByIdAndUpdate(user._id, updateData);
      updatedCount++;
    }
    
    res.json({
      success: true,
      message: `Updated ${updatedCount} users with new fields`,
      updatedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;