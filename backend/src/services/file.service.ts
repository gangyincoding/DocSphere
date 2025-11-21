import crypto from 'crypto'
import path from 'path'
import { File, FileCreationAttributes } from '../models/File'
import { Folder } from '../models/Folder'
import { MinioStorage } from '../utils/minioClient'
import { logger } from '../utils/logger'

export interface UploadFileData {
  buffer: Buffer
  originalName: string
  mimeType: string
  size: number
  userId: number
  folderId?: number
  isPublic?: boolean
  description?: string
  tags?: string
}

export interface FileStats {
  totalFiles: number
  totalSize: number
  recentUploads: File[]
}

export class FileService {
  private minioStorage: MinioStorage

  constructor() {
    this.minioStorage = new MinioStorage()
  }

  /**
   * 上传文件
   */
  async uploadFile(data: UploadFileData): Promise<File> {
    try {
      // 1. 生成文件信息
      const extension = path.extname(data.originalName).substring(1) || 'bin'
      const checksum = this.calculateChecksum(data.buffer)
      const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`
      const filePath = data.folderId
        ? `folder-${data.folderId}/${uniqueName}`
        : `root/${uniqueName}`

      // 2. 上传到 MinIO
      await this.minioStorage.uploadFile(filePath, data.buffer, {
        'Content-Type': data.mimeType,
        'Original-Name': data.originalName,
        'User-Id': String(data.userId)
      })

      // 3. 创建数据库记录
      const fileData: FileCreationAttributes = {
        name: uniqueName,
        originalName: data.originalName,
        path: filePath,
        size: data.size,
        mimeType: data.mimeType,
        extension,
        checksum,
        userId: data.userId,
        folderId: data.folderId,
        isPublic: data.isPublic ?? false,
        description: data.description,
        tags: data.tags
      }

      const file = await File.create(fileData)
      logger.info(`文件上传成功: ${file.id} - ${data.originalName}`)

      return file
    } catch (error) {
      logger.error('文件上传失败:', error)
      throw new Error('文件上传失败')
    }
  }

  /**
   * 下载文件
   */
  async downloadFile(fileId: number, userId: number): Promise<{ buffer: Buffer; file: File }> {
    try {
      const file = await File.findByPk(fileId)

      if (!file) {
        throw new Error('文件不存在')
      }

      if (file.isDeleted) {
        throw new Error('文件已被删除')
      }

      if (file.isExpired()) {
        throw new Error('文件已过期')
      }

      // 检查权限
      if (!file.canAccess(userId)) {
        throw new Error('没有权限访问此文件')
      }

      // 从 MinIO 下载
      const buffer = await this.minioStorage.downloadFile(file.path)

      // 记录下载
      await file.recordDownload()

      logger.info(`文件下载成功: ${fileId} by user ${userId}`)

      return { buffer, file }
    } catch (error) {
      logger.error(`文件下载失败: ${fileId}`, error)
      throw error
    }
  }

  /**
   * 获取文件信息
   */
  async getFileById(fileId: number, userId: number): Promise<File> {
    const file = await File.findByPk(fileId)

    if (!file) {
      throw new Error('文件不存在')
    }

    if (file.isDeleted) {
      throw new Error('文件已被删除')
    }

    if (!file.canAccess(userId)) {
      throw new Error('没有权限访问此文件')
    }

    return file
  }

  /**
   * 获取用户的所有文件
   */
  async getUserFiles(userId: number, page: number = 1, limit: number = 20): Promise<{ files: File[]; total: number }> {
    const offset = (page - 1) * limit

    const { rows: files, count: total } = await File.findAndCountAll({
      where: {
        userId,
        isDeleted: false
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    return { files, total }
  }

  /**
   * 获取文件夹内的文件
   */
  async getFolderFiles(folderId: number, userId: number, page: number = 1, limit: number = 20): Promise<{ files: File[]; total: number }> {
    // 验证文件夹权限
    const folder = await Folder.findByPk(folderId)

    if (!folder) {
      throw new Error('文件夹不存在')
    }

    if (!folder.canAccess(userId)) {
      throw new Error('没有权限访问此文件夹')
    }

    const offset = (page - 1) * limit

    const { rows: files, count: total } = await File.findAndCountAll({
      where: {
        folderId,
        isDeleted: false
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    return { files, total }
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: number, userId: number): Promise<void> {
    const file = await File.findByPk(fileId)

    if (!file) {
      throw new Error('文件不存在')
    }

    if (file.userId !== userId) {
      throw new Error('只能删除自己的文件')
    }

    if (file.isDeleted) {
      throw new Error('文件已被删除')
    }

    // 软删除
    await file.softDelete(userId)

    // TODO: 可选择是否从 MinIO 删除物理文件
    // await this.minioStorage.deleteFile(file.path)

    logger.info(`文件删除成功: ${fileId} by user ${userId}`)
  }

  /**
   * 更新文件信息
   */
  async updateFileInfo(
    fileId: number,
    userId: number,
    updateData: {
      name?: string
      description?: string
      tags?: string
      isPublic?: boolean
    }
  ): Promise<File> {
    const file = await File.findByPk(fileId)

    if (!file) {
      throw new Error('文件不存在')
    }

    if (file.userId !== userId) {
      throw new Error('只能修改自己的文件')
    }

    if (file.isDeleted) {
      throw new Error('文件已被删除')
    }

    await file.updateInfo(updateData)

    logger.info(`文件信息更新成功: ${fileId}`)

    return file
  }

  /**
   * 获取文件统计信息
   */
  async getFileStats(userId: number): Promise<FileStats> {
    const totalFiles = await File.count({
      where: {
        userId,
        isDeleted: false
      }
    })

    const files = await File.findAll({
      where: {
        userId,
        isDeleted: false
      }
    })

    const totalSize = files.reduce((sum, file) => sum + file.size, 0)

    const recentUploads = await File.findAll({
      where: {
        userId,
        isDeleted: false
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    })

    return {
      totalFiles,
      totalSize,
      recentUploads
    }
  }

  /**
   * 计算文件校验和 (MD5)
   */
  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex')
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  }
}
