const http = require('http');

const postData = JSON.stringify({
  query: '北京三日游'
});

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/ai/travel-plan',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('正在测试旅行计划API...');

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应内容:', JSON.parse(data));
    console.log('API测试成功!');
  });
});

req.on('error', (e) => {
  console.error(`连接错误: ${e.message}`);
});

req.write(postData);
req.end();