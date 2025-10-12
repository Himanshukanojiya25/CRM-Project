const mongoose = require('mongoose');

const salesDealSchema = new mongoose.Schema({
  dealName: { 
    type: String, 
    required: true,
    trim: true
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  stage: { 
    type: String, 
    enum: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed-Won', 'Closed-Lost'],
    default: 'Prospecting'
  },
  probability: { 
    type: Number, 
    min: 0, 
    max: 100,
    default: 0
  },
  expectedClose: {
    type: Date,
    required: true
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    required: true
  },
  contacts: [{
    name: String,
    email: String,
    phone: String
  }],
  notes: [{
    content: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  tags: [String],
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  source: {
    type: String,
    enum: ['Website', 'Referral', 'Social Media', 'Cold Call', 'Existing Client', 'Other'],
    default: 'Other'
  },
  lastActivity: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Index for better performance
salesDealSchema.index({ owner: 1, stage: 1 });
salesDealSchema.index({ expectedClose: 1 });
salesDealSchema.index({ company: 1 });

module.exports = mongoose.model('SalesDeal', salesDealSchema);