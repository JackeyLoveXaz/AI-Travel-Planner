// 测试API调用，验证中括号不匹配修复逻辑
const axios = require('axios');

console.log('\n====== 测试行程生成API ======\n');

// 模拟用户请求数据
const requestData = {
  travelText: '我想去北京，时间为一周，预算大概有一万块，主要是想吃美食和参观著名景点。',
  apiKey: 'test-api-key' // 使用测试API key
};

// 发送请求到行程生成API
async function testTravelPlanApi() {
  try {
    console.log('发送行程生成请求...');
    console.log('请求数据:', JSON.stringify(requestData, null, 2));
    
    const response = await axios.post(
      'http://localhost:5000/api/ai/travel-plan',
      requestData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30秒超时
      }
    );
    
    console.log('\n✅ 请求成功！');
    console.log('响应状态码:', response.status);
    console.log('响应数据预览:', {
      destination: response.data.destination,
      startDate: response.data.startDate,
      endDate: response.data.endDate,
      travelers: response.data.travelers,
      budget: response.data.budget,
      preferences: response.data.preferences,
      days: response.data.days ? response.data.days.length : 0
    });
    
    if (response.data.days && response.data.days.length > 0) {
      console.log('\n行程天数:', response.data.days.length);
      response.data.days.forEach((day, index) => {
        console.log(`第${index + 1}天: 活动数=${day.activities ? day.activities.length : 0}, 预算=${day.dailyBudget}元`);
      });
    }
    
    console.log('\n====== API测试成功 ======\n');
    
  } catch (error) {
    console.error('\n❌ 请求失败:', error.message);
    
    if (error.response) {
      // 服务器返回了错误响应
      console.error('错误状态码:', error.response.status);
      console.error('错误数据:', error.response.data);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('未收到响应，请检查服务器是否运行');
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message);
    }
    
    console.log('\n====== API测试失败 ======\n');
  }
}

// 直接测试行程创建API（不依赖通义千问）
async function testItineraryCreation() {
  try {
    console.log('\n发送行程创建请求...');
    
    const itineraryData = {
      destination: "北京",
      startDate: "2024-11-10",
      endDate: "2024-11-16",
      travelers: 2,
      budget: 10000,
      preferences: ["美食", "景点"]
    };
    
    const response = await axios.post(
      'http://localhost:5000/api/itineraries',
      itineraryData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    
    console.log('\n✅ 行程创建成功！');
    console.log('响应数据:', response.data);
    
  } catch (error) {
    console.error('\n❌ 行程创建失败:', error.message);
    if (error.response) {
      console.error('错误数据:', error.response.data);
    }
  }
}

// 运行测试
async function runTests() {
  // 首先测试AI行程生成（可能因为API key问题而使用默认行程，但可以测试修复逻辑）
  await testTravelPlanApi();
  
  // 然后测试直接行程创建
  await testItineraryCreation();
}

runTests();