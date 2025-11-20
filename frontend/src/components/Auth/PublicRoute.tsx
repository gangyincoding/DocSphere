import React from 'react'
import { Navigate } from 'react-router-dom'
import { authService } from '@services/authService'

interface PublicRouteProps {
  children: React.ReactNode
}

/**
 * 公开路由组件 - 已登录用户访问会重定向到首页
 */
const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated()

  if (isAuthenticated) {
    // 已登录，重定向到首页
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default PublicRoute
