#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Oracle客户端安装和配置工具
解决cx_Oracle连接问题
"""

import os
import sys
import urllib.request
import zipfile
from pathlib import Path
import subprocess


class OracleClientInstaller:
    """Oracle客户端安装器"""
    
    def __init__(self):
        self.base_dir = Path("oracle_client")
        self.instant_client_version = "21_13"
        self.download_base_url = "https://download.oracle.com/otn_software/nt/instantclient/2113000"
        
    def check_system_info(self):
        """检查系统信息"""
        print("🔍 检查系统信息...")
        print(f"操作系统: {os.name}")
        print(f"Python版本: {sys.version}")
        print(f"Python位数: {64 if sys.maxsize > 2**32 else 32}位")
        print(f"当前目录: {os.getcwd()}")
        
        # 检查是否已安装cx_Oracle
        try:
            import cx_Oracle
            print(f"✅ cx_Oracle已安装，版本: {cx_Oracle.__version__}")
        except ImportError:
            print("❌ cx_Oracle未安装")
            
        return True
    
    def download_instant_client(self, force_download=False):
        """下载Oracle Instant Client"""
        print("\n📥 下载Oracle Instant Client...")
        
        # 创建下载目录
        self.base_dir.mkdir(exist_ok=True)
        
        # 确定下载文件
        if sys.maxsize > 2**32:  # 64位系统
            filename = f"instantclient-basic-windows.x64-{self.instant_client_version}.0.0.0dbru.zip"
        else:  # 32位系统
            filename = f"instantclient-basic-nt-{self.instant_client_version}.0.0.0dbru.zip"
            
        file_path = self.base_dir / filename
        
        if file_path.exists() and not force_download:
            print(f"✅ 文件已存在: {file_path}")
            return file_path
        
        print("ℹ️  由于Oracle许可限制，无法自动下载Instant Client")
        print("请手动下载Oracle Instant Client:")
        print(f"📎 下载地址: https://www.oracle.com/database/technologies/instant-client/downloads.html")
        print(f"📁 下载后请将文件放置到: {file_path}")
        
        return None
    
    def extract_instant_client(self, zip_path):
        """解压Instant Client"""
        if not zip_path or not zip_path.exists():
            return None
            
        print(f"\n📦 解压 {zip_path.name}...")
        
        extract_dir = self.base_dir / "instantclient"
        extract_dir.mkdir(exist_ok=True)
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
            
            # 查找实际的instantclient目录
            client_dirs = list(extract_dir.glob("instantclient*"))
            if client_dirs:
                actual_client_dir = client_dirs[0]
                print(f"✅ 解压完成: {actual_client_dir}")
                return actual_client_dir
            else:
                print("❌ 未找到instantclient目录")
                return None
                
        except Exception as e:
            print(f"❌ 解压失败: {e}")
            return None
    
    def configure_environment(self, client_dir):
        """配置环境变量"""
        if not client_dir or not client_dir.exists():
            return False
            
        print(f"\n⚙️  配置环境变量...")
        
        # 将client_dir添加到PATH
        current_path = os.environ.get('PATH', '')
        client_path = str(client_dir.absolute())
        
        if client_path not in current_path:
            os.environ['PATH'] = f"{client_path};{current_path}"
            print(f"✅ 已添加到PATH: {client_path}")
        
        # 设置其他必要环境变量
        os.environ['ORACLE_HOME'] = client_path
        
        return True
    
    def test_connection(self):
        """测试数据库连接"""
        print("\n🧪 测试数据库连接...")
        
        try:
            import cx_Oracle
            print(f"✅ cx_Oracle导入成功，版本: {cx_Oracle.__version__}")
            
            # 测试连接字符串
            dsn = cx_Oracle.makedsn('49.235.20.50', 8853, service_name='orcl')
            print(f"✅ DSN创建成功: {dsn}")
            
            # 这里不实际连接，避免密码问题
            print("ℹ️  连接字符串格式正确，可以尝试实际连接")
            return True
            
        except Exception as e:
            print(f"❌ 连接测试失败: {e}")
            return False
    
    def create_batch_script(self):
        """创建启动脚本"""
        print("\n📝 创建启动脚本...")
        
        client_dir = self.base_dir / "instantclient"
        client_dirs = list(client_dir.glob("instantclient*"))
        
        if not client_dirs:
            print("❌ 未找到instantclient目录")
            return
            
        actual_client_dir = client_dirs[0]
        
        # 创建批处理脚本
        bat_content = f"""@echo off
echo 设置Oracle环境变量...
set ORACLE_HOME={actual_client_dir.absolute()}
set PATH=%ORACLE_HOME%;%PATH%

echo 启动Python数据库工具...
python db_helper.py
pause
"""
        
        with open("start_db_tools.bat", "w", encoding="gbk") as f:
            f.write(bat_content)
        
        print("✅ 创建启动脚本: start_db_tools.bat")
    
    def install(self):
        """完整安装流程"""
        print("🚀 Oracle客户端安装向导")
        print("=" * 50)
        
        # 1. 检查系统
        self.check_system_info()
        
        # 2. 下载客户端
        zip_path = self.download_instant_client()
        
        if not zip_path:
            print("\n📋 手动安装步骤:")
            print("1. 访问: https://www.oracle.com/database/technologies/instant-client/downloads.html")
            print("2. 下载适合您系统的Basic包")
            print("3. 将下载的zip文件放到 oracle_client/ 目录")
            print("4. 重新运行此脚本")
            return False
        
        # 3. 解压客户端
        client_dir = self.extract_instant_client(zip_path)
        
        if not client_dir:
            return False
        
        # 4. 配置环境
        if not self.configure_environment(client_dir):
            return False
        
        # 5. 测试连接
        success = self.test_connection()
        
        # 6. 创建启动脚本
        self.create_batch_script()
        
        if success:
            print("\n🎉 安装完成！")
            print("💡 使用方法:")
            print("   - 双击 start_db_tools.bat 启动工具")
            print("   - 或运行: python db_helper.py")
        else:
            print("\n⚠️  安装完成但连接测试失败")
            print("请检查网络连接和数据库配置")
        
        return success


def alternative_solution():
    """提供替代解决方案"""
    print("\n🔧 替代解决方案")
    print("=" * 40)
    
    print("\n方案1: 使用轻量级数据库客户端")
    print("- 安装 oracledb (新版本，无需客户端库)")
    print("- 命令: pip install oracledb")
    
    print("\n方案2: 仅使用离线功能")
    print("- 数据库结构分析(已完成)")
    print("- 快速查询工具(离线模式)")
    
    print("\n方案3: 手动下载Oracle客户端")
    print("- 下载地址: https://www.oracle.com/database/technologies/instant-client/downloads.html")
    print("- 选择Basic包(Windows x64)")
    print("- 解压后添加到系统PATH")


if __name__ == "__main__":
    installer = OracleClientInstaller()
    
    print("选择操作:")
    print("1. 自动安装向导")
    print("2. 查看替代方案") 
    print("3. 仅测试当前环境")
    
    try:
        choice = input("\n请选择 (1-3): ").strip()
        
        if choice == "1":
            installer.install()
        elif choice == "2":
            alternative_solution()
        elif choice == "3":
            installer.check_system_info()
            installer.test_connection()
        else:
            print("无效选择")
            
    except KeyboardInterrupt:
        print("\n\n👋 取消操作")
    except Exception as e:
        print(f"\n❌ 操作失败: {e}") 