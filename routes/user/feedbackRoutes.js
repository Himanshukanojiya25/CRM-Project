const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // ✅ ADDED: Missing fs import

const { isAuthenticated } = require('../../middlewares/authMiddleware');
const { 
  getFeedbackPage,
  submitFeedback, 
  getMyFeedbacks,
  getConfirmationPage,
  getFeedbackDetails,
  addFollowUp
} = require('../../controllers/user/feedbackController');

// ✅ Configure Multer for File Uploads - FIXED VERSION
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'public/uploads/feedback/';
    
    // Separate folders for different file types
    if (file.fieldname === 'screenshots') {
      uploadPath += 'screenshots/';
    } else if (file.fieldname === 'attachments') {
      uploadPath += 'attachments/';
    } else {
      uploadPath += 'others/';
    }

    console.log(`📁 Upload path for ${file.fieldname}: ${uploadPath}`);

    // ✅ FIXED: Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log(`✅ Created directory: ${uploadPath}`);
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + fileExtension;
    
    console.log(`📄 Saving file: ${file.originalname} as ${filename}`);
    cb(null, filename);
  }
});

// ✅ IMPROVED File Filter for Security
const fileFilter = (req, file, cb) => {
  console.log(`🔍 Checking file: ${file.originalname}, Field: ${file.fieldname}, MIME: ${file.mimetype}`);

  // Allow images for screenshots
  if (file.fieldname === 'screenshots') {
    if (file.mimetype.startsWith('image/')) {
      console.log(`✅ Screenshot accepted: ${file.originalname}`);
      cb(null, true);
    } else {
      console.log(`❌ Screenshot rejected - not an image: ${file.originalname}`);
      cb(new Error('Only image files (JPEG, PNG, GIF) are allowed for screenshots'), false);
    }
  }
  // Allow various file types for attachments
  else if (file.fieldname === 'attachments') {
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      console.log(`✅ Attachment accepted: ${file.originalname}`);
      cb(null, true);
    } else {
      console.log(`❌ Attachment rejected - invalid type: ${file.originalname} (${file.mimetype})`);
      cb(new Error(`Invalid file type for attachments. Allowed: Images, PDF, Word, Excel, Text, ZIP, RAR`), false);
    }
  } else {
    console.log(`❌ Unexpected field: ${file.fieldname}`);
    cb(new Error(`Unexpected file field: ${file.fieldname}`), false);
  }
};

// ✅ IMPROVED Multer Configuration with Better Error Handling
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 8 // Max 8 files total (3 attachments + 2 screenshots = 5, but keeping buffer)
  }
});

// ✅ Multiple file upload configuration
const uploadFields = upload.fields([
  { name: 'attachments', maxCount: 3 }, // Max 3 attachments
  { name: 'screenshots', maxCount: 2 }  // Max 2 screenshots
]);

// ✅ FEEDBACK ROUTES

// GET /user/feedback - Feedback Form Page
router.get('/', isAuthenticated, getFeedbackPage);

// POST /user/feedback - Submit Feedback (with file uploads)
router.post('/', isAuthenticated, uploadFields, submitFeedback);

// GET /user/feedback/confirmation - Feedback Submission Confirmation
router.get('/confirmation', isAuthenticated, getConfirmationPage);

// GET /user/feedback/history - User's Feedback History (Paginated)
router.get('/history', isAuthenticated, getMyFeedbacks);

// GET /user/feedback/:id - Single Feedback Details
router.get('/:id', isAuthenticated, getFeedbackDetails);

// POST /user/feedback/:id/followup - Add Follow-up Message (with attachments)
router.post('/:id/followup', isAuthenticated, upload.single('attachments'), addFollowUp);

// ✅ IMPROVED Error Handling Middleware for Multer
router.use((error, req, res, next) => {
  console.error('❌ Multer Error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      req.flash('error', 'File too large. Maximum size is 10MB.');
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      req.flash('error', 'Too many files. Maximum 3 attachments and 2 screenshots allowed.');
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      req.flash('error', 'Unexpected file field. Please use only attachments or screenshots.');
    } else if (error.code === 'LIMIT_PART_COUNT') {
      req.flash('error', 'Too many form parts.');
    } else {
      req.flash('error', `File upload error: ${error.code}`);
    }
  } else if (error) {
    // Custom error from fileFilter
    req.flash('error', error.message);
  }
  
  console.log('🔁 Redirecting to feedback page due to upload error');
  res.redirect('/user/feedback');
});

module.exports = router;