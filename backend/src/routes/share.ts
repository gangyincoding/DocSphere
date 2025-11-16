import { Router } from 'express';

const router = Router();

router.post('/', (req, res) => res.json({ message: '创建分享接口，待实现' }));
router.get('/:token', (req, res) => res.json({ message: '访问分享接口，待实现' }));
router.get('/:token/download', (req, res) => res.json({ message: '下载分享文件接口，待实现' }));
router.get('/user/:id', (req, res) => res.json({ message: '获取用户分享列表接口，待实现' }));
router.delete('/:id', (req, res) => res.json({ message: '取消分享接口，待实现' }));

export default router;