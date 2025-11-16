import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  Alert,
  Spin,
  Progress,
  message,
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons'
import { AuthService } from '@services/authService'
import { validatePassword } from '@utils/index'
import type { RegisterRequest } from '@types/index'

const { Title, Text } = Typography

interface RegisterForm {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [passwordStrength, setPasswordStrength] = useState<number>(0)
  const navigate = useNavigate()

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value
    const validation = validatePassword(password)

    // 计算密码强度 (0-100)
    let strength = 0
    if (password.length >= 6) strength += 25
    if (password.length >= 10) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25

    setPasswordStrength(strength)
  }

  const handleSubmit = async (values: RegisterForm) => {
    setLoading(true)
    setError('')

    try {
      // 验证密码确认
      if (values.password !== values.confirmPassword) {
        setError('两次输入的密码不一致')
        setLoading(false)
        return
      }

      // 验证密码强度
      const passwordValidation = validatePassword(values.password)
      if (!passwordValidation.isValid) {
        setError(passwordValidation.errors.join('，'))
        setLoading(false)
        return
      }

      const registerData: RegisterRequest = {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        phone: values.phone?.trim() || undefined,
      }

      // 调用注册API
      const response = await AuthService.register(registerData)

      console.log('注册成功:', response)

      // 显示成功消息
      message.success('注册成功！请使用您的账号登录')

      // 跳转到登录页
      navigate('/auth/login', { replace: true })
    } catch (err: any) {
      console.error('注册失败:', err)

      // 显示错误信息
      const errorMessage = err.response?.data?.message || '注册失败，请稍后重试'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 33) return '#ff4d4f'
    if (passwordStrength < 66) return '#faad14'
    return '#52c41a'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength < 33) return '弱'
    if (passwordStrength < 66) return '中'
    return '强'
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
          maxWidth: 450,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          borderRadius: '12px'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
            注册 DocSphere
          </Title>
          <Text type="secondary">创建您的企业文档管理账号</Text>
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
          name="register"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          requiredMark={false}
          scrollToFirstError
        >
          <Form.Item
            label="姓名"
            name="name"
            rules={[
              { required: true, message: '请输入姓名' },
              { min: 2, message: '姓名长度至少2个字符' },
              { max: 50, message: '姓名长度不能超过50个字符' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入姓名"
              autoComplete="name"
            />
          </Form.Item>

          <Form.Item
            label="邮箱地址"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱地址"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            label="手机号码"
            name="phone"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="请输入手机号码（可选）"
              autoComplete="tel"
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
              autoComplete="new-password"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              onChange={handlePasswordChange}
            />
          </Form.Item>

          {form.getFieldValue('password') && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>密码强度</Text>
                <Text style={{ fontSize: '12px', color: getPasswordStrengthColor() }}>
                  {getPasswordStrengthText()}
                </Text>
              </div>
              <Progress
                percent={passwordStrength}
                strokeColor={getPasswordStrengthColor()}
                showInfo={false}
                size="small"
              />
            </div>
          )}

          <Form.Item
            label="确认密码"
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
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入密码"
              autoComplete="new-password"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ height: '44px', fontSize: '16px' }}
            >
              {loading ? <Spin size="small" /> : '注册账号'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Text type="secondary">
            已有账号？{' '}
            <Link to="/auth/login" style={{ color: '#1890ff' }}>
              立即登录
            </Link>
          </Text>
        </div>

        {/* 密码要求说明 */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f6f8fa',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666'
        }}>
          <Text strong style={{ color: '#333' }}>密码要求：</Text>
          <div style={{ marginTop: '8px' }}>
            <div>• 长度至少6个字符</div>
            <div>• 必须包含字母</div>
            <div>• 必须包含数字</div>
            <div>• 建议包含大小写字母和特殊字符</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default RegisterPage