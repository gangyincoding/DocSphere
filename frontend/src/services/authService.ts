import { api } from './api'

// 用户接口
export interface User {
  id: number
  username: string
  email: string
  createdAt?: string
  updatedAt?: string
}

// 登录请求参数
export interface LoginRequest {
  username: string
  password: string
}

// 登录响应数据
export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

// 注册请求参数
export interface RegisterRequest {
  username: string
  email: string
  password: string
}

// 注册响应数据
export interface RegisterResponse {
  user: User
  accessToken: string
  refreshToken: string
}

// 刷新令牌响应数据
export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

/**
 * 认证服务类
 */
class AuthService {
  /**
   * 用户登录
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', data)

    if (response.success && response.data) {
      // 保存令牌和用户信息到本地存储
      localStorage.setItem('accessToken', response.data.accessToken)
      localStorage.setItem('refreshToken', response.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      return response.data
    }

    throw new Error(response.message || '登录失败')
  }

  /**
   * 用户注册
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', data)

    if (response.success && response.data) {
      // 保存令牌和用户信息到本地存储
      localStorage.setItem('accessToken', response.data.accessToken)
      localStorage.setItem('refreshToken', response.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      return response.data
    }

    throw new Error(response.message || '注册失败')
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('登出请求失败:', error)
    } finally {
      // 无论请求是否成功，都清除本地存储
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    const refreshToken = localStorage.getItem('refreshToken')

    if (!refreshToken) {
      throw new Error('没有刷新令牌')
    }

    const response = await api.post<RefreshTokenResponse>('/auth/refresh-token', {
      refreshToken
    })

    if (response.success && response.data) {
      // 更新令牌
      localStorage.setItem('accessToken', response.data.accessToken)
      localStorage.setItem('refreshToken', response.data.refreshToken)

      return response.data
    }

    throw new Error(response.message || '刷新令牌失败')
  }

  /**
   * 验证令牌
   */
  async verifyToken(): Promise<boolean> {
    try {
      const response = await api.get('/auth/verify')
      return response.success
    } catch (error) {
      return false
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ user: User }>('/auth/me')

    if (response.success && response.data) {
      // 更新本地存储的用户信息
      localStorage.setItem('user', JSON.stringify(response.data.user))
      return response.data.user
    }

    throw new Error(response.message || '获取用户信息失败')
  }

  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken')
    const user = localStorage.getItem('user')
    return !!(token && user)
  }

  /**
   * 获取本地存储的用户信息
   */
  getLocalUser(): User | null {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch (error) {
        console.error('解析用户信息失败:', error)
        return null
      }
    }
    return null
  }

  /**
   * 获取访问令牌
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken')
  }

  /**
   * 获取刷新令牌
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken')
  }
}

export const authService = new AuthService()
export default authService
