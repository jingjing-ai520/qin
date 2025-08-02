// 确保已导入数据库连接模块
const db = require('../config/db');

// 添加VIP类型
exports.createVipType = async (req, res) => {
  try {
    const {
      name, description, discount, integralRate, canUpgrade,
      c_vipTypeUp_Id, needIntg, defaultValid, dbIntDay,
      integralValid, isActive
    } = req.body;

    // 验证必填字段
    if (!name || discount === undefined || integralRate === undefined || !canUpgrade || defaultValid === undefined || !isActive) {
      return res.status(400).json({
        code: 400,
        message: '参数错误',
        errors: {
          ...(!name ? { name: 'VIP类型名称不能为空' } : {}),
          ...(discount === undefined ? { discount: '基础折扣率不能为空' } : {}),
          ...(integralRate === undefined ? { integralRate: '消费积分比例不能为空' } : {}),
          ...(!canUpgrade ? { canUpgrade: '是否可升级不能为空' } : {}),
          ...(defaultValid === undefined ? { defaultValid: '是否默认有效不能为空' } : {}),
          ...(!isActive ? { isActive: '是否启用不能为空' } : {})
        }
      });
    }

    // 验证canUpgrade、defaultValid、isActive只能是'Y'或'N'
    const validateYN = (value, fieldName) => {
      if (value !== 'Y' && value !== 'N') {
        return { [fieldName]: `${fieldName === 'canUpgrade' ? '是否可升级' : fieldName === 'defaultValid' ? '是否默认有效' : '是否启用'}只能是Y或N` };
      }
      return null;
    };

    // 添加dbIntDay长度验证
    const validateDbIntDay = (value) => {
      if (value && value.length > 1) {
        return { dbIntDay: 'DBINTDAY字段长度不能超过1个字符' };
      }
      return null;
    };

    const errors = {}
    const canUpgradeError = validateYN(canUpgrade, 'canUpgrade');
    const defaultValidError = validateYN(defaultValid, 'defaultValid');
    const isActiveError = validateYN(isActive, 'isActive');
    const dbIntDayError = validateDbIntDay(dbIntDay);

    if (canUpgradeError) Object.assign(errors, canUpgradeError);
    if (defaultValidError) Object.assign(errors, defaultValidError);
    if (isActiveError) Object.assign(errors, isActiveError);
    if (dbIntDayError) Object.assign(errors, dbIntDayError);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        code: 400,
        message: '参数错误',
        errors
      });
    }

    // 转换数字类型参数
    const vipTypeUpId = c_vipTypeUp_Id ? parseInt(c_vipTypeUp_Id) : null;
    const needIntegral = needIntg ? parseInt(needIntg) : null;
    const defaultValidNum = defaultValid === 'Y' ? 1 : 0;
    const integralValidNum = integralValid ? parseInt(integralValid) : null;

    // 使用连接池获取连接
    const connection = await db.getConnection();

    try {
      // 开始事务
      await connection.execute('BEGIN NULL; END;');
      console.log('VIP类型创建事务开始');

      // 生成符合NUMBER(10,0)类型的唯一ID
      const timestamp = Date.now().toString().slice(-8); // 取时间戳后8位
      const randomPart = Math.floor(Math.random() * 100).toString().padStart(2, '0'); // 2位随机数
      const id = parseInt(timestamp + randomPart); // 确保不超过10位

      const result = await connection.execute(
        `INSERT INTO BOSNDS3.C_VIPTYPE (
          ID, AD_CLIENT_ID, AD_ORG_ID, ISACTIVE, CREATIONDATE,
          NAME, DESCRIPTION, DISCOUNT, INTEGRALRATE, CANUPGRADE,
          C_VIPTYPEUP_ID, NEEDINTG, DEFAULTVALID, DBINTDAY,
          INTEGRAL_VALID, IFCHARGE
        ) VALUES (
          :ID, :AD_CLIENT_ID, :AD_ORG_ID, :ISACTIVE, SYSDATE,
          :NAME, :DESCRIPTION, :DISCOUNT, :INTEGRALRATE, :CANUPGRADE,
          :C_VIPTYPEUP_ID, :NEEDINTG, :DEFAULTVALID, :DBINTDAY,
          :INTEGRAL_VALID, :IFCHARGE
        )`,
        [
          id,
          1, // 假设AD_CLIENT_ID默认为1
          1, // 假设AD_ORG_ID默认为1
          isActive,
          name,
          description || null,
          discount,
          integralRate,
          canUpgrade,
          vipTypeUpId,
          needIntegral,
          defaultValidNum,
          dbIntDay || null,
          integralValidNum || null,
          'N'
        ],
        { autoCommit: false }
      );

      console.log('VIP类型插入操作结果:', result);

      // 提交事务
      await connection.execute('COMMIT');
      console.log('VIP类型创建事务提交成功');

      res.status(200).json({
        code: 200,
        msg: 'VIP类型创建成功',
        data: {
          typeId: id
        }
      });
    } catch (error) {
      // 回滚事务
      await connection.execute('ROLLBACK');
      console.error('VIP类型创建事务回滚:', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('创建VIP类型失败:', error);
    let errorMessage = '服务器内部错误';
    if (error.message.includes('ORA-00001')) {
      errorMessage = 'VIP类型已存在或ID冲突，请稍后重试';
    } else if (error.message.includes('ORA-00942')) {
      errorMessage = '数据库表不存在: BOSNDS3.C_VIPTYPE';
    } else if (error.message.includes('ORA-00904')) {
      errorMessage = '表中缺少字段，请检查C_VIPTYPE表结构';
    } else if (error.message.includes('ORA-01400')) {
      errorMessage = '无法插入NULL值到非空字段';
    } else if (error.message.includes('ORA-01438')) {
      errorMessage = '值超出字段范围，请检查ID是否超过10位';
    } else if (error.message.includes('ORA-02289')) {
      errorMessage = '数据库序列不存在: BOSNDS3.SEQ_VIPTYPE_ID';
    } else if (error.message.includes('ORA-01036')) {
      errorMessage = 'SQL变量名/数量不合法，请检查参数绑定';
    }

    res.status(500).json({
      code: 500,
      message: errorMessage,
      data: { error: error.message }
    });
  }
};

// 查询VIP类型详情
exports.getVipTypeById = async (req, res) => {
  try {
    const { typeId } = req.params;
    const { name } = req.query;

    // 验证typeId是数字
    if (isNaN(typeId)) {
      return res.status(400).json({
        code: 400,
        message: '参数错误',
        errors: { id: 'VIP类型ID必须是数字' }
      });
    }

    // 使用连接池获取连接
    const connection = await db.getConnection();

    try {
      let query = `
        SELECT ID, NAME, DESCRIPTION, DISCOUNT, INTEGRALRATE, CANUPGRADE,
               C_VIPTYPEUP_ID, NEEDINTG, DEFAULTVALID, DBINTDAY,
               INTEGRAL_VALID, ISACTIVE
        FROM BOSNDS3.C_VIPTYPE
        WHERE ID = :ID
      `;

      const params = { ID: parseInt(typeId) };

      // 如果提供了name参数，添加到查询条件
      if (name) {
        query += ' AND NAME = :NAME';
        params.NAME = name;
      }

      const result = await connection.execute(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({
          code: 404,
          message: '未找到该VIP类型',
          data: null
        });
      }

      // 处理查询结果
      const vipType = {
        id: result.rows[0][0],
        name: result.rows[0][1],
        description: result.rows[0][2],
        discount: result.rows[0][3],
        integralRate: result.rows[0][4],
        canUpgrade: result.rows[0][5],
        c_vipTypeUp_Id: result.rows[0][6],
        needIntg: result.rows[0][7],
        defaultValid: result.rows[0][8] === 1 ? 'Y' : 'N',
        dbIntDay: result.rows[0][9],
        integralValid: result.rows[0][10],
        isActive: result.rows[0][11]
      };

      res.status(200).json({
        code: 200,
        msg: '查询成功',
        data: vipType
      });
    } catch (error) {
      console.error('查询VIP类型失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('查询VIP类型异常:', error);
    let errorMessage = '服务器内部错误';
    if (error.message.includes('ORA-00942')) {
      errorMessage = '数据库表不存在: BOSNDS3.C_VIPTYPE';
    } else if (error.message.includes('ORA-00904')) {
      errorMessage = '表中缺少字段，请检查C_VIPTYPE表结构';
    }

    res.status(500).json({
      code: 500,
      message: errorMessage,
      data: { error: error.message }
    });
  }
};

// 更新VIP类型规则
exports.updateVipType = async (req, res) => {
  try {
    const { typeId } = req.params;
    const {
      name, description, discount, integralRate, canUpgrade,
      c_vipTypeUp_Id, needIntg, defaultValid, dbIntDay,
      integralValid, isActive
    } = req.body;

    // 验证typeId是数字
    if (isNaN(typeId)) {
      return res.status(400).json({
        code: 400,
        message: '参数错误',
        errors: { id: 'VIP类型ID必须是数字' }
      });
    }

    // 验证必填字段
    if (!name || discount === undefined || integralRate === undefined || !canUpgrade || defaultValid === undefined || !isActive) {
      return res.status(400).json({
        code: 400,
        message: '参数错误',
        errors: {
          ...(!name ? { name: 'VIP类型名称不能为空' } : {}),
          ...(discount === undefined ? { discount: '基础折扣率不能为空' } : {}),
          ...(integralRate === undefined ? { integralRate: '消费积分比例不能为空' } : {}),
          ...(!canUpgrade ? { canUpgrade: '是否可升级不能为空' } : {}),
          ...(defaultValid === undefined ? { defaultValid: '是否默认有效不能为空' } : {}),
          ...(!isActive ? { isActive: '是否启用不能为空' } : {})
        }
      });
    }

    // 验证canUpgrade、defaultValid、isActive只能是'Y'或'N'
    const validateYN = (value, fieldName) => {
      if (value !== 'Y' && value !== 'N') {
        return { [fieldName]: `${fieldName === 'canUpgrade' ? '是否可升级' : fieldName === 'defaultValid' ? '是否默认有效' : '是否启用'}只能是Y或N` };
      }
      return null;
    };

    const errors = {}
    const canUpgradeError = validateYN(canUpgrade, 'canUpgrade');
    const defaultValidError = validateYN(defaultValid, 'defaultValid');
    const isActiveError = validateYN(isActive, 'isActive');

    if (canUpgradeError) Object.assign(errors, canUpgradeError);
    if (defaultValidError) Object.assign(errors, defaultValidError);
    if (isActiveError) Object.assign(errors, isActiveError);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        code: 400,
        message: '参数错误',
        errors
      });
    }

    // 转换数字类型参数
    const vipTypeUpId = c_vipTypeUp_Id ? parseInt(c_vipTypeUp_Id) : null;
    const needIntegral = needIntg ? parseInt(needIntg) : null;
    const defaultValidNum = defaultValid === 'Y' ? 1 : 0;
    const integralValidNum = integralValid ? parseInt(integralValid) : null;

    // 使用连接池获取连接
    const connection = await db.getConnection();

    try {
      // 开始事务
      await connection.execute('BEGIN NULL; END;');
      console.log('VIP类型更新事务开始');

      // 检查VIP类型是否存在
      const checkResult = await connection.execute(
        'SELECT ID FROM BOSNDS3.C_VIPTYPE WHERE ID = :ID',
        { ID: parseInt(typeId) }
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          code: 404,
          message: '未找到该VIP类型',
          data: null
        });
      }

      // 更新VIP类型
      const updateResult = await connection.execute(
        `UPDATE BOSNDS3.C_VIPTYPE
         SET NAME = :NAME,
             DESCRIPTION = :DESCRIPTION,
             DISCOUNT = :DISCOUNT,
             INTEGRALRATE = :INTEGRALRATE,
             CANUPGRADE = :CANUPGRADE,
             C_VIPTYPEUP_ID = :C_VIPTYPEUP_ID,
             NEEDINTG = :NEEDINTG,
             DEFAULTVALID = :DEFAULTVALID,
             DBINTDAY = :DBINTDAY,
             INTEGRAL_VALID = :INTEGRAL_VALID,
             ISACTIVE = :ISACTIVE,
             MODIFIEDDATE = SYSDATE
         WHERE ID = :ID`,
        [
          name,
          description || null,
          discount,
          integralRate,
          canUpgrade,
          vipTypeUpId,
          needIntegral,
          defaultValidNum,
          dbIntDay || null,
          integralValidNum || null,
          isActive,
          parseInt(typeId)
        ],
        { autoCommit: false }
      );

      console.log('VIP类型更新操作结果:', updateResult);

      // 提交事务
      await connection.execute('COMMIT');
      console.log('VIP类型更新事务提交成功');

      res.status(200).json({
        code: 200,
        msg: 'VIP类型规则更新成功',
        data: {}
      });
    } catch (error) {
      // 回滚事务
      await connection.execute('ROLLBACK');
      console.error('VIP类型更新事务回滚:', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('更新VIP类型失败:', error);
    let errorMessage = '服务器内部错误';
    if (error.message.includes('ORA-00942')) {
      errorMessage = '数据库表不存在: BOSNDS3.C_VIPTYPE';
    } else if (error.message.includes('ORA-00904')) {
      errorMessage = '表中缺少字段，请检查C_VIPTYPE表结构';
    } else if (error.message.includes('ORA-01400')) {
      errorMessage = '无法插入NULL值到非空字段';
    } else if (error.message.includes('ORA-01438')) {
      errorMessage = '值超出字段范围';
    } else if (error.message.includes('ORA-01036')) {
      errorMessage = 'SQL变量名/数量不合法，请检查参数绑定';
    }

    res.status(500).json({
      code: 500,
      message: errorMessage,
      data: { error: error.message }
    });
  }
};

// 禁用VIP类型(逻辑删除)
exports.disableVipType = async (req, res) => {
  try {
    const { typeId } = req.params;
    const { name } = req.query;

    // 验证typeId是数字
    if (isNaN(typeId)) {
      return res.status(400).json({
        code: 400,
        message: '参数错误',
        errors: { id: 'VIP类型ID必须是数字' }
      });
    }

    // 使用连接池获取连接
    const connection = await db.getConnection();

    try {
      // 开始事务
      await connection.execute('BEGIN NULL; END;');
      console.log('VIP类型禁用事务开始');

      // 检查VIP类型是否存在
      let checkQuery = 'SELECT ID, NAME, ISACTIVE FROM BOSNDS3.C_VIPTYPE WHERE ID = :ID';
      const checkParams = { ID: parseInt(typeId) };

      // 如果提供了name参数，添加到查询条件
      if (name) {
        checkQuery += ' AND NAME = :NAME';
        checkParams.NAME = name;
      }

      const checkResult = await connection.execute(checkQuery, checkParams);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          code: 404,
          message: '未找到该VIP类型',
          data: null
        });
      }

      // 检查是否已被禁用
      if (checkResult.rows[0][2] === 'N') {
        return res.status(200).json({
          code: 200,
          message: 'VIP类型已处于禁用状态',
          data: { isActive: 'N' }
        });
      }

      // 更新VIP类型状态为禁用
      const updateResult = await connection.execute(
        `UPDATE BOSNDS3.C_VIPTYPE
         SET ISACTIVE = 'N',
             MODIFIEDDATE = SYSDATE
         WHERE ID = :ID
         ${name ? 'AND NAME = :NAME' : ''}`,
        {
          ID: parseInt(typeId),
          ...(name ? { NAME: name } : {})
        },
        { autoCommit: false }
      );

      console.log('VIP类型禁用操作结果:', updateResult);

      // 提交事务
      await connection.execute('COMMIT');
      console.log('VIP类型禁用事务提交成功');

      res.status(200).json({
        code: 200,
        msg: 'VIP类型已暂停（逻辑删除）',
        data: { isActive: 'N' }
      });
    } catch (error) {
      // 回滚事务
      await connection.execute('ROLLBACK');
      console.error('VIP类型禁用事务回滚:', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('禁用VIP类型失败:', error);
    let errorMessage = '服务器内部错误';
    if (error.message.includes('ORA-00942')) {
      errorMessage = '数据库表不存在: BOSNDS3.C_VIPTYPE';
    } else if (error.message.includes('ORA-00904')) {
      errorMessage = '表中缺少字段，请检查C_VIPTYPE表结构';
    }

    res.status(500).json({
      code: 500,
      message: errorMessage,
      data: { error: error.message }
    });
  }
};