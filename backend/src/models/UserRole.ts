import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Role } from './Role';

// 用户角色关联属性接口
export interface UserRoleAttributes {
  id: number;
  userId: number;
  roleId: number;
  assignedBy: number;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 创建用户角色关联时的可选属性
export interface UserRoleCreationAttributes extends Optional<UserRoleAttributes,
  'id' | 'assignedBy' | 'assignedAt' | 'expiresAt' | 'isActive' | 'createdAt' | 'updatedAt'
> {}

// 用户角色关联模型类
export class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
  public id!: number;
  public userId!: number;
  public roleId!: number;
  public assignedBy!: number;
  public assignedAt!: Date;
  public expiresAt?: Date;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  // 关联关系
  public user?: User;
  public role?: Role;

  // 实例方法
  public toJSON(): Partial<UserRoleAttributes> {
    const userRoleObject = Object.assign({}, this.get()) as UserRoleAttributes;
    return userRoleObject;
  }

  // 激活角色
  public async activate(): Promise<void> {
    this.isActive = true;
    await this.save();
  }

  // 停用角色
  public async deactivate(): Promise<void> {
    this.isActive = false;
    await this.save();
  }

  // 检查是否过期
  public isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }

  // 检查是否有效
  public isValid(): boolean {
    return this.isActive && !this.isExpired();
  }

  // 延长过期时间
  public async extendExpiry(days: number): Promise<void> {
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + days);
    this.expiresAt = newExpiryDate;
    await this.save();
  }
}

// 初始化用户角色关联模型
UserRole.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Role,
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    assignedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1, // 默认系统管理员
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'user_roles',
    modelName: 'UserRole',
    sequelize,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'role_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['role_id'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['assigned_by'],
      },
      {
        fields: ['expires_at'],
      },
      {
        fields: ['is_active', 'expires_at'],
      },
    ],
  }
);

export default UserRole;