const express = require('express');
const router = express.Router();
// 使用解构赋值导入控制器函数
const { getCategoryWithProductSpecs } = require('../controllers/categoryController');
// 修改auth中间件的导入方式 - 从解构赋值改为直接导入
const auth = require('../middleware/auth');
const validator = require('../middleware/validator');
const Joi = require('joi');

// 定义参数验证 schema
const categorySchema = Joi.object({
  categoryId: Joi.number().integer().required().description('商品分类ID')
});

// 在路由定义前添加日志
console.log('控制器函数:', getCategoryWithProductSpecs);
console.log('auth中间件:', auth);
console.log('validator中间件:', validator);

// 配置路由 - 直接使用解构后的函数名
router.get('/category/product-specs', auth, validator(categorySchema), getCategoryWithProductSpecs);

module.exports = router;