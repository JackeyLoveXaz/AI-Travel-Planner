const openai = require('../config/openai');

/**
 * 使用OpenAI生成预算建议
 * @param {string} destination - 目的地
 * @param {number} totalBudget - 总预算
 * @returns {Promise<Array>} 生成的预算类别数组
 */
const generateBudget = async (destination, totalBudget) => {
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

请根据${destination}的消费水平，合理分配各项支出，确保总和接近总预算。`;

    // 调用OpenAI API
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 500,
      temperature: 0.7,
    });

    // 解析生成的内容
    const generatedContent = response.data.choices[0].text.trim();
    const budgetCategories = JSON.parse(generatedContent);

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