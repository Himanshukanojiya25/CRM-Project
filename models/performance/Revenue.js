const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
  deal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesDeal',
    required: true
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
  type: {
    type: String,
    enum: ['One-Time', 'Recurring', 'Renewal', 'Upsell'],
    default: 'One-Time'
  },
  revenueDate: {
    type: Date,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  salesRep: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Collected', 'Refunded', 'Cancelled'],
    default: 'Collected'
  },
  invoiceNumber: String,
  notes: String
}, { 
  timestamps: true 
});

// Indexes
revenueSchema.index({ revenueDate: 1 });
revenueSchema.index({ salesRep: 1 });
revenueSchema.index({ customer: 1 });

module.exports = mongoose.model('Revenue', revenueSchema);