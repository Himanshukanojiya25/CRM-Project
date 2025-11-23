const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const feedbackTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    category: {
        type: String,
        required: true,
        enum: ['general', 'bug_response', 'feature_request', 'complaint', 'appreciation'],
        default: 'general'
    },
    subject: {
        type: String,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    variables: [{
        name: String,
        description: String,
        example: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    usageCount: {
        type: Number,
        default: 0
    },
    lastUsed: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    metadata: {
        characterCount: Number,
        wordCount: Number,
        averageRating: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Pre-save middleware to calculate content metrics
feedbackTemplateSchema.pre('save', function(next) {
    if (this.isModified('content')) {
        this.metadata.characterCount = this.content.length;
        this.metadata.wordCount = this.content.split(/\s+/).filter(word => word.length > 0).length;
    }
    next();
});

// Index for efficient searching
feedbackTemplateSchema.index({ name: 'text', content: 'text', tags: 'text' });
feedbackTemplateSchema.index({ category: 1, isActive: 1 });
feedbackTemplateSchema.index({ createdBy: 1 });

// Static method to get active templates by category
feedbackTemplateSchema.statics.getActiveTemplates = function(category = null) {
    const query = { isActive: true };
    if (category) query.category = category;
    
    return this.find(query).sort({ name: 1 });
};

// Static method to search templates
feedbackTemplateSchema.statics.searchTemplates = function(searchTerm, category = null) {
    const query = { 
        isActive: true,
        $text: { $search: searchTerm }
    };
    
    if (category) query.category = category;
    
    return this.find(query, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } });
};

// Static method to get most used templates
feedbackTemplateSchema.statics.getMostUsedTemplates = function(limit = 10) {
    return this.find({ isActive: true })
        .sort({ usageCount: -1, lastUsed: -1 })
        .limit(limit);
};

// Instance method to increment usage count
feedbackTemplateSchema.methods.incrementUsage = function() {
    this.usageCount += 1;
    this.lastUsed = new Date();
    return this.save();
};

// Instance method to apply template with variables
feedbackTemplateSchema.methods.applyTemplate = function(variables = {}) {
    let processedContent = this.content;
    
    // Replace variables in content
    Object.keys(variables).forEach(key => {
        const placeholder = `{{${key}}}`;
        const value = variables[key] || '';
        processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return {
        subject: this.subject,
        content: processedContent
    };
};

// Virtual for available variables
feedbackTemplateSchema.virtual('availableVariables').get(function() {
    const defaultVariables = [
        { name: 'user.name', description: 'Customer name', example: 'John Doe' },
        { name: 'admin.name', description: 'Admin name', example: 'Jane Smith' },
        { name: 'feedback.subject', description: 'Feedback subject', example: 'Bug Report' },
        { name: 'feedback.message', description: 'Feedback message', example: 'The app is crashing...' },
        { name: 'company.name', description: 'Company name', example: 'Your Company' },
        { name: 'current.date', description: 'Current date', example: '2024-01-01' }
    ];
    
    return [...defaultVariables, ...this.variables];
});

feedbackTemplateSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('FeedbackTemplate', feedbackTemplateSchema);