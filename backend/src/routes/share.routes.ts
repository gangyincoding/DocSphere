import { Router } from 'express'
import { shareController } from '../controllers/share.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

/**
 * 公开路由 - 无需认证
 */

// 通过分享码获取分享信息（无需登录）
router.get('/public/:code', shareController.getShareByCode)

// 访问分享（用于下载等，无需登录）
router.post('/public/:code/access', shareController.accessShare)

/**
 * 受保护路由 - 需要认证
 */

// 创建文件分享
router.post('/', authMiddleware, shareController.createShare)

// 获取用户的所有分享
router.get('/', authMiddleware, shareController.getUserShares)

// 获取分享统计信息
router.get('/stats', authMiddleware, shareController.getShareStats)

// 获取文件的所有分享
router.get('/file/:fileId', authMiddleware, shareController.getFileShares)

// 更新分享信息
router.put('/:id', authMiddleware, shareController.updateShare)

// 撤销分享
router.post('/:id/revoke', authMiddleware, shareController.revokeShare)

// 删除分享
router.delete('/:id', authMiddleware, shareController.deleteShare)

export default router
