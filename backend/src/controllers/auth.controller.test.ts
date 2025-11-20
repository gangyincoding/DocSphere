import { Request, Response, NextFunction } from 'express'
import { AuthController } from './auth.controller'
import { AuthService } from '../services/auth.service'

// Mock dependencies
jest.mock('../services/auth.service')
jest.mock('../utils/logger')

describe('AuthController', () => {
  let authController: AuthController
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    authController = new AuthController()

    mockRequest = {
      body: {}
    }

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }

    mockNext = jest.fn()

    jest.clearAllMocks()
  })

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      // Arrange
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123456'
      }

      const mockResult = {
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        accessToken: 'token',
        refreshToken: 'refresh'
      }

      ;(AuthService.prototype.register as jest.Mock).mockResolvedValue(mockResult)

      // Act
      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '注册成功',
        data: mockResult
      })
    })

    it('应该在缺少参数时返回 400', async () => {
      // Arrange
      mockRequest.body = { username: 'test' } // 缺少 email 和 password

      // Act
      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '用户名、邮箱和密码不能为空'
      })
    })

    it('应该在注册失败时返回 400', async () => {
      // Arrange
      mockRequest.body = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'Test123456'
      }

      ;(AuthService.prototype.register as jest.Mock).mockRejectedValue(
        new Error('用户名已存在')
      )

      // Act
      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '用户名已存在'
      })
    })
  })

  describe('login', () => {
    it('应该成功登录', async () => {
      // Arrange
      mockRequest.body = {
        username: 'testuser',
        password: 'Test123456'
      }

      const mockResult = {
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        accessToken: 'token',
        refreshToken: 'refresh'
      }

      ;(AuthService.prototype.login as jest.Mock).mockResolvedValue(mockResult)

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '登录成功',
        data: mockResult
      })
    })

    it('应该在缺少参数时返回 400', async () => {
      // Arrange
      mockRequest.body = { username: 'test' } // 缺少 password

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '用户名和密码不能为空'
      })
    })

    it('应该在登录失败时返回 401', async () => {
      // Arrange
      mockRequest.body = {
        username: 'testuser',
        password: 'WrongPassword'
      }

      ;(AuthService.prototype.login as jest.Mock).mockRejectedValue(
        new Error('用户名或密码错误')
      )

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '用户名或密码错误'
      })
    })
  })

  describe('getCurrentUser', () => {
    it('应该成功获取当前用户信息', async () => {
      // Arrange
      ;(mockRequest as any).user = { id: 1, username: 'testuser' }

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      ;(AuthService.prototype.getUserById as jest.Mock).mockResolvedValue(mockUser)

      // Act
      await authController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: expect.objectContaining({
            id: 1,
            username: 'testuser',
            email: 'test@example.com'
          })
        }
      })
    })

    it('应该在未授权时返回 401', async () => {
      // Arrange - 没有 user 信息

      // Act
      await authController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '未授权'
      })
    })
  })

  describe('logout', () => {
    it('应该成功登出', async () => {
      // Arrange
      ;(mockRequest as any).user = { id: 1 }
      ;(AuthService.prototype.logout as jest.Mock).mockResolvedValue(true)

      // Act
      await authController.logout(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '登出成功'
      })
    })
  })
})
