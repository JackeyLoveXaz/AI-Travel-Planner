/**
 * API密钥管理工具
 * 用于安全地管理和访问API密钥
 */

/**
 * 获取API密钥
 * @param {string} keyName - 密钥名称
 * @returns {string|null} API密钥值
 */
const getApiKey = (keyName) => {
  const keyMap = {
    'openai': process.env.OPENAI_API_KEY,
    'mongodb': process.env.MONGODB_URI
    // 可以添加其他API密钥
  };

  return keyMap[keyName] || null;
};

/**
 * 验证API密钥是否有效
 * @param {string} apiKey - API密钥
 * @returns {boolean} 是否有效
 */
const isValidApiKey = (apiKey) => {
  // 简单的验证逻辑，可以根据需要扩展
  return apiKey && apiKey.trim() !== '' && 
         apiKey !== 'sk-placeholder-key-for-development';
};

/**
 * 安全地记录日志（隐藏API密钥）
 * @param {object} data - 要记录的数据
 * @returns {object} 处理后的数据（密钥已隐藏）
 */
const secureLogData = (data) => {
  if (typeof data !== 'object') return data;
  
  const clonedData = { ...data };
  
  // 隐藏常见的API密钥字段
  if (clonedData.apiKey) {
    clonedData.apiKey = '***HIDDEN***';
  }
  
  if (clonedData.api_key) {
    clonedData.api_key = '***HIDDEN***';
  }
  
  if (clonedData.openaiApiKey) {
    clonedData.openaiApiKey = '***HIDDEN***';
  }
  
  return clonedData;
};

module.exports = {
  getApiKey,
  isValidApiKey,
  secureLogData
};