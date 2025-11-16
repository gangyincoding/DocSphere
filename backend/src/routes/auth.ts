import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 登录成功
 */
router.post('/login', (req, res) => {
  res.json({ message: '登录接口，待实现' });
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: 用户注册
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: 注册成功
 */
router.post('/register', (req, res) => {
  res.json({ message: '注册接口，待实现' });
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: 用户登出
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: 登出成功
 */
router.post('/logout', (req, res) => {
  res.json({ message: '登出接口，待实现' });
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: 刷新令牌
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: 刷新成功
 */
router.post('/refresh', (req, res) => {
  res.json({ message: '刷新令牌接口，待实现' });
});

export default router;