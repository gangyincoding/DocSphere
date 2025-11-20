import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { authService } from '@services/authService'

// Mock authService
vi.mock('@services/authService', () => ({
  authService: {
    isAuthenticated: vi.fn(),
  },
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const TestComponent = () => <div>受保护的内容</div>
  const LoginComponent = () => <div>登录页面</div>

  const renderWithRouter = (isAuthenticated: boolean) => {
    ;(authService.isAuthenticated as any).mockReturnValue(isAuthenticated)

    return render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/auth/login" element={<LoginComponent />} />
        </Routes>
      </BrowserRouter>
    )
  }

  it('应该在用户已登录时渲染子组件', () => {
    // Arrange & Act
    renderWithRouter(true)

    // Assert
    expect(screen.getByText('受保护的内容')).toBeInTheDocument()
    expect(screen.queryByText('登录页面')).not.toBeInTheDocument()
  })

  it('应该在用户未登录时重定向到登录页', () => {
    // Arrange & Act
    renderWithRouter(false)

    // Assert
    expect(screen.queryByText('受保护的内容')).not.toBeInTheDocument()
    expect(screen.getByText('登录页面')).toBeInTheDocument()
  })

  it('应该调用 authService.isAuthenticated 检查认证状态', () => {
    // Arrange & Act
    renderWithRouter(true)

    // Assert
    expect(authService.isAuthenticated).toHaveBeenCalledTimes(1)
  })

  it('应该正确传递 children 属性', () => {
    // Arrange
    ;(authService.isAuthenticated as any).mockReturnValue(true)

    const CustomChild = () => <div>自定义子组件</div>

    // Act
    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CustomChild />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    )

    // Assert
    expect(screen.getByText('自定义子组件')).toBeInTheDocument()
  })

  it('应该处理多个子组件', () => {
    // Arrange
    ;(authService.isAuthenticated as any).mockReturnValue(true)

    // Act
    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>第一个子组件</div>
                <div>第二个子组件</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    )

    // Assert
    expect(screen.getByText('第一个子组件')).toBeInTheDocument()
    expect(screen.getByText('第二个子组件')).toBeInTheDocument()
  })
})
