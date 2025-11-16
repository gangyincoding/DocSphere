import request from 'supertest';
import { app } from '../../app';
import { sequelize } from '../../config/database';
import { User } from '../../models/User';

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await User.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {}, force: true });
  });

  describe('POST /api/v1/auth/register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      phone: '+1234567890'
    };

    it('应该成功注册新用户', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: '注册成功',
        data: expect.objectContaining({
          user: expect.objectContaining({
            email: validUserData.email,
            name: validUserData.name,
            phone: validUserData.phone,
            status: 'active',
            emailVerified: false
          }),
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          expiresIn: expect.any(Number)
        })
      });

      expect(response.body.data.user.password).toBeUndefined();
    });

    it('应该拒绝无效邮箱格式', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('输入验证失败')
      });
    });

    it('应该拒绝弱密码', async () => {
      const weakPasswordData = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('应该拒绝空姓名', async () => {
      const emptyNameData = {
        email: 'test@example.com',
        password: 'password123',
        name: ''
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(emptyNameData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('应该拒绝重复邮箱', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(201);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('已被注册');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);
    });

    it('应该成功登录有效用户', async () => {
      const loginData = {
        email: userData.email,
        password: userData.password
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: '登录成功',
        data: expect.objectContaining({
          user: expect.objectContaining({
            email: userData.email,
            name: userData.name
          }),
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          expiresIn: expect.any(Number)
        })
      });
    });

    it('应该拒绝错误密码', async () => {
      const wrongPasswordData = {
        email: userData.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(wrongPasswordData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: '邮箱或密码错误'
      });
    });

    it('应该拒绝不存在的用户', async () => {
      const nonExistentData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(nonExistentData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: '邮箱或密码错误'
      });
    });

    it('应该处理邮箱大小写', async () => {
      const loginData = {
        email: userData.email.toUpperCase(),
        password: userData.password
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      refreshToken = registerResponse.body.data.refreshToken;
    });

    it('应该成功刷新token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token刷新成功',
        data: expect.objectContaining({
          accessToken: expect.any(String),
          expiresIn: expect.any(Number)
        })
      });
    });

    it('应该拒绝无效的refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('应该拒绝缺失的refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Protected Routes', () => {
    let accessToken: string;
    let userData: any;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });

      accessToken = registerResponse.body.data.accessToken;
      userData = registerResponse.body.data.user;
    });

    describe('GET /api/v1/auth/me', () => {
      it('应该返回当前用户信息', async () => {
        const response = await request(app)
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: '获取用户信息成功',
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: userData.id,
              email: userData.email,
              name: userData.name
            })
          })
        });
      });

      it('应该拒绝未认证的访问', async () => {
        const response = await request(app)
          .get('/api/v1/auth/me')
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('应该拒绝无效的token', async () => {
        const response = await request(app)
          .get('/api/v1/auth/me')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/v1/auth/profile', () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+9876543210'
      };

      it('应该成功更新用户信息', async () => {
        const response = await request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: '用户信息更新成功',
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: userData.id,
              email: userData.email,
              name: updateData.name,
              phone: updateData.phone
            })
          })
        });
      });

      it('应该拒绝未认证的访问', async () => {
        const response = await request(app)
          .put('/api/v1/auth/profile')
          .send(updateData)
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/v1/auth/change-password', () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      };

      it('应该成功修改密码', async () => {
        const response = await request(app)
          .put('/api/v1/auth/change-password')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(passwordData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: '密码修改成功'
        });
      });

      it('应该用新密码能够登录', async () => {
        // 修改密码
        await request(app)
          .put('/api/v1/auth/change-password')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(passwordData);

        // 用新密码登录
        const loginResponse = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: userData.email,
            password: passwordData.newPassword
          });

        expect(loginResponse.body.success).toBe(true);
      });

      it('应该拒绝错误的原密码', async () => {
        const wrongPasswordData = {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        };

        const response = await request(app)
          .put('/api/v1/auth/change-password')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(wrongPasswordData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/auth/logout', () => {
      it('应该成功登出', async () => {
        const response = await request(app)
          .post('/api/v1/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: '登出成功'
        });
      });

      it('应该拒绝未认证的访问', async () => {
        const response = await request(app)
          .post('/api/v1/auth/logout')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('POST /api/v1/auth/verify-token', () => {
    let accessToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });

      accessToken = registerResponse.body.data.accessToken;
    });

    it('应该成功验证有效token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-token')
        .send({ token: accessToken })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token验证成功',
        data: expect.objectContaining({
          valid: true,
          user: expect.objectContaining({
            email: 'test@example.com'
          })
        })
      });
    });

    it('应该拒绝无效token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-token')
        .send({ token: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('频率限制测试', () => {
    it('应该限制注册频率', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      // 发送多个注册请求
      const promises = Array(15).fill(null).map((_, index) =>
        request(app)
          .post('/api/v1/auth/register')
          .send({
            ...userData,
            email: `test${index}@example.com`
          })
      );

      const responses = await Promise.all(promises);

      // 检查是否有请求被限制
      const rateLimitedResponse = responses.find(res => res.status === 429);
      expect(rateLimitedResponse).toBeDefined();
    });

    it('应该限制登录频率', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      const loginData = {
        email: userData.email,
        password: 'wrongpassword'
      };

      // 发送多个登录请求
      const promises = Array(15).fill(null).map(() =>
        request(app)
          .post('/api/v1/auth/login')
          .send(loginData)
      );

      const responses = await Promise.all(promises);

      // 检查是否有请求被限制
      const rateLimitedResponse = responses.find(res => res.status === 429);
      expect(rateLimitedResponse).toBeDefined();
    });
  });
});