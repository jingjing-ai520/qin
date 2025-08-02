// 添加jwt模块导入
const jwt = require('jsonwebtoken');

// 使用const声明auth函数
const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is missing');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new Error('Token is missing');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    let message = '身份验证失败';
    if (error.name === 'TokenExpiredError') {
      message = '身份验证失败: 登录已过期';
    } else if (error.name === 'JsonWebTokenError') {
      message = '身份验证失败: 无效的token';
    } else if (error.message === 'Authorization header is missing') {
      message = '身份验证失败: 缺少Authorization头';
    } else if (error.message === 'Token is missing') {
      message = '身份验证失败: 缺少token';
    }

    console.error('Authentication error:', error);
    res.status(401).json({
      code: 401,
      message: message,
      data: null
    });
  }
};

module.exports = auth;