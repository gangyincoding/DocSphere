import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()
const authController = new AuthController()

// 公开路由
router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/refresh-token', authController.refreshToken)

// 受保护路由
router.post('/logout', authMiddleware, authController.logout)
router.get('/verify', authMiddleware, authController.verifyToken)
router.get('/me', authMiddleware, authController.getCurrentUser)

export default router
