import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8000;

// 基础中间件
app.use(cors());
app.use(express.json());

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: 'DocSphere Backend API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/v1/test', (req, res) => {
  res.json({
    message: 'API 测试成功！',
    data: {
      version: '1.0.0',
      name: 'DocSphere Backend'
    }
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
🚀 DocSphere Backend 服务器启动成功！
📍 地址: http://localhost:${PORT}
📊 健康检查: http://localhost:${PORT}/health
🧪 API测试: http://localhost:${PORT}/api/v1/test
  `);
});