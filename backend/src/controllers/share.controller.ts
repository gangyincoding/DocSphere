import { Request, Response } from 'express'
import { ShareService } from '../services/share.service'
import { logger } from '../utils/logger'

export class ShareController {
  private shareService: ShareService

  constructor() {
    this.shareService = new ShareService()
  }

  /**
   * 创建文件分享
   */
  createShare = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id
      const {
        fileId,
        shareType,
        expiryDays,
        maxAccessCount,
        canDownload,
        canComment,
        canEdit,
        password,
        description
      } = req.body

      if (!fileId) {
        res.status(400).json({
          success: false,
          message: '文件ID不能为空'
        })
        return
      }

      const share = await this.shareService.createShare({
        fileId: Number(fileId),
        userId,
        shareType,
        expiryDays: expiryDays ? Number(expiryDays) : undefined,
        maxAccessCount: maxAccessCount ? Number(maxAccessCount) : undefined,
        canDownload,
        canComment,
        canEdit,
        password,
        description
      })

      res.status(201).json({
        success: true,
        message: '分享创建成功',
        data: share
      })
    } catch (error: any) {
      logger.error('创建分享失败:', error)
      res.status(error.message.includes('权限') ? 403 : 500).json({
        success: false,
        message: error.message || '创建分享失败'
      })
    }
  }

  /**
   * 通过分享码获取分享信息
   */
  getShareByCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.params
      const { password } = req.query

      const { share, file } = await this.shareService.getShareByCode(
        code,
        password as string | undefined
      )

      res.json({
        success: true,
        data: {
          share: share.toJSON(),
          file: {
            id: file.id,
            originalName: file.originalName,
            size: file.size,
            mimeType: file.mimeType,
            extension: file.extension
          }
        }
      })
    } catch (error: any) {
      logger.error('获取分享信息失败:', error)
      const statusCode = error.message.includes('不存在')
        ? 404
        : error.message.includes('失效')
        ? 410
        : error.message.includes('密码')
        ? 401
        : 500

      res.status(statusCode).json({
        success: false,
        message: error.message || '获取分享信息失败'
      })
    }
  }

  /**
   * 访问分享（用于下载等操作）
   */
  accessShare = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.params
      const { password } = req.body

      const { share, file } = await this.shareService.accessShare(code, password)

      res.json({
        success: true,
        message: '访问成功',
        data: {
          share: share.toJSON(),
          file: {
            id: file.id,
            originalName: file.originalName,
            size: file.size,
            mimeType: file.mimeType,
            path: file.path
          }
        }
      })
    } catch (error: any) {
      logger.error('访问分享失败:', error)
      const statusCode = error.message.includes('不存在')
        ? 404
        : error.message.includes('失效')
        ? 410
        : error.message.includes('密码')
        ? 401
        : 500

      res.status(statusCode).json({
        success: false,
        message: error.message || '访问分享失败'
      })
    }
  }

  /**
   * 获取用户的所有分享
   */
  getUserShares = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 20

      const { shares, total } = await this.shareService.getUserShares(userId, page, limit)

      res.json({
        success: true,
        data: {
          shares,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      })
    } catch (error: any) {
      logger.error('获取用户分享失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '获取用户分享失败'
      })
    }
  }

  /**
   * 获取文件的所有分享
   */
  getFileShares = async (req: Request, res: Response): Promise<void> => {
    try {
      const fileId = Number(req.params.fileId)
      const userId = (req as any).user.id

      const shares = await this.shareService.getFileShares(fileId, userId)

      res.json({
        success: true,
        data: shares
      })
    } catch (error: any) {
      logger.error('获取文件分享失败:', error)
      res.status(error.message.includes('不存在') ? 404 : 403).json({
        success: false,
        message: error.message || '获取文件分享失败'
      })
    }
  }

  /**
   * 更新分享信息
   */
  updateShare = async (req: Request, res: Response): Promise<void> => {
    try {
      const shareId = Number(req.params.id)
      const userId = (req as any).user.id
      const {
        expiryDays,
        maxAccessCount,
        canDownload,
        canComment,
        canEdit,
        password,
        description,
        isActive
      } = req.body

      const share = await this.shareService.updateShare(shareId, userId, {
        expiryDays: expiryDays !== undefined ? Number(expiryDays) : undefined,
        maxAccessCount: maxAccessCount !== undefined ? Number(maxAccessCount) : undefined,
        canDownload,
        canComment,
        canEdit,
        password,
        description,
        isActive
      })

      res.json({
        success: true,
        message: '分享更新成功',
        data: share
      })
    } catch (error: any) {
      logger.error('更新分享失败:', error)
      res.status(error.message.includes('不存在') ? 404 : 403).json({
        success: false,
        message: error.message || '更新分享失败'
      })
    }
  }

  /**
   * 撤销分享
   */
  revokeShare = async (req: Request, res: Response): Promise<void> => {
    try {
      const shareId = Number(req.params.id)
      const userId = (req as any).user.id

      await this.shareService.revokeShare(shareId, userId)

      res.json({
        success: true,
        message: '分享已撤销'
      })
    } catch (error: any) {
      logger.error('撤销分享失败:', error)
      res.status(error.message.includes('不存在') ? 404 : 403).json({
        success: false,
        message: error.message || '撤销分享失败'
      })
    }
  }

  /**
   * 删除分享
   */
  deleteShare = async (req: Request, res: Response): Promise<void> => {
    try {
      const shareId = Number(req.params.id)
      const userId = (req as any).user.id

      await this.shareService.deleteShare(shareId, userId)

      res.json({
        success: true,
        message: '分享已删除'
      })
    } catch (error: any) {
      logger.error('删除分享失败:', error)
      res.status(error.message.includes('不存在') ? 404 : 403).json({
        success: false,
        message: error.message || '删除分享失败'
      })
    }
  }

  /**
   * 获取分享统计信息
   */
  getShareStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id

      const stats = await this.shareService.getShareStats(userId)

      res.json({
        success: true,
        data: stats
      })
    } catch (error: any) {
      logger.error('获取分享统计失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '获取分享统计失败'
      })
    }
  }
}

// 导出单例
export const shareController = new ShareController()
