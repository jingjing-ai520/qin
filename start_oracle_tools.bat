@echo off
echo 🚀 配置Oracle环境...
echo.

REM 设置Oracle环境变量
set ORACLE_HOME=E:\software\instantclient_23_8
set PATH=E:\software\instantclient_23_8;%PATH%

echo ✅ Oracle环境已配置
echo ORACLE_HOME=%ORACLE_HOME%
echo.

echo 🎯 可用的数据库工具:
echo 1. python db_helper.py          # 完整数据库工具
echo 2. python quick_db_browser.py   # 快速查询工具  
echo 3. python demo.py               # 功能演示
echo 4. python db_helper_simple.py   # 简化工具
echo.

echo 💡 提示: 现在可以直接运行Python数据库工具了!
echo.

REM 保持窗口打开
cmd /k 