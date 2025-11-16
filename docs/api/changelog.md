# API 变更日志

本文档记录了 DocSphere API 的所有变更历史，包括新增功能、修改、废弃和删除的接口。遵循[语义化版本控制](https://semver.org/lang/zh-CN/)规范。

## [Unreleased] - 开发中

### 新增
- 文件标签管理功能
- 批量操作API优化
- 实时通知接口
- 文件版本历史查询

### 变更
- 优化文件上传接口性能
- 改进权限检查机制
- 更新错误响应格式

### 修复
- 修复文件分片上传的并发问题
- 修复权限缓存失效问题
- 修复搜索结果的分页问题

## [v1.2.0] - 2024-03-15

### 新增
- `/api/files/search/advanced` - 高级文件搜索接口
- `/api/files/batch` - 批量文件操作接口
- `/api/shares/analytics` - 分享链接统计分析
- `/api/admin/health` - 系统健康检查接口

### 变更
- 文件上传接口支持断点续传
- 权限检查支持批量验证
- 搜索接口支持模糊匹配

### 废弃
- `/api/files/search/simple` (将在 v2.0.0 中删除，请使用 `/api/files/search`)

### 修复
- 修复大文件上传内存泄漏问题
- 修复权限继承的边界情况
- 修复分享链接的过期时间计算

## [v1.1.0] - 2024-02-01

### 新增
- `/api/users/{id}/permissions` - 获取用户所有权限
- `/api/files/{id}/versions` - 文件版本管理
- `/api/departments/{id}/users` - 部门用户列表
- WebSocket 实时通知支持

### 变更
- 权限接口支持角色权限分配
- 文件列表接口支持排序和多字段过滤
- 用户认证接口支持多因子认证

### 修复
- 修复权限缓存的并发更新问题
- 修复文件预览的格式支持
- 修复搜索索引的实时更新

## [v1.0.0] - 2024-01-15

### 新增
- 完整的 RESTful API 接口
- 用户认证和授权系统
- 文件和文件夹管理功能
- 权限控制系统
- 分享管理功能
- 系统管理接口
- 完整的 API 文档

### 核心接口列表

#### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/refresh` - 刷新Token
- `GET /api/auth/profile` - 获取用户信息

#### 用户管理
- `GET /api/users` - 用户列表
- `POST /api/users` - 创建用户
- `GET /api/users/{id}` - 获取用户详情
- `PUT /api/users/{id}` - 更新用户信息
- `DELETE /api/users/{id}` - 删除用户

#### 文件管理
- `GET /api/files` - 文件列表
- `POST /api/files/upload` - 文件上传
- `GET /api/files/{id}` - 获取文件信息
- `PUT /api/files/{id}` - 更新文件信息
- `DELETE /api/files/{id}` - 删除文件
- `GET /api/files/{id}/download` - 文件下载
- `GET /api/files/{id}/preview` - 文件预览

#### 文件夹管理
- `GET /api/folders` - 文件夹列表
- `POST /api/folders` - 创建文件夹
- `GET /api/folders/{id}` - 获取文件夹内容
- `PUT /api/folders/{id}` - 更新文件夹信息
- `DELETE /api/folders/{id}` - 删除文件夹

#### 权限管理
- `POST /api/permissions/grant` - 授予权限
- `DELETE /api/permissions/{id}` - 撤销权限
- `GET /api/permissions/resource/{type}/{id}` - 获取资源权限
- `GET /api/permissions/user/{id}` - 获取用户权限

#### 分享管理
- `POST /api/shares` - 创建分享链接
- `GET /api/shares/{token}` - 访问分享文件
- `DELETE /api/shares/{id}` - 取消分享
- `GET /api/shares/user/{id}` - 用户分享列表

#### 系统管理
- `GET /api/admin/statistics` - 系统统计
- `GET /api/admin/users` - 用户管理
- `GET /api/admin/logs` - 操作日志
- `GET /api/admin/health` - 系统健康检查

## 版本管理规范

### 版本号格式
遵循语义化版本控制：`MAJOR.MINOR.PATCH`

- **MAJOR**: 不兼容的 API 修改
- **MINOR**: 向下兼容的功能性新增
- **PATCH**: 向下兼容的问题修正

### 变更类型

#### 新增 (Added)
- 新增的接口
- 新增的字段
- 新增的功能

#### 变更 (Changed)
- 现有接口的改进
- 字段类型的变更（向下兼容）
- 行为的优化

#### 废弃 (Deprecated)
- 即将删除的功能
- 推荐使用的替代方案

#### 删除 (Removed)
- 已删除的接口或字段
- 不再支持的功能

#### 修复 (Fixed)
- Bug 修复
- 安全问题修复

#### 安全 (Security)
- 安全相关的修复
- 权限相关的改进

## 向后兼容性

### 兼容性保证
- **PATCH 版本**: 完全向后兼容
- **MINOR 版本**: 向后兼容，可能新增字段
- **MAJOR 版本**: 可能包含不兼容的变更

### 废弃策略
1. **提前通知**: 至少提前 3 个月通知废弃计划
2. **替代方案**: 提供明确的替代接口
3. **渐进过渡**: 保持废弃接口至少 6 个月
4. **明确标识**: 在响应头中标记废弃状态

### 版本标识
```http
# API 版本通过 URL 路径标识
https://api.docsphere.com/v1/files

# 或通过请求头标识
Accept: application/vnd.docsphere.v1+json
API-Version: 1.0
```

## 破坏性变更记录

### v1.2.0 中的破坏性变更

#### 权限接口变更
```http
# v1.1.x (废弃)
POST /api/permissions
{
  "userId": "123",
  "resourceId": "456",
  "resourceType": "file",
  "permissions": ["read", "write"]
}

# v1.2.0 (推荐)
POST /api/permissions/grant
{
  "userId": "123",
  "resourceId": "456",
  "resourceType": "file",
  "permissions": ["read", "write"],
  "expiresIn": "30d",
  "reason": "项目协作需要"
}
```

#### 文件搜索接口变更
```http
# v1.1.x (废弃)
GET /api/files/search?q=keyword&type=image

# v1.2.0 (推荐)
GET /api/files/search?q=keyword&filters[type]=image&sort=created_at:desc
```

## 迁移指南

### v1.1.x → v1.2.0 迁移

#### 1. 权限接口迁移
```javascript
// 旧版本
const response = await fetch('/api/permissions', {
  method: 'POST',
  body: JSON.stringify({
    userId: '123',
    resourceId: '456',
    resourceType: 'file',
    permissions: ['read']
  })
});

// 新版本
const response = await fetch('/api/permissions/grant', {
  method: 'POST',
  body: JSON.stringify({
    userId: '123',
    resourceId: '456',
    resourceType: 'file',
    permissions: ['read'],
    expiresIn: '30d'
  })
});
```

#### 2. 搜索接口迁移
```javascript
// 旧版本
const response = await fetch('/api/files/search?q=document&type=pdf');

// 新版本
const response = await fetch('/api/files/search?q=document&filters[type]=pdf&sort=relevance:desc');
```

### 客户端SDK更新

#### JavaScript SDK
```bash
# 更新到最新版本
npm install @docsphere/sdk@^1.2.0
```

#### 主要变更
```javascript
import { DocSphereAPI } from '@docsphere/sdk';

const api = new DocSphereAPI({
  version: '1.2.0', // 指定API版本
  baseURL: 'https://api.docsphere.com'
});

// 使用新的权限接口
await api.permissions.grant({
  userId: '123',
  resourceId: '456',
  resourceType: 'file',
  permissions: ['read']
});

// 使用新的搜索接口
const results = await api.files.search({
  query: 'document',
  filters: { type: 'pdf' },
  sort: { field: 'created_at', order: 'desc' }
});
```

## 测试和验证

### 版本兼容性测试
- 每个版本发布前进行完整的兼容性测试
- 维护多个版本的测试环境
- 提供版本兼容性检查工具

### 自动化测试
```bash
# 运行所有版本的兼容性测试
npm run test:compatibility

# 运行特定版本的测试
npm run test:compatibility -- --version=1.1.0
```

## 发布计划

### 发布周期
- **PATCH 版本**: 每月发布（根据需要）
- **MINOR 版本**: 每季度发布
- **MAJOR 版本**: 每年发布（根据需要）

### 发布通知
- GitHub Release 说明
- 邮件通知订阅用户
- API 响应头中的版本信息
- 官方文档更新

## 获取帮助

如果您在使用 API 过程中遇到问题，可以通过以下方式获取帮助：

1. **查看文档**: [API接口规范](./api-specification.md)
2. **搜索Issue**: [GitHub Issues](https://github.com/your-org/docsphere/issues)
3. **提交问题**: 创建新的 Issue
4. **联系支持**: api-support@docsphere.com

---

💡 **提示**: 建议在生产环境中锁定 API 版本，并定期关注版本更新，及时升级到最新稳定版本。