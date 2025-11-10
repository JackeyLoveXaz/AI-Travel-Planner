const mongoose = require('mongoose');

// 活动子文档模式
const ActivitySchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
  },
  activity: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  location: {
    type: String
  },
  duration: {
    type: String
  }
});

// 天安排子文档模式
const DaySchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true
  },
  activities: [ActivitySchema]
});

// 行程主模式
const ItinerarySchema = new mongoose.Schema({
  destination: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  days: [DaySchema],
  userId: {
    type: String
  },
  preferences: {
    type: Object
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

// 自动更新updatedAt字段
ItinerarySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Itinerary', ItinerarySchema);