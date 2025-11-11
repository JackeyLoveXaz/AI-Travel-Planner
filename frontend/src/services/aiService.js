import { API_BASE_URL, getHeadersWithApiKey, handleApiError, getApiKey } from './apiConfig';
import { generateMockItinerary } from './mockData';

/**
 * AI服务层
 * 处理与大语言模型的交互
 */

/**
 * 向AI发送旅行需求并获取行程规划建议
 * @param {string} userQuery - 用户的旅行需求文本
 * @returns {Promise<object>} AI返回的行程规划结果
 */
export const getTravelPlanFromAI = async (userQuery) => {
  try {
    // 获取用户的API key
    const apiKey = getApiKey();
    
    // 尝试调用真实API，现在直接传递apiKey以便后端使用
    const response = await fetch(`${API_BASE_URL}/ai/travel-plan`, {
      method: 'POST',
      headers: getHeadersWithApiKey(),
      body: JSON.stringify({ query: userQuery, apiKey })
    });
    
    if (!response.ok) {
      // API返回错误，使用模拟数据
      console.warn('API调用失败，使用模拟数据:', response.status);
      return generateMockItinerary(userQuery);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // 网络错误或其他异常，使用模拟数据
    console.warn('API调用异常，使用模拟数据:', error.message);
    return generateMockItinerary(userQuery);
  }
};

/**
 * 解析AI返回的行程规划结果，提取关键信息
 * @param {object} aiResult - AI返回的结果
 * @returns {object} 解析后的关键信息（目的地、日期、预算等）
 */
export const parseAIResult = (aiResult) => {
  const parsedData = {
    destination: '',
    startDate: '',
    endDate: '',
    budget: null,
    travelers: 1,
    preferences: [],
    itineraryDetails: null
  };
  
  // 从AI结果中提取结构化数据，添加完善的防御性检查
  if (aiResult && typeof aiResult === 'object') {
    // 检查aiResult是否直接包含所需字段（模拟数据可能直接在顶层）
    if (aiResult.destination) {
      // 直接使用顶层数据（模拟数据格式）
      parsedData.destination = aiResult.destination;
      parsedData.startDate = aiResult.startDate || '';
      parsedData.endDate = aiResult.endDate || '';
      parsedData.budget = aiResult.budget; // 保持原始值，不设为空字符串
      parsedData.travelers = aiResult.travelers || 1;
      parsedData.preferences = Array.isArray(aiResult.preferences) ? aiResult.preferences : [];
      parsedData.itineraryDetails = aiResult.itinerary;
    } else {
      // 使用data字段（API返回格式）
      const data = aiResult.data || {};
      parsedData.destination = data.destination || '';
      parsedData.startDate = data.startDate || '';
      parsedData.endDate = data.endDate || '';
      parsedData.budget = data.budget; // 保持原始值，不设为空字符串
      parsedData.travelers = data.travelers || 1;
      parsedData.preferences = Array.isArray(data.preferences) ? data.preferences : [];
      parsedData.itineraryDetails = data.itinerary;
    }
  }
  
  return parsedData;
};

/**
 * 生成优化的提示词，用于与AI模型交互
 * @param {string} userInput - 用户原始输入
 * @returns {string} 优化后的提示词
 */
export const generateOptimizedPrompt = (userInput) => {
  return `
请根据以下旅行需求，生成详细的行程规划和预算估计：

${userInput}

请以JSON格式返回以下信息：
{
  "destination": "目的地",
  "startDate": "开始日期（YYYY-MM-DD格式）",
  "endDate": "结束日期（YYYY-MM-DD格式）",
  "travelers": 人数,
  "budget": 总预算金额,
  "preferences": ["旅行偏好1", "旅行偏好2"],
  "budgetBreakdown": {
    "transportation": {
      "amount": 交通费用,
      "percentage": 百分比,
      "details": "交通费用说明"
    },
    "accommodation": {
      "amount": 住宿费用,
      "percentage": 百分比,
      "details": "住宿费用说明"
    },
    "food": {
      "amount": 餐饮费用,
      "percentage": 百分比,
      "details": "餐饮费用说明"
    },
    "activities": {
      "amount": 活动门票费用,
      "percentage": 百分比,
      "details": "活动费用说明"
    },
    "shopping": {
      "amount": 购物费用,
      "percentage": 百分比,
      "details": "购物费用说明"
    },
    "others": {
      "amount": 其他费用,
      "percentage": 百分比,
      "details": "其他费用说明"
    }
  },
  "itinerary": {
    "overview": "行程概述",
    "dailyPlans": [
      {
        "day": 1,
        "date": "日期",
        "activities": [
          {
            "time": "时间",
            "activity": "活动描述",
            "location": "地点",
            "cost": 预估费用,
            "notes": "备注"
          }
        ],
        "accommodation": "住宿信息",
        "transportation": "交通方式"
      }
    ],
    "recommendations": {
      "restaurants": [],
      "attractions": [],
      "tips": []
    }
  }
}

请确保返回的JSON格式正确，不含任何额外文本。
请根据目的地消费水平和行程天数，合理分配预算到各个类别。
`;
};

export default {
  getTravelPlanFromAI,
  parseAIResult,
  generateOptimizedPrompt
};