import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// 文件分享属性接口
export interface FileShareAttributes {
  id: number;
  fileId: number;
  userId: number;
  shareType: 'link' | 'user' | 'public';
  shareCode?: string;
  expiresAt?: Date;
  accessCount: number;
  maxAccessCount?: number;
  canDownload: boolean;
  canComment: boolean;
  canEdit: boolean;
  password?: string;
  description?: string;
  isActive: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

// 创建文件分享时的可选属性
export interface FileShareCreationAttributes extends Optional<FileShareAttributes,
  'id' | 'shareCode' | 'expiresAt' | 'accessCount' | 'maxAccessCount' | 'password' | 'description' | 'isActive' | 'createdAt' | 'updatedAt'
> {}

// 文件分享模型类
export class FileShare extends Model<FileShareAttributes, FileShareCreationAttributes> implements FileShareAttributes {
  public id!: number;
  public fileId!: number;
  public userId!: number;
  public shareType!: 'link' | 'user' | 'public';
  public shareCode?: string;
  public expiresAt?: Date;
  public accessCount!: number;
  public maxAccessCount?: number;
  public canDownload!: boolean;
  public canComment!: boolean;
  public canEdit!: boolean;
  public password?: string;
  public description?: string;
  public isActive!: boolean;
  public createdBy!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  // 实例方法
  public toJSON(): Partial<FileShareAttributes> {
    const shareObject = Object.assign({}, this.get()) as FileShareAttributes;
    // 不返回密码
    delete shareObject.password;
    return shareObject;
  }

  // 检查分享是否过期
  public isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }

  // 检查分享是否已达到最大访问次数
  public isAccessLimitReached(): boolean {
    if (!this.maxAccessCount) {
      return false;
    }
    return this.accessCount >= this.maxAccessCount;
  }

  // 检查分享是否有效
  public isValid(): boolean {
    return this.isActive && !this.isExpired() && !this.isAccessLimitReached();
  }

  // 增加访问计数
  public async incrementAccess(): Promise<void> {
    this.accessCount += 1;
    await this.save();
  }

  // 生成分享代码
  public static generateShareCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 验证密码
  public verifyPassword(password: string): boolean {
    return this.password === password;
  }

  // 激活分享
  public async activate(): Promise<void> {
    this.isActive = true;
    await this.save();
  }

  // 停用分享
  public async deactivate(): Promise<void> {
    this.isActive = false;
    await this.save();
  }

  // 延长分享有效期
  public async extendExpiry(days: number): Promise<void> {
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + days);
    this.expiresAt = newExpiryDate;
    await this.save();
  }

  // 更新权限设置
  public async updatePermissions(permissions: {
    canDownload?: boolean;
    canComment?: boolean;
    canEdit?: boolean;
  }): Promise<void> {
    if (permissions.canDownload !== undefined) {
      this.canDownload = permissions.canDownload;
    }
    if (permissions.canComment !== undefined) {
      this.canComment = permissions.canComment;
    }
    if (permissions.canEdit !== undefined) {
      this.canEdit = permissions.canEdit;
    }
    await this.save();
  }
}

// 初始化文件分享模型
FileShare.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    fileId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'files',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
    shareType: {
      type: DataTypes.ENUM('link', 'user', 'public'),
      allowNull: false,
      defaultValue: 'link',
    },
    shareCode: {
      type: DataTypes.STRING(32),
      allowNull: true,
      unique: true,
      validate: {
        len: [0, 32],
      },
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    accessCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    maxAccessCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      validate: {
        min: 1,
        max: 1000000,
      },
    },
    canDownload: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    canComment: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    canEdit: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: [0, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
    tableName: 'file_shares',
    modelName: 'FileShare',
    sequelize,
    timestamps: true,
    indexes: [
      {
        fields: ['fileId'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['shareType'],
      },
      {
        fields: ['shareCode'],
        unique: true,
      },
      {
        fields: ['expiresAt'],
      },
      {
        fields: ['isActive'],
      },
      {
        fields: ['createdBy'],
      },
      {
        fields: ['isActive', 'expiresAt'],
      },
    ],
  }
);

export default FileShare;