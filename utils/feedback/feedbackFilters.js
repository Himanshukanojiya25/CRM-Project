const Feedback = require('../../models/feedback/Feedback');

class FeedbackFilters {
    
    // Build filter object from query parameters
    buildFilterFromQuery(query) {
        const filter = {};

        // Status filter
        if (query.status) {
            if (Array.isArray(query.status)) {
                filter.status = { $in: query.status };
            } else {
                filter.status = query.status;
            }
        }

        // Priority filter
        if (query.priority) {
            if (Array.isArray(query.priority)) {
                filter.priority = { $in: query.priority };
            } else {
                filter.priority = query.priority;
            }
        }

        // Rating filter
        if (query.rating) {
            if (Array.isArray(query.rating)) {
                filter.rating = { $in: query.rating.map(r => parseInt(r)) };
            } else {
                filter.rating = parseInt(query.rating);
            }
        }

        // Category filter
        if (query.category) {
            if (Array.isArray(query.category)) {
                filter.category = { $in: query.category };
            } else {
                filter.category = query.category;
            }
        }

        // Assigned to filter
        if (query.assignedTo) {
            filter.assignedTo = query.assignedTo;
        }

        // Date range filter
        if (query.dateFrom || query.dateTo) {
            filter.createdAt = {};
            if (query.dateFrom) {
                filter.createdAt.$gte = new Date(query.dateFrom);
            }
            if (query.dateTo) {
                filter.createdAt.$lte = new Date(query.dateTo);
            }
        }

        // Search filter
        if (query.search) {
            filter.$or = [
                { subject: { $regex: query.search, $options: 'i' } },
                { message: { $regex: query.search, $options: 'i' } },
                { 'user.name': { $regex: query.search, $options: 'i' } },
                { 'user.email': { $regex: query.search, $options: 'i' } }
            ];
        }

        // Sentiment filter
        if (query.sentiment) {
            filter['sentiment.label'] = query.sentiment;
        }

        // SLA breach filter
        if (query.slaBreached !== undefined) {
            filter.slaBreached = query.slaBreached === 'true';
        }

        return filter;
    }

    // Build sort object from query parameters
    buildSortFromQuery(query) {
        const sort = {};
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

        // Map frontend sort fields to database fields
        const fieldMapping = {
            'date': 'createdAt',
            'rating': 'rating',
            'priority': 'priority',
            'status': 'status',
            'subject': 'subject',
            'user': 'user.name',
            'assignedTo': 'assignedTo.name'
        };

        const dbField = fieldMapping[sortBy] || sortBy;
        sort[dbField] = sortOrder;

        // Secondary sort for consistent ordering
        if (sortBy !== 'createdAt') {
            sort.createdAt = -1;
        }

        return sort;
    }

    // Get available filter options for frontend
    async getFilterOptions() {
        try {
            const options = await Feedback.aggregate([
                {
                    $facet: {
                        statuses: [
                            { $group: { _id: '$status', count: { $sum: 1 } } },
                            { $sort: { count: -1 } }
                        ],
                        priorities: [
                            { $group: { _id: '$priority', count: { $sum: 1 } } },
                            { $sort: { count: -1 } }
                        ],
                        categories: [
                            { $group: { _id: '$category', count: { $sum: 1 } } },
                            { $sort: { count: -1 } }
                        ],
                        ratings: [
                            { $group: { _id: '$rating', count: { $sum: 1 } } },
                            { $sort: { _id: 1 } }
                        ],
                        sentiments: [
                            { $group: { _id: '$sentiment.label', count: { $sum: 1 } } },
                            { $sort: { count: -1 } }
                        ]
                    }
                }
            ]);

            return {
                statuses: this.formatOptions(options[0].statuses),
                priorities: this.formatOptions(options[0].priorities),
                categories: this.formatOptions(options[0].categories),
                ratings: this.formatOptions(options[0].ratings),
                sentiments: this.formatOptions(options[0].sentiments)
            };
        } catch (error) {
            throw new Error(`Failed to get filter options: ${error.message}`);
        }
    }

    // Get date range options
    getDateRangeOptions() {
        const now = new Date();
        return {
            today: {
                start: new Date(now.setHours(0, 0, 0, 0)),
                end: new Date(now.setHours(23, 59, 59, 999))
            },
            yesterday: {
                start: new Date(now.setDate(now.getDate() - 1)),
                end: new Date(now.setHours(23, 59, 59, 999))
            },
            last7Days: {
                start: new Date(now.setDate(now.getDate() - 7)),
                end: new Date()
            },
            last30Days: {
                start: new Date(now.setDate(now.getDate() - 30)),
                end: new Date()
            },
            thisMonth: {
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: new Date()
            },
            lastMonth: {
                start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                end: new Date(now.getFullYear(), now.getMonth(), 0)
            }
        };
    }

    // Apply advanced filters for analytics
    buildAnalyticsFilter(query) {
        const filter = this.buildFilterFromQuery(query);

        // Add analytics-specific filters
        if (query.responseTimeMin || query.responseTimeMax) {
            filter.responseTime = {};
            if (query.responseTimeMin) {
                filter.responseTime.$gte = parseFloat(query.responseTimeMin);
            }
            if (query.responseTimeMax) {
                filter.responseTime.$lte = parseFloat(query.responseTimeMax);
            }
        }

        if (query.resolutionTimeMin || query.resolutionTimeMax) {
            filter.resolutionTime = {};
            if (query.resolutionTimeMin) {
                filter.resolutionTime.$gte = parseFloat(query.resolutionTimeMin);
            }
            if (query.resolutionTimeMax) {
                filter.resolutionTime.$lte = parseFloat(query.resolutionTimeMax);
            }
        }

        // Filter by satisfaction score
        if (query.satisfactionMin || query.satisfactionMax) {
            filter.satisfactionScore = {};
            if (query.satisfactionMin) {
                filter.satisfactionScore.$gte = parseFloat(query.satisfactionMin);
            }
            if (query.satisfactionMax) {
                filter.satisfactionScore.$lte = parseFloat(query.satisfactionMax);
            }
        }

        return filter;
    }

    // Helper methods
    formatOptions(optionsArray) {
        return optionsArray.map(option => ({
            value: option._id,
            label: this.formatLabel(option._id),
            count: option.count
        }));
    }

    formatLabel(value) {
        const labels = {
            // Status labels
            'new': 'New',
            'acknowledged': 'Acknowledged',
            'in_progress': 'In Progress',
            'resolved': 'Resolved',
            'closed': 'Closed',
            
            // Priority labels
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High',
            'critical': 'Critical',
            
            // Category labels
            'bug': 'Bug Report',
            'feature_request': 'Feature Request',
            'complaint': 'Complaint',
            'appreciation': 'Appreciation',
            'general': 'General',
            
            // Sentiment labels
            'positive': 'Positive',
            'negative': 'Negative',
            'neutral': 'Neutral'
        };

        return labels[value] || value.charAt(0).toUpperCase() + value.slice(1);
    }

    // Validate filter parameters
    validateFilterParams(query) {
        const errors = [];

        // Validate status
        if (query.status && !this.isValidStatus(query.status)) {
            errors.push('Invalid status value');
        }

        // Validate priority
        if (query.priority && !this.isValidPriority(query.priority)) {
            errors.push('Invalid priority value');
        }

        // Validate rating
        if (query.rating && !this.isValidRating(query.rating)) {
            errors.push('Invalid rating value');
        }

        // Validate date format
        if (query.dateFrom && !this.isValidDate(query.dateFrom)) {
            errors.push('Invalid dateFrom format');
        }

        if (query.dateTo && !this.isValidDate(query.dateTo)) {
            errors.push('Invalid dateTo format');
        }

        return errors;
    }

    isValidStatus(status) {
        const validStatuses = ['new', 'acknowledged', 'in_progress', 'resolved', 'closed'];
        if (Array.isArray(status)) {
            return status.every(s => validStatuses.includes(s));
        }
        return validStatuses.includes(status);
    }

    isValidPriority(priority) {
        const validPriorities = ['low', 'medium', 'high', 'critical'];
        if (Array.isArray(priority)) {
            return priority.every(p => validPriorities.includes(p));
        }
        return validPriorities.includes(priority);
    }

    isValidRating(rating) {
        if (Array.isArray(rating)) {
            return rating.every(r => {
                const num = parseInt(r);
                return !isNaN(num) && num >= 1 && num <= 5;
            });
        }
        const num = parseInt(rating);
        return !isNaN(num) && num >= 1 && num <= 5;
    }

    isValidDate(dateString) {
        return !isNaN(Date.parse(dateString));
    }
}

module.exports = new FeedbackFilters();