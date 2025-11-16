import { Router } from 'express';

// 导入各模块路由
import authRoutes from './auth';
import userRoutes from './user';
import fileRoutes from './file';
import folderRoutes from './folder';
import permissionRoutes from './permission';
import shareRoutes from './share';

const router = Router();

// API 路由前缀示例
// GET /api/v1/auth/login
// POST /api/v1/files/upload

// 注册各模块路由
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/files', fileRoutes);
router.use('/folders', folderRoutes);
router.use('/permissions', permissionRoutes);
router.use('/shares', shareRoutes);

export default router;