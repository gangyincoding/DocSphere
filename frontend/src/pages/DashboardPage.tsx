import React from 'react'
import { Typography, Card, Row, Col, Statistic } from 'antd'
import { FileOutlined, UserOutlined, FolderOutlined, DownloadOutlined } from '@ant-design/icons'

const { Title } = Typography

const DashboardPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>仪表盘</Title>
      <p>欢迎使用 DocSphere 企业文档管理系统</p>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总文件数"
              value={1234}
              prefix={<FileOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="用户数量"
              value={56}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="文件夹数"
              value={89}
              prefix={<FolderOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="下载次数"
              value={10234}
              prefix={<DownloadOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: '24px' }}>
        <Title level={4}>系统状态</Title>
        <p>✅ 所有服务正常运行</p>
        <p>📊 数据库连接正常</p>
        <p>🔒 权限系统已启用</p>
      </Card>
    </div>
  )
}

export default DashboardPage