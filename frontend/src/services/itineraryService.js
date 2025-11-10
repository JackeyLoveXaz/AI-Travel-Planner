import { API_BASE_URL, getHeadersWithApiKey } from './apiConfig';

/**
 * 行程服务
 * 用于与后端行程API交互
 */

// 创建行程
export const createItinerary = async (destination, startDate, endDate, preferences = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/itineraries`, {
      method: 'POST',
      headers: getHeadersWithApiKey(),
      body: JSON.stringify({
        destination,
        startDate,
        endDate,
        preferences
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '创建行程失败');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('创建行程错误:', error);
    throw error;
  }
};

// 获取所有行程
export const getAllItineraries = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/itineraries`, {
      headers: getHeadersWithApiKey()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '获取行程列表失败');
    }

    const data = await response.json();
    // 确保返回的是行程数组，处理后端返回的 {message, data} 结构
    return data.data || data;
  } catch (error) {
    console.error('获取行程列表错误:', error);
    throw error;
  }
};

// 获取单个行程
export const getItineraryById = async (itineraryId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/itineraries/${itineraryId}`, {
      headers: getHeadersWithApiKey()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '获取行程失败');
    }

    const data = await response.json();
    // 确保返回的是行程对象，处理后端返回的 {message, data} 结构
    return data.data || data;
  } catch (error) {
    console.error('获取行程错误:', error);
    throw error;
  }
};

// 更新行程
export const updateItinerary = async (itineraryId, updates) => {
  try {
    const response = await fetch(`${API_BASE_URL}/itineraries/${itineraryId}`, {
      method: 'PUT',
      headers: getHeadersWithApiKey(),
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '更新行程失败');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('更新行程错误:', error);
    throw error;
  }
};

// 删除行程
export const deleteItinerary = async (itineraryId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/itineraries/${itineraryId}`, {
      method: 'DELETE',
      headers: getHeadersWithApiKey()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '删除行程失败');
    }

    return true;
  } catch (error) {
    console.error('删除行程错误:', error);
    throw error;
  }
};

export default {
  createItinerary,
  getAllItineraries,
  getItineraryById,
  updateItinerary,
  deleteItinerary
};