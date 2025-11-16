import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { successResponse, errorResponse, asyncHandler } from '../utils/response';
import { validationResult } from 'express-validator';

/**
 * 认证控制器
 */
export class AuthController {
  /**
   * 用户注册
   */
  public register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      errorResponse(res, `输入验证失败: ${errorMessages.join(', ')}`, 400);
      return;
    }

    const { email, password, name, phone } = req.body;

    try {
      const result = await authService.register({
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
        phone,
      });

      successResponse(res, result, '注册成功', 201);
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        errorResponse(res, error.message, 400);
      } else if (error.name === 'DatabaseError') {
        errorResponse(res, error.message, 500);
      } else {
        errorResponse(res, '注册失败，请稍后重试', 500);
      }
    }
  });

  /**
   * 用户登录
   */
  public login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      errorResponse(res, `输入验证失败: ${errorMessages.join(', ')}`, 400);
      return;
    }

    const { email, password } = req.body;

    try {
      const result = await authService.login({
        email: email.toLowerCase().trim(),
        password,
      });

      successResponse(res, result, '登录成功');
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        errorResponse(res, error.message, 401);
      } else if (error.name === 'DatabaseError') {
        errorResponse(res, error.message, 500);
      } else {
        errorResponse(res, '登录失败，请稍后重试', 500);
      }
    }
  });

  /**
   * 刷新Token
   */
  public refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      errorResponse(res, `输入验证失败: ${errorMessages.join(', ')}`, 400);
      return;
    }

    const { refreshToken } = req.body;

    try {
      const result = await authService.refreshToken(refreshToken);
      successResponse(res, result, 'Token刷新成功');
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        errorResponse(res, error.message, 401);
      } else if (error.name === 'DatabaseError') {
        errorResponse(res, error.message, 500);
      } else {
        errorResponse(res, 'Token刷新失败，请重新登录', 401);
      }
    }
  });

  /**
   * 获取当前用户信息
   */
  public getCurrentUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      // 从认证中间件获取用户信息
      const userId = (req as any).user?.id;
      if (!userId) {
        errorResponse(res, '用户认证信息缺失', 401);
        return;
      }

      const user = await authService.getUserById(userId);
      successResponse(res, { user }, '获取用户信息成功');
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        errorResponse(res, error.message, 404);
      } else if (error.name === 'DatabaseError') {
        errorResponse(res, error.message, 500);
      } else {
        errorResponse(res, '获取用户信息失败，请稍后重试', 500);
      }
    }
  });

  /**
   * 更新用户信息
   */
  public updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      errorResponse(res, `输入验证失败: ${errorMessages.join(', ')}`, 400);
      return;
    }

    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        errorResponse(res, '用户认证信息缺失', 401);
        return;
      }

      const { name, email, phone, avatar } = req.body;

      const updatedUser = await authService.updateUser(userId, {
        name: name?.trim(),
        email: email?.toLowerCase().trim(),
        phone,
        avatar,
      });

      successResponse(res, { user: updatedUser }, '用户信息更新成功');
    } catch (error: any) {
      if (error.name === 'ValidationError' || error.name === 'NotFoundError') {
        errorResponse(res, error.message, 400);
      } else if (error.name === 'DatabaseError') {
        errorResponse(res, error.message, 500);
      } else {
        errorResponse(res, '更新用户信息失败，请稍后重试', 500);
      }
    }
  });

  /**
   * 修改密码
   */
  public changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      errorResponse(res, `输入验证失败: ${errorMessages.join(', ')}`, 400);
      return;
    }

    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        errorResponse(res, '用户认证信息缺失', 401);
        return;
      }

      const { currentPassword, newPassword } = req.body;

      await authService.changePassword(userId, currentPassword, newPassword);
      successResponse(res, null, '密码修改成功');
    } catch (error: any) {
      if (error.name === 'ValidationError' || error.name === 'NotFoundError') {
        errorResponse(res, error.message, 400);
      } else if (error.name === 'DatabaseError') {
        errorResponse(res, error.message, 500);
      } else {
        errorResponse(res, '修改密码失败，请稍后重试', 500);
      }
    }
  });

  /**
   * 用户登出
   */
  public logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 在实际应用中，这里可以将token加入黑名单
    // 目前只是返回成功响应
    successResponse(res, null, '登出成功');
  });

  /**
   * 验证Token
   */
  public verifyToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      errorResponse(res, `输入验证失败: ${errorMessages.join(', ')}`, 400);
      return;
    }

    try {
      const { token } = req.body;
      const user = await authService.validateToken(token);
      successResponse(res, { valid: true, user }, 'Token验证成功');
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        errorResponse(res, 'Token无效或已过期', 401);
      } else if (error.name === 'DatabaseError') {
        errorResponse(res, error.message, 500);
      } else {
        errorResponse(res, 'Token验证失败，请稍后重试', 500);
      }
    }
  });
}

export default new AuthController();