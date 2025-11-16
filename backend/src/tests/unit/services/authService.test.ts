import authService from '../../../services/authService';
import { User } from '../../../models/User';
import { sequelize } from '../../../config/database';
import { ValidationError, NotFoundError } from '../../../utils/errors';
import jwt from 'jsonwebtoken';

describe('AuthService', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.sync({ force: true });
  });

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '+1234567890'
      };

      const result = await authService.register(userData);

      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.user.phone).toBe(userData.phone);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBeGreaterThan(0);
      expect(result.user.password).toBeUndefined(); // 密码应该被排除
    });

    it('应该拒绝重复邮箱注册', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      await authService.register(userData);

      await expect(authService.register(userData)).rejects.toThrow(ValidationError);
    });

    it('应该拒绝弱密码', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User'
      };

      await expect(authService.register(userData)).rejects.toThrow(ValidationError);
    });

    it('应该将邮箱转换为小写', async () => {
      const userData = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
        name: 'Test User'
      };

      const result = await authService.register(userData);
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('login', () => {
    let user: User;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    });

    it('应该成功登录有效用户', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await authService.login(loginData);

      expect(result.user.email).toBe(user.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('应该拒绝错误密码', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      await expect(authService.login(loginData)).rejects.toThrow(ValidationError);
    });

    it('应该拒绝不存在的用户', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      await expect(authService.login(loginData)).rejects.toThrow(ValidationError);
    });

    it('应该拒绝非活跃用户', async () => {
      await user.update({ status: 'inactive' });

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      await expect(authService.login(loginData)).rejects.toThrow(ValidationError);
    });

    it('应该更新最后登录时间', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      await authService.login(loginData);

      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser?.lastLoginAt).toBeDefined();
      expect(updatedUser?.lastLoginAt!.getTime()).toBeGreaterThan(Date.now() - 60000);
    });

    it('应该将邮箱转换为小写', async () => {
      const loginData = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123'
      };

      const result = await authService.login(loginData);
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('refreshToken', () => {
    let user: User;
    let validRefreshToken: string;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      validRefreshToken = user.generateRefreshToken();
    });

    it('应该成功刷新有效的token', async () => {
      const result = await authService.refreshToken(validRefreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('应该拒绝无效的refresh token', async () => {
      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(ValidationError);
    });

    it('应该拒绝过期的token', async () => {
      // 创建过期的token
      const expiredToken = jwt.sign(
        { id: user.id, email: user.email, type: 'refresh' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' }
      );

      await expect(authService.refreshToken(expiredToken)).rejects.toThrow(ValidationError);
    });

    it('应该拒绝access token作为refresh token', async () => {
      const accessToken = user.generateAuthToken();

      await expect(authService.refreshToken(accessToken)).rejects.toThrow(ValidationError);
    });

    it('应该拒绝非活跃用户的token', async () => {
      await user.update({ status: 'inactive' });

      await expect(authService.refreshToken(validRefreshToken)).rejects.toThrow(ValidationError);
    });
  });

  describe('getUserById', () => {
    let user: User;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    });

    it('应该返回存在的用户信息', async () => {
      const result = await authService.getUserById(user.id);

      expect(result.id).toBe(user.id);
      expect(result.email).toBe(user.email);
      expect(result.name).toBe(user.name);
      expect(result.password).toBeUndefined();
    });

    it('应该返回用户不存在错误', async () => {
      await expect(authService.getUserById(99999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateUser', () => {
    let user: User;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    });

    it('应该成功更新用户信息', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+1234567890'
      };

      const result = await authService.updateUser(user.id, updateData);

      expect(result.name).toBe(updateData.name);
      expect(result.phone).toBe(updateData.phone);
      expect(result.email).toBe(user.email); // 未更新的字段应该保持原样
    });

    it('应该允许更新邮箱', async () => {
      const updateData = {
        email: 'newemail@example.com'
      };

      const result = await authService.updateUser(user.id, updateData);
      expect(result.email).toBe(updateData.email);
    });

    it('应该拒绝重复的邮箱', async () => {
      const anotherUser = await User.create({
        email: 'another@example.com',
        password: 'password123',
        name: 'Another User'
      });

      await expect(authService.updateUser(anotherUser.id, { email: user.email }))
        .rejects.toThrow(ValidationError);
    });

    it('应该忽略密码更新', async () => {
      const oldPasswordHash = user.password;
      const updateData = {
        password: 'newpassword123'
      };

      await authService.updateUser(user.id, updateData);

      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser?.password).toBe(oldPasswordHash);
    });

    it('应该返回用户不存在错误', async () => {
      await expect(authService.updateUser(99999, { name: 'Test' }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('changePassword', () => {
    let user: User;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    });

    it('应该成功修改密码', async () => {
      const oldPasswordHash = user.password;

      await authService.changePassword(user.id, 'password123', 'newpassword123');

      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser?.password).not.toBe(oldPasswordHash);

      // 验证新密码可以登录
      const canLogin = await updatedUser?.comparePassword('newpassword123');
      expect(canLogin).toBe(true);
    });

    it('应该拒绝错误的原密码', async () => {
      await expect(authService.changePassword(user.id, 'wrongpassword', 'newpassword123'))
        .rejects.toThrow(ValidationError);
    });

    it('应该拒绝弱的新密码', async () => {
      await expect(authService.changePassword(user.id, 'password123', '123'))
        .rejects.toThrow(ValidationError);
    });

    it('应该返回用户不存在错误', async () => {
      await expect(authService.changePassword(99999, 'password123', 'newpassword123'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('validateToken', () => {
    let user: User;
    let validToken: string;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      validToken = user.generateAuthToken();
    });

    it('应该验证有效的access token', async () => {
      const result = await authService.validateToken(validToken);

      expect(result.id).toBe(user.id);
      expect(result.email).toBe(user.email);
      expect(result.password).toBeUndefined();
    });

    it('应该拒绝无效的token', async () => {
      await expect(authService.validateToken('invalid-token'))
        .rejects.toThrow(ValidationError);
    });

    it('应该拒绝过期的token', async () => {
      const expiredToken = jwt.sign(
        { id: user.id, email: user.email, type: 'access' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' }
      );

      await expect(authService.validateToken(expiredToken))
        .rejects.toThrow(ValidationError);
    });

    it('应该拒绝refresh token作为access token', async () => {
      const refreshToken = user.generateRefreshToken();

      await expect(authService.validateToken(refreshToken))
        .rejects.toThrow(ValidationError);
    });

    it('应该拒绝非活跃用户的token', async () => {
      await user.update({ status: 'inactive' });

      await expect(authService.validateToken(validToken))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('私有方法测试', () => {
    describe('validatePassword', () => {
      // 由于是私有方法，我们通过公共方法的行为来间接测试
      it('应该强制密码包含字母和数字', async () => {
        const invalidPasswords = ['123456', 'abcdef', ''];

        for (const password of invalidPasswords) {
          await expect(authService.register({
            email: `test${password}@example.com`,
            password,
            name: 'Test User'
          })).rejects.toThrow(ValidationError);
        }
      });

      it('应该接受有效的密码', async () => {
        const validPasswords = ['password123', 'mypass1', 'test123'];

        for (const password of validPasswords) {
          const result = await authService.register({
            email: `test${password}@example.com`,
            password,
            name: 'Test User'
          });
          expect(result.accessToken).toBeDefined();
        }
      });
    });
  });
});