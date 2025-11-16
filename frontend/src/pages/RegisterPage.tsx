import React from 'react'
import { Card, Typography } from 'antd'

const { Title } = Typography

const RegisterPage: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, textAlign: 'center' }}>
        <Title level={2}>注册 DocSphere</Title>
        <p>企业文档管理系统</p>
        <p style={{ color: '#666' }}>注册页面 - 开发中...</p>
      </Card>
    </div>
  )
}

export default RegisterPage