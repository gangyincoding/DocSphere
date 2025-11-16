import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => res.json({ message: '用户列表接口，待实现' }));
router.get('/:id', (req, res) => res.json({ message: '用户详情接口，待实现' }));
router.put('/:id', (req, res) => res.json({ message: '用户更新接口，待实现' }));
router.delete('/:id', (req, res) => res.json({ message: '用户删除接口，待实现' }));

export default router;