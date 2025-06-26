
const oracledb = require('oracledb');

// 配置Oracle兼容性
oracledb.outFormat = oracledb.OUT_FORMAT_ARRAY;

async function testConnection() {
    let connection;
    try {
        console.log('正在测试数据库连接...');
        
        const config = {
            user: 'bosnds3',
            password: 'abc123',
            connectString: '49.235.20.50:8853/orcl',
            connectTimeout: 60
        };
        
        connection = await oracledb.getConnection(config);
        console.log('✓ 数据库连接成功！');
        
        const result = await connection.execute('SELECT COUNT(*) FROM m_retail WHERE billdate >= 20241201');
        console.log(`✓ 查询成功，记录数: ${result.rows[0][0]}`);
        
    } catch (error) {
        console.error('❌ 连接失败:', error.message);
        
        if (error.message.includes('NJS-138')) {
            console.log('\n💡 解决方案:');
            console.log('1. 确保已安装Oracle Instant Client 11.2');
            console.log('2. 设置环境变量 ORACLE_CLIENT_LIB_DIR');
            console.log('3. 使用 start-with-oracle.bat 启动');
        }
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

testConnection();
