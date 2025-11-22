import { Router } from 'express'
import { fileController } from '../controllers/file.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// 所有文件路由都需要认证
router.use(authMiddleware)

/**
 * @route   POST /api/v1/files/upload
 * @desc    上传文件
 * @access  Private
 */
router.post('/upload', fileController.getUploadMiddleware(), fileController.uploadFile)

/**
 * @route   GET /api/v1/files
 * @desc    获取用户的文件列表
 * @access  Private
 */
router.get('/', fileController.getUserFiles)

/**
 * @route   GET /api/v1/files/stats
 * @desc    获取文件统计信息
 * @access  Private
 */
router.get('/stats', fileController.getFileStats)

/**
 * @route   GET /api/v1/files/:id
 * @desc    获取文件信息
 * @access  Private
 */
router.get('/:id', fileController.getFileById)

/**
 * @route   GET /api/v1/files/:id/download
 * @desc    下载文件
 * @access  Private
 */
router.get('/:id/download', fileController.downloadFile)

/**
 * @route   GET /api/v1/files/folder/:folderId
 * @desc    获取文件夹内的文件
 * @access  Private
 */
router.get('/folder/:folderId', fileController.getFolderFiles)

/**
 * @route   PUT /api/v1/files/:id
 * @desc    更新文件信息
 * @access  Private
 */
router.put('/:id', fileController.updateFileInfo)

/**
 * @route   DELETE /api/v1/files/:id
 * @desc    删除文件
 * @access  Private
 */
router.delete('/:id', fileController.deleteFile)

export default router
