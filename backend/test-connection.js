const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/health',
  method: 'GET'
};

console.log('正在测试连接到 http://127.0.0.1:5000/health...');

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  
  res.on('data', (d) => {
    process.stdout.write(d);
    console.log('\n连接成功!');
  });
});

req.on('error', (e) => {
  console.error(`连接错误: ${e.message}`);
});

req.end();