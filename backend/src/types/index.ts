// 通用响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: string;
  requestId?: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: {
    items: T[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  timestamp: string;
}

// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  phone?: string;
  role: 'admin' | 'user' | 'guest';
  departmentId?: number;
  status: 'active' | 'inactive' | 'suspended';
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  departmentId?: number;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 文件相关类型
export interface File {
  id: number;
  name: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  hash: string;
  extension?: string;
  folderId?: number;
  ownerId: number;
  uploadedAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  downloadCount: number;
  previewCount: number;
  isPublic: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UploadFileDto {
  name: string;
  folderId?: number;
  tags?: string[];
}

// 文件夹相关类型
export interface Folder {
  id: number;
  name: string;
  parentId?: number;
  ownerId: number;
  path: string;
  level: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreateFolderDto {
  name: string;
  parentId?: number;
}

// 权限相关类型
export enum PermissionType {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  SHARE = 'share',
  ADMIN = 'admin',
}

export enum ResourceType {
  FILE = 'file',
  FOLDER = 'folder',
}

export interface Permission {
  id: number;
  userId: number;
  resourceType: ResourceType;
  resourceId: number;
  permissionType: PermissionType;
  grantedBy: number;
  isInherited: boolean;
  inheritFromResourceId?: number;
  expiresAt?: Date;
  createdAt: Date;
}

export interface GrantPermissionDto {
  userId: number;
  resourceType: ResourceType;
  resourceId: number;
  permissions: PermissionType[];
  expiresIn?: string; // 1d, 7d, 30d, never
}

// 分享相关类型
export interface Share {
  id: number;
  fileId: number;
  sharedBy: number;
  shareToken: string;
  passwordHash?: string;
  expireAt?: Date;
  downloadLimit?: number;
  downloadCount: number;
  viewCount: number;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateShareDto {
  fileId: number;
  password?: string;
  expireAt?: Date;
  downloadLimit?: number;
  allowedIps?: string[];
}

// 操作日志类型
export enum LogAction {
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  DELETE = 'delete',
  RENAME = 'rename',
  MOVE = 'move',
  SHARE = 'share',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export interface OperationLog {
  id: number;
  userId: number;
  action: LogAction;
  resourceType: ResourceType;
  resourceId?: number;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  result: 'success' | 'failure';
  errorMessage?: string;
  extraData?: Record<string, any>;
  createdAt: Date;
}

// JWT Payload 类型
export interface JwtPayload {
  userId: number;
  username: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// 请求扩展类型
export interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

// 错误类型
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 验证错误类型
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// 分页查询参数
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// 文件查询参数
export interface FileQuery extends PaginationQuery {
  folderId?: number;
  search?: string;
  mimeType?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
}