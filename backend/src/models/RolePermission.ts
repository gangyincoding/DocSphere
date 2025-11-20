import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Role } from './Role';
import { Permission } from './Permission';

// 角色权限关联属性接口
export interface RolePermissionAttributes {
  id: number;
  roleId: number;
  permissionId: number;
  grantedBy: number;
  grantedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 创建角色权限关联时的可选属性
export interface RolePermissionCreationAttributes extends Optional<RolePermissionAttributes,
  'id' | 'grantedBy' | 'grantedAt' | 'isActive' | 'createdAt' | 'updatedAt'
> {}

// 角色权限关联模型类
export class RolePermission extends Model<RolePermissionAttributes, RolePermissionCreationAttributes> implements RolePermissionAttributes {
  public id!: number;
  public roleId!: number;
  public permissionId!: number;
  public grantedBy!: number;
  public grantedAt!: Date;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  // 关联关系
  public role?: Role;
  public permission?: Permission;

  // 实例方法
  public toJSON(): Partial<RolePermissionAttributes> {
    const rolePermissionObject = Object.assign({}, this.get()) as RolePermissionAttributes;
    return rolePermissionObject;
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

// 初始化角色权限关联模型
RolePermission.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
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
    permissionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Permission,
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    grantedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1, // 默认系统管理员
    },
    grantedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    tableName: 'role_permissions',
    modelName: 'RolePermission',
    sequelize,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['role_id', 'permission_id'],
      },
      {
        fields: ['role_id'],
      },
      {
        fields: ['permission_id'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['granted_by'],
      },
    ],
  }
);

export default RolePermission;