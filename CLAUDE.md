# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

DocSphere 是一款企业级文档管理系统，采用前后端分离架构，使用 pnpm workspaces 管理 monorepo。

**技术栈**:
- 前端: Vite + React 18 + TypeScript + Ant Design 5.x
- 后端: Node.js + Express + TypeScript + MySQL + Redis + Elasticsearch + MinIO
- 测试: 后端使用 Jest，前端使用 Vitest + React Testing Library
- 包管理: pnpm (>=7.0.0)
- Node版本: >=18.0.0

## 常用命令

### 开发环境
```bash
# 安装依赖
pnpm install

# 启动所有服务
pnpm run dev

# 单独启动后端（端口 8000）
pnpm run dev:backend
cd backend && npx ts-node src/simple-server.ts

# 单独启动前端（端口 3000）
pnpm run dev:frontend
```

### 构建
```bash
# 构建前后端
pnpm run build

# 单独构建后端
pnpm run build:backend

# 单独构建前端
pnpm run build:frontend
```

### 测试

**后端测试** (在 backend 目录):
```bash
# 运行所有测试
pnpm run test

# 运行特定测试
pnpm run test -- fileName.test.ts

# 监听模式
pnpm run test:watch

# 覆盖率报告
pnpm run test:coverage

# 仅运行单元测试
pnpm run test:unit

# 仅运行集成测试
pnpm run test:integration

# 仅运行 E2E 测试
pnpm run test:e2e

# CI 环境测试
pnpm run test:ci

# 静默模式测试
pnpm run test:silent
```

**前端测试** (在 frontend 目录):
```bash
cd frontend

# 运行测试
pnpm run test

# UI 模式
pnpm run test:ui

# 覆盖率报告
pnpm run test:coverage
```

### 代码质量
```bash
# Lint 检查
pnpm run lint
pnpm run lint:backend
pnpm run lint:frontend

# 修复 Lint 问题
cd backend && pnpm run lint:fix
cd frontend && pnpm run lint:fix

# 格式化代码
cd backend && pnpm run format
cd frontend && pnpm run format

# 类型检查（后端）
cd backend && pnpm run type-check
```

### 数据库操作
```bash
cd backend

# 同步数据库表
npx ts-node sync-db.ts

# 检查数据库状态
npx ts-node check-db.ts

# 运行迁移
pnpm run migrate

# 填充种子数据
pnpm run seed
```

### Docker
```bash
# 构建所有服务
pnpm run docker:build

# 启动所有服务
pnpm run docker:up

# 停止所有服务
pnpm run docker:down
```

## 架构设计

### RBAC 权限模型
项目采用基于角色的访问控制(RBAC)模型，核心关系：
- **用户(User) ↔ 角色(Role)**: 多对多关系，通过 UserRole 关联表
- **角色(Role) ↔ 权限(Permission)**: 多对多关系，通过 RolePermission 关联表
- 支持权限继承和细粒度控制

关联关系定义在 `backend/src/models/associations.ts`，包含：
- 用户、角色、权限的多对多关系
- 文件夹的自引用关系（parent-children）
- 文件与用户、文件夹的关联
- 文件分享关系

### API 路由结构
所有 API 路由前缀为 `/api/v1`，主要模块：
- `/api/v1/auth` - 认证相关（登录、注册、刷新 token）
- `/api/v1/users` - 用户管理
- `/api/v1/files` - 文件管理
- `/api/v1/folders` - 文件夹管理
- `/api/v1/permissions` - 权限管理
- `/api/v1/shares` - 文件分享

路由定义在 `backend/src/routes/index.ts`

### 认证机制
采用 JWT + RefreshToken 双令牌机制：
- Access Token 有效期: 24小时（可配置）
- Refresh Token 有效期: 7天（可配置）
- 配置位于 `backend/src/config/index.ts`

### 前端路由结构
- 公开路由: `/auth/login`, `/auth/register`
- 受保护路由: 需要登录，由 `ProtectedRoute` 组件包裹
  - `/dashboard` - 仪表盘
  - `/files` - 文件管理
  - `/users` - 用户管理（管理员）
  - `/roles` - 角色管理（管理员）
  - `/permissions` - 权限管理（管理员）
  - `/profile` - 个人资料
  - `/settings` - 系统设置

路由定义在 `frontend/src/App.tsx`

### 前端路径别名
配置在 `vite.config.ts` 和 `vitest.config.ts`:
- `@` → `src/`
- `@components` → `src/components/`
- `@pages` → `src/pages/`
- `@services` → `src/services/`
- `@hooks` → `src/hooks/`
- `@utils` → `src/utils/`
- `@types` → `src/types/`
- `@assets` → `src/assets/`
- `@styles` → `src/styles/`

### 代理配置
开发环境前端请求 `/api` 自动代理到 `http://localhost:8000` (配置在 vite.config.ts)

## 测试规范

### 覆盖率要求
根据 `docs/development/testing-standards.md`:
- **代码行覆盖率**: ≥80%
- **分支覆盖率**: ≥75%
- **函数覆盖率**: ≥90%
- **关键业务逻辑**: 100%

### 测试类型和命名
- **单元测试**: `*.test.ts` 或 `*.spec.ts`
  - 位置: 与源文件同目录或 `src/tests/unit/`
  - 目标: 测试独立函数、类或模块

- **集成测试**: `*.integration.test.ts`
  - 位置: `src/tests/integration/`
  - 目标: 测试多个模块协同工作

- **E2E 测试**: `*.e2e.test.ts`
  - 位置: `src/tests/e2e/`
  - 目标: 完整业务流程测试

### 测试金字塔原则
- 单元测试: 70%
- 集成测试: 20%
- E2E 测试: 10%

### AAA 测试模式
所有测试应遵循 Arrange-Act-Assert 模式：
```typescript
it('测试描述', () => {
  // Arrange - 准备测试数据
  const input = { /* ... */ };

  // Act - 执行被测代码
  const result = functionUnderTest(input);

  // Assert - 验证结果
  expect(result).toBe(expected);
});
```

### 新增功能要求
**功能开发完成后必须立即编写对应的测试用例**，不允许有未测试的业务逻辑代码。

## 关键文件

### 数据库
- `backend/src/config/database.ts` - Sequelize 配置
- `backend/sync-db.ts` - 数据库同步脚本
- `backend/check-db.ts` - 数据库检查脚本

### 文件存储
- `backend/src/services/fileService.ts` - 文件业务逻辑
- `backend/src/utils/minioClient.ts` - MinIO 客户端封装

### 服务启动
- `backend/src/simple-server.ts` - 简化的后端服务 (开发用)
- `backend/src/index.ts` - 完整后端服务

### 前端核心
- `frontend/vite.config.ts` - Vite 配置
- `frontend/src/App.tsx` - 应用入口
- `frontend/src/components/Auth/ProtectedRoute.tsx` - 路由保护

## 环境配置

### 后端环境变量
主要配置项（参考 `backend/src/config/index.ts`）：

**应用配置**:
- `NODE_ENV`: 环境（development/production）
- `PORT`: 服务端口（默认 8000）
- `APP_NAME`: 应用名称
- `JWT_SECRET`: JWT 密钥（生产环境必须修改）
- `JWT_EXPIRES_IN`: Token 有效期（默认 24h）
- `REFRESH_TOKEN_EXPIRES_IN`: Refresh Token 有效期（默认 7d）

**数据库配置**:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `DB_CHARSET`: utf8mb4
- `DB_TIMEZONE`: +08:00

**Redis 配置**:
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`

**MinIO 配置**:
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
- `MINIO_BUCKET`: 存储桶名称 (默认: docsphere)
- `MINIO_USE_SSL`: 是否使用 SSL
- API: http://localhost:9000, Console: http://localhost:9001

### 文件存储
使用 MinIO 对象存储（已集成 minioClient）：
- 支持文件上传、下载、删除、流式处理
- 预签名URL用于临时访问
- 私有存储桶，默认拒绝公共访问

## 开发流程

### 1. 环境准备
```bash
# 启动 MySQL 服务
# 创建数据库 docsphere_dev

# 启动 MinIO 服务 (Docker 推荐):
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  -v /path/to/minio-data:/data \
  minio/minio server /data --console-address ":9001"
```

### 2. 启动开发服务器
```bash
# 启动后端 (端口 8000)
cd backend && npx ts-node src/simple-server.ts

# 启动前端 (端口 3000)
cd frontend && pnpm run dev
```

### 3. 数据库同步
```bash
cd backend
npx ts-node sync-db.ts
```

## 常见问题

### 数据库连接失败
- 检查 MySQL 服务是否运行
- 验证 .env 中的数据库凭据
- 确认数据库 `docsphere_dev` 已创建

### MinIO 连接问题
- MinIO 默认: http://localhost:9000 (API), http://localhost:9001 (Console)
- 默认凭据: minioadmin / minioadmin123
- 存储桶名称: docsphere

### 前端代理问题
- 确认后端运行在 http://localhost:8000
- 检查 vite.config.ts 中的代理配置

## 代码结构

### 后端 (MVC)
```
backend/src/
├── controllers/     # HTTP 请求处理
├── services/        # 业务逻辑 (文件服务: fileService.ts)
├── models/          # Sequelize 模型 (associations.ts)
├── middleware/      # 中间件
├── routes/          # 路由定义
├── utils/           # 工具 (minioClient.ts, logger.ts)
├── config/          # 配置文件 (database.ts, index.ts)
└── types/           # TypeScript 类型定义
```

### 前端 (组件化)
```
frontend/src/
├── components/      # 可复用组件
├── pages/           # 页面级组件
├── services/        # API 服务层
├── hooks/           # 自定义 React Hooks
├── utils/           # 工具函数
├── assets/          # 静态资源
└── styles/          # 样式文件
```

## API 文档

- Swagger 文档: `http://localhost:8000/api-docs`
- 健康检查: `http://localhost:8000/health`

## 相关文档

详细文档位于 `docs/` 目录:
- `architecture/` - 系统架构设计
- `api/` - API 接口规范
- `database/` - 数据库设计
- `development/` - 开发规范和测试标准
- `guides/` - 快速开始和部署指南
