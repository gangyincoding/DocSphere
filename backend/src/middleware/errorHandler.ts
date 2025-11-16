import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import { logger } from '../utils/logger';
import { errorResponse } from '../utils/response';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = '服务器内部错误';

  // 处理自定义应用错误
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // 处理 JWT 错误
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的访问令牌';
  }

  // 处理 JWT 过期错误
  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '访问令牌已过期';
  }

  // 处理 Sequelize 验证错误
  if (error.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = '数据验证失败';
  }

  // 处理 Sequelize 外键约束错误
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = '关联数据不存在';
  }

  // 处理 Sequelize 唯一约束错误
  if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = '数据已存在';
  }

  // 记录错误日志
  logger.error('API 错误:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // 开发环境返回详细错误信息
  const responseData = {
    success: false,
    code: statusCode,
    message,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    responseData.stack = error.stack;
    // @ts-ignore
    responseData.details = error;
  }

  res.status(statusCode).json(responseData);
};