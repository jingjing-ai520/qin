#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化版数据库连接工具
使用新版oracledb库，无需Oracle Instant Client
"""

try:
    import oracledb
    USE_NEW_DRIVER = True
    print("✅ 使用新版oracledb库")
except ImportError:
    try:
        import cx_Oracle as oracledb
        USE_NEW_DRIVER = False
        print("⚠️  使用旧版cx_Oracle库")
    except ImportError:
        print("❌ 未安装Oracle数据库库")
        print("请运行: pip install oracledb")
        exit(1)

import pandas as pd
from typing import Dict, List
import json
from pathlib import Path


class SimpleDatabaseHelper:
    """简化版数据库助手"""
    
    def __init__(self):
        self.config = {
            'username': 'bosnds3',
            'password': 'abc123',
            'hostname': '49.235.20.50',
            'port': 8853,
            'service_name': 'orcl'
        }
        self.connection = None
    
    def connect(self, username: str = None) -> bool:
        """连接数据库"""
        try:
            if username:
                self.config['username'] = username
            
            print(f"🔗 正在连接到 {self.config['hostname']}:{self.config['port']}/{self.config['service_name']}")
            
            if USE_NEW_DRIVER:
                # 使用新版oracledb库
                connection_string = f"{self.config['username']}/{self.config['password']}@{self.config['hostname']}:{self.config['port']}/{self.config['service_name']}"
                self.connection = oracledb.connect(connection_string)
            else:
                # 使用旧版cx_Oracle库
                dsn = oracledb.makedsn(
                    self.config['hostname'], 
                    self.config['port'], 
                    service_name=self.config['service_name']
                )
                self.connection = oracledb.connect(
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
    
    def execute_query(self, sql: str, params: Dict = None) -> pd.DataFrame:
        """执行查询"""
        if not self.connection:
            print("❌ 请先连接数据库")
            return pd.DataFrame()
        
        try:
            if params:
                df = pd.read_sql(sql, self.connection, params=params)
            else:
                df = pd.read_sql(sql, self.connection)
            print(f"📊 查询返回 {len(df)} 行数据")
            return df
        except Exception as e:
            print(f"❌ 查询失败: {e}")
            return pd.DataFrame()
    
    def get_table_list(self, schema: str = None) -> List[str]:
        """获取表列表"""
        schema = schema or self.config['username'].upper()
        sql = "SELECT table_name FROM all_tables WHERE owner = :schema ORDER BY table_name"
        
        try:
            df = self.execute_query(sql, {'schema': schema})
            tables = df['TABLE_NAME'].tolist() if not df.empty else []
            print(f"📋 找到 {len(tables)} 个表")
            return tables
        except Exception as e:
            print(f"❌ 获取表列表失败: {e}")
            return []
    
    def describe_table(self, table_name: str, schema: str = None) -> pd.DataFrame:
        """描述表结构"""
        schema = schema or self.config['username'].upper()
        sql = """
        SELECT 
            column_name as "字段名",
            data_type as "数据类型",
            data_length as "长度",
            nullable as "可空",
            data_default as "默认值"
        FROM all_tab_columns 
        WHERE owner = :schema AND table_name = :table_name
        ORDER BY column_id
        """
        
        try:
            df = self.execute_query(sql, {'schema': schema, 'table_name': table_name.upper()})
            if not df.empty:
                print(f"🗂️  表 {table_name} 有 {len(df)} 个字段")
            return df
        except Exception as e:
            print(f"❌ 获取表结构失败: {e}")
            return pd.DataFrame()
    
    def get_sample_data(self, table_name: str, limit: int = 5, schema: str = None) -> pd.DataFrame:
        """获取样本数据"""
        schema = schema or self.config['username'].upper()
        sql = f"SELECT * FROM {schema}.{table_name} WHERE ROWNUM <= {limit}"
        
        try:
            df = self.execute_query(sql)
            return df
        except Exception as e:
            print(f"❌ 获取样本数据失败: {e}")
            return pd.DataFrame()


def test_connection():
    """测试连接功能"""
    print("🧪 测试数据库连接功能")
    print("=" * 50)
    
    db = SimpleDatabaseHelper()
    
    # 测试连接
    if not db.connect('bosnds3'):
        print("❌ 连接失败，请检查网络和数据库配置")
        return False
    
    try:
        # 测试查询表列表
        print("\n📋 获取表列表...")
        tables = db.get_table_list()
        if tables:
            print(f"前10个表: {tables[:10]}")
        
        # 测试查询表结构
        if tables:
            first_table = tables[0]
            print(f"\n🗂️  查询表 {first_table} 的结构...")
            structure = db.describe_table(first_table)
            if not structure.empty:
                print(structure.head())
            
            # 测试获取样本数据
            print(f"\n📋 获取表 {first_table} 的样本数据...")
            sample = db.get_sample_data(first_table, 3)
            if not sample.empty:
                print(sample)
        
        print("\n✅ 所有测试通过！")
        return True
        
    except Exception as e:
        print(f"❌ 测试过程中出错: {e}")
        return False
    
    finally:
        db.disconnect()


def show_usage():
    """显示使用方法"""
    print("\n💡 使用方法:")
    print("=" * 40)
    
    print("\n1. 安装新版oracledb库:")
    print("   pip install oracledb")
    
    print("\n2. 基本使用:")
    print("""
from db_helper_simple import SimpleDatabaseHelper

# 创建连接
db = SimpleDatabaseHelper()
db.connect('bosnds3')

# 获取表列表
tables = db.get_table_list()

# 查看表结构
structure = db.describe_table('FA_CUSTOMER_FTP')

# 获取样本数据
data = db.get_sample_data('FA_CUSTOMER_FTP', 10)

# 断开连接
db.disconnect()
""")


if __name__ == "__main__":
    print("🚀 简化版数据库连接工具")
    print("=" * 50)
    
    if USE_NEW_DRIVER:
        print("✅ 使用新版oracledb库，无需Oracle客户端")
    else:
        print("⚠️  使用cx_Oracle库，需要Oracle客户端")
    
    print("\n选择操作:")
    print("1. 测试数据库连接")
    print("2. 查看使用方法")
    print("3. 退出")
    
    try:
        choice = input("\n请选择 (1-3): ").strip()
        
        if choice == "1":
            test_connection()
        elif choice == "2":
            show_usage()
        elif choice == "3":
            print("👋 再见！")
        else:
            print("❌ 无效选择")
            
    except KeyboardInterrupt:
        print("\n👋 再见！")
    except Exception as e:
        print(f"❌ 操作失败: {e}") 