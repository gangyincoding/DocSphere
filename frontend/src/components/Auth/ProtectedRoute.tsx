import React, { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { AuthService } from '@services/authService'

const ProtectedRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 检查本地是否有认证信息
        const isLocalAuthenticated = AuthService.isAuthenticated()

        if (isLocalAuthenticated) {
          // 验证token是否有效
          const isValid = await AuthService.verifyToken()
          setIsAuthenticated(isValid)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('认证检查失败:', error)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // 检查是否需要刷新token
  useEffect(() => {
    if (isAuthenticated) {
      AuthService.autoRefreshToken()
    }
  }, [isAuthenticated])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div>正在验证身份...</div>
      </div>
    )
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />
}

export default ProtectedRoute