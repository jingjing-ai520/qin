#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库结构管理系统演示脚本
展示主要功能的使用方法
"""

from quick_db_browser import QuickBrowser
import json
from pathlib import Path


def demo_database_structure():
    """演示数据库结构浏览功能"""
    print("🚀 数据库结构管理系统演示")
    print("=" * 60)
    
    # 初始化浏览器
    browser = QuickBrowser()
    
    # 1. 显示所有数据库
    print("\n1️⃣ 显示所有数据库:")
    browser.list_databases()
    
    # 2. 显示bosnds3的模块
    print("\n2️⃣ 显示bosnds3数据库的模块:")
    browser.list_modules('bosnds3')
    
    # 3. 搜索客户相关表
    print("\n3️⃣ 搜索包含'customer'的表:")
    customer_tables = browser.search_tables('customer', 'bosnds3')
    
    # 4. 搜索日期相关字段
    print("\n4️⃣ 搜索包含'date'的字段 (显示前10个):")
    date_columns = browser.search_columns('date', 'bosnds3')
    if date_columns:
        for i, col in enumerate(date_columns[:10]):
            print(f"📋 {col['database']}.{col['table']}.{col['column']} ({col['type']})")
        if len(date_columns) > 10:
            print(f"... 还有 {len(date_columns) - 10} 个字段")
    
    # 5. 显示财务模块的表
    print("\n5️⃣ 显示财务模块的表 (前5个):")
    browser.show_module_tables('bosnds3', 'financial')
    
    # 6. 显示具体表的详细信息
    if customer_tables:
        first_table = customer_tables[0]['table']
        print(f"\n6️⃣ 显示表 {first_table} 的详细信息:")
        browser.show_table_info(first_table, 'bosnds3')


def show_statistics():
    """显示统计信息"""
    print("\n📊 数据库统计信息")
    print("=" * 50)
    
    structure_path = Path('database_structure')
    
    # 读取schemas信息
    schemas_dir = structure_path / 'schemas'
    for schema_file in schemas_dir.glob('*.json'):
        db_name = schema_file.stem.replace('_schema', '')
        
        with open(schema_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"\n🗄️  数据库: {db_name}")
        print(f"   总表数: {data['total_tables']}")
        
        # 显示模块统计
        categories = data['categories']
        sorted_categories = sorted(categories.items(), key=lambda x: len(x[1]), reverse=True)
        
        print("   模块分布:")
        for module, tables in sorted_categories[:5]:  # 显示前5个模块
            if tables:
                print(f"   📁 {module}: {len(tables)} 个表")
        
        # 显示字段数最多的表
        tables = data['tables']
        top_tables = sorted(tables.items(), key=lambda x: x[1]['column_count'], reverse=True)
        
        print("   字段最多的表:")
        for table_name, table_info in top_tables[:3]:
            print(f"   🗂️  {table_name}: {table_info['column_count']} 个字段")


def demo_search_examples():
    """演示搜索功能示例"""
    print("\n🔍 搜索功能演示")
    print("=" * 50)
    
    browser = QuickBrowser()
    
    # 常用搜索示例
    search_examples = [
        ('product', '产品相关表'),
        ('user', '用户相关表'),
        ('price', '价格相关表'),
        ('inventory', '库存相关表'),
        ('order', '订单相关表')
    ]
    
    for keyword, description in search_examples:
        print(f"\n🔎 搜索 '{keyword}' ({description}):")
        tables = browser.search_tables(keyword, 'bosnds3')
        if tables:
            print(f"   找到 {len(tables)} 个相关表")
            for table in tables[:3]:  # 显示前3个
                print(f"   📋 {table['table']} ({table['columns']} 列)")
            if len(tables) > 3:
                print(f"   ... 还有 {len(tables) - 3} 个表")
        else:
            print("   未找到相关表")


def show_file_structure():
    """显示生成的文件结构"""
    print("\n📁 生成的文件结构")
    print("=" * 50)
    
    structure_path = Path('database_structure')
    
    def show_dir_tree(path, prefix="", max_files=5):
        if not path.exists():
            return
            
        items = list(path.iterdir())
        dirs = [item for item in items if item.is_dir()]
        files = [item for item in items if item.is_file()]
        
        # 显示目录
        for i, dir_item in enumerate(dirs):
            is_last_dir = (i == len(dirs) - 1) and len(files) == 0
            print(f"{prefix}{'└── ' if is_last_dir else '├── '}📁 {dir_item.name}/")
            
            sub_prefix = prefix + ("    " if is_last_dir else "│   ")
            show_dir_tree(dir_item, sub_prefix, max_files)
        
        # 显示文件（限制数量）
        for i, file_item in enumerate(files):
            if i >= max_files:
                print(f"{prefix}├── ... 还有 {len(files) - max_files} 个文件")
                break
                
            is_last = (i == len(files) - 1)
            size_mb = file_item.stat().st_size / 1024 / 1024
            print(f"{prefix}{'└── ' if is_last else '├── '}📄 {file_item.name} ({size_mb:.1f}MB)")
    
    print(f"📂 {structure_path.name}/")
    show_dir_tree(structure_path)


def main():
    """主演示函数"""
    print("🎯 数据库结构管理系统 - 功能演示")
    print("=" * 70)
    
    # 检查是否已生成结构文件
    structure_path = Path('database_structure')
    if not structure_path.exists():
        print("⚠️  未找到数据库结构文件，请先运行 python db_structure_analyzer.py")
        return
    
    try:
        # 演示各种功能
        show_statistics()
        demo_database_structure()
        demo_search_examples()
        show_file_structure()
        
        print("\n✅ 演示完成！")
        print("\n💡 使用提示:")
        print("   - 运行 'python quick_db_browser.py' 启动交互模式")
        print("   - 运行 'python db_helper.py' 连接真实数据库")
        print("   - 查看 database_structure/ 目录中的详细文件")
        
    except Exception as e:
        print(f"❌ 演示过程中出错: {e}")


if __name__ == "__main__":
    main() 