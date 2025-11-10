import { API_BASE_URL, getHeadersWithApiKey } from './apiConfig';

/**
 * 预算服务
 * 用于与后端预算API交互
 */

// 创建预算
export const createBudget = async (itineraryId, destination, totalBudget, categories = []) => {
  try {
    const response = await fetch(`${API_BASE_URL}/budgets`, {
      method: 'POST',
      headers: getHeadersWithApiKey(),
      body: JSON.stringify({
        itineraryId,
        destination,
        totalBudget,
        categories
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '创建预算失败');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('创建预算错误:', error);
    throw error;
  }
};

// 获取预算
export const getBudgetByItineraryId = async (itineraryId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/budgets/${itineraryId}`, {
      headers: getHeadersWithApiKey()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '获取预算失败');
    }

    const data = await response.json();
    // 处理后端返回的{message, data}结构
    return data.data || data;
  } catch (error) {
    console.error('获取预算错误:', error);
    throw error;
  }
};

// 更新预算
export const updateBudget = async (itineraryId, updates) => {
  try {
    const response = await fetch(`${API_BASE_URL}/budgets/${itineraryId}`, {
      method: 'PUT',
      headers: getHeadersWithApiKey(),
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '更新预算失败');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('更新预算错误:', error);
    throw error;
  }
};

// 更新预算类别
export const updateBudgetCategory = async (categoryId, updates) => {
  try {
    const response = await fetch(`${API_BASE_URL}/budgets/category/${categoryId}`, {
      method: 'PUT',
      headers: getHeadersWithApiKey(),
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '更新预算类别失败');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('更新预算类别错误:', error);
    throw error;
  }
};

export default {
  createBudget,
  getBudgetByItineraryId,
  updateBudget,
  updateBudgetCategory
};