#!/usr/bin/env node

const http = require('http');

console.log('\n=== 三云零售系统 API 测试 ===\n');

function testAPI(path, description) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET'
        };

        console.log(`测试: ${description}`);
        console.log(`URL: http://localhost:5000${path}`);

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    console.log(`✓ 响应状态: ${res.statusCode}`);
                    console.log(`✓ 响应数据:`, JSON.stringify(jsonData, null, 2));
                    console.log('---\n');
                    resolve(jsonData);
                } catch (error) {
                    console.log(`❌ JSON解析失败: ${error.message}`);
                    console.log(`原始响应: ${data}`);
                    console.log('---\n');
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.log(`❌ 请求失败: ${error.message}`);
            console.log('---\n');
            reject(error);
        });

        req.setTimeout(10000, () => {
            console.log(`❌ 请求超时`);
            console.log('---\n');
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function runTests() {
    const tests = [
        ['/', '服务状态检查'],
        ['/api/test/db', '数据库连接测试'],
        ['/api/sales/overview?date=2025-03-15&type=month', '销售概览 (2025年3月)'],
        ['/api/sales/stores?limit=5&date=2025-03-15&type=month', '店铺排行（前5名, 2025年3月）'],
        ['/api/sales/metrics?date=2025-03-15&type=month', '销售指标 (2025年3月)'],
        ['/api/sales/trend?date=2025-03-15&type=month', '销售趋势 (2025年3月)'],
        ['/api/members/analysis?date=2025-03-15&type=month', '会员分析 (2025年3月)'],
        ['/api/sales/detailed-metrics?date=2025-03-15&period=month', '详细指标 (2025年3月)']
    ];

    let successCount = 0;
    let failCount = 0;

    for (const [path, description] of tests) {
        try {
            await testAPI(path, description);
            successCount++;
        } catch (error) {
            failCount++;
        }
    }

    console.log(`\n=== 测试结果 ===`);
    console.log(`✓ 成功: ${successCount}个`);
    console.log(`❌ 失败: ${failCount}个`);
    console.log(`📊 成功率: ${((successCount / tests.length) * 100).toFixed(1)}%`);

    if (failCount > 0) {
        console.log('\n💡 如果有失败的测试，请检查:');
        console.log('1. 服务器是否正在运行 (npm start)');
        console.log('2. 数据库连接是否正常');
        console.log('3. Oracle客户端是否正确配置');
    }
}

runTests().catch(console.error); 