# 数据库迁移指南

本文档详细说明了 DocSphere 数据库的迁移策略、脚本和最佳实践，确保数据库结构的安全更新和数据一致性。

## 迁移系统概述

### 迁移工具
我们使用 [Umzug](https://github.com/sequelize/umzug) 作为数据库迁移工具，它提供了强大的迁移管理功能：

- **版本控制**: 跟踪数据库版本和迁移历史
- **回滚支持**: 支持迁移的回滚操作
- **环境隔离**: 不同环境的独立迁移管理
- **自动化**: 支持CI/CD集成

### 迁移文件命名规范
```
migrations/
├── 20240101000001-create-users-table.js
├── 20240101000002-create-departments-table.js
├── 20240101000003-create-folders-table.js
├── 20240101000004-create-files-table.js
├── 20240101000005-create-permissions-table.js
├── 20240101000006-create-shares-table.js
├── 20240101000007-create-operation-logs-table.js
└── 20240101000008-create-indexes.js
```

文件名格式：`YYYYMMDDHHMMSS-descriptive-name.js`

## 迁移命令

### 基本命令
```bash
# 查看待执行的迁移
pnpm run migrate:pending

# 执行所有待执行的迁移
pnpm run migrate:up

# 回滚最后一次迁移
pnpm run migrate:down

# 回滚到指定版本
pnpm run migrate:undo -- --to 20240101000005

# 查看迁移历史
pnpm run migrate:status

# 创建新的迁移文件
pnpm run migrate:create -- --name add-new-feature
```

### 生产环境命令
```bash
# 生产环境执行迁移（需要确认）
pnpm run migrate:prod

# 生产环境回滚（需要确认）
pnpm run migrate:rollback-prod

# 备份数据库后执行迁移
pnpm run migrate:backup-up
```

## 初始化迁移

### 创建数据库
```javascript
// migrations/20240101000000-create-database.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createDatabase('docsphere');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropDatabase('docsphere');
  }
};
```

### 用户表迁移
```javascript
// migrations/20240101000001-create-users-table.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        comment: '用户ID'
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '用户名'
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: '邮箱'
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: '密码哈希'
      },
      salt: {
        type: Sequelize.STRING(64),
        allowNull: false,
        comment: '密码盐值'
      },
      full_name: {
        type: Sequelize.STRING(100),
        comment: '全名'
      },
      avatar_url: {
        type: Sequelize.STRING(255),
        comment: '头像URL'
      },
      phone: {
        type: Sequelize.STRING(20),
        comment: '手机号码'
      },
      role: {
        type: Sequelize.ENUM('admin', 'user', 'guest'),
        defaultValue: 'user',
        comment: '用户角色'
      },
      department_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: '部门ID'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active',
        comment: '用户状态'
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '最后登录时间'
      },
      last_login_ip: {
        type: Sequelize.STRING(45),
        comment: '最后登录IP'
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: '邮箱是否验证'
      },
      phone_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: '手机是否验证'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '创建时间'
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        comment: '更新时间'
      }
    });

    // 创建索引
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['department_id']);
    await queryInterface.addIndex('users', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
```

## 数据变更迁移

### 添加新字段
```javascript
// migrations/20240102000001-add-user-preferences.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'preferences', {
      type: Sequelize.JSON,
      defaultValue: {},
      comment: '用户偏好设置'
    });

    await queryInterface.addColumn('users', 'language', {
      type: Sequelize.STRING(10),
      defaultValue: 'zh-CN',
      comment: '用户语言偏好'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'preferences');
    await queryInterface.removeColumn('users', 'language');
  }
};
```

### 修改字段类型
```javascript
// migrations/20240102000002-update-file-size-type.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 先创建新字段
    await queryInterface.addColumn('files', 'file_size_bigint', {
      type: Sequelize.BIGINT,
      allowNull: true,
      comment: '文件大小(字节)-新'
    });

    // 迁移数据
    await queryInterface.sequelize.query(`
      UPDATE files
      SET file_size_bigint = CAST(file_size AS UNSIGNED BIGINT)
    `);

    // 删除旧字段
    await queryInterface.removeColumn('files', 'file_size');

    // 重命名新字段
    await queryInterface.renameColumn('files', 'file_size_bigint', 'file_size');

    // 设置为非空
    await queryInterface.changeColumn('files', 'file_size', {
      type: Sequelize.BIGINT,
      allowNull: false,
      comment: '文件大小(字节)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 回滚操作
    await queryInterface.changeColumn('files', 'file_size', {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: '文件大小(字节)'
    });
  }
};
```

### 数据迁移
```javascript
// migrations/20240103000001-migrate-file-permissions.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 创建新的权限表结构
    await queryInterface.createTable('resource_permissions_v2', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: '用户ID'
      },
      resource_type: {
        type: Sequelize.ENUM('file', 'folder', 'share'),
        allowNull: false,
        comment: '资源类型'
      },
      resource_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: '资源ID'
      },
      permission_type: {
        type: Sequelize.ENUM('read', 'write', 'delete', 'share', 'admin'),
        allowNull: false,
        comment: '权限类型'
      },
      granted_by: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: '授权者ID'
      },
      is_inherited: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: '是否继承权限'
      },
      inherit_from_resource_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: '继承自资源ID'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '权限过期时间'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // 迁移现有权限数据
    await queryInterface.sequelize.query(`
      INSERT INTO resource_permissions_v2 (
        user_id, resource_type, resource_id,
        permission_type, granted_by, is_inherited,
        created_at, updated_at
      )
      SELECT
        user_id,
        CASE
          WHEN resource_type = 'file' THEN 'file'
          WHEN resource_type = 'folder' THEN 'folder'
          ELSE 'share'
        END as resource_type,
        resource_id,
        permission_type,
        granted_by,
        false as is_inherited,
        created_at,
        updated_at
      FROM resource_permissions
    `);

    // 创建索引
    await queryInterface.addIndex('resource_permissions_v2', ['user_id']);
    await queryInterface.addIndex('resource_permissions_v2', ['resource_type', 'resource_id']);
    await queryInterface.addIndex('resource_permissions_v2', ['granted_by']);

    // 重命名表
    await queryInterface.dropTable('resource_permissions');
    await queryInterface.renameTable('resource_permissions_v2', 'resource_permissions');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('resource_permissions');

    // 重新创建旧表结构
    await queryInterface.createTable('resource_permissions', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      resource_type: {
        type: Sequelize.ENUM('file', 'folder'),
        allowNull: false
      },
      resource_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      permission_type: {
        type: Sequelize.ENUM('read', 'write', 'delete', 'share', 'admin'),
        allowNull: false
      },
      granted_by: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  }
};
```

## 索引优化迁移

### 添加索引
```javascript
// migrations/20240104000001-add-performance-indexes.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 文件表索引优化
    await queryInterface.addIndex('files',
      ['folder_id', 'is_deleted', 'uploaded_at'],
      {
        name: 'idx_folder_deleted_time',
        indexType: 'BTREE'
      }
    );

    await queryInterface.addIndex('files',
      ['owner_id', 'is_deleted'],
      {
        name: 'idx_owner_deleted',
        indexType: 'BTREE'
      }
    );

    // 权限表索引优化
    await queryInterface.addIndex('resource_permissions',
      ['user_id', 'resource_type', 'resource_id', 'permission_type'],
      {
        name: 'idx_unique_permission',
        unique: true
      }
    );

    // 操作日志表索引优化
    await queryInterface.addIndex('operation_logs',
      ['user_id', 'created_at'],
      {
        name: 'idx_user_time'
      }
    );

    await queryInterface.addIndex('operation_logs',
      ['action', 'created_at'],
      {
        name: 'idx_action_time'
      }
    );

    // 分享表索引优化
    await queryInterface.addIndex('shares',
      ['share_token', 'is_active', 'expire_at'],
      {
        name: 'idx_token_active_expire'
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('files', 'idx_folder_deleted_time');
    await queryInterface.removeIndex('files', 'idx_owner_deleted');
    await queryInterface.removeIndex('resource_permissions', 'idx_unique_permission');
    await queryInterface.removeIndex('operation_logs', 'idx_user_time');
    await queryInterface.removeIndex('operation_logs', 'idx_action_time');
    await queryInterface.removeIndex('shares', 'idx_token_active_expire');
  }
};
```

### 全文索引
```javascript
// migrations/20240104000002-add-fulltext-indexes.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 为文件表添加全文索引
    await queryInterface.addIndex(
      'files',
      ['name', 'original_name'],
      {
        name: 'idx_file_fulltext',
        type: 'FULLTEXT'
      }
    );

    // 为操作日志表添加全文索引
    await queryInterface.addIndex(
      'operation_logs',
      ['description'],
      {
        name: 'idx_log_fulltext',
        type: 'FULLTEXT'
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('files', 'idx_file_fulltext');
    await queryInterface.removeIndex('operation_logs', 'idx_log_fulltext');
  }
};
```

## 分区表迁移

### 创建分区表
```javascript
// migrations/20240105000001-create-partitioned-tables.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 操作日志表按月分区
    await queryInterface.sequelize.query(`
      ALTER TABLE operation_logs
      PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
        PARTITION p202401 VALUES LESS THAN (202402),
        PARTITION p202402 VALUES LESS THAN (202403),
        PARTITION p202403 VALUES LESS THAN (202404),
        PARTITION p202404 VALUES LESS THAN (202405),
        PARTITION p202405 VALUES LESS THAN (202406),
        PARTITION p202406 VALUES LESS THAN (202407),
        PARTITION p202407 VALUES LESS THAN (202408),
        PARTITION p202408 VALUES LESS THAN (202409),
        PARTITION p202409 VALUES LESS THAN (202410),
        PARTITION p202410 VALUES LESS THAN (202411),
        PARTITION p202411 VALUES LESS THAN (202412),
        PARTITION p202412 VALUES LESS THAN (202501),
        PARTITION p_future VALUES LESS THAN MAXVALUE
      )
    `);

    // 分享访问日志表按月分区
    await queryInterface.sequelize.query(`
      ALTER TABLE share_access_logs
      PARTITION BY RANGE (YEAR(access_time) * 100 + MONTH(access_time)) (
        PARTITION p202401 VALUES LESS THAN (202402),
        PARTITION p202402 VALUES LESS THAN (202403),
        PARTITION p202403 VALUES LESS THAN (202404),
        PARTITION p202404 VALUES LESS THAN (202405),
        PARTITION p202405 VALUES LESS THAN (202406),
        PARTITION p202406 VALUES LESS THAN (202407),
        PARTITION p202407 VALUES LESS THAN (202408),
        PARTITION p202408 VALUES LESS THAN (202409),
        PARTITION p202409 VALUES LESS THAN (202410),
        PARTITION p202410 VALUES LESS THAN (202411),
        PARTITION p202411 VALUES LESS THAN (202412),
        PARTITION p202412 VALUES LESS THAN (202501),
        PARTITION p_future VALUES LESS THAN MAXVALUE
      )
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // 移除分区
    await queryInterface.sequelize.query(`
      ALTER TABLE operation_logs REMOVE PARTITIONING
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE share_access_logs REMOVE PARTITIONING
    `);
  }
};
```

## 数据备份和恢复

### 自动备份脚本
```javascript
// scripts/backup-before-migrate.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DatabaseBackup {
  constructor(config) {
    this.config = config;
    this.backupDir = path.join(process.cwd(), 'backups');
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `docsphere-${timestamp}.sql`);

    // 确保备份目录存在
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const command = `
      mysqldump \
        -h ${this.config.host} \
        -P ${this.config.port} \
        -u ${this.config.username} \
        -p${this.config.password} \
        --single-transaction \
        --routines \
        --triggers \
        ${this.config.database} > ${backupFile}
    `;

    try {
      console.log('开始备份数据库...');
      execSync(command, { stdio: 'inherit' });

      // 压缩备份文件
      const compressedFile = `${backupFile}.gz`;
      execSync(`gzip ${backupFile}`, { stdio: 'inherit' });

      console.log(`数据库备份完成: ${compressedFile}`);
      return compressedFile;
    } catch (error) {
      console.error('数据库备份失败:', error.message);
      throw error;
    }
  }

  async restoreBackup(backupFile) {
    const command = `
      gunzip < ${backupFile} | \
      mysql \
        -h ${this.config.host} \
        -P ${this.config.port} \
        -u ${this.config.username} \
        -p${this.config.password} \
        ${this.config.database}
    `;

    try {
      console.log('开始恢复数据库...');
      execSync(command, { stdio: 'inherit' });
      console.log('数据库恢复完成');
    } catch (error) {
      console.error('数据库恢复失败:', error.message);
      throw error;
    }
  }
}

module.exports = DatabaseBackup;
```

## 环境配置

### 迁移配置
```javascript
// config/migration.js
module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'docsphere_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log,
    migrationStorageTableName: 'sequelize_meta',
    seederStorageTableName: 'sequelize_data'
  },

  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'docsphere_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    migrationStorageTableName: 'sequelize_meta'
  },

  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    migrationStorageTableName: 'sequelize_meta',
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    }
  }
};
```

## 最佳实践

### 迁移开发规范

1. **原子性操作**
   ```javascript
   // ✅ 好的做法：将相关操作放在一个迁移文件中
   module.exports = {
     up: async (queryInterface, Sequelize) => {
       await queryInterface.addColumn('users', 'new_field', {
         type: Sequelize.STRING,
         allowNull: true
       });

       await queryInterface.sequelize.query(`
         UPDATE users SET new_field = 'default_value' WHERE new_field IS NULL
       `);

       await queryInterface.changeColumn('users', 'new_field', {
         type: Sequelize.STRING,
         allowNull: false
       });
     }
   };
   ```

2. **数据安全**
   ```javascript
   // ✅ 在重要操作前检查数据
   module.exports = {
     up: async (queryInterface, Sequelize) => {
       // 检查表中是否有数据
       const [results] = await queryInterface.sequelize.query(
         'SELECT COUNT(*) as count FROM important_table'
       );

       if (results[0].count > 0) {
         console.warn('表中有数据，请谨慎操作');
       }

       await queryInterface.dropTable('important_table');
     }
   };
   ```

3. **性能考虑**
   ```javascript
   // ✅ 大表操作分批进行
   module.exports = {
     up: async (queryInterface, Sequelize) => {
       const batchSize = 1000;
       let offset = 0;

       while (true) {
         const results = await queryInterface.sequelize.query(`
           SELECT id FROM large_table
           LIMIT ${batchSize} OFFSET ${offset}
         `);

         if (results[0].length === 0) break;

         // 处理这批数据
         for (const row of results[0]) {
           await queryInterface.sequelize.query(`
             UPDATE large_table SET processed = true WHERE id = ${row.id}
           `);
         }

         offset += batchSize;
       }
     }
   };
   ```

### 错误处理

1. **回滚策略**
   ```javascript
   // ✅ 提供完整的回滚操作
   module.exports = {
     up: async (queryInterface, Sequelize) => {
       try {
         await queryInterface.addColumn('users', 'temporary_field', {
           type: Sequelize.STRING,
           allowNull: true
         });

         // 执行数据迁移
         await migrateData();

       } catch (error) {
         // 如果失败，清理已创建的字段
         try {
           await queryInterface.removeColumn('users', 'temporary_field');
         } catch (cleanupError) {
           console.error('清理失败:', cleanupError);
         }
         throw error;
       }
     },

     down: async (queryInterface, Sequelize) => {
       await queryInterface.removeColumn('users', 'temporary_field');
     }
   };
   ```

2. **日志记录**
   ```javascript
   // ✅ 记录迁移过程中的重要信息
   module.exports = {
     up: async (queryInterface, Sequelize) => {
       console.log('开始迁移数据...');

       const startTime = Date.now();
       const [result] = await queryInterface.sequelize.query(`
         UPDATE users SET status = 'active' WHERE status IS NULL
       `);

       const endTime = Date.now();
       console.log(`数据迁移完成，影响 ${result.affectedRows} 行，耗时 ${endTime - startTime}ms`);
     }
   };
   ```

## 故障排除

### 常见问题

1. **迁移卡住**
   ```bash
   # 检查迁移状态
   pnpm run migrate:status

   # 强制重置迁移状态（谨慎使用）
   pnpm run migrate:reset
   ```

2. **外键约束问题**
   ```javascript
   // ✅ 临时禁用外键检查
   module.exports = {
     up: async (queryInterface, Sequelize) => {
       await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

       try {
         await queryInterface.dropTable('table_with_foreign_keys');
       } finally {
         await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
       }
     }
   };
   ```

3. **大表操作超时**
   ```javascript
   // ✅ 设置合适的超时时间
   module.exports = {
     up: async (queryInterface, Sequelize) => {
       await queryInterface.sequelize.query('SET SESSION innodb_lock_wait_timeout = 300');
       await queryInterface.sequelize.query('SET SESSION lock_wait_timeout = 300');

       // 执行大表操作
       await queryInterface.changeColumn('large_table', 'big_column', {
         type: Sequelize.TEXT
       });
     }
   };
   ```

---

💡 **提示**: 在生产环境执行迁移前，请务必备份数据库，并在测试环境中充分验证迁移脚本。