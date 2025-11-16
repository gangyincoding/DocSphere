import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  Checkbox,
  Divider,
  Space,
  Alert,
  Spin,
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons'
import { AuthService } from '@services/authService'
import type { LoginRequest } from '@types/index'

const { Title, Text } = Typography

interface LoginForm {
  email: string
  password: string
  remember: boolean
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const navigate = useNavigate()

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true)
    setError('')

    try {
      const loginData: LoginRequest = {
        email: values.email.trim(),
        password: values.password,
      }

      // 调用登录API
      const response = await AuthService.login(loginData)

      // 登录成功
      console.log('登录成功:', response)

      // 跳转到仪表盘
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      console.error('登录失败:', err)

      // 显示错误信息
      const errorMessage = err.response?.data?.message || '登录失败，请稍后重试'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleTestLogin = async () => {
    // 测试账号登录 - 用于演示
    const testCredentials: LoginRequest = {
      email: 'admin@docsphere.com',
      password: 'Admin123456'
    }

    setLoading(true)
    setError('')

    try {
      await AuthService.login(testCredentials)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '测试账号登录失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          borderRadius: '12px'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
            DocSphere
          </Title>
          <Text type="secondary">企业文档管理系统</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
          <Form.Item
            label="邮箱地址"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入邮箱地址"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度至少6位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              autoComplete="current-password"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Checkbox name="remember">记住我</Checkbox>
              <Link to="/auth/forgot-password" style={{ fontSize: '14px' }}>
                忘记密码？
              </Link>
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ height: '44px', fontSize: '16px' }}
            >
              {loading ? <Spin size="small" /> : '登录'}
            </Button>
          </Form.Item>

          <Divider>
            <Text type="secondary" style={{ fontSize: '12px' }}>演示账号</Text>
          </Divider>

          <Form.Item style={{ marginBottom: '8px' }}>
            <Button
              block
              onClick={handleTestLogin}
              loading={loading}
              style={{ height: '36px' }}
            >
              使用测试账号登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Text type="secondary">
            还没有账号？{' '}
            <Link to="/auth/register" style={{ color: '#1890ff' }}>
              立即注册
            </Link>
          </Text>
        </div>

        {/* 测试信息 */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f6f8fa',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666'
        }}>
          <Text strong style={{ color: '#333' }}>测试账号信息：</Text>
          <div style={{ marginTop: '8px' }}>
            <div>邮箱：admin@docsphere.com</div>
            <div>密码：Admin123456</div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#999' }}>
            注：点击"使用测试账号登录"可直接使用测试账号
          </div>
        </div>
      </Card>
    </div>
  )
}

export default LoginPage