#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
查询数据库中最近新添加的10个会员信息 - 修正版本
使用正确的C_CLIENT_VIP表
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db_helper import DatabaseHelper
import pandas as pd
from datetime import datetime

def query_recent_members_correct():
    """查询最近新添加的10个会员信息 - 使用正确的C_CLIENT_VIP表"""
    # 创建数据库连接
    db = DatabaseHelper()
    
    # 连接数据库
    if not db.connect():
        print("❌ 数据库连接失败")
        return
    
    try:
        print("🔍 正在查询最近新添加的10个会员信息...")
        print("📋 使用C_CLIENT_VIP表进行查询\n")
        
        cursor = db.connection.cursor()
        
        # 首先检查C_CLIENT_VIP表是否存在
        check_table_sql = """
        SELECT COUNT(*) FROM user_tables 
        WHERE table_name = 'C_CLIENT_VIP'
        """
        cursor.execute(check_table_sql)
        table_exists = cursor.fetchone()[0] > 0
        
        if not table_exists:
            print("❌ C_CLIENT_VIP表不存在")
            return
        
        print("✅ 找到C_CLIENT_VIP表，开始查询最新会员信息...")
        
        # 查询C_CLIENT_VIP表中最近创建/修改的10个会员
        query_sql = """
        SELECT * FROM (
            SELECT 
                ID,
                NAME,
                VIPNAME,
                PHONE,
                MOBIL,
                ADDRESS,
                EMAIL,
                ISACTIVE,
                CREATEDATE,
                MODIFIERID,
                MODIFIEDDATE,
                VIPNO,
                CARDNO,
                INTEGRAL,
                VIPSTATE,
                ENTERDATE,
                BIRTHDAY,
                SEX,
                C_STORE_ID,
                C_CUSTOMER_ID
            FROM C_CLIENT_VIP 
            WHERE ISACTIVE = 'Y'
            ORDER BY 
                CASE WHEN CREATEDATE IS NOT NULL THEN CREATEDATE 
                     WHEN MODIFIEDDATE IS NOT NULL THEN MODIFIEDDATE 
                     ELSE TO_DATE('19700101', 'YYYYMMDD') END DESC,
                ID DESC
        ) WHERE ROWNUM <= 10
        """
        
        # 执行查询
        df = pd.read_sql(query_sql, db.connection)
        
        if df.empty:
            print("📭 没有找到会员记录")
        else:
            print(f"📊 查询到 {len(df)} 条最新会员记录：")
            print("=" * 80)
            
            # 格式化显示结果
            for idx, row in df.iterrows():
                # 确定显示的姓名
                display_name = row['VIPNAME'] if pd.notna(row['VIPNAME']) and row['VIPNAME'] else \
                              (row['NAME'] if pd.notna(row['NAME']) and row['NAME'] else '未填写')
                
                print(f"\n会员 #{idx + 1}: {display_name}")
                print(f"    🆔 ID: {row['ID']}")
                
                if pd.notna(row['CARDNO']) and row['CARDNO']:
                    print(f"    💳 卡号: {row['CARDNO']}")
                else:
                    print(f"    💳 卡号: 未分配")
                
                if pd.notna(row['MOBIL']) and row['MOBIL']:
                    print(f"    📱 手机: {row['MOBIL']}")
                elif pd.notna(row['PHONE']) and row['PHONE']:
                    print(f"    📱 电话: {row['PHONE']}")
                else:
                    print(f"    📱 联系方式: 未填写")
                
                integral_value = row['INTEGRAL'] if pd.notna(row['INTEGRAL']) else 0
                print(f"    💎 积分: {integral_value}")
                
                vip_status = '活跃' if row['ISACTIVE'] == 'Y' else '非活跃'
                if pd.notna(row['VIPSTATE']) and row['VIPSTATE']:
                    vip_status += f" ({row['VIPSTATE']})"
                print(f"    ⭐ VIP状态: {vip_status}")
                
                # 显示最后更新时间
                if pd.notna(row['MODIFIEDDATE']):
                    print(f"    📅 最后更新: {row['MODIFIEDDATE']}")
                elif pd.notna(row['CREATEDATE']):
                    print(f"    📅 创建时间: {row['CREATEDATE']}")
                
                # 显示其他信息
                if pd.notna(row['EMAIL']) and row['EMAIL']:
                    print(f"    📧 邮箱: {row['EMAIL']}")
                
                if pd.notna(row['ADDRESS']) and row['ADDRESS']:
                    print(f"    🏠 地址: {row['ADDRESS'][:50]}{'...' if len(str(row['ADDRESS'])) > 50 else ''}")
        
        cursor.close()
        
        # 保存查询结果到CSV文件
        if not df.empty:
            output_file = f"recent_members_correct_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            df.to_csv(output_file, index=False, encoding='utf-8-sig')
            print(f"\n💾 查询结果已保存到: {output_file}")
        
    except Exception as e:
        print(f"❌ 查询执行失败: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # 断开数据库连接
        db.disconnect()

def query_member_statistics():
    """查询会员统计信息"""
    db = DatabaseHelper()
    
    if not db.connect():
        print("❌ 数据库连接失败")
        return
    
    try:
        print("\n📈 会员统计信息:")
        cursor = db.connection.cursor()
        
        # 总会员数
        cursor.execute("""
            SELECT COUNT(*) as TOTAL_MEMBERS 
            FROM C_CLIENT_VIP 
            WHERE ISACTIVE = 'Y'
        """)
        total_count = cursor.fetchone()[0]
        print(f"  活跃会员总数: {total_count:,}")
        
        # 最近30天新增会员
        cursor.execute("""
            SELECT COUNT(*) as NEW_MEMBERS_30DAYS
            FROM C_CLIENT_VIP 
            WHERE ISACTIVE = 'Y'
            AND (CREATEDATE >= TRUNC(SYSDATE) - 30 OR MODIFIEDDATE >= TRUNC(SYSDATE) - 30)
        """)
        new_30days = cursor.fetchone()[0]
        print(f"  最近30天新增: {new_30days:,}")
        
        # 最近7天每日统计
        cursor.execute("""
            SELECT 
                TRUNC(COALESCE(CREATEDATE, MODIFIEDDATE)) as CREATE_DATE,
                COUNT(*) as DAILY_COUNT
            FROM C_CLIENT_VIP 
            WHERE ISACTIVE = 'Y'
            AND (CREATEDATE >= TRUNC(SYSDATE) - 7 OR MODIFIEDDATE >= TRUNC(SYSDATE) - 7)
            GROUP BY TRUNC(COALESCE(CREATEDATE, MODIFIEDDATE))
            ORDER BY CREATE_DATE DESC
        """)
        
        daily_stats = cursor.fetchall()
        if daily_stats:
            print("\n  最近7天每日新增:")
            for date_val, count in daily_stats:
                print(f"    {date_val.strftime('%Y-%m-%d')}: {count} 人")
        
        cursor.close()
        
    except Exception as e:
        print(f"❌ 统计查询失败: {e}")
    
    finally:
        db.disconnect()

def compare_table_structures():
    """对比CMS_USER和C_CLIENT_VIP表结构"""
    db = DatabaseHelper()
    
    if not db.connect():
        return
    
    try:
        print("\n🔍 表结构对比分析:")
        cursor = db.connection.cursor()
        
        # 检查两个表的存在性和记录数
        tables_info = []
        for table_name in ['CMS_USER', 'C_CLIENT_VIP']:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                tables_info.append((table_name, count, "存在"))
            except:
                tables_info.append((table_name, 0, "不存在"))
        
        for table_name, count, status in tables_info:
            print(f"  {table_name}: {status}")
            if status == "存在":
                print(f"    记录数: {count:,}")
        
        cursor.close()
        
    except Exception as e:
        print(f"❌ 表结构对比失败: {e}")
    
    finally:
        db.disconnect()

if __name__ == "__main__":
    print("🎯 数据库会员信息查询工具 - 修正版本")
    print("=" * 60)
    
    # 对比表结构
    compare_table_structures()
    
    print("\n" + "=" * 60)
    print("查询最近新添加的10个会员 (使用C_CLIENT_VIP表):")
    
    # 查询最新会员信息
    query_recent_members_correct()
    
    # 查询统计信息
    query_member_statistics()
    
    print("\n✅ 查询完成") 