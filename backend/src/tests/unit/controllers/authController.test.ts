import { Request, Response } from 'express';
import authController from '../../../controllers/authController';
import authService from '../../../services/authService';
import { ValidationError, NotFoundError, DatabaseError } from '../../../utils/errors';
import { successResponse, errorResponse } from '../../../utils/response';

// Mock依赖
jest.mock('../../../services/authService');
jest.mock('../../../utils/response');

describe('AuthController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Function;

  beforeEach(() => {
    mockReq = {
      body: {},
      headers: {},
      ip: '127.0.0.1'
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      locals: {}
    };

    mockNext = jest.fn();

    // Mock express-validator
    jest.mock('express-validator', () => ({
      validationResult: jest.fn(() => ({
        isEmpty: jest.fn(() => true),
        array: jest.fn(() => [])
      }))
    }));

    jest.clearAllMocks();
  });

  describe('register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    it('应该成功注册用户', async () => {
      const expectedResponse = {
        user: { id: 1, email: 'test@example.com', name: 'Test User' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600
      };

      (authService.register as jest.Mock).mockResolvedValue(expectedResponse);

      mockReq.body = validUserData;

      await authController.register(mockReq as Request, mockRes as Response, mockNext);

      expect(authService.register).toHaveBeenCalledWith(validUserData);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        expectedResponse,
        '注册成功',
        201
      );
    });

    it('应该处理验证错误', async () => {
      const validationErrors = [
        { msg: '邮箱格式无效', param: 'email' },
        { msg: '密码太短', param: 'password' }
      ];

      // Mock验证失败
      jest.doMock('express-validator', () => ({
        validationResult: jest.fn(() => ({
          isEmpty: jest.fn(() => false),
          array: jest.fn(() => validationErrors)
        }))
      }));

      mockReq.body = { email: 'invalid', password: '123' };

      await authController.register(mockReq as Request, mockRes as Response, mockNext);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        '输入验证失败: 邮箱格式无效, 密码太短',
        400
      );
    });

    it('应该处理邮箱已存在错误', async () => {
      (authService.register as jest.Mock).mockRejectedValue(
        new ValidationError('该邮箱已被注册')
      );

      mockReq.body = validUserData;

      await authController.register(mockReq as Request, mockRes as Response, mockNext);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        '该邮箱已被注册',
        400
      );
    });

    it('应该处理数据库错误', async () => {
      (authService.register as jest.Mock).mockRejectedValue(
        new DatabaseError('数据库连接失败')
      );

      mockReq.body = validUserData;

      await authController.register(mockReq as Request, mockRes as Response, mockNext);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        '数据库连接失败',
        500
      );
    });

    it('应该处理未知错误', async () => {
      (authService.register as jest.Mock).mockRejectedValue(
        new Error('未知错误')
      );

      mockReq.body = validUserData;

      await authController.register(mockReq as Request, mockRes as Response, mockNext);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        '注册失败，请稍后重试',
        500
      );
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('应该成功登录用户', async () => {
      const expectedResponse = {
        user: { id: 1, email: 'test@example.com', name: 'Test User' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600
      };

      (authService.login as jest.Mock).mockResolvedValue(expectedResponse);

      mockReq.body = validLoginData;

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(authService.login).toHaveBeenCalledWith(validLoginData);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        expectedResponse,
        '登录成功'
      );
    });

    it('应该处理验证错误', async () => {
      const validationErrors = [
        { msg: '邮箱格式无效', param: 'email' }
      ];

      jest.doMock('express-validator', () => ({
        validationResult: jest.fn(() => ({
          isEmpty: jest.fn(() => false),
          array: jest.fn(() => validationErrors)
        }))
      }));

      mockReq.body = { email: 'invalid', password: 'password123' };

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        '输入验证失败: 邮箱格式无效',
        400
      );
    });

    it('应该处理认证失败', async () => {
      (authService.login as jest.Mock).mockRejectedValue(
        new ValidationError('邮箱或密码错误')
      );

      mockReq.body = validLoginData;

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        '邮箱或密码错误',
        401
      );
    });
  });

  describe('refreshToken', () => {
    const validRefreshData = {
      refreshToken: 'valid-refresh-token'
    };

    it('应该成功刷新token', async () => {
      const expectedResponse = {
        accessToken: 'new-access-token',
        expiresIn: 3600
      };

      (authService.refreshToken as jest.Mock).mockResolvedValue(expectedResponse);

      mockReq.body = validRefreshData;

      await authController.refreshToken(mockReq as Request, mockRes as Response, mockNext);

      expect(authService.refreshToken).toHaveBeenCalledWith(validRefreshData.refreshToken);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        expectedResponse,
        'Token刷新成功'
      );
    });

    it('应该处理无效的刷新token', async () => {
      (authService.refreshToken as jest.Mock).mockRejectedValue(
        new ValidationError('刷新令牌已过期或无效')
      );

      mockReq.body = validRefreshData;

      await authController.refreshToken(mockReq as Request, mockRes as Response, mockNext);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        '刷新令牌已过期或无效',
        401
      );
    });
  });

  describe('getCurrentUser', () => {
    it('应该成功获取当前用户信息', async () => {
      const expectedUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      };

      (authService.getUserById as jest.Mock).mockResolvedValue(expectedUser);

      mockReq.user = { id: 1 };

      await authController.getCurrentUser(mockReq as Request, mockRes as Response, mockNext);

      expect(authService.getUserById).toHaveBeenCalledWith(1);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        { user: expectedUser },
        '获取用户信息成功'
      );
    });

    it('应该处理用户认证信息缺失', async () => {
      await authController.getCurrentUser(mockReq as Request, mockRes as Response, mockNext);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        '用户认证信息缺失',
        401
      );
    });

    it('应该处理用户不存在', async () => {
      (authService.getUserById as jest.Mock).mockRejectedValue(
        new NotFoundError('用户不存在')
      );

      mockReq.user = { id: 999 };

      await authController.getCurrentUser(mockReq as Request, mockRes as Response, mockNext);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        '用户不存在',
        404
      );
    });
  });

  describe('updateProfile', () => {
    const validUpdateData = {
      name: 'Updated Name',
      phone: '+1234567890'
    };

    it('应该成功更新用户信息', async () => {
      const expectedUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Updated Name',
        phone: '+1234567890'
      };

      (authService.updateUser as jest.Mock).mockResolvedValue(expectedUser);

      mockReq.user = { id: 1 };
      mockReq.body = validUpdateData;

      await authController.updateProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(authService.updateUser).toHaveBeenCalledWith(1, validUpdateData);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        { user: expectedUser },
        '用户信息更新成功'
      );
    });

    it('应该处理用户认证信息缺失', async () => {
      await authController.updateProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        '用户认证信息缺失',
        401
      );
    });

    it('应该处理邮箱已存在错误', async () => {
      (authService.updateUser as jest.Mock).mockRejectedValue(
        new ValidationError('该邮箱已被使用')
      );

      mockReq.user = { id: 1 };
      mockReq.body = validUpdateData;

      await authController.updateProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        '该邮箱已被使用',
        400
      );
    });
  });

  describe('changePassword', () => {
    const validPasswordData = {
      currentPassword: 'oldpassword123',
      newPassword: 'newpassword123'
    };

    it('应该成功修改密码', async () => {
      (authService.changePassword as jest.Mock).mockResolvedValue(undefined);

      mockReq.user = { id: 1 };
      mockReq.body = validPasswordData;

      await authController.changePassword(mockReq as Request, mockRes as Response, mockNext);

      expect(authService.changePassword).toHaveBeenCalledWith(
        1,
        validPasswordData.currentPassword,
        validPasswordData.newPassword
      );
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        '密码修改成功'
      );
    });

    it('应该处理原密码错误', async () => {
      (authService.changePassword as jest.Mock).mockRejectedValue(
        new ValidationError('原密码错误')
      );

      mockReq.user = { id: 1 };
      mockReq.body = validPasswordData;

      await authController.changePassword(mockReq as Request, mockRes as Response, mockNext);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        '原密码错误',
        400
      );
    });

    it('应该处理新密码强度不足', async () => {
      (authService.changePassword as jest.Mock).mockRejectedValue(
        new ValidationError('新密码必须包含字母和数字，且长度至少6位')
      );

      mockReq.user = { id: 1 };
      mockReq.body = validPasswordData;

      await authController.changePassword(mockReq as Request, mockRes as Response, mockNext);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        '新密码必须包含字母和数字，且长度至少6位',
        400
      );
    });
  });

  describe('logout', () => {
    it('应该成功登出', async () => {
      await authController.logout(mockReq as Request, mockRes as Response, mockNext);

      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        '登出成功'
      );
    });
  });

  describe('verifyToken', () => {
    const validTokenData = {
      token: 'valid-token'
    };

    it('应该成功验证token', async () => {
      const expectedUser = {
        id: 1,
        email: 'test@example.com'
      };

      (authService.validateToken as jest.Mock).mockResolvedValue(expectedUser);

      mockReq.body = validTokenData;

      await authController.verifyToken(mockReq as Request, mockRes as Response, mockNext);

      expect(authService.validateToken).toHaveBeenCalledWith(validTokenData.token);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        { valid: true, user: expectedUser },
        'Token验证成功'
      );
    });

    it('应该处理无效token', async () => {
      (authService.validateToken as jest.Mock).mockRejectedValue(
        new ValidationError('Token无效或已过期')
      );

      mockReq.body = validTokenData;

      await authController.verifyToken(mockReq as Request, mockRes as Response, mockNext);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        'Token无效或已过期',
        401
      );
    });
  });
});