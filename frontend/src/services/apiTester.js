/**
 * API连接测试服务
 * 用于测试与后端API的连接状态
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

/**
 * 测试API连接的基础函数
 * @param {string} endpoint - API端点
 * @param {object} options - fetch选项
 * @returns {Promise<object>} 测试结果
 */
async function testApiConnection(endpoint, options = {}) {
  try {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
      latency,
      endpoint
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      endpoint
    };
  }
}

/**
 * 测试服务健康状态
 * @returns {Promise<object>} 服务健康状态
 */
export async function testServiceHealth() {
  return testApiConnection('/health');
}

/**
 * 测试数据库连接
 * @returns {Promise<object>} 数据库连接状态
 */
export async function testDatabaseConnection() {
  return testApiConnection('/health/database');
}

/**
 * 测试OpenAI API连接
 * @returns {Promise<object>} OpenAI API连接状态
 */
export async function testOpenAIConnection() {
  return testApiConnection('/health/openai');
}

/**
 * 执行完整的连接测试
 * @returns {Promise<object>} 完整测试结果
 */
export async function runFullConnectionTest() {
  const [service, database, openai] = await Promise.all([
    testServiceHealth(),
    testDatabaseConnection(),
    testOpenAIConnection()
  ]);
  
  return {
    timestamp: new Date().toISOString(),
    service,
    database,
    openai,
    allSuccessful: service.success && database.success && openai.success
  };
}

export default {
  testServiceHealth,
  testDatabaseConnection,
  testOpenAIConnection,
  runFullConnectionTest
};