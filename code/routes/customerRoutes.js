const express = require('express');
const router = express.Router();
const { addCustomer, queryCustomers, classifyCustomer, followupCustomer, getCustomerFollowups, getCustomerProfile } = require('../controllers/customerController');
const auth = require('../middleware/auth');
const validator = require('../middleware/validator');
const Joi = require('joi');

// 定义客户查询验证 schema
const queryCustomerSchema = Joi.object({
  pageNum: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  cardNo: Joi.string().allow('', null),
  vipName: Joi.string().allow('', null),
  idNo: Joi.string().allow('', null),
  c_vipType_Id: Joi.string().allow('', null),
  vipStatus: Joi.string().valid('0', '1').allow('', null),
  c_store_Id: Joi.string().allow('', null),
  creationDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$/).allow('', null)
});

// 定义验证模式
const addCustomerSchema = Joi.object({
  cardNo: Joi.string().allow('', null),
  c_vipType_Id: Joi.string().required().messages({ 'any.required': 'VIP类型ID是必填项' }),
  idNo: Joi.string().required().messages({ 'any.required': '证件号是必填项' }),
  vipName: Joi.string().min(2).max(20).required().messages({ 
    'any.required': '客户姓名是必填项',
    'string.min': '客户姓名至少2个字符',
    'string.max': '客户姓名最多20个字符'
  }),
  vipEname: Joi.string().allow('', null),
  sex: Joi.string().valid('W', 'M').allow('', null),
  birthday: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('', null).messages({
    'string.pattern.base': '生日格式不正确，应为yyyy-MM-dd'
  }),
  validDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('', null).messages({
    'string.pattern.base': '会员有效期格式不正确，应为yyyy-MM-dd'
  }),
  creditRemain: Joi.number().integer().min(0).default(0),
  integral: Joi.number().integer().min(0),
  integralUp: Joi.string().allow('', null),
  expireIntegral: Joi.number().integer().min(0).default(0),
  expireDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('', null).messages({
    'string.pattern.base': '积分过期日期格式不正确，应为yyyy-MM-dd'
  }),
  country: Joi.string().default('中国'),
  c_City_Id: Joi.string().allow('', null),
  address: Joi.string().max(100).allow('', null),
  post: Joi.string().pattern(/^\d{6}$/).allow('', null).messages({
    'string.pattern.base': '邮编格式不正确，应为6位数字'
  }),
  phone: Joi.string().pattern(/^\d{3,4}-\d{7,8}$/).allow('', null).messages({
    'string.pattern.base': '固定电话格式不正确，应为区号-号码'
  }),
  mobil: Joi.string().pattern(/^\d{11}$/).required().messages({
    'any.required': '手机号是必填项',
    'string.pattern.base': '手机号格式不正确，需11位数字'
  }),
  email: Joi.string().email().allow('', null).messages({
    'string.email': '邮箱格式不正确'
  }),
  c_Store_Id: Joi.string().allow('', null),
  c_CustomerUp_Id: Joi.string().allow('', null),
  c_OpenCardType_Id: Joi.string().default('TYPE_OFFLINE'),
  vipState: Joi.string().valid('N', 'F').default('N'), // 将 '正常', '冻结' 改为 'N', 'F'
  is_First_Inter: Joi.string().valid('Y', 'N').default('N')
});

// 定义客户分类验证 schema
const classifyCustomerSchema = Joi.object({
  ID: Joi.string().required().messages({ 'any.required': 'ID 是必填项' }),
  SCHEMA_ID_FK: Joi.string().required().messages({ 'any.required': 'SCHEMA_ID_FK 是必填项' }),
  GROUP_NAME: Joi.string().required().messages({ 'any.required': 'GROUP_NAME 是必填项' }),
  GROUP_FLAG: Joi.string().required().messages({ 'any.required': 'GROUP_FLAG 是必填项' }),
  COMMENTS: Joi.string().allow('', null),
  SECURITY_GROUP_ID: Joi.string().allow('', null),
  CREATED_BY: Joi.string().required().messages({ 'any.required': 'CREATED_BY 是必填项' })
});

// 添加客户路由
// 修改路由处理函数的引用方式
router.post('/add', auth, validator(addCustomerSchema), addCustomer);
router.get('/query', auth, validator(queryCustomerSchema), queryCustomers);

// 添加客户分类路由
router.post('/classify', auth, validator(classifyCustomerSchema), classifyCustomer);

// 添加客户跟进路由
router.post('/followup', auth, validator(Joi.object({
  customerId: Joi.string().required().messages({ 'any.required': '客户ID是必填项' }),
  followupContent: Joi.string().required().messages({ 'any.required': '跟进内容是必填项' })
})), followupCustomer);

// 查询客户跟进记录路由
router.get('/followups', auth, validator(Joi.object({
  customerId: Joi.string().required().messages({ 'any.required': '客户ID是必填项' })
})), getCustomerFollowups);

// 查询客户画像路由
router.get('/profile', auth, validator(Joi.object({
  customerId: Joi.string().required().messages({ 'any.required': '客户ID是必填项' })
})), getCustomerProfile);

module.exports = router;