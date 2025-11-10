const mongoose = require('mongoose');

// 预算类别子文档模式
const BudgetCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  estimated: {
    type: Number,
    required: true,
    default: 0
  },
  actual: {
    type: Number,
    default: 0
  }
});

// 预算主模式
const BudgetSchema = new mongoose.Schema({
  itineraryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Itinerary',
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  totalBudget: {
    type: Number,
    required: true
  },
  spent: {
    type: Number,
    default: 0
  },
  remaining: {
    type: Number
  },
  categories: [BudgetCategorySchema],
  userId: {
    type: String
  },
  currency: {
    type: String,
    default: 'CNY'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 自动计算剩余金额
BudgetSchema.pre('save', function(next) {
  this.remaining = this.totalBudget - this.spent;
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Budget', BudgetSchema);