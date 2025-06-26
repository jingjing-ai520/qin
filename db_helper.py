#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库辅助工具
用于连接数据库、查询表结构和执行常用操作
"""

import cx_Oracle
import json
import pandas as pd
from typing import Dict, List, Optional
from pathlib import Path


class DatabaseHelper:
    """数据库辅助类"""
    
    def __init__(self):
        # 数据库连接配置
        self.config = {
            'username': 'bosnds3',
            'password': 'abc123',
            'hostname': '49.235.20.50',
            'port': 8853,
            'service_name': 'orcl'
        }
        self.connection = None
        self.structure_cache = {}
        
    def connect(self, username: str = None) -> bool:
        """连接数据库"""
        try:
            if username:
                self.config['username'] = username
                
            dsn = cx_Oracle.makedsn(
                self.config['hostname'], 
                self.config['port'], 
                service_name=self.config['service_name']
            )
            
            self.connection = cx_Oracle.connect(
                user=self.config['username'],
                password=self.config['password'],
                dsn=dsn
            )
            
            print(f"✅ 成功连接到数据库 {self.config['username']}")
            return True
            
        except Exception as e:
            print(f"❌ 数据库连接失败: {e}")
            return False
    
    def disconnect(self):
        """断开数据库连接"""
        if self.connection:
            self.connection.close()
            print("🔌 数据库连接已断开")
    
    def get_table_list(self, schema: str = None) -> List[str]:
        """获取表列表"""
        if not self.connection:
            print("❌ 请先连接数据库")
            return []
        
        try:
            schema = schema or self.config['username'].upper()
            cursor = self.connection.cursor()
            
            sql = """
            SELECT table_name 
            FROM all_tables 
            WHERE owner = :schema 
            ORDER BY table_name
            """
            
            cursor.execute(sql, {'schema': schema})
            tables = [row[0] for row in cursor.fetchall()]
            cursor.close()
            
            print(f"📋 找到 {len(tables)} 个表")
            return tables
            
        except Exception as e:
            print(f"❌ 获取表列表失败: {e}")
            return []
    
    def describe_table(self, table_name: str, schema: str = None) -> Dict:
        """描述表结构"""
        if not self.connection:
            print("❌ 请先连接数据库")
            return {}
        
        try:
            schema = schema or self.config['username'].upper()
            table_key = f"{schema}.{table_name.upper()}"
            
            # 检查缓存
            if table_key in self.structure_cache:
                return self.structure_cache[table_key]
            
            cursor = self.connection.cursor()
            
            # 获取列信息
            sql = """
            SELECT 
                column_name,
                data_type,
                data_length,
                data_precision,
                data_scale,
                nullable,
                data_default,
                column_id
            FROM all_tab_columns 
            WHERE owner = :schema AND table_name = :table_name
            ORDER BY column_id
            """
            
            cursor.execute(sql, {'schema': schema, 'table_name': table_name.upper()})
            columns = []
            
            for row in cursor.fetchall():
                column_info = {
                    'name': row[0],
                    'type': row[1],
                    'length': row[2],
                    'precision': row[3],
                    'scale': row[4],
                    'nullable': row[5] == 'Y',
                    'default': row[6],
                    'position': row[7]
                }
                columns.append(column_info)
            
            # 获取主键信息
            pk_sql = """
            SELECT column_name
            FROM all_cons_columns cc
            JOIN all_constraints c ON cc.constraint_name = c.constraint_name
            WHERE c.owner = :schema 
              AND c.table_name = :table_name 
              AND c.constraint_type = 'P'
            ORDER BY cc.position
            """
            
            cursor.execute(pk_sql, {'schema': schema, 'table_name': table_name.upper()})
            primary_keys = [row[0] for row in cursor.fetchall()]
            
            # 获取索引信息
            idx_sql = """
            SELECT DISTINCT index_name, index_type, uniqueness
            FROM all_indexes
            WHERE owner = :schema AND table_name = :table_name
            """
            
            cursor.execute(idx_sql, {'schema': schema, 'table_name': table_name.upper()})
            indexes = [{'name': row[0], 'type': row[1], 'unique': row[2] == 'UNIQUE'} 
                      for row in cursor.fetchall()]
            
            cursor.close()
            
            # 构建结果
            result = {
                'schema': schema,
                'table_name': table_name.upper(),
                'columns': columns,
                'primary_keys': primary_keys,
                'indexes': indexes,
                'column_count': len(columns)
            }
            
            # 缓存结果
            self.structure_cache[table_key] = result
            
            return result
            
        except Exception as e:
            print(f"❌ 获取表结构失败: {e}")
            return {}
    
    def search_tables_by_keyword(self, keyword: str, schema: str = None) -> List[str]:
        """根据关键词搜索表"""
        tables = self.get_table_list(schema)
        return [table for table in tables if keyword.upper() in table.upper()]
    
    def search_columns_by_keyword(self, keyword: str, schema: str = None) -> List[Dict]:
        """根据关键词搜索列"""
        if not self.connection:
            print("❌ 请先连接数据库")
            return []
        
        try:
            schema = schema or self.config['username'].upper()
            cursor = self.connection.cursor()
            
            sql = """
            SELECT table_name, column_name, data_type
            FROM all_tab_columns
            WHERE owner = :schema 
              AND UPPER(column_name) LIKE UPPER(:keyword)
            ORDER BY table_name, column_name
            """
            
            cursor.execute(sql, {'schema': schema, 'keyword': f'%{keyword}%'})
            results = []
            
            for row in cursor.fetchall():
                results.append({
                    'table': row[0],
                    'column': row[1],
                    'type': row[2]
                })
            
            cursor.close()
            return results
            
        except Exception as e:
            print(f"❌ 搜索列失败: {e}")
            return []
    
    def execute_query(self, sql: str, params: Dict = None) -> pd.DataFrame:
        """执行查询并返回DataFrame"""
        if not self.connection:
            print("❌ 请先连接数据库")
            return pd.DataFrame()
        
        try:
            df = pd.read_sql(sql, self.connection, params=params)
            print(f"📊 查询返回 {len(df)} 行数据")
            return df
            
        except Exception as e:
            print(f"❌ 查询执行失败: {e}")
            return pd.DataFrame()
    
    def get_table_sample(self, table_name: str, limit: int = 5, schema: str = None) -> pd.DataFrame:
        """获取表的样本数据"""
        schema = schema or self.config['username'].upper()
        sql = f"SELECT * FROM {schema}.{table_name} WHERE ROWNUM <= {limit}"
        return self.execute_query(sql)
    
    def get_table_row_count(self, table_name: str, schema: str = None) -> int:
        """获取表的行数"""
        schema = schema or self.config['username'].upper()
        sql = f"SELECT COUNT(*) as row_count FROM {schema}.{table_name}"
        df = self.execute_query(sql)
        return df.iloc[0]['ROW_COUNT'] if not df.empty else 0


class TableBrowser:
    """表浏览器 - 提供友好的表结构浏览界面"""
    
    def __init__(self, db_helper: DatabaseHelper):
        self.db = db_helper
        self.structure_path = Path('database_structure')
    
    def browse_by_module(self, database: str, module: str = None):
        """按模块浏览表"""
        module_path = self.structure_path / 'tables_by_module' / database
        
        if not module_path.exists():
            print(f"❌ 模块路径不存在: {module_path}")
            return
        
        if module:
            # 显示特定模块的表
            module_file = module_path / f"{module}.json"
            if module_file.exists():
                with open(module_file, 'r', encoding='utf-8') as f:
                    module_data = json.load(f)
                    
                print(f"\n📁 {module} 模块 ({module_data['table_count']} 个表)")
                print("=" * 50)
                
                for table_name, table_info in module_data['tables'].items():
                    print(f"\n🗂️  表名: {table_name}")
                    print(f"   架构: {table_info['schema']}")
                    print(f"   列数: {table_info['column_count']}")
                    print(f"   字段: {', '.join([col['name'] for col in table_info['columns'][:5]])}", end="")
                    if table_info['column_count'] > 5:
                        print(f" ... (共{table_info['column_count']}个字段)")
                    else:
                        print()
            else:
                print(f"❌ 模块文件不存在: {module_file}")
        else:
            # 列出所有模块
            print(f"\n📂 {database} 数据库的模块:")
            print("=" * 40)
            
            for module_file in module_path.glob("*.json"):
                module_name = module_file.stem
                with open(module_file, 'r', encoding='utf-8') as f:
                    module_data = json.load(f)
                    
                print(f"📁 {module_name}: {module_data['table_count']} 个表")
    
    def show_table_details(self, table_name: str, schema: str = None):
        """显示表的详细信息"""
        table_info = self.db.describe_table(table_name, schema)
        
        if not table_info:
            return
        
        print(f"\n🗂️  表名: {table_info['table_name']}")
        print(f"📊 架构: {table_info['schema']}")
        print(f"📈 列数: {table_info['column_count']}")
        
        if table_info['primary_keys']:
            print(f"🔑 主键: {', '.join(table_info['primary_keys'])}")
        
        print(f"📑 索引数: {len(table_info['indexes'])}")
        
        print("\n📋 字段详情:")
        print("-" * 80)
        print(f"{'字段名':<20} {'类型':<15} {'长度':<8} {'可空':<6} {'默认值':<15}")
        print("-" * 80)
        
        for col in table_info['columns']:
            null_str = "是" if col['nullable'] else "否"
            length_str = str(col['length']) if col['length'] else ""
            default_str = str(col['default'])[:15] if col['default'] else ""
            
            print(f"{col['name']:<20} {col['type']:<15} {length_str:<8} {null_str:<6} {default_str:<15}")
        
        # 显示样本数据
        print(f"\n📋 样本数据 (前5行):")
        sample_df = self.db.get_table_sample(table_name, 5, schema)
        if not sample_df.empty:
            print(sample_df.to_string(index=False))
        else:
            print("无数据或查询失败")


def main():
    """主函数 - 演示用法"""
    print("🚀 数据库辅助工具启动...")
    
    # 首先运行结构分析
    print("\n1️⃣ 运行数据库结构分析...")
    import db_structure_analyzer
    db_structure_analyzer.analyze_databases()
    
    # 连接数据库
    print("\n2️⃣ 连接数据库...")
    db = DatabaseHelper()
    
    if db.connect('bosnds3'):
        # 创建表浏览器
        browser = TableBrowser(db)
        
        print("\n3️⃣ 浏览数据库结构...")
        
        # 按模块浏览
        browser.browse_by_module('bosnds3')
        
        print("\n" + "="*60)
        print("💡 使用示例:")
        print("   browser.browse_by_module('bosnds3', 'financial')  # 查看财务模块")
        print("   browser.show_table_details('FA_CUSTOMER_FTP')     # 查看表详情")
        print("   db.search_tables_by_keyword('customer')           # 搜索包含customer的表")
        print("   db.search_columns_by_keyword('date')              # 搜索包含date的字段")
        
        db.disconnect()


if __name__ == "__main__":
    main() 