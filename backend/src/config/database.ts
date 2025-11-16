import { Sequelize } from 'sequelize';
import config from './index';
import { logger } from '../utils/logger';

// 创建 Sequelize 实例
const sequelize = new Sequelize({
  database: config.database.name,
  username: config.database.user,
  password: config.database.password,
  host: config.database.host,
  port: config.database.port,
  dialect: 'mysql',
  dialectOptions: {
    charset: config.database.charset,
    timezone: config.database.timezone,
  },
  logging: config.app.env === 'development' ? (msg: string) => logger.debug(msg) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('数据库连接成功');
  } catch (error) {
    logger.error('数据库连接失败:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info('数据库连接已关闭');
  } catch (error) {
    logger.error('关闭数据库连接失败:', error);
    throw error;
  }
};

export const syncDatabase = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.sync({ force });
    logger.info('数据库同步完成');
  } catch (error) {
    logger.error('数据库同步失败:', error);
    throw error;
  }
};

export { sequelize };
export default sequelize;