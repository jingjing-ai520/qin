// 测试折线图功能的脚本
const http = require('http');

function testAPI(path, description) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET'
        };

        console.log(`\n=== 测试 ${description} ===`);
        console.log(`请求路径: ${path}`);

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.success) {
                        console.log('✓ API调用成功');
                        
                        if (path.includes('trend')) {
                            const trendData = response.data;
                            console.log(`日均销售额: ¥${trendData.daily_average_sales.toLocaleString()}`);
                            console.log(`周销售额: ¥${trendData.weekly_sales.toLocaleString()} (环比 ${trendData.weekly_growth_rate}%)`);
                            console.log(`月销售额: ¥${trendData.monthly_sales.toLocaleString()}`);
                            
                            // 显示折线图数据
                            if (trendData.chart_data) {
                                console.log('\n📊 折线图数据:');
                                console.log(`数据点数量: ${trendData.chart_data.dates.length}`);
                                console.log(`日期范围: ${trendData.chart_data.dates[0]} 到 ${trendData.chart_data.dates[trendData.chart_data.dates.length - 1]}`);
                                console.log(`所选日期: ${trendData.chart_data.selected_date}`);
                                
                                // 显示前几个数据点作为示例
                                console.log('\n前5个数据点:');
                                for (let i = 0; i < Math.min(5, trendData.chart_data.dates.length); i++) {
                                    console.log(`  ${trendData.chart_data.dates[i]}: ¥${trendData.chart_data.sales[i].toLocaleString()}`);
                                }
                                
                                if (trendData.chart_data.dates.length > 5) {
                                    console.log('  ...');
                                    const last = trendData.chart_data.dates.length - 1;
                                    console.log(`  ${trendData.chart_data.dates[last]}: ¥${trendData.chart_data.sales[last].toLocaleString()}`);
                                }
                            } else {
                                console.log('⚠️ 缺少折线图数据');
                            }
                        } else {
                            console.log(`返回数据包含 ${Array.isArray(response.data) ? response.data.length : '未知数量'} 项`);
                        }
                    } else {
                        console.log('✗ API调用失败:', response.message);
                    }
                    resolve();
                } catch (error) {
                    console.log('✗ 解析响应失败:', error.message);
                    resolve();
                }
            });
        });

        req.on('error', (error) => {
            console.log('✗ 请求失败:', error.message);
            resolve();
        });

        req.end();
    });
}

async function runTests() {
    console.log('🚀 测试折线图功能的后端API...\n');
    
    // 测试不同日期的销售趋势
    await testAPI('/api/sales/trend?type=day&date=2024-12-20', '销售趋势（今天-1天）');
    await testAPI('/api/sales/trend?type=day&date=2024-12-10', '销售趋势（今天-11天）');
    await testAPI('/api/sales/trend?type=day&date=2024-12-01', '销售趋势（今天-20天）');
    
    // 测试月度趋势
    await testAPI('/api/sales/trend?type=month&date=2024-12-01', '销售趋势（月度模式）');
    
    console.log('\n=== 测试完成 ===');
    console.log('\n✨ 新增功能说明:');
    console.log('1. 📈 折线图数据：每个API响应现在包含chart_data字段');
    console.log('2. 🎯 智能日期范围：根据所选日期到当天的距离自动调整显示范围');
    console.log('3. 📊 31天数据：通常显示前15天+后15天，特殊情况自动调整');
    console.log('4. 🔍 选中日期标记：图表中会高亮显示所选日期');
    console.log('\n前端使用说明:');
    console.log('- chart_data.dates: 日期数组（格式: MM-DD）');
    console.log('- chart_data.sales: 对应的销售额数组');
    console.log('- chart_data.selected_date: 所选日期（用于高亮显示）');
}

runTests().catch(console.error); 