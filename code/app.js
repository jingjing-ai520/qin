
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const db = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const vipTypeRoutes = require('./routes/vipTypeRoutes');
const productStatRoutes = require('./routes/productStatRoutes'); // 新增这行

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 路由
app.use('/api/user', userRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/vip-type', vipTypeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/product-stat', productStatRoutes); // 新增这行

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  // 检查是否为ApiError类型
  if (err.name === 'ApiError') {
    return res.status(err.statusCode).json({
      code: err.statusCode,
      message: err.message,
      data: err.data
    });
  }
  // 其他错误返回500
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null
  });
});

// 初始化数据库连接池并启动服务
db.initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});

// 在现有代码的适当位置添加
app.get('/', (req, res) => {
  res.send('服务器运行正常！请访问API端点。');
});

app.get('/test-vip-type-table', async (req, res) => {
  try {
    const connection = await db.getConnection();
    // 查询表结构
    const result = await connection.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, NULLABLE
       FROM USER_TAB_COLUMNS
       WHERE TABLE_NAME = 'C_VIPTYPE' AND OWNER = 'BOSNDS3'`
    );
    connection.release();
    res.json({
      code: 200,
      message: '查询C_VIPTYPE表结构成功',
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '查询C_VIPTYPE表结构失败',
      data: { error: error.message }
    });
  }
});