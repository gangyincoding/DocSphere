import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { authService } from '@services/authService'

const { Title, Text } = Typography

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  /**
   * 处理登录表单提交
   */
  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true)

    try {
      const result = await authService.login(values)
      message.success(`欢迎回来，${result.user.username}！`)

      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        navigate('/dashboard')
      }, 500)
    } catch (error: any) {
      message.error(error.message || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 使用测试账号快速登录
   */
  const handleQuickLogin = () => {
    form.setFieldsValue({
      username: 'admin',
      password: 'Admin123456'
    })
    form.submit()
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          borderRadius: '12px'
        }}
      >
        {/* 头部 Logo 和标题 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: '#fff'
            }}
          >
            <UserOutlined />
          </div>
          <Title level={2} style={{ margin: 0 }}>
            DocSphere
          </Title>
          <Text type="secondary">企业级文档管理系统</Text>
        </div>

        {/* 登录表单 */}
        <Form form={form} onFinish={handleLogin} size="large" autoComplete="off">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="dashed"
              icon={<ThunderboltOutlined />}
              onClick={handleQuickLogin}
              block
            >
              使用测试账号登录
            </Button>
          </Form.Item>
        </Form>

        {/* 底部链接 */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Text type="secondary">
            还没有账号？ <Link to="/auth/register">立即注册</Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default LoginPage
