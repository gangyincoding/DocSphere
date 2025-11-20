import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AuthService } from './auth.service'
import { User } from '../models/User'
import config from '../config'

// Mock dependencies
jest.mock('../models/User')
jest.mock('bcryptjs')
jest.mock('jsonwebtoken')

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    authService = new AuthService()
    jest.clearAllMocks()
  })

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      // Arrange - 准备测试数据
      const registerData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123456'
      }

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword'
      }

      ;(User.findOne as jest.Mock).mockResolvedValue(null)
      ;(User.create as jest.Mock).mockResolvedValue(mockUser)
      ;(jwt.sign as jest.Mock).mockReturnValue('mock-token')

      // Act - 执行被测代码
      const result = await authService.register(registerData)

      // Assert - 验证结果
      expect(User.findOne).toHaveBeenCalledTimes(2) // 检查用户名和邮箱
      expect(User.create).toHaveBeenCalledWith({
        username: registerData.username,
        email: registerData.email,
        password: registerData.password
      })
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result.user.username).toBe('testuser')
    })

    it('应该在用户名已存在时抛出错误', async () => {
      // Arrange
      const registerData = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'Test123456'
      }

      ;(User.findOne as jest.Mock).mockResolvedValueOnce({ id: 1 })

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow('用户名已存在')
      expect(User.create).not.toHaveBeenCalled()
    })

    it('应该在邮箱已存在时抛出错误', async () => {
      // Arrange
      const registerData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'Test123456'
      }

      ;(User.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // 用户名不存在
        .mockResolvedValueOnce({ id: 1 }) // 邮箱已存在

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow('邮箱已被使用')
      expect(User.create).not.toHaveBeenCalled()
    })
  })

  describe('login', () => {
    it('应该成功登录并返回令牌', async () => {
      // Arrange
      const loginData = {
        username: 'testuser',
        password: 'Test123456'
      }

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        update: jest.fn().mockResolvedValue(true)
      }

      ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(jwt.sign as jest.Mock).mockReturnValue('mock-token')

      // Act
      const result = await authService.login(loginData)

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ where: { username: loginData.username } })
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password)
      expect(mockUser.update).toHaveBeenCalled()
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })

    it('应该在用户不存在时抛出错误', async () => {
      // Arrange
      const loginData = {
        username: 'nonexistent',
        password: 'Test123456'
      }

      ;(User.findOne as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow('用户名或密码错误')
    })

    it('应该在密码错误时抛出错误', async () => {
      // Arrange
      const loginData = {
        username: 'testuser',
        password: 'WrongPassword'
      }

      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedPassword'
      }

      ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow('用户名或密码错误')
    })
  })

  describe('refreshToken', () => {
    it('应该成功刷新访问令牌', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token'
      const mockDecoded = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      }

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      }

      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded)
      ;(User.findByPk as jest.Mock).mockResolvedValue(mockUser)
      ;(jwt.sign as jest.Mock).mockReturnValue('new-token')

      // Act
      const result = await authService.refreshToken(refreshToken)

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, config.jwt.refreshSecret)
      expect(User.findByPk).toHaveBeenCalledWith(mockDecoded.id)
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })

    it('应该在令牌无效时抛出错误', async () => {
      // Arrange
      const invalidToken = 'invalid-token'
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      // Act & Assert
      await expect(authService.refreshToken(invalidToken)).rejects.toThrow('无效的 Refresh Token')
    })

    it('应该在用户不存在时抛出错误', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token'
      const mockDecoded = { id: 999 }

      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded)
      ;(User.findByPk as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      // 注意：从安全角度考虑，用户不存在时也返回统一的错误消息
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('无效的 Refresh Token')
    })
  })

  describe('verifyAccessToken', () => {
    it('应该成功验证有效的访问令牌', () => {
      // Arrange
      const token = 'valid-access-token'
      const mockDecoded = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      }

      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded)

      // Act
      const result = authService.verifyAccessToken(token)

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, config.jwt.secret)
      expect(result).toEqual(mockDecoded)
    })

    it('应该在令牌无效时抛出错误', () => {
      // Arrange
      const invalidToken = 'invalid-token'
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      // Act & Assert
      expect(() => authService.verifyAccessToken(invalidToken)).toThrow('无效的访问令牌')
    })
  })

  describe('getUserById', () => {
    it('应该成功获取用户信息', async () => {
      // Arrange
      const userId = 1
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      }

      ;(User.findByPk as jest.Mock).mockResolvedValue(mockUser)

      // Act
      const result = await authService.getUserById(userId)

      // Assert
      expect(User.findByPk).toHaveBeenCalledWith(userId)
      expect(result).toEqual(mockUser)
    })

    it('应该在用户不存在时抛出错误', async () => {
      // Arrange
      const userId = 999
      ;(User.findByPk as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(authService.getUserById(userId)).rejects.toThrow('用户不存在')
    })
  })

  describe('logout', () => {
    it('应该成功登出用户', async () => {
      // Arrange
      const userId = 1

      // Act
      const result = await authService.logout(userId)

      // Assert
      expect(result).toBe(true)
    })
  })
})
