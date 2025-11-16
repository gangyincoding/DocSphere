import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/authController';
import { authenticate, authRateLimit, generalRateLimit } from '../middleware/auth';

const router = Router();

// 输入验证规则
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/)
    .withMessage('密码必须包含字母和数字，且长度至少6位'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('姓名长度必须在1-100个字符之间'),
  body('phone')
    .optional()
    .matches(/^[+]?[\d\s-()]+$/)
    .withMessage('请输入有效的电话号码格式'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空'),
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('刷新令牌不能为空'),
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('姓名长度必须在1-100个字符之间'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('phone')
    .optional()
    .matches(/^[+]?[\d\s-()]+$/)
    .withMessage('请输入有效的电话号码格式'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('请输入有效的头像URL'),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('当前密码不能为空'),
  body('newPassword')
    .isLength({ min: 6 })
    .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/)
    .withMessage('新密码必须包含字母和数字，且长度至少6位'),
];

const verifyTokenValidation = [
  body('token')
    .notEmpty()
    .withMessage('令牌不能为空'),
];

// 公开路由（不需要认证）
router.post('/register', authRateLimit, registerValidation, authController.register);
router.post('/login', authRateLimit, loginValidation, authController.login);
router.post('/refresh-token', refreshTokenValidation, authController.refreshToken);
router.post('/verify-token', verifyTokenValidation, authController.verifyToken);

// 需要认证的路由
router.post('/logout', authenticate, generalRateLimit, authController.logout);
router.get('/me', authenticate, generalRateLimit, authController.getCurrentUser);
router.put('/profile', authenticate, generalRateLimit, updateProfileValidation, authController.updateProfile);
router.put('/change-password', authenticate, generalRateLimit, changePasswordValidation, authController.changePassword);

export default router;