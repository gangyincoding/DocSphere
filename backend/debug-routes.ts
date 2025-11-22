/**
 * 路由调试脚本
 * 用于检查Express应用中注册的所有路由
 */

import express, { Application } from 'express'
import routes from './src/routes'

const app: Application = express()

// 注册路由
app.use('/api', routes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ success: true })
})

// 404处理
app.use((req, res) => {
  res.status(404).json({ success: false, message: '请求的资源不存在' })
})

// 打印所有路由
console.log('🔍 已注册的路由:')
console.log('================')

function printRoutes(stack: any[], basePath = '') {
  stack.forEach((middleware: any) => {
    if (middleware.route) {
      // 路由中间件
      const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase())
      console.log(`${methods.join(', ').padEnd(10)} ${basePath}${middleware.route.path}`)
    } else if (middleware.name === 'router' && middleware.handle.stack) {
      // 嵌套路由
      const path = middleware.regexp.toString()
        .replace('/^', '')
        .replace('\\/?(?=\\/|$)/i', '')
        .replace(/\\\//g, '/')
        .replace(/\?/g, '')
        .replace(/\(\?:\(\[\^\/]\+\?\)\)/g, ':param')

      printRoutes(middleware.handle.stack, basePath + path)
    }
  })
}

printRoutes(app._router.stack)

console.log('================')
console.log('✅ 路由打印完成')
