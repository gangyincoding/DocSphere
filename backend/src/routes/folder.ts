import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => res.json({ message: '文件夹列表接口，待实现' }));
router.post('/', (req, res) => res.json({ message: '创建文件夹接口，待实现' }));
router.get('/:id', (req, res) => res.json({ message: '文件夹详情接口，待实现' }));
router.put('/:id', (req, res) => res.json({ message: '文件夹更新接口，待实现' }));
router.delete('/:id', (req, res) => res.json({ message: '文件夹删除接口，待实现' }));
router.post('/:id/move', (req, res) => res.json({ message: '移动文件夹接口，待实现' }));

export default router;