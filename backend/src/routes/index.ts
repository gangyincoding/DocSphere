import { Router } from 'express'
import authRoutes from './auth.routes'
import fileRoutes from './file.routes'
import folderRoutes from './folder.routes'
import shareRoutes from './share.routes'

const router = Router()

// 认证路由
router.use('/auth', authRoutes)

// 文件路由
router.use('/files', fileRoutes)

// 文件夹路由
router.use('/folders', folderRoutes)

// 分享路由
router.use('/shares', shareRoutes)

export default router
