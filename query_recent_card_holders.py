#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
查询最近开卡的会员信息
- 查询最近开卡的10个人
- 如果开卡日期相同，则全部显示
- 按手机号码降序排列
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db_helper import DatabaseHelper
import pandas as pd
from datetime import datetime

def query_recent_card_holders():
    """查询最近开卡的会员信息"""
    # 创建数据库连接
    db = DatabaseHelper()
    
    # 连接数据库
    if not db.connect():
        print("❌ 数据库连接失败")
        return
    
    try:
        print("🔍 正在查询最近开卡的会员信息...")
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
        
        print("✅ 找到C_CLIENT_VIP表，开始查询最近开卡会员...")
        
        # 第一步：找到最近开卡的第10个人的开卡日期
        # 查询最近开卡的10个人，按开卡时间和手机号排序
        # 注意：ENTERDATE是数字格式YYYYMMDD，需要转换为日期格式
        top10_query_sql = """
        SELECT * FROM (
            SELECT 
                TO_DATE(TO_CHAR(ENTERDATE), 'YYYYMMDD') as CARD_DATE,
                COALESCE(MOBIL, PHONE, '0') as SORT_PHONE,
                ENTERDATE as ORIGINAL_ENTERDATE
            FROM C_CLIENT_VIP 
            WHERE ISACTIVE = 'Y'
                AND ENTERDATE IS NOT NULL
                AND ENTERDATE > 19700101
            ORDER BY 
                ENTERDATE DESC,
                SORT_PHONE DESC
        ) WHERE ROWNUM <= 10
        """
        
        # 执行查询获取前10个人
        top10_df = pd.read_sql(top10_query_sql, db.connection)
        
        if top10_df.empty:
            print("📭 没有找到开卡记录")
            return
        
        # 获取第10个人的开卡日期（如果不足10人则取最后一个）
        target_date = top10_df.iloc[-1]['CARD_DATE']
        target_enterdate = int(top10_df.iloc[-1]['ORIGINAL_ENTERDATE'])  # 转换为Python int
        print(f"📅 第10个人的开卡日期：{target_date.strftime('%Y-%m-%d')} (ENTERDATE: {target_enterdate})")
        print(f"📅 将显示该日期及之后的所有开卡会员")
        
        # 第二步：查询该日期及之后的所有会员，按手机号码降序排列
        main_query_sql = """
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
            C_CUSTOMER_ID,
            TO_DATE(TO_CHAR(ENTERDATE), 'YYYYMMDD') as CARD_DATE,
            COALESCE(MOBIL, PHONE, '0') as SORT_PHONE
        FROM C_CLIENT_VIP 
        WHERE ISACTIVE = 'Y'
            AND ENTERDATE IS NOT NULL
            AND ENTERDATE >= :target_enterdate
        ORDER BY 
            ENTERDATE DESC,
            SORT_PHONE DESC,
            ID DESC
        """
        
        # 执行主查询
        df = pd.read_sql(main_query_sql, db.connection, params={'target_enterdate': target_enterdate})
        
        if df.empty:
            print("📭 没有找到会员记录")
        else:
            print(f"📊 查询到 {len(df)} 条最近开卡记录：")
            print("=" * 80)
            
            # 按日期分组显示
            current_date = None
            date_count = 0
            
            for idx, row in df.iterrows():
                card_date = row['CARD_DATE']
                
                # 如果是新的日期，显示日期标题
                if current_date != card_date:
                    if current_date is not None:
                        print(f"\n{'='*50}")
                    current_date = card_date
                    date_count += 1
                    date_members = df[df['CARD_DATE'] == card_date]
                    print(f"\n📅 {card_date.strftime('%Y年%m月%d日')} 开卡会员 ({len(date_members)}人):")
                    print("-" * 50)
                
                # 确定显示的姓名
                display_name = row['VIPNAME'] if pd.notna(row['VIPNAME']) and row['VIPNAME'] else \
                              (row['NAME'] if pd.notna(row['NAME']) and row['NAME'] else '未填写')
                
                # 获取手机号码用于排序显示
                mobile_num = row['MOBIL'] if pd.notna(row['MOBIL']) and row['MOBIL'] else \
                           (row['PHONE'] if pd.notna(row['PHONE']) and row['PHONE'] else '未填写')
                
                print(f"\n  👤 {display_name}")
                print(f"     🆔 ID: {row['ID']}")
                
                if pd.notna(row['CARDNO']) and row['CARDNO']:
                    print(f"     💳 卡号: {row['CARDNO']}")
                
                print(f"     📱 手机: {mobile_num}")
                
                integral_value = row['INTEGRAL'] if pd.notna(row['INTEGRAL']) else 0
                print(f"     💎 积分: {integral_value}")
                
                vip_status = '活跃' if row['ISACTIVE'] == 'Y' else '非活跃'
                if pd.notna(row['VIPSTATE']) and row['VIPSTATE']:
                    vip_status += f" ({row['VIPSTATE']})"
                print(f"     ⭐ VIP状态: {vip_status}")
                
                # 显示开卡时间（使用ENTERDATE）
                if pd.notna(row['ENTERDATE']):
                    # ENTERDATE是数字格式YYYYMMDD，转换为可读日期
                    enterdate_str = str(int(row['ENTERDATE']))
                    if len(enterdate_str) == 8:
                        formatted_date = f"{enterdate_str[:4]}-{enterdate_str[4:6]}-{enterdate_str[6:8]}"
                        print(f"     🕐 开卡日期: {formatted_date}")
                    else:
                        print(f"     🕐 开卡日期: {row['ENTERDATE']}")
                
                # 显示最后修改时间（如果有的话）
                if pd.notna(row['MODIFIEDDATE']):
                    print(f"     🔄 最后修改: {row['MODIFIEDDATE']}")
                
                # 显示其他信息
                if pd.notna(row['EMAIL']) and row['EMAIL']:
                    print(f"     📧 邮箱: {row['EMAIL']}")
                
                if pd.notna(row['ADDRESS']) and row['ADDRESS']:
                    address_display = str(row['ADDRESS'])[:40] + ('...' if len(str(row['ADDRESS'])) > 40 else '')
                    print(f"     🏠 地址: {address_display}")
        
        cursor.close()
        
        # 生成统计信息
        if not df.empty:
            print(f"\n📊 统计信息:")
            print(f"   • 查询到的日期数: {df['CARD_DATE'].nunique()}")
            print(f"   • 总会员数: {len(df)}")
            
            # 按日期统计
            date_stats = df.groupby('CARD_DATE').size().sort_index(ascending=False)
            print(f"   • 各日期开卡人数:")
            for date, count in date_stats.items():
                print(f"     {date.strftime('%Y-%m-%d')}: {count}人")
            
            # 手机号码排序验证
            print(f"\n📱 手机号码排序验证 (每个日期内前3个):")
            for date in date_stats.index:
                date_data = df[df['CARD_DATE'] == date].head(3)
                print(f"   {date.strftime('%Y-%m-%d')}:")
                for _, member in date_data.iterrows():
                    mobile = member['MOBIL'] if pd.notna(member['MOBIL']) else \
                           (member['PHONE'] if pd.notna(member['PHONE']) else '无')
                    name = member['VIPNAME'] if pd.notna(member['VIPNAME']) else \
                          (member['NAME'] if pd.notna(member['NAME']) else '未知')
                    print(f"     {mobile} - {name}")
        
        # 保存查询结果到CSV文件
        if not df.empty:
            output_file = f"recent_card_holders_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            # 重新排列列的顺序，方便查看
            columns_order = ['CARD_DATE', 'ID', 'VIPNAME', 'NAME', 'MOBIL', 'PHONE', 'CARDNO', 
                           'INTEGRAL', 'VIPSTATE', 'CREATEDATE', 'MODIFIEDDATE', 'EMAIL', 'ADDRESS']
            df_output = df.reindex(columns=[col for col in columns_order if col in df.columns])
            df_output.to_csv(output_file, index=False, encoding='utf-8-sig')
            print(f"\n💾 查询结果已保存到: {output_file}")
        
    except Exception as e:
        print(f"❌ 查询执行失败: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # 断开数据库连接
        db.disconnect()

def query_card_opening_trends():
    """查询开卡趋势统计"""
    db = DatabaseHelper()
    
    if not db.connect():
        print("❌ 数据库连接失败")
        return
    
    try:
        print("\n📈 开卡趋势分析:")
        cursor = db.connection.cursor()
        
        # 最近30天开卡统计
        cursor.execute("""
            SELECT 
                TRUNC(COALESCE(CREATEDATE, MODIFIEDDATE)) as CARD_DATE,
                COUNT(*) as DAILY_COUNT
            FROM C_CLIENT_VIP 
            WHERE ISACTIVE = 'Y'
                AND TRUNC(COALESCE(CREATEDATE, MODIFIEDDATE)) >= TRUNC(SYSDATE) - 30
            GROUP BY TRUNC(COALESCE(CREATEDATE, MODIFIEDDATE))
            ORDER BY CARD_DATE DESC
        """)
        
        trends_data = cursor.fetchall()
        
        if trends_data:
            print("  最近30天每日开卡数量:")
            total_30days = 0
            for date_val, count in trends_data:
                print(f"    {date_val.strftime('%Y-%m-%d')}: {count}人")
                total_30days += count
            
            print(f"\n  📊 30天总开卡数: {total_30days}人")
            print(f"  📊 日均开卡数: {total_30days/30:.1f}人")
        else:
            print("  最近30天无开卡记录")
        
        cursor.close()
        
    except Exception as e:
        print(f"❌ 趋势统计查询失败: {e}")
    
    finally:
        db.disconnect()

if __name__ == "__main__":
    print("🎯 最近开卡会员查询工具")
    print("📋 查询规则：")
    print("   • 查询最近开卡的10个不同日期")
    print("   • 如果日期相同，显示该日期的所有开卡会员")
    print("   • 按手机号码降序排列")
    print("=" * 60)
    
    # 查询最近开卡会员
    query_recent_card_holders()
    
    # 查询开卡趋势
    query_card_opening_trends()
    
    print("\n✅ 查询完成") 