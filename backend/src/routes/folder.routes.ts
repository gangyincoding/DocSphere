import { Router } from 'express'
import { folderController } from '../controllers/folder.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// 所有文件夹路由都需要认证
router.use(authMiddleware)

/**
 * @route   POST /api/v1/folders
 * @desc    创建文件夹
 * @access  Private
 */
router.post('/', folderController.createFolder)

/**
 * @route   GET /api/v1/folders
 * @desc    获取用户的根文件夹列表
 * @access  Private
 */
router.get('/', folderController.getUserFolders)

/**
 * @route   GET /api/v1/folders/tree
 * @desc    获取文件夹树
 * @access  Private
 */
router.get('/tree', folderController.getFolderTree)

/**
 * @route   GET /api/v1/folders/:id
 * @desc    获取文件夹信息
 * @access  Private
 */
router.get('/:id', folderController.getFolderById)

/**
 * @route   GET /api/v1/folders/:id/stats
 * @desc    获取文件夹统计信息
 * @access  Private
 */
router.get('/:id/stats', folderController.getFolderStats)

/**
 * @route   GET /api/v1/folders/:parentId/subfolders
 * @desc    获取子文件夹列表
 * @access  Private
 */
router.get('/:parentId/subfolders', folderController.getSubfolders)

/**
 * @route   PUT /api/v1/folders/:id
 * @desc    更新文件夹信息
 * @access  Private
 */
router.put('/:id', folderController.updateFolder)

/**
 * @route   PUT /api/v1/folders/:id/move
 * @desc    移动文件夹
 * @access  Private
 */
router.put('/:id/move', folderController.moveFolder)

/**
 * @route   DELETE /api/v1/folders/:id
 * @desc    删除文件夹
 * @access  Private
 */
router.delete('/:id', folderController.deleteFolder)

export default router
