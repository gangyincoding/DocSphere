import 'reflect-metadata';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

import { sequelize } from './src/config/database';
import { logger } from './src/utils/logger';

// 导入所有模型以确保关联关系被注册
import { User } from './src/models/User';
import { Role } from './src/models/Role';
import { Permission } from './src/models/Permission';
import { UserRole } from './src/models/UserRole';
import { RolePermission } from './src/models/RolePermission';
import { Folder } from './src/models/Folder';
import { File } from './src/models/File';
import { FileShare } from './src/models/FileShare';

// 导入关联关系以确保所有模型都被初始化
import './src/models/associations';

logger.info(`✅ 已导入所有模型: ${Object.keys(sequelize.models).join(', ')}`);

/**
 * 同步数据库脚本
 * 此脚本会创建所有表（如果不存在）
 */
async function syncDatabase() {
  try {
    logger.info('开始同步数据库...');
    logger.info('正在导入模型...');

    // 测试数据库连接
    await sequelize.authenticate();
    logger.info('✅ 数据库连接成功');

    // 同步数据库（创建表）
    // force: true - 会删除现有表并重新创建（仅用于开发环境）
    // alter: true - 会修改表结构以匹配模型（更安全的选择）
    logger.info('使用 force 模式同步数据库（删除所有表并重新创建）...');
    await sequelize.sync({ force: true, logging: false });
    logger.info('✅ 使用 force 模式同步成功');

    logger.info('✅ 数据库同步成功！');

    // 列出所有表
    const tables = await sequelize.getQueryInterface().showAllTables();
    logger.info(`📋 数据库表 (${tables.length}): ${tables.join(', ')}`);

    // 验证表结构
    for (const table of tables) {
      const columns = await sequelize.getQueryInterface().describeTable(table);
      logger.info(`表 ${table} 字段: ${Object.keys(columns).join(', ')}`);
    }

    await sequelize.close();
    logger.info('✅ 数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    logger.error('❌ 数据库同步失败:', error);
    process.exit(1);
  }
}

// 执行同步
syncDatabase();
