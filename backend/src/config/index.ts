import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

interface Config {
  app: {
    env: string;
    port: number;
    name: string;
    version: string;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    charset: string;
    timezone: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  minio: {
    endPoint: string;
    port: number;
    accessKey: string;
    secretKey: string;
    bucket: string;
    useSSL: boolean;
    region: string;
  };
  elasticsearch: {
    host: string;
    port: number;
    username?: string;
    password?: string;
    indexPrefix: string;
  };
  cors: {
    origin: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  log: {
    level: string;
    file?: string;
    maxSize?: string;
    maxFiles?: string;
  };
}

const config: Config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '8000', 10),
    name: process.env.APP_NAME || 'DocSphere',
    version: process.env.APP_VERSION || '1.0.0',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'docsphere_dev',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: process.env.DB_CHARSET || 'utf8mb4',
    timezone: process.env.DB_TIMEZONE || '+08:00',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || 'docsphere',
    useSSL: process.env.MINIO_USE_SSL === 'true',
    region: process.env.MINIO_REGION || 'us-east-1',
  },
  elasticsearch: {
    host: process.env.ELASTICSEARCH_HOST || 'localhost',
    port: parseInt(process.env.ELASTICSEARCH_PORT || '9200', 10),
    username: process.env.ELASTICSEARCH_USERNAME || undefined,
    password: process.env.ELASTICSEARCH_PASSWORD || undefined,
    indexPrefix: process.env.ELASTICSEARCH_INDEX_PREFIX || 'docsphere',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  rateLimit: {
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10) * 60 * 1000), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  log: {
    level: process.env.LOG_LEVEL || 'debug',
    file: process.env.LOG_FILE,
    maxSize: process.env.LOG_MAX_SIZE,
    maxFiles: process.env.LOG_MAX_FILES,
  },
};

// 便捷属性
export const isDev = config.app.env === 'development';
export const isProd = config.app.env === 'production';
export const port = config.app.port;
export const nodeEnv = config.app.env;

export default config;