import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// 权限属性接口
export interface PermissionAttributes {
  id: number;
  name: string;
  code: string;
  description: string;
  resource: string;
  action: string;
  module: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 创建权限时的可选属性
export interface PermissionCreationAttributes extends Optional<PermissionAttributes,
  'id' | 'description' | 'isActive' | 'createdAt' | 'updatedAt'
> {}

// 权限模型类
export class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public description!: string;
  public resource!: string;
  public action!: string;
  public module!: string;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  // 实例方法
  public toJSON(): Partial<PermissionAttributes> {
    const permissionObject = Object.assign({}, this.get()) as PermissionAttributes;
    return permissionObject;
  }

  // 激活权限
  public async activate(): Promise<void> {
    this.isActive = true;
    await this.save();
  }

  // 停用权限
  public async deactivate(): Promise<void> {
    this.isActive = false;
    await this.save();
  }
}

// 初始化权限模型
Permission.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 100],
        is: /^[a-zA-Z0-9_:]+$/, // 只允许字母、数字、下划线、冒号
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resource: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [['user', 'file', 'folder', 'permission', 'role', 'system', 'audit']],
      },
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [['create', 'read', 'update', 'delete', 'list', 'manage', 'download', 'upload', 'share', 'admin']],
      },
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [['auth', 'file', 'user', 'permission', 'role', 'system', 'audit']],
      },
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
    tableName: 'permissions',
    modelName: 'Permission',
    sequelize,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['code'],
      },
      {
        fields: ['resource'],
      },
      {
        fields: ['action'],
      },
      {
        fields: ['module'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['resource', 'action'],
      },
    ],
  }
);

export default Permission;