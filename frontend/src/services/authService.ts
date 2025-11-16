import { api } from './api'
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  User,
  ApiResponse,
} from '@types/index'

export interface LoginResponseData extends LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export class AuthService {
  /**
   * 用户登录
   */
  static async login(credentials: LoginRequest): Promise<LoginResponseData> {
    const response = await api.post<LoginResponseData>('/auth/login', credentials)
    const { data } = response.data

    if (data) {
      // 保存token和用户信息
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))

      // 计算token过期时间
      const expiresAt = Date.now() + data.expiresIn * 1000
      localStorage.setItem('tokenExpiresAt', expiresAt.toString())
    }

    return data!
  }

  /**
   * 用户注册
   */
  static async register(userData: RegisterRequest): Promise<User> {
    const response = await api.post<User>('/auth/register', userData)
    return response.data.data!
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.warn('登出请求失败:', error)
    } finally {
      // 清除本地存储
      this.clearAuthData()
    }
  }

  /**
   * 刷新token
   */
  static async refreshToken(): Promise<LoginResponseData> {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      throw new Error('没有刷新令牌')
    }

    const response = await api.post<LoginResponseData>('/auth/refresh-token', {
      refreshToken,
    })

    const { data } = response.data
    if (data) {
      // 更新token
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)

      // 更新过期时间
      const expiresAt = Date.now() + data.expiresIn * 1000
      localStorage.setItem('tokenExpiresAt', expiresAt.toString())
    }

    return data!
  }

  /**
   * 验证token
   */
  static async verifyToken(): Promise<boolean> {
    try {
      const response = await api.post('/auth/verify-token', {
        token: localStorage.getItem('accessToken'),
      })
      return response.data.success
    } catch (error) {
      return false
    }
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    return response.data.data!
  }

  /**
   * 更新用户资料
   */
  static async updateProfile(profileData: Partial<User>): Promise<User> {
    const response = await api.put<User>('/auth/profile', profileData)

    // 更新本地用户信息
    const updatedUser = response.data.data!
    localStorage.setItem('user', JSON.stringify(updatedUser))

    return updatedUser
  }

  /**
   * 修改密码
   */
  static async changePassword(passwordData: {
    currentPassword: string
    newPassword: string
  }): Promise<void> {
    await api.put('/auth/change-password', passwordData)
  }

  /**
   * 检查是否已登录
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken')
    const expiresAt = localStorage.getItem('tokenExpiresAt')

    if (!token || !expiresAt) {
      return false
    }

    // 检查token是否过期
    const isExpired = Date.now() > parseInt(expiresAt)
    if (isExpired) {
      this.clearAuthData()
      return false
    }

    return true
  }

  /**
   * 获取当前用户信息（从本地存储）
   */
  static getCurrentUserFromStorage(): User | null {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('解析用户信息失败:', error)
      return null
    }
  }

  /**
   * 获取访问令牌
   */
  static getAccessToken(): string | null {
    return localStorage.getItem('accessToken')
  }

  /**
   * 清除认证数据
   */
  static clearAuthData(): void {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('tokenExpiresAt')
  }

  /**
   * 检查token是否即将过期（提前5分钟刷新）
   */
  static shouldRefreshToken(): boolean {
    const expiresAt = localStorage.getItem('tokenExpiresAt')
    if (!expiresAt) return false

    const fiveMinutes = 5 * 60 * 1000 // 5分钟
    return Date.now() > parseInt(expiresAt) - fiveMinutes
  }

  /**
   * 自动刷新token（如果需要）
   */
  static async autoRefreshToken(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false
    }

    if (this.shouldRefreshToken()) {
      try {
        await this.refreshToken()
        return true
      } catch (error) {
        console.error('自动刷新token失败:', error)
        this.clearAuthData()
        return false
      }
    }

    return true
  }
}

export default AuthService