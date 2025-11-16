import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// 角色属性接口
export interface RoleAttributes {
  id: number;
  name: string;
  code: string;
  description: string;
  level: number;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 创建角色时的可选属性
export interface RoleCreationAttributes extends Optional<RoleAttributes,
  'id' | 'description' | 'isSystem' | 'isActive' | 'createdAt' | 'updatedAt'
> {}

// 角色模型类
export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public description!: string;
  public level!: number;
  public isSystem!: boolean;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  // 实例方法
  public toJSON(): Partial<RoleAttributes> {
    const roleObject = Object.assign({}, this.get()) as RoleAttributes;
    return roleObject;
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

  // 检查是否为系统角色
  public isSystemRole(): boolean {
    return this.isSystem;
  }

  // 检查是否可以删除
  public canBeDeleted(): boolean {
    return !this.isSystem && this.isActive;
  }
}

// 初始化角色模型
Role.init(
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
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 50],
        is: /^[a-zA-Z0-9_]+$/, // 只允许字母、数字、下划线
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    level: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 1000,
      },
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    tableName: 'roles',
    modelName: 'Role',
    sequelize,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['code'],
      },
      {
        fields: ['level'],
      },
      {
        fields: ['isSystem'],
      },
      {
        fields: ['isActive'],
      },
    ],
  }
);

export default Role;