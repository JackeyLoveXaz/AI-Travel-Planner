// 专门测试JSON修复逻辑
const fs = require('fs');

console.log('\n====== JSON修复逻辑专项测试 ======\n');

// 模拟日志中的中括号8:7不匹配情况
const jsonWithBracketIssue = `[
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
      }
    ],
    "dailyBudget": 200
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
      }
    ],
    "dailyBudget": 150
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
      }
    ],
    "dailyBudget": 300
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
      }
    ],
    "dailyBudget": 250
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

// 提取并测试我们的修复逻辑
function testJsonFix() {
  console.log('原始JSON数据长度:', jsonWithBracketIssue.length);
  
  // 尝试直接解析（应该失败）
  try {
    JSON.parse(jsonWithBracketIssue);
    console.log('❌ 意外：原始JSON直接解析成功（这不是我们期望的结果）');
  } catch (e) {
    console.log('✅ 预期行为：原始JSON直接解析失败，错误信息:', e.message);
  }
  
  // 应用我们的修复逻辑
  console.log('\n应用修复逻辑...');
  
  // 1. 计算括号匹配情况
  const openBraces = (jsonWithBracketIssue.match(/\{/g) || []).length;
  const closeBraces = (jsonWithBracketIssue.match(/\}/g) || []).length;
  const openBrackets = (jsonWithBracketIssue.match(/\[/g) || []).length;
  const closeBrackets = (jsonWithBracketIssue.match(/\]/g) || []).length;
  
  console.log(`括号匹配情况: 大括号 ${openBraces}:${closeBraces}, 中括号 ${openBrackets}:${closeBrackets}`);
  
  let fixedContent = jsonWithBracketIssue;
  
  // 2. 修复常见的格式问题
  fixedContent = fixedContent
    .replace(/,\s*\}/g, '}') // 移除对象末尾多余的逗号
    .replace(/,\s*\]/g, ']') // 移除数组末尾多余的逗号
    .replace(/'/g, '"') // 替换单引号为双引号
    .replace(/\bNaN\b/g, '0') // 替换NaN为0
    .replace(/\bInfinity\b/g, '10000') // 替换Infinity为大数值
    .trim();
  
  // 3. 先处理中括号不匹配的情况
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
  
  // 4. 最后再次检查并修复中括号不匹配
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
  
  console.log('修复后的JSON长度:', fixedContent.length);
  const finalOpenBrackets2 = (fixedContent.match(/\[/g) || []).length;
  const finalCloseBrackets2 = (fixedContent.match(/\]/g) || []).length;
  console.log(`修复后的括号匹配情况: 中括号 ${finalOpenBrackets2}:${finalCloseBrackets2}`);
  
  // 尝试解析修复后的JSON
  try {
    const parsedJson = JSON.parse(fixedContent);
    console.log('✅ JSON修复并解析成功！获取到的天数:', parsedJson.length);
    
    // 验证解析结果
    console.log('\n解析结果验证:');
    console.log('行程天数:', parsedJson.length);
    parsedJson.forEach((day, index) => {
      console.log(`第${index + 1}天: day=${day.day}, 活动数=${day.activities.length}, 预算=${day.dailyBudget}元`);
    });
    
    console.log('\n====== JSON修复测试成功！中括号8:7问题已解决 ======\n');
    return true;
  } catch (e) {
    console.error('❌ JSON修复后仍然解析失败:', e.message);
    console.log('\n====== JSON修复测试失败 ======\n');
    return false;
  }
}

// 运行测试
testJsonFix();