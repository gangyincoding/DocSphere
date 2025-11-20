import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'
import { logger } from '../utils/logger'

export class AuthController {
  private authService: AuthService

  constructor() {
    this.authService = new AuthService()
  }

  /**
   * 用户注册
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, email, password } = req.body

      // 参数验证
      if (!username || !email || !password) {
        res.status(400).json({
          success: false,
          message: '用户名、邮箱和密码不能为空'
        })
        return
      }

      const result = await this.authService.register({ username, email, password })

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: result
      })
    } catch (error: any) {
      logger.error('注册失败:', error)
      res.status(400).json({
        success: false,
        message: error.message || '注册失败'
      })
    }
  }

  /**
   * 用户登录
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, password } = req.body

      // 参数验证
      if (!username || !password) {
        res.status(400).json({
          success: false,
          message: '用户名和密码不能为空'
        })
        return
      }

      const result = await this.authService.login({ username, password })

      res.json({
        success: true,
        message: '登录成功',
        data: result
      })
    } catch (error: any) {
      logger.error('登录失败:', error)
      res.status(401).json({
        success: false,
        message: error.message || '登录失败'
      })
    }
  }

  /**
   * 刷新访问令牌
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh Token 不能为空'
        })
        return
      }

      const result = await this.authService.refreshToken(refreshToken)

      res.json({
        success: true,
        message: '令牌刷新成功',
        data: result
      })
    } catch (error: any) {
      logger.error('刷新令牌失败:', error)
      res.status(401).json({
        success: false,
        message: error.message || '刷新令牌失败'
      })
    }
  }

  /**
   * 用户登出
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id

      if (userId) {
        await this.authService.logout(userId)
      }

      res.json({
        success: true,
        message: '登出成功'
      })
    } catch (error: any) {
      logger.error('登出失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '登出失败'
      })
    }
  }

  /**
   * 验证令牌
   */
  verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user

      res.json({
        success: true,
        message: '令牌有效',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        }
      })
    } catch (error: any) {
      logger.error('验证令牌失败:', error)
      res.status(401).json({
        success: false,
        message: error.message || '验证令牌失败'
      })
    }
  }

  /**
   * 获取当前用户信息
   */
  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id

      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未授权'
        })
        return
      }

      const user = await this.authService.getUserById(userId)

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      })
    } catch (error: any) {
      logger.error('获取用户信息失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '获取用户信息失败'
      })
    }
  }
}
