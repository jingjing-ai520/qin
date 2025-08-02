const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const auth = require('../middleware/auth');  // 修改导入方式
const validator = require('../middleware/validator');  // 修改导入方式
const Joi = require('joi');

// 库存查询参数验证
const inventoryQuerySchema = Joi.object({
  productId: Joi.number().integer().required().description('商品ID'),
  storeId: Joi.number().integer().required().description('门店ID')
});

// 库存查询接口 - 移除第二个参数
router.get('/info', auth, validator(inventoryQuerySchema), inventoryController.getInventoryInfo);

module.exports = router;