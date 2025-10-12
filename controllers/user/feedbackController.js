const Feedback = require('../../models/Feedback');
const User = require('../../models/User');
// const sendEmail = require('../../utils/emailSender');
const { sendEmail } = require('../../config/email'); // Changed from utils/emailSender
const fs = require('fs');
const path = require('path');

// ✅ GET /user/feedback - Render Feedback Form Page
const getFeedbackPage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name email profilePhoto');
    
    res.render('user/feedback/submit', {
      user: user,
      pageTitle: 'Submit Feedback',
      layout: 'layouts/user-base',
      categories: ['general', 'bug', 'feature', 'complaint', 'appreciation', 'suggestion'],
      priorities: ['low', 'medium', 'high', 'urgent']
    });
  } catch (error) {
    console.error('❌ Error loading feedback page:', error);
    req.flash('error', 'Error loading feedback page');
    res.redirect('/user/dashboard');
  }
};

// ✅ POST /user/feedback - Submit Advanced Feedback
const submitFeedback = async (req, res) => {
  try {
    const { 
      title, 
      message, 
      category, 
      priority, 
      rating,
      pageUrl,
      isAnonymous,
      isPublic 
    } = req.body;

    // 🔒 Validate required fields
    if (!title || title.trim() === '') {
      req.flash('error', 'Feedback title is required');
      return res.redirect('/user/feedback');
    }

    if (!message || message.trim() === '') {
      req.flash('error', 'Feedback message cannot be empty');
      return res.redirect('/user/feedback');
    }

    if (message.length > 2000) {
      req.flash('error', 'Feedback message is too long (max 2000 characters)');
      return res.redirect('/user/feedback');
    }

    // ✅ FIXED: Add proper logging for file uploads
    console.log('📁 Request files:', req.files);
    console.log('📝 Request body:', req.body);

    // 📝 Process attachments
    const attachments = [];
    if (req.files && req.files.attachments) {
      console.log('📎 Attachments found:', req.files.attachments);
      
      const files = Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments];
      
      files.forEach(file => {
        const attachmentData = {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: '/uploads/feedback/attachments/' + file.filename,
          path: file.path // ✅ ADDED: Store file path for reference
        };
        console.log('📎 Attachment data:', attachmentData);
        attachments.push(attachmentData);
      });
    } else {
      console.log('❌ No attachments found in request');
    }

    // 📝 Process screenshots
    const screenshots = [];
    if (req.files && req.files.screenshots) {
      console.log('📸 Screenshots found:', req.files.screenshots);
      
      const files = Array.isArray(req.files.screenshots) ? req.files.screenshots : [req.files.screenshots];
      
      files.forEach(file => {
        const screenshotData = {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: '/uploads/feedback/screenshots/' + file.filename,
          path: file.path, // ✅ ADDED: Store file path for reference
          caption: req.body.screenshotCaption || ''
        };
        console.log('📸 Screenshot data:', screenshotData);
        screenshots.push(screenshotData);
      });
    } else {
      console.log('❌ No screenshots found in request');
    }

    // 🌐 Collect browser information
    const browserInfo = {
      userAgent: req.headers['user-agent'] || 'Unknown',
      browser: getBrowserName(req.headers['user-agent']),
      version: getBrowserVersion(req.headers['user-agent']),
      os: getOS(req.headers['user-agent']),
      platform: getPlatform(req.headers['user-agent'])
    };

    // 📱 Detect device type
    const deviceType = detectDeviceType(req.headers['user-agent']);

    // 📝 Create advanced feedback
    const feedbackData = {
      user: req.user._id,
      title: title.trim(),
      message: message.trim(),
      category: category || 'general',
      priority: priority || 'medium',
      rating: rating ? parseInt(rating) : null,
      attachments: attachments,
      screenshots: screenshots,
      pageUrl: pageUrl || '',
      browserInfo: browserInfo,
      deviceType: deviceType,
      isAnonymous: isAnonymous === 'on' || isAnonymous === 'true',
      isPublic: isPublic === 'on' || isPublic === 'true',
      status: 'pending' // ✅ ADDED: Missing status field
    };

    console.log('📊 Final feedback data to save:', JSON.stringify(feedbackData, null, 2));

    const feedback = await Feedback.create(feedbackData);

    console.log('✅ Feedback saved successfully!');
    console.log(`📎 Attachments count: ${feedback.attachments.length}`);
    console.log(`📸 Screenshots count: ${feedback.screenshots.length}`);
    console.log(`🆔 Feedback ID: ${feedback._id}`);

    // ✅ FIXED: Verify files are actually saved
    if (attachments.length > 0) {
      attachments.forEach(att => {
        const fileExists = fs.existsSync(att.path);
        console.log(`📎 Attachment file exists: ${fileExists} - ${att.originalName}`);
      });
    }

    if (screenshots.length > 0) {
      screenshots.forEach(ss => {
        const fileExists = fs.existsSync(ss.path);
        console.log(`📸 Screenshot file exists: ${fileExists} - ${ss.originalName}`);
      });
    }

    // 📧 Send Enhanced Email Notification to Admin
    try {
      const user = await User.findById(req.user._id).select('name email');
      
      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@company.com',
        subject: `📩 New ${feedback.priority.toUpperCase()} Feedback - ${feedback.category}`,
        text: `
New Feedback Received:
User: ${user.name} (${user.email})
Title: ${feedback.title}
Category: ${feedback.category}
Priority: ${feedback.priority}
Rating: ${feedback.rating || 'Not rated'}
Message: ${feedback.message}
Attachments: ${attachments.length} files
Screenshots: ${screenshots.length} files
        `,
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; text-align: center;">
            <h1>📝 New Feedback Received</h1>
            <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; margin: 10px;">
              <strong>${feedback.priority.toUpperCase()} PRIORITY</strong>
            </div>
          </div>
          
          <div style="padding: 20px; background: #f8f9fa;">
            <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h3 style="color: #333; margin-bottom: 15px;">${feedback.title}</h3>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                  <strong>👤 User:</strong><br>
                  ${user.name} (${user.email})
                </div>
                <div>
                  <strong>📁 Category:</strong><br>
                  <span style="text-transform: capitalize;">${feedback.category}</span>
                </div>
                <div>
                  <strong>🚨 Priority:</strong><br>
                  <span style="color: ${
                    feedback.priority === 'urgent' ? '#dc3545' : 
                    feedback.priority === 'high' ? '#fd7e14' : 
                    feedback.priority === 'medium' ? '#ffc107' : '#28a745'
                  }">${feedback.priority}</span>
                </div>
                <div>
                  <strong>⭐ Rating:</strong><br>
                  ${feedback.rating ? '★'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating) : 'Not rated'}
                </div>
              </div>
              
              <div style="margin-bottom: 20px;">
                <strong>💬 Message:</strong>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; margin-top: 10px;">
                  ${feedback.message.replace(/\n/g, '<br>')}
                </div>
              </div>
              
              ${attachments.length > 0 ? `
              <div style="margin-bottom: 15px;">
                <strong>📎 Attachments (${attachments.length}):</strong><br>
                ${attachments.map(file => `
                  <div style="margin: 5px 0; padding: 8px; background: #f8f9fa; border-radius: 5px;">
                    📄 ${file.originalName} (${formatFileSize(file.size)})
                  </div>
                `).join('')}
              </div>
              ` : ''}
              
              ${screenshots.length > 0 ? `
              <div style="margin-bottom: 15px;">
                <strong>📸 Screenshots (${screenshots.length}):</strong><br>
                ${screenshots.map(file => `
                  <div style="margin: 5px 0; padding: 8px; background: #f8f9fa; border-radius: 5px;">
                    🖼️ ${file.originalName} (${formatFileSize(file.size)})
                    ${file.caption ? `<br><small>Caption: ${file.caption}</small>` : ''}
                  </div>
                `).join('')}
              </div>
              ` : ''}
              
              ${feedback.pageUrl ? `
              <div style="margin-bottom: 15px;">
                <strong>🌐 Page URL:</strong><br>
                <a href="${feedback.pageUrl}" style="color: #667eea;">${feedback.pageUrl}</a>
              </div>
              ` : ''}
              
              <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
                <strong>🛠️ Action Required:</strong><br>
                <a href="${process.env.BASE_URL || 'http://localhost:8080'}/admin/feedback/${feedback._id}" 
                   style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                   👉 Review Feedback
                </a>
              </div>
            </div>
          </div>
        </div>
        `
      });
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      // Don't fail the request if email fails
    }

    req.flash('success', '✅ Feedback submitted successfully! We will review it soon.');
    res.redirect('/user/feedback/confirmation');

  } catch (error) {
    console.error('❌ Error in submitFeedback:', error);
    console.error('❌ Error details:', error.stack);
    req.flash('error', '⚠️ Server error while submitting feedback. Please try again.');
    res.redirect('/user/feedback');
  }
};

// ✅ GET /user/feedback/confirmation - Feedback Confirmation Page
const getConfirmationPage = async (req, res) => {
  try {
    res.render('user/feedback/confirmation', {
      pageTitle: 'Feedback Submitted',
      layout: 'layouts/user-base',
      user: req.user
    });
  } catch (error) {
    console.error('❌ Error loading confirmation page:', error);
    res.redirect('/user/dashboard');
  }
};

// ✅ GET /user/feedback/history - Get User's Feedback History
const getMyFeedbacks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const feedbacks = await Feedback.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('adminResponse.respondedBy', 'name profilePhoto')
      .lean();

    // ✅ FIXED: Add proper logging for debugging
    console.log(`📋 Found ${feedbacks.length} feedbacks for user ${req.user._id}`);
    
    feedbacks.forEach(feedback => {
      console.log(`📝 Feedback ${feedback._id}:`);
      console.log(`   - Attachments: ${feedback.attachments ? feedback.attachments.length : 0}`);
      console.log(`   - Screenshots: ${feedback.screenshots ? feedback.screenshots.length : 0}`);
    });

    const total = await Feedback.countDocuments({ user: req.user._id });
    const totalPages = Math.ceil(total / limit);

    // Calculate statistics
    const stats = await Feedback.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = {};
    stats.forEach(stat => {
      statusStats[stat._id] = stat.count;
    });

    res.render('user/feedback/list', {
      user: req.user,
      feedbacks: feedbacks,
      pageTitle: 'My Feedback History',
      layout: 'layouts/user-base',
      currentPage: page,
      totalPages: totalPages,
      totalFeedbacks: total,
      statusStats: statusStats,
      categories: ['general', 'bug', 'feature', 'complaint', 'appreciation', 'suggestion']
    });

  } catch (error) {
    console.error('❌ Error in getMyFeedbacks:', error);
    req.flash('error', 'Error loading feedback history');
    res.redirect('/user/dashboard');
  }
};

// ✅ GET /user/feedback/:id - Get Single Feedback Details
const getFeedbackDetails = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    })
    .populate('user', 'name email profilePhoto')
    .populate('adminResponse.respondedBy', 'name profilePhoto email')
    .populate('resolutionDetails.resolvedBy', 'name profilePhoto')
    .populate('followUps.user', 'name profilePhoto')
    .lean();

    if (!feedback) {
      req.flash('error', 'Feedback not found');
      return res.redirect('/user/feedback/history');
    }

    // ✅ FIXED: Add debugging for feedback details
    console.log(`🔍 Feedback details for ID: ${feedback._id}`);
    console.log(`📎 Attachments: ${feedback.attachments ? feedback.attachments.length : 0}`);
    console.log(`📸 Screenshots: ${feedback.screenshots ? feedback.screenshots.length : 0}`);
    
    if (feedback.attachments && feedback.attachments.length > 0) {
      feedback.attachments.forEach((att, index) => {
        console.log(`   Attachment ${index}: ${att.originalName} -> ${att.url}`);
      });
    }
    
    if (feedback.screenshots && feedback.screenshots.length > 0) {
      feedback.screenshots.forEach((ss, index) => {
        console.log(`   Screenshot ${index}: ${ss.originalName} -> ${ss.url}`);
      });
    }

    res.render('user/feedback/details', {
      user: req.user,
      feedback: feedback,
      pageTitle: 'Feedback Details',
      layout: 'layouts/user-base'
    });

  } catch (error) {
    console.error('❌ Error in getFeedbackDetails:', error);
    req.flash('error', 'Error loading feedback details');
    res.redirect('/user/feedback/history');
  }
};

// ✅ POST /user/feedback/:id/followup - Add Follow-up Message
const addFollowUp = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
      req.flash('error', 'Follow-up message cannot be empty');
      return res.redirect(`/user/feedback/${req.params.id}`);
    }

    const feedback = await Feedback.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!feedback) {
      req.flash('error', 'Feedback not found');
      return res.redirect('/user/feedback/history');
    }

    // Process follow-up attachments
    const attachments = [];
    if (req.files && req.files.attachments) {
      const files = Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments];
      
      files.forEach(file => {
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          url: '/uploads/feedback/followups/' + file.filename,
          path: file.path // ✅ ADDED: Store file path
        });
      });
    }

    // Add follow-up to feedback
    feedback.followUps.push({
      user: req.user._id,
      message: message.trim(),
      attachments: attachments,
      createdAt: new Date()
    });

    await feedback.save();

    req.flash('success', 'Follow-up message added successfully');
    res.redirect(`/user/feedback/${req.params.id}`);

  } catch (error) {
    console.error('❌ Error in addFollowUp:', error);
    req.flash('error', 'Error adding follow-up message');
    res.redirect(`/user/feedback/${req.params.id}`);
  }
};

// ✅ Utility Functions
function getBrowserName(userAgent) {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getBrowserVersion(userAgent) {
  const matches = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/([0-9.]+)/);
  return matches ? matches[2] : 'Unknown';
}

function getOS(userAgent) {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
}

function getPlatform(userAgent) {
  if (userAgent.includes('Mobile')) return 'Mobile';
  return 'Desktop';
}

function detectDeviceType(userAgent) {
  if (userAgent.includes('Mobile')) return 'mobile';
  if (userAgent.includes('Tablet')) return 'tablet';
  return 'desktop';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ✅ Export all functions
module.exports = {
  getFeedbackPage,
  submitFeedback,
  getConfirmationPage,
  getMyFeedbacks,
  getFeedbackDetails,
  addFollowUp
};