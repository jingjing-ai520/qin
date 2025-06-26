#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
查询数据库中最近新添加的10个会员信息
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db_helper import DatabaseHelper
import pandas as pd

def query_recent_members():
    """查询最近新添加的10个会员信息"""
    # 创建数据库连接
    db = DatabaseHelper()
    
    # 连接数据库
    if not db.connect():
        print("❌ 数据库连接失败")
        return
    
    try:
        print("🔍 正在查询最近新添加的10个会员信息...")
        
        # 根据项目中的表结构，查找会员相关的表
        # 1. 首先查看是否存在C_VIP表（主要的VIP会员表）
        cursor = db.connection.cursor()
        
        # 检查C_VIP表是否存在 - 修正SQL语句
        check_table_sql = """
        SELECT COUNT(*) FROM user_tables 
        WHERE table_name = 'C_VIP'
        """
        cursor.execute(check_table_sql)
        table_exists = cursor.fetchone()[0] > 0
        
        if table_exists:
            print("✅ 找到C_VIP表，正在查询最新会员信息...")
            
            # 查询C_VIP表中最近创建的10个会员
            # 假设有创建时间字段，如果没有则使用ID排序
            query_sql = """
            SELECT * FROM (
                SELECT 
                    id,
                    cardno,
                    vipname,
                    vipename,
                    sex,
                    birthday,
                    phone,
                    mobil,
                    email,
                    address,
                    enterdate,
                    creationdate,
                    modifieddate,
                    vipstate,
                    c_store_id,
                    c_customer_id
                FROM C_VIP
                WHERE vipstate = 'Y' 
                ORDER BY NVL(creationdate, TO_DATE('19700101', 'YYYYMMDD')) DESC, id DESC
            ) WHERE ROWNUM <= 10
            """
            
        else:
            print("⚠️  C_VIP表不存在，尝试查找其他会员表...")
            
            # 查找其他可能的会员表 - 修正SQL语句
            find_member_tables_sql = """
            SELECT table_name 
            FROM user_tables 
            WHERE (UPPER(table_name) LIKE '%VIP%' 
                OR UPPER(table_name) LIKE '%MEMBER%' 
                OR UPPER(table_name) LIKE '%USER%')
            ORDER BY table_name
            """
            cursor.execute(find_member_tables_sql)
            member_tables = [row[0] for row in cursor.fetchall()]
            
            print(f"📋 找到的会员相关表: {', '.join(member_tables)}")
            
            # 尝试查询CMS_USER表（从JSON中看到的用户表）
            if 'CMS_USER' in member_tables:
                print("✅ 使用CMS_USER表查询会员信息...")
                query_sql = """
                SELECT * FROM (
                    SELECT 
                        id,
                        sn as user_sn,
                        user_name,
                        name,
                        mobile,
                        address,
                        sex,
                        create_date,
                        modify_date,
                        login_date,
                        is_enabled,
                        c_vip_id,
                        cardno
                    FROM CMS_USER
                    WHERE is_enabled = 1
                    ORDER BY create_date DESC, id DESC
                ) WHERE ROWNUM <= 10
                """
            else:
                print("❌ 未找到合适的会员表")
                return
        
        # 执行查询
        df = pd.read_sql(query_sql, db.connection)
        
        if df.empty:
            print("📭 没有找到会员记录")
        else:
            print(f"📊 查询到 {len(df)} 条最新会员记录：")
            print("=" * 80)
            
            # 格式化显示结果
            for idx, row in df.iterrows():
                print(f"\n会员 #{idx + 1}:")
                print("-" * 40)
                for col in df.columns:
                    value = row[col]
                    if pd.isna(value):
                        value = "无"
                    elif isinstance(value, str) and len(value) > 50:
                        value = value[:50] + "..."
                    print(f"  {col}: {value}")
        
        cursor.close()
        
    except Exception as e:
        print(f"❌ 查询执行失败: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # 断开数据库连接
        db.disconnect()

def query_member_table_structure():
    """查询会员相关表的结构"""
    db = DatabaseHelper()
    
    if not db.connect():
        print("❌ 数据库连接失败")
        return
    
    try:
        cursor = db.connection.cursor()
        
        # 查找所有包含VIP、MEMBER、USER的表 - 修正SQL语句
        sql = """
        SELECT table_name, num_rows, last_analyzed
        FROM user_tables 
        WHERE (UPPER(table_name) LIKE '%VIP%' 
            OR UPPER(table_name) LIKE '%MEMBER%' 
            OR UPPER(table_name) LIKE '%USER%')
        ORDER BY table_name
        """
        
        cursor.execute(sql)
        tables = cursor.fetchall()
        
        print("📋 会员相关表信息:")
        print("=" * 60)
        for table_name, num_rows, last_analyzed in tables:
            print(f"表名: {table_name}")
            print(f"  行数: {num_rows if num_rows else '未知'}")
            print(f"  最后分析: {last_analyzed if last_analyzed else '未知'}")
            print()
        
        cursor.close()
        
    except Exception as e:
        print(f"❌ 查询失败: {e}")
    
    finally:
        db.disconnect()

if __name__ == "__main__":
    print("🎯 数据库会员信息查询工具")
    print("=" * 50)
    
    # 首先查看表结构
    print("1. 查询会员相关表结构:")
    query_member_table_structure()
    
    print("\n" + "=" * 50)
    print("2. 查询最近新添加的10个会员:")
    
    # 查询最新会员信息
    query_recent_members()
    
    print("\n✅ 查询完成") 