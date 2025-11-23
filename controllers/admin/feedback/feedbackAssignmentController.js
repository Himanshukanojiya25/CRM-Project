const feedbackService = require('../../../services/admin/feedback/feedbackService');
const assignmentService = require('../../../services/admin/feedback/assignmentService');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const FeedbackAssignment = require('../../../models/feedback/FeedbackAssignment');

class FeedbackAssignmentController {
    
    // @desc    Get all assignments
    // @route   GET /admin/feedback/assignments
    // @access  Private/Admin
    getAssignments = asyncHandler(async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                assignedTo,
                dateFrom,
                dateTo
            } = req.query;

            const result = await assignmentService.getAssignments({
                page,
                limit,
                status,
                assignedTo,
                dateFrom,
                dateTo
            });

            res.json({
                success: true,
                data: result.assignments,
                pagination: result.pagination,
                message: 'Assignments fetched successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Get assignment by ID
    // @route   GET /admin/feedback/assignments/:id
    // @access  Private/Admin
    getAssignment = asyncHandler(async (req, res) => {
        try {
            const assignment = await FeedbackAssignment.findById(req.params.id)
                .populate('feedback')
                .populate('assignedTo', 'name email avatar')
                .populate('assignedBy', 'name email');

            if (!assignment) {
                return res.status(404).json({
                    success: false,
                    message: 'Assignment not found',
                    data: null
                });
            }

            res.json({
                success: true,
                data: assignment,
                message: 'Assignment fetched successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Create new assignment
    // @route   POST /admin/feedback/assignments
    // @access  Private/Admin
    createAssignment = asyncHandler(async (req, res) => {
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

            const assignment = await assignmentService.createAssignment(assignmentData);

            res.status(201).json({
                success: true,
                data: assignment,
                message: 'Assignment created successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Update assignment
    // @route   PUT /admin/feedback/assignments/:id
    // @access  Private/Admin
    updateAssignment = asyncHandler(async (req, res) => {
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

            const assignment = await assignmentService.updateAssignment(
                req.params.id, 
                req.body
            );

            res.json({
                success: true,
                data: assignment,
                message: 'Assignment updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Get my assignments
    // @route   GET /admin/feedback/assignments/my
    // @access  Private/Admin
    getMyAssignments = asyncHandler(async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                status
            } = req.query;

            const result = await assignmentService.getUserAssignments({
                userId: req.user.id,
                page,
                limit,
                status
            });

            res.json({
                success: true,
                data: result.assignments,
                pagination: result.pagination,
                message: 'My assignments fetched successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Get team performance
    // @route   GET /admin/feedback/assignments/team-performance
    // @access  Private/Admin
    getTeamPerformance = asyncHandler(async (req, res) => {
        try {
            const { timeRange = '30d' } = req.query;

            const performance = await assignmentService.getTeamPerformance(timeRange);

            res.json({
                success: true,
                data: performance,
                message: 'Team performance fetched successfully'
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

module.exports = new FeedbackAssignmentController();