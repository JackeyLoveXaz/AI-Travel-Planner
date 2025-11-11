const axios = require('axios');

/**
 * AI控制器
 * 处理与大语言模型相关的请求
 */

/**
 * 根据用户的旅行需求直接通过大语言模型生成行程规划
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.generateTravelPlan = async (req, res) => {
  try {
    const { query, apiKey } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        message: '请提供有效的旅行需求文本' 
      });
    }

    // 构建提示词，让大语言模型只生成必要的旅行基本信息
    const prompt = `
请根据用户的旅行需求，只提取和生成以下必要的旅行基本信息。用户的需求是：${query}

请以JSON格式返回以下信息，确保格式正确且只包含这些字段：
{
  "destination": "目的地",
  "startDate": "开始日期（YYYY-MM-DD格式）",
  "endDate": "结束日期（YYYY-MM-DD格式）",
  "travelers": 人数,
  "budget": 预算金额,
  "preferences": ["旅行偏好1", "旅行偏好2"]
}

请注意以下要求：
1. 所有地点信息必须详细具体，包括具体名称和地址
2. 必须包含详细的预算分配信息，将总预算合理分配到各个类别
3. 推荐餐厅和景点必须包含完整的信息
4. 特别关注用户提到的偏好（如园林、美食等）

请确保返回的内容是严格的JSON格式，不要包含任何额外的文本或解释。
`;

    let aiResponse;
    
    try {
      // 直接使用通义千问大模型，使用用户提供的API key
      console.log('使用用户提供的API key调用通义千问生成行程');
      console.log('行程信息：', query);
      
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}` // 使用用户提供的API key
        },
        body: JSON.stringify({
          model: 'qwen-max',
          input: {
            messages: [
              {
                role: 'system',
                content: '你是一个专业的旅行规划助手。请严格按照JSON格式返回数据，确保所有字段都是有效的JSON格式。数字类型的字段不要加引号，字符串类型的字段必须加双引号。价格相关字段必须是数字格式，不能包含文字描述。请确保返回完整的JSON，不要截断。'
              },
              {
                role: 'user',
                content: prompt
              }
            ]
          },
          parameters: {
            max_tokens: 7000,
            temperature: 0.3, // 降低温度以获得更精确的输出
            top_p: 0.4,
            result_format: 'json'
          }
        })
      });

      const data = await response.json();
      const generatedContent = data.output?.choices?.[0]?.message?.content || '';

      console.log('开始解析生成内容，长度:', generatedContent.length);
      console.log('生成内容前200字符:', generatedContent.substring(0, 200));
      if (generatedContent.length > 200) {
        console.log('生成内容后200字符:', generatedContent.substring(generatedContent.length - 200));
      }

      // 第一步：预处理内容
      const processedContent = preprocessJsonContent(generatedContent);
      
      // 第二步：尝试提取JSON部分
      let jsonContent = processedContent;
      const jsonMatch = processedContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
        console.log('通过正则表达式成功提取JSON部分');
      }

      // 第三步：尝试解析处理后的JSON
      try {
        aiResponse = JSON.parse(jsonContent);
        console.log('JSON解析成功！');
        
        // 检查是否为天数数组格式（直接返回的dailyPlans数组）
        if (Array.isArray(aiResponse) && aiResponse.length > 0 && aiResponse[0].day) {
          console.log('检测到天数数组格式，转换为标准行程对象');
          // 转换为标准行程对象格式
          const destination = query.includes('北京') ? '北京' : 
                            query.includes('上海') ? '上海' : 
                            query.includes('广州') ? '广州' : 
                            query.includes('深圳') ? '深圳' : 
                            query.includes('成都') ? '成都' : 
                            query.includes('杭州') ? '杭州' : '未知目的地';
          
          const days = aiResponse.length;
          const startDate = new Date().toISOString().split('T')[0];
          const endDate = new Date(Date.now() + (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          // 估算预算
          let budget = 5000;
          if (query.includes('一万') || query.includes('10000')) {
            budget = 10000;
          } else if (query.includes('两万') || query.includes('20000')) {
            budget = 20000;
          } else if (query.includes('五千') || query.includes('5000')) {
            budget = 5000;
          }
          
          // 重新构建aiResponse为标准格式
          aiResponse = {
            destination: destination,
            startDate: startDate,
            endDate: endDate,
            travelers: query.includes('人') ? parseInt(query.match(/(\d+)人/)?.[1] || '2') : 2,
            budget: budget,
            preferences: query.includes('美食') ? ['美食'] : [],
            itinerary: {
              overview: `${destination}${days}日游行程`,
              dailyPlans: aiResponse,
              recommendations: {
                restaurants: [],
                attractions: [],
                tips: []
              }
            }
          };
        }
      } catch (jsonError) {
        console.log('第一次解析失败，尝试修复JSON结构...');
        
        // 第四步：使用改进的修复函数
        const fixedJson = fixJsonStructure(jsonContent);
        console.log('修复后的JSON长度:', fixedJson.length);
        
        try {
          aiResponse = JSON.parse(fixedJson);
          console.log('JSON修复后解析成功！');
        } catch (secondError) {
          console.log('JSON修复后仍然解析失败:', secondError.message);
          
          // 第五步：尝试逐个解析天数对象，使用更宽松的正则表达式
          const dayObjects = fixedJson.match(/\{[^}]*"day"[^}]*\}/g);
          if (dayObjects && dayObjects.length > 0) {
            console.log('成功识别', dayObjects.length, '个可能的天数对象');
            const validDays = [];
            
            for (const dayObj of dayObjects) {
              try {
                // 先对天数对象进行预处理，重点处理中文值
                let processedDay = dayObj;
                
                // 专门处理费用相关的中文值，使用更全面的匹配
                processedDay = processedDay.replace(/"cost":\s*"?(免费|免费入场|无|零元|无额外费用|无需费用|不要钱)"?/g, '"cost": 0');
                
                // 处理时间相关的中文值
                processedDay = processedDay.replace(/"duration":\s*"?半天"?/g, '"duration": "4小时"');
                processedDay = processedDay.replace(/"duration":\s*"?全天"?/g, '"duration": "8小时"');
                processedDay = processedDay.replace(/"duration":\s*"?视具体情况而定"?/g, '"duration": "1小时"');
                
                // 再使用标准预处理和修复函数
                processedDay = preprocessJsonContent(processedDay);
                const fixedDay = fixJsonStructure(processedDay);
                
                try {
                  const parsedDay = JSON.parse(fixedDay);
                  validDays.push(parsedDay);
                  console.log('成功解析天数对象:', parsedDay.day);
                } catch (parseError) {
                  // 如果直接解析失败，尝试更细致的字段级修复
                  console.log('天数对象直接解析失败，尝试字段级修复...');
                  
                  // 针对activities数组中的每个活动单独处理
                  let activitiesFixed = fixedDay;
                  const activityRegex = /"activities":\s*\[([^\]]+)\]/;
                  const activityMatch = activitiesFixed.match(activityRegex);
                  
                  if (activityMatch) {
                    // 提取并处理每个活动对象
                    let activitiesContent = activityMatch[1];
                    
                    // 先处理所有活动中的cost字段，包括更多中文描述
                    activitiesContent = activitiesContent.replace(/"cost":\s*"?([^"\,\}]+)"?/g, (match, costValue) => {
                      // 检查是否包含中文
                      if (/[\u4e00-\u9fa5]/.test(costValue)) {
                        // 匹配更多费用相关的中文描述
                        if (/(免费|无|零元|无需费用|无额外费用|不要钱)/.test(costValue)) {
                          return '"cost": 0';
                        }
                        // 其他中文描述也设为0
                        return '"cost": 0';
                      }
                      // 如果是数字字符串，转换为数字
                      if (/^\d+$/.test(costValue)) {
                        return '"cost": ' + costValue;
                      }
                      return match;
                    });
                    
                    // 处理duration字段中的中文值
                    activitiesContent = activitiesContent.replace(/"duration":\s*"?([^"\,\}]+)"?/g, (match, durationValue) => {
                      if (durationValue === '半天') return '"duration": "4小时"';
                      if (durationValue === '全天') return '"duration": "8小时"';
                      if (durationValue === '视具体情况而定') return '"duration": "1小时"';
                      return match;
                    });
                    
                    // 替换回activities字段
                    activitiesFixed = activitiesFixed.replace(activityRegex, '"activities": [' + activitiesContent + ']');
                  }
                  
                  // 修复dailyBudget字段（如果存在）
                  activitiesFixed = activitiesFixed.replace(/"dailyBudget":\s*"?(\d+)"?/g, '"dailyBudget": $1');
                  
                  try {
                    // 尝试解析修复后的内容
                    const parsedDay = JSON.parse(activitiesFixed);
                    validDays.push(parsedDay);
                    console.log('成功通过字段级修复解析天数对象:', parsedDay.day);
                  } catch (secondParseError) {
                    // 如果字段级修复失败，尝试更激进的修复
                    console.log('字段级修复失败，尝试更激进的修复...');
                    
                    // 尝试最激进的修复方法
                    let aggressiveFix = dayObj;
                    
                    // 1. 先处理所有已知的中文值，转换为标准值
                    const chineseCostPatterns = ['免费', '免费入场', '无', '零元', '无额外费用', '无需费用', '不要钱', '无费用'];
                    chineseCostPatterns.forEach(pattern => {
                      // 使用更宽松的正则表达式，不依赖于引号和空格
                      aggressiveFix = aggressiveFix.replace(new RegExp(`cost:\s*["']?${pattern}["']?`, 'gi'), '"cost": 0');
                    });
                    
                    // 处理时间相关的中文值
                    aggressiveFix = aggressiveFix.replace(/duration:\s*["']?半天["']?/gi, '"duration": "4小时"');
                    aggressiveFix = aggressiveFix.replace(/duration:\s*["']?全天["']?/gi, '"duration": "8小时"');
                    aggressiveFix = aggressiveFix.replace(/duration:\s*["']?视具体情况而定["']?/gi, '"duration": "1小时"');
                    
                    // 2. 为所有字段名添加引号
                    aggressiveFix = aggressiveFix.replace(/([a-zA-Z0-9_]+)(\s*:\s*)/g, '"$1"$2');
                    
                    // 3. 为字符串值添加引号，但保留数字值和布尔值
                    aggressiveFix = aggressiveFix.replace(/:\s*([^"\{\[\],\}\s\d\-\.][^\{\[\],\}]*)(?=\s*[\},\]])/g, function(match, value) {
                      if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false' || value.toLowerCase() === 'null') {
                        return match;
                      }
                      return ': "' + value.replace(/"/g, '\\"') + '"';
                    });
                    
                    // 4. 移除多余的逗号
                    aggressiveFix = aggressiveFix.replace(/,\s*\}/g, '}');
                    aggressiveFix = aggressiveFix.replace(/,\s*\]/g, ']');
                    
                    // 5. 修复对象和数组的结构
                    aggressiveFix = aggressiveFix.replace(/\{\s*\}/g, '{}');
                    aggressiveFix = aggressiveFix.replace(/\[\s*\]/g, '[]');
                    
                    try {
                      const parsedDay = JSON.parse(aggressiveFix);
                      validDays.push(parsedDay);
                      console.log('成功通过激进修复解析天数对象:', parsedDay.day);
                    } catch (fixError) {
                      console.log('激进修复也失败，尝试创建最简化天数对象');
                      // 超简化方案：只保留day字段，创建基本结构
                      try {
                        const dayNumber = parseInt(dayObj.match(/"day"\s*:\s*(\d+)/)?.[1] || '0');
                        if (dayNumber > 0) {
                          const minimalDay = {
                            day: dayNumber,
                            activities: [],
                            dailyBudget: 0
                          };
                          validDays.push(minimalDay);
                          console.log('成功创建最简化天数对象:', dayNumber);
                        }
                      } catch (minError) {
                        console.log('最简化天数对象创建失败，跳过此天数对象');
                      }
                    }
                  }
                }
              } catch (dayError) {
                console.log('天数对象解析发生异常:', dayObj.substring(0, 50), '...');
                console.log('跳过此天数对象');
              }
            }
            
            if (validDays.length > 0) {
              console.log('成功解析', validDays.length, '个天数对象');
              // 构建完整的行程对象
              const destination = query.includes('北京') ? '北京' : 
                                query.includes('上海') ? '上海' : 
                                query.includes('广州') ? '广州' : 
                                query.includes('深圳') ? '深圳' : 
                                query.includes('成都') ? '成都' : 
                                query.includes('杭州') ? '杭州' : '未知目的地';
              
              const days = validDays.length;
              const startDate = new Date().toISOString().split('T')[0];
              const endDate = new Date(Date.now() + (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
              
              // 估算预算
              let budget = 5000;
              if (query.includes('一万') || query.includes('10000')) {
                budget = 10000;
              } else if (query.includes('两万') || query.includes('20000')) {
                budget = 20000;
              } else if (query.includes('五千') || query.includes('5000')) {
                budget = 5000;
              }
              
              aiResponse = {
                destination: destination,
                startDate: startDate,
                endDate: endDate,
                travelers: query.includes('人') ? parseInt(query.match(/(\d+)人/)?.[1] || '2') : 2,
                budget: budget,
                preferences: query.includes('美食') ? ['美食'] : [],
                itinerary: {
                  overview: `${destination}${days}日游行程`,
                  dailyPlans: validDays,
                  recommendations: {
                    restaurants: [],
                    attractions: [],
                    tips: []
                  }
                }
              };
            } else {
              // 所有天数对象解析失败，使用默认行程生成器
              console.log('所有天数对象解析失败，使用完整默认行程生成器');
              aiResponse = generateMockResponse(query);
            }
          } else {
            // 最终降级策略：使用默认行程生成器
            console.log('无法识别天数对象，使用完整默认行程生成器');
            aiResponse = generateMockResponse(query);
          }
        }
      }
    } catch (error) {
      console.error('生成行程时发生错误:', error);
      // 发生错误时，返回模拟数据
      aiResponse = generateMockResponse(query);
    }

    // 只返回必要的基本信息，不包含详细行程
    // 确保日期正确设置：如果模型返回空日期，使用当天作为起始日期
    const today = new Date();
    const days = query.includes('一周') || query.includes('7天') ? 7 : 
                query.includes('两周') || query.includes('14天') ? 14 : 
                query.includes('5天') ? 5 : 3;
    const defaultStartDate = today.toISOString().split('T')[0];
    const defaultEndDate = new Date(today.getTime() + (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log('设置默认日期 - 开始日期:', defaultStartDate, '结束日期:', defaultEndDate);
    
    const result = {
      data: {
        destination: aiResponse.destination || '未知目的地',
        startDate: aiResponse.startDate && aiResponse.startDate.trim() !== '' ? aiResponse.startDate : defaultStartDate,
        endDate: aiResponse.endDate && aiResponse.endDate.trim() !== '' ? aiResponse.endDate : defaultEndDate,
        travelers: aiResponse.travelers || 2,
        budget: aiResponse.budget || 5000,
        preferences: aiResponse.preferences || ['美食', '观光']
      },
      message: '基本旅行信息提取成功，可用于生成详细行程规划'
    };
    
    console.log('返回结果中的日期信息 - 开始日期:', result.data.startDate, '结束日期:', result.data.endDate);
    
    // JSON预处理函数
    function preprocessJsonContent(content) {
      // 移除可能的问题字符
      let processed = content
        .replace(/\u200B/g, '') // 零宽空格
        .replace(/\uFEFF/g, '') // BOM标记
        .replace(/\n+/g, '\n') // 合并多余换行
        .trim();
      
      // 处理各种中文描述值，转换为标准JSON值
      // 处理费用相关的中文描述，使用更全面的正则表达式
      const chineseCostValues = [
        '免费', '免费入场', '无', '0元', '零元', '不要钱', '免费参观', '免费游玩',
        '无额外费用', '无需费用', '无费用', '无花费', '0花费'
      ];
      
      // 更激进的费用中文值处理，不依赖于字段名的引号
      chineseCostValues.forEach(value => {
        // 处理多种可能的格式："cost": 免费, "cost":免费, "cost":"免费", cost:免费等
        processed = processed.replace(new RegExp(`(cost|price):\s*"?${value}"?`, 'gi'), '$1: 0');
      });
      
      // 处理时间相关的中文描述，使用更宽松的匹配
      processed = processed.replace(/(duration):\s*"?半天"?/gi, '$1: "4小时"');
      processed = processed.replace(/(duration):\s*"?全天"?/gi, '$1: "8小时"');
      processed = processed.replace(/(duration):\s*"?约?(\d+)小时"?/gi, '$1: "$2小时"');
      processed = processed.replace(/(duration):\s*"?视具体情况而定"?/gi, '$1: "1小时"');
      
      // 确保数值类型的字段是数字格式
      processed = processed.replace(/(cost|price|budget|dailyBudget|travelers|day):\s*"(\d+)"/gi, '$1: $2');
      
      // 处理包含货币符号的数值
      processed = processed.replace(/(cost|price):\s*"?¥(\d+)"?/gi, '$1: $2');
      
      // 移除字符串中的多余空格
      processed = processed.replace(/"([^"]+)"/g, (match, p1) => {
        return '"' + p1.replace(/\s+/g, ' ').trim() + '"';
      });
      
      // 处理JSON中未加引号的中文值
      processed = processed.replace(/([,\{\[]\s*)([^:\s"\{\[\],]+[\u4e00-\u9fa5][^:\s"\{\[\],]*)(\s*[,:\}\]])/g, 
        (match, prefix, value, suffix) => {
          // 检查是否已经是数字、true、false、null
          if (/^\d+(\.\d+)?$/.test(value) || ['true', 'false', 'null'].includes(value.toLowerCase())) {
            return match;
          }
          // 为中文值添加引号
          return prefix + '"' + value.replace(/"/g, '\\"') + '"' + suffix;
        }
      );
      
      return processed;
    }
    
    // 改进的JSON结构修复函数
    function fixJsonStructure(content) {
      // 首先尝试提取有效的JSON部分，包括数组
      const jsonRegex = /\{[\s\S]*\}|\[[\s\S]*\]/; // 匹配JSON对象或数组
      const jsonMatch = content.match(jsonRegex);
      let fixedContent = jsonMatch ? jsonMatch[0] : content;
      
      // 提前处理常见的格式问题
      fixedContent = fixedContent
        .replace(/\u200B/g, '') // 移除零宽空格
        .replace(/\uFEFF/g, '') // 移除BOM标记
        .replace(/\r\n/g, '\n') // 规范化换行符
        .replace(/\n+/g, ' ') // 将换行符替换为空格
        .replace(/\s+/g, ' ') // 合并多余空格
        .trim();
      
      console.log('括号匹配情况: 大括号', (fixedContent.match(/\{/g) || []).length, ':', (fixedContent.match(/\}/g) || []).length, 
                  '中括号', (fixedContent.match(/\[/g) || []).length, ':', (fixedContent.match(/\]/g) || []).length);
      
      // 先进行中文值预处理，避免后续处理出错
      // 处理费用相关的中文值
      const costChineseValues = ['免费', '免费入场', '无', '0元', '零元', '不要钱', '免费参观', '免费游玩',
                               '无额外费用', '无需费用', '无费用', '无花费', '0花费'];
      costChineseValues.forEach(val => {
        // 使用更宽松的正则表达式匹配各种格式
        fixedContent = fixedContent.replace(new RegExp(`(["']?cost["']?|["']?price["']?):\s*["']?${val}["']?`, 'gi'), '$1: 0');
      });
      
      // 处理时间相关的中文值
      fixedContent = fixedContent.replace(/(["']?duration["']?):\s*["']?半天["']?/gi, '$1: "4小时"');
      fixedContent = fixedContent.replace(/(["']?duration["']?):\s*["']?全天["']?/gi, '$1: "8小时"');
      fixedContent = fixedContent.replace(/(["']?duration["']?):\s*["']?视具体情况而定["']?/gi, '$1: "1小时"');
      
      // 修复常见的格式问题
      fixedContent = fixedContent
        .replace(/,\s*\}/g, '}') // 移除对象末尾多余的逗号
        .replace(/,\s*\]/g, ']') // 移除数组末尾多余的逗号
        .replace(/'/g, '"') // 替换单引号为双引号
        .replace(/\\"/g, '"') // 修复转义引号
        .replace(/\bNaN\b/g, '0') // 替换NaN为0
        .replace(/\bInfinity\b/g, '10000') // 替换Infinity为大数值
        .replace(/\s+/g, ' ') // 规范化空白字符
        .trim();
      
      // 修复字段名没有引号的问题
      fixedContent = fixedContent.replace(/([a-zA-Z0-9_]+)(\s*:\s*)/g, function(match, key, colon) {
        // 如果不是数字开头且不是已经有引号的字段名，则添加引号
        if (!/^\d/.test(key) && key !== 'true' && key !== 'false' && key !== 'null' && !key.startsWith('"')) {
          return '"' + key + '"' + colon;
        }
        return match;
      });
      
      // 增强的字符串值引号处理，更好地处理包含中文和特殊字符的情况
      // 先处理已经有冒号但值没有引号的情况，使用更宽松的正则表达式
      fixedContent = fixedContent.replace(/:\s*([^"\{\[\],\}\s][^\{\[\],\}]*(?:[\u4e00-\u9fa5]|\s|\.|,|-|\+|\*|\/)[^\{\[\],\}]*)(?=\s*[,\}\]])/g, function(match, value) {
        // 检查是否已经是数字、true、false、null或已经有引号
        if (/^\d+(\.\d+)?$/.test(value) || value === 'true' || value === 'false' || value === 'null' || value.startsWith('"')) {
          return match;
        }
        // 转义值中的双引号
        const escapedValue = value.replace(/"/g, '\\"');
        return ': "' + escapedValue + '"';
      });
      
      // 专门处理数组中对象的情况，确保day字段正确格式化
      fixedContent = fixedContent.replace(/\{\s*"day":\s*(\d+)/g, '{"day": $1');
      
      // 处理数组结构的特殊情况
      if (fixedContent.startsWith('[') && fixedContent.endsWith(']')) {
        // 确保数组中的每个对象都正确格式化
        fixedContent = fixedContent.replace(/\}\s*,\s*\{/g, '}, {');
        
        // 增加专门处理中括号不匹配的逻辑 - 修复日志中显示的中括号8:7问题
        const openBrackets = (fixedContent.match(/\[/g) || []).length;
        const closeBrackets = (fixedContent.match(/\]/g) || []).length;
        if (openBrackets > closeBrackets) {
          console.log('检测到中括号不匹配，添加缺失的闭合中括号');
          // 添加缺失的闭合中括号
          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            fixedContent += ']';
          }
        } else if (closeBrackets > openBrackets) {
          console.log('检测到中括号不匹配，移除多余的闭合中括号');
          // 移除多余的闭合中括号
          fixedContent = fixedContent.slice(0, -Math.abs(closeBrackets - openBrackets));
        }
        
        // 再次处理数组中的特殊中文值，确保所有情况都被覆盖
        const extendedChineseValues = ['免费', '半天', '全天', '无额外费用', '视具体情况而定'];
        extendedChineseValues.forEach(val => {
          // 使用更宽松的正则表达式，不依赖于冒号后面的空格
          const regex = new RegExp(`:"?${val}"?`, 'gi');
          if (val === '免费' || val === '无额外费用') {
            fixedContent = fixedContent.replace(regex, ': 0');
          } else if (val === '半天') {
            fixedContent = fixedContent.replace(regex, ': "4小时"');
          } else if (val === '全天') {
            fixedContent = fixedContent.replace(regex, ': "8小时"');
          } else if (val === '视具体情况而定') {
            fixedContent = fixedContent.replace(regex, ': "1小时"');
          }
        });
      }
      
      // 修复嵌套结构中的问题
      fixedContent = fixedContent.replace(/\{\s*\{/g, '{"data":{');
      
      // 处理不完整的JSON（末尾截断）
      try {
        // 尝试检查JSON是否完整
        JSON.parse(fixedContent);
      } catch (e) {
        if (e.message.includes('Unexpected end')) {
          console.log('检测到不完整的JSON，尝试修复...');
          
          // 智能补全JSON结构
          const stack = [];
          for (let i = 0; i < fixedContent.length; i++) {
            if (fixedContent[i] === '{') stack.push('}');
            if (fixedContent[i] === '[') stack.push(']');
            if (fixedContent[i] === '}' || fixedContent[i] === ']') stack.pop();
          }
          
          // 添加缺失的闭合括号
          while (stack.length > 0) {
            fixedContent += stack.pop();
          }
          
          console.log('补全后的JSON括号匹配情况: 大括号', 
                    (fixedContent.match(/\{/g) || []).length, ':', (fixedContent.match(/\}/g) || []).length, 
                    '中括号', (fixedContent.match(/\[/g) || []).length, ':', (fixedContent.match(/\]/g) || []).length);
        }
      }
      
      return fixedContent;
    }
    
    // 生成模拟响应的辅助函数（只返回基本信息）
    function generateMockResponse(query) {
      // 根据用户输入的关键词简单模拟不同的目的地
      let destination = '北京';
      if (query.includes('上海') || query.includes('上海')) {
        destination = '上海';
      } else if (query.includes('广州') || query.includes('广州')) {
        destination = '广州';
      } else if (query.includes('深圳') || query.includes('深圳')) {
        destination = '深圳';
      } else if (query.includes('杭州') || query.includes('杭州')) {
        destination = '杭州';
      } else if (query.includes('成都') || query.includes('成都')) {
        destination = '成都';
      } else if (query.includes('西安') || query.includes('西安')) {
        destination = '西安';
      } else if (query.includes('南京') || query.includes('南京')) {
        destination = '南京';
      } else if (query.includes('重庆') || query.includes('重庆')) {
        destination = '重庆';
      } else if (query.includes('苏州') || query.includes('苏州')) {
        destination = '江苏苏州';
      } else if (query.includes('东京') || query.includes('东京')) {
        destination = '日本东京';
      }

      // 简单计算行程天数
      let days = 3;
      if (query.includes('一周') || query.includes('7天')) {
        days = 7;
      } else if (query.includes('两周') || query.includes('14天')) {
        days = 14;
      } else if (query.includes('5天')) {
        days = 5;
      }

      // 简单估算预算
      let budget = 5000;
      if (query.includes('一万') || query.includes('10000')) {
        budget = 10000;
      } else if (query.includes('两万') || query.includes('20000')) {
        budget = 20000;
      } else if (query.includes('五千') || query.includes('5000')) {
        budget = 5000;
      }

      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // 为不同目的地提供具体景点和餐厅信息
      const destinationDetails = {
        '江苏苏州': {
          attractions: [
            { name: '拙政园', address: '姑苏区东北街178号', price: 90, description: '中国四大名园之一，明代园林代表作' },
            { name: '狮子林', address: '姑苏区园林路23号', price: 40, description: '以假山著称的古典园林' },
            { name: '苏州博物馆', address: '姑苏区东北街204号', price: 0, description: '贝聿铭设计的现代化博物馆' },
            { name: '平江路', address: '姑苏区平江路', price: 0, description: '保存完好的明清风格老街' },
            { name: '留园', address: '金阊区留园路338号', price: 50, description: '清代古典园林' },
            { name: '寒山寺', address: '姑苏区枫桥路', price: 20, description: '著名千年古刹' },
            { name: '周庄古镇', address: '昆山市周庄镇', price: 100, description: '中国第一水乡' },
            { name: '山塘街', address: '姑苏区山塘街', price: 0, description: '苏州古城历史街区' }
          ],
          restaurants: [
            { name: '松鹤楼', address: '姑苏区观前街141号', cuisine: '苏帮菜', price: 150 },
            { name: '得月楼', address: '姑苏区太监弄27号', cuisine: '苏帮菜', price: 120 },
            { name: '平江路上的小餐馆', address: '姑苏区平江路', cuisine: '苏州小吃', price: 50 },
            { name: '观前街美食广场', address: '姑苏区观前街', cuisine: '各地小吃', price: 60 }
          ],
          hotels: [
            { name: '苏州W酒店', address: '工业园区星港街与苏惠路交汇处', price: 1200 },
            { name: '苏州凯悦酒店', address: '工业园区华池街88号', price: 900 },
            { name: '苏州平江悦酒店', address: '姑苏区平江路', price: 600 },
            { name: '苏州亚朵酒店', address: '姑苏区干将西路', price: 400 }
          ]
        }
      };

      // 获取当前目的地的详细信息，如果没有则使用默认值
      const currentDestination = destinationDetails[destination] || {
        attractions: [
          { name: '主要景点1', address: `${destination}中心区`, price: 80, description: '当地著名景点' },
          { name: '主要景点2', address: `${destination}西区`, price: 60, description: '文化景点' },
          { name: '主要景点3', address: `${destination}东区`, price: 40, description: '自然风光' },
          { name: '主要景点4', address: `${destination}南区`, price: 100, description: '历史遗迹' }
        ],
        restaurants: [
          { name: '特色餐厅1', address: `${destination}美食街`, cuisine: '当地特色', price: 100 },
          { name: '特色餐厅2', address: `${destination}市中心`, cuisine: '当地特色', price: 120 }
        ],
        hotels: [
          { name: `${destination}大酒店`, address: `${destination}市中心`, price: 500 }
        ]
      };

      // 生成详细的预算分配
      const budgetBreakdown = {
        accommodation: Math.floor(budget * 0.4),
        transportation: Math.floor(budget * 0.2),
        meals: Math.floor(budget * 0.2),
        attractions: Math.floor(budget * 0.1),
        shopping: Math.floor(budget * 0.05),
        other: Math.floor(budget * 0.05)
      };

      // 生成模拟的行程计划
      const dailyPlans = [];
      for (let i = 1; i <= days; i++) {
        const dayDate = new Date(Date.now() + (i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const attractionIndex = (i - 1) % currentDestination.attractions.length;
        const restaurantIndex = (i - 1) % currentDestination.restaurants.length;
        const hotelIndex = 0; // 默认使用第一个酒店
        
        const dailyActivities = [];
        
        // 第一天特殊处理
        if (i === 1) {
          dailyActivities.push(
            {
              time: '09:00',
              activity: '抵达苏州',
              location: '苏州站',
              cost: 0,
              duration: '2小时',
              description: '从出发地到达苏州火车站或机场',
              notes: '提前规划好交通路线'
            },
            {
              time: '11:00',
              activity: '入住酒店',
              location: currentDestination.hotels[hotelIndex].name,
              cost: 0,
              duration: '1小时',
              description: `办理入住手续，放置行李`,
              notes: `${currentDestination.hotels[hotelIndex].address}`
            }
          );
        }
        
        // 添加主要景点游览
        dailyActivities.push(
          {
            time: i === 1 ? '14:00' : '09:00',
            activity: `游览${currentDestination.attractions[attractionIndex].name}`,
            location: `${currentDestination.attractions[attractionIndex].name}, ${currentDestination.attractions[attractionIndex].address}`,
            cost: currentDestination.attractions[attractionIndex].price,
            duration: '约3小时',
            description: currentDestination.attractions[attractionIndex].description,
            notes: '建议提前预约，避开人流高峰'
          },
          {
            time: i === 1 ? '17:30' : '12:30',
            activity: '午餐',
            location: `${currentDestination.restaurants[restaurantIndex].name}, ${currentDestination.restaurants[restaurantIndex].address}`,
            cost: currentDestination.restaurants[restaurantIndex].price,
            duration: '1.5小时',
            description: `品尝正宗${currentDestination.restaurants[restaurantIndex].cuisine}`,
            notes: '推荐提前预约'
          }
        );
        
        // 非第一天添加下午活动
        if (i > 1) {
          const afternoonAttractionIndex = (i + 1) % currentDestination.attractions.length;
          dailyActivities.push(
            {
              time: '14:30',
              activity: `游览${currentDestination.attractions[afternoonAttractionIndex].name}`,
              location: `${currentDestination.attractions[afternoonAttractionIndex].name}, ${currentDestination.attractions[afternoonAttractionIndex].address}`,
              cost: currentDestination.attractions[afternoonAttractionIndex].price,
              duration: '约2.5小时',
              description: currentDestination.attractions[afternoonAttractionIndex].description,
              notes: '注意开放时间'
            },
            {
              time: '18:00',
              activity: '晚餐',
              location: '当地特色餐厅',
              cost: Math.floor(Math.random() * 100) + 80,
              duration: '1.5小时',
              description: '品尝当地特色美食',
              notes: '推荐尝试当地特色菜品'
            }
          );
        }
        
        // 最后一天特殊处理
        if (i === days) {
          dailyActivities.push(
            {
              time: '10:00',
              activity: '自由活动',
              location: '市区',
              cost: 0,
              duration: '3小时',
              description: '最后一天自由安排，可购物或再次游览喜爱的景点',
              notes: '注意安排好返程时间'
            },
            {
              time: '15:00',
              activity: '退房离开',
              location: currentDestination.hotels[hotelIndex].name,
              cost: 0,
              duration: '1小时',
              description: '办理退房手续，前往车站或机场',
              notes: '确认没有遗漏物品'
            }
          );
        }
        
        // 计算当天预算
        const dailyBudget = dailyActivities.reduce((sum, activity) => sum + activity.cost, 0) + 
                          Math.floor(budgetBreakdown.accommodation / days) +
                          Math.floor(budgetBreakdown.transportation / days);

        dailyPlans.push({
          day: i,
          date: dayDate,
          activities: dailyActivities,
          accommodation: `${currentDestination.hotels[hotelIndex].name}, ${currentDestination.hotels[hotelIndex].address}`,
          transportation: '地铁+出租车+步行',
          dailyBudget: dailyBudget
        });
      }

      return {
        destination,
        startDate,
        endDate,
        travelers: query.includes('人') ? parseInt(query.match(/(\d+)人/)?.[1] || '2') : 2,
        budget,
        budgetBreakdown: budgetBreakdown,
        preferences: getPreferencesFromQuery(query),
        itinerary: {
          overview: `${destination}${days}日游行程。根据${query}的需求，精心安排了详细的行程，包含主要景点游览、特色美食体验和合理的预算分配。`,
          dailyPlans,
          recommendations: {
            restaurants: currentDestination.restaurants.map(restaurant => ({
              name: restaurant.name,
              cuisine: restaurant.cuisine,
              price: restaurant.price,
              address: restaurant.address,
              recommendation: `推荐品尝正宗${restaurant.cuisine}，环境优雅，菜品地道`
            })),
            attractions: currentDestination.attractions.map(attraction => ({
              name: attraction.name,
              description: attraction.description,
              price: attraction.price,
              address: attraction.address,
              openingHours: '08:00-17:00'
            })),
            tips: [
              `${destination}气候宜人，建议提前查看天气预报`,
              '携带舒适的步行鞋，景点间可能需要较多步行',
              '建议提前预约热门景点和餐厅',
              '准备一些常用药品',
              '尊重当地风俗习惯'
            ]
          }
        }
      };
    }

    // 从查询中提取偏好
    function getPreferencesFromQuery(query) {
      const preferences = [];
      if (query.includes('美食') || query.includes('吃')) {
        preferences.push('美食');
      }
      if (query.includes('历史') || query.includes('文化')) {
        preferences.push('历史文化');
      }
      if (query.includes('自然') || query.includes('风景')) {
        preferences.push('自然风光');
      }
      if (query.includes('购物') || query.includes('买')) {
        preferences.push('购物');
      }
      if (query.includes('园林') || query.includes('公园')) {
        preferences.push('园林景观');
      }
      return preferences.length > 0 ? preferences : ['美食', '观光'];
    }

    // 生成默认行程
    function generateDefaultItinerary() {
      return {
        overview: '默认行程规划',
        dailyPlans: [
          {
            day: 1,
            date: new Date().toISOString().split('T')[0],
            activities: [
              {
                time: '09:00',
                activity: '抵达目的地',
                location: '机场/车站',
                cost: 0,
                duration: '2小时',
                description: '从出发地到达目的地',
                notes: '抵达并前往住宿地'
              },
              {
                time: '12:00',
                activity: '午餐',
                location: '市中心餐厅',
                cost: 100,
                duration: '1小时',
                description: '品尝当地特色美食',
                notes: '推荐尝试当地招牌菜'
              }
            ],
            accommodation: '市中心商务酒店',
            transportation: '出租车+公共交通',
            dailyBudget: 1000
          }
        ],
        recommendations: {
          restaurants: [
            {
              name: '当地名店',
              cuisine: '当地特色',
              price: 150,
              address: '市中心商业区',
              recommendation: '当地最受欢迎的餐厅之一'
            }
          ],
          attractions: [
            {
              name: '主要景点',
              description: '当地标志性景点',
              price: 80,
              address: '市中心',
              openingHours: '08:00-18:00'
            }
          ],
          tips: ['建议提前预订酒店', '准备舒适的步行鞋', '注意当地天气变化']
        }
      };
    }

    // 此时result已经构建完成

    res.status(200).json(result);
  } catch (error) {
    console.error('生成旅行计划错误:', error);
    res.status(500).json({
      message: '生成旅行计划失败',
      error: error.message
    });
  }
};

module.exports = exports;