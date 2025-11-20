import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { authService } from '@services/authService'

const { Title, Text } = Typography

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  /**
   * 处理注册表单提交
   */
  const handleRegister = async (values: {
    username: string
    email: string
    password: string
  }) => {
    setLoading(true)

    try {
      const result = await authService.register(values)
      message.success(`注册成功，欢迎 ${result.user.username}！`)

      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        navigate('/dashboard')
      }, 500)
    } catch (error: any) {
      message.error(error.message || '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
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
            注册账号
          </Title>
          <Text type="secondary">创建您的 DocSphere 账号</Text>
        </div>

        {/* 注册表单 */}
        <Form onFinish={handleRegister} size="large" autoComplete="off">
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少 3 个字符' },
              { max: 20, message: '用户名最多 20 个字符' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 个字符' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                }
              })
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              注册
            </Button>
          </Form.Item>
        </Form>

        {/* 底部链接 */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Text type="secondary">
            已有账号？ <Link to="/auth/login">立即登录</Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default RegisterPage
