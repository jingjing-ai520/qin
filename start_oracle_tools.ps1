# Oracle数据库工具启动脚本
# 自动配置Oracle环境变量

Write-Host "🚀 配置Oracle环境..." -ForegroundColor Green

# 设置Oracle环境变量
$env:ORACLE_HOME = "E:\software\instantclient_23_8"
$env:PATH = "E:\software\instantclient_23_8;$env:PATH"

Write-Host "✅ Oracle环境已配置" -ForegroundColor Green
Write-Host "ORACLE_HOME: $env:ORACLE_HOME" -ForegroundColor Yellow

Write-Host "`n🎯 可用的数据库工具:" -ForegroundColor Cyan
Write-Host "1. python db_helper.py          # 完整数据库工具"
Write-Host "2. python quick_db_browser.py   # 快速查询工具"
Write-Host "3. python demo.py               # 功能演示"
Write-Host "4. python db_helper_simple.py   # 简化工具"

Write-Host "`n💡 提示: 现在可以直接运行Python数据库工具了!" -ForegroundColor Green 