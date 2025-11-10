const axios = require('axios');

/**
 * 使用通义千问API生成预算建议
 * @param {string} destination - 目的地
 * @param {number} totalBudget - 总预算
 * @param {string} apiKey - 用户提供的API key（通义千问）
 * @returns {Promise<Array>} 生成的预算类别数组
 */
const generateBudget = async (destination, totalBudget, apiKey = '') => {
  try {
    // 构建提示信息
    const prompt = `请为以下旅行目的地生成合理的预算分配建议：
目的地：${destination}
总预算：${totalBudget}元人民币

请按以下格式返回JSON：
[
  {"name": "交通", "estimated": 金额, "actual": 0},
  {"name": "住宿", "estimated": 金额, "actual": 0},
  {"name": "餐饮", "estimated": 金额, "actual": 0},
  {"name": "门票", "estimated": 金额, "actual": 0},
  {"name": "购物", "estimated": 金额, "actual": 0},
  {"name": "其他", "estimated": 金额, "actual": 0}
]

请根据${destination}的消费水平，合理分配各项支出，确保总和接近总预算。

请确保返回严格的JSON格式，不要包含任何额外的文本或解释。`;

    // 检查用户是否提供了有效的API key
    const isValidUserApiKey = apiKey && 
      apiKey.trim() !== '' && 
      apiKey !== 'sk-placeholder-key-for-development' && 
      !apiKey.startsWith('your_');

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
          max_tokens: 500,
          temperature: 0.7,
          top_p: 0.8
        }
      }
    });

    // 解析生成的内容
      const generatedContent = response.data.output.text.trim();
      let budgetCategories;
      
      try {
        // 提取JSON部分（移除可能的前言和后语）
        const jsonMatch = generatedContent.match(/\[([\s\S]*?)\]/);
        
        if (jsonMatch) {
          const jsonContent = jsonMatch[0];
          budgetCategories = JSON.parse(jsonContent);
        } else {
          // 尝试直接解析
          budgetCategories = JSON.parse(generatedContent);
        }
        
        // 验证解析结果是否为数组
        if (!Array.isArray(budgetCategories)) {
          console.warn('预算解析结果不是数组，使用默认预算');
          return generateDefaultBudget(totalBudget);
        }
      } catch (jsonError) {
        console.error('预算JSON解析错误:', jsonError);
        console.error('原始生成内容:', generatedContent);
        // JSON解析失败时返回默认预算
        return generateDefaultBudget(totalBudget);
      }

    return budgetCategories;
  } catch (error) {
    console.error('生成预算错误:', error);
    // 返回默认预算分配作为备用
    return generateDefaultBudget(totalBudget);
  }
};

/**
 * 生成默认预算分配（当AI生成失败时使用）
 * @param {number} totalBudget - 总预算
 * @returns {Array} 默认预算类别数组
 */
const generateDefaultBudget = (totalBudget) => {
  // 默认预算分配比例
  const defaultAllocations = [
    { name: '交通', percentage: 20 },
    { name: '住宿', percentage: 40 },
    { name: '餐饮', percentage: 15 },
    { name: '门票', percentage: 15 },
    { name: '购物', percentage: 5 },
    { name: '其他', percentage: 5 }
  ];

  // 计算各项预算
  return defaultAllocations.map(item => ({
    name: item.name,
    estimated: Math.round(totalBudget * (item.percentage / 100)),
    actual: 0
  }));
};

module.exports = generateBudget;