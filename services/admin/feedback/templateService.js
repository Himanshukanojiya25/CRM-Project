const FeedbackTemplate = require('../../../models/feedback/FeedbackTemplate');

class TemplateService {
    
    // Get all templates with filtering
    async getTemplates({ page = 1, limit = 10, category, isActive } = {}) {
        try {
            const filter = {};
            
            if (category) filter.category = category;
            if (isActive !== undefined) filter.isActive = isActive;

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: { createdAt: -1 },
                lean: true
            };

            const result = await FeedbackTemplate.paginate(filter, options);
            
            return {
                templates: result.docs,
                pagination: {
                    currentPage: result.page,
                    totalPages: result.totalPages,
                    totalItems: result.totalDocs,
                    hasNext: result.hasNextPage,
                    hasPrev: result.hasPrevPage
                }
            };
        } catch (error) {
            throw new Error(`Failed to fetch templates: ${error.message}`);
        }
    }

    // Get template by ID
    async getTemplateById(templateId) {
        try {
            const template = await FeedbackTemplate.findById(templateId);
            if (!template) {
                throw new Error('Template not found');
            }
            return template;
        } catch (error) {
            throw new Error(`Failed to fetch template: ${error.message}`);
        }
    }

    // Create new template
    async createTemplate(templateData) {
        try {
            const template = new FeedbackTemplate(templateData);
            await template.save();
            return template;
        } catch (error) {
            throw new Error(`Failed to create template: ${error.message}`);
        }
    }

    // Update template
    async updateTemplate(templateId, updates) {
        try {
            const template = await FeedbackTemplate.findByIdAndUpdate(
                templateId,
                { ...updates, updatedAt: new Date() },
                { new: true, runValidators: true }
            );

            if (!template) {
                throw new Error('Template not found');
            }

            return template;
        } catch (error) {
            throw new Error(`Failed to update template: ${error.message}`);
        }
    }

    // Delete template (soft delete)
    async deleteTemplate(templateId) {
        try {
            const template = await FeedbackTemplate.findByIdAndUpdate(
                templateId,
                { isActive: false, updatedAt: new Date() },
                { new: true }
            );

            if (!template) {
                throw new Error('Template not found');
            }

            return template;
        } catch (error) {
            throw new Error(`Failed to delete template: ${error.message}`);
        }
    }

    // Get templates by category
    async getTemplatesByCategory(category) {
        try {
            const templates = await FeedbackTemplate.find({
                category,
                isActive: true
            }).sort({ name: 1 });

            return templates;
        } catch (error) {
            throw new Error(`Failed to fetch templates by category: ${error.message}`);
        }
    }

    // Apply template to feedback (replace placeholders)
    applyTemplate(template, feedback, admin) {
        let content = template.content;
        
        // Replace placeholders with actual data
        const placeholders = {
            '{{user.name}}': feedback.user?.name || 'Customer',
            '{{admin.name}}': admin.name,
            '{{feedback.subject}}': feedback.subject,
            '{{feedback.message}}': feedback.message,
            '{{company.name}}': process.env.COMPANY_NAME || 'Our Company',
            '{{current.date}}': new Date().toLocaleDateString(),
            '{{feedback.id}}': feedback._id.toString()
        };

        Object.keys(placeholders).forEach(placeholder => {
            content = content.replace(new RegExp(placeholder, 'g'), placeholders[placeholder]);
        });

        return content;
    }

    // Search templates by keyword
    async searchTemplates(keyword, options = {}) {
        try {
            const { page = 1, limit = 10, category } = options;
            
            const filter = {
                isActive: true,
                $or: [
                    { name: { $regex: keyword, $options: 'i' } },
                    { content: { $regex: keyword, $options: 'i' } },
                    { category: { $regex: keyword, $options: 'i' } }
                ]
            };

            if (category) filter.category = category;

            const result = await FeedbackTemplate.paginate(filter, {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: { createdAt: -1 },
                lean: true
            });

            return {
                templates: result.docs,
                pagination: {
                    currentPage: result.page,
                    totalPages: result.totalPages,
                    totalItems: result.totalDocs
                }
            };
        } catch (error) {
            throw new Error(`Failed to search templates: ${error.message}`);
        }
    }

    // Get template usage statistics
    async getTemplateUsageStats(timeRange = '30d') {
        try {
            const dateFilter = this.getDateFilter(timeRange);
            
            const stats = await FeedbackTemplate.aggregate([
                {
                    $lookup: {
                        from: 'feedbackresponses',
                        localField: '_id',
                        foreignField: 'templateUsed',
                        as: 'usage'
                    }
                },
                {
                    $project: {
                        name: 1,
                        category: 1,
                        totalUsage: { $size: '$usage' },
                        recentUsage: {
                            $size: {
                                $filter: {
                                    input: '$usage',
                                    as: 'response',
                                    cond: { $gte: ['$$response.createdAt', dateFilter.$gte] }
                                }
                            }
                        },
                        lastUsed: { $max: '$usage.createdAt' }
                    }
                },
                { $sort: { recentUsage: -1 } }
            ]);

            return stats;
        } catch (error) {
            throw new Error(`Failed to get template usage stats: ${error.message}`);
        }
    }

    // Helper method for date filtering
    getDateFilter(timeRange) {
        const now = new Date();
        const filter = { $gte: new Date(now.setDate(now.getDate() - 30)) }; // Default 30 days
        
        switch (timeRange) {
            case '7d':
                filter.$gte = new Date(now.setDate(now.getDate() - 7));
                break;
            case '30d':
                filter.$gte = new Date(now.setDate(now.getDate() - 30));
                break;
            case '90d':
                filter.$gte = new Date(now.setDate(now.getDate() - 90));
                break;
        }
        
        return filter;
    }
}

module.exports = new TemplateService();y