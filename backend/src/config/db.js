const mongoose = require('mongoose');
const config = require('../../../config/globalConfig');

/**
 * 连接到MongoDB数据库
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.db.mongodbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${config.db.dbName}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    
    // 开发环境下提供更详细的错误信息
    if (config.env === 'development') {
      console.error('Detailed error:', error);
    }
    
    return null; // 返回null而不是退出进程，让调用者决定如何处理
  }
};

module.exports = connectDB;