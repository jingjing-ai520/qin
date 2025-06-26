#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
临时脚本：检查C_CLIENT_VIP表的日期字段
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db_helper import DatabaseHelper

def check_vip_table_structure():
    """检查C_CLIENT_VIP表结构"""
    db = DatabaseHelper()
    
    if not db.connect():
        print("❌ 数据库连接失败")
        return
    
    try:
        cursor = db.connection.cursor()
        
        # 查看表结构
        print("📋 C_CLIENT_VIP表的所有字段:")
        cursor.execute("""
            SELECT column_name, data_type, data_length 
            FROM user_tab_columns 
            WHERE table_name = 'C_CLIENT_VIP' 
            ORDER BY column_id
        """)
        columns = cursor.fetchall()
        
        date_fields = []
        for col_name, col_type, col_length in columns:
            print(f"  {col_name}: {col_type}({col_length})")
            if 'DATE' in col_type or 'DATE' in col_name.upper():
                date_fields.append(col_name)
        
        print(f"\n📅 发现的日期相关字段: {date_fields}")
        
        # 检查邹艳的记录
        print(f"\n🔍 检查卡号13887567079(邹艳)的记录:")
        cursor.execute("""
            SELECT ID, NAME, VIPNAME, CARDNO, CREATEDATE, MODIFIEDDATE, ENTERDATE 
            FROM C_CLIENT_VIP 
            WHERE CARDNO='13887567079'
        """)
        result = cursor.fetchone()
        
        if result:
            print(f"  ID: {result[0]}")
            print(f"  NAME: {result[1]}")
            print(f"  VIPNAME: {result[2]}")
            print(f"  CARDNO: {result[3]}")
            print(f"  CREATEDATE: {result[4]}")
            print(f"  MODIFIEDDATE: {result[5]}")
            print(f"  ENTERDATE: {result[6]}")
        else:
            print("  未找到该记录")
        
        # 查看几条最近的记录，比较不同日期字段
        print(f"\n📊 查看最近几条记录的日期字段对比:")
        cursor.execute("""
            SELECT ID, VIPNAME, CARDNO, CREATEDATE, MODIFIEDDATE, ENTERDATE 
            FROM C_CLIENT_VIP 
            WHERE ROWNUM <= 5
            ORDER BY ID DESC
        """)
        recent_records = cursor.fetchall()
        
        for record in recent_records:
            print(f"  ID {record[0]} ({record[1]}):")
            print(f"    CREATEDATE: {record[3]}")
            print(f"    MODIFIEDDATE: {record[4]}")
            print(f"    ENTERDATE: {record[5]}")
            print()
        
        cursor.close()
        
    except Exception as e:
        print(f"❌ 查询失败: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.disconnect()

if __name__ == "__main__":
    check_vip_table_structure() 