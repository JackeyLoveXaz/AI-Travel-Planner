const mongoose = require('mongoose');

// 设置模式
const SettingsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  preferences: {
    currency: {
      type: String,
      default: 'CNY'
    },
    language: {
      type: String,
      default: 'zh-CN'
    },
    theme: {
      type: String,
      default: 'light'
    }
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  privacy: {
    shareData: {
      type: Boolean,
      default: false
    }
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
SettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Settings', SettingsSchema);