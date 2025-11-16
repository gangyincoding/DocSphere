// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// 用户类型
export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 登录请求类型
export interface LoginRequest {
  email: string;
  password: string;
}

// 注册请求类型
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

// 登录响应类型
export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// 权限类型
export interface Permission {
  id: number;
  code: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 角色类型
export interface Role {
  id: number;
  code: string;
  name: string;
  description?: string;
  level: number;
  isActive: boolean;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

// 文件夹类型
export interface Folder {
  id: number;
  name: string;
  path: string;
  parentId?: number;
  level: number;
  userId: number;
  isPublic: boolean;
  description?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Folder[];
  parent?: Folder;
}

// 文件类型
export interface File {
  id: number;
  name: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  extension: string;
  checksum: string;
  folderId?: number;
  userId: number;
  isPublic: boolean;
  description?: string;
  tags?: string;
  downloadCount: number;
  version: number;
  isVersioned: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  folder?: Folder;
  owner?: User;
}

// 文件分享类型
export interface FileShare {
  id: number;
  fileId: number;
  userId: number;
  shareType: 'link' | 'user' | 'public';
  shareCode?: string;
  expiresAt?: string;
  accessCount: number;
  maxAccessCount?: number;
  canDownload: boolean;
  canComment: boolean;
  canEdit: boolean;
  description?: string;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  file?: File;
  user?: User;
}

// 查询参数类型
export interface FileQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  mimeType?: string;
  extension?: string;
  folderId?: number;
  isPublic?: boolean;
  userId?: number;
  sortBy?: 'name' | 'size' | 'createdAt' | 'downloadCount';
  sortOrder?: 'ASC' | 'DESC';
  tags?: string[];
}

// 上传文件类型
export interface UploadFile {
  file: File;
  folderId?: number;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
}

// 创建分享类型
export interface CreateShareRequest {
  fileId: number;
  shareType: 'link' | 'user' | 'public';
  expiresAt?: Date;
  maxAccessCount?: number;
  canDownload?: boolean;
  canComment?: boolean;
  canEdit?: boolean;
  password?: string;
  description?: string;
}

// 路由参数类型
export interface RouteParams {
  id?: string;
  folderId?: string;
  shareCode?: string;
}

// 表格列配置类型
export interface TableColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: number;
  fixed?: 'left' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
}

// 菜单项类型
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  permission?: string;
}

// 主题设置类型
export interface ThemeSettings {
  primaryColor: string;
  darkMode: boolean;
  compactMode: boolean;
}

// 用户设置类型
export interface UserSettings {
  theme: ThemeSettings;
  language: 'zh-CN' | 'en-US';
  autoSave: boolean;
  notifications: {
    email: boolean;
    browser: boolean;
  };
}

// 错误类型
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}