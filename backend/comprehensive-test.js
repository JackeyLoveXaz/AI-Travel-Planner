// 综合测试中括号不匹配修复逻辑
const fs = require('fs');
const path = require('path');

// 导入我们修改后的生成器函数
const generateItinerary = require('./src/services/itineraryGenerator');

// 模拟通义千问API返回的有问题的JSON（中括号8:7不匹配）
const mockApiResponseWithBracketIssue = `[
  {
    "day": 1,
    "activities": [
      {
        "time": "09:00",
        "activity": "参观故宫博物院",
        "description": "探索中国古代皇宫的历史与文化。",
        "location": "北京市东城区景山前街4号",
        "duration": "3小时",
        "cost": 60
      },
      {
        "time": "12:30",
        "activity": "品尝北京烤鸭",
        "description": "享用正宗的北京烤鸭。",
        "location": "全聚德王府井店",
        "duration": "1.5小时",
        "cost": 200
      }
    ],
    "dailyBudget": 260
  },
  {
    "day": 2,
    "activities": [
      {
        "time": "10:00",
        "activity": "游览颐和园",
        "description": "欣赏中国古典园林艺术。",
        "location": "北京市海淀区新建宫门路19号",
        "duration": "4小时",
        "cost": 30
      },
      {
        "time": "15:00",
        "activity": "参观清华北大",
        "description": "游览中国顶尖学府。",
        "location": "北京市海淀区",
        "duration": "2小时",
        "cost": 0
      }
    ],
    "dailyBudget": 230
  },
  {
    "day": 3,
    "activities": [
      {
        "time": "09:00",
        "activity": "参观长城",
        "description": "体验世界八大奇迹之一。",
        "location": "北京市延庆区八达岭镇",
        "duration": "5小时",
        "cost": 100
      },
      {
        "time": "16:00",
        "activity": "品尝长城脚下农家菜",
        "description": "享用当地特色农家菜。",
        "location": "长城脚下",
        "duration": "1.5小时",
        "cost": 150
      }
    ],
    "dailyBudget": 350
  },
  {
    "day": 4,
    "activities": [
      {
        "time": "09:00",
        "activity": "游览天坛",
        "description": "参观明清两代皇帝祭天的场所。",
        "location": "北京市东城区天坛内东里7号",
        "duration": "3小时",
        "cost": 34
      },
      {
        "time": "13:00",
        "activity": "王府井购物",
        "description": "在王府井商业街购物。",
        "location": "北京市东城区王府井大街",
        "duration": "3小时",
        "cost": 200
      }
    ],
    "dailyBudget": 300
  },
  {
    "day": 5,
    "activities": [
      {
        "time": "10:00",
        "activity": "参观国家博物馆",
        "description": "了解中国历史文化。",
        "location": "北京市东城区东长安街16号",
        "duration": "4小时",
        "cost": 0
      },
      {
        "time": "15:00",
        "activity": "天安门广场",
        "description": "参观中国标志性建筑。",
        "location": "北京市东城区",
        "duration": "2小时",
        "cost": 0
      }
    ],
    "dailyBudget": 200
  },
  {
    "day": 6,
    "activities": [
      {
        "time": "09:00",
        "activity": "游览什刹海",
        "description": "体验老北京胡同文化。",
        "location": "北京市西城区什刹海",
        "duration": "4小时",
        "cost": 0
      },
      {
        "time": "14:00",
        "activity": "南锣鼓巷",
        "description": "游览北京著名胡同。",
        "location": "北京市东城区南锣鼓巷",
        "duration": "3小时",
        "cost": 0
      }
    ],
    "dailyBudget": 180
  },
  {
    "day": 7,
    "activities": [
      {
        "time": "11:00",
        "activity": "告别晚宴",
        "description": "为这次旅行画上圆满句号。",
        "location": "北京市朝阳区三里屯",
        "duration": "2小时",
        "cost": 300
      }
    ],
    "dailyBudget": 300
  }
`; // 故意缺少最后的闭合中括号，形成8:7的中括号不匹配

console.log('\n====== 综合测试开始 ======\n');

// 模拟axios请求，直接返回我们的测试数据
const axios = require('axios');
const originalAxiosPost = axios.post;

// 模拟axios.post方法，返回我们的测试数据
axios.post = async function(url, data, config) {
  console.log('模拟API调用，返回测试数据...');
  return {
    data: {
      output: {
        text: mockApiResponseWithBracketIssue
      }
    }
  };
};

// 测试行程生成
async function testItineraryGeneration() {
  try {
    console.log('开始测试行程生成...');
    console.log('测试参数：北京，2024-11-10至2024-11-16，1名游客，10000元预算');
    
    const preferences = {
      travelers: 1,
      budget: 10000,
      preferences: ['吃美食', '参观著名景点']
    };
    
    // 使用模拟的API key调用生成器
    const result = await generateItinerary(
      '北京',
      '2024-11-10',
      '2024-11-16',
      preferences,
      'test-api-key'
    );
    
    console.log('\n测试结果：');
    console.log('生成的行程天数:', result.length);
    
    // 验证每个天数对象的结构
    for (const day of result) {
      console.log(`\n第${day.day}天:`);
      console.log(`  活动数量: ${day.activities.length}`);
      console.log(`  日预算: ${day.dailyBudget}元`);
      
      // 显示部分活动详情
      day.activities.slice(0, 2).forEach((activity, index) => {
        console.log(`  活动${index + 1}: ${activity.activity} (${activity.time}) - ${activity.cost}元`);
      });
    }
    
    console.log('\n====== 测试成功！中括号不匹配修复逻辑正常工作 ======\n');
    return true;
  } catch (error) {
    console.error('\n测试失败:', error);
    console.log('\n====== 测试失败 ======\n');
    return false;
  } finally {
    // 恢复原始的axios.post方法
    axios.post = originalAxiosPost;
  }
}

// 运行测试
testItineraryGeneration();