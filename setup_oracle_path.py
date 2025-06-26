#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Oracle客户端路径配置助手
帮助配置已下载的Oracle Instant Client
"""

import os
import sys
from pathlib import Path
import subprocess


def find_oracle_client():
    """查找Oracle客户端文件夹"""
    print("🔍 查找Oracle Instant Client...")
    
    # 常见的安装位置
    search_paths = [
        Path.cwd(),  # 当前目录
        Path.cwd() / "oracle_client",
        Path("C:/oracle"),
        Path("C:/instantclient"),
        Path("D:/oracle"),
        Path("E:/oracle"),
    ]
    
    found_clients = []
    
    for search_path in search_paths:
        if search_path.exists():
            # 查找instantclient目录
            for item in search_path.rglob("instantclient*"):
                if item.is_dir():
                    # 检查是否包含必要的DLL文件
                    oci_dll = item / "oci.dll"
                    if oci_dll.exists():
                        found_clients.append(item)
                        print(f"✅ 找到: {item}")
    
    if not found_clients:
        print("❌ 未找到Oracle Instant Client")
        print("\n💡 请确保您已将解压的文件夹放在以下位置之一:")
        for path in search_paths:
            print(f"   - {path}")
    
    return found_clients


def check_client_files(client_path):
    """检查客户端文件完整性"""
    print(f"\n📋 检查 {client_path} 的文件...")
    
    required_files = [
        "oci.dll",
        "oraociei23.dll",  # 可能是其他版本号
        "orannzsbb23.dll"
    ]
    
    existing_files = []
    missing_files = []
    
    for file_name in required_files:
        file_path = client_path / file_name
        if file_path.exists():
            existing_files.append(file_name)
        else:
            # 检查其他版本号的文件
            pattern = file_name.replace("23", "*")
            matching_files = list(client_path.glob(pattern))
            if matching_files:
                existing_files.append(str(matching_files[0].name))
            else:
                missing_files.append(file_name)
    
    print(f"✅ 找到文件: {existing_files}")
    if missing_files:
        print(f"⚠️  缺少文件: {missing_files}")
    
    # 列出所有DLL文件
    dll_files = list(client_path.glob("*.dll"))
    print(f"📁 共找到 {len(dll_files)} 个DLL文件")
    
    return len(existing_files) > 0


def add_to_path_temporarily(client_path):
    """临时添加到PATH（仅当前Python会话）"""
    print(f"\n⚙️  临时添加到PATH: {client_path}")
    
    current_path = os.environ.get('PATH', '')
    client_path_str = str(client_path.absolute())
    
    if client_path_str not in current_path:
        os.environ['PATH'] = f"{client_path_str};{current_path}"
        print("✅ 已临时添加到PATH")
        return True
    else:
        print("ℹ️  路径已存在")
        return True


def test_oracle_connection():
    """测试Oracle连接"""
    print("\n🧪 测试Oracle连接...")
    
    try:
        import cx_Oracle
        print(f"✅ cx_Oracle导入成功，版本: {cx_Oracle.__version__}")
        
        # 测试连接字符串创建
        dsn = cx_Oracle.makedsn('49.235.20.50', 8853, service_name='orcl')
        print(f"✅ DSN创建成功: {dsn}")
        
        print("🎉 Oracle客户端配置成功！")
        return True
        
    except ImportError:
        print("❌ cx_Oracle未安装，请运行: pip install cx_Oracle")
        return False
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        print("可能的原因:")
        print("- DLL文件版本不匹配")
        print("- 缺少必要的DLL文件")
        print("- PATH配置不正确")
        return False


def create_permanent_setup():
    """创建永久配置脚本"""
    print("\n📝 创建永久配置...")
    
    # 查找客户端
    clients = find_oracle_client()
    if not clients:
        return False
    
    client_path = clients[0]  # 使用第一个找到的
    
    # 创建批处理脚本
    bat_content = f"""@echo off
echo 设置Oracle环境变量...
set ORACLE_HOME={client_path.absolute()}
set PATH=%ORACLE_HOME%;%PATH%

echo Oracle环境已配置
echo ORACLE_HOME=%ORACLE_HOME%

echo 启动Python...
python
"""
    
    with open("start_with_oracle.bat", "w", encoding="gbk") as f:
        f.write(bat_content)
    
    # 创建PowerShell脚本
    ps_content = f"""# 设置Oracle环境变量
$env:ORACLE_HOME = "{client_path.absolute()}"
$env:PATH = "$env:ORACLE_HOME;$env:PATH"

Write-Host "Oracle环境已配置" -ForegroundColor Green
Write-Host "ORACLE_HOME=$env:ORACLE_HOME" -ForegroundColor Yellow

# 启动Python
python
"""
    
    with open("start_with_oracle.ps1", "w", encoding="utf-8") as f:
        f.write(ps_content)
    
    print("✅ 创建启动脚本:")
    print("   - start_with_oracle.bat (命令提示符)")
    print("   - start_with_oracle.ps1 (PowerShell)")
    
    return True


def show_manual_steps(client_path):
    """显示手动配置步骤"""
    print(f"\n📋 手动配置PATH步骤:")
    print("=" * 50)
    print("1. 右键点击 '此电脑' → '属性'")
    print("2. 点击 '高级系统设置'")
    print("3. 点击 '环境变量'")
    print("4. 在 '系统变量' 中找到 'Path'")
    print("5. 点击 '编辑'")
    print("6. 点击 '新建'")
    print(f"7. 添加路径: {client_path.absolute()}")
    print("8. 确定所有对话框")
    print("9. 重启命令提示符/PowerShell")


def main():
    """主函数"""
    print("🚀 Oracle Instant Client 配置助手")
    print("=" * 50)
    
    # 1. 查找客户端
    clients = find_oracle_client()
    
    if not clients:
        print("\n❌ 未找到Oracle客户端")
        print("请确保您已将 instantclient_23_8 文件夹放在当前目录或其子目录中")
        return
    
    # 选择客户端（如果有多个）
    if len(clients) > 1:
        print(f"\n发现多个客户端，选择第一个: {clients[0]}")
    
    client_path = clients[0]
    
    # 2. 检查文件
    if not check_client_files(client_path):
        print("❌ 客户端文件不完整")
        return
    
    # 3. 临时配置
    add_to_path_temporarily(client_path)
    
    # 4. 测试连接
    if test_oracle_connection():
        print("\n🎉 配置成功！")
        
        # 5. 创建永久配置
        print("\n选择配置方式:")
        print("1. 创建启动脚本（推荐）")
        print("2. 查看手动配置步骤")
        print("3. 跳过")
        
        try:
            choice = input("\n请选择 (1-3): ").strip()
            
            if choice == "1":
                create_permanent_setup()
            elif choice == "2":
                show_manual_steps(client_path)
                
        except KeyboardInterrupt:
            pass
    else:
        print("\n❌ 配置失败")
        show_manual_steps(client_path)


if __name__ == "__main__":
    main() 