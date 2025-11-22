import { Request, Response } from 'express'
import { FolderService } from '../services/folder.service'
import { logger } from '../utils/logger'

export class FolderController {
  private folderService: FolderService

  constructor() {
    this.folderService = new FolderService()
  }

  /**
   * 创建文件夹
   */
  createFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id
      const { name, parentId, isPublic, description } = req.body

      if (!name || !name.trim()) {
        res.status(400).json({
          success: false,
          message: '文件夹名称不能为空'
        })
        return
      }

      const folder = await this.folderService.createFolder({
        name: name.trim(),
        userId,
        parentId: parentId ? Number(parentId) : undefined,
        isPublic: isPublic === true || isPublic === 'true',
        description
      })

      res.status(201).json({
        success: true,
        message: '文件夹创建成功',
        data: folder
      })
    } catch (error: any) {
      logger.error('创建文件夹失败:', error)

      if (error.message.includes('不存在')) {
        res.status(404).json({
          success: false,
          message: error.message
        })
      } else if (error.message.includes('权限') || error.message.includes('同名')) {
        res.status(400).json({
          success: false,
          message: error.message
        })
      } else {
        res.status(500).json({
          success: false,
          message: error.message || '创建文件夹失败'
        })
      }
    }
  }

  /**
   * 获取文件夹信息
   */
  getFolderById = async (req: Request, res: Response): Promise<void> => {
    try {
      const folderId = Number(req.params.id)
      const userId = (req as any).user.id

      const folder = await this.folderService.getFolderById(folderId, userId)

      res.json({
        success: true,
        data: folder
      })
    } catch (error: any) {
      logger.error('获取文件夹信息失败:', error)
      res.status(error.message.includes('不存在') ? 404 : 403).json({
        success: false,
        message: error.message || '获取文件夹信息失败'
      })
    }
  }

  /**
   * 获取用户的根文件夹列表
   */
  getUserFolders = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 20

      const { folders, total } = await this.folderService.getUserFolders(userId, page, limit)

      res.json({
        success: true,
        data: {
          folders,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      })
    } catch (error: any) {
      logger.error('获取文件夹列表失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '获取文件夹列表失败'
      })
    }
  }

  /**
   * 获取子文件夹列表
   */
  getSubfolders = async (req: Request, res: Response): Promise<void> => {
    try {
      const parentId = Number(req.params.parentId)
      const userId = (req as any).user.id
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 20

      const { folders, total } = await this.folderService.getSubfolders(parentId, userId, page, limit)

      res.json({
        success: true,
        data: {
          folders,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      })
    } catch (error: any) {
      logger.error('获取子文件夹失败:', error)
      res.status(error.message.includes('不存在') ? 404 : 403).json({
        success: false,
        message: error.message || '获取子文件夹失败'
      })
    }
  }

  /**
   * 更新文件夹信息
   */
  updateFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const folderId = Number(req.params.id)
      const userId = (req as any).user.id
      const { name, description, isPublic } = req.body

      const folder = await this.folderService.updateFolder(folderId, userId, {
        name,
        description,
        isPublic
      })

      res.json({
        success: true,
        message: '文件夹信息更新成功',
        data: folder
      })
    } catch (error: any) {
      logger.error('更新文件夹信息失败:', error)

      if (error.message.includes('不存在')) {
        res.status(404).json({
          success: false,
          message: error.message
        })
      } else if (error.message.includes('只能') || error.message.includes('同名')) {
        res.status(403).json({
          success: false,
          message: error.message
        })
      } else {
        res.status(500).json({
          success: false,
          message: error.message || '更新文件夹信息失败'
        })
      }
    }
  }

  /**
   * 删除文件夹
   */
  deleteFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const folderId = Number(req.params.id)
      const userId = (req as any).user.id

      await this.folderService.deleteFolder(folderId, userId)

      res.json({
        success: true,
        message: '文件夹删除成功'
      })
    } catch (error: any) {
      logger.error('删除文件夹失败:', error)

      if (error.message.includes('不存在')) {
        res.status(404).json({
          success: false,
          message: error.message
        })
      } else if (error.message.includes('只能') || error.message.includes('请先删除')) {
        res.status(400).json({
          success: false,
          message: error.message
        })
      } else {
        res.status(500).json({
          success: false,
          message: error.message || '删除文件夹失败'
        })
      }
    }
  }

  /**
   * 移动文件夹
   */
  moveFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const folderId = Number(req.params.id)
      const userId = (req as any).user.id
      const { targetFolderId } = req.body

      const folder = await this.folderService.moveFolder(
        folderId,
        userId,
        targetFolderId === null || targetFolderId === undefined ? null : Number(targetFolderId)
      )

      res.json({
        success: true,
        message: '文件夹移动成功',
        data: folder
      })
    } catch (error: any) {
      logger.error('移动文件夹失败:', error)

      if (error.message.includes('不存在')) {
        res.status(404).json({
          success: false,
          message: error.message
        })
      } else if (error.message.includes('不能') || error.message.includes('权限') || error.message.includes('同名')) {
        res.status(400).json({
          success: false,
          message: error.message
        })
      } else {
        res.status(500).json({
          success: false,
          message: error.message || '移动文件夹失败'
        })
      }
    }
  }

  /**
   * 获取文件夹树
   */
  getFolderTree = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id

      const tree = await this.folderService.getFolderTree(userId)

      res.json({
        success: true,
        data: tree
      })
    } catch (error: any) {
      logger.error('获取文件夹树失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '获取文件夹树失败'
      })
    }
  }

  /**
   * 获取文件夹统计信息
   */
  getFolderStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const folderId = Number(req.params.id)
      const userId = (req as any).user.id

      const stats = await this.folderService.getFolderStats(folderId, userId)

      res.json({
        success: true,
        data: stats
      })
    } catch (error: any) {
      logger.error('获取文件夹统计失败:', error)
      res.status(error.message.includes('不存在') ? 404 : 403).json({
        success: false,
        message: error.message || '获取文件夹统计失败'
      })
    }
  }
}

// 导出单例
export const folderController = new FolderController()
