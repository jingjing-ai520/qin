#!/usr/bin/env node

const oracledb = require('oracledb');

// 配置Oracle兼容性
oracledb.outFormat = oracledb.OUT_FORMAT_ARRAY;

const DB_CONFIG = {
    user: 'bosnds3',
    password: 'abc123',
    connectString: '49.235.20.50:8853/orcl',
    connectTimeout: 60
};

async function debugDatabase() {
    let connection;
    try {
        console.log('🔍 正在调试数据库数据...\n');
        
        connection = await oracledb.getConnection(DB_CONFIG);
        console.log('✓ 数据库连接成功\n');
        
        // 1. 检查m_retail表的基本信息
        console.log('=== 1. 检查m_retail表结构 ===');
        const tableInfoQuery = `
            SELECT column_name, data_type, data_length, nullable
            FROM user_tab_columns 
            WHERE table_name = 'M_RETAIL'
            ORDER BY column_id
        `;
        const tableInfo = await connection.execute(tableInfoQuery);
        console.log('表结构:');
        for (const row of tableInfo.rows) {
            console.log(`  ${row[0]} (${row[1]}) - ${row[3] === 'Y' ? '可空' : '非空'}`);
        }
        
        // 2. 检查总记录数
        console.log('\n=== 2. 检查总记录数 ===');
        const totalCountQuery = `SELECT COUNT(*) FROM m_retail`;
        const totalResult = await connection.execute(totalCountQuery);
        console.log(`总记录数: ${totalResult.rows[0][0]}`);
        
        // 3. 检查日期格式和范围
        console.log('\n=== 3. 检查日期格式和范围 ===');
        const dateRangeQuery = `
            SELECT 
                MIN(billdate) as min_date,
                MAX(billdate) as max_date,
                COUNT(DISTINCT billdate) as unique_dates
            FROM m_retail
            WHERE billdate IS NOT NULL
        `;
        const dateRangeResult = await connection.execute(dateRangeQuery);
        const minDate = dateRangeResult.rows[0][0];
        const maxDate = dateRangeResult.rows[0][1];
        const uniqueDates = dateRangeResult.rows[0][2];
        
        console.log(`最小日期: ${minDate}`);
        console.log(`最大日期: ${maxDate}`);
        console.log(`不同日期数: ${uniqueDates}`);
        
        // 4. 检查最近的日期数据
        console.log('\n=== 4. 检查最近的日期数据 ===');
        const recentDatesQuery = `
            SELECT * FROM (
                SELECT billdate, COUNT(*) as record_count, 
                       SUM(NVL(tot_amt_actual, 0)) as total_sales
                FROM m_retail 
                WHERE billdate >= 20250301
                GROUP BY billdate
                ORDER BY billdate DESC
            ) WHERE ROWNUM <= 10
        `;
        const recentDatesResult = await connection.execute(recentDatesQuery);
        if (recentDatesResult.rows.length > 0) {
            console.log('最近日期的数据:');
            recentDatesResult.rows.forEach(row => {
                console.log(`  日期: ${row[0]}, 记录数: ${row[1]}, 销售额: ${row[2]}`);
            });
        } else {
            console.log('没有找到2025年3月的数据');
        }
        
        // 5. 检查2025年3月的数据
        console.log('\n=== 5. 检查2025年3月整月数据 ===');
        const marchQuery = `
            SELECT 
                COUNT(*) as record_count,
                SUM(NVL(tot_amt_actual, 0)) as total_sales,
                AVG(NVL(tot_amt_actual, 0)) as avg_sales,
                MIN(billdate) as first_date,
                MAX(billdate) as last_date
            FROM m_retail 
            WHERE billdate >= 20250301 AND billdate <= 20250331
        `;
        const marchResult = await connection.execute(marchQuery);
        if (marchResult.rows.length > 0) {
            const row = marchResult.rows[0];
            console.log(`记录数: ${row[0]}`);
            console.log(`总销售额: ${row[1]}`);
            console.log(`平均销售额: ${row[2]}`);
            console.log(`第一个日期: ${row[3]}`);
            console.log(`最后日期: ${row[4]}`);
        }
        
        // 6. 检查会员字段
        console.log('\n=== 6. 检查会员相关字段 ===');
        const vipFieldQuery = `
            SELECT 
                COUNT(*) as total_records,
                COUNT(CASE WHEN c_vip_id IS NOT NULL AND c_vip_id != 0 THEN 1 END) as vip_records,
                COUNT(CASE WHEN c_customer_id IS NOT NULL AND c_customer_id != 0 THEN 1 END) as customer_records
            FROM m_retail 
            WHERE billdate >= 20250301 AND billdate <= 20250331
        `;
        const vipFieldResult = await connection.execute(vipFieldQuery);
        if (vipFieldResult.rows.length > 0) {
            const row = vipFieldResult.rows[0];
            console.log(`总记录数: ${row[0]}`);
            console.log(`VIP记录数: ${row[1]}`);
            console.log(`客户记录数: ${row[2]}`);
        }
        
    } catch (error) {
        console.error('❌ 调试失败:', error.message);
        if (error.errorNum) {
            console.log('Help: https://docs.oracle.com/error-help/db/ora-' + String(error.errorNum).padStart(5, '0') + '/');
        }
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

debugDatabase(); 