import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => res.json({ message: '文件列表接口，待实现' }));
router.post('/upload', (req, res) => res.json({ message: '文件上传接口，待实现' }));
router.get('/:id', (req, res) => res.json({ message: '文件详情接口，待实现' }));
router.get('/:id/download', (req, res) => res.json({ message: '文件下载接口，待实现' }));
router.put('/:id', (req, res) => res.json({ message: '文件更新接口，待实现' }));
router.delete('/:id', (req, res) => res.json({ message: '文件删除接口，待实现' }));
router.post('/search', (req, res) => res.json({ message: '文件搜索接口，待实现' }));

export default router;