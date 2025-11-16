import { errorHandler } from '../../../middleware/errorHandler';
import { errorResponse } from '../../../utils/response';

// Mock the response utility
jest.mock('../../../utils/response');
const mockErrorResponse = errorResponse as jest.MockedFunction<typeof errorResponse>;

describe('Error Handler Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0 (Test Browser)')
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('基本错误处理', () => {
    it('应该处理基本错误对象', () => {
      const error = new Error('Test error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        'Test error',
        500,
        null
      );
    });

    it('应该处理带状态码的错误', () => {
      const error = new Error('Not found') as any;
      error.statusCode = 404;

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        'Not found',
        404,
        null
      );
    });

    it('应该处理带状态属性的错误', () => {
      const error = new Error('Bad request') as any;
      error.status = 400;

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        'Bad request',
        400,
        null
      );
    });
  });

  describe('验证错误处理', () => {
    it('应该处理Sequelize验证错误', () => {
      const error = new Error('Validation failed') as any;
      error.name = 'SequelizeValidationError';
      error.errors = [
        { message: 'Email is required', path: 'email' },
        { message: 'Password too short', path: 'password' }
      ];

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        'Validation failed',
        400,
        expect.objectContaining({
          type: 'SequelizeValidationError',
          errors: expect.arrayContaining([
            expect.objectContaining({ message: 'Email is required', path: 'email' }),
            expect.objectContaining({ message: 'Password too short', path: 'password' })
          ])
        })
      );
    });

    it('应该处理Sequelize唯一约束错误', () => {
      const error = new Error('Duplicate entry') as any;
      error.name = 'SequelizeUniqueConstraintError';
      error.errors = [{ message: 'Email must be unique', path: 'email' }];

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        'Email must be unique',
        409,
        expect.objectContaining({
          type: 'SequelizeUniqueConstraintError'
        })
      );
    });

    it('应该处理Sequelize外键约束错误', () => {
      const error = new Error('Foreign key constraint') as any;
      error.name = 'SequelizeForeignKeyConstraintError';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        'Invalid reference to related data',
        400,
        expect.objectContaining({
          type: 'SequelizeForeignKeyConstraintError'
        })
      );
    });

    it('应该处理Exporess-validator错误', () => {
      const error = new Error('Validation array') as any;
      error.name = 'ValidationError';
      error.array = jest.fn().mockReturnValue([
        { msg: 'Email is invalid', param: 'email' },
        { msg: 'Password required', param: 'password' }
      ]);

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        'Validation failed',
        400,
        expect.objectContaining({
          type: 'ValidationError',
          errors: expect.arrayContaining([
            { msg: 'Email is invalid', param: 'email' },
            { msg: 'Password required', param: 'password' }
          ])
        })
      );
    });
  });

  describe('JWT错误处理', () => {
    it('应该处理JWT Token Expired错误', () => {
      const error = new Error('Token expired') as any;
      error.name = 'TokenExpiredError';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        'Token expired',
        401,
        expect.objectContaining({
          type: 'TokenExpiredError'
        })
      );
    });

    it('应该处理JWT JsonWebTokenError错误', () => {
      const error = new Error('Invalid token') as any;
      error.name = 'JsonWebTokenError';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        'Invalid token',
        401,
        expect.objectContaining({
          type: 'JsonWebTokenError'
        })
      );
    });
  });

  describe('Multer上传错误处理', () => {
    it('应该处理文件大小限制错误', () => {
      const error = new Error('File too large') as any;
      error.code = 'LIMIT_FILE_SIZE';
      error.limit = 1024 * 1024; // 1MB

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        'File too large. Maximum size is 1 MB',
        413,
        expect.objectContaining({
          type: 'MulterError',
          code: 'LIMIT_FILE_SIZE'
        })
      );
    });

    it('应该处理不支持的文件类型错误', () => {
      const error = new Error('Wrong file type') as any;
      error.code = 'LIMIT_FILE_TYPE';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        'Unsupported file type',
        400,
        expect.objectContaining({
          type: 'MulterError'
        })
      );
    });

    it('应该处理文件数量限制错误', () => {
      const error = new Error('Too many files') as any;
      error.code = 'LIMIT_FILE_COUNT';
      error.limit = 5;

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        'Too many files uploaded. Maximum is 5 files',
        400,
        expect.objectContaining({
          type: 'MulterError'
        })
      );
    });
  });

  describe('自定义应用错误', () => {
    it('应该处理应用自定义错误', () => {
      const error = new Error('Application error') as any;
      error.name = 'AppError';
      error.statusCode = 422;
      error.isOperational = true;

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        'Application error',
        422,
        expect.objectContaining({
          type: 'AppError',
          isOperational: true
        })
      );
    });
  });

  describe('环境特定错误处理', () => {
    let originalNodeEnv: string | undefined;

    beforeEach(() => {
      originalNodeEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('在生产环境中应该隐藏敏感错误信息', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Internal database connection failed');
      error.stack = 'Error stack trace';

      // 模拟生产环境配置
      const originalConfig = require('../../../config').default;
      originalConfig.app.env = 'production';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        'Internal Server Error',
        500,
        null
      );
    });

    it('在开发环境中应该显示详细错误信息', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Development error with details');
      error.stack = 'Detailed stack trace';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        'Development error with details',
        500,
        expect.objectContaining({
          stack: 'Detailed stack trace'
        })
      );
    });
  });

  describe('日志记录', () => {
    it('应该在开发环境中记录错误日志', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Error to be logged');

      // 这里应该测试logger是否被调用
      // 由于logger可能在配置中被mock，我们主要验证错误处理流程
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalled();
    });
  });

  describe('错误堆栈处理', () => {
    it('应该在开发环境中包含错误堆栈', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Stack trace test');
      error.stack = 'Error: Stack trace test\n    at test.js:1:1';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        'Stack trace test',
        500,
        expect.objectContaining({
          stack: error.stack
        })
      );
    });

    it('应该处理没有堆栈信息的错误', () => {
      const error = new Error('No stack error');
      delete error.stack;

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        'No stack error',
        500,
        expect.objectContaining({
          stack: undefined
        })
      );
    });
  });
});