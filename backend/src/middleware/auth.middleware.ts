import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'
import { logger } from '../utils/logger'

export const authService = new AuthService()

/**
 * 认证中间件 - 验证 JWT 令牌
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 从请求头获取令牌
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      })
      return
    }

    // 提取令牌
    const token = authHeader.substring(7) // 移除 "Bearer " 前缀

    // 验证令牌
    const decoded = authService.verifyAccessToken(token)

    // 将用户信息附加到请求对象
    ;(req as any).user = decoded

    next()
  } catch (error: any) {
    logger.error('认证失败:', error)
    res.status(401).json({
      success: false,
      message: '认证令牌无效或已过期'
    })
  }
}
