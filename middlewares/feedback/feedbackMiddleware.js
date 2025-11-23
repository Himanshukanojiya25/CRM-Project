const Feedback = require('../../models/feedback/Feedback');
const asyncHandler = require('express-async-handler');

// Check if user can access feedback
const canAccessFeedback = asyncHandler(async (req, res, next) => {
    try {
        const feedback = await Feedback.findById(req.params.id)
            .populate('user', 'name email role')
            .populate('assignedTo', 'name email role');

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found',
                errorCode: 'FEEDBACK_NOT_FOUND'
            });
        }

        // Admin can access all feedback
        if (req.user.role === 'admin') {
            req.feedback = feedback;
            return next();
        }

        // User can only access their own feedback
        if (feedback.user._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this feedback',
                errorCode: 'ACCESS_DENIED_FEEDBACK'
            });
        }

        req.feedback = feedback;
        next();
    } catch (error) {
        console.error('Feedback access middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in feedback access check',
            errorCode: 'SERVER_ERROR'
        });
    }
});

// Check if user can modify feedback
const canModifyFeedback = asyncHandler(async (req, res, next) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found',
                errorCode: 'FEEDBACK_NOT_FOUND'
            });
        }

        // Only admin can modify feedback
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can modify feedback',
                errorCode: 'ADMIN_ACCESS_REQUIRED'
            });
        }

        req.feedback = feedback;
        next();
    } catch (error) {
        console.error('Feedback modification middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in feedback modification check',
            errorCode: 'SERVER_ERROR'
        });
    }
});

// Check if user can assign feedback
const canAssignFeedback = asyncHandler(async (req, res, next) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found',
                errorCode: 'FEEDBACK_NOT_FOUND'
            });
        }

        // Only admin and team leads can assign feedback
        if (!['admin', 'team_lead'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions to assign feedback',
                errorCode: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        req.feedback = feedback;
        next();
    } catch (error) {
        console.error('Feedback assignment middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in feedback assignment check',
            errorCode: 'SERVER_ERROR'
        });
    }
});

// Validate feedback ownership for responses
const validateResponseAccess = asyncHandler(async (req, res, next) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found',
                errorCode: 'FEEDBACK_NOT_FOUND'
            });
        }

        // Admin can respond to any feedback
        if (req.user.role === 'admin') {
            req.feedback = feedback;
            return next();
        }

        // Assigned team member can respond
        if (feedback.assignedTo && feedback.assignedTo.toString() === req.user.id) {
            req.feedback = feedback;
            return next();
        }

        // User can only respond to their own feedback
        if (feedback.user.toString() === req.user.id) {
            req.feedback = feedback;
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'You are not authorized to respond to this feedback',
            errorCode: 'UNAUTHORIZED_RESPONSE'
        });
    } catch (error) {
        console.error('Feedback response access middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in response access check',
            errorCode: 'SERVER_ERROR'
        });
    }
});

// Check bulk operation permissions
const validateBulkOperations = asyncHandler(async (req, res, next) => {
    try {
        const { feedbackIds, operation } = req.body;

        if (!feedbackIds || !Array.isArray(feedbackIds) || feedbackIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid feedback IDs array is required',
                errorCode: 'INVALID_FEEDBACK_IDS'
            });
        }

        // Check if all feedbacks exist and user has access
        const feedbacks = await Feedback.find({ _id: { $in: feedbackIds } });

        if (feedbacks.length !== feedbackIds.length) {
            return res.status(404).json({
                success: false,
                message: 'One or more feedbacks not found',
                errorCode: 'FEEDBACKS_NOT_FOUND'
            });
        }

        // For non-admin users, check if they own all feedbacks
        if (req.user.role !== 'admin') {
            const unauthorizedFeedbacks = feedbacks.filter(
                feedback => feedback.user.toString() !== req.user.id
            );

            if (unauthorizedFeedbacks.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to perform this operation on some feedbacks',
                    errorCode: 'BULK_OPERATION_UNAUTHORIZED'
                });
            }
        }

        req.feedbacks = feedbacks;
        next();
    } catch (error) {
        console.error('Bulk operations middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in bulk operations check',
            errorCode: 'SERVER_ERROR'
        });
    }
});

// Rate limiting for feedback submissions
const feedbackRateLimit = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user.id;
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // Count feedbacks submitted in last hour
        const recentFeedbacks = await Feedback.countDocuments({
            user: userId,
            createdAt: { $gte: oneHourAgo }
        });

        const maxFeedbacksPerHour = process.env.MAX_FEEDBACKS_PER_HOUR || 5;

        if (recentFeedbacks >= maxFeedbacksPerHour) {
            return res.status(429).json({
                success: false,
                message: `Rate limit exceeded. Maximum ${maxFeedbacksPerHour} feedbacks per hour allowed.`,
                errorCode: 'RATE_LIMIT_EXCEEDED',
                retryAfter: 3600 // 1 hour in seconds
            });
        }

        next();
    } catch (error) {
        console.error('Rate limit middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in rate limit check',
            errorCode: 'SERVER_ERROR'
        });
    }
});

// Validate feedback data before creation
const validateFeedbackData = asyncHandler(async (req, res, next) => {
    try {
        const { subject, message, rating, category } = req.body;

        // Required fields validation
        if (!subject || !message || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Subject, message, and rating are required fields',
                errorCode: 'MISSING_REQUIRED_FIELDS'
            });
        }

        // Subject length validation
        if (subject.length > 200) {
            return res.status(400).json({
                success: false,
                message: 'Subject must be less than 200 characters',
                errorCode: 'SUBJECT_TOO_LONG'
            });
        }

        // Rating validation
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5',
                errorCode: 'INVALID_RATING'
            });
        }

        // Category validation
        const validCategories = ['bug', 'feature_request', 'complaint', 'appreciation', 'general'];
        if (category && !validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
                errorCode: 'INVALID_CATEGORY'
            });
        }

        // Message length validation
        if (message.length > 5000) {
            return res.status(400).json({
                success: false,
                message: 'Message must be less than 5000 characters',
                errorCode: 'MESSAGE_TOO_LONG'
            });
        }

        next();
    } catch (error) {
        console.error('Feedback data validation middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in data validation',
            errorCode: 'SERVER_ERROR'
        });
    }
});

// Check attachment limits
const validateAttachments = asyncHandler(async (req, res, next) => {
    try {
        if (!req.files || !req.files.attachments) {
            return next();
        }

        const attachments = Array.isArray(req.files.attachments) 
            ? req.files.attachments 
            : [req.files.attachments];

        // Check number of attachments
        const maxAttachments = process.env.MAX_FEEDBACK_ATTACHMENTS || 5;
        if (attachments.length > maxAttachments) {
            return res.status(400).json({
                success: false,
                message: `Maximum ${maxAttachments} attachments allowed per feedback`,
                errorCode: 'TOO_MANY_ATTACHMENTS'
            });
        }

        // Check file sizes
        const maxFileSize = process.env.MAX_FILE_SIZE || 5 * 1024 * 1024; // 5MB default
        const oversizedFiles = attachments.filter(file => file.size > maxFileSize);

        if (oversizedFiles.length > 0) {
            return res.status(400).json({
                success: false,
                message: `File size must be less than ${maxFileSize / (1024 * 1024)}MB`,
                errorCode: 'FILE_TOO_LARGE'
            });
        }

        // Check file types
        const allowedMimeTypes = [
            'image/jpeg', 'image/png', 'image/gif', 
            'application/pdf', 
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        const invalidFiles = attachments.filter(file => !allowedMimeTypes.includes(file.mimetype));

        if (invalidFiles.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Allowed types: images, PDF, text, Word documents',
                errorCode: 'INVALID_FILE_TYPE'
            });
        }

        req.attachments = attachments;
        next();
    } catch (error) {
        console.error('Attachment validation middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in attachment validation',
            errorCode: 'SERVER_ERROR'
        });
    }
});

module.exports = {
    canAccessFeedback,
    canModifyFeedback,
    canAssignFeedback,
    validateResponseAccess,
    validateBulkOperations,
    feedbackRateLimit,
    validateFeedbackData,
    validateAttachments
};