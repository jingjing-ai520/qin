#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n=== 三云零售系统后端API - Node.js版本 ===\n');

// 检查Node.js版本
const nodeVersion = process.version;
console.log(`✓ Node.js版本: ${nodeVersion}`);

// 检查是否存在node_modules
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log('\n⚠️  检测到未安装依赖，正在自动安装...');
    try {
        execSync('npm install', { stdio: 'inherit', cwd: __dirname });
        console.log('✓ 依赖安装完成');
    } catch (error) {
        console.error('❌ 依赖安装失败:', error.message);
        process.exit(1);
    }
}

// 检查Oracle客户端
console.log('\n检查Oracle数据库客户端...');
try {
    require('oracledb');
    console.log('✓ Oracle数据库驱动正常');
} catch (error) {
    console.error('❌ Oracle数据库驱动加载失败:', error.message);
    console.log('\n请确保已安装Oracle Instant Client:');
    console.log('1. 下载Oracle Instant Client');
    console.log('2. 配置环境变量');
    console.log('3. 重新启动应用');
    process.exit(1);
}

// 显示配置信息
console.log('\n=== 数据库配置 ===');
console.log('主机: 49.235.20.50');
console.log('端口: 8853');
console.log('服务名: orcl');
console.log('用户名: bosnds3');

console.log('\n=== API接口列表 ===');
console.log('• GET  /                          - 服务状态');
console.log('• GET  /api/test/db               - 数据库测试');
console.log('• GET  /api/sales/overview        - 销售概览');
console.log('• GET  /api/sales/stores          - 店铺排行');
console.log('• GET  /api/sales/metrics         - 销售指标');
console.log('• GET  /api/sales/trend           - 销售趋势');
console.log('• GET  /api/members/analysis      - 会员分析');
console.log('• GET  /api/sales/detailed-metrics - 详细指标');

console.log('\n=== 启动服务器 ===');
console.log('服务器将在 http://localhost:5000 启动\n');

// 启动应用
try {
    require('./app.js');
} catch (error) {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
} 