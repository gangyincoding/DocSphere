import { Request, Response, NextFunction } from 'express';
import authService from '../../../services/authService';
import { User } from '../../../models/User';
import { sequelize } from '../../../config/database';
import {
  authenticate,
  optionalAuth,
  authorize,
  checkResourceOwnership,
  authenticateApiKey,
  createRateLimit
} from '../../../middleware/auth';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0 (Test)'),
      path: '/test'
    };

    mockRes = {
      locals: {},
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    let user: User;

    beforeAll(async () => {
      await sequelize.authenticate();
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    });

    afterAll(async () => {
      await sequelize.close();
    });

    it('应该验证有效的token', async () => {
      const token = user.generateAuthToken();
      mockReq.headers!.authorization = `Bearer ${token}`;

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe(user.id);
    });

    it('应该拒绝缺失的token', async () => {
      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: '访问令牌缺失'
        })
      );
    });

    it('应该拒绝无效的token格式', async () => {
      mockReq.headers!.authorization = 'InvalidToken';

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('应该拒绝无效的token', async () => {
      mockReq.headers!.authorization = 'Bearer invalid-token';

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('应该拒绝过期的token', async () => {
      const expiredToken = jwt.sign(
        { id: user.id, email: user.email, type: 'access' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' }
      );
      mockReq.headers!.authorization = `Bearer ${expiredToken}`;

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('optionalAuth', () => {
    let user: User;

    beforeAll(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    });

    afterAll(async () => {
      await User.destroy({ where: { id: user.id } });
    });

    it('应该在有token时验证', async () => {
      const token = user.generateAuthToken();
      mockReq.headers!.authorization = `Bearer ${token}`;

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
    });

    it('应该在没有token时继续执行', async () => {
      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('应该处理无效token格式时继续执行', async () => {
      mockReq.headers!.authorization = 'InvalidFormat';

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('应该处理无效token时继续执行', async () => {
      mockReq.headers!.authorization = 'Bearer invalid-token';

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });
  });

  describe('authorize', () => {
    it('应该在用户未认证时拒绝访问', async () => {
      const middleware = authorize(['admin']);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('应该在用户已认证时允许访问', async () => {
      const middleware = authorize(['admin']);
      mockReq.user = { id: 1, email: 'test@example.com' };

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('checkResourceOwnership', () => {
    it('应该在用户未认证时拒绝访问', async () => {
      const middleware = checkResourceOwnership();
      mockReq.params = { id: '1' };

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('应该在用户拥有资源时允许访问', async () => {
      const middleware = checkResourceOwnership();
      mockReq.user = { id: 1 };
      mockReq.params = { id: '1' };

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('应该在用户不拥有资源时拒绝访问', async () => {
      const middleware = checkResourceOwnership();
      mockReq.user = { id: 2 };
      mockReq.params = { id: '1' };

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('应该使用自定义参数名', async () => {
      const middleware = checkResourceOwnership('userId');
      mockReq.user = { id: 1 };
      mockReq.params = { userId: '1' };

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('authenticateApiKey', () => {
    const originalApiKey = process.env.INTERNAL_API_KEY;

    beforeAll(() => {
      process.env.INTERNAL_API_KEY = 'test-api-key';
    });

    afterAll(() => {
      if (originalApiKey) {
        process.env.INTERNAL_API_KEY = originalApiKey;
      } else {
        delete process.env.INTERNAL_API_KEY;
      }
    });

    it('应该验证有效的API密钥', async () => {
      mockReq.headers!['x-api-key'] = 'test-api-key';

      await authenticateApiKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).isInternalApi).toBe(true);
    });

    it('应该拒绝缺失的API密钥', async () => {
      await authenticateApiKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('应该拒绝无效的API密钥', async () => {
      mockReq.headers!['x-api-key'] = 'invalid-key';

      await authenticateApiKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('应该在API密钥未配置时返回错误', async () => {
      delete process.env.INTERNAL_API_KEY;

      await authenticateApiKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createRateLimit', () => {
    beforeEach(() => {
      // 清理之前的请求记录
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('应该在限制内允许请求', () => {
      const middleware = createRateLimit({
        windowMs: 60000,
        max: 10
      });

      // 发送5个请求
      for (let i = 0; i < 5; i++) {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(5);
    });

    it('应该在超过限制时拒绝请求', () => {
      const middleware = createRateLimit({
        windowMs: 60000,
        max: 2
      });

      // 发送3个请求（超过限制）
      middleware(mockReq as Request, mockRes as Response, mockNext);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    it('应该设置适当的响应头', () => {
      const middleware = createRateLimit({
        windowMs: 60000,
        max: 5,
        message: 'Custom rate limit message'
      });

      // 发送一个请求
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.set).toHaveBeenCalledWith({
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '4',
        'X-RateLimit-Reset': expect.any(String)
      });
    });

    it('应该使用自定义消息', () => {
      const middleware = createRateLimit({
        windowMs: 60000,
        max: 1,
        message: '自定义限制消息'
      });

      // 发送两个请求
      middleware(mockReq as Request, mockRes as Response, mockNext);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: '自定义限制消息'
        })
      );
    });

    it('应该基于IP地址限制请求', () => {
      const middleware = createRateLimit({
        windowMs: 60000,
        max: 1
      });

      const mockReq1 = { ...mockReq, ip: '192.168.1.1' };
      const mockReq2 = { ...mockReq, ip: '192.168.1.2' };

      // 两个不同IP的请求都应该通过
      middleware(mockReq1 as Request, mockRes as Response, mockNext);
      middleware(mockReq2 as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('应该在时间窗口重置后重置计数', () => {
      const middleware = createRateLimit({
        windowMs: 1000,
        max: 1
      });

      // 发送第一个请求
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // 发送第二个请求（应该被拒绝）
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // 快进时间超过窗口
      jest.advanceTimersByTime(1100);

      // 再次发送请求（应该通过）
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });
  });
});