import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import config from './config';
import { ApiResponse, AppError } from './types';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import routes from './routes';
import { logger } from './utils/logger';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // 安全中间件
    this.app.use(helmet());

    // CORS 配置
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // 压缩中间件
    this.app.use(compression());

    // 请求解析中间件
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 日志中间件
    if (config.app.env === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // 速率限制
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        success: false,
        code: 429,
        message: '请求过于频繁，请稍后再试',
        timestamp: new Date().toISOString(),
      },
    });
    this.app.use('/api/', limiter);

    // 信任代理
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // 健康检查
    this.app.get('/health', (req: Request, res: Response) => {
      const response: ApiResponse = {
        success: true,
        code: 200,
        message: 'Server is running',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: config.app.env,
          version: config.app.version,
        },
        timestamp: new Date().toISOString(),
      };
      res.status(200).json(response);
    });

    // API 路由
    this.app.use('/api/v1', routes);

    // 根路径
    this.app.get('/', (req: Request, res: Response) => {
      const response: ApiResponse = {
        success: true,
        code: 200,
        message: `Welcome to ${config.app.name} API`,
        data: {
          name: config.app.name,
          version: config.app.version,
          environment: config.app.env,
          documentation: '/api-docs',
          health: '/health',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(200).json(response);
    });
  }

  private initializeSwagger(): void {
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: config.app.name,
          version: config.app.version,
          description: `${config.app.name} API 文档`,
        },
        servers: [
          {
            url: `http://localhost:${config.app.port}/api/v1`,
            description: '开发环境',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
      apis: ['./src/routes/*.ts'],
    };

    const specs = swaggerJsdoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }

  private initializeErrorHandling(): void {
    // 404 处理
    this.app.use(notFoundHandler);

    // 全局错误处理
    this.app.use(errorHandler);
  }

  public listen(): void {
    this.app.listen(config.app.port, () => {
      logger.info(`
🚀 ${config.app.name} 服务器已启动
📍 端口: ${config.app.port}
🌍 环境: ${config.app.env}
📚 API 文档: http://localhost:${config.app.port}/api-docs
💚 健康检查: http://localhost:${config.app.port}/health
      `);
    });
  }
}

export default App;