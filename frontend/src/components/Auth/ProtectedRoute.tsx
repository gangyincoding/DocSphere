import React from 'react'
import { Navigate } from 'react-router-dom'
import { authService } from '@services/authService'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * 受保护路由组件 - 需要登录才能访问
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated()

  if (!isAuthenticated) {
    // 未登录，重定向到登录页
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
