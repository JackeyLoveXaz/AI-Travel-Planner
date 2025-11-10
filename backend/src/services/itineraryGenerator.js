const openai = require('../config/openai');

/**
 * 使用OpenAI生成旅行行程
 * @param {string} destination - 目的地
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @param {object} preferences - 用户偏好
 * @returns {Promise<Array>} 生成的行程天数数组
 */
const generateItinerary = async (destination, startDate, endDate, preferences = {}) => {
  try {
    // 计算行程天数
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // 构建偏好提示
    let preferencesPrompt = '';
    if (preferences) {
      if (preferences.travelType) {
        preferencesPrompt += `旅行类型：${preferences.travelType}\n`;
      }
      if (preferences.interests) {
        preferencesPrompt += `兴趣爱好：${preferences.interests.join('、')}\n`;
      }
      if (preferences.budget) {
        preferencesPrompt += `预算水平：${preferences.budget}\n`;
      }
      if (preferences.transportation) {
        preferencesPrompt += `交通方式：${preferences.transportation}\n`;
      }
    }

    // 构建提示信息
    const prompt = `请为以下旅行生成详细的行程安排：
目的地：${destination}
开始日期：${startDate}
结束日期：${endDate}
行程天数：${days}天
${preferencesPrompt}

请按以下格式返回JSON：
[
  {
    "day": 1,
    "activities": [
      {"time": "09:00", "activity": "活动名称", "description": "活动描述", "location": "地点", "duration": "预计时长"},
      ...
    ]
  },
  ...
]

每天安排合理的活动，包括景点游览、餐饮、休息等，时间安排要合理，避免过于紧凑或松散。`;

    // 调用OpenAI API
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 2000,
      temperature: 0.7,
    });

    // 解析生成的内容
    const generatedContent = response.data.choices[0].text.trim();
    const itineraryDays = JSON.parse(generatedContent);

    return itineraryDays;
  } catch (error) {
    console.error('生成行程错误:', error);
    // 返回默认行程作为备用
    return generateDefaultItinerary(destination, startDate, endDate);
  }
};

/**
 * 生成默认行程（当AI生成失败时使用）
 * @param {string} destination - 目的地
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @returns {Array} 默认行程天数数组
 */
const generateDefaultItinerary = (destination, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  
  const defaultItinerary = [];
  
  for (let i = 1; i <= days; i++) {
    defaultItinerary.push({
      day: i,
      activities: [
        { time: '09:00', activity: `${destination}景点游览`, description: `在${destination}参观主要景点`, location: destination, duration: '3小时' },
        { time: '12:30', activity: '午餐', description: `品尝${destination}当地美食`, location: '市中心餐厅', duration: '1小时' },
        { time: '14:00', activity: `${destination}文化体验`, description: `体验${destination}的文化特色`, location: destination, duration: '3小时' },
        { time: '18:00', activity: '晚餐', description: `享用晚餐`, location: '推荐餐厅', duration: '1.5小时' }
      ]
    });
  }
  
  return defaultItinerary;
};

module.exports = generateItinerary;