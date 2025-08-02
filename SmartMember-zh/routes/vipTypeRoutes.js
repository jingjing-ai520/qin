const express = require('express'); // 添加缺失的express模块引入
const router = express.Router();
const { createVipType, getVipTypeById, updateVipType, disableVipType } = require('../controllers/vipTypeController');
const auth = require('../middleware/auth');
const validator = require('../middleware/validator');
const Joi = require('joi');

// 定义VIP类型创建验证schema
const createVipTypeSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    'any.required': 'VIP类型名称是必填项',
    'string.min': 'VIP类型名称至少2个字符',
    'string.max': 'VIP类型名称最多255个字符'
  }),
  description: Joi.string().max(255).allow('', null),
  discount: Joi.number().precision(2).min(0).max(99999999.99).required().messages({
    'any.required': '基础折扣率是必填项',
    'number.min': '基础折扣率不能小于0',
    'number.max': '基础折扣率超出范围'
  }),
  integralRate: Joi.number().precision(4).min(0).required().messages({
    'any.required': '消费积分比例是必填项',
    'number.min': '消费积分比例不能小于0'
  }),
  canUpgrade: Joi.string().valid('Y', 'N').required().messages({
    'any.required': '是否可升级是必填项',
    'any.only': '是否可升级只能是Y或N'
  }),
  c_vipTypeUp_Id: Joi.number().integer().allow('', null),
  needIntg: Joi.number().integer().min(0).allow('', null),
  defaultValid: Joi.string().valid('Y', 'N').required().messages({
    'any.required': '是否默认有效是必填项',
    'any.only': '是否默认有效只能是Y或N'
  }),
  dbIntDay: Joi.string().max(10).allow('', null), // 修改为最大10个字符
  // 或者改为数字类型: dbIntDay: Joi.number().integer().min(0).allow('', null),
  integralValid: Joi.number().integer().min(0).max(999).allow('', null),
  isActive: Joi.string().valid('Y', 'N').required().messages({
    'any.required': '是否启用是必填项',
    'any.only': '是否启用只能是Y或N'
  })
});

// 添加VIP类型路由
router.post('/create', auth, validator(createVipTypeSchema), createVipType);

// 查询VIP类型路由
router.get('/:typeId', auth, getVipTypeById);

// 更新VIP类型路由
router.put('/:typeId', auth, validator(createVipTypeSchema), updateVipType);

// 禁用VIP类型路由
router.post('/:typeId/disable', auth, disableVipType);

module.exports = router;