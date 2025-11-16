import { User } from '../models/User';
import { ValidationError, DatabaseError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

// 用户注册数据接口
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

// 用户登录数据接口
export interface LoginData {
  email: string;
  password: string;
}

// 认证响应接口
export interface AuthResponse {
  user: Partial<UserAttributes>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// 刷新Token响应接口
export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export class AuthService {
  /**
   * 用户注册
   */
  public async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // 验证邮箱是否已存在
      const existingUser = await User.findOne({ where: { email: data.email } });
      if (existingUser) {
        throw new ValidationError('该邮箱已被注册');
      }

      // 验证密码强度
      if (!this.validatePassword(data.password)) {
        throw new ValidationError('密码必须包含字母和数字，且长度至少6位');
      }

      // 创建用户
      const user = await User.create({
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone,
        status: 'active',
        emailVerified: false,
      });

      // 生成token
      const accessToken = user.generateAuthToken();
      const refreshToken = user.generateRefreshToken();
      const expiresIn = this.getTokenExpiration();

      logger.info(`新用户注册成功: ${user.email}`, { userId: user.id });

      return {
        user: user.toJSON(),
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('用户注册失败', { error, email: data.email });
      throw new DatabaseError('注册失败，请稍后重试');
    }
  }

  /**
   * 用户登录
   */
  public async login(data: LoginData): Promise<AuthResponse> {
    try {
      // 查找用户
      const user = await User.findOne({ where: { email: data.email } });
      if (!user) {
        throw new ValidationError('邮箱或密码错误');
      }

      // 检查用户状态
      if (user.status !== 'active') {
        throw new ValidationError('账号已被禁用，请联系管理员');
      }

      // 验证密码
      const isPasswordValid = await user.comparePassword(data.password);
      if (!isPasswordValid) {
        throw new ValidationError('邮箱或密码错误');
      }

      // 更新最后登录时间
      await user.updateLastLogin();

      // 生成token
      const accessToken = user.generateAuthToken();
      const refreshToken = user.generateRefreshToken();
      const expiresIn = this.getTokenExpiration();

      logger.info(`用户登录成功: ${user.email}`, { userId: user.id });

      return {
        user: user.toJSON(),
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('用户登录失败', { error, email: data.email });
      throw new DatabaseError('登录失败，请稍后重试');
    }
  }

  /**
   * 刷新Token
   */
  public async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      // 验证refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;

      if (decoded.type !== 'refresh') {
        throw new ValidationError('无效的刷新令牌');
      }

      // 查找用户
      const user = await User.findByPk(decoded.id);
      if (!user || user.status !== 'active') {
        throw new ValidationError('用户不存在或已被禁用');
      }

      // 生成新的access token
      const newAccessToken = user.generateAuthToken();
      const expiresIn = this.getTokenExpiration();

      logger.info(`Token刷新成功: ${user.email}`, { userId: user.id });

      return {
        accessToken: newAccessToken,
        expiresIn,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ValidationError('刷新令牌已过期或无效');
      }
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('Token刷新失败', { error });
      throw new DatabaseError('刷新令牌失败，请重新登录');
    }
  }

  /**
   * 根据ID获取用户信息
   */
  public async getUserById(id: number): Promise<Partial<UserAttributes>> {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      return user.toJSON();
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('获取用户信息失败', { error, userId: id });
      throw new DatabaseError('获取用户信息失败');
    }
  }

  /**
   * 更新用户信息
   */
  public async updateUser(id: number, data: Partial<UserAttributes>): Promise<Partial<UserAttributes>> {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 如果更新邮箱，检查唯一性
      if (data.email && data.email !== user.email) {
        const existingUser = await User.findOne({ where: { email: data.email } });
        if (existingUser) {
          throw new ValidationError('该邮箱已被使用');
        }
      }

      // 不允许通过此接口更新密码
      if (data.password) {
        delete data.password;
      }

      await user.update(data);

      logger.info(`用户信息更新成功`, { userId: id, updatedFields: Object.keys(data) });

      return user.toJSON();
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('更新用户信息失败', { error, userId: id });
      throw new DatabaseError('更新用户信息失败');
    }
  }

  /**
   * 修改密码
   */
  public async changePassword(id: number, oldPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 验证旧密码
      const isOldPasswordValid = await user.comparePassword(oldPassword);
      if (!isOldPasswordValid) {
        throw new ValidationError('原密码错误');
      }

      // 验证新密码强度
      if (!this.validatePassword(newPassword)) {
        throw new ValidationError('新密码必须包含字母和数字，且长度至少6位');
      }

      // 更新密码
      await user.update({ password: newPassword });

      logger.info(`用户密码修改成功`, { userId: id });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('修改密码失败', { error, userId: id });
      throw new DatabaseError('修改密码失败，请稍后重试');
    }
  }

  /**
   * 验证token有效性并获取用户
   */
  public async validateToken(token: string): Promise<Partial<UserAttributes>> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (decoded.type !== 'access') {
        throw new ValidationError('无效的访问令牌');
      }

      const user = await User.findByPk(decoded.id);
      if (!user || user.status !== 'active') {
        throw new ValidationError('用户不存在或已被禁用');
      }

      return user.toJSON();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof ValidationError) {
        throw new ValidationError('访问令牌无效或已过期');
      }
      logger.error('Token验证失败', { error });
      throw new DatabaseError('Token验证失败');
    }
  }

  /**
   * 验证密码强度
   */
  private validatePassword(password: string): boolean {
    // 至少6位，包含字母和数字
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
    return passwordRegex.test(password);
  }

  /**
   * 获取token过期时间（秒）
   */
  private getTokenExpiration(): number {
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const timeValue = parseInt(expiresIn.replace(/[a-zA-Z]/g, ''));
    const timeUnit = expiresIn.replace(/[0-9]/g, '');

    switch (timeUnit) {
      case 'h':
        return timeValue * 3600;
      case 'd':
        return timeValue * 24 * 3600;
      case 'm':
        return timeValue * 60;
      default:
        return 24 * 3600; // 默认24小时
    }
  }
}

export default new AuthService();