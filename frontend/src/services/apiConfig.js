/**
 * API配置文件
 * 集中管理API相关配置
 */

// API基础URL，从环境变量获取或使用默认值
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// API请求超时时间（毫秒）
export const API_TIMEOUT = 30000;

// 请求头配置
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
};

// 错误处理函数
export const handleApiError = (error) => {
  console.error('API请求错误:', error);
  
  // 根据错误类型返回友好的错误信息
  if (error.response) {
    // 服务器返回错误状态码
    return error.response.data?.message || '服务器错误';
  } else if (error.request) {
    // 请求已发送但未收到响应
    return '网络连接失败，请检查网络设置';
  } else {
    // 请求设置时出错
    return error.message || '请求错误';
  }
};

export default {
  API_BASE_URL,
  API_TIMEOUT,
  DEFAULT_HEADERS,
  handleApiError
};