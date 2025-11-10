const express = require('express');
const router = express.Router();
const connectDB = require('../config/db');
const { isValidApiKey } = require('../utils/apiKeyManager');
const { client: openaiClient } = require('../config/openai');

/**
 * @route   GET /api/health
 * @desc    健康检查端点
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // 检查服务器状态
    const serverStatus = {
      status: 'running',
      timestamp: new Date().toISOString(),
      service: 'AI Travel Planner API'
    };

    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      data: serverStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/health/database
 * @desc    数据库连接检查
 * @access  Public
 */
router.get('/database', async (req, res) => {
  try {
    const dbConnection = await connectDB();
    
    if (dbConnection) {
      const dbStatus = {
        connected: true,
        host: dbConnection.connection.host,
        dbName: dbConnection.connection.name,
        status: dbConnection.connection.readyState === 1 ? 'connected' : 'disconnected'
      };
      
      res.status(200).json({
        success: true,
        message: 'Database connection successful',
        data: dbStatus
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Database connection failed'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database health check failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/health/openai
 * @desc    OpenAI API连接检查
 * @access  Public
 */
router.get('/openai', async (req, res) => {
  try {
    // 检查API密钥是否有效
    const { config } = require('../config/openai');
    const apiKeyValid = isValidApiKey(config.apiKey);
    
    if (apiKeyValid) {
      // 尝试一个简单的API调用（仅开发环境）
      if (process.env.NODE_ENV === 'development') {
        try {
          const response = await openaiClient.listEngines();
          res.status(200).json({
            success: true,
            message: 'OpenAI API connection successful',
            data: {
              apiKeyValid: true,
              availableEngines: response.data.data.length
            }
          });
        } catch (apiError) {
          res.status(503).json({
            success: false,
            message: 'OpenAI API call failed',
            data: {
              apiKeyValid: true
            },
            error: apiError.message
          });
        }
      } else {
        // 生产环境只需验证密钥格式
        res.status(200).json({
          success: true,
          message: 'OpenAI API key is valid',
          data: {
            apiKeyValid: true
          }
        });
      }
    } else {
      res.status(401).json({
        success: false,
        message: 'OpenAI API key is not valid or not configured',
        data: {
          apiKeyValid: false
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'OpenAI health check failed',
      error: error.message
    });
  }
});

module.exports = router;