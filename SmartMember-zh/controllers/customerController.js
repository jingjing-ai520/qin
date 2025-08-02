const oracledb = require('oracledb');
const db = require('../config/db');

// 添加客户
exports.addCustomer = async (req, res) => {
  try {
    let {
      cardNo, c_vipType_Id, idNo, vipName, vipEname, sex = 'U', birthday, validDate,
      creditRemain = 0, integral, integralUp, expireIntegral = 0, expireDate,
      country = '中国', c_City_Id, address, post, phone, mobil,
      email, c_Store_Id, c_CustomerUp_Id, c_OpenCardType_Id = 'TYPE_OFFLINE',
      vipState = 'N', is_First_Inter = 'N'
    } = req.body;

    // 从身份证号提取生日
    if (idNo && !birthday) {
      if (idNo.length === 18) {
        // 18位身份证: 第7-14位是生日 YYYYMMDD
        const birthStr = idNo.substring(6, 14);
        birthday = `${birthStr.substring(0, 4)}-${birthStr.substring(4, 6)}-${birthStr.substring(6, 8)}`;
      } else if (idNo.length === 15) {
        // 15位身份证: 第7-12位是生日 YYMMDD
        const birthStr = idNo.substring(6, 12);
        // 更准确的年份转换逻辑: 小于23则为2000年后，否则为1900年后（假设当前年份为2023）
        const currentYear = new Date().getFullYear();
        const year = parseInt(birthStr.substring(0, 2));
        const fullYear = year <= currentYear % 100 ? `20${birthStr.substring(0, 2)}` : `19${birthStr.substring(0, 2)}`;
        birthday = `${fullYear}-${birthStr.substring(2, 4)}-${birthStr.substring(4, 6)}`;
      }
    }

    // 确保birthday有值，避免null
    if (!birthday) {
      return res.status(400).json({
        code: 400,
        message: '参数错误',
        errors: {
          birthday: '生日不能为空，请提供生日或有效的身份证号'
        }
      });
    }

    // 验证sex字段只能是'W'或'M'
    if (!sex || (sex !== 'W' && sex !== 'M')) {
      return res.status(400).json({
        code: 400,
        message: '参数错误',
        errors: {
          sex: '性别必须是W(女性)或M(男性)'
        }
      });
    }

    // 如果积分未提供，默认与剩余积分一致
    if (integral === undefined) {
      integral = creditRemain;
    }

    // 如果会员有效期未提供，默认当前日期+1年
    if (!validDate) {
      const now = new Date();
      now.setFullYear(now.getFullYear() + 1);
      validDate = now.toISOString().split('T')[0];
    }

    // 如果卡号未提供，自动生成: VIP + 日期 + 序号
    if (!cardNo) {
      const connection = await db.getConnection();
      try {
        // 获取当前日期
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');

        // 查询当天最大序号
        const seqResult = await connection.execute(
          `SELECT NVL(MAX(TO_NUMBER(SUBSTR(CARDNO, 11))), 0) + 1 AS SEQ
           FROM BOSNDS3.C_CLIENT_VIP
           WHERE CARDNO LIKE :prefix`,
          [`VIP${dateStr}%`]
        );
        const seq = seqResult.rows[0][0].toString().padStart(3, '0');
        cardNo = `VIP${dateStr}${seq}`;
      } finally {
        connection.release();
      }
    }

    // 唯一性校验: 证件号
    const idNoConnection = await db.getConnection();
    try {
      const idNoResult = await idNoConnection.execute(
        `SELECT COUNT(*) FROM BOSNDS3.C_CLIENT_VIP WHERE IDNO = :idNo`,
        [idNo]
      );
      if (idNoResult.rows[0][0] > 0) {
        return res.status(400).json({
          code: 400,
          message: '参数错误',
          errors: {
            idNo: '证件号已被使用'
          }
        });
      }
    } finally {
      idNoConnection.release();
    }

    // 唯一性校验: 手机号
    const mobilConnection = await db.getConnection();
    try {
      const mobilResult = await mobilConnection.execute(
        `SELECT COUNT(*) FROM BOSNDS3.C_CLIENT_VIP WHERE MOBIL = :mobil`,
        [mobil]
      );
      if (mobilResult.rows[0][0] > 0) {
        return res.status(400).json({
          code: 400,
          message: '参数错误',
          errors: {
            mobil: '手机号已被使用'
          }
        });
      }
    } finally {
      mobilConnection.release();
    }

    // 生成数据校验码 (简单示例，实际应使用更安全的算法)
    const checkCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // 使用新的getConnection方法获取连接
    const connection = await db.getConnection();

    try {
      // 开始事务
      await connection.execute('BEGIN NULL; END;');
      console.log('事务开始');

      // 生成主键ID (使用数据库序列或UUID，这里使用时间戳+随机数)
      // 修改前: 时间戳后8位+3位随机数 = 11位数字
      // const id = Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      // 修改后: 时间戳后7位+3位随机数 = 10位数字
      const id = Date.now().toString().slice(-7) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

      // 当前时间
      const creationDate = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // 转换数字类型参数
      const vipTypeId = parseInt(c_vipType_Id) || null;
      const cityId = c_City_Id ? parseInt(c_City_Id) : null;
      const storeId = c_Store_Id ? parseInt(c_Store_Id) : null;
      const customerUpId = c_CustomerUp_Id ? parseInt(c_CustomerUp_Id) : null;
      const openCardTypeId = parseInt(c_OpenCardType_Id) || null;

      // 转换日期字段
      const birthdayNum = parseInt(birthday.replace(/-/g, ''));
      const validDateNum = validDate ? parseInt(validDate.replace(/-/g, '')) : null;
      const expireDateNum = expireDate ? parseInt(expireDate.replace(/-/g, '')) : null;

      const result = await connection.execute(
        `INSERT INTO BOSNDS3.C_CLIENT_VIP (
          ID, CARDNO, C_VIPTYPE_ID, IDNO, VIPNAME, VIPENAME, SEX, BIRTHDAY, VALIDDATE,
          CREDITREMAIN, INTEGRAL, INTEGRAL_UP, EXPIRE_INTEGRAL, EXPIRE_DATE, COUNTRY,
          C_CITY_ID, ADDRESS, POST, PHONE, MOBIL, EMAIL, C_STORE_ID,
          C_CUSTOMERUP_ID, C_OPENCARDTYPE_ID, VIPSTATE, IS_FIRST_INTER, CREATIONDATE
        ) VALUES (
          :ID, :CARDNO, :C_VIPTYPE_ID, :IDNO, :VIPNAME, :VIPENAME, :SEX, :BIRTHDAY, :VALIDDATE,
          :CREDITREMAIN, :INTEGRAL, :INTEGRAL_UP, :EXPIRE_INTEGRAL, :EXPIRE_DATE, :COUNTRY,
          :C_CITY_ID, :ADDRESS, :POST, :PHONE, :MOBIL, :EMAIL, :C_STORE_ID,
          :C_CUSTOMERUP_ID, :C_OPENCARDTYPE_ID, :VIPSTATE, :IS_FIRST_INTER, TO_DATE(:CREATIONDATE, 'YYYY-MM-DD HH24:MI:SS')
        )`,
        [
          parseInt(id), // 确保ID是数字
          cardNo,
          vipTypeId,
          idNo,
          vipName,
          vipEname,
          sex,
          birthdayNum,
          validDateNum,
          creditRemain,
          integral,
          integralUp ? parseInt(integralUp) : null,
          expireIntegral,
          expireDateNum,
          country,
          cityId,
          address,
          post,
          phone,
          mobil,
          email,
          storeId,
          customerUpId,
          openCardTypeId,
          vipState,
          is_First_Inter,
          creationDate
        ],
        { autoCommit: false } // 禁用自动提交
      );

      console.log('插入操作结果:', result);

      // 提交事务
      await connection.execute('COMMIT');
      console.log('事务提交成功');

      res.status(201).json({
        code: 201,
        message: 'VIP客户创建成功',
        data: {
          id,
          cardNo,
          creationDate,
          checkCode
        }
      });
    } catch (transactionError) {
      // 回滚事务
      await connection.execute('ROLLBACK');
      console.error('事务回滚:', transactionError);
      throw transactionError;
    } finally {
      // 释放连接回连接池
      connection.release();
      console.log('连接已释放');
    }
  } catch (error) {
    console.error('服务器内部错误:', error);
    let errorMessage = '服务器内部错误';
    if (error.message) {
      errorMessage += ': ' + error.message;
    }
    res.status(500).json({
      code: 500,
      message: errorMessage,
      data: null
    });
  }
};

// 查询客户
exports.queryCustomers = async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, cardNo, vipName, idNo, c_vipType_Id, vipStatus, c_store_Id, creationDate } = req.query;

    // 使用新的getConnection方法获取连接
    const connection = await db.getConnection();

    try {
      // 构建查询条件
      let whereClause = '';
      const params = [];
      let paramIndex = 1;

      // 处理卡号模糊查询
      if (cardNo) {
        whereClause += whereClause ? ' AND ' : ' WHERE ';
        whereClause += `CARDNO LIKE :param${paramIndex}`;
        params.push(`%${cardNo}%`);
        paramIndex++;
      }

      // 处理客户姓名模糊查询
      if (vipName) {
        whereClause += whereClause ? ' AND ' : ' WHERE ';
        whereClause += `VIPNAME LIKE :param${paramIndex}`;
        params.push(`%${vipName}%`);
        paramIndex++;
      }

      // 处理证件号查询
      if (idNo) {
        whereClause += whereClause ? ' AND ' : ' WHERE ';
        whereClause += `IDNO = :param${paramIndex}`;
        params.push(idNo);
        paramIndex++;
      }

      // 处理VIP类型查询
      if (c_vipType_Id) {
        whereClause += whereClause ? ' AND ' : ' WHERE ';
        whereClause += `C_VIPTYPE_ID = :param${paramIndex}`;
        params.push(c_vipType_Id);
        paramIndex++;
      }

      // 处理VIP状态查询
      if (vipStatus) {
        whereClause += whereClause ? ' AND ' : ' WHERE ';
        whereClause += `VIPSTATUS = :param${paramIndex}`;
        params.push(vipStatus);
        paramIndex++;
      }

      // 处理所属门店查询
      if (c_store_Id) {
        whereClause += whereClause ? ' AND ' : ' WHERE ';
        whereClause += `C_STORE_ID = :param${paramIndex}`;
        params.push(c_store_Id);
        paramIndex++;
      }

      // 处理创建日期范围查询
      if (creationDate) {
        const [startDate, endDate] = creationDate.split(',');
        if (startDate && endDate) {
          whereClause += whereClause ? ' AND ' : ' WHERE ';
          whereClause += `CREATIONDATE BETWEEN TO_DATE(:param${paramIndex}, 'YYYY-MM-DD') AND TO_DATE(:param${paramIndex + 1}, 'YYYY-MM-DD')`;
          params.push(startDate, endDate);
          paramIndex += 2;
        }
      }

      // 分页计算
      const offset = (pageNum - 1) * pageSize;
      const endRow = offset + pageSize;

      // 查询总记录数
      const countResult = await connection.execute(
        `SELECT COUNT(*) FROM BOSNDS3.C_CLIENT_VIP ${whereClause}`,
        params
      );
      const total = countResult.rows[0][0];

      // 使用ROW_NUMBER()进行分页查询 - Oracle兼容方式
      const queryResult = await connection.execute(
        `SELECT * FROM (
          SELECT t.*, ROW_NUMBER() OVER (ORDER BY CREATIONDATE DESC) AS rn
          FROM BOSNDS3.C_CLIENT_VIP t
          ${whereClause}
        ) WHERE rn > :offset AND rn <= :endRow`,
        [...params, offset, endRow]
      );

      // 获取字段名
      const columns = queryResult.metaData.map(col => col.name);

      // 转换为对象数组
      const list = queryResult.rows.map(row => {
        const obj = {};
        columns.forEach((col, index) => {
          // 排除rn字段
          if (col.toLowerCase() !== 'rn') {
            obj[col.toLowerCase()] = row[index]; // 转换为小写以匹配接口文档
          }
        });
        return obj;
      });

      res.status(200).json({
        code: 200,
        message: '查询成功',
        data: {
          total,
          pageNum: parseInt(pageNum),
          pageSize: parseInt(pageSize),
          list
        }
      });
    } finally {
      // 释放连接回连接池
      connection.release();
    }
  } catch (error) {
    console.error('服务器内部错误:', error);
    let errorMessage = '服务器内部错误';
    if (error.message) {
      errorMessage += ': ' + error.message;
    }
    res.status(500).json({
      code: 500,
      message: errorMessage,
      data: null
    });
  }
};

/**
 * 客户分类功能
 * @param {Object} req - 请求对象，包含分类信息
 * @param {Object} res - 响应对象
 */
async function classifyCustomer(req, res) {
  let connection;
  try {
    // 获取请求参数
    const { ID, SCHEMA_ID_FK, GROUP_NAME, GROUP_FLAG, COMMENTS, SECURITY_GROUP_ID, CREATED_BY } = req.body;

    // 验证必要参数
    if (!ID || !SCHEMA_ID_FK || !GROUP_NAME || !GROUP_FLAG || !CREATED_BY) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数，请检查ID、SCHEMA_ID_FK、GROUP_NAME、GROUP_FLAG和CREATED_BY是否提供'
      });
    }

    // 获取数据库连接
    connection = await db.getConnection();

    // 检查SCHEMA_ID_FK是否存在于MD_SCHEMAS表中
    const schemaCheck = await connection.execute(
      `SELECT ID FROM BOSNDS3.MD_SCHEMAS WHERE ID = :SCHEMA_ID_FK`,
      [SCHEMA_ID_FK]
    );

    if (schemaCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `无效的SCHEMA_ID_FK: ${SCHEMA_ID_FK}，在MD_SCHEMAS表中不存在`,
        error: '外键约束 violation'
      });
    }

    // 开始事务 - 修改为完整的PL/SQL块
    await connection.execute('BEGIN NULL; END;');
    console.log('事务开始');

    // 检查分类是否已存在
    const checkResult = await connection.execute(
      `SELECT ID FROM BOSNDS3.MD_GROUPS WHERE ID = :ID`,
      [ID]
    );

    let result;
    if (checkResult.rows.length > 0) {
      // 更新现有分类
      result = await connection.execute(
        `UPDATE BOSNDS3.MD_GROUPS
         SET SCHEMA_ID_FK = :SCHEMA_ID_FK,
             GROUP_NAME = :GROUP_NAME,
             GROUP_FLAG = :GROUP_FLAG,
             COMMENTS = :COMMENTS,
             SECURITY_GROUP_ID = :SECURITY_GROUP_ID,
             CREATED_BY = :CREATED_BY,
             LAST_updated = SYSDATE
         WHERE ID = :ID`,
        [SCHEMA_ID_FK, GROUP_NAME, GROUP_FLAG, COMMENTS, SECURITY_GROUP_ID, CREATED_BY, ID]
      );
    } else {
      // 添加新分类 - 暂时移除创建日期列
      result = await connection.execute(
        `INSERT INTO BOSNDS3.MD_GROUPS (
           ID, SCHEMA_ID_FK, GROUP_NAME, GROUP_FLAG, COMMENTS, SECURITY_GROUP_ID, CREATED_BY
         ) VALUES (
           :ID, :SCHEMA_ID_FK, :GROUP_NAME, :GROUP_FLAG, :COMMENTS, :SECURITY_GROUP_ID, :CREATED_BY
         )`,
        [ID, SCHEMA_ID_FK, GROUP_NAME, GROUP_FLAG, COMMENTS, SECURITY_GROUP_ID, CREATED_BY]
      );
    }

    // 提交事务
    await connection.execute('COMMIT');
    console.log('事务提交成功');

    res.status(200).json({
      success: true,
      message: checkResult.rows.length > 0 ? '客户分类更新成功' : '客户分类添加成功',
      data: result
    });
  } catch (error) {
    // 回滚事务
    if (connection) {
      try {
        await connection.execute('ROLLBACK');
        console.error('事务回滚成功');
      } catch (rollbackError) {
        console.error('回滚事务失败:', rollbackError);
      }
    }

    console.error('客户分类失败:', error);
    res.status(500).json({
      success: false,
      message: '客户分类失败',
      error: error.message
    });
  } finally {
    // 释放连接回连接池
    if (connection) {
      try {
        connection.release();
        console.log('连接已释放');
      } catch (releaseError) {
        console.error('释放数据库连接失败:', releaseError);
      }
    }
  }
}


exports.classifyCustomer = classifyCustomer;

// 客户跟进功能实现
exports.followupCustomer = async (req, res) => {
  const { customerId, followupContent } = req.body;
  
  if (!customerId || !followupContent) {
    return res.status(400).json({
      code: 400,
      message: '客户ID和跟进内容为必填项',
      data: null
    });
  }

  try {
    const connection = await db.getConnection();
    
    try {
      // 检查客户是否存在
      const customerCheck = await connection.execute(
        'SELECT 1 FROM BOSNDS3.C_CLIENT_VIP WHERE ID = :customerId',
        { customerId: customerId }
      );
      
      if (customerCheck.rows.length === 0) {
        return res.status(404).json({
          code: 404,
          message: '客户不存在',
          data: null
        });
      }
      
      // 生成新的跟进记录ID (10位数字)
      const newId = Date.now().toString().slice(-7) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      // 插入跟进记录到CVIP_FEEDBACK表
      const sql = `
        INSERT INTO BOSNDS3.CVIP_FEEDBACK (
          ID, AD_CLIENT_ID, AD_ORG_ID, CREATIONDATE, MODIFIEDDATE,
          NAME, VALUE, OWNERID, MODIFIERID, ISACTIVE
        ) VALUES (
          :ID, :AD_CLIENT_ID, :AD_ORG_ID, SYSDATE, SYSDATE,
          :NAME, :VALUE, :OWNERID, :MODIFIERID, 'Y'
        )
      `;
      
      const params = {
        ID: parseInt(newId),
        AD_CLIENT_ID: 1, // 默认租户ID
        AD_ORG_ID: 1,    // 默认组织ID
        NAME: followupContent,  // 跟进内容存入NAME字段
        VALUE: customerId,      // 客户ID存入VALUE字段
        OWNERID: req.user?.id || 1, // 操作用户ID作为OWNERID
        MODIFIERID: req.user?.id || 1 // 操作用户ID作为MODIFIERID
      };
      
      await connection.execute(sql, params, { autoCommit: false });
      
      // 提交事务
      await connection.execute('COMMIT');
      
      res.status(200).json({
        code: 200,
        message: '客户跟进记录添加成功',
        data: {
          followupId: newId
        }
      });
    } catch (transactionError) {
      // 回滚事务
      await connection.execute('ROLLBACK');
      console.error('事务错误:', transactionError);
      throw transactionError;
    } finally {
      // 释放连接
      connection.release();
    }
  } catch (err) {
    console.error('客户跟进错误:', err);
    let errorMessage = '客户跟进失败';
    if (err.message.includes('ORA-00942')) {
      errorMessage = '数据库表不存在: BOSNDS3.CVIP_FEEDBACK';
    } else if (err.message.includes('ORA-02289')) {
      errorMessage = '序列不存在: BOSNDS3.SEQ_CVIP_FEEDBACK_ID';
    } else if (err.message.includes('ORA-01438')) {
      errorMessage = '值超过了列的精度限制: ID列最大允许10位整数';
    }
    res.status(500).json({
      code: 500,
      message: errorMessage,
      error: err.message
    });
  }
};

// 查询客户跟进记录
exports.getCustomerFollowups = async (req, res) => {
  const { customerId } = req.query;
  
  if (!customerId) {
    return res.status(400).json({
      code: 400,
      message: '客户ID是必填项',
      data: null
    });
  }

  try {
    const connection = await db.getConnection();
    
    try {
      // 查询客户跟进记录
      const result = await connection.execute(
        `SELECT ID, C_CUSTOMER_ID, CAREWAY, CARETIME, CREATIONDATE 
         FROM BOSNDS3.C_CUSTOMER_CARE 
         WHERE C_CUSTOMER_ID = :customerId 
         ORDER BY CARETIME DESC`,
        { customerId: customerId }
      );
      
      // 格式化结果
      const followups = result.rows.map(row => ({
        id: row[0],
        customerId: row[1],
        followupContent: row[2],  // CAREWAY 对应 followupContent
        timestamp: row[3],        // CARETIME 是时间戳
        creationDate: row[4]      // 创建日期
      }));
      
      res.status(200).json({
        code: 200,
        message: '查询成功',
        data: followups
      });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('查询客户跟进记录错误:', err);
    res.status(500).json({
      code: 500,
      message: '查询客户跟进记录失败: ' + err.message,
      error: err.message
    });
  }
};


// 查询客户画像
exports.getCustomerProfile = async (req, res) => {
  const { customerId } = req.query;
  
  if (!customerId) {
    return res.status(400).json({
      code: 400,
      message: '客户ID是必填项',
      data: null
    });
  }

  try {
    const connection = await db.getConnection();
    
    try {
      // 1. 检查客户在 C_CLIENT_VIP 表中是否存在
      const vipCustomerResult = await connection.execute(
        `SELECT ID FROM BOSNDS3.C_CLIENT_VIP WHERE ID = :customerId`,
        { customerId: customerId }
      );

      if (vipCustomerResult.rows.length === 0) {
        return res.status(404).json({
          code: 404,
          message: '客户不存在',
          data: null
        });
      }

      // 2. 查询客户基本信息 (假设 C_CLIENT_VIP 和 C_CUSTOMER_ACCOUNT 通过 ID 关联)
      const customerResult = await connection.execute(
        `SELECT ID, NAME, DESCRIPTION, ISACTIVE, CREATIONDATE, LASTDATE, 
                TQTY, TAMT, LASTAMOUNT 
         FROM BOSNDS3.C_CUSTOMER_ACCOUNT 
         WHERE ID = :customerId AND ISACTIVE = 'Y'`,
        { customerId: customerId }
      );

      // 如果 C_CUSTOMER_ACCOUNT 中没有记录，尝试从 C_CLIENT_VIP 获取基本信息
      let basicInfo;
      if (customerResult.rows.length === 0) {
        const vipInfoResult = await connection.execute(
          `SELECT ID, VIPNAME, 'VIP客户' as DESCRIPTION, 'Y' as ISACTIVE, CREATIONDATE, null as LASTDATE 
           FROM BOSNDS3.C_CLIENT_VIP 
           WHERE ID = :customerId`,
          { customerId: customerId }
        );
        
        if (vipInfoResult.rows.length === 0) {
          return res.status(404).json({
            code: 404,
            message: '客户不存在',
            data: null
          });
        }
        
        const [vipRow] = vipInfoResult.rows;
        basicInfo = {
          customerId: vipRow[0],
          name: vipRow[1],
          description: vipRow[2],
          status: vipRow[3],
          createTime: vipRow[4],
          lastFollowupTime: vipRow[5]
        };
      } else {
        const [customerRow] = customerResult.rows;
        basicInfo = {
          customerId: customerRow[0],
          name: customerRow[1],
          description: customerRow[2],
          status: customerRow[3],
          createTime: customerRow[4],
          lastFollowupTime: customerRow[5]
        };
      }

      // 3. 查询客户分组信息
      let groups = [];
      try {
        const groupResult = await connection.execute(
          `SELECT g.ID, g.GROUP_NAME, g.COMMENTS 
           FROM BOSNDS3.MD_GROUPS g
           JOIN BOSNDS3.C_CUSTOMER_GROUP cg ON g.ID = cg.GROUP_ID
           WHERE cg.CUSTOMER_ID = :customerId`,
          { customerId: customerId }
        );

        groups = groupResult.rows.map(row => ({
          groupId: row[0],
          groupName: row[1],
          comments: row[2]
        }));
      } catch (groupError) {
        console.warn('查询客户分组信息失败:', groupError.message);
      }

      // 4. 查询最近3条跟进记录
      const followupResult = await connection.execute(
        `SELECT CAREWAY, CARETIME 
         FROM (
           SELECT CAREWAY, CARETIME 
           FROM BOSNDS3.C_CUSTOMER_CARE 
           WHERE C_CUSTOMER_ID = :customerId 
           ORDER BY CARETIME DESC
         ) 
         WHERE ROWNUM <= 3`,
        { customerId: customerId }
      );

      const recentFollowups = followupResult.rows.map(row => ({
        content: row[0],
        timestamp: row[1]
      }));

      // 5. 统计数据 (如果 C_CUSTOMER_ACCOUNT 中没有记录，设置默认值)
      let stats = {
        totalTransactions: 0,
        totalAmount: 0,
        lastTransactionAmount: 0
      };

      if (customerResult.rows.length > 0) {
        const [customerRow] = customerResult.rows;
        stats = {
          totalTransactions: customerRow[6],  // TQTY字段
          totalAmount: customerRow[7],       // TAMT字段
          lastTransactionAmount: customerRow[8]  // LASTAMOUNT字段
        };
      }

      // 整合返回数据
      res.status(200).json({
        code: 200,
        message: '查询成功',
        data: {
          basicInfo,
          groups,
          recentFollowups,
          stats
        }
      });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('查询客户画像错误:', err);
    // 检查是否为表不存在的错误
    if (err.message && err.message.includes('ORA-00942')) {
      res.status(500).json({
        code: 500,
        message: '查询客户画像失败: 数据库表或视图不存在',
        error: '可能是BOSNDS3.C_CUSTOMER_GROUP表不存在或命名不正确',
        data: null
      });
    } else if (err.message && err.message.includes('ORA-00933')) {
      res.status(500).json({
        code: 500,
        message: '查询客户画像失败: SQL语法错误',
        error: '可能是数据库版本不兼容导致的语法问题',
        data: null
      });
    } else {
      res.status(500).json({
        code: 500,
        message: '查询客户画像失败: ' + err.message,
        error: err.message,
        data: null
      });
    }
  }
};