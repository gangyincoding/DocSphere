import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sequelize } from '../config/database';

// 用户属性接口
export interface UserAttributes {
  id: number;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: Date;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 创建用户时的可选属性
export interface UserCreationAttributes extends Optional<UserAttributes,
  'id' | 'avatar' | 'phone' | 'status' | 'lastLoginAt' | 'emailVerified' | 'emailVerifiedAt' | 'createdAt' | 'updatedAt'
> {}

// 用户模型类
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public name!: string;
  public avatar?: string;
  public phone?: string;
  public status!: 'active' | 'inactive' | 'suspended';
  public lastLoginAt?: Date;
  public emailVerified!: boolean;
  public emailVerifiedAt?: Date;
  public createdAt!: Date;
  public updatedAt!: Date;

  // 实例方法
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  public generateAuthToken(): string {
    const payload = {
      id: this.id,
      email: this.email,
      type: 'access'
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
  }

  public generateRefreshToken(): string {
    const payload = {
      id: this.id,
      email: this.email,
      type: 'refresh'
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
    });
  }

  public toJSON(): Partial<UserAttributes> {
    const userObject = Object.assign({}, this.get()) as UserAttributes;
    delete userObject.password;
    return userObject;
  }

  public async updateLastLogin(): Promise<void> {
    this.lastLoginAt = new Date();
    await this.save();
  }
}

// 初始化用户模型
User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 255], // 最少6位密码
      },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[+]?[\d\s-()]+$/, // 简单的电话号码验证
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    emailVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'users',
    modelName: 'User',
    sequelize,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['emailVerified'],
      },
    ],
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;