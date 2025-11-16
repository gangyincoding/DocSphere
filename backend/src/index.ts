import 'reflect-metadata';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

import App from './app';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    logger.info('🚀 正在启动 DocSphere 后端服务...');

    // 启动应用（暂时跳过数据库和Redis连接）
    const app = new App();
    app.listen();

    // 优雅关闭处理
    process.on('SIGTERM', async () => {
      logger.info('收到 SIGTERM 信号，正在优雅关闭...');
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('收到 SIGINT 信号，正在优雅关闭...');
      process.exit(0);
    });

  } catch (error) {
    logger.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  process.exit(1);
});

bootstrap();