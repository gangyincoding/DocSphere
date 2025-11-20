import { Router } from 'express'
import authRoutes from './auth.routes'

const router = Router()

// 认证路由
router.use('/auth', authRoutes)

export default router
