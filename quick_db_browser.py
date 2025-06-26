#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快速数据库浏览工具
提供简单的命令行界面来快速查找表和字段信息
"""

import json
import os
from pathlib import Path
from typing import List, Dict


class QuickBrowser:
    """快速浏览器"""
    
    def __init__(self):
        self.structure_path = Path('database_structure')
        self.load_structure()
    
    def load_structure(self):
        """加载数据库结构"""
        self.databases = {}
        
        # 加载数据库架构
        schemas_dir = self.structure_path / 'schemas'
        if schemas_dir.exists():
            for schema_file in schemas_dir.glob('*.json'):
                db_name = schema_file.stem.replace('_schema', '')
                try:
                    with open(schema_file, 'r', encoding='utf-8') as f:
                        self.databases[db_name] = json.load(f)
                except Exception as e:
                    print(f"加载 {schema_file} 失败: {e}")
    
    def list_databases(self):
        """列出所有数据库"""
        print("\n📚 可用数据库:")
        print("=" * 40)
        for db_name, db_info in self.databases.items():
            print(f"🗄️  {db_name}: {db_info['total_tables']} 个表")
    
    def list_modules(self, database: str):
        """列出数据库的模块"""
        if database not in self.databases:
            print(f"❌ 数据库 {database} 不存在")
            return
        
        print(f"\n📁 {database} 数据库的模块:")
        print("=" * 50)
        
        categories = self.databases[database]['categories']
        for module, tables in categories.items():
            if tables:
                print(f"📂 {module}: {len(tables)} 个表")
    
    def search_tables(self, keyword: str, database: str = None):
        """搜索表名"""
        print(f"\n🔍 搜索包含 '{keyword}' 的表:")
        print("=" * 60)
        
        found_tables = []
        
        target_dbs = [database] if database else self.databases.keys()
        
        for db_name in target_dbs:
            if db_name not in self.databases:
                continue
                
            tables = self.databases[db_name]['tables']
            for table_name, table_info in tables.items():
                if keyword.lower() in table_name.lower():
                    found_tables.append({
                        'database': db_name,
                        'table': table_name,
                        'schema': table_info['schema'],
                        'columns': table_info['column_count']
                    })
        
        if found_tables:
            for table in found_tables:
                print(f"🗂️  {table['database']}.{table['schema']}.{table['table']} ({table['columns']} 列)")
        else:
            print(f"❌ 未找到包含 '{keyword}' 的表")
        
        return found_tables
    
    def search_columns(self, keyword: str, database: str = None):
        """搜索字段名"""
        print(f"\n🔍 搜索包含 '{keyword}' 的字段:")
        print("=" * 60)
        
        found_columns = []
        
        target_dbs = [database] if database else self.databases.keys()
        
        for db_name in target_dbs:
            if db_name not in self.databases:
                continue
                
            tables = self.databases[db_name]['tables']
            for table_name, table_info in tables.items():
                for column in table_info['columns']:
                    if keyword.lower() in column['name'].lower():
                        found_columns.append({
                            'database': db_name,
                            'table': table_name,
                            'column': column['name'],
                            'type': column['type']
                        })
        
        if found_columns:
            for col in found_columns:
                print(f"📋 {col['database']}.{col['table']}.{col['column']} ({col['type']})")
        else:
            print(f"❌ 未找到包含 '{keyword}' 的字段")
        
        return found_columns
    
    def show_table_info(self, table_name: str, database: str = None):
        """显示表的详细信息"""
        # 如果没有指定数据库，在所有数据库中搜索
        target_dbs = [database] if database else self.databases.keys()
        
        found = False
        for db_name in target_dbs:
            if db_name not in self.databases:
                continue
                
            tables = self.databases[db_name]['tables']
            
            # 不区分大小写搜索表名
            matching_tables = {name: info for name, info in tables.items() 
                             if name.lower() == table_name.lower()}
            
            if matching_tables:
                found = True
                table_name_actual, table_info = list(matching_tables.items())[0]
                
                print(f"\n🗂️  表名: {table_info['schema']}.{table_name_actual}")
                print(f"📊 数据库: {db_name}")
                print(f"📈 字段数: {table_info['column_count']}")
                
                print(f"\n📋 字段列表:")
                print("-" * 70)
                print(f"{'字段名':<25} {'类型':<20} {'定义':<25}")
                print("-" * 70)
                
                for col in table_info['columns']:
                    print(f"{col['name']:<25} {col['type']:<20} {col['definition'][:25]:<25}")
                break
        
        if not found:
            print(f"❌ 未找到表 '{table_name}'")
    
    def show_module_tables(self, database: str, module: str):
        """显示模块中的表"""
        module_file = self.structure_path / 'tables_by_module' / database / f"{module}.json"
        
        if not module_file.exists():
            print(f"❌ 模块文件不存在: {module}")
            return
        
        try:
            with open(module_file, 'r', encoding='utf-8') as f:
                module_data = json.load(f)
            
            print(f"\n📁 {module} 模块 ({module_data['table_count']} 个表)")
            print("=" * 60)
            
            for table_name, table_info in module_data['tables'].items():
                print(f"🗂️  {table_name} ({table_info['column_count']} 列)")
                # 显示前几个主要字段
                main_fields = [col['name'] for col in table_info['columns'][:3]]
                print(f"    主要字段: {', '.join(main_fields)}...")
                print()
                
        except Exception as e:
            print(f"❌ 读取模块文件失败: {e}")


def interactive_mode():
    """交互模式"""
    browser = QuickBrowser()
    
    print("🚀 快速数据库浏览器")
    print("=" * 50)
    
    while True:
        print("\n💡 可用命令:")
        print("  1. list - 列出所有数据库")
        print("  2. modules <database> - 列出数据库模块")
        print("  3. search table <keyword> [database] - 搜索表")
        print("  4. search column <keyword> [database] - 搜索字段")
        print("  5. show table <table_name> [database] - 显示表详情")
        print("  6. show module <database> <module> - 显示模块表")
        print("  7. quit - 退出")
        
        try:
            command = input("\n➤ 请输入命令: ").strip()
            
            if command == "quit":
                print("👋 再见！")
                break
            elif command == "list":
                browser.list_databases()
            elif command.startswith("modules "):
                parts = command.split()
                if len(parts) >= 2:
                    browser.list_modules(parts[1])
                else:
                    print("❌ 请指定数据库名称")
            elif command.startswith("search table "):
                parts = command.split()
                if len(parts) >= 3:
                    keyword = parts[2]
                    database = parts[3] if len(parts) > 3 else None
                    browser.search_tables(keyword, database)
                else:
                    print("❌ 请提供搜索关键词")
            elif command.startswith("search column "):
                parts = command.split()
                if len(parts) >= 3:
                    keyword = parts[2]
                    database = parts[3] if len(parts) > 3 else None
                    browser.search_columns(keyword, database)
                else:
                    print("❌ 请提供搜索关键词")
            elif command.startswith("show table "):
                parts = command.split()
                if len(parts) >= 3:
                    table_name = parts[2]
                    database = parts[3] if len(parts) > 3 else None
                    browser.show_table_info(table_name, database)
                else:
                    print("❌ 请提供表名")
            elif command.startswith("show module "):
                parts = command.split()
                if len(parts) >= 4:
                    database = parts[2]
                    module = parts[3]
                    browser.show_module_tables(database, module)
                else:
                    print("❌ 请提供数据库名和模块名")
            else:
                print("❌ 未知命令")
                
        except KeyboardInterrupt:
            print("\n👋 再见！")
            break
        except Exception as e:
            print(f"❌ 执行命令时出错: {e}")


if __name__ == "__main__":
    # 检查是否已生成数据库结构
    structure_path = Path('database_structure')
    if not structure_path.exists() or not list(structure_path.glob('schemas/*.json')):
        print("🔄 未找到数据库结构，正在生成...")
        import db_structure_analyzer
        db_structure_analyzer.analyze_databases()
    
    interactive_mode() 