import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authService } from './authService'
import { api } from './api'

// Mock api module
vi.mock('./api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('AuthService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('login', () => {
    it('应该成功登录并保存令牌和用户信息', async () => {
      // Arrange
      const loginData = {
        username: 'testuser',
        password: 'Test123456',
      }

      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
          },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      }

      ;(api.post as any).mockResolvedValue(mockResponse)

      // Act
      const result = await authService.login(loginData)

      // Assert
      expect(api.post).toHaveBeenCalledWith('/auth/login', loginData)
      expect(result).toEqual(mockResponse.data)
      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'mock-access-token')
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token')
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(mockResponse.data.user)
      )
    })

    it('应该在登录失败时抛出错误', async () => {
      // Arrange
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword',
      }

      const mockResponse = {
        success: false,
        message: '用户名或密码错误',
      }

      ;(api.post as any).mockResolvedValue(mockResponse)

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow('用户名或密码错误')
      expect(localStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('register', () => {
    it('应该成功注册并保存令牌和用户信息', async () => {
      // Arrange
      const registerData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'Test123456',
      }

      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 2,
            username: 'newuser',
            email: 'new@example.com',
          },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      }

      ;(api.post as any).mockResolvedValue(mockResponse)

      // Act
      const result = await authService.register(registerData)

      // Assert
      expect(api.post).toHaveBeenCalledWith('/auth/register', registerData)
      expect(result).toEqual(mockResponse.data)
      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'mock-access-token')
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token')
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(mockResponse.data.user)
      )
    })

    it('应该在注册失败时抛出错误', async () => {
      // Arrange
      const registerData = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'Test123456',
      }

      const mockResponse = {
        success: false,
        message: '用户名已存在',
      }

      ;(api.post as any).mockResolvedValue(mockResponse)

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow('用户名已存在')
      expect(localStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('应该成功登出并清除本地存储', async () => {
      // Arrange
      ;(api.post as any).mockResolvedValue({ success: true })
      localStorage.setItem('accessToken', 'mock-token')
      localStorage.setItem('refreshToken', 'mock-refresh')
      localStorage.setItem('user', JSON.stringify({ id: 1 }))

      // Act
      await authService.logout()

      // Assert
      expect(api.post).toHaveBeenCalledWith('/auth/logout')
      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken')
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken')
      expect(localStorage.removeItem).toHaveBeenCalledWith('user')
    })

    it('应该在请求失败时仍然清除本地存储', async () => {
      // Arrange
      ;(api.post as any).mockRejectedValue(new Error('Network error'))
      localStorage.setItem('accessToken', 'mock-token')

      // Act
      await authService.logout()

      // Assert
      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken')
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken')
      expect(localStorage.removeItem).toHaveBeenCalledWith('user')
    })
  })

  describe('refreshToken', () => {
    it('应该成功刷新令牌', async () => {
      // Arrange
      ;(localStorage.getItem as any).mockReturnValue('mock-refresh-token')

      const mockResponse = {
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      }

      ;(api.post as any).mockResolvedValue(mockResponse)

      // Act
      const result = await authService.refreshToken()

      // Assert
      expect(localStorage.getItem).toHaveBeenCalledWith('refreshToken')
      expect(api.post).toHaveBeenCalledWith('/auth/refresh-token', {
        refreshToken: 'mock-refresh-token',
      })
      expect(result).toEqual(mockResponse.data)
      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'new-access-token')
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh-token')
    })

    it('应该在没有刷新令牌时抛出错误', async () => {
      // Arrange
      ;(localStorage.getItem as any).mockReturnValue(null)

      // Act & Assert
      await expect(authService.refreshToken()).rejects.toThrow('没有刷新令牌')
      expect(api.post).not.toHaveBeenCalled()
    })

    it('应该在刷新失败时抛出错误', async () => {
      // Arrange
      ;(localStorage.getItem as any).mockReturnValue('mock-refresh-token')

      const mockResponse = {
        success: false,
        message: '刷新令牌已过期',
      }

      ;(api.post as any).mockResolvedValue(mockResponse)

      // Act & Assert
      await expect(authService.refreshToken()).rejects.toThrow('刷新令牌已过期')
    })
  })

  describe('verifyToken', () => {
    it('应该在令牌有效时返回 true', async () => {
      // Arrange
      const mockResponse = { success: true }
      ;(api.get as any).mockResolvedValue(mockResponse)

      // Act
      const result = await authService.verifyToken()

      // Assert
      expect(api.get).toHaveBeenCalledWith('/auth/verify')
      expect(result).toBe(true)
    })

    it('应该在令牌无效时返回 false', async () => {
      // Arrange
      ;(api.get as any).mockRejectedValue(new Error('Token invalid'))

      // Act
      const result = await authService.verifyToken()

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('getCurrentUser', () => {
    it('应该成功获取当前用户信息并更新本地存储', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      }

      const mockResponse = {
        success: true,
        data: { user: mockUser },
      }

      ;(api.get as any).mockResolvedValue(mockResponse)

      // Act
      const result = await authService.getCurrentUser()

      // Assert
      expect(api.get).toHaveBeenCalledWith('/auth/me')
      expect(result).toEqual(mockUser)
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser))
    })

    it('应该在获取失败时抛出错误', async () => {
      // Arrange
      const mockResponse = {
        success: false,
        message: '未授权',
      }

      ;(api.get as any).mockResolvedValue(mockResponse)

      // Act & Assert
      await expect(authService.getCurrentUser()).rejects.toThrow('未授权')
    })
  })

  describe('isAuthenticated', () => {
    it('应该在有令牌和用户信息时返回 true', () => {
      // Arrange
      ;(localStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'accessToken') return 'mock-token'
        if (key === 'user') return JSON.stringify({ id: 1 })
        return null
      })

      // Act
      const result = authService.isAuthenticated()

      // Assert
      expect(result).toBe(true)
    })

    it('应该在缺少令牌时返回 false', () => {
      // Arrange
      ;(localStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'user') return JSON.stringify({ id: 1 })
        return null
      })

      // Act
      const result = authService.isAuthenticated()

      // Assert
      expect(result).toBe(false)
    })

    it('应该在缺少用户信息时返回 false', () => {
      // Arrange
      ;(localStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'accessToken') return 'mock-token'
        return null
      })

      // Act
      const result = authService.isAuthenticated()

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('getLocalUser', () => {
    it('应该成功获取并解析本地用户信息', () => {
      // Arrange
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
      ;(localStorage.getItem as any).mockReturnValue(JSON.stringify(mockUser))

      // Act
      const result = authService.getLocalUser()

      // Assert
      expect(localStorage.getItem).toHaveBeenCalledWith('user')
      expect(result).toEqual(mockUser)
    })

    it('应该在没有用户信息时返回 null', () => {
      // Arrange
      ;(localStorage.getItem as any).mockReturnValue(null)

      // Act
      const result = authService.getLocalUser()

      // Assert
      expect(result).toBeNull()
    })

    it('应该在解析失败时返回 null', () => {
      // Arrange
      ;(localStorage.getItem as any).mockReturnValue('invalid-json')

      // Act
      const result = authService.getLocalUser()

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getAccessToken', () => {
    it('应该成功获取访问令牌', () => {
      // Arrange
      ;(localStorage.getItem as any).mockReturnValue('mock-access-token')

      // Act
      const result = authService.getAccessToken()

      // Assert
      expect(localStorage.getItem).toHaveBeenCalledWith('accessToken')
      expect(result).toBe('mock-access-token')
    })

    it('应该在没有令牌时返回 null', () => {
      // Arrange
      ;(localStorage.getItem as any).mockReturnValue(null)

      // Act
      const result = authService.getAccessToken()

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getRefreshToken', () => {
    it('应该成功获取刷新令牌', () => {
      // Arrange
      ;(localStorage.getItem as any).mockReturnValue('mock-refresh-token')

      // Act
      const result = authService.getRefreshToken()

      // Assert
      expect(localStorage.getItem).toHaveBeenCalledWith('refreshToken')
      expect(result).toBe('mock-refresh-token')
    })

    it('应该在没有刷新令牌时返回 null', () => {
      // Arrange
      ;(localStorage.getItem as any).mockReturnValue(null)

      // Act
      const result = authService.getRefreshToken()

      // Assert
      expect(result).toBeNull()
    })
  })
})
