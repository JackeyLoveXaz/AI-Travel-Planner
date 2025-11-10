/**
 * 全局配置文件
 * 用于集中管理所有配置项
 */

// 加载环境变量
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : process.env.NODE_ENV === 'testing' 
      ? '.env.testing' 
      : '.env'
});

// API配置
const apiConfig = {
  port: process.env.PORT || 5000,
  baseUrl: process.env.API_BASE_URL || 'http://localhost:5000/api',
  corsOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',').map(origin => origin.trim())
};

// 数据库配置
const dbConfig = {
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-travel-planner',
  dbName: process.env.DB_NAME || 'ai-travel-planner'
};

// 安全配置
const securityConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 每IP限制100次请求
  }
};

// OpenAI配置
const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || 'text-davinci-003',
  maxTokens: process.env.OPENAI_MAX_TOKENS || 2000,
  temperature: process.env.OPENAI_TEMPERATURE || 0.7
};

// 日志配置
const logConfig = {
  level: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || 'app.log'
};

// 导出配置
module.exports = {
  api: apiConfig,
  db: dbConfig,
  security: securityConfig,
  openai: openaiConfig,
  log: logConfig,
  env: process.env.NODE_ENV || 'development'
};