/**
 * 自定义错误类
 */

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    // 确保堆栈跟踪正确
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, true, code || 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在', code?: string) {
    super(message, 404, true, code || 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权访问', code?: string) {
    super(message, 401, true, code || 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '禁止访问', code?: string) {
    super(message, 403, true, code || 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 409, true, code || 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = '数据库操作失败', code?: string) {
    super(message, 500, true, code || 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = '外部服务调用失败', code?: string) {
    super(message, 502, true, code || 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = '请求过于频繁', code?: string) {
    super(message, 429, true, code || 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class FileUploadError extends AppError {
  constructor(message: string = '文件上传失败', code?: string) {
    super(message, 400, true, code || 'FILE_UPLOAD_ERROR');
    this.name = 'FileUploadError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = '认证失败', code?: string) {
    super(message, 401, true, code || 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = '权限不足', code?: string) {
    super(message, 403, true, code || 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}