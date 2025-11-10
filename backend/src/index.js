// 加载全局配置
const config = require('../../config/globalConfig');
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const itineraryRoutes = require('./routes/itineraryRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const healthRoutes = require('./routes/healthRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = config.api.port;

// 中间件
app.use(cors({
  origin: config.api.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 连接数据库
connectDB();

// 路由
app.use('/api/health', healthRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai', aiRoutes);

// 健康检查路由
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'AI Travel Planner API is running' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.env} mode`);
  console.log(`API base URL: ${config.api.baseUrl}`);
});

module.exports = app;