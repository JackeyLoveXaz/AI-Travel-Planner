/**
 * 模拟数据服务
 * 提供本地模拟数据，当后端API不可用时作为备选
 */

// 生成随机日期
const generateRandomDate = (daysFromNow = 0, addDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow + addDays);
  return date.toISOString().split('T')[0];
};

// 解析用户输入中的关键信息的辅助函数
const extractInfoFromQuery = (query) => {
  const lowerQuery = query.toLowerCase();
  const result = {
    destination: '',
    days: 3,
    budget: 5000,
    travelers: 2,
    preferences: []
  };
  
  // 提取目的地的简单逻辑
  const locationPatterns = [
    /去(?:哪里|哪个国家|哪个城市|什么地方|哪里玩)[:：]?\s*(.+?)(?=，|。|\s|天|预算|人|喜欢)/,
    /想去(.+?)(?=，|。|\s|天|预算|人|喜欢)/
  ];
  
  for (const pattern of locationPatterns) {
    const match = lowerQuery.match(pattern);
    if (match) {
      result.destination = match[1].trim();
      break;
    }
  }
  
  // 默认目的地
  if (!result.destination) {
    result.destination = '北京';
  }
  
  // 提取天数
  const daysMatch = lowerQuery.match(/(\d+)\s*天/);
  if (daysMatch) {
    result.days = parseInt(daysMatch[1]) || 3;
  }
  
  // 提取预算（增强版，支持更多格式）
  let budgetMatch = lowerQuery.match(/预算[:：]?\s*(\d+(\.\d+)?)[万千]?元?/);
  if (!budgetMatch) {
    // 尝试匹配 "一万块" 这种格式
    budgetMatch = lowerQuery.match(/(\d+)[万千]块?/);
    if (budgetMatch) {
      const num = parseInt(budgetMatch[1]);
      const isWan = budgetMatch[0].includes('万');
      result.budget = isWan ? num * 10000 : num;
    }
  } else {
    result.budget = parseInt(budgetMatch[1]) || 5000;
    // 处理'万'和'千'单位
    if (budgetMatch[0].includes('万')) {
      result.budget *= 10000;
    } else if (budgetMatch[0].includes('千')) {
      result.budget *= 1000;
    }
  }
  
  // 提取人数
  const peopleMatch = lowerQuery.match(/(\d+)\s*[个人]/);
  if (peopleMatch) {
    result.travelers = parseInt(peopleMatch[1]) || 2;
  }
  
  // 提取偏好
  if (lowerQuery.includes('美食') || lowerQuery.includes('吃')) result.preferences.push('美食');
  if (lowerQuery.includes('动漫') || lowerQuery.includes('漫画')) result.preferences.push('动漫');
  if (lowerQuery.includes('孩子') || lowerQuery.includes('家庭') || lowerQuery.includes('亲子')) result.preferences.push('亲子');
  if (lowerQuery.includes('购物')) result.preferences.push('购物');
  if (lowerQuery.includes('风景') || lowerQuery.includes('自然')) result.preferences.push('自然风光');
  if (lowerQuery.includes('历史') || lowerQuery.includes('文化')) result.preferences.push('历史文化');
  
  // 默认偏好
  if (result.preferences.length === 0) {
    result.preferences = ['美食', '历史文化'];
  }
  
  return result;
};

// 根据偏好获取推荐活动
const getActivitiesByPreferences = (preferences, destination) => {
  const activityMap = {
    '美食': [
      { name: '当地特色美食之旅', description: '品尝当地著名餐厅和小吃' },
      { name: '美食街探索', description: '逛遍当地最热闹的美食街区' }
    ],
    '历史文化': [
      { name: '博物馆参观', description: '了解当地历史文化背景' },
      { name: '古迹游览', description: '参观著名历史建筑和遗迹' },
      { name: '文化体验活动', description: '参与传统手工艺制作' }
    ],
    '自然风光': [
      { name: '自然公园游览', description: '欣赏美丽的自然景观' },
      { name: '徒步旅行', description: '探索周边自然环境' }
    ],
    '购物': [
      { name: '购物中心', description: '前往当地大型购物场所' },
      { name: '特色市场', description: '购买当地特色商品和纪念品' }
    ],
    '亲子': [
      { name: '主题公园', description: '适合全家人的娱乐场所' },
      { name: '动物园/水族馆', description: '观赏各种动物，增长见识' }
    ],
    '动漫': [
      { name: '动漫周边店', description: '购买喜欢的动漫周边产品' },
      { name: '动漫展览', description: '参观当地的动漫展览' }
    ]
  };
  
  const activities = [];
  preferences.forEach(pref => {
    if (activityMap[pref]) {
      activities.push(...activityMap[pref]);
    }
  });
  
  // 确保有活动
  if (activities.length === 0) {
    activities.push(...activityMap['历史文化']);
  }
  
  return activities;
};

// 生成模拟的行程数据
export const generateMockItinerary = (userQuery) => {
  const info = extractInfoFromQuery(userQuery);
  // 生成合理的开始日期（从明天开始）
  const startDate = generateRandomDate(1); 
  // 根据输入的天数正确计算结束日期
  const endDate = generateRandomDate(1, info.days - 1);
  const activities = getActivitiesByPreferences(info.preferences, info.destination);
  
  // 生成每日计划
  const dailyPlans = [];
  for (let day = 1; day <= info.days; day++) {
    const dayActivities = [];
    const dayDate = generateRandomDate(7, day - 1);
    
    // 每天2-3个活动
    const activitiesPerDay = Math.min(3, Math.max(1, Math.floor(activities.length / info.days))) || 2;
    for (let i = 0; i < activitiesPerDay; i++) {
      const timeSlots = ['09:00', '11:30', '14:00', '16:30', '19:00'];
      const activityIndex = (day - 1) * activitiesPerDay + i;
      // 添加防御性检查，确保activity存在
      const activity = activities.length > 0 ? activities[activityIndex % activities.length] : 
        { name: '自由活动', description: '根据个人喜好安排' };
      
      dayActivities.push({
        time: timeSlots[i % timeSlots.length],
        activity: activity?.name || '自由活动',
        location: `${info.destination} ${activity?.name || '自由活动'}附近`,
        cost: Math.floor(Math.random() * 200) + 50,
        notes: activity?.description || '享受轻松的自由时间'
      });
    }
    
    dailyPlans.push({
      day,
      date: dayDate,
      activities: dayActivities,
      accommodation: `${info.destination}市中心酒店`,
      transportation: '地铁+出租车'
    });
  }
  
  // 生成预算分类明细
  const generateBudgetBreakdown = (totalBudget) => {
    // 根据不同预算级别调整分配比例
    const isHighBudget = totalBudget > 10000;
    const isMediumBudget = totalBudget > 5000 && totalBudget <= 10000;
    
    // 基础分配比例
    let percentages = {
      transportation: 30,
      accommodation: 30,
      food: 20,
      activities: 10,
      shopping: 5,
      others: 5
    };
    
    // 根据预算级别调整
    if (isHighBudget) {
      percentages = {
        transportation: 25,
        accommodation: 35,
        food: 20,
        activities: 10,
        shopping: 5,
        others: 5
      };
    } else if (isMediumBudget) {
      percentages = {
        transportation: 30,
        accommodation: 30,
        food: 20,
        activities: 10,
        shopping: 5,
        others: 5
      };
    }
    
    // 计算各分类金额
    const budgetBreakdown = {
      transportation: {
        amount: Math.round(totalBudget * percentages.transportation / 100),
        percentage: percentages.transportation,
        details: '包括往返交通和当地交通费用'
      },
      accommodation: {
        amount: Math.round(totalBudget * percentages.accommodation / 100),
        percentage: percentages.accommodation,
        details: `包括${info.days}晚住宿费用`
      },
      food: {
        amount: Math.round(totalBudget * percentages.food / 100),
        percentage: percentages.food,
        details: `包括${info.days}天餐饮费用`
      },
      activities: {
        amount: Math.round(totalBudget * percentages.activities / 100),
        percentage: percentages.activities,
        details: '包括景点门票和体验活动费用'
      },
      shopping: {
        amount: Math.round(totalBudget * percentages.shopping / 100),
        percentage: percentages.shopping,
        details: '包括纪念品和购物费用'
      },
      others: {
        amount: Math.round(totalBudget * percentages.others / 100),
        percentage: percentages.others,
        details: '包括保险、小费等其他费用'
      }
    };
    
    return budgetBreakdown;
  };
  
  const budgetBreakdown = generateBudgetBreakdown(info.budget);
  
  return {
    success: true,
    data: {
      destination: info.destination,
      startDate,
      endDate,
      travelers: info.travelers,
      budget: info.budget,
      preferences: info.preferences,
      budgetBreakdown,
      itinerary: {
        overview: `在${info.days}天内游览${info.destination}，主要体验${info.preferences.join('、')}等活动`,
        dailyPlans,
        recommendations: {
          restaurants: [`${info.destination}特色餐厅A`, `${info.destination}特色餐厅B`],
          attractions: [`${info.destination}著名景点A`, `${info.destination}著名景点B`],
          tips: ['建议提前预订热门景点门票', '注意当地天气变化', '准备舒适的行走鞋']
        }
      }
    }
  };
};

export default {
  generateMockItinerary
};