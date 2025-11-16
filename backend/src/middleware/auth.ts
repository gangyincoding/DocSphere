import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import authService from '../services/authService';
import permissionService from '../services/permissionService';
import { errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * JWT认证中间件
 * 验证请求头中的Authorization token
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      errorResponse(res, '访问令牌缺失', 401);
      return;
    }

    // 检查token格式
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      errorResponse(res, '无效的访问令牌格式', 401);
      return;
    }

    const token = parts[1];

    // 验证token并获取用户信息
    try {
      const user = await authService.validateToken(token);
      req.user = user;
      next();
    } catch (tokenError: any) {
      logger.warn('Token验证失败', {
        error: tokenError.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });

      if (tokenError.name === 'ValidationError') {
        errorResponse(res, tokenError.message, 401);
      } else {
        errorResponse(res, '访问令牌验证失败', 401);
      }
      return;
    }
  } catch (error) {
    logger.error('认证中间件错误', { error, path: req.path });
    errorResponse(res, '认证失败，请稍后重试', 500);
  }
};

/**
 * 可选认证中间件
 * 如果提供了token则验证，否则继续执行
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // 没有token，继续执行
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // 无效格式，继续执行
      next();
      return;
    }

    const token = parts[1];

    try {
      const user = await authService.validateToken(token);
      req.user = user;
    } catch (tokenError) {
      // Token无效，继续执行
      logger.debug('可选认证中Token验证失败', { error: tokenError });
    }

    next();
  } catch (error) {
    logger.error('可选认证中间件错误', { error, path: req.path });
    next();
  }
};

/**
 * 角色授权中间件
 * 检查用户是否具有指定角色
 * 注意：此为基础实现，后续需要配合权限控制系统
 */
export const authorize = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 首先确保用户已认证
      if (!req.user) {
        errorResponse(res, '用户未认证', 401);
        return;
      }

      // 暂时跳过角色检查，后续实现权限系统后再完善
      // const userRole = req.user.role;
      // if (!roles.includes(userRole)) {
      //   errorResponse(res, '权限不足', 403);
      //   return;
      // }

      logger.debug('用户角色授权检查通过', {
        userId: req.user.id,
        path: req.path,
        requiredRoles: roles
      });

      next();
    } catch (error) {
      logger.error('授权中间件错误', { error, path: req.path });
      errorResponse(res, '权限验证失败，请稍后重试', 500);
    }
  };
};

/**
 * 资源所有者验证中间件
 * 检查用户是否是资源的所有者
 */
export const checkResourceOwnership = (resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 确保用户已认证
      if (!req.user) {
        errorResponse(res, '用户未认证', 401);
        return;
      }

      const resourceUserId = parseInt(req.params[resourceIdParam]);
      const currentUserId = req.user.id;

      // 如果请求的资源ID等于当前用户ID，或者是管理员（后续实现）
      if (resourceUserId === currentUserId) {
        next();
        return;
      }

      // 暂时跳过管理员权限检查，后续实现权限系统
      // if (req.user.role === 'admin') {
      //   next();
      //   return;
      // }

      errorResponse(res, '无权访问此资源', 403);
    } catch (error) {
      logger.error('资源所有权检查错误', { error, path: req.path });
      errorResponse(res, '资源访问验证失败，请稍后重试', 500);
    }
  };
};

/**
 * API密钥认证中间件
 * 用于系统间API调用
 */
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const expectedApiKey = process.env.INTERNAL_API_KEY;

    if (!expectedApiKey) {
      logger.error('API密钥未配置');
      errorResponse(res, '服务配置错误', 500);
      return;
    }

    if (!apiKey || apiKey !== expectedApiKey) {
      logger.warn('无效的API密钥访问尝试', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        providedKey: apiKey?.substring(0, 8) + '...' // 只记录前8位
      });
      errorResponse(res, '无效的API密钥', 401);
      return;
    }

    // 设置内部API标记
    (req as any).isInternalApi = true;
    next();
  } catch (error) {
    logger.error('API密钥认证中间件错误', { error, path: req.path });
    errorResponse(res, 'API认证失败，请稍后重试', 500);
  }
};

/**
 * 频率限制中间件的基础实现
 * 注意：这是一个简单实现，生产环境建议使用redis
 */
export const createRateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const key = req.ip || 'unknown';
      const now = Date.now();
      const windowMs = options.windowMs;
      const maxRequests = options.max;

      // 清理过期的请求记录
      for (const [ip, data] of requests.entries()) {
        if (now > data.resetTime) {
          requests.delete(ip);
        }
      }

      // 获取或创建请求记录
      let requestData = requests.get(key);
      if (!requestData) {
        requestData = { count: 0, resetTime: now + windowMs };
        requests.set(key, requestData);
      }

      // 检查是否超过限制
      if (requestData.count >= maxRequests) {
        const resetTime = Math.ceil((requestData.resetTime - now) / 1000);
        res.set({
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
        });

        errorResponse(
          res,
          options.message || `请求过于频繁，请${resetTime}秒后重试`,
          429
        );
        return;
      }

      // 增加请求计数
      requestData.count++;

      // 设置响应头
      const remaining = maxRequests - requestData.count;
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': requestData.resetTime.toString(),
      });

      next();
    } catch (error) {
      logger.error('频率限制中间件错误', { error, path: req.path });
      next(); // 出错时不阻止请求
    }
  };
};

// 预设的频率限制器
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 最多10次认证尝试
  message: '认证请求过于频繁，请15分钟后重试'
});

export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100次请求
  message: '请求过于频繁，请稍后重试'
});

/**
 * 权限检查中间件
 * 检查用户是否具有指定权限
 */
export const requirePermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 首先确保用户已认证
      if (!req.user) {
        errorResponse(res, '用户未认证', 401);
        return;
      }

      const hasPermission = await permissionService.checkUserPermission(req.user.id, {
        resource,
        action,
        resourceId: req.params.id?.toString(),
      });

      if (!hasPermission) {
        logger.warn('用户权限不足', {
          userId: req.user.id,
          path: req.path,
          requiredPermission: `${resource}:${action}`,
          userPermissions: await permissionService.getUserPermissions(req.user.id)
        });

        errorResponse(res, '权限不足', 403);
        return;
      }

      logger.debug('用户权限检查通过', {
        userId: req.user.id,
        path: req.path,
        requiredPermission: `${resource}:${action}`
      });

      next();
    } catch (error) {
      logger.error('权限检查中间件错误', { error, path: req.path });
      errorResponse(res, '权限验证失败，请稍后重试', 500);
    }
  };
};

/**
 * 资源所有者或权限检查中间件
 * 检查用户是资源所有者或具有指定权限
 */
export const requireOwnershipOrPermission = (
  resourceIdParam: string = 'id',
  resource: string,
  action: string
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        errorResponse(res, '用户未认证', 401);
        return;
      }

      const resourceUserId = parseInt(req.params[resourceIdParam]);
      const currentUserId = req.user.id;

      // 检查是否为资源所有者
      const isOwner = !isNaN(resourceUserId) && resourceUserId === currentUserId;

      // 如果不是所有者，检查权限
      const hasPermission = isOwner || await permissionService.checkUserPermission(req.user.id, {
        resource,
        action,
        resourceId: req.params.id?.toString(),
      });

      if (!hasPermission) {
        logger.warn('用户权限不足（所有者或权限检查）', {
          userId: req.user.id,
          path: req.path,
          isOwner,
          resourceUserId,
          requiredPermission: `${resource}:${action}`
        });

        errorResponse(res, '权限不足', 403);
        return;
      }

      logger.debug('用户权限检查通过（所有者或权限）', {
        userId: req.user.id,
        path: req.path,
        isOwner,
        resourceUserId,
        requiredPermission: `${resource}:${action}`
      });

      next();
    } catch (error) {
      logger.error('所有者或权限检查中间件错误', { error, path: req.path });
      errorResponse(res, '权限验证失败，请稍后重试', 500);
    }
  };
};