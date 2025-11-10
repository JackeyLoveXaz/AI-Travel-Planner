const axios = require('axios');

/**
 * 生成旅行行程（优先使用用户提供的API key进行通义千问API调用）
 * @param {string} destination - 目的地
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @param {object} preferences - 用户偏好
 * @param {string} apiKey - 用户提供的API key（通义千问）
 * @returns {Promise<Array>} 生成的行程天数数组
 */
const generateItinerary = async (destination, startDate, endDate, preferences = {}, apiKey = '') => {
  // 检查用户提供的API key是否有效
  const isValidUserApiKey = apiKey && 
    apiKey.trim() !== '' && 
    apiKey !== 'sk-placeholder-key-for-development' && 
    !apiKey.startsWith('your_');
  
  // 如果用户提供了有效的API key，尝试使用通义千问API生成行程
  if (isValidUserApiKey) {
    try {
      console.log('使用用户提供的API key调用通义千问生成行程');
      
      // 计算行程天数
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      // 构建偏好提示
      let preferencesPrompt = '';
      if (preferences) {
        if (preferences.travelers) {
          preferencesPrompt += `旅行人数：${preferences.travelers}人\n`;
        }
        if (preferences.preferences && Array.isArray(preferences.preferences) && preferences.preferences.length > 0) {
          preferencesPrompt += `兴趣爱好：${preferences.preferences.join('、')}\n`;
        }
        if (preferences.budget) {
          preferencesPrompt += `预算：${preferences.budget}元\n`;
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

每天安排合理的活动，包括景点游览、餐饮、休息等，时间安排要合理，避免过于紧凑或松散。

请确保返回严格的JSON格式，不要包含任何额外的文本或解释。`;

      // 调用通义千问API（使用阿里云DashScope服务）
      const response = await axios({
        method: 'post',
        url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          model: 'qwen-max', // 使用通义千问的max模型
          input: {
            prompt: prompt
          },
          parameters: {
            max_tokens: 2000,
            temperature: 0.7,
            top_p: 0.8
          }
        }
      });

      // 解析生成的内容
      const generatedContent = response.data.output.text.trim();
      let itineraryDays;
      
      try {
        console.log('开始解析生成内容，长度:', generatedContent.length);
        
        // 预处理生成内容，移除可能的问题字符
        let cleanedContent = generatedContent
          .replace(/\u200B/g, '') // 零宽空格
          .replace(/\uFEFF/g, '') // BOM标记
          .replace(/\n+/g, '\n') // 合并多余换行
          .trim();
        
        // 尝试不同的JSON提取策略
        let jsonContent = cleanedContent;
        
        // 策略1: 使用更健壮的正则表达式匹配完整的JSON数组
        const jsonRegex = /\[\s*\{[\s\S]*\}\s*\]/;
        const jsonMatch = cleanedContent.match(jsonRegex);
        
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
          console.log('通过正则表达式成功提取JSON部分');
        } else {
          console.log('未能通过正则提取JSON，尝试直接解析');
        }
        
        // 尝试解析JSON
        try {
          itineraryDays = JSON.parse(jsonContent);
          console.log('JSON解析成功，获取到的天数:', itineraryDays.length || 0);
        } catch (parseError) {
          console.warn('第一次解析失败，尝试进一步清理内容...');
          
          // 策略2: 查找第一个[和最后一个]，提取完整的数组
          const firstBracket = cleanedContent.indexOf('[');
          const lastBracket = cleanedContent.lastIndexOf(']');
          
          if (firstBracket !== -1 && lastBracket !== -1 && firstBracket < lastBracket) {
            jsonContent = cleanedContent.substring(firstBracket, lastBracket + 1);
            console.log('尝试使用第一个[和最后一个]之间的内容');
            itineraryDays = JSON.parse(jsonContent);
          } else {
            throw parseError;
          }
        }
        
        // 验证解析结果是否为数组
        if (!Array.isArray(itineraryDays) || itineraryDays.length === 0) {
          console.warn('解析结果不是有效的数组或为空，使用默认行程');
          return generateDefaultItinerary(destination, startDate, endDate, preferences);
        }
        
        // 验证数组中的元素是否包含必要的字段
        const validItinerary = itineraryDays.every(day => 
          day && day.day && Number.isInteger(day.day) && 
          day.activities && Array.isArray(day.activities)
        );
        
        if (!validItinerary) {
          console.warn('解析结果结构不符合要求，使用默认行程');
          return generateDefaultItinerary(destination, startDate, endDate, preferences);
        }
        
      } catch (jsonError) {
        console.error('JSON解析错误:', jsonError.message);
        console.error('原始生成内容:', generatedContent);
        // JSON解析失败时返回默认行程
        return generateDefaultItinerary(destination, startDate, endDate, preferences);
      }

      return itineraryDays;
    } catch (error) {
      console.error('使用用户API key生成行程错误:', error);
    }
  } else {
    console.log('用户未提供有效的API key或API调用失败，使用默认行程生成器');
  }
  
  
  // 返回默认行程作为备用
  return generateDefaultItinerary(destination, startDate, endDate, preferences);
};

/**
 * 生成默认行程
 * @param {string} destination - 目的地
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @param {object} preferences - 用户偏好
 * @returns {Array} 默认行程天数数组
 */
const generateDefaultItinerary = (destination, startDate, endDate, preferences = {}) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  
  // 基于偏好生成不同类型的活动
  const getActivitiesForDay = (day, destination, preferences) => {
    const activities = [];
    
    // 第一天特殊处理：抵达和适应
    if (day === 1) {
      activities.push(
        { time: '09:00', activity: '抵达目的地', description: `抵达${destination}，办理入住`, location: `${destination}酒店`, duration: '2小时' },
        { time: '11:30', activity: '午餐', description: `品尝${destination}当地美食`, location: '市中心餐厅', duration: '1小时' },
        { time: '13:30', activity: '市区漫步', description: `熟悉${destination}市区环境`, location: destination, duration: '2小时' },
        { time: '16:00', activity: '休闲休息', description: '调整时差，休息放松', location: '酒店', duration: '2小时' },
        { time: '18:30', activity: '晚餐', description: `享用${destination}特色晚餐`, location: '当地餐厅', duration: '1.5小时' }
      );
      return activities;
    }
    
    // 最后一天特殊处理：退房和离开
    if (day === days) {
      activities.push(
        { time: '09:00', activity: '酒店退房', description: '办理退房手续', location: '酒店', duration: '1小时' },
        { time: '10:30', activity: '最后游览', description: `最后游览${destination}的景点`, location: destination, duration: '2小时' },
        { time: '13:00', activity: '午餐', description: `最后品尝${destination}美食`, location: '特色餐厅', duration: '1小时' },
        { time: '14:30', activity: '准备返程', description: '前往机场/车站', location: destination, duration: '2小时' }
      );
      return activities;
    }
    
    // 中间天数的活动安排
    // 根据偏好调整活动
    const hasFoodPreference = preferences.preferences && preferences.preferences.includes('美食');
    const hasHistoryPreference = preferences.preferences && preferences.preferences.includes('历史文化');
    const hasNaturePreference = preferences.preferences && preferences.preferences.includes('自然风光');
    const hasShoppingPreference = preferences.preferences && preferences.preferences.includes('购物');
    
    // 基础活动
    activities.push(
      { time: '08:30', activity: '早餐', description: '在酒店享用早餐', location: '酒店', duration: '1小时' }
    );
    
    // 上午活动
    if (hasHistoryPreference || day % 3 === 0) {
      activities.push(
        { time: '09:30', activity: `参观${destination}历史景点`, description: `探索${destination}的历史文化遗产`, location: destination, duration: '3小时' }
      );
    } else if (hasNaturePreference || day % 3 === 1) {
      activities.push(
        { time: '09:30', activity: `游览${destination}自然风光`, description: `欣赏${destination}的自然美景`, location: destination, duration: '3小时' }
      );
    } else {
      activities.push(
        { time: '09:30', activity: `${destination}城市观光`, description: `游览${destination}城市风光`, location: destination, duration: '3小时' }
      );
    }
    
    // 午餐
    if (hasFoodPreference) {
      activities.push(
        { time: '13:00', activity: '特色午餐', description: `品尝${destination}正宗美食`, location: '当地知名餐厅', duration: '1.5小时' }
      );
    } else {
      activities.push(
        { time: '13:00', activity: '午餐', description: `享用午餐`, location: destination, duration: '1小时' }
      );
    }
    
    // 下午活动
    if (hasShoppingPreference && day % 2 === 0) {
      activities.push(
        { time: '14:30', activity: `${destination}购物体验`, description: `在${destination}购买特色商品`, location: `${destination}购物区`, duration: '3小时' }
      );
    } else if (day % 4 === 0) {
      activities.push(
        { time: '14:30', activity: `${destination}文化体验`, description: `体验${destination}的文化活动`, location: destination, duration: '3小时' }
      );
    } else {
      activities.push(
        { time: '14:30', activity: `${destination}休闲活动`, description: `在${destination}放松休息`, location: destination, duration: '3小时' }
      );
    }
    
    // 晚餐
    activities.push(
      { time: '18:30', activity: '晚餐', description: `享用晚餐`, location: '推荐餐厅', duration: '1.5小时' }
    );
    
    // 晚上活动
    if (day % 3 === 0) {
      activities.push(
        { time: '20:30', activity: `${destination}夜景游览`, description: `欣赏${destination}美丽夜景`, location: destination, duration: '1.5小时' }
      );
    }
    
    return activities;
  };
  
  const defaultItinerary = [];
  
  for (let i = 1; i <= days; i++) {
    defaultItinerary.push({
      day: i,
      activities: getActivitiesForDay(i, destination, preferences)
    });
  }
  
  return defaultItinerary;
};

module.exports = generateItinerary;