// Jest setup file
import 'reflect-metadata';
import { connectDatabase, disconnectDatabase } from './config/database';
import { getRedisClient, disconnectRedis } from './config/redis';

// 全局测试设置
beforeAll(async () => {
  console.log('🧪 正在设置测试环境...');

  // 连接测试数据库（如果需要）
  // await connectDatabase();

  // 连接Redis（如果需要）
  // await connectRedis();
});

afterAll(async () => {
  console.log('🧪 正在清理测试环境...');

  // 断开数据库连接
  // await disconnectDatabase();

  // 断开Redis连接
  // await disconnectRedis();
});

// 每个测试文件执行前的设置
beforeEach(() => {
  // 清理测试数据
  jest.clearAllMocks();
});

// 全局测试超时
jest.setTimeout(30000);