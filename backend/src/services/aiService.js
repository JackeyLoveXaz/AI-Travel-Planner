/**
 * AI服务层
 * 处理与大语言模型的交互
 */

/**
 * 生成优化的提示词，用于与AI模型交互
 * @param {string} userInput - 用户原始输入
 * @returns {string} 优化后的提示词
 */
exports.generateOptimizedPrompt = (userInput) => {
  return `
请根据以下旅行需求，生成详细的行程规划：

${userInput}

请以JSON格式返回以下信息：
{
  "destination": "目的地",
  "startDate": "开始日期（YYYY-MM-DD格式）",
  "endDate": "结束日期（YYYY-MM-DD格式）",
  "travelers": 人数,
  "budget": 预算金额,
  "preferences": ["旅行偏好1", "旅行偏好2"],
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
`;
};

module.exports = exports;