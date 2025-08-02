// 基本的参数验证中间件
const validator = (schema) => {
  return (req, res, next) => {
    try {
      // 根据请求方法决定从哪里获取参数
      let data;
      if (req.method === 'GET') {
        data = req.query;
      } else {
        // 对于非GET请求，只使用body参数
        data = req.body;
      }
      const { error } = schema.validate(data, { abortEarly: false });
      if (error) {
        // 构建错误对象
        const errors = {};
        error.details.forEach(detail => {
          const field = detail.path[0];
          errors[field] = detail.message;
        });
        return res.status(400).json({
          code: 400,
          message: '参数错误',
          errors
        });
      }
      next();
    } catch (error) {
      res.status(400).json({
        code: 400,
        message: '参数验证失败',
        data: null
      });
    }
  };
};

module.exports = validator;