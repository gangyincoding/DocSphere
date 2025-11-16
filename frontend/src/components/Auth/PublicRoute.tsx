import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

const PublicRoute: React.FC = () => {
  // TODO: 实现真实的认证逻辑
  // 如果用户已登录，则重定向到仪表盘
  const isAuthenticated = false // 临时设为false，允许访问登录页面

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}

export default PublicRoute