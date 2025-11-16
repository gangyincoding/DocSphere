import { Op, Transaction } from 'sequelize';
import { sequelize } from '../config/database';
import { File, Folder, User, FileShare } from '../models/associations';
import { ValidationError, NotFoundError, ConflictError, DatabaseError } from '../utils/errors';
import { logger } from '../utils/logger';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';

// 文件上传数据接口
export interface UploadFileData {
  originalName: string;
  buffer: Buffer;
  size: number;
  mimeType: string;
  folderId?: number;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
}

// 文件查询参数接口
export interface FileQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  mimeType?: string;
  extension?: string;
  folderId?: number;
  isPublic?: boolean;
  userId?: number;
  sortBy?: 'name' | 'size' | 'createdAt' | 'downloadCount';
  sortOrder?: 'ASC' | 'DESC';
  tags?: string[];
}

// 文件夹创建数据接口
export interface CreateFolderData {
  name: string;
  parentId?: number;
  description?: string;
  isPublic?: boolean;
}

// 文件分享创建数据接口
export interface CreateShareData {
  fileId: number;
  shareType: 'link' | 'user' | 'public';
  expiresAt?: Date;
  maxAccessCount?: number;
  canDownload?: boolean;
  canComment?: boolean;
  canEdit?: boolean;
  password?: string;
  description?: string;
}

export class FileService {
  private uploadPath: string = './uploads';

  constructor() {
    this.ensureUploadDirectory();
  }

  /**
   * 确保上传目录存在
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.uploadPath, { recursive: true });
    } catch (error) {
      if ((error as any).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * 上传文件
   */
  public async uploadFile(userId: number, fileData: UploadFileData): Promise<File> {
    try {
      // 检查用户权限
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 检查文件大小限制
      const maxFileSize = 100 * 1024 * 1024; // 100MB
      if (fileData.size > maxFileSize) {
        throw new ValidationError('文件大小超过限制（最大100MB）');
      }

      // 检查文件夹是否存在
      if (fileData.folderId) {
        const folder = await Folder.findByPk(fileData.folderId);
        if (!folder) {
          throw new NotFoundError('文件夹不存在');
        }
        if (folder.userId !== userId && !folder.isPublic) {
          throw new ValidationError('无权访问该文件夹');
        }
      }

      // 计算文件checksum
      const checksum = crypto.createHash('sha256').update(fileData.buffer).digest('hex');

      // 检查重复文件
      const existingFile = await File.findOne({
        where: {
          checksum,
          userId,
          isDeleted: false,
        },
      });

      if (existingFile) {
        throw new ConflictError('文件已存在');
      }

      // 生成文件名和路径
      const extension = path.extname(fileData.originalName);
      const fileName = this.generateUniqueFileName(fileData.originalName, extension);
      const relativePath = `${userId}/${fileName}`;
      const fullPath = path.join(this.uploadPath, relativePath);

      // 保存文件到磁盘
      await fs.writeFile(fullPath, fileData.buffer);

      // 创建文件记录
      const file = await File.create({
        name: fileName,
        originalName: fileData.originalName,
        path: relativePath,
        size: fileData.size,
        mimeType: fileData.mimeType,
        extension: extension.replace('.', ''),
        checksum,
        folderId: fileData.folderId,
        userId,
        isPublic: fileData.isPublic || false,
        description: fileData.description,
        tags: fileData.tags?.join(','),
        downloadCount: 0,
        version: 1,
        isVersioned: false,
      });

      logger.info('文件上传成功', {
        fileId: file.id,
        fileName: file.originalName,
        userId,
        size: fileData.size,
      });

      return file;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      logger.error('文件上传失败', { error, userId, fileName: fileData.originalName });
      throw new DatabaseError('文件上传失败');
    }
  }

  /**
   * 下载文件
   */
  public async downloadFile(fileId: number, userId?: number): Promise<{ file: File; path: string }> {
    try {
      const file = await File.findByPk(fileId, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: Folder,
            as: 'folder',
            attributes: ['id', 'name', 'path'],
          },
        ],
      });

      if (!file || file.isDeleted) {
        throw new NotFoundError('文件不存在');
      }

      // 检查权限
      if (!file.canAccess(userId || 0)) {
        throw new ValidationError('无权访问该文件');
      }

      // 检查文件是否过期
      if (file.isExpired()) {
        throw new ValidationError('文件已过期');
      }

      const fullPath = path.join(this.uploadPath, file.path);

      // 检查文件是否存在
      try {
        await fs.access(fullPath);
      } catch {
        throw new NotFoundError('文件不存在');
      }

      // 增加下载计数
      await file.recordDownload();

      logger.info('文件下载', {
        fileId: file.id,
        fileName: file.originalName,
        userId,
        downloadCount: file.downloadCount,
      });

      return { file, path: fullPath };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('文件下载失败', { error, fileId, userId });
      throw new DatabaseError('文件下载失败');
    }
  }

  /**
   * 获取文件列表
   */
  public async getFiles(params: FileQueryParams): Promise<{ files: File[]; total: number }> {
    try {
      const {
        page = 1,
        pageSize = 20,
        search,
        mimeType,
        extension,
        folderId,
        isPublic,
        userId,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        tags,
      } = params;

      const where: any = {
        isDeleted: false,
      };

      // 添加过滤条件
      if (userId) {
        where.userId = userId;
      }

      if (folderId !== undefined) {
        where.folderId = folderId;
      }

      if (isPublic !== undefined) {
        where.isPublic = isPublic;
      }

      if (mimeType) {
        where.mimeType = { [Op.like]: `%${mimeType}%` };
      }

      if (extension) {
        where.extension = extension;
      }

      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { originalName: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ];
      }

      if (tags && tags.length > 0) {
        where.tags = {
          [Op.or]: tags.map(tag => ({ [Op.like]: `%${tag}%` })),
        };
      }

      const offset = (page - 1) * pageSize;
      const limit = pageSize;

      const { count, rows: files } = await File.findAndCountAll({
        where,
        limit,
        offset,
        order: [[sortBy, sortOrder]],
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: Folder,
            as: 'folder',
            attributes: ['id', 'name', 'path'],
          },
        ],
      });

      return {
        files,
        total: count,
      };
    } catch (error) {
      logger.error('获取文件列表失败', { error, params });
      throw new DatabaseError('获取文件列表失败');
    }
  }

  /**
   * 获取文件详情
   */
  public async getFile(fileId: number, userId?: number): Promise<File> {
    try {
      const file = await File.findByPk(fileId, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: Folder,
            as: 'folder',
            attributes: ['id', 'name', 'path'],
          },
        ],
      });

      if (!file || file.isDeleted) {
        throw new NotFoundError('文件不存在');
      }

      if (!file.canAccess(userId || 0)) {
        throw new ValidationError('无权访问该文件');
      }

      return file;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('获取文件详情失败', { error, fileId, userId });
      throw new DatabaseError('获取文件详情失败');
    }
  }

  /**
   * 创建文件夹
   */
  public async createFolder(userId: number, folderData: CreateFolderData): Promise<Folder> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 检查父文件夹
      if (folderData.parentId) {
        const parentFolder = await Folder.findByPk(folderData.parentId);
        if (!parentFolder || parentFolder.isDeleted) {
          throw new NotFoundError('父文件夹不存在');
        }
        if (parentFolder.userId !== userId && !parentFolder.isPublic) {
          throw new ValidationError('无权在父文件夹中创建文件夹');
        }
      }

      // 检查文件夹名是否重复
      const where: any = {
        name: folderData.name.trim(),
        userId,
        parentId: folderData.parentId || null,
        isDeleted: false,
      };

      const existingFolder = await Folder.findOne({ where });
      if (existingFolder) {
        throw new ConflictError('文件夹名称已存在');
      }

      // 计算文件夹路径
      let fullPath = `/${folderData.name.trim()}`;
      let level = 0;

      if (folderData.parentId) {
        const parentFolder = await Folder.findByPk(folderData.parentId);
        if (parentFolder) {
          fullPath = `${parentFolder.path}/${folderData.name.trim()}`;
          level = parentFolder.level + 1;
        }
      }

      const folder = await Folder.create({
        name: folderData.name.trim(),
        path: fullPath,
        parentId: folderData.parentId || null,
        level,
        userId,
        isPublic: folderData.isPublic || false,
        description: folderData.description,
      });

      logger.info('文件夹创建成功', {
        folderId: folder.id,
        folderName: folder.name,
        userId,
        path: folder.path,
      });

      return folder;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      logger.error('创建文件夹失败', { error, userId, folderData });
      throw new DatabaseError('创建文件夹失败');
    }
  }

  /**
   * 删除文件
   */
  public async deleteFile(fileId: number, userId: number): Promise<void> {
    try {
      const file = await File.findByPk(fileId);

      if (!file || file.isDeleted) {
        throw new NotFoundError('文件不存在');
      }

      if (file.userId !== userId) {
        throw new ValidationError('无权删除该文件');
      }

      await sequelize.transaction(async (t: Transaction) => {
        // 软删除文件
        await file.softDelete(userId);

        // 删除相关分享
        await FileShare.destroy({
          where: { fileId },
          transaction: t,
        });

        // 删除物理文件（可选，根据业务需求）
        const fullPath = path.join(this.uploadPath, file.path);
        try {
          await fs.unlink(fullPath);
        } catch (error) {
          logger.warn('删除物理文件失败', { error, filePath: fullPath });
        }
      });

      logger.info('文件删除成功', {
        fileId: file.id,
        fileName: file.originalName,
        userId,
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('删除文件失败', { error, fileId, userId });
      throw new DatabaseError('删除文件失败');
    }
  }

  /**
   * 创建文件分享
   */
  public async createShare(userId: number, shareData: CreateShareData): Promise<FileShare> {
    try {
      // 检查文件是否存在和权限
      const file = await File.findByPk(shareData.fileId);
      if (!file || file.isDeleted) {
        throw new NotFoundError('文件不存在');
      }

      if (file.userId !== userId) {
        throw new ValidationError('无权分享该文件');
      }

      // 生成分享代码
      let shareCode: string | undefined;
      if (shareData.shareType === 'link') {
        shareCode = FileShare.generateShareCode();
      }

      const share = await FileShare.create({
        fileId: shareData.fileId,
        userId,
        shareType: shareData.shareType,
        shareCode,
        expiresAt: shareData.expiresAt,
        maxAccessCount: shareData.maxAccessCount,
        canDownload: shareData.canDownload ?? true,
        canComment: shareData.canComment ?? false,
        canEdit: shareData.canEdit ?? false,
        password: shareData.password,
        description: shareData.description,
        createdBy: userId,
        isActive: true,
      });

      logger.info('文件分享创建成功', {
        shareId: share.id,
        fileId: share.fileId,
        shareType: share.shareType,
        userId,
      });

      return share;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('创建文件分享失败', { error, userId, shareData });
      throw new DatabaseError('创建文件分享失败');
    }
  }

  /**
   * 通过分享代码访问文件
   */
  public async getFileByShareCode(shareCode: string, password?: string): Promise<{ file: File; share: FileShare }> {
    try {
      const share = await FileShare.findOne({
        where: {
          shareCode,
          isActive: true,
        },
        include: [
          {
            model: File,
            as: 'file',
            where: {
              isDeleted: false,
            },
            include: [
              {
                model: User,
                as: 'owner',
                attributes: ['id', 'name', 'email'],
              },
            ],
          },
        ],
      });

      if (!share) {
        throw new NotFoundError('分享链接不存在或已失效');
      }

      if (!share.isValid()) {
        throw new ValidationError('分享链接已过期或达到访问次数限制');
      }

      if (share.password && (!password || !share.verifyPassword(password))) {
        throw new ValidationError('密码错误');
      }

      // 增加访问计数
      await share.incrementAccess();

      logger.info('通过分享链接访问文件', {
        shareId: share.id,
        fileId: share.fileId,
        accessCount: share.accessCount,
      });

      return {
        file: share.file!,
        share,
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('通过分享链接访问文件失败', { error, shareCode });
      throw new DatabaseError('访问分享文件失败');
    }
  }

  /**
   * 搜索文件
   */
  public async searchFiles(
    userId: number,
    query: string,
    options: {
      mimeType?: string;
      extension?: string;
      tags?: string[];
      userId?: number;
      includePublic?: boolean;
    } = {}
  ): Promise<File[]> {
    try {
      const where: any = {
        [Op.and]: [
          {
            [Op.or]: [
              { name: { [Op.like]: `%${query}%` } },
              { originalName: { [Op.like]: `%${query}%` } },
              { description: { [Op.like]: `%${query}%` } },
              { tags: { [Op.like]: `%${query}%` } },
            ],
          },
          { isDeleted: false },
        ],
      };

      if (options.includePublic) {
        where[Op.or] = [
          { userId },
          { isPublic: true },
        ];
      } else {
        where.userId = userId;
      }

      if (options.mimeType) {
        where.mimeType = { [Op.like]: `%${options.mimeType}%` };
      }

      if (options.extension) {
        where.extension = options.extension;
      }

      if (options.tags && options.tags.length > 0) {
        where.tags = {
          [Op.or]: options.tags.map(tag => ({ [Op.like]: `%${tag}%` })),
        };
      }

      const files = await File.findAll({
        where,
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: Folder,
            as: 'folder',
            attributes: ['id', 'name', 'path'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: 100, // 限制搜索结果数量
      });

      return files;
    } catch (error) {
      logger.error('搜索文件失败', { error, userId, query });
      throw new DatabaseError('搜索文件失败');
    }
  }

  /**
   * 获取文件统计信息
   */
  public async getFileStats(userId?: number): Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
    recentUploads: File[];
  }> {
    try {
      const where: any = { isDeleted: false };
      if (userId) {
        where.userId = userId;
      }

      const [totalFiles, filesWithSize] = await Promise.all([
        File.count({ where }),
        File.findAll({
          where,
          attributes: ['size', 'mimeType'],
        }),
      ]);

      // 计算总大小
      const totalSize = filesWithSize.reduce((sum, file) => sum + file.size, 0);

      // 统计文件类型
      const fileTypes: Record<string, number> = {};
      filesWithSize.forEach(file => {
        const type = file.mimeType.split('/')[0] || 'unknown';
        fileTypes[type] = (fileTypes[type] || 0) + 1;
      });

      // 获取最近上传的文件
      const recentUploads = await File.findAll({
        where,
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: 5,
      });

      return {
        totalFiles,
        totalSize,
        fileTypes,
        recentUploads,
      };
    } catch (error) {
      logger.error('获取文件统计失败', { error, userId });
      throw new DatabaseError('获取文件统计失败');
    }
  }

  /**
   * 生成唯一文件名
   */
  private generateUniqueFileName(originalName: string, extension: string): string {
    const name = path.basename(originalName, extension);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${name}_${timestamp}_${random}${extension}`;
  }
}

export default new FileService();