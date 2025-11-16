import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

/**
 * 成功响应
 * @param res Express Response 对象
 * @param data 响应数据
 * @param message 响应消息
 * @param statusCode HTTP状态码
 */
export const successResponse = <T>(
  res: Response,
  data?: T,
  message: string = '操作成功',
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    code: statusCode,
    message,
    data: data as T,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * 分页响应
 * @param res Express Response 对象
 * @param items 数据列表
 * @param pagination 分页信息
 * @param message 响应消息
 * @param statusCode HTTP状态码
 */
export const paginatedResponse = <T>(
  res: Response,
  items: T[],
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  },
  message: string = '获取数据成功',
  statusCode: number = 200
): Response => {
  const response: PaginatedResponse<T> = {
    success: true,
    code: statusCode,
    message,
    data: {
      items,
      pagination,
    },
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * 错误响应
 * @param res Express Response 对象
 * @param message 错误消息
 * @param statusCode HTTP状态码
 * @param error 错误详情
 */
export const errorResponse = (
  res: Response,
  message: string = '操作失败',
  statusCode: number = 500,
  error?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    code: statusCode,
    message,
    data: error,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * 创建成功响应
 * @param data 响应数据
 * @param message 响应消息
 * @param statusCode HTTP状态码
 */
export const createSuccessResponse = <T>(
  data?: T,
  message: string = '操作成功',
  statusCode: number = 200
): ApiResponse<T> => {
  return {
    success: true,
    code: statusCode,
    message,
    data: data as T,
    timestamp: new Date().toISOString(),
  };
};

/**
 * 创建错误响应
 * @param message 错误消息
 * @param statusCode HTTP状态码
 * @param error 错误详情
 */
export const createErrorResponse = (
  message: string = '操作失败',
  statusCode: number = 500,
  error?: any
): ApiResponse => {
  return {
    success: false,
    code: statusCode,
    message,
    data: error,
    timestamp: new Date().toISOString(),
  };
};