const templateService = require('../../../services/admin/feedback/templateService');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const FeedbackTemplate = require('../../../models/feedback/FeedbackTemplate');

class FeedbackTemplatesController {
    
    // @desc    Get all templates
    // @route   GET /admin/feedback/templates
    // @access  Private/Admin
    getTemplates = asyncHandler(async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                category,
                isActive
            } = req.query;

            const result = await templateService.getTemplates({
                page,
                limit,
                category,
                isActive
            });

            res.json({
                success: true,
                data: result.templates,
                pagination: result.pagination,
                message: 'Templates fetched successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Get template by ID
    // @route   GET /admin/feedback/templates/:id
    // @access  Private/Admin
    getTemplate = asyncHandler(async (req, res) => {
        try {
            const template = await templateService.getTemplateById(req.params.id);

            res.json({
                success: true,
                data: template,
                message: 'Template fetched successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Create new template
    // @route   POST /admin/feedback/templates
    // @access  Private/Admin
    createTemplate = asyncHandler(async (req, res) => {
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

            const template = await templateService.createTemplate(req.body);

            res.status(201).json({
                success: true,
                data: template,
                message: 'Template created successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Update template
    // @route   PUT /admin/feedback/templates/:id
    // @access  Private/Admin
    updateTemplate = asyncHandler(async (req, res) => {
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

            const template = await templateService.updateTemplate(
                req.params.id, 
                req.body
            );

            res.json({
                success: true,
                data: template,
                message: 'Template updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Delete template
    // @route   DELETE /admin/feedback/templates/:id
    // @access  Private/Admin
    deleteTemplate = asyncHandler(async (req, res) => {
        try {
            const template = await templateService.deleteTemplate(req.params.id);

            res.json({
                success: true,
                data: template,
                message: 'Template deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Get templates by category
    // @route   GET /admin/feedback/templates/category/:category
    // @access  Private/Admin
    getTemplatesByCategory = asyncHandler(async (req, res) => {
        try {
            const templates = await templateService.getTemplatesByCategory(req.params.category);

            res.json({
                success: true,
                data: templates,
                message: 'Templates fetched by category successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Search templates
    // @route   GET /admin/feedback/templates/search
    // @access  Private/Admin
    searchTemplates = asyncHandler(async (req, res) => {
        try {
            const { q, category, page = 1, limit = 10 } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required',
                    data: null
                });
            }

            const result = await templateService.searchTemplates(q, {
                page,
                limit,
                category
            });

            res.json({
                success: true,
                data: result.templates,
                pagination: result.pagination,
                message: 'Templates search completed successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    });

    // @desc    Get template usage statistics
    // @route   GET /admin/feedback/templates/usage/stats
    // @access  Private/Admin
    getTemplateUsageStats = asyncHandler(async (req, res) => {
        try {
            const { timeRange = '30d' } = req.query;

            const stats = await templateService.getTemplateUsageStats(timeRange);

            res.json({
                success: true,
                data: stats,
                message: 'Template usage statistics fetched successfully'
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

module.exports = new FeedbackTemplatesController();