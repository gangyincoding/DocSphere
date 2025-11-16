import { createClient } from 'redis';
import config from './index';
import { logger } from '../utils/logger';

let redisClient: ReturnType<typeof createClient>;

export const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      url: `redis://${config.redis.host}:${config.redis.port}`,
      password: config.redis.password,
      database: config.redis.db,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis 连接错误:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis 连接成功');
    });

    await redisClient.connect();
  } catch (error) {
    logger.error('Redis 连接失败:', error);
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis 连接已关闭');
    }
  } catch (error) {
    logger.error('关闭 Redis 连接失败:', error);
    throw error;
  }
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis 客户端未初始化');
  }
  return redisClient;
};

// Redis 工具函数
export const setCache = async (key: string, value: any, expireInSeconds?: number): Promise<void> => {
  const client = getRedisClient();
  const serializedValue = JSON.stringify(value);

  if (expireInSeconds) {
    await client.setEx(key, expireInSeconds, serializedValue);
  } else {
    await client.set(key, serializedValue);
  }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  const client = getRedisClient();
  const value = await client.get(key);
  return value ? JSON.parse(value) : null;
};

export const deleteCache = async (key: string): Promise<void> => {
  const client = getRedisClient();
  await client.del(key);
};

export const existsCache = async (key: string): Promise<boolean> => {
  const client = getRedisClient();
  const result = await client.exists(key);
  return result === 1;
};