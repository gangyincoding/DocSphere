import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// 文件夹属性接口
export interface FolderAttributes {
  id: number;
  name: string;
  path: string;
  parentId?: number | null;
  level: number;
  isPublic: boolean;
  userId: number;
  description?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

// 创建文件夹时的可选属性
export interface FolderCreationAttributes extends Optional<FolderAttributes,
  'id' | 'parentId' | 'description' | 'isPublic' | 'isDeleted' | 'deletedAt' | 'deletedBy' | 'createdAt' | 'updatedAt'
> {}

// 文件夹模型类
export class Folder extends Model<FolderAttributes, FolderCreationAttributes> implements FolderAttributes {
  public id!: number;
  public name!: string;
  public path!: string;
  public parentId?: number | null;
  public level!: number;
  public isPublic!: boolean;
  public userId!: number;
  public description?: string;
  public isDeleted!: boolean;
  public deletedAt?: Date;
  public deletedBy?: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  // 实例方法
  public toJSON(): Partial<FolderAttributes> {
    const folderObject = Object.assign({}, this.get()) as FolderAttributes;
    return folderObject;
  }

  // 获取文件夹的完整路径
  public getFullPath(): string {
    return this.path;
  }

  // 检查是否为根文件夹
  public isRoot(): boolean {
    return this.level === 0 && this.parentId === null;
  }

  // 检查是否为公开文件夹
  public isAccessible(): boolean {
    return this.isPublic;
  }

  // 检查文件夹是否被删除
  public isDeletedFolder(): boolean {
    return this.isDeleted;
  }

  // 软删除文件夹
  public async softDelete(userId: number): Promise<void> {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    await this.save();
  }

  // 恢复文件夹
  public async restore(): Promise<void> {
    this.isDeleted = false;
    this.deletedAt = undefined;
    this.deletedBy = undefined;
    await this.save();
  }

  // 移动文件夹
  public async moveTo(newParentId: number | null): Promise<void> {
    this.parentId = newParentId;
    this.level = newParentId ? 1 : 0; // 简化处理，实际应该递归计算
    this.path = await this.calculatePath();
    await this.save();
  }

  // 计算文件夹路径
  private async calculatePath(): Promise<string> {
    if (!this.parentId) {
      return `/${this.name}`;
    }

    // 这里需要递归查询父文件夹路径
    // 简化处理，实际应该递归查询
    return `/parent/${this.name}`;
  }

  // 检查用户是否有权限访问
  public canAccess(userId: number, isAdmin: boolean = false): boolean {
    return this.userId === userId || this.isPublic || isAdmin;
  }
}

// 初始化文件夹模型
Folder.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
        // 禁止特殊字符
        not: /[<>:"/\\|?*]/,
      },
    },
    path: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 1000],
      },
    },
    parentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'folders',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    level: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 10,
      },
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deletedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
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
    tableName: 'folders',
    modelName: 'Folder',
    sequelize,
    timestamps: true,
    paranoid: false, // 使用软删除字段而不是paranoid
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['parent_id'],
      },
      {
        fields: ['is_deleted'],
      },
      {
        fields: ['is_public'],
      },
      {
        fields: ['level'],
      },
      {
        fields: [{ name: 'path', length: 255 }], // 索引前255个字符
      },
      {
        unique: true,
        fields: ['name', 'parent_id', 'user_id', 'is_deleted'],
      },
    ],
  }
);

export default Folder;