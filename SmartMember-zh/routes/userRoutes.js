const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const validator = require('../middleware/validator');
const Joi = require('joi');

// 定义验证模式
const registerSchema = Joi.object({
  username: Joi.string().min(5).max(16).required(),
  password: Joi.string().min(5).max(16).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required() // 中国大陆手机号格式
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

// 定义修改密码验证模式
// 修改密码验证模式
const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(5).max(16).required()
}).unknown(false); // 不允许未知参数

// 更新修改密码路由 - 添加auth中间件
router.post('/changePassword', auth, validator(changePasswordSchema), userController.changePassword);

// 注册路由
router.post('/register', validator(registerSchema), userController.register);

// 登录路由
router.post('/login', validator(loginSchema), userController.login);

// 受保护的路由示例
router.get('/profile', auth, (req, res) => {
  res.json({
    code: 200,
    message: '访问成功',
    data: {
      user: req.user
    }
  });
});

// 添加权限管理路由
// 定义权限管理验证模式
const permissionSchema = Joi.object({
  userid: Joi.string().required(),
  role: Joi.string().valid('admin', 'sales', 'operator', 'external', 'employee').required()
});

// 修改权限管理路由，添加验证
router.post('/permission', validator(permissionSchema), userController.permission);

module.exports = router;