
const db = require('../config/db');
const ApiError = require('../utils/response').ApiError;

/**
 * 商品销售排名接口
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件函数
 */
exports.getProductSalesRank = async (req, res, next) => {
  const { timeType, startTime, endTime } = req.query;
  let connection = null;

  try {
    // 参数验证
    if (!timeType || !startTime || !endTime) {
      return next(new ApiError('时间类型、开始时间和结束时间为必填项', 400));
    }

    connection = await db.getConnection();

    // 查询商品销售排名数据
    const query = `
      SELECT 
        bfr.m_product_id as productId,
        p.name as productName,
        bfr.qty as salesQty,
        bfr.amt as salesAmt,
        bfr.qtyrank as rank,
        '未知' as trend  -- 趋势计算需上期数据，暂设为'未知'
      FROM bosnds3.b_fair_pdt_rank bfr
      LEFT JOIN bosnds3.m_product p ON bfr.m_product_id = p.id
      WHERE bfr.time_type = :timeType
        AND bfr.start_time = :startTime
        AND bfr.end_time = :endTime
        AND bfr.isactive = 'Y'
      ORDER BY bfr.qtyrank ASC
    `;

    const result = await connection.execute(query, {
      timeType,
      startTime: parseInt(startTime),
      endTime: parseInt(endTime)
    });

    // 处理查询结果
    const productSalesRank = result.rows.map(row => ({
      productId: row[0],
      productName: row[1] || '未知商品',
      salesQty: row[2] || 0,
      salesAmt: row[3] || 0,
      rank: row[4] || 0,
      trend: row[5]
    }));

    res.json({
      code: 200,
      message: '查询成功',
      data: productSalesRank
    });
  } catch (error) {
    console.error('商品销售排名查询错误:', error);
    next(new ApiError(`查询失败: ${error.message}`, 500));
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};