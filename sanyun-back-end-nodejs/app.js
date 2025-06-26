const express = require('express');
const cors = require('cors');
const oracledb = require('oracledb');
const Config = require('./config');
const { dbManager } = require('./database');
const SalesService = require('./services/salesService');

const app = express();

// 启用CORS
app.use(cors());
app.use(express.json());

// 配置Oracle客户端为Thick模式以支持Oracle 11g
try {
    // 尝试初始化Thick模式
    const oracleClientPath = process.env.ORACLE_CLIENT_LIB_DIR || 'E:\\oracle\\instantclient_11_2';
    console.log('尝试初始化Oracle Thick模式，客户端路径:', oracleClientPath);
    
    // 初始化Oracle客户端库
    oracledb.initOracleClient({ 
        libDir: oracleClientPath 
    });
    console.log('✓ Oracle Thick模式初始化成功');
} catch (error) {
    console.log('⚠️ Oracle Thick模式初始化失败，尝试使用兼容配置:', error.message);
    
    // 如果Thick模式失败，配置兼容的连接选项
    oracledb.outFormat = oracledb.OUT_FORMAT_ARRAY;
}

// 数据库配置 - 添加兼容性选项
const DB_CONFIG = {
    user: 'bosnds3',
    password: 'abc123',
    connectString: '49.235.20.50:8853/orcl',
    // 添加兼容性配置
    poolTimeout: 120,
    stmtCacheSize: 23,
    // 尝试强制使用旧版协议
    configDir: undefined
};

// 创建销售服务实例
const salesService = new SalesService(DB_CONFIG);

// 初始化Oracle连接池
async function initializeApp() {
    try {
        // 创建连接池 - 添加更多兼容性选项
        await oracledb.createPool({
            user: DB_CONFIG.user,
            password: DB_CONFIG.password,
            connectString: DB_CONFIG.connectString,
            poolMin: 1,
            poolMax: 10,
            poolIncrement: 1,
            poolTimeout: 120,
            stmtCacheSize: 23,
            // 添加连接超时
            connectTimeout: 60,
            // 强制使用特定的连接选项
            externalAuth: false
        });
        console.log('✓ Oracle连接池初始化成功');
    } catch (error) {
        console.error('❌ Oracle连接池初始化失败:', error.message);
        console.log('\n可能的解决方案:');
        console.log('1. 安装Oracle Instant Client 11.2');
        console.log('2. 设置环境变量 ORACLE_CLIENT_LIB_DIR');
        console.log('3. 或降级到node-oracledb@5.x版本');
    }
}

// 根路由
app.get('/', (req, res) => {
    res.json({ message: '三云零售系统后端API', status: 'running' });
});

// 销售概览接口
app.get('/api/sales/overview', async (req, res) => {
    try {
        const selectedDate = req.query.date;
        const analysisType = req.query.type || 'month';
        
        const data = await salesService.getSalesOverview(selectedDate, analysisType);
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `获取销售概览失败: ${error.message}`
        });
    }
});

// 店铺排行接口
app.get('/api/sales/stores', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const selectedDate = req.query.date;
        const analysisType = req.query.type || 'month';
        
        const data = await salesService.getTopStores(limit, selectedDate, analysisType);
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `获取店铺排行失败: ${error.message}`
        });
    }
});

// 销售指标接口
app.get('/api/sales/metrics', async (req, res) => {
    try {
        const selectedDate = req.query.date;
        const analysisType = req.query.type || 'month';
        
        const data = await salesService.getSalesMetrics(selectedDate, analysisType);
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `获取销售指标失败: ${error.message}`
        });
    }
});

// 测试数据库连接
app.get('/api/test/db', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(DB_CONFIG);
        const result = await connection.execute("SELECT COUNT(*) FROM m_retail WHERE billdate >= 20241201");
        const count = result.rows[0][0];
        
        res.json({
            success: true,
            message: '数据库连接成功',
            recent_records: count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `数据库连接失败: ${error.message}`
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 获取销售趋势数据
app.get('/api/sales/trend', async (req, res) => {
    try {
        const selectedDate = req.query.date;
        const analysisType = req.query.type || 'month';
        
        const trendData = await salesService.getSalesTrend(selectedDate, analysisType);
        res.json({
            success: true,
            data: trendData
        });
    } catch (error) {
        console.error(`获取销售趋势失败: ${error}`);
        res.status(500).json({
            success: false,
            message: `获取销售趋势失败: ${error.message}`
        });
    }
});

// 获取会员分析数据
app.get('/api/members/analysis', async (req, res) => {
    try {
        const selectedDate = req.query.date;
        const analysisType = req.query.type || 'month';
        
        const memberData = await salesService.getMemberAnalysis(selectedDate, analysisType);
        res.json({
            success: true,
            data: memberData
        });
    } catch (error) {
        console.error(`获取会员分析失败: ${error}`);
        res.status(500).json({
            success: false,
            message: `获取会员分析失败: ${error.message}`
        });
    }
});

// 获取详细销售指标
app.get('/api/sales/detailed-metrics', async (req, res) => {
    try {
        const date = req.query.date;
        const period = req.query.period || 'month';
        
        const detailedMetrics = await salesService.getDetailedMetrics(date, period);
        res.json({
            success: true,
            data: detailedMetrics
        });
    } catch (error) {
        console.error(`获取详细指标失败: ${error}`);
        res.status(500).json({
            success: false,
            message: `获取详细指标失败: ${error.message}`
        });
    }
});

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('正在关闭服务器...');
    try {
        await oracledb.getPool().close(0);
        console.log('Oracle连接池已关闭');
    } catch (error) {
        console.error('关闭连接池时出错:', error.message);
    }
    process.exit(0);
});

// 启动服务器
const PORT = process.env.PORT || 5000;

initializeApp().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
    });
});

module.exports = app; 