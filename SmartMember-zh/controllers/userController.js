const oracledb = require('oracledb'); // 添加此行
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 用户注册
exports.register = async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;

    // 检查用户是否已存在
    const pool = await db.initialize();
    const connection = await pool.getConnection();
    const result = await connection.execute(
      'SELECT * FROM AD_USER WHERE NAME = :username OR EMAIL = :email',
      [username, email],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length > 0) {
      connection.release();
      return res.status(400).json({
        code: 400,
        message: '用户名或邮箱已存在',
        data: null
      });
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 获取当前日期
    const currentDate = new Date();

    // 创建新用户，添加缺失的字段
    await connection.execute(
      `INSERT INTO AD_USER (
        NAME, PASSWORD, EMAIL, PHONE, MODIFIERID,
        AD_CLIENT_ID, AD_ORG_ID, ISACTIVE, CREATIONDATE, MODIFIEDDATE, OWNERID
      ) VALUES (
        :username, :password, :email, :phone, :modifierId,
        :clientId, :orgId, :isActive, :creationDate, :modifiedDate, :ownerId
      )`,
      [
        username, hashedPassword, email, phone, 1,  // 基本信息和MODIFIERID
        0, 0, 'Y', currentDate, currentDate, 1      // 补充缺失字段
      ]
    );

    await connection.commit();
    connection.release();

    res.status(200).json({
      code: 200,
      message: '用户注册成功',
      data: null
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误: ' + error.message,
      data: null
    });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 检查用户是否存在
    const pool = await db.initialize();
    const connection = await pool.getConnection();
    const result = await connection.execute(
      'SELECT * FROM AD_USER WHERE NAME = :username',
      [username],
      { outFormat: oracledb.OUT_FORMAT_OBJECT } // 添加此行将结果转换为对象格式
    );

    // 新增用户存在性检查
    if (result.rows.length === 0) {
      connection.release();
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
        data: null
      });
    }

    // 获取用户数据（现在是对象格式）
    const user = result.rows[0];

    // 验证密码（现在user.PASSWORD可以正确获取）
    const isPasswordValid = await bcrypt.compare(password, user.PASSWORD);
    if (!isPasswordValid) {
      connection.release();
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
        data: null
      });
    }

    // 生成token
    const token = jwt.sign(
      { id: user.ID, username: user.NAME },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }  // 修改为24小时
    );

    connection.release();
    res.status(200).json({
      code: 200,
      message: '登录成功',
      data: {
        token: token,
        userId: user.ID,
        phone: user.PHONE,
        email: user.EMAIL
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误: ' + error.message,
      data: null
    });
  }
};

// 用户权限管理
exports.permission = async (req, res) => {
  try {
    // 从请求体中获取userid和role
    const { userid, role } = req.body;

    // 验证参数
    if (!userid || !role) {
      return res.status(400).json({
        code: 400,
        message: '用户ID和角色不能为空',
        data: null
      });
    }

    // 确保userid是数字类型并符合NUMBER(10,0)的范围
    const userIdNum = parseInt(userid, 10);
    if (isNaN(userIdNum) || userIdNum < 0 || userIdNum > 9999999999) {
      return res.status(400).json({
        code: 400,
        message: '无效的用户ID格式，必须是0-9999999999之间的整数',
        data: null
      });
    }

    // 角色映射表 - 将接口传入的角色映射到USERS表中的权限字段
    const roleMap = {
      'admin': { ISADMIN: 1, USERTYPE: 0, ISSALER: 'Y', ISOPR: 'Y', IS_SYS_USER: 'Y' },
      'sales': { ISADMIN: 0, USERTYPE: 1, ISSALER: 'Y', ISOPR: 'Y', IS_SYS_USER: 'N' },
      'operator': { ISADMIN: 0, USERTYPE: 3, ISSALER: 'N', ISOPR: 'Y', IS_SYS_USER: 'N' },
      'external': { ISADMIN: 0, USERTYPE: 4, ISSALER: 'N', ISOPR: 'N', IS_SYS_USER: 'N' },
      'employee': { ISADMIN: 0, USERTYPE: 5, ISSALER: 'N', ISOPR: 'N', IS_SYS_USER: 'N' }
    };

    // 检查角色是否有效
    if (!roleMap[role]) {
      return res.status(400).json({
        code: 400,
        message: '无效的角色类型',
        data: null
      });
    }

    const pool = await db.initialize();
    const connection = await pool.getConnection();

    try {
      // 检查用户是否在USERS表中存在
      let userResult = await connection.execute(
        'SELECT * FROM USERS WHERE ID = :userid',
        [userIdNum],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      // 如果用户在USERS表中不存在，尝试从AD_USER表获取并同步
      if (userResult.rows.length === 0) {
        // 从AD_USER表查询用户
        const adUserResult = await connection.execute(
          'SELECT * FROM AD_USER WHERE ID = :userid',
          [userIdNum],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (adUserResult.rows.length === 0) {
          return res.status(404).json({
            code: 404,
            message: '用户不存在',
            data: null
          });
        }

        // 获取AD_USER表中的用户信息
        const adUser = adUserResult.rows[0];
        const currentDate = new Date();

        // 确保adUser.ID是有效数字
        const adUserId = parseInt(adUser.ID, 10);
        if (isNaN(adUserId)) {
          throw new Error('AD_USER表中的ID不是有效数字');
        }

        // 将用户信息插入到USERS表
        await connection.execute(
          `INSERT INTO USERS (
            ID, NAME, EMAIL, PHONE, ISENABLED, ISEMPLOYEE, ISADMIN, USERTYPE, 
            ISSALER, ISOPR, ISSYS, IS_SYS_USER, MODIFIEDDATE, MODIFIERID, CREATIONDATE
          ) VALUES (
            :id, :name, :email, :phone, :isEnabled, :isEmployee, :isAdmin, :userType, 
            :isSaler, :isOpr, :isSys, :isSysUser, :modifiedDate, :modifierId, :creationDate
          )`,
          [
            adUserId, adUser.NAME, adUser.EMAIL, adUser.PHONE, 
            1, 0, 0, 5,  // 修正ISENABLED为数字1，ISEMPLOYEE为0
            'N', 'N', 'N', 'N', 
            currentDate, 1, adUser.CREATIONDATE
          ]
        );

        // 重新查询USERS表以获取插入的用户
        userResult = await connection.execute(
          'SELECT * FROM USERS WHERE ID = :userid',
          [userIdNum],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
      }

      // 获取角色对应的权限字段
      const rolePermissions = roleMap[role];
      const currentDate = new Date();

      // 更新用户权限
      await connection.execute(
        `UPDATE USERS SET
          ISADMIN = :isAdmin,
          USERTYPE = :userType,
          ISSALER = :isSaler,
          ISOPR = :isOpr,
          IS_SYS_USER = :isSysUser,
          MODIFIEDDATE = :modifiedDate,
          MODIFIERID = :modifierId
        WHERE ID = :userId`,
        [
          rolePermissions.ISADMIN,
          rolePermissions.USERTYPE,
          rolePermissions.ISSALER,
          rolePermissions.ISOPR,
          rolePermissions.IS_SYS_USER,
          currentDate,
          1,  // 假设修改者为管理员ID=1
          userIdNum
        ]
      );

      await connection.commit();

      res.status(200).json({
        code: 200,
        message: '权限分配成功',
        data: {
          role: role,
          userId: userIdNum
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('权限分配失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误: ' + error.message,
      data: null
    });
  }
};

// 修改密码
// 修改密码
exports.changePassword = async (req, res) => {
  try {
    // 从token中获取用户ID
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    // 验证参数
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        code: 400,
        message: '旧密码和新密码不能为空',
        data: null
      });
    }

    // 检查新密码长度
    if (newPassword.length < 5 || newPassword.length > 16) {
      return res.status(400).json({
        code: 400,
        message: '新密码长度必须在5-16个字符之间',
        data: null
      });
    }

    const pool = await db.initialize();
    const connection = await pool.getConnection();

    try {
      // 检查用户是否存在
      const userResult = await connection.execute(
        'SELECT * FROM AD_USER WHERE ID = :userId',
        [userId],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          code: 404,
          message: '用户不存在',
          data: null
        });
      }

      const user = userResult.rows[0];

      // 验证旧密码
      const isPasswordValid = await bcrypt.compare(oldPassword, user.PASSWORD);
      if (!isPasswordValid) {
        return res.status(401).json({
          code: 401,
          message: '旧密码不正确',
          data: null
        });
      }

      // 检查新密码是否与旧密码相同
      const isSamePassword = await bcrypt.compare(newPassword, user.PASSWORD);
      if (isSamePassword) {
        return res.status(400).json({
          code: 400,
          message: '新密码不能与旧密码相同',
          data: null
        });
      }

      // 加密新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 更新密码
      await connection.execute(
        'UPDATE AD_USER SET PASSWORD = :password, MODIFIEDDATE = :modifiedDate WHERE ID = :userId',
        [hashedPassword, new Date(), userId]
      );

      await connection.commit();

      res.status(200).json({
        code: 200,
        message: '密码修改成功',
        data: null
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误: ' + error.message,
      data: null
    });
  }
};