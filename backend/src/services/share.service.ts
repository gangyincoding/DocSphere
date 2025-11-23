import { FileShare, FileShareCreationAttributes } from '../models/FileShare'
import { File } from '../models/File'
import { User } from '../models/User'
import { logger } from '../utils/logger'

export interface CreateShareData {
  fileId: number
  userId: number
  shareType?: 'link' | 'user' | 'public'
  expiryDays?: number
  maxAccessCount?: number
  canDownload?: boolean
  canComment?: boolean
  canEdit?: boolean
  password?: string
  description?: string
}

export interface UpdateShareData {
  expiryDays?: number
  maxAccessCount?: number
  canDownload?: boolean
  canComment?: boolean
  canEdit?: boolean
  password?: string
  description?: string
  isActive?: boolean
}

export class ShareService {
  /**
   * 创建文件分享
   */
  async createShare(data: CreateShareData): Promise<FileShare> {
    try {
      // 1. 验证文件是否存在
      const file = await File.findByPk(data.fileId)
      if (!file) {
        throw new Error('文件不存在')
      }

      // 2. 验证用户权限
      if (file.userId !== data.userId && !file.isPublic) {
        throw new Error('没有权限分享此文件')
      }

      // 3. 生成分享码
      const shareCode = FileShare.generateShareCode()

      // 4. 计算过期时间
      let expiresAt: Date | undefined
      if (data.expiryDays && data.expiryDays > 0) {
        expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + data.expiryDays)
      }

      // 5. 创建分享记录
      const shareData: FileShareCreationAttributes = {
        fileId: data.fileId,
        userId: data.userId,
        shareType: data.shareType || 'link',
        shareCode,
        expiresAt,
        maxAccessCount: data.maxAccessCount,
        canDownload: data.canDownload ?? true,
        canComment: data.canComment ?? false,
        canEdit: data.canEdit ?? false,
        password: data.password,
        description: data.description,
        createdBy: data.userId
      }

      const share = await FileShare.create(shareData)
      logger.info(`文件分享创建成功: ${share.id} - 文件: ${file.originalName}`)

      return share
    } catch (error) {
      logger.error('创建文件分享失败:', error)
      throw error
    }
  }

  /**
   * 通过分享码获取分享信息
   */
  async getShareByCode(
    shareCode: string,
    password?: string
  ): Promise<{ share: FileShare; file: File }> {
    try {
      const share = await FileShare.findOne({
        where: { shareCode },
        include: [
          {
            model: File,
            as: 'file'
          }
        ]
      })

      if (!share) {
        throw new Error('分享不存在')
      }

      if (!share.isValid()) {
        throw new Error('分享已失效')
      }

      // 验证密码
      if (share.password && share.password !== password) {
        throw new Error('分享密码错误')
      }

      const file = (share as any).file as File

      if (!file) {
        throw new Error('文件不存在')
      }

      return { share, file }
    } catch (error) {
      logger.error('获取分享信息失败:', error)
      throw error
    }
  }

  /**
   * 访问分享（增加访问计数）
   */
  async accessShare(shareCode: string, password?: string): Promise<{ share: FileShare; file: File }> {
    try {
      const { share, file } = await this.getShareByCode(shareCode, password)

      // 增加访问计数
      await share.incrementAccess()

      logger.info(`分享被访问: ${share.id} - 访问次数: ${share.accessCount}`)

      return { share, file }
    } catch (error) {
      logger.error('访问分享失败:', error)
      throw error
    }
  }

  /**
   * 获取用户创建的所有分享
   */
  async getUserShares(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ shares: FileShare[]; total: number }> {
    try {
      const offset = (page - 1) * limit

      const { rows: shares, count: total } = await FileShare.findAndCountAll({
        where: { createdBy: userId },
        include: [
          {
            model: File,
            as: 'file',
            attributes: ['id', 'originalName', 'size', 'mimeType']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      })

      return { shares, total }
    } catch (error) {
      logger.error('获取用户分享列表失败:', error)
      throw new Error('获取用户分享列表失败')
    }
  }

  /**
   * 获取文件的所有分享
   */
  async getFileShares(fileId: number, userId: number): Promise<FileShare[]> {
    try {
      // 验证文件权限
      const file = await File.findByPk(fileId)
      if (!file) {
        throw new Error('文件不存在')
      }

      if (file.userId !== userId && !file.isPublic) {
        throw new Error('没有权限查看此文件的分享')
      }

      const shares = await FileShare.findAll({
        where: { fileId },
        order: [['createdAt', 'DESC']]
      })

      return shares
    } catch (error) {
      logger.error('获取文件分享列表失败:', error)
      throw error
    }
  }

  /**
   * 更新分享信息
   */
  async updateShare(
    shareId: number,
    userId: number,
    data: UpdateShareData
  ): Promise<FileShare> {
    try {
      const share = await FileShare.findByPk(shareId)

      if (!share) {
        throw new Error('分享不存在')
      }

      if (share.createdBy !== userId) {
        throw new Error('没有权限修改此分享')
      }

      // 更新过期时间
      if (data.expiryDays !== undefined) {
        if (data.expiryDays > 0) {
          await share.extendExpiry(data.expiryDays)
        } else {
          share.expiresAt = undefined
        }
      }

      // 更新其他字段
      if (data.maxAccessCount !== undefined) {
        share.maxAccessCount = data.maxAccessCount
      }
      if (data.password !== undefined) {
        share.password = data.password
      }
      if (data.description !== undefined) {
        share.description = data.description
      }
      if (data.isActive !== undefined) {
        share.isActive = data.isActive
      }

      // 更新权限
      if (
        data.canDownload !== undefined ||
        data.canComment !== undefined ||
        data.canEdit !== undefined
      ) {
        await share.updatePermissions({
          canDownload: data.canDownload,
          canComment: data.canComment,
          canEdit: data.canEdit
        })
      }

      await share.save()

      logger.info(`分享更新成功: ${share.id}`)

      return share
    } catch (error) {
      logger.error('更新分享失败:', error)
      throw error
    }
  }

  /**
   * 撤销分享
   */
  async revokeShare(shareId: number, userId: number): Promise<void> {
    try {
      const share = await FileShare.findByPk(shareId)

      if (!share) {
        throw new Error('分享不存在')
      }

      if (share.createdBy !== userId) {
        throw new Error('没有权限撤销此分享')
      }

      await share.deactivate()

      logger.info(`分享已撤销: ${share.id}`)
    } catch (error) {
      logger.error('撤销分享失败:', error)
      throw error
    }
  }

  /**
   * 删除分享
   */
  async deleteShare(shareId: number, userId: number): Promise<void> {
    try {
      const share = await FileShare.findByPk(shareId)

      if (!share) {
        throw new Error('分享不存在')
      }

      if (share.createdBy !== userId) {
        throw new Error('没有权限删除此分享')
      }

      await share.destroy()

      logger.info(`分享已删除: ${share.id}`)
    } catch (error) {
      logger.error('删除分享失败:', error)
      throw error
    }
  }

  /**
   * 获取分享统计信息
   */
  async getShareStats(userId: number): Promise<{
    totalShares: number
    activeShares: number
    totalAccess: number
    expiredShares: number
  }> {
    try {
      const allShares = await FileShare.findAll({
        where: { createdBy: userId }
      })

      const totalShares = allShares.length
      const activeShares = allShares.filter((s) => s.isValid()).length
      const expiredShares = allShares.filter((s) => s.isExpired()).length
      const totalAccess = allShares.reduce((sum, s) => sum + s.accessCount, 0)

      return {
        totalShares,
        activeShares,
        totalAccess,
        expiredShares
      }
    } catch (error) {
      logger.error('获取分享统计失败:', error)
      throw new Error('获取分享统计失败')
    }
  }
}
