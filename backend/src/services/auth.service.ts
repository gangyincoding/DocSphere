import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'
import config from '../config'
import { logger } from '../utils/logger'

interface RegisterData {
  username: string
  email: string
  password: string
}

interface LoginData {
  username: string
  password: string
}

interface TokenPayload {
  id: number
  username: string
  email: string
}

export class AuthService {
  /**
   * 用户注册
   */
  async register(data: RegisterData) {
    const { username, email, password } = data

    // 检查用户名是否已存在
    const existingUser = await User.findOne({
      where: { username }
    })

    if (existingUser) {
      throw new Error('用户名已存在')
    }

    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({
      where: { email }
    })

    if (existingEmail) {
      throw new Error('邮箱已被使用')
    }

    // 创建用户（password 会被 hook 自动加密）
    const user = await User.create({
      username,
      email,
      password
    })

    // 生成令牌
    const tokens = this.generateTokens({
      id: user.id,
      username: user.username,
      email: user.email
    })

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      ...tokens
    }
  }

  /**
   * 用户登录
   */
  async login(data: LoginData) {
    const { username, password } = data

    // 查找用户
    const user = await User.findOne({
      where: { username }
    })

    if (!user) {
      throw new Error('用户名或密码错误')
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw new Error('用户名或密码错误')
    }

    // 生成令牌
    const tokens = this.generateTokens({
      id: user.id,
      username: user.username,
      email: user.email
    })

    // 更新最后登录时间
    await user.update({
      lastLoginAt: new Date()
    })

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      ...tokens
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(refreshToken: string) {
    try {
      // 验证 refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload

      // 查找用户
      const user = await User.findByPk(decoded.id)

      if (!user) {
        throw new Error('用户不存在')
      }

      // 生成新的令牌
      const tokens = this.generateTokens({
        id: user.id,
        username: user.username,
        email: user.email
      })

      return tokens
    } catch (error) {
      logger.error('刷新令牌失败:', error)
      throw new Error('无效的 Refresh Token')
    }
  }

  /**
   * 用户登出
   */
  async logout(userId: number) {
    // 这里可以实现 token 黑名单等逻辑
    logger.info(`用户 ${userId} 已登出`)
    return true
  }

  /**
   * 根据 ID 获取用户
   */
  async getUserById(userId: number) {
    const user = await User.findByPk(userId)

    if (!user) {
      throw new Error('用户不存在')
    }

    return user
  }

  /**
   * 验证访问令牌
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload
    } catch (error) {
      throw new Error('无效的访问令牌')
    }
  }

  /**
   * 生成访问令牌和刷新令牌
   */
  private generateTokens(payload: TokenPayload) {
    const accessToken = (jwt as any).sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    })

    const refreshToken = (jwt as any).sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    })

    return {
      accessToken,
      refreshToken
    }
  }
}
