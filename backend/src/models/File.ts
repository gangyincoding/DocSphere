import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// 文件属性接口
export interface FileAttributes {
  id: number;
  name: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  extension: string;
  checksum: string;
  folderId?: number | null;
  userId: number;
  isPublic: boolean;
  description?: string;
  tags?: string;
  downloadCount: number;
  lastAccessAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: number;
  version: number;
  isVersioned: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 创建文件时的可选属性
export interface FileCreationAttributes extends Optional<FileAttributes,
  'id' | 'folderId' | 'description' | 'tags' | 'isPublic' | 'isDeleted' | 'deletedAt' | 'deletedBy' | 'downloadCount' | 'lastAccessAt' | 'version' | 'isVersioned' | 'expiresAt' | 'createdAt' | 'updatedAt'
> {}

// 文件模型类
export class File extends Model<FileAttributes, FileCreationAttributes> implements FileAttributes {
  public id!: number;
  public name!: string;
  public originalName!: string;
  public path!: string;
  public size!: number;
  public mimeType!: string;
  public extension!: string;
  public checksum!: string;
  public folderId?: number | null;
  public userId!: number;
  public isPublic!: boolean;
  public description?: string;
  public tags?: string;
  public downloadCount!: number;
  public lastAccessAt?: Date;
  public isDeleted!: boolean;
  public deletedAt?: Date;
  public deletedBy?: number;
  public version!: number;
  public isVersioned!: boolean;
  public expiresAt?: Date;
  public createdAt!: Date;
  public updatedAt!: Date;

  // 实例方法
  public toJSON(): Partial<FileAttributes> {
    const fileObject = Object.assign({}, this.get()) as FileAttributes;
    return fileObject;
  }

  // 获取文件大小的可读格式
  public getFormattedSize(): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = this.size;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  // 检查文件是否为图片
  public isImage(): boolean {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    return imageTypes.includes(this.mimeType);
  }

  // 检查文件是否为视频
  public isVideo(): boolean {
    const videoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'];
    return videoTypes.includes(this.mimeType);
  }

  // 检查文件是否为音频
  public isAudio(): boolean {
    const audioTypes = ['audio/mp3', 'audio/wav', 'audio/flac', 'audio/aac'];
    return audioTypes.includes(this.mimeType);
  }

  // 检查文件是否为文档
  public isDocument(): boolean {
    const docTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv'
    ];
    return docTypes.includes(this.mimeType);
  }

  // 检查文件是否为压缩文件
  public isArchive(): boolean {
    const archiveTypes = [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/gzip'
    ];
    return archiveTypes.includes(this.mimeType);
  }

  // 检查文件是否过期
  public isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }

  // 检查文件是否被删除
  public isDeletedFile(): boolean {
    return this.isDeleted;
  }

  // 检查用户是否有权限访问
  public canAccess(userId: number, isAdmin: boolean = false): boolean {
    return this.userId === userId || this.isPublic || isAdmin;
  }

  // 记录下载
  public async recordDownload(): Promise<void> {
    this.downloadCount += 1;
    this.lastAccessAt = new Date();
    await this.save();
  }

  // 软删除文件
  public async softDelete(userId: number): Promise<void> {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    await this.save();
  }

  // 恢复文件
  public async restore(): Promise<void> {
    this.isDeleted = false;
    this.deletedAt = undefined;
    this.deletedBy = undefined;
    await this.save();
  }

  // 更新文件信息
  public async updateInfo(updateData: {
    name?: string;
    description?: string;
    tags?: string;
    isPublic?: boolean;
    expiresAt?: Date;
  }): Promise<void> {
    if (updateData.name) this.name = updateData.name;
    if (updateData.description) this.description = updateData.description;
    if (updateData.tags) this.tags = updateData.tags;
    if (updateData.isPublic !== undefined) this.isPublic = updateData.isPublic;
    if (updateData.expiresAt) this.expiresAt = updateData.expiresAt;

    await this.save();
  }

  // 添加标签
  public addTag(tag: string): void {
    const currentTags = this.tags ? this.tags.split(',') : [];
    if (!currentTags.includes(tag.trim())) {
      currentTags.push(tag.trim());
      this.tags = currentTags.join(',');
    }
  }

  // 移除标签
  public removeTag(tag: string): void {
    const currentTags = this.tags ? this.tags.split(',') : [];
    const index = currentTags.indexOf(tag.trim());
    if (index > -1) {
      currentTags.splice(index, 1);
      this.tags = currentTags.join(',');
    }
  }

  // 获取标签数组
  public getTags(): string[] {
    return this.tags ? this.tags.split(',').filter(tag => tag.trim()) : [];
  }
}

// 初始化文件模型
File.init(
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
      },
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
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
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: 0,
        max: 1024 * 1024 * 1024 * 10, // 10GB max
      },
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    extension: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 10],
      },
    },
    checksum: {
      type: DataTypes.STRING(64),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [32, 64], // MD5 or SHA256
      },
    },
    folderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'folders',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
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
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    downloadCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    lastAccessAt: {
      type: DataTypes.DATE,
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
    version: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    isVersioned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    expiresAt: {
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
    tableName: 'files',
    modelName: 'File',
    sequelize,
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['folderId'],
      },
      {
        fields: ['isDeleted'],
      },
      {
        fields: ['isPublic'],
      },
      {
        fields: ['mimeType'],
      },
      {
        fields: ['extension'],
      },
      {
        fields: ['checksum'],
      },
      {
        fields: ['createdAt'],
      },
      {
        fields: ['lastAccessAt'],
      },
      {
        fields: ['expiresAt'],
      },
      {
        fields: ['name', 'folderId', 'userId', 'isDeleted'],
      },
    ],
  }
);

export default File;