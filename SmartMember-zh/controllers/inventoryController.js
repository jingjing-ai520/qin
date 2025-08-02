const { ApiError } = require('../utils/response');
const db = require('../config/db');

/**
 * 查询商品库存信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件函数
 */
exports.getInventoryInfo = async (req, res, next) => {
  const { productId, storeId } = req.query;
  console.log('查询参数:', { productId, storeId });
  let connection = null;

  try {
    connection = await db.getConnection();
    console.log('数据库连接成功');

    // 查询库存信息
    const inventoryQuery = `
      SELECT ID, AD_PI_ID, C_STORE_ID, QTY, 
             LAST_QTY, PRE_QTY 
      FROM BOSNDS3.ANALYSIS_STORE 
      WHERE AD_PI_ID = :productId AND C_STORE_ID = :storeId
    `;

    const result = await connection.execute(inventoryQuery, { productId, storeId });
    console.log('查询结果:', result.rows);

    if (result.rows.length === 0) {
      return next(new ApiError('库存记录不存在', 404));
    }

    // 处理库存预警状态（假设阈值为10，实际应从配置表读取）
    // Oracle返回的列名是大写的，使用正确的列名
    const inventoryData = result.rows.map(row => ({
      id: row[0], // ID
      productId: row[1], // AD_PI_ID
      storeId: row[2], // C_STORE_ID
      currentQty: row[3], // QTY
      lastQty: row[4], // LAST_QTY
      preQty: row[5], // PRE_QTY
      warningStatus: row[3] < 10 ? '低库存' : '正常'
    }))[0];

    console.log('处理后的库存数据:', inventoryData);

    res.json({
      code: 200,
      message: '查询成功',
      data: inventoryData
    });
  } catch (error) {
    console.error('查询错误:', error);
    next(new ApiError(`查询失败: ${error.message}`, 500));
  } finally {
    if (connection) {
      // 使用connection.close()释放连接
      await connection.close();
      console.log('数据库连接已释放');
    }
  }
};