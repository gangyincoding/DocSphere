import { User } from '../../../models/User';
import { sequelize } from '../../../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('User Model', () => {
  // 测试前设置数据库
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // 每个测试前清理数据
    await User.sync({ force: true });
  });

  describe('用户创建', () => {
    it('应该成功创建用户', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '+1234567890'
      };

      const user = await User.create(userData);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.phone).toBe(userData.phone);
      expect(user.status).toBe('active');
      expect(user.emailVerified).toBe(false);
      expect(user.password).not.toBe(userData.password); // 密码应该被哈希
    });

    it('应该自动哈希密码', async () => {
      const password = 'password123';
      const user = await User.create({
        email: 'test@example.com',
        password,
        name: 'Test User'
      });

      // 密码不应该明文存储
      expect(user.password).not.toBe(password);

      // 密码应该可以被验证
      const isValid = await bcrypt.compare(password, user.password);
      expect(isValid).toBe(true);
    });

    it('应该拒绝无效邮箱格式', async () => {
      await expect(User.create({
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User'
      })).rejects.toThrow();
    });

    it('应该拒绝过短密码', async () => {
      await expect(User.create({
        email: 'test@example.com',
        password: '123',
        name: 'Test User'
      })).rejects.toThrow();
    });

    it('应该拒绝重复邮箱', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      await User.create(userData);

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('实例方法', () => {
    let user: User;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    });

    describe('comparePassword', () => {
      it('应该验证正确密码', async () => {
        const isValid = await user.comparePassword('password123');
        expect(isValid).toBe(true);
      });

      it('应该拒绝错误密码', async () => {
        const isValid = await user.comparePassword('wrongpassword');
        expect(isValid).toBe(false);
      });
    });

    describe('generateAuthToken', () => {
      it('应该生成有效的JWT token', () => {
        const token = user.generateAuthToken();

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');

        // 验证token结构
        const decoded = jwt.decode(token) as any;
        expect(decoded.id).toBe(user.id);
        expect(decoded.email).toBe(user.email);
        expect(decoded.type).toBe('access');
      });

      it('生成的token应该可以通过验证', () => {
        const token = user.generateAuthToken();
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        expect(decoded).toBeDefined();
      });
    });

    describe('generateRefreshToken', () => {
      it('应该生成有效的刷新token', () => {
        const token = user.generateRefreshToken();

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');

        // 验证token结构
        const decoded = jwt.decode(token) as any;
        expect(decoded.id).toBe(user.id);
        expect(decoded.email).toBe(user.email);
        expect(decoded.type).toBe('refresh');
      });
    });

    describe('toJSON', () => {
      it('应该排除密码字段', () => {
        const userObject = user.toJSON();

        expect(userObject.password).toBeUndefined();
        expect(userObject.id).toBe(user.id);
        expect(userObject.email).toBe(user.email);
      });
    });

    describe('updateLastLogin', () => {
      it('应该更新最后登录时间', async () => {
        const beforeUpdate = new Date();

        await user.updateLastLogin();

        const afterUpdate = new Date();
        expect(user.lastLoginAt).toBeDefined();
        expect(user.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
        expect(user.lastLoginAt!.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
      });
    });
  });

  describe('模型验证', () => {
    it('应该验证姓名长度', async () => {
      await expect(User.create({
        email: 'test@example.com',
        password: 'password123',
        name: ''
      })).rejects.toThrow();

      await expect(User.create({
        email: 'test2@example.com',
        password: 'password123',
        name: 'a'.repeat(101)
      })).rejects.toThrow();
    });

    it('应该验证电话号码格式', async () => {
      await expect(User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: 'invalid-phone'
      })).rejects.toThrow();
    });

    it('应该允许有效的电话号码', async () => {
      const validPhones = [
        '+1234567890',
        '1234567890',
        '+86 138 0013 8000',
        '(123) 456-7890'
      ];

      for (const phone of validPhones) {
        const user = await User.create({
          email: `test${phone}@example.com`,
          password: 'password123',
          name: 'Test User',
          phone
        });
        expect(user.phone).toBe(phone);
      }
    });
  });

  describe('用户状态', () => {
    it('应该支持不同的用户状态', async () => {
      const statuses = ['active', 'inactive', 'suspended'] as const;

      for (const status of statuses) {
        const user = await User.create({
          email: `test${status}@example.com`,
          password: 'password123',
          name: 'Test User',
          status
        });
        expect(user.status).toBe(status);
      }
    });
  });

  describe('邮箱验证', () => {
    it('应该默认邮箱未验证', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      expect(user.emailVerified).toBe(false);
      expect(user.emailVerifiedAt).toBeNull();
    });

    it('应该支持设置邮箱验证状态', async () => {
      const verificationTime = new Date();
      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        emailVerified: true,
        emailVerifiedAt: verificationTime
      });

      expect(user.emailVerified).toBe(true);
      expect(user.emailVerifiedAt).toEqual(verificationTime);
    });
  });
});