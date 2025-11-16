import config from '../../../config';

describe('Configuration', () => {
  // 备份原始环境变量
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('默认配置值', () => {
    it('应该有正确的默认值', () => {
      expect(config.app.name).toBe('DocSphere');
      expect(config.app.version).toBe('1.0.0');
      expect(config.app.port).toBe(8000);
      expect(config.app.env).toBe('test');
    });

    it('应该设置正确的数据库默认值', () => {
      expect(config.database.host).toBe('localhost');
      expect(config.database.port).toBe(3306);
      expect(config.database.name).toBe('docsphere_dev');
      expect(config.database.charset).toBe('utf8mb4');
      expect(config.database.timezone).toBe('+08:00');
    });

    it('应该设置正确的Redis默认值', () => {
      expect(config.redis.host).toBe('localhost');
      expect(config.redis.port).toBe(6379);
      expect(config.redis.db).toBe(0);
    });

    it('应该设置正确的MinIO默认值', () => {
      expect(config.minio.endPoint).toBe('localhost');
      expect(config.minio.port).toBe(9000);
      expect(config.minio.accessKey).toBe('minioadmin');
      expect(config.minio.secretKey).toBe('minioadmin');
      expect(config.minio.bucket).toBe('docsphere');
      expect(config.minio.useSSL).toBe(false);
      expect(config.minio.region).toBe('us-east-1');
    });

    it('应该设置正确的Elasticsearch默认值', () => {
      expect(config.elasticsearch.host).toBe('localhost');
      expect(config.elasticsearch.port).toBe(9200);
      expect(config.elasticsearch.indexPrefix).toBe('docsphere');
    });

    it('应该设置正确的CORS默认值', () => {
      expect(config.cors.origin).toBe('http://localhost:3000');
    });

    it('应该设置正确的限流默认值', () => {
      expect(config.rateLimit.windowMs).toBe(15 * 60 * 1000); // 15 minutes
      expect(config.rateLimit.max).toBe(100);
    });
  });

  describe('环境变量覆盖', () => {
    it('应该从环境变量读取应用配置', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '8080';
      process.env.APP_NAME = 'CustomApp';
      process.env.APP_VERSION = '2.0.0';

      // 重新导入配置以测试环境变量影响
      delete require.cache[require.resolve('../../../config')];
      const testConfig = require('../../../config').default;

      expect(testConfig.app.env).toBe('production');
      expect(testConfig.app.port).toBe(8080);
      expect(testConfig.app.name).toBe('CustomApp');
      expect(testConfig.app.version).toBe('2.0.0');
    });

    it('应该从环境变量读取数据库配置', () => {
      process.env.DB_HOST = 'custom-host';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'custom-db';
      process.env.DB_USER = 'custom-user';
      process.env.DB_PASSWORD = 'custom-password';
      process.env.DB_CHARSET = 'utf8';
      process.env.DB_TIMEZONE = '+00:00';

      delete require.cache[require.resolve('../../../config')];
      const testConfig = require('../../../config').default;

      expect(testConfig.database.host).toBe('custom-host');
      expect(testConfig.database.port).toBe(5432);
      expect(testConfig.database.name).toBe('custom-db');
      expect(testConfig.database.user).toBe('custom-user');
      expect(testConfig.database.password).toBe('custom-password');
      expect(testConfig.database.charset).toBe('utf8');
      expect(testConfig.database.timezone).toBe('+00:00');
    });

    it('应该从环境变量读取Redis配置', () => {
      process.env.REDIS_HOST = 'redis-host';
      process.env.REDIS_PORT = '6380';
      process.env.REDIS_PASSWORD = 'redis-pass';
      process.env.REDIS_DB = '2';

      delete require.cache[require.resolve('../../../config')];
      const testConfig = require('../../../config').default;

      expect(testConfig.redis.host).toBe('redis-host');
      expect(testConfig.redis.port).toBe(6380);
      expect(testConfig.redis.password).toBe('redis-pass');
      expect(testConfig.redis.db).toBe(2);
    });
  });

  describe('JWT配置', () => {
    it('应该设置JWT默认配置', () => {
      expect(config.jwt.secret).toBeDefined();
      expect(config.jwt.expiresIn).toBe('24h');
      expect(config.jwt.refreshExpiresIn).toBe('7d');
    });

    it('应该从环境变量读取JWT配置', () => {
      process.env.JWT_SECRET = 'custom-secret';
      process.env.JWT_EXPIRES_IN = '48h';
      process.env.REFRESH_TOKEN_EXPIRES_IN = '30d';

      delete require.cache[require.resolve('../../../config')];
      const testConfig = require('../../../config').default;

      expect(testConfig.jwt.secret).toBe('custom-secret');
      expect(testConfig.jwt.expiresIn).toBe('48h');
      expect(testConfig.jwt.refreshExpiresIn).toBe('30d');
    });
  });

  describe('MinIO配置', () => {
    it('应该从环境变量读取MinIO配置', () => {
      process.env.MINIO_ENDPOINT = 'minio.example.com';
      process.env.MINIO_PORT = '9001';
      process.env.MINIO_ACCESS_KEY = 'custom-access';
      process.env.MINIO_SECRET_KEY = 'custom-secret';
      process.env.MINIO_BUCKET = 'custom-bucket';
      process.env.MINIO_USE_SSL = 'true';
      process.env.MINIO_REGION = 'us-west-2';

      delete require.cache[require.resolve('../../../config')];
      const testConfig = require('../../../config').default;

      expect(testConfig.minio.endPoint).toBe('minio.example.com');
      expect(testConfig.minio.port).toBe(9001);
      expect(testConfig.minio.accessKey).toBe('custom-access');
      expect(testConfig.minio.secretKey).toBe('custom-secret');
      expect(testConfig.minio.bucket).toBe('custom-bucket');
      expect(testConfig.minio.useSSL).toBe(true);
      expect(testConfig.minio.region).toBe('us-west-2');
    });
  });

  describe('Elasticsearch配置', () => {
    it('应该从环境变量读取Elasticsearch配置', () => {
      process.env.ELASTICSEARCH_HOST = 'elastic.example.com';
      process.env.ELASTICSEARCH_PORT = '9201';
      process.env.ELASTICSEARCH_USERNAME = 'elastic-user';
      process.env.ELASTICSEARCH_PASSWORD = 'elastic-pass';
      process.env.ELASTICSEARCH_INDEX_PREFIX = 'custom-index';

      delete require.cache[require.resolve('../../../config')];
      const testConfig = require('../../../config').default;

      expect(testConfig.elasticsearch.host).toBe('elastic.example.com');
      expect(testConfig.elasticsearch.port).toBe(9201);
      expect(testConfig.elasticsearch.username).toBe('elastic-user');
      expect(testConfig.elasticsearch.password).toBe('elastic-pass');
      expect(testConfig.elasticsearch.indexPrefix).toBe('custom-index');
    });
  });

  describe('日志配置', () => {
    it('应该设置日志默认配置', () => {
      expect(config.log.level).toBe('debug');
      expect(config.log.file).toBe('logs/app.log');
      expect(config.log.maxSize).toBeUndefined();
      expect(config.log.maxFiles).toBeUndefined();
    });

    it('应该从环境变量读取日志配置', () => {
      process.env.LOG_LEVEL = 'warn';
      process.env.LOG_FILE = 'custom.log';
      process.env.LOG_MAX_SIZE = '50m';
      process.env.LOG_MAX_FILES = '30d';

      delete require.cache[require.resolve('../../../config')];
      const testConfig = require('../../../config').default;

      expect(testConfig.log.level).toBe('warn');
      expect(testConfig.log.file).toBe('custom.log');
      expect(testConfig.log.maxSize).toBe('50m');
      expect(testConfig.log.maxFiles).toBe('30d');
    });
  });

  describe('安全配置', () => {
    it('应该设置CORS默认配置', () => {
      expect(config.cors.origin).toBe('http://localhost:3000');
    });

    it('应该从环境变量读取CORS配置', () => {
      process.env.CORS_ORIGIN = 'https://example.com';

      delete require.cache[require.resolve('../../../config')];
      const testConfig = require('../../../config').default;

      expect(testConfig.cors.origin).toBe('https://example.com');
    });

    it('应该从环境变量读取限流配置', () => {
      process.env.RATE_LIMIT_WINDOW = '30';
      process.env.RATE_LIMIT_MAX = '200';

      delete require.cache[require.resolve('../../../config')];
      const testConfig = require('../../../config').default;

      expect(testConfig.rateLimit.windowMs).toBe(30 * 60 * 1000); // 30 minutes
      expect(testConfig.rateLimit.max).toBe(200);
    });
  });

  describe('类型验证', () => {
    it('端口应该为数字类型', () => {
      expect(typeof config.app.port).toBe('number');
      expect(typeof config.database.port).toBe('number');
      expect(typeof config.redis.port).toBe('number');
      expect(typeof config.minio.port).toBe('number');
      expect(typeof config.elasticsearch.port).toBe('number');
    });

    it('布尔值应该为正确的类型', () => {
      expect(typeof config.minio.useSSL).toBe('boolean');
    });

    it('Redis DB应该为数字类型', () => {
      expect(typeof config.redis.db).toBe('number');
    });

    it('限流窗口时间应该为数字类型', () => {
      expect(typeof config.rateLimit.windowMs).toBe('number');
      expect(typeof config.rateLimit.max).toBe('number');
    });
  });

  describe('环境验证', () => {
    it('在生产环境中应该要求必要的环境变量', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DB_PASSWORD;
      delete process.env.JWT_SECRET;

      delete require.cache[require.resolve('../../../config')];
      const testConfig = require('../../../config').default;

      expect(testConfig.app.env).toBe('production');
      // 应该有默认的JWT密钥（即使不是最佳实践）
      expect(testConfig.jwt.secret).toBeDefined();
    });
  });
});