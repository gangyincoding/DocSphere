import winston from 'winston';
import config from '../config';

// 定义日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 定义日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// 添加颜色支持
winston.addColors(colors);

// 自定义日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`,
  ),
);

// 生产环境格式
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// 创建传输器
const transports: winston.transport[] = [
  // 控制台输出
  new winston.transports.Console({
    level: config.log.level,
    format: config.app.env === 'production' ? productionFormat : format,
  }),
];

// 文件输出（仅生产环境）
if (config.app.env === 'production' && config.log.file) {
  transports.push(
    new winston.transports.File({
      filename: config.log.file,
      level: config.log.level,
      format: productionFormat,
      maxsize: parseInt(config.log.maxSize?.replace('m', '000000') || '10485760'),
      maxFiles: parseInt(config.log.maxFiles || '5'),
    }),
  );
}

// 创建 logger 实例
export const logger = winston.createLogger({
  level: config.log.level,
  levels,
  format,
  transports,
  exitOnError: false,
});

// 开发环境下的额外配置
if (config.app.env === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }));
}

// 错误日志快捷方法
export const logError = (message: string, error?: any) => {
  logger.error(`${message}: ${error?.message || error}`);
  if (error?.stack) {
    logger.error(error.stack);
  }
};

// 信息日志快捷方法
export const logInfo = (message: string, data?: any) => {
  if (data) {
    logger.info(`${message}: ${JSON.stringify(data)}`);
  } else {
    logger.info(message);
  }
};

// 调试日志快捷方法
export const logDebug = (message: string, data?: any) => {
  if (data) {
    logger.debug(`${message}: ${JSON.stringify(data)}`);
  } else {
    logger.debug(message);
  }
};

// 警告日志快捷方法
export const logWarn = (message: string, data?: any) => {
  if (data) {
    logger.warn(`${message}: ${JSON.stringify(data)}`);
  } else {
    logger.warn(message);
  }
};