# API 接口规范

## API 概述

DocSphere API 采用 RESTful 设计风格，提供完整的文件管理、用户认证、权限控制等功能。所有 API 遵循统一的规范和约定。

## 基础信息

- **Base URL**: `https://api.docsphere.com/v1`
- **协议**: HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8
- **API版本**: v1

## 通用规范

### 请求格式

#### HTTP 方法
- `GET`: 获取资源
- `POST`: 创建资源
- `PUT`: 更新资源（完整替换）
- `PATCH`: 更新资源（部分更新）
- `DELETE`: 删除资源

#### 请求头
```http
Content-Type: application/json
Authorization: Bearer {jwt_token}
X-API-Version: 1.0
X-Request-ID: {unique_request_id}
```

#### 响应格式
```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "unique_request_id"
}
```

### 状态码

| 状态码 | 说明 | 示例场景 |
|--------|------|----------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 204 | No Content | 删除成功 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 权限不足 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 422 | Unprocessable Entity | 数据验证失败 |
| 429 | Too Many Requests | 请求频率限制 |
| 500 | Internal Server Error | 服务器内部错误 |

### 分页格式
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 错误响应格式
```json
{
  "success": false,
  "code": 400,
  "message": "请求参数错误",
  "error": {
    "type": "ValidationError",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "unique_request_id"
}
```

## 认证和授权

### JWT Token 格式
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": 12345,
    "username": "john_doe",
    "role": "user",
    "permissions": ["read", "write"],
    "exp": 1640995200,
    "iat": 1640908800
  }
}
```

### 认证相关 API

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123",
  "rememberMe": false
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token_string",
    "refreshToken": "refresh_token_string",
    "expiresIn": 3600,
    "user": {
      "id": 12345,
      "username": "john_doe",
      "email": "john@example.com",
      "fullName": "John Doe",
      "role": "user",
      "avatar": "avatar_url"
    }
  }
}
```

#### 刷新Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_string"
}
```

#### 用户登出
```http
POST /api/auth/logout
Authorization: Bearer {access_token}
```

## 用户管理 API

### 获取用户信息
```http
GET /api/users/profile
Authorization: Bearer {access_token}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": 12345,
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "avatar": "avatar_url",
    "role": "user",
    "department": {
      "id": 100,
      "name": "技术部"
    },
    "status": "active",
    "emailVerified": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 更新用户信息
```http
PUT /api/users/profile
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "fullName": "John Smith",
  "phone": "+1234567890",
  "avatar": "new_avatar_url"
}
```

### 修改密码
```http
POST /api/users/change-password
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_password",
  "confirmPassword": "new_password"
}
```

## 文件管理 API

### 文件上传

#### 单文件上传
```http
POST /api/files/upload
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

folderId: 123
file: [binary_data]
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": 56789,
    "name": "document.pdf",
    "originalName": "重要文档.pdf",
    "size": 1048576,
    "mimeType": "application/pdf",
    "hash": "sha256_hash",
    "folder": {
      "id": 123,
      "name": "文档"
    },
    "owner": {
      "id": 12345,
      "username": "john_doe"
    },
    "uploadedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### 分片上传
```http
POST /api/files/upload/chunks/init
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "fileName": "large_file.zip",
  "fileSize": 104857600,
  "chunkSize": 1048576,
  "totalChunks": 100,
  "folderId": 123,
  "hash": "sha256_hash"
}
```

```http
POST /api/files/upload/chunks/{uploadId}/chunk/{chunkNumber}
Authorization: Bearer {access_token}
Content-Type: application/octet-stream

[chunk_data]
```

### 文件下载
```http
GET /api/files/{fileId}/download
Authorization: Bearer {access_token}
```

### 文件预览
```http
GET /api/files/{fileId}/preview
Authorization: Bearer {access_token}
```

### 获取文件信息
```http
GET /api/files/{fileId}
Authorization: Bearer {access_token}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": 56789,
    "name": "document.pdf",
    "originalName": "重要文档.pdf",
    "path": "/folder/document.pdf",
    "size": 1048576,
    "mimeType": "application/pdf",
    "extension": "pdf",
    "hash": "sha256_hash",
    "folder": {
      "id": 123,
      "name": "文档",
      "path": "/文档"
    },
    "owner": {
      "id": 12345,
      "username": "john_doe"
    },
    "permissions": ["read", "write", "delete"],
    "tags": ["重要", "PDF"],
    "uploadedAt": "2024-01-01T00:00:00Z",
    "downloadCount": 5,
    "previewCount": 10
  }
}
```

### 文件搜索
```http
GET /api/files/search?q={keyword}&type={type}&folderId={folderId}&page={page}&pageSize={pageSize}
Authorization: Bearer {access_token}
```

**查询参数:**
- `q`: 搜索关键词
- `type`: 文件类型过滤 (image, document, video, etc.)
- `folderId`: 文件夹ID
- `tags`: 标签过滤
- `startDate`: 开始日期
- `endDate`: 结束日期
- `page`: 页码
- `pageSize`: 每页数量

## 文件夹管理 API

### 创建文件夹
```http
POST /api/folders
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "新文件夹",
  "parentId": 123
}
```

### 获取文件夹内容
```http
GET /api/folders/{folderId}?page={page}&pageSize={pageSize}&sort={sort}&order={order}
Authorization: Bearer {access_token}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "folder": {
      "id": 123,
      "name": "文档",
      "path": "/文档",
      "level": 1,
      "permissions": ["read", "write", "delete"]
    },
    "items": [
      {
        "id": 124,
        "name": "子文件夹",
        "type": "folder",
        "size": 0,
        "createdAt": "2024-01-01T00:00:00Z"
      },
      {
        "id": 56789,
        "name": "document.pdf",
        "type": "file",
        "size": 1048576,
        "mimeType": "application/pdf",
        "uploadedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 2
    }
  }
}
```

### 重命名文件夹
```http
PUT /api/folders/{folderId}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "新名称"
}
```

### 移动文件夹
```http
POST /api/folders/{folderId}/move
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "targetParentId": 456
}
```

## 权限管理 API

### 授予权限
```http
POST /api/permissions/grant
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "userId": 67890,
  "resourceType": "file",
  "resourceId": 56789,
  "permissions": ["read", "write"],
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### 撤销权限
```http
DELETE /api/permissions/{permissionId}
Authorization: Bearer {access_token}
```

### 获取资源权限列表
```http
GET /api/permissions/resource/{resourceType}/{resourceId}
Authorization: Bearer {access_token}
```

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1001,
      "user": {
        "id": 67890,
        "username": "jane_doe"
      },
      "permissions": ["read", "write"],
      "grantedBy": {
        "id": 12345,
        "username": "john_doe"
      },
      "isInherited": false,
      "grantedAt": "2024-01-01T00:00:00Z",
      "expiresAt": "2024-12-31T23:59:59Z"
    }
  ]
}
```

### 获取用户权限列表
```http
GET /api/permissions/user/{userId}?resourceType={resourceType}
Authorization: Bearer {access_token}
```

## 分享管理 API

### 创建分享链接
```http
POST /api/shares
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "fileId": 56789,
  "password": "optional_password",
  "expireAt": "2024-12-31T23:59:59Z",
  "downloadLimit": 100,
  "allowedIps": ["192.168.1.0/24"]
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": 2001,
    "shareToken": "unique_share_token",
    "shareUrl": "https://docsphere.com/s/unique_share_token",
    "file": {
      "id": 56789,
      "name": "document.pdf"
    },
    "hasPassword": true,
    "expireAt": "2024-12-31T23:59:59Z",
    "downloadLimit": 100,
    "downloadCount": 0,
    "viewCount": 0,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 访问分享文件
```http
GET /api/shares/{shareToken}
```

**有密码的分享:**
```http
POST /api/shares/{shareToken}/access
Content-Type: application/json

{
  "password": "share_password"
}
```

### 下载分享文件
```http
GET /api/shares/{shareToken}/download
```

### 获取用户分享列表
```http
GET /api/shares/user/{userId}?page={page}&pageSize={pageSize}
Authorization: Bearer {access_token}
```

### 取消分享
```http
DELETE /api/shares/{shareId}
Authorization: Bearer {access_token}
```

## 后台管理 API

### 获取系统统计
```http
GET /api/admin/statistics
Authorization: Bearer {admin_token}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1000,
      "active": 950,
      "newToday": 10
    },
    "files": {
      "total": 50000,
      "totalSize": "1TB",
      "uploadedToday": 100
    },
    "shares": {
      "active": 500,
      "totalViews": 10000
    },
    "storage": {
      "used": "800GB",
      "available": "200GB",
      "usage": 80
    }
  }
}
```

### 用户管理
```http
GET /api/admin/users?page={page}&pageSize={pageSize}&status={status}&role={role}
Authorization: Bearer {admin_token}
```

```http
PUT /api/admin/users/{userId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "suspended",
  "role": "admin"
}
```

### 操作日志查询
```http
GET /api/admin/logs?action={action}&userId={userId}&startDate={startDate}&endDate={endDate}&page={page}
Authorization: Bearer {admin_token}
```

## 限流和安全

### API 限流
- **认证API**: 每IP每分钟5次
- **文件上传**: 每用户每分钟10次
- **文件下载**: 每IP每分钟100次
- **其他API**: 每IP每分钟60次

### 安全措施
1. **CORS配置**: 限制跨域访问
2. **CSP策略**: 内容安全策略
3. **输入验证**: 严格的参数验证
4. **SQL注入防护**: 参数化查询
5. **XSS防护**: 输出转义
6. **CSRF防护**: CSRF Token验证

## SDK 和工具

### JavaScript SDK
```javascript
import { DocSphereAPI } from '@docsphere/sdk';

const api = new DocSphereAPI({
  baseURL: 'https://api.docsphere.com/v1',
  token: 'your_access_token'
});

// 上传文件
const result = await api.files.upload(file, { folderId: 123 });

// 搜索文件
const files = await api.files.search({ q: 'document' });
```

### CLI 工具
```bash
# 安装CLI
npm install -g @docsphere/cli

# 配置
docsphere config set token your_access_token

# 上传文件
docsphere upload ./document.pdf --folder 123

# 下载文件
docsphere download 56789
```

## API 版本管理

### 版本策略
- **URL版本**: `/api/v1/`, `/api/v2/`
- **向后兼容**: 旧版本API至少维护6个月
- **废弃通知**: 提前3个月通知API废弃

### 版本变更日志
详细的版本变更信息请参考 [API CHANGELOG](./changelog.md)。