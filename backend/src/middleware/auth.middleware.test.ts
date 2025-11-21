import { Request, Response, NextFunction } from 'express'

// Mock AuthService with a factory function
const mockVerifyAccessToken = jest.fn()

jest.mock('../services/auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: mockVerifyAccessToken
  }))
}))

jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}))

// Import after mocking
import { authMiddleware } from './auth.middleware'

describe('authMiddleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockRequest = {
      headers: {}
    }

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }

    mockNext = jest.fn()

    jest.clearAllMocks()
  })

  it('应该成功验证有效的令牌', async () => {
    // Arrange
    const mockDecoded = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com'
    }

    mockRequest.headers = {
      authorization: 'Bearer valid-token'
    }

    mockVerifyAccessToken.mockReturnValue(mockDecoded)

    // Act
    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    )

    // Assert
    expect((mockRequest as any).user).toEqual(mockDecoded)
    expect(mockNext).toHaveBeenCalled()
    expect(mockResponse.status).not.toHaveBeenCalled()
  })

  it('应该在缺少 Authorization 头时返回 401', async () => {
    // Arrange - 没有 authorization header

    // Act
    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    )

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: '未提供认证令牌'
    })
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('应该在 Authorization 头格式错误时返回 401', async () => {
    // Arrange
    mockRequest.headers = {
      authorization: 'InvalidFormat token'
    }

    // Act
    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    )

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: '未提供认证令牌'
    })
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('应该在令牌无效时返回 401', async () => {
    // Arrange
    mockRequest.headers = {
      authorization: 'Bearer invalid-token'
    }

    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error('Invalid token')
    })

    // Act
    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    )

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: '认证令牌无效或已过期'
    })
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('应该在令牌过期时返回 401', async () => {
    // Arrange
    mockRequest.headers = {
      authorization: 'Bearer expired-token'
    }

    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error('Token expired')
    })

    // Act
    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    )

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: '认证令牌无效或已过期'
    })
    expect(mockNext).not.toHaveBeenCalled()
  })
})
