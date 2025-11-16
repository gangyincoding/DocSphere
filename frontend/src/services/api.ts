import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { message } from 'antd'
import type { ApiResponse } from '@types/index'

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 添加认证token
    const token = localStorage.getItem('accessToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加请求时间戳
    if (config.params) {
      config.params._t = Date.now()
    } else {
      config.params = { _t: Date.now() }
    }

    console.log(`🚀 API请求: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
    })

    return config
  },
  (error) => {
    console.error('❌ 请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API响应: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data,
    })

    // 统一处理API响应格式
    if (response.data && typeof response.data === 'object') {
      return response
    }

    // 包装非标准响应
    return {
      ...response,
      data: {
        success: true,
        message: '操作成功',
        data: response.data,
      },
    }
  },
  async (error) => {
    console.error(`❌ API错误: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error)

    const { response, request, config } = error

    // 网络错误
    if (!response && request) {
      message.error('网络连接失败，请检查网络设置')
      return Promise.reject(error)
    }

    // 服务器响应错误
    if (response) {
      const { status, data } = response
      let errorMessage = '操作失败'

      // 根据状态码处理错误
      switch (status) {
        case 400:
          errorMessage = data?.message || '请求参数错误'
          break
        case 401:
          errorMessage = '登录已过期，请重新登录'
          // 清除本地token
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          // 重定向到登录页
          window.location.href = '/auth/login'
          break
        case 403:
          errorMessage = '没有权限访问该资源'
          break
        case 404:
          errorMessage = '请求的资源不存在'
          break
        case 422:
          errorMessage = data?.message || '数据验证失败'
          break
        case 429:
          errorMessage = '请求过于频繁，请稍后再试'
          break
        case 500:
          errorMessage = '服务器内部错误'
          break
        case 502:
        case 503:
          errorMessage = '服务暂时不可用'
          break
        default:
          errorMessage = data?.message || `请求失败 (${status})`
      }

      // 显示错误消息
      message.error(errorMessage)

      // 返回统一错误格式
      const apiError: ApiResponse = {
        success: false,
        message: errorMessage,
        error: data?.error || error.message,
      }

      return Promise.reject({ ...error, response: { ...response, data: apiError } })
    }

    // 其他错误
    message.error('未知错误，请稍后重试')
    return Promise.reject(error)
  }
)

// 通用请求方法
export const api = {
  // GET请求
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.get(url, config)
  },

  // POST请求
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.post(url, data, config)
  },

  // PUT请求
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.put(url, data, config)
  },

  // PATCH请求
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.patch(url, data, config)
  },

  // DELETE请求
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.delete(url, config)
  },

  // 文件上传
  upload: <T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    })
  },

  // 文件下载
  download: (url: string, filename?: string, config?: AxiosRequestConfig): Promise<void> => {
    return apiClient.get(url, {
      ...config,
      responseType: 'blob',
    }).then((response) => {
      // 创建下载链接
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    })
  },
}

export default apiClient