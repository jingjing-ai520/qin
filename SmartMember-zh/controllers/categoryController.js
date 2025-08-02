// 添加 db 模块导入
const db = require('../config/db');
const ApiError = require('../utils/response').ApiError;

/**
 * 查询指定商品分类的基础信息及该分类下商品的详细信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件函数
 */
exports.getCategoryWithProductSpecs = async (req, res, next) => {
  const { categoryId } = req.query;
  let connection = null;

  try {
    connection = await db.getConnection();

    // 1. 查询分类基本信息
    const categoryQuery = `
      SELECT id, name, des, datestart, dateend 
      FROM bosnds3.b_fair 
      WHERE id = :categoryId
    `;
    const categoryResult = await connection.execute(categoryQuery, { categoryId });

    if (categoryResult.rows.length === 0) {
      return next(new ApiError('分类不存在', 404));
    }

    // 处理分类信息
    const categoryInfo = {
      categoryId: categoryResult.rows[0][0],
      categoryName: categoryResult.rows[0][1],
      categoryDesc: categoryResult.rows[0][2],
      startDate: categoryResult.rows[0][3],
      endDate: categoryResult.rows[0][4]
    };

    // 2. 查询分类下的商品信息及关联数据
    const productQuery = `
      SELECT fi.m_product_id, fi.orderno, fi.isactive, 
             p.name as product_name,  -- 使用M_PRODUCT.NAME作为商品名称
             pr.ratio as product_spec, -- 使用比例作为规格
             pm.imgurl1 as product_img,
             bwp.m_attributeSetInstance_id as attribute_id
             -- 移除对av表的引用
      FROM bosnds3.b_fairitem fi
      LEFT JOIN bosnds3.m_product p ON fi.m_product_id = p.id
      LEFT JOIN bosnds3.b_fairpro_ratioset pr ON fi.m_product_id = pr.m_product_id
      LEFT JOIN bosnds3.b_pdt_media pm ON fi.m_product_id = pm.m_product_id
      LEFT JOIN bosnds3.b_bwpurinvoiceitem bwp ON fi.m_product_id = bwp.m_product_id
      -- 移除对m_attributevalue表的连接
      WHERE fi.b_fair_id = :categoryId
        AND fi.isactive = 'Y'
      ORDER BY fi.orderno ASC
    `;
    const productResult = await connection.execute(productQuery, { categoryId });

    // 处理商品列表 - 调整索引位置
    const productList = productResult.rows.map(row => ({
      productId: row[0],
      productName: row[3] || '无名称',
      productSpec: row[4] || '无规格',
      productColor: '无颜色',  // 移除对av.value的引用
      productImg: row[5] || '',
      productSort: row[1],
      isActive: row[2],
      attributeId: row[6]
    }));

    res.json({
      code: 200,
      message: '查询成功',
      data: {
        categoryInfo,
        productList
      }
    });
  } catch (error) {
    console.error('查询错误:', error);
    // 添加更详细的错误信息
    next(new ApiError(`查询失败: ${error.message}`, 500, { originalError: error.message, stack: error.stack }));
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};