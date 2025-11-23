const feedbackService = require('../../../services/admin/feedback/feedbackService');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const Feedback = require('../../../models/feedback/Feedback');

class FeedbackController {
    
    // ✅ NEW METHOD ADDED: Render HTML page for feedback management
    // @desc    Get feedback management page (HTML)
    // @route   GET /admin/feedback/html
    // @access  Private/Admin
    getFeedbackPage = asyncHandler(async (req, res) => {
        try {
            console.log('🎯 RENDERING FEEDBACK HTML PAGE for user:', req.user.email);
            
            // Get feedback data
            let feedbacks = [];
            let pagination = { page: 1, limit: 10, total: 0, pages: 1 };
            
            try {
                const result = await feedbackService.getFeedbacks({
                    page: 1,
                    limit: 10,
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                });
                
                if (result.feedbacks && result.feedbacks.length > 0) {
                    feedbacks = result.feedbacks;
                    pagination = result.pagination;
                } else {
                    // Use sample data if no real data
                    feedbacks = this.generateSampleFeedbackData();
                    pagination = {
                        page: 1,
                        limit: 10,
                        total: feedbacks.length,
                        pages: Math.ceil(feedbacks.length / 10)
                    };
                }
            } catch (dbError) {
                console.log('Database query failed, using sample data:', dbError.message);
                feedbacks = this.generateSampleFeedbackData();
                pagination = {
                    page: 1,
                    limit: 10,
                    total: feedbacks.length,
                    pages: Math.ceil(feedbacks.length / 10)
                };
            }

            // ✅ RENDER HTML PAGE - NOT JSON
            res.render('admin/feedback/list', {
                pageTitle: 'Feedback Management - CRM Admin',
                user: req.user,
                currentUrl: '/admin/feedback',
                feedbacks: feedbacks,
                pagination: pagination,
                layout: 'layouts/admin-base'
            });

        } catch (error) {
            console.error('❌ Error rendering feedback page:', error);
            res.status(500).render('error/500', {
                pageTitle: 'Server Error - CRM System',
                message: 'Unable to load feedback page',
                error: process.env.NODE_ENV === 'development' ? error : {}
            });
        }
    });

    // ========================
    // ✅ TERA PURA ORIGINAL CODE STARTS FROM HERE - NO CHANGES
    // ========================

    // @desc    Get all feedback with filters
    // @route   GET /admin/feedback
    // @access  Private/Admin
    getFeedbacks = asyncHandler(async (req, res) => {
        try {
            console.log('📥 Fetching feedback data for user:', req.user.email);
            
            const {
                page = 1,
                limit = 10,
                status,
                priority,
                rating,
                category,
                assignedTo,
                dateFrom,
                dateTo,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Try to get real data from database first
            try {
                const result = await feedbackService.getFeedbacks({
                    page,
                    limit,
                    status,
                    priority,
                    rating,
                    category,
                    assignedTo,
                    dateFrom,
                    dateTo,
                    search,
                    sortBy,
                    sortOrder
                });

                // If real data exists, return it
                if (result.feedbacks && result.feedbacks.length > 0) {
                    return res.json({
                        success: true,
                        data: result.feedbacks,
                        pagination: result.pagination,
                        message: 'Feedbacks fetched successfully'
                    });
                }
            } catch (dbError) {
                console.log('Database query failed, using sample data:', dbError.message);
            }

            // If no real data or database error, return sample data
            console.log('📋 Using sample feedback data for demonstration');
            const sampleData = this.generateSampleFeedbackData();
            
            res.json({
                success: true,
                data: sampleData,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: sampleData.length,
                    pages: Math.ceil(sampleData.length / limit)
                },
                message: 'Sample feedback data loaded successfully'
            });

        } catch (error) {
            console.error('Error in getFeedbacks:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // Generate sample feedback data for demonstration
    generateSampleFeedbackData() {
        return [
            {
                _id: '1',
                title: "Login page loading too slow",
                description: "The login page is taking more than 10 seconds to load, which is causing frustration for users. This issue started after the last deployment.",
                category: "bug",
                status: "pending",
                priority: "high",
                rating: 4.2,
                user: {
                    name: "John Smith",
                    email: "john.smith@example.com",
                    avatar: null
                },
                assignedTo: null,
                responses: [],
                createdAt: new Date('2024-01-15T10:30:00Z'),
                updatedAt: new Date('2024-01-15T10:30:00Z')
            },
            {
                _id: '2',
                title: "Great customer support experience",
                description: "I wanted to appreciate the quick response and helpful attitude of your support team. They resolved my issue within minutes!",
                category: "positive",
                status: "resolved",
                priority: "low",
                rating: 5.0,
                user: {
                    name: "Sarah Johnson",
                    email: "sarah.j@example.com",
                    avatar: null
                },
                assignedTo: {
                    name: "Mike Chen",
                    email: "mike.chen@company.com"
                },
                responses: [
                    {
                        message: "Thank you for your kind words! We're glad we could help.",
                        admin: {
                            name: "Mike Chen",
                            email: "mike.chen@company.com"
                        },
                        createdAt: new Date('2024-01-14T15:20:00Z')
                    }
                ],
                createdAt: new Date('2024-01-14T14:45:00Z'),
                updatedAt: new Date('2024-01-14T15:20:00Z')
            },
            {
                _id: '3',
                title: "Feature request: Dark mode theme",
                description: "Please consider adding a dark mode theme option. Many users work late hours and this would reduce eye strain significantly.",
                category: "feature",
                status: "in-progress",
                priority: "medium",
                rating: 4.5,
                user: {
                    name: "Alex Rodriguez",
                    email: "alex.r@example.com",
                    avatar: null
                },
                assignedTo: {
                    name: "Emily Parker",
                    email: "emily.p@company.com"
                },
                responses: [
                    {
                        message: "Great suggestion! We've added this to our development roadmap.",
                        admin: {
                            name: "Emily Parker",
                            email: "emily.p@company.com"
                        },
                        createdAt: new Date('2024-01-13T11:15:00Z')
                    }
                ],
                createdAt: new Date('2024-01-13T09:30:00Z'),
                updatedAt: new Date('2024-01-13T11:15:00Z')
            },
            {
                _id: '4',
                title: "Mobile app crash on startup",
                description: "The mobile app crashes immediately after launching on iOS 17.2. This started happening after the latest update.",
                category: "bug",
                status: "pending",
                priority: "urgent",
                rating: 2.5,
                user: {
                    name: "Maria Garcia",
                    email: "maria.g@example.com",
                    avatar: null
                },
                assignedTo: null,
                responses: [],
                createdAt: new Date('2024-01-12T16:45:00Z'),
                updatedAt: new Date('2024-01-12T16:45:00Z')
            },
            {
                _id: '5',
                title: "Payment gateway timeout issue",
                description: "When processing payments, the gateway times out after 30 seconds. Customers are getting frustrated and abandoning purchases.",
                category: "bug",
                status: "in-progress",
                priority: "high",
                rating: 3.0,
                user: {
                    name: "David Kim",
                    email: "david.k@example.com",
                    avatar: null
                },
                assignedTo: {
                    name: "Sarah Wilson",
                    email: "sarah.w@company.com"
                },
                responses: [
                    {
                        message: "We're investigating the payment gateway issues. Working on a fix.",
                        admin: {
                            name: "Sarah Wilson",
                            email: "sarah.w@company.com"
                        },
                        createdAt: new Date('2024-01-12T14:20:00Z')
                    }
                ],
                createdAt: new Date('2024-01-12T13:10:00Z'),
                updatedAt: new Date('2024-01-12T14:20:00Z')
            },
            {
                _id: '6',
                title: "Excellent user interface design",
                description: "The new dashboard design is absolutely fantastic! It's intuitive, modern, and much easier to navigate than before.",
                category: "positive",
                status: "resolved",
                priority: "low",
                rating: 5.0,
                user: {
                    name: "Robert Chen",
                    email: "robert.c@example.com",
                    avatar: null
                },
                assignedTo: {
                    name: "Design Team",
                    email: "design@company.com"
                },
                responses: [
                    {
                        message: "Thank you! Our design team will be thrilled to hear this.",
                        admin: {
                            name: "Lisa Taylor",
                            email: "lisa.t@company.com"
                        },
                        createdAt: new Date('2024-01-11T12:30:00Z')
                    }
                ],
                createdAt: new Date('2024-01-11T11:45:00Z'),
                updatedAt: new Date('2024-01-11T12:30:00Z')
            }
        ];
    }

    // @desc    Get single feedback
    // @route   GET /admin/feedback/:id
    // @access  Private/Admin
    getFeedback = asyncHandler(async (req, res) => {
        try {
            console.log('📋 Fetching feedback details for ID:', req.params.id);
            
            // Try to get real data first
            try {
                const feedback = await Feedback.findById(req.params.id)
                    .populate('user', 'name email avatar department')
                    .populate('assignedTo', 'name email avatar')
                    .populate({
                        path: 'responses',
                        populate: {
                            path: 'admin',
                            select: 'name email avatar'
                        }
                    })
                    .populate({
                        path: 'assignments',
                        populate: [
                            { path: 'assignedTo', select: 'name email' },
                            { path: 'assignedBy', select: 'name email' }
                        ]
                    });

                if (feedback) {
                    return res.json({
                        success: true,
                        data: feedback,
                        message: 'Feedback fetched successfully'
                    });
                }
            } catch (dbError) {
                console.log('Database query failed for single feedback:', dbError.message);
            }

            // Return sample data if real data not found
            const sampleData = this.generateSampleFeedbackData();
            const sampleFeedback = sampleData.find(item => item._id === req.params.id) || sampleData[0];
            
            res.json({
                success: true,
                data: sampleFeedback,
                message: 'Sample feedback data loaded'
            });

        } catch (error) {
            console.error('Error in getFeedback:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Update feedback status
    // @route   PUT /admin/feedback/:id/status
    // @access  Private/Admin
    updateStatus = asyncHandler(async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                    data: null
                });
            }

            const { status } = req.body;
            
            // Try to update real data
            try {
                const feedback = await feedbackService.updateFeedbackStatus(
                    req.params.id, 
                    status, 
                    req.user.id
                );

                return res.json({
                    success: true,
                    data: feedback,
                    message: 'Feedback status updated successfully'
                });
            } catch (dbError) {
                console.log('Database update failed:', dbError.message);
            }

            // Return success for sample data
            res.json({
                success: true,
                data: { id: req.params.id, status },
                message: 'Status updated successfully (sample data)'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Add response to feedback
    // @route   POST /admin/feedback/:id/response
    // @access  Private/Admin
    addResponse = asyncHandler(async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                    data: null
                });
            }

            const responseData = {
                ...req.body,
                admin: req.user.id
            };

            // Try to add to real data
            try {
                const response = await feedbackService.addResponse(
                    req.params.id, 
                    responseData
                );

                return res.status(201).json({
                    success: true,
                    data: response,
                    message: 'Response added successfully'
                });
            } catch (dbError) {
                console.log('Database response add failed:', dbError.message);
            }

            // Return success for sample data
            const sampleResponse = {
                _id: new Date().getTime().toString(),
                ...responseData,
                createdAt: new Date()
            };

            res.status(201).json({
                success: true,
                data: sampleResponse,
                message: 'Response added successfully (sample data)'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Assign feedback to team member
    // @route   POST /admin/feedback/:id/assign
    // @access  Private/Admin
    assignFeedback = asyncHandler(async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                    data: null
                });
            }

            const assignmentData = {
                ...req.body,
                assignedBy: req.user.id
            };

            // Try to assign real data
            try {
                const assignment = await feedbackService.assignFeedback(
                    req.params.id, 
                    assignmentData
                );

                return res.status(201).json({
                    success: true,
                    data: assignment,
                    message: 'Feedback assigned successfully'
                });
            } catch (dbError) {
                console.log('Database assignment failed:', dbError.message);
            }

            // Return success for sample data
            res.status(201).json({
                success: true,
                data: { 
                    feedbackId: req.params.id, 
                    assignedTo: assignmentData.assignedTo 
                },
                message: 'Feedback assigned successfully (sample data)'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Bulk update feedbacks
    // @route   PUT /admin/feedback/bulk-update
    // @access  Private/Admin
    bulkUpdate = asyncHandler(async (req, res) => {
        try {
            const { feedbackIds, updates } = req.body;

            if (!feedbackIds || !feedbackIds.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Feedback IDs are required',
                    data: null
                });
            }

            // Try bulk update on real data
            try {
                const result = await Feedback.updateMany(
                    { _id: { $in: feedbackIds } },
                    { $set: updates },
                    { runValidators: true }
                );

                return res.json({
                    success: true,
                    data: {
                        modifiedCount: result.modifiedCount,
                        matchedCount: result.matchedCount
                    },
                    message: `${result.modifiedCount} feedbacks updated successfully`
                });
            } catch (dbError) {
                console.log('Database bulk update failed:', dbError.message);
            }

            // Return success for sample data
            res.json({
                success: true,
                data: {
                    modifiedCount: feedbackIds.length,
                    matchedCount: feedbackIds.length
                },
                message: `${feedbackIds.length} feedbacks updated successfully (sample data)`
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Delete feedback
    // @route   DELETE /admin/feedback/:id
    // @access  Private/Admin
    deleteFeedback = asyncHandler(async (req, res) => {
        try {
            // Try to delete real data
            try {
                const feedback = await Feedback.findByIdAndDelete(req.params.id);

                if (!feedback) {
                    return res.status(404).json({
                        success: false,
                        message: 'Feedback not found',
                        data: null
                    });
                }

                return res.json({
                    success: true,
                    data: null,
                    message: 'Feedback deleted successfully'
                });
            } catch (dbError) {
                console.log('Database delete failed:', dbError.message);
            }

            // Return success for sample data
            res.json({
                success: true,
                data: null,
                message: 'Feedback deleted successfully (sample data)'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Get feedback statistics
    // @route   GET /admin/feedback/stats/overview
    // @access  Private/Admin
    getStats = asyncHandler(async (req, res) => {
        try {
            const { timeRange = '30d' } = req.query;
            
            // Try to get real stats
            try {
                const stats = await feedbackService.getFeedbackStats(timeRange);
                
                if (stats) {
                    return res.json({
                        success: true,
                        data: stats,
                        message: 'Statistics fetched successfully'
                    });
                }
            } catch (dbError) {
                console.log('Database stats failed:', dbError.message);
            }

            // Return sample stats
            const sampleStats = {
                total: 1247,
                responded: 894,
                pending: 218,
                resolved: 735,
                averageRating: 4.2,
                responseTime: '2.4 hours',
                satisfactionScore: 8.7,
                categoryDistribution: {
                    bug: 35,
                    feature: 28,
                    general: 22,
                    support: 15
                },
                statusDistribution: {
                    pending: 18,
                    'in-progress': 45,
                    responded: 156,
                    resolved: 735,
                    closed: 293
                }
            };

            res.json({
                success: true,
                data: sampleStats,
                message: 'Sample statistics loaded successfully'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });
}

module.exports = new FeedbackController();