# 快速开始指南

本指南将帮助您快速搭建 DocSphere 开发环境，并运行第一个实例。

## 环境要求

### 基础环境
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0 或 **pnpm**: >= 7.0.0 (推荐)
- **Git**: >= 2.0.0

### 数据库环境
- **MySQL**: >= 8.0
- **Redis**: >= 6.0
- **Elasticsearch**: >= 8.0 (可选，搜索功能)

### 文件存储
- **MinIO**: >= latest 或其他 S3 兼容的对象存储服务

### 开发工具 (推荐)
- **VS Code**: 推荐的代码编辑器
- **Docker**: >= 20.0.0 (可选，用于运行依赖服务)
- **Postman**: API 测试工具

## 项目搭建

### 1. 克隆项目

```bash
# 使用 Git 克隆项目
git clone https://github.com/your-org/docsphere.git

# 进入项目目录
cd docsphere
```

### 2. 安装依赖

我们推荐使用 pnpm 作为包管理器，因为它具有更快的安装速度和更好的磁盘空间利用率。

```bash
# 安装 pnpm (如果尚未安装)
npm install -g pnpm

# 安装所有依赖
pnpm install

# 或者分别安装前后端依赖
cd backend && pnpm install
cd ../frontend && pnpm install
```

### 3. 环境配置

#### 复制环境变量文件

```bash
# 后端环境变量
cp backend/.env.example backend/.env

# 前端环境变量
cp frontend/.env.example frontend/.env.local
```

#### 配置后端环境变量

编辑 `backend/.env` 文件：

```bash
# 应用配置
NODE_ENV=development
PORT=8000
APP_NAME=DocSphere
APP_VERSION=1.0.0

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=docsphere_dev
DB_USER=root
DB_PASSWORD=your_password
DB_CHARSET=utf8mb4
DB_TIMEZONE=+08:00

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# 文件存储配置 (MinIO)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=docsphere
MINIO_USE_SSL=false
MINIO_REGION=us-east-1

# Elasticsearch 配置
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=
ELASTICSEARCH_INDEX_PREFIX=docsphere

# 邮件配置 (可选)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@docsphere.com

# 日志配置
LOG_LEVEL=debug
LOG_FILE=logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# 安全配置
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

#### 配置前端环境变量

编辑 `frontend/.env.local` 文件：

```bash
# API 配置
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_API_TIMEOUT=10000

# 应用配置
VITE_APP_NAME=DocSphere
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=企业文档管理系统

# 文件上传配置
VITE_MAX_FILE_SIZE=2147483648
VITE_CHUNK_SIZE=1048576
VITE_SUPPORTED_FORMATS=.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md

# 功能开关
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SENTRY=false
VITE_ENABLE_PWA=true
```

## 依赖服务启动

### 使用 Docker Compose (推荐)

我们提供了预配置的 Docker Compose 文件，可以一键启动所有依赖服务。

```bash
# 启动所有依赖服务
docker-compose up -d mysql redis elasticsearch minio

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止所有服务
docker-compose down
```

### 手动启动服务

如果不使用 Docker，您需要手动安装和启动各个服务。

#### MySQL
```bash
# 安装 MySQL (Ubuntu)
sudo apt-get install mysql-server

# 创建数据库
mysql -u root -p
CREATE DATABASE docsphere_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'docsphere'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON docsphere_dev.* TO 'docsphere'@'localhost';
FLUSH PRIVILEGES;
```

#### Redis
```bash
# 安装 Redis (Ubuntu)
sudo apt-get install redis-server

# 启动 Redis
sudo systemctl start redis
sudo systemctl enable redis
```

#### Elasticsearch
```bash
# 下载并启动 Elasticsearch
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.12.0-linux-x86_64.tar.gz
tar -xzf elasticsearch-8.12.0-linux-x86_64.tar.gz
cd elasticsearch-8.12.0/
./elasticsearch
```

#### MinIO
```bash
# 下载 MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio

# 启动 MinIO
./minio server /tmp/minio --console-address ":9001"
```

## 数据库初始化

### 1. 创建数据库表结构

```bash
cd backend

# 运行数据库迁移
pnpm run migrate

# 如果需要回滚
pnpm run migrate:rollback
```

### 2. 插入初始数据

```bash
# 运行数据种子
pnpm run seed

# 查看可用的种子文件
pnpm run seed:list
```

### 3. 创建管理员用户

```bash
# 创建管理员账户
pnpm run create-admin -- --username admin --email admin@docsphere.com --password admin123

# 或者直接运行初始化脚本
pnpm run init:admin
```

## 启动开发服务器

### 启动后端服务

```bash
cd backend

# 启动开发服务器 (热重载)
pnpm run dev

# 或者以生产模式启动
pnpm run start

# 以调试模式启动
pnpm run dev:debug
```

后端服务将在 `http://localhost:8000` 启动。

### 启动前端服务

```bash
cd frontend

# 启动开发服务器
pnpm run dev

# 或者以生产模式构建
pnpm run build

# 预览生产构建
pnpm run preview
```

前端应用将在 `http://localhost:3000` 启动。

## 验证安装

### 1. 访问应用

打开浏览器访问 `http://localhost:3000`，您应该看到 DocSphere 的登录页面。

### 2. 登录测试

使用以下管理员账户登录：
- 用户名: `admin`
- 邮箱: `admin@docsphere.com`
- 密码: `admin123`

### 3. 测试 API

访问 API 文档：`http://localhost:8000/api-docs`

测试健康检查接口：
```bash
curl http://localhost:8000/api/v1/health
```

### 4. 验证数据库连接

```bash
cd backend

# 测试数据库连接
pnpm run test:db

# 查看数据库状态
pnpm run db:status
```

## 常见问题

### 端口冲突

如果端口被占用，可以修改配置：

1. **修改后端端口**：编辑 `backend/.env` 中的 `PORT` 值
2. **修改前端端口**：编辑 `frontend/vite.config.ts` 中的 `server.port` 值
3. **或者终止占用端口的进程**：
```bash
# 查看端口占用
lsof -i :8000
lsof -i :3000

# 终止进程
kill -9 <PID>
```

### 数据库连接失败

1. 检查 MySQL 服务是否启动
2. 验证数据库配置信息
3. 确认数据库和用户已创建
4. 检查防火墙设置

### 文件上传失败

1. 检查 MinIO 服务是否启动
2. 验证 MinIO 配置信息
3. 确认存储桶已创建
4. 检查网络连接

### 搜索功能不可用

1. 确认 Elasticsearch 服务启动
2. 验证 Elasticsearch 配置
3. 检查索引是否创建成功

## 开发工具配置

### VS Code 扩展

推荐的 VS Code 扩展：

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode-remote.remote-containers",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-docker",
    "humao.rest-client"
  ]
}
```

### VS Code 工作区配置

创建 `.vscode/settings.json`：

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/coverage": true
  }
}
```

### Git Hooks 配置

启用 Git hooks 以确保代码质量：

```bash
# 安装 husky
pnpm add -D husky

# 初始化 husky
npx husky install

# 添加 pre-commit hook
npx husky add .husky/pre-commit "pnpm run lint && pnpm run test"

# 添加 commit-msg hook
npx husky add .husky/commit-msg "npx commitlint --edit $1"
```

## 下一步

恭喜！您已经成功搭建了 DocSphere 开发环境。接下来您可以：

1. **阅读文档**
   - [架构设计概述](../architecture/system-overview.md)
   - [API接口规范](../api/api-specification.md)
   - [前端架构设计](../frontend/frontend-architecture.md)

2. **开始开发**
   - [组件开发指南](../frontend/component-guide.md)
   - [数据库设计](../database/schema-design.md)
   - [测试指南](./testing.md)

3. **部署应用**
   - [部署指南](./deployment.md)
   - [Docker 部署](./docker-deployment.md)

4. **贡献代码**
   - [贡献指南](./contributing.md)
   - [代码规范](../guides/coding-standards.md)

## 获取帮助

如果在搭建过程中遇到问题：

1. **查看文档**: 首先查阅相关文档
2. **搜索 Issues**: 在 GitHub 搜索类似问题
3. **提交 Issue**: 创建新的 Issue 描述问题
4. **联系团队**: 通过邮件或即时消息联系开发团队

---

💡 **提示**: 建议定期更新依赖包，并关注安全更新。使用 `pnpm audit` 检查安全漏洞。