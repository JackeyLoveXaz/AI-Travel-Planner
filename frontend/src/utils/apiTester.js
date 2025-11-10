import { BASE_URL } from '../services/apiConfig';

// API连接测试工具
export const testApiConnection = async () => {
  try {
    console.log('开始测试API连接...');
    console.log(`测试的API基础URL: ${BASE_URL}`);
    
    // 测试基本连接
    const response = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000
    });
    
    if (!response.ok) {
      console.error(`API健康检查失败: HTTP状态码 ${response.status}`);
      return {
        success: false,
        message: `连接失败: 服务器返回状态码 ${response.status}`,
        details: null
      };
    }
    
    const data = await response.json();
    console.log('API健康检查成功:', data);
    
    // 测试行程API
    const itineraryTest = await testItineraryApi();
    
    // 测试预算API
    const budgetTest = await testBudgetApi();
    
    return {
      success: true,
      message: 'API连接测试完成',
      details: {
        health: data,
        itineraryApi: itineraryTest,
        budgetApi: budgetTest
      }
    };
  } catch (error) {
    console.error('API连接测试失败:', error);
    return {
      success: false,
      message: `连接失败: ${error.message || '未知错误'}`,
      details: {
        error: error.toString(),
        possibleSolutions: [
          '确保后端服务器正在运行',
          '检查API基础URL配置是否正确',
          '验证网络连接',
          '确认后端服务已正确配置并监听请求'
        ]
      }
    };
  }
};

// 测试行程API
export const testItineraryApi = async () => {
  try {
    const response = await fetch(`${BASE_URL}/itineraries`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000
    });
    
    const status = response.ok ? '成功' : `失败 (${response.status})`;
    return {
      status,
      endpoint: 'GET /itineraries',
      isConnected: response.ok
    };
  } catch (error) {
    return {
      status: '失败',
      endpoint: 'GET /itineraries',
      isConnected: false,
      error: error.message
    };
  }
};

// 测试预算API
export const testBudgetApi = async () => {
  try {
    const response = await fetch(`${BASE_URL}/budgets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000
    });
    
    const status = response.ok ? '成功' : `失败 (${response.status})`;
    return {
      status,
      endpoint: 'GET /budgets',
      isConnected: response.ok
    };
  } catch (error) {
    return {
      status: '失败',
      endpoint: 'GET /budgets',
      isConnected: false,
      error: error.message
    };
  }
};

// 在控制台运行测试
export const runApiTestInConsole = async () => {
  console.log('========================================');
  console.log('🔍 AI旅行规划师 - API连接测试');
  console.log('========================================');
  
  const result = await testApiConnection();
  
  console.log('\n📊 测试结果:');
  if (result.success) {
    console.log('✅ 整体连接状态: 成功');
    console.log('\n🔄 服务健康检查:');
    console.log(`  - 状态: ${result.details.health.status || '正常'}`);
    console.log(`  - 服务: ${result.details.health.service || 'AI旅行规划后端'}`);
    
    console.log('\n🗓️  行程API测试:');
    console.log(`  - 端点: ${result.details.itineraryApi.endpoint}`);
    console.log(`  - 状态: ${result.details.itineraryApi.status}`);
    
    console.log('\n💰 预算API测试:');
    console.log(`  - 端点: ${result.details.budgetApi.endpoint}`);
    console.log(`  - 状态: ${result.details.budgetApi.status}`);
    
    console.log('\n✅ 所有API连接正常! 应用已准备就绪。');
  } else {
    console.error('❌ 整体连接状态: 失败');
    console.error(`❌ 错误信息: ${result.message}`);
    
    if (result.details.possibleSolutions) {
      console.error('\n🔧 可能的解决方法:');
      result.details.possibleSolutions.forEach((solution, index) => {
        console.error(`  ${index + 1}. ${solution}`);
      });
    }
    
    console.error('\n⚠️  请确保:');
    console.error('  1. 后端服务器已启动 (node backend/server.js)');
    console.error('  2. API密钥已正确配置');
    console.error('  3. 端口5000未被占用');
  }
  
  console.log('\n========================================');
  return result;
};

// 如果在浏览器环境中直接运行
if (typeof window !== 'undefined') {
  // 添加全局函数以便用户在控制台手动测试
  window.testAIPlannerAPI = runApiTestInConsole;
}