import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PublicRoute from './PublicRoute'
import { authService } from '@services/authService'

// Mock authService
vi.mock('@services/authService', () => ({
  authService: {
    isAuthenticated: vi.fn(),
  },
}))

describe('PublicRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const LoginComponent = () => <div>登录页面</div>
  const DashboardComponent = () => <div>仪表盘</div>

  it('应该在用户未登录时渲染子组件', () => {
    // Arrange
    vi.mocked(authService.isAuthenticated).mockReturnValue(false)

    // Act
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <LoginComponent />
              </PublicRoute>
            }
          />
          <Route path="/dashboard" element={<DashboardComponent />} />
        </Routes>
      </MemoryRouter>
    )

    // Assert
    expect(screen.getByText('登录页面')).toBeInTheDocument()
    expect(screen.queryByText('仪表盘')).not.toBeInTheDocument()
  })

  it('应该在用户已登录时重定向到仪表盘', () => {
    // Arrange
    vi.mocked(authService.isAuthenticated).mockReturnValue(true)

    // Act
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <LoginComponent />
              </PublicRoute>
            }
          />
          <Route path="/dashboard" element={<DashboardComponent />} />
        </Routes>
      </MemoryRouter>
    )

    // Assert
    expect(screen.queryByText('登录页面')).not.toBeInTheDocument()
    expect(screen.getByText('仪表盘')).toBeInTheDocument()
  })

  it('应该调用 authService.isAuthenticated 检查认证状态', () => {
    // Arrange
    vi.mocked(authService.isAuthenticated).mockReturnValue(false)

    // Act
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <LoginComponent />
              </PublicRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    // Assert
    expect(authService.isAuthenticated).toHaveBeenCalled()
  })

  it('应该正确传递 children 属性', () => {
    // Arrange
    vi.mocked(authService.isAuthenticated).mockReturnValue(false)

    const CustomChild = () => <div>自定义公开组件</div>

    // Act
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <CustomChild />
              </PublicRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    // Assert
    expect(screen.getByText('自定义公开组件')).toBeInTheDocument()
  })

  it('应该处理多个子组件', () => {
    // Arrange
    vi.mocked(authService.isAuthenticated).mockReturnValue(false)

    // Act
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <div>公开内容1</div>
                <div>公开内容2</div>
              </PublicRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    // Assert
    expect(screen.getByText('公开内容1')).toBeInTheDocument()
    expect(screen.getByText('公开内容2')).toBeInTheDocument()
  })

  it('应该在已登录状态下阻止访问登录页', () => {
    // Arrange
    vi.mocked(authService.isAuthenticated).mockReturnValue(true)

    const RegisterComponent = () => <div>注册页面</div>

    // Act
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <RegisterComponent />
              </PublicRoute>
            }
          />
          <Route path="/dashboard" element={<DashboardComponent />} />
        </Routes>
      </MemoryRouter>
    )

    // Assert
    expect(screen.queryByText('注册页面')).not.toBeInTheDocument()
    expect(screen.getByText('仪表盘')).toBeInTheDocument()
  })
})
