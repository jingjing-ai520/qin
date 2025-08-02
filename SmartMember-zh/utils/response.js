/**
 * 自定义 API 错误类
 */
class ApiError extends Error {
  /**
   * 创建 API 错误实例
   * @param {string} message - 错误消息
   * @param {number} statusCode - HTTP 状态码
   * @param {any} data - 额外数据
   */
  constructor(message, statusCode = 500, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 成功响应
 * @param {Object} res - 响应对象
 * @param {any} data - 返回数据
 * @param {string} message - 响应消息
 * @param {number} statusCode - HTTP 状态码
 */
const successResponse = (res, data = null, message = '操作成功', statusCode = 200) => {
  return res.status(statusCode).json({
    code: statusCode,
    message: message,
    data: data
  });
};

module.exports = {
  ApiError,
  successResponse
};