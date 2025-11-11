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
  // 计算行程天数
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  // 检查用户提供的API key是否有效
  const isValidUserApiKey = apiKey && 
    apiKey.trim() !== '' && 
    apiKey !== 'sk-placeholder-key-for-development' && 
    !apiKey.startsWith('your_');
  
  // 如果用户提供了有效的API key，尝试使用通义千问API生成行程
  if (isValidUserApiKey) {
    try {
      console.log('使用用户提供的API key调用通义千问生成行程');
      console.log(`行程信息：${destination}，${days}天`);

      // 构建偏好提示，确保包含所有关键信息
      let preferencesPrompt = '';
      if (preferences) {
        // 确保添加旅行人数信息
        if (preferences.travelers) {
          preferencesPrompt += `旅行人数：${preferences.travelers}人\n`;
        }
        // 添加预算信息
        if (preferences.budget) {
          preferencesPrompt += `预算：${preferences.budget}元\n`;
        }
        // 添加旅行偏好信息
        if (preferences.preferences && Array.isArray(preferences.preferences) && preferences.preferences.length > 0) {
          preferencesPrompt += `兴趣爱好：${preferences.preferences.join('、')}\n`;
        }
      }

      // 构建提示信息，确保模型能根据旅行人数和预算生成合适的行程
      const prompt = `请根据以下信息生成${days}天旅行行程的JSON数据。
目的地：${destination}
天数：${days}天
${preferencesPrompt}

请根据预算和人数合理安排每日活动和费用。

请只输出：[{"day":1,"activities":[{"time":"09:00","activity":"参观景点","description":"景点描述","location":"${destination}","duration":"2小时","cost":100}],"dailyBudget":100},{"day":2,"activities":[{"time":"10:00","activity":"游览公园","description":"公园描述","location":"${destination}","duration":"3小时","cost":50}],"dailyBudget":150}]`;

      // 调用通义千问API（使用阿里云DashScope服务）
      const response = await axios({
        method: 'post',
        url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          model: 'qwen-max', // 尝试使用不同的模型
          input: {
            prompt: prompt
          },
          parameters: {
            max_tokens: 7000, // 进一步增加token限制
            temperature: 0.2, // 更低的温度，追求确定性输出
            top_p: 0.4, // 更保守的top_p值
            result_format: 'text',
            // 移除停止词，避免过早截断
            enable_search: false // 禁用搜索功能，可能导致不稳定输出
          }
        }
      });

      // 解析生成的内容
      const generatedContent = response.data.output.text.trim();
      let itineraryDays;
      
      try {
        console.log('开始解析生成内容，长度:', generatedContent.length);
        
        // 快速验证：如果内容过短或明显不完整，直接使用默认行程
        if (generatedContent.length < 10 || (!generatedContent.includes('{') && !generatedContent.includes('}'))) {
          console.warn('生成内容过短或明显不完整，直接使用默认行程');
          console.error('当前生成内容:', JSON.stringify(generatedContent));
          return generateDefaultItinerary(destination, startDate, endDate, preferences);
        }
        
        // 预处理生成内容，移除可能的问题字符
        let cleanedContent = generatedContent
          .replace(/\u200B/g, '') // 零宽空格
          .replace(/\uFEFF/g, '') // BOM标记
          .replace(/\n+/g, '\n') // 合并多余换行
          .trim();
        
        // 日志记录生成内容的前200个字符和后200个字符，以便调试
        console.log('生成内容前200字符:', generatedContent.substring(0, 200));
        console.log('生成内容后200字符:', generatedContent.substring(Math.max(0, generatedContent.length - 200)));
        
        // 尝试不同的JSON提取策略
        let jsonContent = cleanedContent;
        
        // 策略1: 使用更健壮的正则表达式匹配尽可能多的JSON内容
        const jsonRegex = /\[\s*\{[\s\S]*\}/;
        const jsonMatch = cleanedContent.match(jsonRegex);
        
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
          console.log('通过正则表达式成功提取JSON部分');
        } else {
          console.log('未能通过正则提取JSON，尝试直接解析');
        }
        
        // 策略A: 处理可能被截断的JSON内容
        try {
          // 首先尝试直接解析
          itineraryDays = JSON.parse(jsonContent);
          console.log('JSON直接解析成功，获取到的天数:', itineraryDays.length || 0);
        } catch (parseError) {
          console.warn('第一次解析失败，尝试修复JSON结构...');
          
          // 策略B: 智能修复不完整的JSON结构
          let fixedContent = jsonContent;
          
          // 1. 计算括号匹配情况
          const openBraces = (jsonContent.match(/\{/g) || []).length;
          const closeBraces = (jsonContent.match(/\}/g) || []).length;
          const openBrackets = (jsonContent.match(/\[/g) || []).length;
          const closeBrackets = (jsonContent.match(/\]/g) || []).length;
          
          console.log(`括号匹配情况: 大括号 ${openBraces}:${closeBraces}, 中括号 ${openBrackets}:${closeBrackets}`);
          
          // 2. 修复常见的格式问题
          fixedContent = fixedContent
            .replace(/,\s*\}/g, '}') // 移除对象末尾多余的逗号
            .replace(/,\s*\]/g, ']') // 移除数组末尾多余的逗号
            .replace(/'/g, '"') // 替换单引号为双引号
            .replace(/\bNaN\b/g, '0') // 替换NaN为0
            .replace(/\bInfinity\b/g, '10000') // 替换Infinity为大数值
            .trim();
          
          // 3. 智能补全缺失的闭合括号
          // 先处理中括号不匹配的情况 - 重点修复逻辑
          if (openBrackets !== closeBrackets) {
            console.log('检测到中括号不匹配，进行专门修复');
            // 使用括号栈来跟踪括号嵌套情况
            const bracketStack = [];
            
            // 遍历字符串，跟踪括号匹配情况
            for (let i = 0; i < fixedContent.length; i++) {
              const char = fixedContent[i];
              if (char === '{') {
                bracketStack.push('}');
              } else if (char === '[') {
                bracketStack.push(']');
              } else if (char === '}' || char === ']') {
                if (bracketStack.length > 0 && bracketStack[bracketStack.length - 1] === char) {
                  bracketStack.pop();
                }
              }
            }
            
            // 逆序补全缺失的括号，确保嵌套结构正确
            console.log(`需要补全的括号栈: ${JSON.stringify(bracketStack)}`);
            while (bracketStack.length > 0) {
              fixedContent += bracketStack.pop();
            }
          }
          
          // 再次检查并修复中括号不匹配 - 二次检查确保修复彻底
          const finalOpenBrackets = (fixedContent.match(/\[/g) || []).length;
          const finalCloseBrackets = (fixedContent.match(/\]/g) || []).length;
          if (finalOpenBrackets !== finalCloseBrackets) {
            console.log(`最终中括号匹配检查: ${finalOpenBrackets}:${finalCloseBrackets}，进行最终修复`);
            if (finalOpenBrackets > finalCloseBrackets) {
              for (let i = 0; i < finalOpenBrackets - finalCloseBrackets; i++) {
                fixedContent += ']';
              }
            }
          }
          
          // 处理大括号不匹配的情况
          const fixedOpenBraces = (fixedContent.match(/\{/g) || []).length;
          const fixedCloseBraces = (fixedContent.match(/\}/g) || []).length;
          if (fixedOpenBraces !== fixedCloseBraces) {
            console.log(`大括号不匹配: ${fixedOpenBraces}:${fixedCloseBraces}，进行修复`);
            // 使用括号栈处理大括号嵌套结构
            const braceStack = [];
            for (let i = 0; i < fixedContent.length; i++) {
              const char = fixedContent[i];
              if (char === '{') {
                braceStack.push('}');
              } else if (char === '}') {
                if (braceStack.length > 0) {
                  braceStack.pop();
                }
              }
            }
            
            // 逆序补全缺失的大括号
            while (braceStack.length > 0) {
              fixedContent += braceStack.pop();
            }
          }
          
          console.log('修复后的JSON长度:', fixedContent.length);
          
          try {
            itineraryDays = JSON.parse(fixedContent);
            console.log('JSON修复后解析成功，获取到的天数:', itineraryDays.length || 0);
          } catch (parseError2) {
            console.error('JSON修复后仍然解析失败:', parseError2.message);
            
            // 策略C: 增强型部分内容提取
            try {
              // 优化的天数对象提取逻辑，使用更宽松的正则
              const dayRegex = /\{[^}]*day[^}]*\d+[^}]*\}/gi;
              const dayMatches = fixedContent.match(dayRegex) || [];
              
              console.log(`成功识别${dayMatches.length}个可能的天数对象`);
              // 尝试解析每个天数对象
              const parsedDays = [];
              
              for (const dayStr of dayMatches) {
                try {
                  // 先尝试直接解析
                  const dayObj = JSON.parse(dayStr);
                  // 确保每个天数对象都有必要的结构
                  if (!dayObj.activities || !Array.isArray(dayObj.activities)) {
                    dayObj.activities = [];
                  }
                  parsedDays.push(dayObj);
                } catch (e) {
                  console.warn('天数对象直接解析失败，尝试修复:', dayStr.substring(0, 50) + '...');
                  
                  // 尝试修复单个天数对象
                  try {
                    // 先进行基础清理
                    let fixedDayStr = dayStr
                      .replace(/\u200B/g, '') // 移除零宽空格
                      .replace(/\uFEFF/g, '') // 移除BOM标记
                      .replace(/\r\n/g, ' ')
                      .replace(/\n+/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim();
                    
                    // 补全缺失的引号和逗号，使用更健壮的正则表达式
                    fixedDayStr = fixedDayStr
                      // 确保字段名有引号
                      .replace(/([a-zA-Z0-9_]+)(\s*:\s*)/g, '"$1"$2')
                      // 处理数值字段，确保是数字格式
                      .replace(/"(cost|dailyBudget|day|travelers)":\s*"(\d+)"/g, '"$1": $2')
                      // 为字符串值添加引号
                      .replace(/:\s*([^"\{\[\]\},\}\s][^\{\[\]\},\}]*)(?=\s*[,\}\]])/g, function(match, value) {
                        if (/^\d+(\.\d+)?$/.test(value) || value.toLowerCase() === 'true' || 
                            value.toLowerCase() === 'false' || value.toLowerCase() === 'null') {
                          return match;
                        }
                        return ': "' + value.replace(/"/g, '\\"') + '"';
                      });
                      
                    // 确保有activities字段和正确的结构
                    if (!fixedDayStr.includes('"activities"')) {
                      fixedDayStr = fixedDayStr.replace(/\}$/, ', "activities": []}');
                    }
                    
                    // 专门处理activities数组中的cost字段
                    if (fixedDayStr.includes('"activities"')) {
                      // 使用更宽松的正则表达式处理费用相关的中文值
                      const costPattern = /"cost":\s*"?([^"\,\}]+)"?/g;
                      fixedDayStr = fixedDayStr.replace(costPattern, (match, costValue) => {
                        // 检查是否包含中文
                        if (/[\u4e00-\u9fa5]/.test(costValue)) {
                          // 匹配所有费用相关的中文描述
                          if (/免费|无|零元|无需费用|无额外费用|不要钱|免费入场|免费参观|免费游玩/.test(costValue)) {
                            return '"cost": 0';
                          }
                          // 其他中文描述也设为0或默认值
                          return '"cost": 100';
                        }
                        // 如果是数字字符串，转换为数字
                        if (/^\d+$/.test(costValue)) {
                          return '"cost": ' + costValue;
                        }
                        return match;
                      });
                    }
                    
                    // 再次尝试解析
                    const fixedDayObj = JSON.parse(fixedDayStr);
                    parsedDays.push(fixedDayObj);
                    console.log('成功修复并解析天数对象');
                  } catch (fixError) {
                  console.warn('修复失败，尝试更简单的修复方法');
                  
                  // 使用超简化的天数对象创建
                  try {
                    // 提取day值
                    const dayMatch = dayStr.match(/"day":\s*(\d+)/);
                    const dayNum = dayMatch ? parseInt(dayMatch[1]) : 1;
                    
                    // 创建简化的天数对象
                    const simplifiedDay = {
                      day: dayNum,
                      activities: [],
                      dailyBudget: 0
                    };
                    parsedDays.push(simplifiedDay);
                    console.log('成功创建简化的天数对象:', dayNum);
                  } catch (simplifyError) {
                    console.warn('超简化修复也失败，跳过此天数对象');
                  }
                }
                }
              }
              
              if (parsedDays.length > 0) {
                itineraryDays = parsedDays;
                console.log('成功解析部分行程数据，获取到的天数:', itineraryDays.length);
                
                // 确保行程天数完整，如果天数不足，补充默认天数对象
                const existingDays = new Set(parsedDays.map(d => d.day));
                const totalRequiredDays = days;
                
                for (let i = 1; i <= totalRequiredDays; i++) {
                  if (!existingDays.has(i)) {
                    // 添加缺失的天数
                    itineraryDays.push({
                      day: i,
                      activities: [],
                      dailyBudget: 0
                    });
                    console.log('补充缺失的天数:', i);
                  }
                }
                
                // 按天数排序
                itineraryDays.sort((a, b) => a.day - b.day);
              } else {
                console.warn('所有天数对象解析失败，创建简化行程框架');
                
                // 直接创建完整的天数框架，而不是立即调用默认生成器
                itineraryDays = [];
                for (let i = 1; i <= days; i++) {
                  itineraryDays.push({
                    day: i,
                    activities: [],
                    dailyBudget: 0
                  });
                }
                console.log('创建了', days, '天的简化行程框架');
              }
            } catch (partialParseError) {
              console.error('提取部分内容失败，直接使用默认行程:', partialParseError.message);
              
              // 策略D: 最后尝试 - 创建增强版最小可行行程数据
              console.log('创建增强版最小可行行程数据...');
              // 直接使用默认行程生成器，确保内容质量更高
              return generateDefaultItinerary(destination, startDate, endDate, preferences);
            }
          }
        }
        
        // 简化验证逻辑，优先确保行程数据可用
        if (!Array.isArray(itineraryDays) || itineraryDays.length === 0) {
          console.warn('解析结果不是有效的数组或为空，使用默认行程');
          return generateDefaultItinerary(destination, startDate, endDate, preferences);
        }
        
        // 增强型活动成本计算逻辑 - 根据旅行人数和预算调整
        try {
          // 清理并增强行程数据
          itineraryDays = itineraryDays
            .filter(day => day && typeof day === 'object') // 过滤无效对象
            .map(day => {
              // 确保基本结构
              const safeDay = {
                day: Number(day.day) || 1,
                activities: Array.isArray(day.activities) ? day.activities : [],
                dailyBudget: day.dailyBudget && !isNaN(day.dailyBudget) ? Number(day.dailyBudget) : 0
              };
              
              // 清理并增强活动数据
              safeDay.activities = safeDay.activities
                .filter(act => act && typeof act === 'object') // 过滤无效活动
                .map(activity => {
                  // 创建安全的活动对象，确保所有必要字段存在
                  const safeActivity = {
                    time: activity.time || '12:00',
                    activity: activity.activity || '默认活动',
                    description: activity.description || '行程活动',
                    location: activity.location || destination,
                    duration: activity.duration || '1小时',
                    cost: 0 // 初始化为0，稍后计算
                  };
                  
                  // 计算或验证成本
                  if (activity.cost !== undefined && activity.cost !== null && !isNaN(activity.cost)) {
                    safeActivity.cost = Number(activity.cost);
                  } else {
                    // 基于活动类型的智能成本估算
                    const activityText = (safeActivity.activity + ' ' + safeActivity.description + ' ' + safeActivity.location).toLowerCase();
                    
                    // 根据旅行人数和预算调整成本
                    const travelersMultiplier = preferences.travelers || 1;
                    
                    if (activityText.includes('餐') || activityText.includes('餐厅') || activityText.includes('food')) {
                      safeActivity.cost = 150 * travelersMultiplier;
                    } else if (activityText.includes('景点') || activityText.includes('游览') || activityText.includes('参观')) {
                      safeActivity.cost = 100 * travelersMultiplier;
                    } else if (activityText.includes('购物') || activityText.includes('shopping')) {
                      safeActivity.cost = 200 * travelersMultiplier;
                    } else if (activityText.includes('交通') || activityText.includes('transport')) {
                      safeActivity.cost = 50 * travelersMultiplier;
                    } else if (activityText.includes('住宿') || activityText.includes('酒店') || activityText.includes('hotel')) {
                      safeActivity.cost = 300 * travelersMultiplier;
                    } else if (activityText.includes('免费') || activityText.includes('free')) {
                      safeActivity.cost = 0;
                    } else {
                      safeActivity.cost = 80 * travelersMultiplier; // 默认成本
                    }
                    
                    // 根据预算调整费用合理性
                    if (preferences.budget) {
                      const dailyBudgetPerPerson = preferences.budget / days / travelersMultiplier;
                      // 如果活动成本过高，进行适当调整
                      if (safeActivity.cost > dailyBudgetPerPerson * 0.3) {
                        safeActivity.cost = Math.floor(dailyBudgetPerPerson * 0.3);
                      }
                    }
                  }
                  
                  return safeActivity;
                });
              
              // 重新计算每日预算
              safeDay.dailyBudget = safeDay.activities.reduce((sum, act) => sum + (act.cost || 0), 0);
              
              return safeDay;
            });
          
          // 确保天数是唯一且有序的
          const dayMap = new Map();
          itineraryDays.forEach(day => dayMap.set(day.day, day));
          itineraryDays = Array.from(dayMap.values()).sort((a, b) => a.day - b.day);
          
          console.log('行程数据处理完成，有效天数:', itineraryDays.length);
          
        } catch (dataError) {
          console.error('行程数据处理出错，使用默认行程:', dataError.message);
          return generateDefaultItinerary(destination, startDate, endDate, preferences);
        }
        
        // 确保行程天数合理，不多于实际天数
        if (itineraryDays.length > days) {
          itineraryDays = itineraryDays.slice(0, days);
          console.log('调整行程天数至', days, '天');
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
  
  // 基于偏好生成不同类型的活动，考虑旅行人数和预算
  const getActivitiesForDay = (day, destination, preferences) => {
    const activities = [];
    const travelers = preferences.travelers || 2;
    const budget = preferences.budget || 5000;
    const dailyBudgetPerPerson = budget / days / travelers;
    
    // 根据预算级别调整费用
    const budgetLevel = budget <= 3000 ? 'low' : budget <= 10000 ? 'medium' : 'high';
    
    // 第一天特殊处理：抵达和适应
    if (day === 1) {
      const accommodationCost = budgetLevel === 'low' ? 80 * travelers : budgetLevel === 'medium' ? 120 * travelers : 200 * travelers;
      const mealCost = budgetLevel === 'low' ? 120 * travelers : budgetLevel === 'medium' ? 180 * travelers : 250 * travelers;
      
      activities.push(
        { time: '09:00', activity: '抵达目的地', description: `抵达${destination}，办理入住`, location: `${destination}酒店`, duration: '2小时', cost: accommodationCost },
        { time: '11:30', activity: '午餐', description: `品尝${destination}当地美食`, location: '市中心餐厅', duration: '1小时', cost: mealCost },
        { time: '13:30', activity: '市区漫步', description: `熟悉${destination}市区环境`, location: destination, duration: '2小时', cost: 0 },
        { time: '16:00', activity: '休闲休息', description: '调整时差，休息放松', location: '酒店', duration: '2小时', cost: 0 },
        { time: '18:30', activity: '晚餐', description: `享用${destination}特色晚餐`, location: '当地餐厅', duration: '1.5小时', cost: mealCost }
      );
      return activities;
    }
    
    // 最后一天特殊处理：退房和离开
    if (day === days) {
      const attractionCost = budgetLevel === 'low' ? 80 * travelers : budgetLevel === 'medium' ? 120 * travelers : 180 * travelers;
      const mealCost = budgetLevel === 'low' ? 100 * travelers : budgetLevel === 'medium' ? 150 * travelers : 220 * travelers;
      const transportCost = budgetLevel === 'low' ? 60 * travelers : budgetLevel === 'medium' ? 90 * travelers : 120 * travelers;
      
      activities.push(
        { time: '09:00', activity: '酒店退房', description: '办理退房手续', location: '酒店', duration: '1小时', cost: 0 },
        { time: '10:30', activity: '最后游览', description: `最后游览${destination}的景点`, location: destination, duration: '2小时', cost: attractionCost },
        { time: '13:00', activity: '午餐', description: `最后品尝${destination}美食`, location: '特色餐厅', duration: '1小时', cost: mealCost },
        { time: '14:30', activity: '准备返程', description: '前往机场/车站', location: destination, duration: '2小时', cost: transportCost }
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
      { time: '08:30', activity: '早餐', description: '在酒店享用早餐', location: '酒店', duration: '1小时', cost: 0 }
    );
    
    // 根据预算级别和人数计算各项活动费用
    const calculateCost = (baseCost) => {
      let multiplier = budgetLevel === 'low' ? 0.8 : budgetLevel === 'medium' ? 1.0 : 1.3;
      return Math.floor(baseCost * multiplier * travelers);
    };
    
    // 上午活动
    if (hasHistoryPreference || day % 3 === 0) {
      activities.push(
        { time: '09:30', activity: `参观${destination}历史景点`, description: `探索${destination}的历史文化遗产`, location: destination, duration: '3小时', cost: calculateCost(120) }
      );
    } else if (hasNaturePreference || day % 3 === 1) {
      activities.push(
        { time: '09:30', activity: `游览${destination}自然风光`, description: `欣赏${destination}的自然美景`, location: destination, duration: '3小时', cost: calculateCost(80) }
      );
    } else {
      activities.push(
        { time: '09:30', activity: `${destination}城市观光`, description: `游览${destination}城市风光`, location: destination, duration: '3小时', cost: calculateCost(60) }
      );
    }
    
    // 午餐
    if (hasFoodPreference) {
      activities.push(
          { time: '13:00', activity: '特色午餐', description: `品尝${destination}正宗美食`, location: '当地知名餐厅', duration: '1.5小时', cost: calculateCost(200) }
        );
    } else {
      activities.push(
          { time: '13:00', activity: '午餐', description: `享用午餐`, location: destination, duration: '1小时', cost: calculateCost(120) }
        );
    }
    
    // 下午活动
    if (hasShoppingPreference && day % 2 === 0) {
      activities.push(
        { time: '14:30', activity: `${destination}购物体验`, description: `在${destination}购买特色商品`, location: `${destination}购物区`, duration: '3小时', cost: calculateCost(300) }
      );
    } else if (day % 4 === 0) {
      activities.push(
        { time: '14:30', activity: `${destination}文化体验`, description: `体验${destination}的文化活动`, location: destination, duration: '3小时', cost: calculateCost(150) }
      );
    } else {
      activities.push(
        { time: '14:30', activity: `${destination}休闲活动`, description: `在${destination}放松休息`, location: destination, duration: '3小时', cost: calculateCost(50) }
      );
    }
    
    // 晚餐
    activities.push(
      { time: '18:30', activity: '晚餐', description: `享用晚餐`, location: '推荐餐厅', duration: '1.5小时', cost: calculateCost(150) }
    );
    
    // 晚上活动
    if (day % 3 === 0) {
      activities.push(
        { time: '20:30', activity: `${destination}夜景游览`, description: `欣赏${destination}美丽夜景`, location: destination, duration: '1.5小时', cost: calculateCost(60) }
      );
    }
    
    // 为非最后一天添加"回旅馆睡觉"作为最后活动
    if (day !== days) {
      const lastActivityTime = activities.length > 0 ? activities[activities.length - 1].time : '18:30';
      const bedtime = lastActivityTime === '20:30' ? '22:00' : '20:30';
      activities.push(
        { time: bedtime, activity: '回旅馆睡觉', description: '休息，为明天的行程做准备', location: '酒店', duration: '10小时', cost: 0 }
      );
    }
    
    return activities;
  };
  
  const defaultItinerary = [];
  
  for (let i = 1; i <= days; i++) {
      const activities = getActivitiesForDay(i, destination, preferences);
      // 计算每日预算总和
      const dailyBudget = activities.reduce((sum, act) => sum + (act.cost || 0), 0);
      
      defaultItinerary.push({
        day: i,
        activities: activities,
        dailyBudget: dailyBudget
      });
    }
  
  return defaultItinerary;
};

module.exports = generateItinerary;