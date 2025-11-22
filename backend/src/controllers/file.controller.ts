import { Request, Response } from 'express'
import multer from 'multer'
import { FileService } from '../services/file.service'
import { logger } from '../utils/logger'

// 配置 multer 用于内存存储
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
})

export class FileController {
  private fileService: FileService

  constructor() {
    this.fileService = new FileService()
  }

  /**
   * 获取 multer 中间件
   */
  getUploadMiddleware() {
    return upload.single('file')
  }

  /**
   * 上传文件
   */
  uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file
      const userId = (req as any).user.id
      const { folderId, isPublic, description, tags } = req.body

      if (!file) {
        res.status(400).json({
          success: false,
          message: '未提供文件'
        })
        return
      }

      const uploadedFile = await this.fileService.uploadFile({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        userId,
        folderId: folderId ? Number(folderId) : undefined,
        isPublic: isPublic === 'true',
        description,
        tags
      })

      res.status(201).json({
        success: true,
        message: '文件上传成功',
        data: uploadedFile
      })
    } catch (error: any) {
      logger.error('文件上传失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '文件上传失败'
      })
    }
  }

  /**
   * 下载文件
   */
  downloadFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const fileId = Number(req.params.id)
      const userId = (req as any).user.id

      const { buffer, file } = await this.fileService.downloadFile(fileId, userId)

      res.setHeader('Content-Type', file.mimeType)
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`)
      res.setHeader('Content-Length', buffer.length)

      res.send(buffer)
    } catch (error: any) {
      logger.error('文件下载失败:', error)
      res.status(error.message.includes('不存在') ? 404 : 403).json({
        success: false,
        message: error.message || '文件下载失败'
      })
    }
  }

  /**
   * 获取文件信息
   */
  getFileById = async (req: Request, res: Response): Promise<void> => {
    try {
      const fileId = Number(req.params.id)
      const userId = (req as any).user.id

      const file = await this.fileService.getFileById(fileId, userId)

      res.json({
        success: true,
        data: file
      })
    } catch (error: any) {
      logger.error('获取文件信息失败:', error)
      res.status(error.message.includes('不存在') ? 404 : 403).json({
        success: false,
        message: error.message || '获取文件信息失败'
      })
    }
  }

  /**
   * 获取用户的文件列表
   */
  getUserFiles = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 20

      const { files, total } = await this.fileService.getUserFiles(userId, page, limit)

      res.json({
        success: true,
        data: {
          files,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      })
    } catch (error: any) {
      logger.error('获取文件列表失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '获取文件列表失败'
      })
    }
  }

  /**
   * 获取文件夹内的文件
   */
  getFolderFiles = async (req: Request, res: Response): Promise<void> => {
    try {
      const folderId = Number(req.params.folderId)
      const userId = (req as any).user.id
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 20

      const { files, total } = await this.fileService.getFolderFiles(folderId, userId, page, limit)

      res.json({
        success: true,
        data: {
          files,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      })
    } catch (error: any) {
      logger.error('获取文件夹文件失败:', error)
      res.status(error.message.includes('不存在') ? 404 : 403).json({
        success: false,
        message: error.message || '获取文件夹文件失败'
      })
    }
  }

  /**
   * 删除文件
   */
  deleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const fileId = Number(req.params.id)
      const userId = (req as any).user.id

      await this.fileService.deleteFile(fileId, userId)

      res.json({
        success: true,
        message: '文件删除成功'
      })
    } catch (error: any) {
      logger.error('文件删除失败:', error)
      res.status(error.message.includes('不存在') ? 404 : 403).json({
        success: false,
        message: error.message || '文件删除失败'
      })
    }
  }

  /**
   * 更新文件信息
   */
  updateFileInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const fileId = Number(req.params.id)
      const userId = (req as any).user.id
      const { name, description, tags, isPublic } = req.body

      const file = await this.fileService.updateFileInfo(fileId, userId, {
        name,
        description,
        tags,
        isPublic
      })

      res.json({
        success: true,
        message: '文件信息更新成功',
        data: file
      })
    } catch (error: any) {
      logger.error('更新文件信息失败:', error)
      res.status(error.message.includes('不存在') ? 404 : 403).json({
        success: false,
        message: error.message || '更新文件信息失败'
      })
    }
  }

  /**
   * 获取文件统计信息
   */
  getFileStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id

      const stats = await this.fileService.getFileStats(userId)

      res.json({
        success: true,
        data: stats
      })
    } catch (error: any) {
      logger.error('获取文件统计失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '获取文件统计失败'
      })
    }
  }
}

// 导出单例
export const fileController = new FileController()
