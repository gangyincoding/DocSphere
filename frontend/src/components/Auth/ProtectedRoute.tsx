import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute: React.FC = () => {
  // TODO: 实现真实的认证逻辑
  // 现在暂时直接渲染内容，实际应该检查用户是否已登录
  const isAuthenticated = true // 临时设为true

  return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />
}

export default ProtectedRoute