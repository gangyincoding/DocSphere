import { Router } from 'express';

const router = Router();

router.post('/grant', (req, res) => res.json({ message: '授予权限接口，待实现' }));
router.get('/resource/:type/:id', (req, res) => res.json({ message: '获取资源权限接口，待实现' }));
router.get('/user/:id', (req, res) => res.json({ message: '获取用户权限接口，待实现' }));
router.delete('/:id', (req, res) => res.json({ message: '撤销权限接口，待实现' }));

export default router;