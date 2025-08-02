
const express = require('express');
const router = express.Router();
const productStatController = require('../controllers/productStatController');
const auth = require('../middleware/auth');
const validator = require('../middleware/validator');
const Joi = require('joi');

// 定义查询参数验证规则
const productSalesRankSchema = Joi.object({
  timeType: Joi.string().valid('MONTH', 'QUARTER').required().messages({
    'any.only': '时间类型必须为MONTH或QUARTER',
    'string.empty': '时间类型不能为空'
  }),
  startTime: Joi.number().integer().min(20200101).max(21001231).required().messages({
    'number.base': '开始时间必须为数字',
    'number.integer': '开始时间必须为整数',
    'number.min': '开始时间格式不正确(YYYYMMDD)',
    'number.max': '开始时间格式不正确(YYYYMMDD)',
    'any.required': '开始时间不能为空'
  }),
  endTime: Joi.number().integer().min(Joi.ref('startTime')).max(21001231).required().messages({
    'number.base': '结束时间必须为数字',
    'number.integer': '结束时间必须为整数',
    'number.min': '结束时间必须大于等于开始时间',
    'number.max': '结束时间格式不正确(YYYYMMDD)',
    'any.required': '结束时间不能为空'
  })
});

// 商品销售排名接口
router.get('/sales-rank',
  auth,
  validator(productSalesRankSchema),
  productStatController.getProductSalesRank
);

module.exports = router;