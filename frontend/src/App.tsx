import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from 'antd'

// 页面组件
import LoginPage from '@pages/LoginPage'
import RegisterPage from '@pages/RegisterPage'
import DashboardPage from '@pages/DashboardPage'
import FileManagementPage from '@pages/FileManagementPage'
import UserManagementPage from '@pages/UserManagementPage'
import RoleManagementPage from '@pages/RoleManagementPage'
import PermissionManagementPage from '@pages/PermissionManagementPage'
import ProfilePage from '@pages/ProfilePage'
import SettingsPage from '@pages/SettingsPage'

// 布局组件
import AppLayout from '@components/Layout/AppLayout'
import AuthLayout from '@components/Layout/AuthLayout'

// 路由保护组件
import ProtectedRoute from '@components/Auth/ProtectedRoute'
import PublicRoute from '@components/Auth/PublicRoute'

const { Content } = Layout

const App: React.FC = () => {
  return (
    <div className="app">
      <Routes>
        {/* 公开路由 - 未登录用户可访问 */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route
            path="login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
        </Route>

        {/* 受保护的路由 - 需要登录才能访问 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="files" element={<FileManagementPage />} />
          <Route path="files/:folderId" element={<FileManagementPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="roles" element={<RoleManagementPage />} />
          <Route path="permissions" element={<PermissionManagementPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* 404页面 */}
        <Route
          path="*"
          element={
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <h1>404</h1>
              <p>页面不存在</p>
            </div>
          }
        />
      </Routes>
    </div>
  )
}

export default App