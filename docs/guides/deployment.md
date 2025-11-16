# 部署指南

本指南详细说明了 DocSphere 的生产环境部署流程，包括服务器准备、应用部署、监控配置等。

## 部署架构

### 推荐部署架构

```
                    [负载均衡器]
                         |
          +------------------------------+
          |                              |
      [Web服务器1]                [Web服务器2]
          |                              |
      +------------------------------+
                    |
            [应用服务器集群]
                    |
        +----------------------------+
        |          |                 |
    [MySQL]   [Redis]        [Elasticsearch]
        |          |                 |
    [存储集群]  [缓存集群]        [搜索集群]
```

### 环境要求

#### 硬件要求

**最小配置** (测试环境)
- CPU: 2 cores
- 内存: 4GB RAM
- 存储: 50GB SSD
- 网络: 100Mbps

**推荐配置** (生产环境)
- CPU: 8 cores 或更多
- 内存: 16GB RAM 或更多
- 存储: 200GB+ SSD (数据) + 1TB+ HDD (文件存储)
- 网络: 1Gbps

**企业配置** (大规模部署)
- CPU: 16+ cores
- 内存: 32GB+ RAM
- 存储: 500GB+ NVMe SSD (数据) + 10TB+ 分布式存储
- 网络: 10Gbps

#### 软件要求

- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **Node.js**: 18.0.0+ LTS
- **MySQL**: 8.0+
- **Redis**: 6.0+
- **Elasticsearch**: 8.0+
- **Nginx**: 1.18+
- **Docker**: 20.0+ (可选)
- **Kubernetes**: 1.20+ (可选)

## 服务器准备

### 1. 系统初始化

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git vim htop unzip software-properties-common

# 配置时区
sudo timedatectl set-timezone Asia/Shanghai

# 配置主机名
sudo hostnamectl set-hostname docsphere-server
```

### 2. 创建应用用户

```bash
# 创建专用用户
sudo useradd -m -s /bin/bash docsphere
sudo usermod -aG sudo docsphere

# 设置用户密码
sudo passwd docsphere

# 切换到应用用户
sudo su - docsphere
```

### 3. 安装 Node.js

```bash
# 使用 NodeSource 仓库安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version

# 安装 pnpm
npm install -g pnpm
```

### 4. 安装 Docker (可选)

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 将用户添加到 docker 组
sudo usermod -aG docker docsphere

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

## 数据库部署

### 1. MySQL 部署

```bash
# 安装 MySQL
sudo apt install -y mysql-server

# 安全配置
sudo mysql_secure_installation

# 创建数据库和用户
sudo mysql -u root -p << EOF
CREATE DATABASE docsphere_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'docsphere'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON docsphere_prod.* TO 'docsphere'@'localhost';
FLUSH PRIVILEGES;
EOF

# 配置 MySQL
sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf
```

MySQL 配置优化 (`/etc/mysql/mysql.conf.d/mysqld.cnf`)：

```ini
[mysqld]
# 基础配置
bind-address = 127.0.0.1
port = 3306
max_connections = 1000
max_connect_errors = 10000

# InnoDB 配置
innodb_buffer_pool_size = 8G
innodb_log_file_size = 256M
innodb_log_buffer_size = 16M
innodb_flush_log_at_trx_commit = 1
innodb_flush_method = O_DIRECT

# 查询缓存
query_cache_type = 1
query_cache_size = 256M
query_cache_limit = 2M

# 慢查询日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# 二进制日志
log_bin = /var/log/mysql/mysql-bin.log
expire_logs_days = 7
max_binlog_size = 100M

# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

### 2. Redis 部署

```bash
# 安装 Redis
sudo apt install -y redis-server

# 配置 Redis
sudo vim /etc/redis/redis.conf
```

Redis 配置优化 (`/etc/redis/redis.conf`)：

```conf
# 网络配置
bind 127.0.0.1
port 6379
tcp-keepalive 300

# 内存配置
maxmemory 4gb
maxmemory-policy allkeys-lru

# 持久化配置
save 900 1
save 300 10
save 60 10000
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# AOF 配置
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec

# 日志配置
loglevel notice
logfile /var/log/redis/redis-server.log

# 安全配置
requirepass your_redis_password
```

### 3. Elasticsearch 部署

```bash
# 下载 Elasticsearch
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.12.0-linux-x86_64.tar.gz
tar -xzf elasticsearch-8.12.0-linux-x86_64.tar.gz
sudo mv elasticsearch-8.12.0 /usr/local/elasticsearch
sudo chown -R docsphere:docsphere /usr/local/elasticsearch

# 配置 Elasticsearch
vim /usr/local/elasticsearch/config/elasticsearch.yml
```

Elasticsearch 配置 (`/usr/local/elasticsearch/config/elasticsearch.yml`)：

```yaml
cluster.name: docsphere-cluster
node.name: docsphere-node-1
path.data: /usr/local/elasticsearch/data
path.logs: /usr/local/elasticsearch/logs
network.host: 127.0.0.1
http.port: 9200
discovery.type: single-node

# 内存配置
bootstrap.memory_lock: true

# 安全配置
xpack.security.enabled: false
xpack.monitoring.enabled: true
```

创建系统服务：

```bash
sudo vim /etc/systemd/system/elasticsearch.service
```

```ini
[Unit]
Description=Elasticsearch
Documentation=https://www.elastic.co
Wants=network-online.target
After=network-online.target

[Service]
Type=notify
RuntimeDirectory=elasticsearch
PrivateTmp=true
Environment=ES_HOME=/usr/local/elasticsearch
Environment=ES_PATH_CONF=/usr/local/elasticsearch/config
Environment=PID_DIR=/var/run/elasticsearch
WorkingDirectory=/usr/local/elasticsearch
User=docsphere
Group=docsphere
ExecStart=/usr/local/elasticsearch/bin/elasticsearch
StandardOutput=journal
StandardError=inherit
LimitNOFILE=65535
LimitNPROC=32768
LimitAS=infinity
LimitFSIZE=infinity

[Install]
WantedBy=multi-user.target
```

```bash
# 启用并启动服务
sudo systemctl daemon-reload
sudo systemctl enable elasticsearch
sudo systemctl start elasticsearch
```

## 文件存储部署

### MinIO 部署

```bash
# 下载 MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# 创建数据目录
sudo mkdir -p /data/minio
sudo chown -R docsphere:docsphere /data/minio

# 创建配置文件
mkdir -p ~/.minio
```

MinIO 配置 (`~/.minio/config.json`)：

```json
{
  "version": "32",
  "credential": {
    "accessKey": "your-access-key",
    "secretKey": "your-secret-key"
  },
  "region": "us-east-1",
  "browser": "on",
  "logger": {
    "console": {
      "enable": true
    },
    "file": {
      "enable": false,
      "fileName": ""
    }
  },
  "notify": {
    "webhook": {
      "1": {
        "enable": false,
        "endpoint": ""
      }
    }
  }
}
```

创建 MinIO 系统服务：

```bash
sudo vim /etc/systemd/system/minio.service
```

```ini
[Unit]
Description=MinIO
Documentation=https://docs.min.io
Wants=network-online.target
After=network-online.target

[Service]
WorkingDirectory=/usr/local/
ExecStart=/usr/local/bin/minio server /data/minio --console-address ":9001"
Restart=always
User=docsphere
Group=docsphere
Environment=MINIO_ROOT_USER=your-access-key
Environment=MINIO_ROOT_PASSWORD=your-secret-key
Environment=MINIO_OPTS=--console-address ":9001"

[Install]
WantedBy=multi-user.target
```

```bash
# 启用并启动服务
sudo systemctl daemon-reload
sudo systemctl enable minio
sudo systemctl start minio
```

## 应用部署

### 1. 部署代码

```bash
# 创建应用目录
sudo mkdir -p /opt/docsphere
sudo chown docsphere:docsphere /opt/docsphere

# 克隆代码
cd /opt/docsphere
git clone https://github.com/your-org/docsphere.git .

# 安装依赖
cd /opt/docsphere/backend
pnpm install --production

cd /opt/docsphere/frontend
pnpm install --production
pnpm run build
```

### 2. 配置环境变量

生产环境配置 (`/opt/docsphere/backend/.env.production`)：

```bash
# 应用配置
NODE_ENV=production
PORT=8000
APP_NAME=DocSphere
APP_VERSION=1.0.0

# JWT 配置
JWT_SECRET=your-super-strong-jwt-secret-key-for-production
JWT_EXPIRES_IN=8h
REFRESH_TOKEN_EXPIRES_IN=7d

# 数据库配置
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=docsphere_prod
DB_USER=docsphere
DB_PASSWORD=your_strong_password
DB_CHARSET=utf8mb4
DB_TIMEZONE=+08:00
DB_CONNECTION_LIMIT=20

# Redis 配置
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
REDIS_MAX_RETRIES=3

# 文件存储配置
MINIO_ENDPOINT=127.0.0.1
MINIO_PORT=9000
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=docsphere
MINIO_USE_SSL=false
MINIO_REGION=us-east-1

# Elasticsearch 配置
ELASTICSEARCH_HOST=127.0.0.1
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=
ELASTICSEARCH_INDEX_PREFIX=docsphere

# 邮件配置
SMTP_HOST=smtp.your-domain.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=DocSphere <noreply@your-domain.com>

# 日志配置
LOG_LEVEL=info
LOG_FILE=/var/log/docsphere/app.log
LOG_MAX_SIZE=100m
LOG_MAX_FILES=30
LOG_DATE_PATTERN=YYYY-MM-DD

# 安全配置
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
SESSION_SECRET=your-session-secret-key

# 监控配置
ENABLE_METRICS=true
METRICS_PORT=9090
HEALTH_CHECK_INTERVAL=30000
```

### 3. 数据库初始化

```bash
cd /opt/docsphere/backend

# 运行数据库迁移
NODE_ENV=production pnpm run migrate:prod

# 插入初始数据
NODE_ENV=production pnpm run seed:prod

# 创建管理员用户
NODE_ENV=production pnpm run create-admin -- \
  --username admin \
  --email admin@your-domain.com \
  --password your_admin_password
```

### 4. 构建应用

```bash
# 构建后端
cd /opt/docsphere/backend
pnpm run build

# 构建前端
cd /opt/docsphere/frontend
pnpm run build
```

## 进程管理

### 1. PM2 配置

安装 PM2：

```bash
npm install -g pm2
```

创建 PM2 配置文件 (`/opt/docsphere/ecosystem.config.js`)：

```javascript
module.exports = {
  apps: [
    {
      name: 'docsphere-api',
      script: './backend/dist/index.js',
      cwd: '/opt/docsphere',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      },
      error_file: '/var/log/docsphere/api-error.log',
      out_file: '/var/log/docsphere/api-out.log',
      log_file: '/var/log/docsphere/api.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max_old_space_size=1024'
    }
  ]
};
```

创建日志目录：

```bash
sudo mkdir -p /var/log/docsphere
sudo chown docsphere:docsphere /var/log/docsphere
```

### 2. 启动应用

```bash
cd /opt/docsphere

# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u docsphere --hp /home/docsphere
```

## Nginx 配置

### 1. 安装 Nginx

```bash
sudo apt install -y nginx
```

### 2. 配置 Nginx

创建站点配置 (`/etc/nginx/sites-available/docsphere`)：

```nginx
# 重定向 HTTP 到 HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS 主站点
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 证书配置
    ssl_certificate /etc/ssl/certs/your-domain.com.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 日志配置
    access_log /var/log/nginx/docsphere.access.log;
    error_log /var/log/nginx/docsphere.error.log;

    # 前端静态文件
    location / {
        root /opt/docsphere/frontend/dist;
        try_files $uri $uri/ /index.html;

        # 缓存配置
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket 支持
    location /socket.io/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 文件上传大小限制
    client_max_body_size 2G;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
```

### 3. 启用站点

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/docsphere /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## SSL 证书配置

### 1. 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. 使用自签名证书 (开发环境)

```bash
# 创建证书目录
sudo mkdir -p /etc/ssl/private

# 生成自签名证书
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/your-domain.com.key \
    -out /etc/ssl/certs/your-domain.com.crt \
    -subj "/C=CN/ST=State/L=City/O=Organization/CN=your-domain.com"
```

## 监控和日志

### 1. 日志管理

配置日志轮转 (`/etc/logrotate.d/docsphere`)：

```
/var/log/docsphere/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 docsphere docsphere
    postrotate
        pm2 reload logs
    endscript
}

/var/log/nginx/docsphere.* {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    postrotate
        nginx -s reload
    endscript
}
```

### 2. 系统监控

安装监控工具：

```bash
# 安装 htop
sudo apt install -y htop

# 安装 iotop
sudo apt install -y iotop

# 安装 nethogs
sudo apt install -y nethogs
```

### 3. 应用监控

使用 PM2 监控：

```bash
# 查看应用状态
pm2 status

# 查看实时日志
pm2 logs

# 监控面板
pm2 monit

# 查看详细信息
pm2 show docsphere-api
```

## 备份策略

### 1. 数据库备份

创建备份脚本 (`/opt/docsphere/scripts/backup-db.sh`)：

```bash
#!/bin/bash

# 配置
BACKUP_DIR="/opt/backups/database"
DB_NAME="docsphere_prod"
DB_USER="docsphere"
DB_PASS="your_strong_password"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/docsphere_$DATE.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
mysqldump -h 127.0.0.1 -u $DB_USER -p$DB_PASS \
    --single-transaction \
    --routines \
    --triggers \
    $DB_NAME > $BACKUP_FILE

# 压缩备份文件
gzip $BACKUP_FILE

# 删除7天前的备份
find $BACKUP_DIR -name "docsphere_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: $BACKUP_FILE.gz"
```

### 2. 文件备份

创建文件备份脚本 (`/opt/docsphere/scripts/backup-files.sh`)：

```bash
#!/bin/bash

# 配置
BACKUP_DIR="/opt/backups/files"
SOURCE_DIR="/data/minio/docsphere"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/files_$DATE.tar.gz"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
tar -czf $BACKUP_FILE -C "$(dirname $SOURCE_DIR)" "$(basename $SOURCE_DIR)"

# 删除30天前的备份
find $BACKUP_DIR -name "files_*.tar.gz" -mtime +30 -delete

echo "Files backup completed: $BACKUP_FILE"
```

### 3. 设置定时备份

```bash
# 编辑 crontab
crontab -e

# 添加以下行：
# 每天凌晨2点备份数据库
0 2 * * * /opt/docsphere/scripts/backup-db.sh

# 每周日凌晨3点备份文件
0 3 * * 0 /opt/docsphere/scripts/backup-files.sh
```

## 部署验证

### 1. 功能测试

```bash
# 测试 API 健康检查
curl -f https://your-domain.com/api/v1/health

# 测试文件上传
curl -X POST -F "file=@test.txt" https://your-domain.com/api/v1/files/upload

# 测试用户认证
curl -X POST -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"your_admin_password"}' \
    https://your-domain.com/api/v1/auth/login
```

### 2. 性能测试

```bash
# 安装 Apache Bench
sudo apt install -y apache2-utils

# 进行压力测试
ab -n 1000 -c 100 https://your-domain.com/api/v1/health
```

### 3. 安全测试

```bash
# 安装 nmap
sudo apt install -y nmap

# 端口扫描
nmap -sV -sC your-domain.com

# SSL 证书检查
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

## 故障排除

### 常见问题

1. **应用无法启动**
   - 检查环境变量配置
   - 查看应用日志
   - 验证数据库连接

2. **数据库连接失败**
   - 检查数据库服务状态
   - 验证连接参数
   - 检查防火墙设置

3. **文件上传失败**
   - 检查 MinIO 服务状态
   - 验证存储配置
   - 检查磁盘空间

4. **Nginx 502 错误**
   - 检查后端服务状态
   - 验证 Nginx 配置
   - 查看错误日志

### 日志位置

- **应用日志**: `/var/log/docsphere/`
- **Nginx 日志**: `/var/log/nginx/`
- **MySQL 日志**: `/var/log/mysql/`
- **Redis 日志**: `/var/log/redis/`
- **系统日志**: `/var/log/syslog`

---

💡 **提示**: 建议使用自动化部署工具（如 Ansible、Terraform）来简化部署流程，并建立完善的监控和告警系统。