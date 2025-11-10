const http = require('http');

const PORT = 5001;

const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Server is running!' }));
    console.log('Health check received');
    return;
  }
  
  if (req.url === '/api/ai/travel-plan' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            destination: data.query || '未知目的地',
            message: 'AI旅行规划测试响应'
          }
        }));
        console.log('Travel plan request received:', data.query);
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
  console.log(`访问 http://localhost:${PORT}/health 进行健康检查`);
});