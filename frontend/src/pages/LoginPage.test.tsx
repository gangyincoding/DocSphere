import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import LoginPage from './LoginPage'
import { authService } from '@services/authService'
import * as antd from 'antd'

// Mock authService
vi.mock('@services/authService', () => ({
  authService: {
    login: vi.fn(),
  },
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }
})

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )
  }

  it('应该正确渲染登录表单', () => {
    // Arrange & Act
    renderLoginPage()

    // Assert
    expect(screen.getByText('DocSphere')).toBeInTheDocument()
    expect(screen.getByText('企业级文档管理系统')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('用户名')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /使用测试账号登录/i })).toBeInTheDocument()
  })

  it('应该显示注册链接', () => {
    // Arrange & Act
    renderLoginPage()

    // Assert
    expect(screen.getByText('还没有账号？')).toBeInTheDocument()
    expect(screen.getByText('立即注册')).toBeInTheDocument()
  })

  it('应该成功处理登录', async () => {
    // Arrange
    const user = userEvent.setup({ delay: null })
    const mockLoginResponse = {
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      },
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh',
    }

    ;(authService.login as any).mockResolvedValue(mockLoginResponse)

    renderLoginPage()

    const usernameInput = screen.getByPlaceholderText('用户名')
    const passwordInput = screen.getByPlaceholderText('密码')
    const loginButton = screen.getByRole('button', { name: /^登录$/i })

    // Act
    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'Test123456')
    await user.click(loginButton)

    // Assert
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'Test123456',
      })
    })

    expect(antd.message.success).toHaveBeenCalledWith('欢迎回来，testuser！')

    // Fast forward timers to trigger navigation
    vi.runAllTimers()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('应该在登录失败时显示错误消息', async () => {
    // Arrange
    const user = userEvent.setup({ delay: null })
    const errorMessage = '用户名或密码错误'

    ;(authService.login as any).mockRejectedValue(new Error(errorMessage))

    renderLoginPage()

    const usernameInput = screen.getByPlaceholderText('用户名')
    const passwordInput = screen.getByPlaceholderText('密码')
    const loginButton = screen.getByRole('button', { name: /^登录$/i })

    // Act
    await user.type(usernameInput, 'wronguser')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(loginButton)

    // Assert
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: 'wronguser',
        password: 'wrongpassword',
      })
    })

    expect(antd.message.error).toHaveBeenCalledWith(errorMessage)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('应该在表单验证失败时不调用登录接口', async () => {
    // Arrange
    const user = userEvent.setup({ delay: null })
    renderLoginPage()

    const loginButton = screen.getByRole('button', { name: /^登录$/i })

    // Act - 不填写任何字段直接提交
    await user.click(loginButton)

    // Assert
    expect(authService.login).not.toHaveBeenCalled()
  })

  it('应该使用测试账号快速登录', async () => {
    // Arrange
    const user = userEvent.setup({ delay: null })
    const mockLoginResponse = {
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
      },
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh',
    }

    ;(authService.login as any).mockResolvedValue(mockLoginResponse)

    renderLoginPage()

    const quickLoginButton = screen.getByRole('button', { name: /使用测试账号登录/i })

    // Act
    await user.click(quickLoginButton)

    // Assert - 表单应该填充测试账号信息
    await waitFor(() => {
      const usernameInput = screen.getByPlaceholderText('用户名') as HTMLInputElement
      const passwordInput = screen.getByPlaceholderText('密码') as HTMLInputElement

      expect(usernameInput.value).toBe('admin')
      expect(passwordInput.value).toBe('Admin123456')
    })

    // 验证登录请求被调用
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: 'admin',
        password: 'Admin123456',
      })
    })

    expect(antd.message.success).toHaveBeenCalledWith('欢迎回来，admin！')
  })

  it('应该在提交期间禁用登录按钮', async () => {
    // Arrange
    const user = userEvent.setup({ delay: null })

    // 创建一个不会 resolve 的 Promise 来模拟加载状态
    let resolveLogin: any
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve
    })

    ;(authService.login as any).mockReturnValue(loginPromise)

    renderLoginPage()

    const usernameInput = screen.getByPlaceholderText('用户名')
    const passwordInput = screen.getByPlaceholderText('密码')
    const loginButton = screen.getByRole('button', { name: /^登录$/i })

    // Act
    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'Test123456')
    await user.click(loginButton)

    // Assert - 按钮应该显示加载状态
    await waitFor(() => {
      // Ant Design 的 loading 按钮会有 ant-btn-loading 类
      expect(loginButton).toHaveClass('ant-btn-loading')
    })

    // Cleanup - resolve the promise
    resolveLogin({
      user: { id: 1, username: 'testuser', email: 'test@example.com' },
      accessToken: 'token',
      refreshToken: 'refresh',
    })
  })

  it('应该在缺少错误消息时使用默认错误文本', async () => {
    // Arrange
    const user = userEvent.setup({ delay: null })

    // 模拟不带消息的错误
    ;(authService.login as any).mockRejectedValue(new Error())

    renderLoginPage()

    const usernameInput = screen.getByPlaceholderText('用户名')
    const passwordInput = screen.getByPlaceholderText('密码')
    const loginButton = screen.getByRole('button', { name: /^登录$/i })

    // Act
    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'Test123456')
    await user.click(loginButton)

    // Assert
    await waitFor(() => {
      expect(antd.message.error).toHaveBeenCalledWith('登录失败，请检查用户名和密码')
    })
  })

  it('应该处理网络错误', async () => {
    // Arrange
    const user = userEvent.setup({ delay: null })

    ;(authService.login as any).mockRejectedValue(new Error('Network Error'))

    renderLoginPage()

    const usernameInput = screen.getByPlaceholderText('用户名')
    const passwordInput = screen.getByPlaceholderText('密码')
    const loginButton = screen.getByRole('button', { name: /^登录$/i })

    // Act
    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'Test123456')
    await user.click(loginButton)

    // Assert
    await waitFor(() => {
      expect(antd.message.error).toHaveBeenCalledWith('Network Error')
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
