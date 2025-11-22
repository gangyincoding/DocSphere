import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { message } from 'antd'

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const API_TIMEOUT = 30000

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加认证令牌
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response

      switch (status) {
        case 401:
          // 未授权 - 尝试刷新令牌
          const refreshToken = localStorage.getItem('refreshToken')
          if (refreshToken && error.config) {
            try {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                refreshToken
              })

              const { accessToken } = response.data.data
              localStorage.setItem('accessToken', accessToken)

              // 重试原始请求
              if (error.config.headers) {
                error.config.headers.Authorization = `Bearer ${accessToken}`
              }
              return apiClient.request(error.config)
            } catch (refreshError) {
              // 刷新令牌失败，清除本地存储并跳转到登录页
              localStorage.removeItem('accessToken')
              localStorage.removeItem('refreshToken')
              localStorage.removeItem('user')
              window.location.href = '/auth/login'
              message.error('登录已过期，请重新登录')
            }
          } else {
            // 没有刷新令牌，直接跳转到登录页
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            window.location.href = '/auth/login'
            message.error('请先登录')
          }
          break

        case 403:
          message.error('没有权限访问此资源')
          break

        case 404:
          message.error('请求的资源不存在')
          break

        case 500:
          message.error('服务器内部错误')
          break

        default:
          message.error('请求失败')
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      message.error('网络错误，请检查您的网络连接')
    } else {
      // 设置请求时发生错误
      message.error('请求配置错误')
    }

    return Promise.reject(error)
  }
)

// API 响应接口
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

// 通用请求方法
class ApiService {
  /**
   * GET 请求
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await apiClient.get<ApiResponse<T>>(url, config)
    return response.data
  }

  /**
   * POST 请求
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config)
    return response.data
  }

  /**
   * PUT 请求
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config)
    return response.data
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await apiClient.delete<ApiResponse<T>>(url, config)
    return response.data
  }

  /**
   * PATCH 请求
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config)
    return response.data
  }
}

export const api = new ApiService()
export default apiClient
