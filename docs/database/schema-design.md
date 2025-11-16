# 数据库设计

## 数据库概述

DocSphere采用MySQL作为主数据库，Redis作为缓存层，Elasticsearch提供搜索功能。数据库设计遵循以下原则：
- 数据规范化，避免数据冗余
- 合理的索引设计，优化查询性能
- 支持水平扩展和数据分片
- 完整的审计日志记录

## 核心表结构设计

### 1. 用户相关表

#### users (用户表)
存储系统用户的基本信息和认证数据。

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    email VARCHAR(100) UNIQUE NOT NULL COMMENT '邮箱',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    salt VARCHAR(64) NOT NULL COMMENT '密码盐值',
    full_name VARCHAR(100) COMMENT '全名',
    avatar_url VARCHAR(255) COMMENT '头像URL',
    phone VARCHAR(20) COMMENT '手机号码',
    role ENUM('admin', 'user', 'guest') DEFAULT 'user' COMMENT '用户角色',
    department_id BIGINT NULL COMMENT '部门ID',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' COMMENT '用户状态',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    last_login_ip VARCHAR(45) COMMENT '最后登录IP',
    email_verified BOOLEAN DEFAULT FALSE COMMENT '邮箱是否验证',
    phone_verified BOOLEAN DEFAULT FALSE COMMENT '手机是否验证',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_department (department_id),
    INDEX idx_status (status),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

#### departments (部门表)
组织架构信息，支持层级结构。

```sql
CREATE TABLE departments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '部门ID',
    name VARCHAR(100) NOT NULL COMMENT '部门名称',
    description TEXT COMMENT '部门描述',
    parent_id BIGINT NULL COMMENT '父部门ID',
    level INT DEFAULT 1 COMMENT '部门层级',
    sort_order INT DEFAULT 0 COMMENT '排序',
    leader_id BIGINT NULL COMMENT '部门负责人ID',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '部门状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_parent (parent_id),
    INDEX idx_leader (leader_id),
    INDEX idx_level (level),
    FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表';
```

### 2. 文件管理相关表

#### folders (文件夹表)
存储文件夹的层级结构和基本信息。

```sql
CREATE TABLE folders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '文件夹ID',
    name VARCHAR(255) NOT NULL COMMENT '文件夹名称',
    parent_id BIGINT NULL COMMENT '父文件夹ID',
    owner_id BIGINT NOT NULL COMMENT '所有者ID',
    path VARCHAR(1000) NOT NULL COMMENT '完整路径',
    level INT DEFAULT 1 COMMENT '层级深度',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',
    deleted_by BIGINT NULL COMMENT '删除者ID',
    deleted_at TIMESTAMP NULL COMMENT '删除时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    UNIQUE KEY unique_folder_path (path, is_deleted),
    INDEX idx_parent (parent_id),
    INDEX idx_owner (owner_id),
    INDEX idx_path (path),
    INDEX idx_deleted (is_deleted),
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件夹表';
```

#### files (文件表)
存储文件的元数据和基本信息。

```sql
CREATE TABLE files (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '文件ID',
    name VARCHAR(255) NOT NULL COMMENT '文件名',
    original_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
    file_path VARCHAR(1000) NOT NULL COMMENT '文件存储路径',
    file_size BIGINT NOT NULL COMMENT '文件大小(字节)',
    mime_type VARCHAR(100) NOT NULL COMMENT 'MIME类型',
    file_hash VARCHAR(64) NOT NULL COMMENT '文件哈希值(SHA256)',
    file_extension VARCHAR(10) COMMENT '文件扩展名',
    folder_id BIGINT NULL COMMENT '所属文件夹ID',
    owner_id BIGINT NOT NULL COMMENT '所有者ID',
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',
    deleted_by BIGINT NULL COMMENT '删除者ID',
    deleted_at TIMESTAMP NULL COMMENT '删除时间',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    preview_count INT DEFAULT 0 COMMENT '预览次数',
    is_public BOOLEAN DEFAULT FALSE COMMENT '是否公开',
    tags JSON COMMENT '文件标签',
    metadata JSON COMMENT '扩展元数据',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    UNIQUE KEY unique_file_hash (file_hash, folder_id, is_deleted),
    INDEX idx_folder (folder_id),
    INDEX idx_owner (owner_id),
    INDEX idx_name (name),
    INDEX idx_original_name (original_name),
    INDEX idx_mime_type (mime_type),
    INDEX idx_upload_time (upload_time),
    INDEX idx_deleted (is_deleted),
    INDEX idx_file_hash (file_hash),
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件表';
```

### 3. 权限管理相关表

#### permissions (权限表)
细粒度的资源权限控制。

```sql
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '权限ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    resource_type ENUM('folder', 'file') NOT NULL COMMENT '资源类型',
    resource_id BIGINT NOT NULL COMMENT '资源ID',
    permission_type ENUM('read', 'write', 'delete', 'share', 'admin') NOT NULL COMMENT '权限类型',
    granted_by BIGINT NOT NULL COMMENT '授权者ID',
    is_inherited BOOLEAN DEFAULT FALSE COMMENT '是否继承权限',
    expires_at TIMESTAMP NULL COMMENT '权限过期时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    UNIQUE KEY unique_permission (user_id, resource_type, resource_id, permission_type),
    INDEX idx_user (user_id),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_granted_by (granted_by),
    INDEX idx_expires (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';
```

#### role_permissions (角色权限表)
基于角色的权限管理。

```sql
CREATE TABLE role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
    permission_name VARCHAR(100) NOT NULL COMMENT '权限名称',
    resource_type VARCHAR(50) COMMENT '资源类型',
    description TEXT COMMENT '权限描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    UNIQUE KEY unique_role_permission (role_name, permission_name, resource_type),
    INDEX idx_role (role_name),
    INDEX idx_permission (permission_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限表';
```

### 4. 分享相关表

#### shares (分享记录表)
文件分享链接管理。

```sql
CREATE TABLE shares (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '分享ID',
    file_id BIGINT NOT NULL COMMENT '文件ID',
    shared_by BIGINT NOT NULL COMMENT '分享者ID',
    share_token VARCHAR(64) UNIQUE NOT NULL COMMENT '分享令牌',
    password_hash VARCHAR(255) NULL COMMENT '访问密码哈希',
    expire_at TIMESTAMP NULL COMMENT '过期时间',
    download_limit INT NULL COMMENT '下载次数限制',
    download_count INT DEFAULT 0 COMMENT '已下载次数',
    view_count INT DEFAULT 0 COMMENT '查看次数',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    allowed_ips JSON COMMENT '允许访问的IP列表',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_file (file_id),
    INDEX idx_shared_by (shared_by),
    INDEX idx_token (share_token),
    INDEX idx_expire (expire_at),
    INDEX idx_active (is_active),
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分享记录表';
```

#### share_access_logs (分享访问日志表)
分享链接访问记录。

```sql
CREATE TABLE share_access_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    share_id BIGINT NOT NULL COMMENT '分享ID',
    access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '访问时间',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    referrer VARCHAR(255) COMMENT '来源页面',
    action ENUM('view', 'download') NOT NULL COMMENT '访问动作',

    INDEX idx_share (share_id),
    INDEX idx_access_time (access_time),
    INDEX idx_ip (ip_address),
    FOREIGN KEY (share_id) REFERENCES shares(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分享访问日志表';
```

### 5. 系统相关表

#### operation_logs (操作日志表)
用户操作审计日志。

```sql
CREATE TABLE operation_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    action ENUM('upload', 'download', 'delete', 'rename', 'move', 'share', 'login', 'logout') NOT NULL COMMENT '操作类型',
    resource_type ENUM('file', 'folder', 'share', 'user') NOT NULL COMMENT '资源类型',
    resource_id BIGINT NULL COMMENT '资源ID',
    resource_name VARCHAR(255) COMMENT '资源名称',
    description TEXT COMMENT '操作描述',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    session_id VARCHAR(64) COMMENT '会话ID',
    result ENUM('success', 'failure') NOT NULL COMMENT '操作结果',
    error_message TEXT COMMENT '错误信息',
    extra_data JSON COMMENT '额外数据',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created (created_at),
    INDEX idx_ip (ip_address),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';
```

#### system_configs (系统配置表)
系统配置参数管理。

```sql
CREATE TABLE system_configs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
    config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    config_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string' COMMENT '配置类型',
    description TEXT COMMENT '配置描述',
    is_public BOOLEAN DEFAULT FALSE COMMENT '是否公开',
    created_by BIGINT COMMENT '创建者ID',
    updated_by BIGINT COMMENT '更新者ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_key (config_key),
    INDEX idx_public (is_public),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';
```

## 索引设计策略

### 主要索引

#### 1. 单列索引
- 用户表: username, email, department_id, status
- 文件表: folder_id, owner_id, file_hash, mime_type
- 权限表: user_id, resource_type + resource_id
- 日志表: user_id, action, created_at

#### 2. 复合索引
- 文件表: (folder_id, is_deleted, created_at)
- 权限表: (user_id, resource_type, resource_id, permission_type)
- 分享表: (share_token, is_active, expire_at)

#### 3. 全文索引
- 文件表: original_name, name (用于文件搜索)
- 操作日志表: description (用于日志搜索)

### 索引优化建议

1. **避免过度索引**: 每个表不超过5-7个索引
2. **监控索引使用情况**: 定期分析慢查询日志
3. **索引维护**: 定期重建索引，优化索引碎片
4. **覆盖索引**: 设计包含查询所需所有字段的索引

## 数据分区策略

### 按时间分区

```sql
-- 操作日志表按月分区
ALTER TABLE operation_logs PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202401 VALUES LESS THAN (202402),
    PARTITION p202402 VALUES LESS THAN (202403),
    PARTITION p202403 VALUES LESS THAN (202404),
    -- ... 其他分区
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### 分区优势
1. **提高查询性能**: 时间范围查询效率高
2. **便于数据归档**: 历史数据可单独处理
3. **优化存储**: 冷热数据分离存储

## 数据备份策略

### 备份类型
1. **全量备份**: 每日凌晨进行全量备份
2. **增量备份**: 每小时进行增量备份
3. **binlog备份**: 实时备份binlog文件

### 备份保留策略
- 全量备份: 保留30天
- 增量备份: 保留7天
- binlog文件: 保留3天

### 恢复策略
1. **时间点恢复**: 基于binlog的精确时间点恢复
2. **主从恢复**: 从库快速切换为主库
3. **跨区域恢复**: 异地备份恢复

## 性能优化建议

### 查询优化
1. **避免SELECT \***: 只查询需要的字段
2. **合理使用索引**: 为常用查询条件创建索引
3. **分页查询**: 使用LIMIT进行分页
4. **避免子查询**: 使用JOIN替代子查询

### 表结构优化
1. **字段类型选择**: 使用合适的字段类型
2. **NOT NULL约束**: 尽可能使用NOT NULL约束
3. **字符集选择**: 使用utf8mb4字符集
4. **表引擎选择**: 使用InnoDB引擎

### 读写分离
1. **主库写入**: 所有写操作在主库执行
2. **从库读取**: 读操作分散到多个从库
3. **读写分离中间件**: 使用ProxySQL等中间件

## 监控和维护

### 数据库监控指标
- QPS/TPS: 每秒查询/事务数
- 连接数: 当前连接数和最大连接数
- 慢查询: 执行时间超过阈值的查询
- 缓存命中率: Buffer Pool命中率
- 锁等待: 表锁和行锁等待情况

### 定期维护任务
1. **统计信息更新**: 定期更新表统计信息
2. **索引优化**: 分析和优化索引使用
3. **表优化**: 定期执行OPTIMIZE TABLE
4. **日志清理**: 定期清理二进制日志