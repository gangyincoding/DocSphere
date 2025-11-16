import React from 'react'
import { Typography } from 'antd'

const { Title } = Typography

const ProfilePage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>个人资料</Title>
      <p>个人资料功能正在开发中...</p>
    </div>
  )
}

export default ProfilePage
