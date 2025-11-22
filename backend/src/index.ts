import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import config, { isDev, port, nodeEnv } from './config'
import sequelize from './config/database'
import routes from './routes'
import { logger } from './utils/logger'

const app: Application = express()

// 中间件
app.use(helmet())
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}))
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 请求日志
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  })
  next()
})

// API 路由
app.use('/api', routes)

// 健康检查
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'DocSphere API is running',
    timestamp: new Date().toISOString()
  })
})

// 404 处理
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  })
})

// 错误处理
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error:', err)
  res.status(500).json({
    success: false,
    message: isDev ? err.message : '服务器内部错误'
  })
})

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await sequelize.authenticate()
    logger.info('数据库连接成功')

    // 启动 HTTP 服务器
    app.listen(port, () => {
      logger.info(`服务器运行在端口 ${port}`)
      logger.info(`环境: ${nodeEnv}`)
      logger.info(`健康检查: http://localhost:${port}/health`)
    })
  } catch (error) {
    logger.error('启动服务器失败:', error)
    process.exit(1)
  }
}

startServer()

export default app
