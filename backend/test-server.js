const express = require('express');
const app = express();
const PORT = 5001;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.get('/health', (req, res) => {
  res.json({ message: 'Test server is running!' });
});

app.post('/api/ai/travel-plan', (req, res) => {
  res.json({
    success: true,
    data: {
      destination: req.body.query || '未知目的地',
      message: 'AI旅行规划测试响应'
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Listening on all interfaces');
  console.log('Health endpoint: http://localhost:5001/health');
  console.log('Travel plan endpoint: http://localhost:5001/api/ai/travel-plan');
});