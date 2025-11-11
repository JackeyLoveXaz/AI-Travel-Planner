import { API_BASE_URL } from './apiConfig';

// 创建预算
export const createBudget = async (itineraryId, destination, totalBudget, categories) => {
  try {
    // 处理分类数据，将budget字段重命名为estimated以匹配后端数据结构
    const processedCategories = (categories || []).map(category => {
      const processedCategory = {
        name: category.name,
        actual: Number(category.actual) || 0,
        estimated: Number(category.budget) || 0
      };
      return processedCategory;
    });

    const response = await fetch(`${API_BASE_URL}/budgets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itineraryId,
        destination,
        totalBudget,
        categories: processedCategories,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // 返回数据或处理后的结构
    return data.data || data;
  } catch (error) {
    console.error('创建预算失败:', error);
    // 如果API调用失败，返回一个默认的预算结构
    return {
      itineraryId,
      destination,
      totalBudget,
      spent: 0,
      remaining: totalBudget,
      categories: categories || []
    };
  }
};

// 获取预算信息
export const getBudgetByItineraryId = async (itineraryId) => {
  try {
    // 修复API端点：直接使用/budgets/:id，其中id就是itineraryId
    const response = await fetch(`${API_BASE_URL}/budgets/${itineraryId}`);

    if (!response.ok) {
      // 如果没有找到预算（404），返回null而不是抛出错误
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const result = data.data || data;
    
    console.log('从后端获取的预算数据:', result);
    
    // 确保数据完整性，添加必要的字段，但保留原始数据的所有字段（包括_id）
    const spent = result.spent !== undefined ? result.spent : calculateTotalSpent(result.categories);
    const remaining = result.remaining !== undefined ? result.remaining : (result.totalBudget - spent);
    
    // 创建保留所有原始字段的对象，并确保categories中的每个分类都有budget字段
    // 如果分类中有estimated字段但没有budget字段，使用estimated值作为budget值
    const processedCategories = (result.categories || []).map(category => {
      // 如果category.budget不存在但有category.estimated，使用estimated值
      if (category.budget === undefined && category.estimated !== undefined) {
        return {
          ...category,
          budget: category.estimated
        };
      }
      return category;
    });
    
    return {
      ...result,
      spent,
      remaining,
      categories: processedCategories
    };
  } catch (error) {
    console.error('获取预算失败:', error);
    // 尝试从会话存储中获取预算值
    const storedBudget = sessionStorage.getItem(`budget_${itineraryId}`);
    const totalBudget = storedBudget ? parseInt(storedBudget) : 10000; // 默认为10000
    
    // 创建合理的分类预算
    const categories = [
      { id: '1', name: '交通', budget: Math.round(totalBudget * 0.3), estimated: Math.round(totalBudget * 0.3), actual: 0 },
      { id: '2', name: '住宿', budget: Math.round(totalBudget * 0.3), estimated: Math.round(totalBudget * 0.3), actual: 0 },
      { id: '3', name: '餐饮', budget: Math.round(totalBudget * 0.2), estimated: Math.round(totalBudget * 0.2), actual: 0 },
      { id: '4', name: '门票', budget: Math.round(totalBudget * 0.1), estimated: Math.round(totalBudget * 0.1), actual: 0 },
      { id: '5', name: '购物', budget: Math.round(totalBudget * 0.1), estimated: Math.round(totalBudget * 0.1), actual: 0 }
    ];
    
    return {
      itineraryId,
      totalBudget,
      spent: 0,
      remaining: totalBudget,
      categories
    };
  }
};

// 更新预算
export const updateBudget = async (id, updates) => {
  try {
    // 确保构建完整的请求体，包含所有必要字段
    let requestBody = {
      itineraryId: id // 确保包含itineraryId
    };
    
    // 如果有分类数据，确保正确处理
    if (updates.categories && updates.categories.length > 0) {
      // 处理分类数据，保留actual字段并将budget重命名为estimated
      requestBody.categories = updates.categories.map(category => {
        const processedCategory = {};
        
        // 保留actual字段，这是用户实际花费的数据
        if (category.actual !== undefined) {
          processedCategory.actual = Number(category.actual) || 0;
        }
        
        // 将budget字段重命名为estimated，并确保总是有默认值
        processedCategory.estimated = Number(category.budget) || 0;
        
        // 保留其他可能的字段（如name等）
        if (category.name) {
          processedCategory.name = category.name;
        }
        
        // 注意：不传递自定义_id，让MongoDB自动处理
        
        return processedCategory;
      });
      
      // 计算总花费
      requestBody.spent = requestBody.categories.reduce(
        (sum, category) => sum + (category.actual || 0), 
        0
      );
    }
    
    // 保留totalBudget字段
    if (updates.totalBudget !== undefined) {
      requestBody.totalBudget = Number(updates.totalBudget) || 0;
      // 重新计算remaining
      if (requestBody.spent !== undefined) {
        requestBody.remaining = requestBody.totalBudget - requestBody.spent;
      }
    }
    
    console.log('更新预算请求体:', requestBody);
    
    // 修复API端点：直接使用/budgets/:id，其中id就是itineraryId
    const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('更新预算失败:', error);
    throw error;
  }
};

// 更新预算分类
export const updateBudgetCategory = async (budgetId, categoryId, updates) => {
  try {
    const response = await fetch(`${API_BASE_URL}/budgets/${budgetId}/categories/${categoryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('更新预算分类失败:', error);
    throw error;
  }
};

// 辅助函数：计算总花费
const calculateTotalSpent = (categories = []) => {
  if (!Array.isArray(categories)) {
    return 0;
  }
  return categories.reduce((total, category) => {
    return total + (category?.actual || 0);
  }, 0);
};

export default {
  createBudget,
  getBudgetByItineraryId,
  updateBudget,
  updateBudgetCategory,
};