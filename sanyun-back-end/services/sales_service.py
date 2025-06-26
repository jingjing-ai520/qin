from datetime import datetime, timedelta
from typing import Dict, List, Optional
from database import db_manager
from calendar import monthrange
import cx_Oracle
import calendar

class SalesService:
    """销售数据服务类"""
    
    def __init__(self, db_config):
        self.db_config = db_config
    
    def get_connection(self):
        return cx_Oracle.connect(**self.db_config)
    
    def get_sales_overview(self, selected_date=None, analysis_type='month'):
        """获取销售概览数据"""
        connection = self.get_connection()
        cursor = connection.cursor()
        
        try:
            # 解析日期
            if selected_date:
                date_obj = datetime.strptime(selected_date, '%Y-%m-%d')
            else:
                date_obj = datetime.now()
            
            # 获取今日日期
            today_num = int(date_obj.strftime('%Y%m%d'))
            yesterday_num = int((date_obj - timedelta(days=1)).strftime('%Y%m%d'))
            
            # 获取本月日期范围
            year = date_obj.year
            month = date_obj.month
            month_start = int(f"{year}{month:02d}01")
            last_day = monthrange(year, month)[1]
            month_end = int(f"{year}{month:02d}{last_day}")
            
            # 获取上月日期范围
            if month == 1:
                last_month = 12
                last_year = year - 1
            else:
                last_month = month - 1
                last_year = year
            
            last_month_start = int(f"{last_year}{last_month:02d}01")
            last_month_last_day = monthrange(last_year, last_month)[1]
            last_month_end = int(f"{last_year}{last_month:02d}{last_month_last_day}")
            
            # 今日销售数据
            cursor.execute("""
                SELECT 
                    NVL(SUM(tot_amt_actual), 0) as today_sales,
                    COUNT(*) as today_orders
                FROM m_retail 
                WHERE billdate = :today_date
                AND c_store_id NOT IN (
                    SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                )
            """, {'today_date': today_num})
            
            today_data = cursor.fetchone()
            today_sales = float(today_data[0]) if today_data[0] else 0
            today_orders = today_data[1] if today_data[1] else 0
            
            # 昨日销售数据（用于计算增长率）
            cursor.execute("""
                SELECT 
                    NVL(SUM(tot_amt_actual), 0) as yesterday_sales
                FROM m_retail 
                WHERE billdate = :yesterday_date
                AND c_store_id NOT IN (
                    SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                )
            """, {'yesterday_date': yesterday_num})
            
            yesterday_data = cursor.fetchone()
            yesterday_sales = float(yesterday_data[0]) if yesterday_data[0] else 0
            
            # 计算今日增长率
            if yesterday_sales > 0:
                today_growth = ((today_sales - yesterday_sales) / yesterday_sales) * 100
            else:
                today_growth = 0
            
            # 本月销售数据
            cursor.execute("""
                SELECT 
                    NVL(SUM(tot_amt_actual), 0) as month_sales,
                    COUNT(*) as month_orders
                FROM m_retail 
                WHERE billdate >= :month_start AND billdate <= :month_end
                AND c_store_id NOT IN (
                    SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                )
            """, {'month_start': month_start, 'month_end': month_end})
            
            month_data = cursor.fetchone()
            month_sales = float(month_data[0]) if month_data[0] else 0
            month_orders = month_data[1] if month_data[1] else 0
            
            # 上月销售数据（用于计算增长率）
            cursor.execute("""
                SELECT 
                    NVL(SUM(tot_amt_actual), 0) as last_month_sales
                FROM m_retail 
                WHERE billdate >= :last_month_start AND billdate <= :last_month_end
                AND c_store_id NOT IN (
                    SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                )
            """, {'last_month_start': last_month_start, 'last_month_end': last_month_end})
            
            last_month_data = cursor.fetchone()
            last_month_sales = float(last_month_data[0]) if last_month_data[0] else 0
            
            # 计算本月增长率
            if last_month_sales > 0:
                month_growth = ((month_sales - last_month_sales) / last_month_sales) * 100
            else:
                month_growth = 0
            
            return {
                'today_sales': today_sales,
                'today_orders': today_orders,
                'today_growth': round(today_growth, 1),
                'month_sales': month_sales,
                'month_orders': month_orders,
                'month_growth': round(month_growth, 1)
            }
            
        finally:
            cursor.close()
            connection.close()
    
    def get_top_stores(self, limit=10, selected_date=None, analysis_type='month'):
        """获取店铺排行"""
        connection = self.get_connection()
        cursor = connection.cursor()
        
        try:
            # 解析日期
            if selected_date:
                date_obj = datetime.strptime(selected_date, '%Y-%m-%d')
            else:
                date_obj = datetime.now()
            
            year = date_obj.year
            month = date_obj.month
            day = date_obj.day
            
            if analysis_type == 'day':
                # 日数据分析：只统计当天的店铺销售
                start_date = int(f"{year}{month:02d}{day:02d}")
                end_date = start_date
            else:
                # 月数据分析：统计整月的店铺销售
                start_date = int(f"{year}{month:02d}01")
                last_day = monthrange(year, month)[1]
                end_date = int(f"{year}{month:02d}{last_day}")
            
            cursor.execute("""
                SELECT * FROM (
                    SELECT 
                        s.name as store_name,
                        NVL(SUM(r.tot_amt_actual), 0) as total_sales,
                        COUNT(r.id) as order_count,
                        NVL(AVG(r.tot_amt_actual), 0) as avg_order_value
                    FROM c_store s
                    LEFT JOIN m_retail r ON s.id = r.c_store_id 
                        AND r.billdate >= :start_date 
                        AND r.billdate <= :end_date
                    WHERE s.name NOT LIKE '%仓库%' 
                        AND s.name NOT LIKE '%库房%'
                        AND s.isactive = 'Y'
                    GROUP BY s.id, s.name
                    ORDER BY total_sales DESC
                ) WHERE ROWNUM <= :limit
            """, {'start_date': start_date, 'end_date': end_date, 'limit': limit})
            
            stores = []
            for row in cursor.fetchall():
                stores.append({
                    'name': row[0],
                    'sales': float(row[1]),
                    'orders': row[2],
                    'avg_order': float(row[3])
                })
            
            return stores
            
        finally:
            cursor.close()
            connection.close()
    
    def get_sales_metrics(self, selected_date=None, analysis_type='month'):
        """获取销售指标数据"""
        connection = self.get_connection()
        cursor = connection.cursor()
        
        try:
            # 解析日期
            if selected_date:
                date_obj = datetime.strptime(selected_date, '%Y-%m-%d')
            else:
                date_obj = datetime.now()
            
            year = date_obj.year
            month = date_obj.month
            day = date_obj.day
            
            # 根据分析类型确定日期范围
            if analysis_type == 'day':
                # 日数据分析
                current_start = int(f"{year}{month:02d}{day:02d}")
                current_end = current_start
                
                # 上一日
                prev_day_obj = date_obj - timedelta(days=1)
                prev_start = int(prev_day_obj.strftime('%Y%m%d'))
                prev_end = prev_start
                
                # 去年同期
                lastyear_day_obj = date_obj.replace(year=year-1)
                lastyear_start = int(lastyear_day_obj.strftime('%Y%m%d'))
                lastyear_end = lastyear_start
                
            else:
                # 月数据分析
                current_start = int(f"{year}{month:02d}01")
                last_day = monthrange(year, month)[1]
                current_end = int(f"{year}{month:02d}{last_day}")
                
                # 上月
                if month == 1:
                    prev_month = 12
                    prev_year = year - 1
                else:
                    prev_month = month - 1
                    prev_year = year
                
                prev_start = int(f"{prev_year}{prev_month:02d}01")
                prev_last_day = monthrange(prev_year, prev_month)[1]
                prev_end = int(f"{prev_year}{prev_month:02d}{prev_last_day}")
                
                # 去年同期
                lastyear_start = int(f"{year-1}{month:02d}01")
                lastyear_last_day = monthrange(year-1, month)[1]
                lastyear_end = int(f"{year-1}{month:02d}{lastyear_last_day}")
            
            # 当期基础数据
            cursor.execute("""
                SELECT 
                    NVL(SUM(tot_amt_actual), 0) as total_sales,
                    NVL(SUM(tot_amt_list), 0) as total_list_price,
                    NVL(AVG(CASE WHEN avg_discount > 0 THEN avg_discount END), 0) as avg_discount_rate,
                    COUNT(*) as total_orders,
                    NVL(SUM(tot_qty), 0) as total_quantity,
                    NVL(SUM(tot_lines), 0) as total_lines,
                    COUNT(DISTINCT c_store_id) as active_stores,
                    COUNT(DISTINCT c_vip_id) as unique_customers,
                    COUNT(DISTINCT CASE WHEN c_vip_id IS NOT NULL THEN id END) as member_orders
                FROM m_retail 
                WHERE billdate >= :current_start AND billdate <= :current_end
                AND c_store_id NOT IN (
                    SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                )
            """, {'current_start': current_start, 'current_end': current_end})
            
            current_data = cursor.fetchone()
            
            # 上期数据
            cursor.execute("""
                SELECT 
                    NVL(SUM(tot_amt_actual), 0) as total_sales,
                    NVL(AVG(CASE WHEN avg_discount > 0 THEN avg_discount END), 0) as avg_discount_rate,
                    COUNT(*) as total_orders,
                    COUNT(DISTINCT c_store_id) as active_stores,
                    COUNT(DISTINCT c_vip_id) as unique_customers,
                    NVL(SUM(tot_lines), 0) as total_lines,
                    NVL(SUM(tot_qty), 0) as total_quantity,
                    COUNT(DISTINCT CASE WHEN c_vip_id IS NOT NULL THEN id END) as member_orders
                FROM m_retail 
                WHERE billdate >= :prev_start AND billdate <= :prev_end
                AND c_store_id NOT IN (
                    SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                )
            """, {'prev_start': prev_start, 'prev_end': prev_end})
            
            prev_data = cursor.fetchone()
            
            # 去年同期数据
            cursor.execute("""
                SELECT 
                    NVL(SUM(tot_amt_actual), 0) as total_sales,
                    NVL(AVG(CASE WHEN avg_discount > 0 THEN avg_discount END), 0) as avg_discount_rate,
                    COUNT(*) as total_orders,
                    COUNT(DISTINCT c_store_id) as active_stores,
                    COUNT(DISTINCT c_vip_id) as unique_customers,
                    NVL(SUM(tot_lines), 0) as total_lines,
                    NVL(SUM(tot_qty), 0) as total_quantity,
                    COUNT(DISTINCT CASE WHEN c_vip_id IS NOT NULL THEN id END) as member_orders
                FROM m_retail 
                WHERE billdate >= :lastyear_start AND billdate <= :lastyear_end
                AND c_store_id NOT IN (
                    SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                )
            """, {'lastyear_start': lastyear_start, 'lastyear_end': lastyear_end})
            
            lastyear_data = cursor.fetchone()
            
            # 计算新客占比（在当期内新开卡的会员）
            cursor.execute("""
                SELECT COUNT(DISTINCT v.id) as new_customers
                FROM c_vips v
                WHERE v.enterdate >= :current_start AND v.enterdate <= :current_end
                AND EXISTS (
                    SELECT 1 FROM m_retail r 
                    WHERE r.c_vip_id = v.id 
                    AND r.billdate >= :current_start AND r.billdate <= :current_end
                )
            """, {'current_start': current_start, 'current_end': current_end})
            
            new_customers_result = cursor.fetchone()
            new_customers = new_customers_result[0] or 0
            
            # 计算会员回店率（当期有重复购买的会员比例）
            cursor.execute("""
                SELECT COUNT(DISTINCT c_vip_id) as repeat_customers
                FROM (
                    SELECT c_vip_id, COUNT(*) as visit_count
                    FROM m_retail 
                    WHERE billdate >= :current_start AND billdate <= :current_end
                    AND c_vip_id IS NOT NULL
                    GROUP BY c_vip_id
                    HAVING COUNT(*) > 1
                )
            """, {'current_start': current_start, 'current_end': current_end})
            
            repeat_customers_result = cursor.fetchone()
            repeat_customers = repeat_customers_result[0] or 0
            
            # 处理数据
            def safe_divide(a, b):
                return (a / b) if b > 0 else 0
            
            def safe_percentage(current, previous):
                return ((current - previous) / previous * 100) if previous > 0 else 0
            
            # 当期指标
            current_sales = float(current_data[0])
            current_list_price = float(current_data[1])
            current_discount_rate = float(current_data[2])
            current_orders = current_data[3]
            current_quantity = current_data[4]
            current_lines = current_data[5]
            current_stores = current_data[6]
            current_customers = current_data[7]
            current_member_orders = current_data[8]
            
            # 上期指标
            prev_sales = float(prev_data[0])
            prev_discount = float(prev_data[1])
            prev_orders = prev_data[2]
            prev_stores = prev_data[3]
            prev_customers = prev_data[4]
            prev_lines = prev_data[5]
            prev_quantity = prev_data[6]
            prev_member_orders = prev_data[7]
            
            # 去年同期指标
            lastyear_sales = float(lastyear_data[0])
            lastyear_discount = float(lastyear_data[1])
            lastyear_orders = lastyear_data[2]
            lastyear_stores = lastyear_data[3]
            lastyear_customers = lastyear_data[4]
            lastyear_lines = lastyear_data[5]
            lastyear_quantity = lastyear_data[6]
            lastyear_member_orders = lastyear_data[7]
            
            # 计算各项指标
            avg_order_value = safe_divide(current_sales, current_orders)
            discount_rate = current_discount_rate
            attachment_rate = safe_divide(current_lines, current_orders)
            new_customer_ratio = safe_divide(new_customers, current_customers) * 100
            repeat_customer_ratio = safe_divide(repeat_customers, current_customers) * 100
            member_ratio = safe_divide(current_member_orders, current_orders) * 100
            
            # 计算销售附加（商品附加值比例）
            if current_list_price > 0:
                sales_attachment = ((current_list_price - current_sales) / current_list_price) * 100
            else:
                sales_attachment = 0
            
            # 计算环比和同比
            metrics = [
                {
                    'name': '销售额',
                    'value': current_sales,
                    'unit': '元',
                    'mom_change': safe_percentage(current_sales, prev_sales),
                    'yoy_change': safe_percentage(current_sales, lastyear_sales)
                },
                {
                    'name': '折扣率',
                    'value': discount_rate,
                    'unit': '%',
                    'mom_change': safe_percentage(current_discount_rate, prev_discount),
                    'yoy_change': safe_percentage(current_discount_rate, lastyear_discount)
                },
                {
                    'name': '客单价',
                    'value': avg_order_value,
                    'unit': '元',
                    'mom_change': safe_percentage(avg_order_value, safe_divide(prev_sales, prev_orders)),
                    'yoy_change': safe_percentage(avg_order_value, safe_divide(lastyear_sales, lastyear_orders))
                },
                {
                    'name': '销售附加',
                    'value': sales_attachment,
                    'unit': '%',
                    'mom_change': safe_percentage(sales_attachment, 
                                               safe_divide((safe_divide(prev_lines, prev_orders) - prev_sales/prev_orders) * 100, prev_sales/prev_orders) if prev_orders > 0 else 0),
                    'yoy_change': safe_percentage(sales_attachment,
                                               safe_divide((safe_divide(lastyear_lines, lastyear_orders) - lastyear_sales/lastyear_orders) * 100, lastyear_sales/lastyear_orders) if lastyear_orders > 0 else 0)
                },
                {
                    'name': '活跃店铺',
                    'value': current_stores,
                    'unit': '家',
                    'mom_change': safe_percentage(current_stores, prev_stores),
                    'yoy_change': safe_percentage(current_stores, lastyear_stores)
                },
                {
                    'name': '新客占比',
                    'value': new_customer_ratio,
                    'unit': '%',
                    'mom_change': safe_percentage(new_customer_ratio, 
                                               safe_divide(new_customers, prev_customers) * 100 if prev_customers > 0 else 0),
                    'yoy_change': safe_percentage(new_customer_ratio,
                                               safe_divide(new_customers, lastyear_customers) * 100 if lastyear_customers > 0 else 0)
                },
                {
                    'name': '会员回店',
                    'value': repeat_customer_ratio,
                    'unit': '%',
                    'mom_change': safe_percentage(repeat_customer_ratio,
                                               safe_divide(repeat_customers, prev_customers) * 100 if prev_customers > 0 else 0),
                    'yoy_change': safe_percentage(repeat_customer_ratio,
                                               safe_divide(repeat_customers, lastyear_customers) * 100 if lastyear_customers > 0 else 0)
                },
                {
                    'name': '连带率',
                    'value': attachment_rate,
                    'unit': '',
                    'mom_change': safe_percentage(attachment_rate, safe_divide(prev_lines, prev_orders)),
                    'yoy_change': safe_percentage(attachment_rate, safe_divide(lastyear_lines, lastyear_orders))
                }
            ]
            
            return metrics
            
        finally:
            cursor.close()
            connection.close()
    
    # 旧的静态方法已废弃，使用新的实例方法
    @staticmethod
    def get_daily_sales_overview_deprecated(date: str) -> Dict:
        """获取日销售概览"""
        date_obj = datetime.strptime(date, '%Y-%m-%d')
        today_num = int(date_obj.strftime('%Y%m%d'))
        
        today_query = """
        SELECT 
            NVL(SUM(tot_amt_actual), 0) as total_sales,
            NVL(COUNT(*), 0) as total_orders,
            NVL(AVG(tot_amt_actual), 0) as avg_order_value
        FROM m_retail 
        WHERE billdate = :today
        AND isactive = 'Y'
        AND status = 1
        """
        
        result = db_manager.execute_single_query(today_query, {'today': today_num})
        
        if result:
            return {
                'total_sales': float(result[0]) if result[0] else 0,
                'total_orders': int(result[1]) if result[1] else 0,
                'avg_order_value': float(result[2]) if result[2] else 0
            }
        return {'total_sales': 0, 'total_orders': 0, 'avg_order_value': 0}
    
    @staticmethod
    def get_monthly_sales_overview_deprecated(date: str) -> Dict:
        """获取月销售概览"""
        date_obj = datetime.strptime(date, '%Y-%m-%d')
        month_start = int(date_obj.strftime('%Y%m01'))
        year = date_obj.year
        month = date_obj.month
        last_day = monthrange(year, month)[1]
        month_end = int(f"{year}{month:02d}{last_day}")
        
        month_query = """
        SELECT 
            NVL(SUM(tot_amt_actual), 0) as monthly_sales,
            NVL(COUNT(*), 0) as monthly_orders,
            NVL(AVG(tot_amt_actual), 0) as avg_monthly_order_value
        FROM m_retail 
        WHERE billdate >= :month_start
        AND billdate <= :month_end
        AND isactive = 'Y'
        AND status = 1
        """
        
        result = db_manager.execute_single_query(month_query, {'month_start': month_start, 'month_end': month_end})
        
        if result:
            return {
                'monthly_sales': float(result[0]) if result[0] else 0,
                'monthly_orders': int(result[1]) if result[1] else 0,
                'avg_monthly_order_value': float(result[2]) if result[2] else 0
            }
        return {'monthly_sales': 0, 'monthly_orders': 0, 'avg_monthly_order_value': 0}
    
    @staticmethod
    def get_store_sales_ranking_deprecated(date: str, limit: int = 10) -> List[Dict]:
        """获取店铺销售排行"""
        # 计算日期范围
        date_obj = datetime.strptime(date, '%Y-%m-%d')
        today_num = int(date_obj.strftime('%Y%m%d'))
        month_start = int(date_obj.strftime('%Y%m01'))
        
        # 简化查询
        query = """
        SELECT 
            NVL(cs.name, '未知店铺') as store_name,
            cs.id as store_id,
            NVL(SUM(CASE WHEN m.billdate = :today THEN m.tot_amt_actual ELSE 0 END), 0) as today_sales,
            NVL(SUM(CASE WHEN m.billdate >= :month_start AND m.billdate <= :month_end 
                THEN m.tot_amt_actual ELSE 0 END), 0) as month_sales
        FROM c_store cs
        LEFT JOIN m_retail m ON cs.id = m.c_store_id AND m.isactive = 'Y' AND m.status = 1
        WHERE cs.isactive = 'Y'
        AND cs.name IS NOT NULL
        AND cs.name NOT LIKE '%仓%'
        GROUP BY cs.name, cs.id
        ORDER BY month_sales DESC, today_sales DESC, cs.name
        """
        
        # 使用简单的日期数字而不是复杂的函数
        year = date_obj.year
        month = date_obj.month
        last_day = monthrange(year, month)[1]
        month_end_correct = int(f"{year}{month:02d}{last_day}")
        
        bind_vars = {
            'today': today_num,
            'month_start': month_start,
            'month_end': month_end_correct
        }
        
        print(f"SQL查询参数: {bind_vars}")
        
        results = db_manager.execute_query(query, bind_vars)
        
        stores = []
        total_monthly_sales = sum(row[3] for row in results) if results else 1
        
        for i, row in enumerate(results[:limit]):
            store_name, store_id, today_sales, month_sales = row
            stores.append({
                'store_name': str(store_name) if store_name else f'店铺{store_id}',
                'store_id': int(store_id) if store_id else 0,
                'today_sales': float(today_sales),
                'month_sales': float(month_sales),
                'today_rank': i + 1,
                'month_rank': i + 1,
                'sales_percent': round(float(month_sales) / total_monthly_sales * 100, 1) if total_monthly_sales > 0 else 0
            })
        
        return stores
    
    @staticmethod
    def get_sales_metrics_deprecated(date: str) -> List[Dict]:
        """获取销售指标数据"""
        date_obj = datetime.strptime(date, '%Y-%m-%d')
        month_start = int(date_obj.strftime('%Y%m01'))
        year = date_obj.year
        month = date_obj.month
        last_day = monthrange(year, month)[1]
        month_end = int(f"{year}{month:02d}{last_day}")
        
        current_query = """
        SELECT 
            NVL(SUM(tot_amt_actual), 0) as sales_amount,
            NVL(AVG(tot_amt_actual/NULLIF(tot_qty,0)), 0) as avg_unit_price,
            NVL(COUNT(DISTINCT c_store_id), 0) as store_count,
            NVL(SUM(tot_qty), 0) as total_quantity
        FROM m_retail 
        WHERE billdate >= :month_start
        AND billdate <= :month_end
        AND isactive = 'Y'
        AND status = 1
        """
        
        bind_vars = {'month_start': month_start, 'month_end': month_end}
        current_result = db_manager.execute_single_query(current_query, bind_vars)
        
        # 上月同期数据
        last_month_obj = date_obj - timedelta(days=30)
        last_month_start = int(last_month_obj.strftime('%Y%m01'))
        last_year = last_month_obj.year
        last_month = last_month_obj.month
        last_month_last_day = monthrange(last_year, last_month)[1]
        last_month_end = int(f"{last_year}{last_month:02d}{last_month_last_day}")
        
        last_bind_vars = {'month_start': last_month_start, 'month_end': last_month_end}
        previous_result = db_manager.execute_single_query(current_query, last_bind_vars)
        
        def safe_percent(current, previous):
            if not previous or previous == 0:
                return 100.0 if current > 0 else 0.0
            return round((current - previous) / previous * 100, 1)
        
        if current_result and previous_result:
            current_sales = float(current_result[0]) if current_result[0] else 0
            previous_sales = float(previous_result[0]) if previous_result[0] else 0
            current_unit_price = float(current_result[1]) if current_result[1] else 0
            current_stores = int(current_result[2]) if current_result[2] else 0
            
            return [
                {
                    'name': '销售额',
                    'current': f'{current_sales:,.0f}',
                    'change_percent': safe_percent(current_sales, previous_sales),
                    'month_change': safe_percent(current_sales, previous_sales)
                },
                {
                    'name': '折扣率',
                    'current': '15.2%',
                    'change_percent': -2.1,
                    'month_change': 1.8
                },
                {
                    'name': '客单价',
                    'current': f'{current_unit_price:.0f}',
                    'change_percent': 5.7,
                    'month_change': -3.2
                },
                {
                    'name': '销售附加',
                    'current': '85.6%',
                    'change_percent': 12.8,
                    'month_change': 6.4
                },
                {
                    'name': '活跃店铺',
                    'current': f'{current_stores}',
                    'change_percent': 23.5,
                    'month_change': 15.8
                },
                {
                    'name': '新客占比',
                    'current': '32.4%',
                    'change_percent': 8.9,
                    'month_change': -1.5
                },
                {
                    'name': '会员回店',
                    'current': '68.5%',
                    'change_percent': 5.2,
                    'month_change': 8.7
                },
                {
                    'name': '连带率',
                    'current': '1.85',
                    'change_percent': 15.6,
                    'month_change': 3.2
                }
            ]
        
        # 默认返回静态数据
        return [
            {'name': '销售额', 'current': '0', 'change_percent': 0, 'month_change': 0},
            {'name': '折扣率', 'current': '15.2%', 'change_percent': -2.1, 'month_change': 1.8},
            {'name': '客单价', 'current': '0', 'change_percent': 0, 'month_change': 0},
            {'name': '销售附加', 'current': '85.6%', 'change_percent': 12.8, 'month_change': 6.4},
            {'name': '新增会员', 'current': '0', 'change_percent': 0, 'month_change': 0},
            {'name': '新客占比', 'current': '32.4%', 'change_percent': 8.9, 'month_change': -1.5},
            {'name': '会员回店', 'current': '68.5%', 'change_percent': 5.2, 'month_change': 8.7},
            {'name': '连带率', 'current': '1.85', 'change_percent': 15.6, 'month_change': 3.2}
        ] 
    
    def get_sales_trend(self, selected_date=None, analysis_type='month'):
        """获取销售趋势数据"""
        connection = self.get_connection()
        cursor = connection.cursor()
        
        try:
            # 解析日期
            if selected_date:
                date_obj = datetime.strptime(selected_date, '%Y-%m-%d')
            else:
                date_obj = datetime.now()
            
            year = date_obj.year
            month = date_obj.month
            day = date_obj.day
            
            if analysis_type == 'day':
                # 日数据分析：计算当日、当周、当月数据
                target_date = int(f"{year}{month:02d}{day:02d}")
                
                # 当日销售
                cursor.execute("""
                    SELECT NVL(SUM(tot_amt_actual), 0) as day_sales
                    FROM m_retail 
                    WHERE billdate = :target_date
                    AND isactive = 'Y' AND status = 1
                """, {'target_date': target_date})
                day_sales = cursor.fetchone()[0] or 0
                
                # 当周销售（本周到目前为止）
                week_start = date_obj - timedelta(days=date_obj.weekday())
                week_start_int = int(week_start.strftime('%Y%m%d'))
                week_end_int = int(date_obj.strftime('%Y%m%d'))
                
                cursor.execute("""
                    SELECT NVL(SUM(tot_amt_actual), 0) as week_sales
                    FROM m_retail 
                    WHERE billdate >= :week_start AND billdate <= :week_end
                    AND isactive = 'Y' AND status = 1
                """, {'week_start': week_start_int, 'week_end': week_end_int})
                week_sales = cursor.fetchone()[0] or 0
                
                # 当月销售（本月到目前为止）
                month_start = int(f"{year}{month:02d}01")
                month_end = int(date_obj.strftime('%Y%m%d'))
                
                cursor.execute("""
                    SELECT NVL(SUM(tot_amt_actual), 0) as month_sales
                    FROM m_retail 
                    WHERE billdate >= :month_start AND billdate <= :month_end
                    AND isactive = 'Y' AND status = 1
                """, {'month_start': month_start, 'month_end': month_end})
                month_sales = cursor.fetchone()[0] or 0
                
                # 计算增长率（与前一日对比）
                prev_date = date_obj - timedelta(days=1)
                prev_date_int = int(prev_date.strftime('%Y%m%d'))
                
                cursor.execute("""
                    SELECT NVL(SUM(tot_amt_actual), 0) as prev_day_sales
                    FROM m_retail 
                    WHERE billdate = :prev_date
                    AND isactive = 'Y' AND status = 1
                """, {'prev_date': prev_date_int})
                prev_day_sales = cursor.fetchone()[0] or 0
                
                daily_growth = 0
                if prev_day_sales > 0:
                    daily_growth = ((day_sales - prev_day_sales) / prev_day_sales) * 100
                
                return {
                    'daily_average_sales': float(day_sales),
                    'weekly_sales': float(week_sales),
                    'monthly_sales': float(month_sales),
                    'daily_growth_rate': round(daily_growth, 1),
                    'weekly_growth_rate': 0,  # 可以进一步计算
                    'monthly_growth_rate': 0
                }
                
            else:  # month analysis
                # 月数据分析：计算当月日均、周均、月总计
                month_start = int(f"{year}{month:02d}01")
                last_day = monthrange(year, month)[1]
                month_end = int(f"{year}{month:02d}{last_day}")
                
                # 当月销售数据
                cursor.execute("""
                    SELECT NVL(SUM(tot_amt_actual), 0) as month_sales
                    FROM m_retail 
                    WHERE billdate >= :month_start AND billdate <= :month_end
                    AND isactive = 'Y' AND status = 1
                """, {'month_start': month_start, 'month_end': month_end})
                
                month_sales = cursor.fetchone()[0] or 0
                
                # 计算日均和周均
                days_in_month = last_day
                daily_average = month_sales / max(days_in_month, 1)
                weekly_average = daily_average * 7
                
                # 与上月对比计算增长率
                prev_month = month - 1 if month > 1 else 12
                prev_year = year if month > 1 else year - 1
                prev_month_start = int(f"{prev_year}{prev_month:02d}01")
                prev_last_day = monthrange(prev_year, prev_month)[1]
                prev_month_end = int(f"{prev_year}{prev_month:02d}{prev_last_day}")
                
                cursor.execute("""
                    SELECT NVL(SUM(tot_amt_actual), 0) as prev_month_sales
                    FROM m_retail 
                    WHERE billdate >= :prev_month_start AND billdate <= :prev_month_end
                    AND isactive = 'Y' AND status = 1
                """, {'prev_month_start': prev_month_start, 'prev_month_end': prev_month_end})
                
                prev_month_sales = cursor.fetchone()[0] or 0
                
                # 计算月环比增长率
                monthly_growth = 0
                if prev_month_sales > 0:
                    monthly_growth = ((month_sales - prev_month_sales) / prev_month_sales) * 100
                
                print(f"月度趋势数据: 当月={month_sales}, 上月={prev_month_sales}, 增长率={monthly_growth:.1f}%")
                
                return {
                    'daily_average_sales': float(daily_average),
                    'weekly_sales': float(weekly_average),
                    'monthly_sales': float(month_sales),
                    'daily_growth_rate': 0,  # 在月度分析中，日增长率不太有意义
                    'weekly_growth_rate': 0,
                    'monthly_growth_rate': round(monthly_growth, 1)
                }
            
        except Exception as e:
            print(f"获取销售趋势数据时出错: {e}")
            return {
                'daily_average_sales': 0,
                'weekly_sales': 0,
                'monthly_sales': 0,
                'daily_growth_rate': 0,
                'weekly_growth_rate': 0,
                'monthly_growth_rate': 0
            }
        finally:
            cursor.close()
            connection.close()
    
    def get_member_analysis(self, selected_date=None, analysis_type='month'):
        """获取会员分析数据"""
        connection = self.get_connection()
        cursor = connection.cursor()
        
        try:
            # 解析日期
            if selected_date:
                date_obj = datetime.strptime(selected_date, '%Y-%m-%d')
            else:
                date_obj = datetime.now()
            
            year = date_obj.year
            month = date_obj.month
            day = date_obj.day
            
            # 根据分析类型确定日期范围
            if analysis_type == 'day':
                # 日数据分析
                current_start = int(f"{year}{month:02d}{day:02d}")
                current_end = current_start
                
                # 上一日
                prev_day_obj = date_obj - timedelta(days=1)
                prev_start = int(prev_day_obj.strftime('%Y%m%d'))
                prev_end = prev_start
                
            else:
                # 月数据分析
                current_start = int(f"{year}{month:02d}01")
                last_day = monthrange(year, month)[1]
                current_end = int(f"{year}{month:02d}{last_day}")
                
                # 上月
                if month == 1:
                    prev_month = 12
                    prev_year = year - 1
                else:
                    prev_month = month - 1
                    prev_year = year
                
                prev_start = int(f"{prev_year}{prev_month:02d}01")
                prev_last_day = monthrange(prev_year, prev_month)[1]
                prev_end = int(f"{prev_year}{prev_month:02d}{prev_last_day}")
            
            print(f"会员分析 - 分析类型: {analysis_type}, 当期范围: {current_start} - {current_end}")
            
            # 获取当期新增会员数
            cursor.execute("""
                SELECT COUNT(*) as new_members
                FROM c_vips
                WHERE enterdate >= :current_start AND enterdate <= :current_end
            """, {'current_start': current_start, 'current_end': current_end})
            
            new_members = cursor.fetchone()[0] or 0
            
            # 获取当期活跃会员数（有交易的会员）
            cursor.execute("""
                SELECT COUNT(DISTINCT c_vip_id) as active_members
                FROM m_retail
                WHERE billdate >= :current_start AND billdate <= :current_end
                AND c_vip_id IS NOT NULL
                AND c_store_id NOT IN (
                    SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                )
            """, {'current_start': current_start, 'current_end': current_end})
            
            active_members = cursor.fetchone()[0] or 0
            
            # 获取会员销售占比
            cursor.execute("""
                SELECT 
                    NVL(SUM(CASE WHEN c_vip_id IS NOT NULL THEN tot_amt_actual ELSE 0 END), 0) as member_sales,
                    NVL(SUM(tot_amt_actual), 0) as total_sales
                FROM m_retail
                WHERE billdate >= :current_start AND billdate <= :current_end
                AND c_store_id NOT IN (
                    SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                )
            """, {'current_start': current_start, 'current_end': current_end})
            
            result = cursor.fetchone()
            member_sales = result[0] or 0
            total_sales = result[1] or 0
            member_sales_ratio = (member_sales / total_sales * 100) if total_sales > 0 else 0
            
            # 获取上期数据用于计算增长率
            # 上期新增会员
            cursor.execute("""
                SELECT COUNT(*) as prev_new_members
                FROM c_vips
                WHERE enterdate >= :prev_start AND enterdate <= :prev_end
            """, {'prev_start': prev_start, 'prev_end': prev_end})
            
            prev_new_members = cursor.fetchone()[0] or 0
            
            # 上期活跃会员
            cursor.execute("""
                SELECT COUNT(DISTINCT c_vip_id) as prev_active_members
                FROM m_retail
                WHERE billdate >= :prev_start AND billdate <= :prev_end
                AND c_vip_id IS NOT NULL
                AND c_store_id NOT IN (
                    SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                )
            """, {'prev_start': prev_start, 'prev_end': prev_end})
            
            prev_active_members = cursor.fetchone()[0] or 0
            
            # 上期会员销售占比
            cursor.execute("""
                SELECT 
                    NVL(SUM(CASE WHEN c_vip_id IS NOT NULL THEN tot_amt_actual ELSE 0 END), 0) as prev_member_sales,
                    NVL(SUM(tot_amt_actual), 0) as prev_total_sales
                FROM m_retail
                WHERE billdate >= :prev_start AND billdate <= :prev_end
                AND c_store_id NOT IN (
                    SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                )
            """, {'prev_start': prev_start, 'prev_end': prev_end})
            
            prev_result = cursor.fetchone()
            prev_member_sales = prev_result[0] or 0
            prev_total_sales = prev_result[1] or 0
            prev_member_sales_ratio = (prev_member_sales / prev_total_sales * 100) if prev_total_sales > 0 else 0
            
            # 计算增长率
            def safe_growth_rate(current, previous):
                if previous > 0:
                    return ((current - previous) / previous) * 100
                elif current > 0:
                    return 100.0
                else:
                    return 0.0
            
            new_member_growth = safe_growth_rate(new_members, prev_new_members)
            active_member_growth = safe_growth_rate(active_members, prev_active_members)
            member_ratio_growth = safe_growth_rate(member_sales_ratio, prev_member_sales_ratio)
            
            print(f"会员数据: 新增={new_members}(+{new_member_growth:.1f}%), 活跃={active_members}(+{active_member_growth:.1f}%), 销售占比={member_sales_ratio:.1f}%(+{member_ratio_growth:.1f}%)")
            
            return {
                'new_members': new_members,
                'active_members': active_members,
                'member_sales_ratio': round(member_sales_ratio, 1),
                'new_member_growth': round(new_member_growth, 1),
                'active_member_growth': round(active_member_growth, 1),
                'member_ratio_growth': round(member_ratio_growth, 1)
            }
            
        except Exception as e:
            print(f"获取会员分析数据时出错: {e}")
            return {
                'new_members': 0,
                'active_members': 0,
                'member_sales_ratio': 0,
                'new_member_growth': 0,
                'active_member_growth': 0,
                'member_ratio_growth': 0
            }
        finally:
            cursor.close()
            connection.close()
    
    def get_detailed_metrics(self, date=None, period='month'):
        """获取详细销售指标"""
        connection = self.get_connection()
        cursor = connection.cursor()
        
        try:
            # 获取日期范围
            today = datetime.now()
            year = today.year
            month = today.month
            
            if period == 'today':
                start_date = int(today.strftime('%Y%m%d'))
                end_date = start_date
            elif period == 'week':
                # 本周开始日期
                week_start = today - timedelta(days=today.weekday())
                start_date = int(week_start.strftime('%Y%m%d'))
                end_date = int(today.strftime('%Y%m%d'))
            elif period == 'quarter':
                # 本季度开始日期
                quarter_month = ((month - 1) // 3) * 3 + 1
                start_date = int(f"{year}{quarter_month:02d}01")
                end_date = int(today.strftime('%Y%m%d'))
            elif period == 'year':
                start_date = int(f"{year}0101")
                end_date = int(today.strftime('%Y%m%d'))
            else:  # month
                start_date = int(f"{year}{month:02d}01")
                last_day = monthrange(year, month)[1]
                end_date = int(f"{year}{month:02d}{last_day}")
            
            # 获取详细指标
            cursor.execute("""
                SELECT 
                    NVL(SUM(tot_amt_actual), 0) as total_sales,
                    NVL(AVG(tot_amt_actual), 0) as avg_order_value,
                    COUNT(*) as total_orders,
                    COUNT(DISTINCT c_store_id) as active_stores,
                    NVL(SUM(tot_qty), 0) as total_quantity,
                    COUNT(DISTINCT c_vip_id) as unique_customers,
                    NVL(AVG(CASE WHEN avg_discount > 0 THEN avg_discount END), 0) as avg_discount_rate
                FROM m_retail
                WHERE billdate >= :start_date AND billdate <= :end_date
                AND isactive = 'Y' AND status = 1
            """, {'start_date': start_date, 'end_date': end_date})
            
            result = cursor.fetchone()
            
            return {
                'period': period,
                'total_sales': float(result[0] or 0),
                'avg_order_value': float(result[1] or 0),
                'total_orders': result[2] or 0,
                'active_stores': result[3] or 0,
                'total_quantity': result[4] or 0,
                'unique_customers': result[5] or 0,
                'avg_discount_rate': float(result[6] or 0),
                'conversion_rate': 0,  # 可以根据需要计算
                'return_rate': 0,
                'customer_satisfaction': 0
            }
            
        finally:
            cursor.close()
            connection.close() 