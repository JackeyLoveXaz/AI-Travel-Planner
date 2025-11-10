const mongoose = require('mongoose');
const config = require('../../../config/globalConfig');

// 数据库连接状态
let isConnected = false;

/**
 * 连接到MongoDB数据库
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.db.mongodbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // 添加连接超时设置
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${config.db.dbName}`);
    isConnected = true;
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    
    // 开发环境下提供更详细的错误信息
    if (config.env === 'development') {
      console.error('Detailed error:', error);
    }
    
    console.warn('MongoDB连接失败，系统将在无数据库模式下运行，部分功能可能受限');
    isConnected = false;
    return null; // 返回null而不是退出进程，让调用者决定如何处理
  }
};

/**
 * 检查数据库是否已连接
 */
const isDbConnected = () => {
  return isConnected;
};

/**
 * 获取数据库连接状态
 */
const getConnectionStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState
  };
};

module.exports = {
  connectDB,
  isDbConnected,
  getConnectionStatus
};