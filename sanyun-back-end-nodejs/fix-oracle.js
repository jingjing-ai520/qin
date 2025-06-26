#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n=== Oracle 11g 兼容性修复脚本 ===\n');

async function fixOracleCompatibility() {
    try {
        console.log('🔧 正在修复Oracle数据库兼容性问题...\n');
        
        // 步骤1：检查当前oracledb版本
        console.log('1. 检查当前node-oracledb版本...');
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const currentVersion = packageJson.dependencies.oracledb;
            console.log(`   当前版本: ${currentVersion}`);
            
            if (currentVersion.includes('6.')) {
                console.log('   ⚠️  检测到oracledb 6.x版本，可能与Oracle 11g不兼容');
                console.log('   📝 建议使用5.x版本以获得更好的兼容性');
            }
        } catch (error) {
            console.log('   ❌ 无法读取package.json');
        }
        
        // 步骤2：卸载现有版本并安装兼容版本
        console.log('\n2. 安装兼容Oracle 11g的oracledb版本...');
        try {
            console.log('   正在卸载当前版本...');
            execSync('npm uninstall oracledb', { stdio: 'pipe' });
            
            console.log('   正在安装oracledb@5.5.0...');
            execSync('npm install oracledb@5.5.0', { stdio: 'inherit' });
            
            console.log('   ✓ 成功安装兼容版本');
        } catch (error) {
            console.log('   ❌ 安装失败:', error.message);
        }
        
        // 步骤3：检查Oracle客户端
        console.log('\n3. 检查Oracle客户端配置...');
        const possiblePaths = [
            'E:\\oracle\\instantclient_11_2',
            'C:\\oracle\\instantclient_11_2',
            'D:\\oracle\\instantclient_11_2',
            '/usr/lib/oracle/11.2/client64/lib',
            '/opt/oracle/instantclient_11_2'
        ];
        
        let clientFound = false;
        for (const clientPath of possiblePaths) {
            if (fs.existsSync(clientPath)) {
                console.log(`   ✓ 找到Oracle客户端: ${clientPath}`);
                clientFound = true;
                
                // 创建环境变量设置脚本
                const envScript = `set ORACLE_CLIENT_LIB_DIR=${clientPath}\nnode app.js`;
                fs.writeFileSync('start-with-oracle.bat', envScript);
                console.log(`   ✓ 已创建启动脚本: start-with-oracle.bat`);
                break;
            }
        }
        
        if (!clientFound) {
            console.log('   ⚠️  未找到Oracle Instant Client');
            console.log('   📥 请下载并安装Oracle Instant Client 11.2:');
            console.log('      https://www.oracle.com/database/technologies/instant-client/downloads.html');
        }
        
        // 步骤4：创建测试脚本
        console.log('\n4. 创建数据库连接测试脚本...');
        const testScript = `
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
        console.log(\`✓ 查询成功，记录数: \${result.rows[0][0]}\`);
        
    } catch (error) {
        console.error('❌ 连接失败:', error.message);
        
        if (error.message.includes('NJS-138')) {
            console.log('\\n💡 解决方案:');
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
`;
        
        fs.writeFileSync('test-db-connection.js', testScript);
        console.log('   ✓ 已创建测试脚本: test-db-connection.js');
        
        // 步骤5：提供使用说明
        console.log('\n=== 修复完成 ===');
        console.log('\n📋 后续步骤:');
        console.log('1. 运行数据库连接测试:');
        console.log('   node test-db-connection.js');
        console.log('');
        console.log('2. 如果测试成功，启动应用:');
        if (clientFound) {
            console.log('   start-with-oracle.bat  (Windows)');
            console.log('   或');
        }
        console.log('   npm start');
        console.log('');
        console.log('3. 如果仍有问题，请确保:');
        console.log('   - 已安装Oracle Instant Client 11.2');
        console.log('   - 网络能正常访问数据库服务器');
        console.log('   - 数据库服务正常运行');
        
    } catch (error) {
        console.error('❌ 修复过程中出现错误:', error.message);
    }
}

fixOracleCompatibility(); 