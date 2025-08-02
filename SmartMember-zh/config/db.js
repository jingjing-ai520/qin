
const oracledb = require('oracledb');
const dotenv = require('dotenv');
const path = require('path');

// 尝试配置使用 Thick 模式
try {
  // 修改客户端初始化代码，添加路径验证
  if (!process.env.ORACLE_CLIENT_DIR) {
    console.error('错误: ORACLE_CLIENT_DIR环境变量未设置');
    process.exit(1);
  }

  try {
    oracledb.initOracleClient({
      libDir: process.env.ORACLE_CLIENT_DIR
    });
    console.log('Oracle客户端初始化成功 - 路径:', process.env.ORACLE_CLIENT_DIR);
    console.log('客户端模式:', oracledb.thin ? 'Thin' : 'Thick'); // 确认模式
  } catch (err) {
    console.error('Oracle客户端初始化失败:', err);
    process.exit(1); // 初始化失败时退出应用
  }
  console.log('Oracle client initialized successfully');
  console.log('Using Oracle client mode:', oracledb.thin ? 'Thin' : 'Thick');
} catch (error) {
  console.error('Error initializing Oracle client:', error);
  process.exit(1); // 初始化失败时终止应用，避免回退到Thin模式
}

// 使用绝对路径加载.env文件
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// 打印环境变量值以进行调试
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '*****' : 'undefined');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_SERVICE:', process.env.DB_SERVICE);

// 添加模块级变量存储连接池
let pool = null;

async function initialize() {
  try {
    // 如果连接池已存在，则直接返回
    if (pool) {
      console.log('使用现有数据库连接池');
      return pool;
    }

    console.log('初始化数据库连接池');
    // 创建连接池而非直接连接
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SERVICE}`,
      thin: false, // 保持Thick模式
      poolMin: 1,  // 最小连接数
      poolMax: 10, // 最大连接数
      poolIncrement: 1
    });
    console.log('数据库连接池初始化成功');
    return pool; // 返回连接池对象
  } catch (error) {
    console.error('初始化过程错误:', error);
    throw error;
  }
}

// 添加获取连接的方法
async function getConnection() {
  try {
    // 确保连接池已初始化
    const pool = await initialize();
    // 从连接池获取连接
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('获取数据库连接失败:', error);
    throw error;
  }
}

module.exports = {
  initialize,
  getConnection // 导出新添加的getConnection方法
};