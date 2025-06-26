const oracledb = require('oracledb');

class SalesService {
    constructor(dbConfig) {
        this.dbConfig = dbConfig;
    }
    
    async getConnection() {
        return await oracledb.getConnection(this.dbConfig);
    }
    
    async getSalesOverview(selectedDate = null, analysisType = 'month') {
        const connection = await this.getConnection();
        try {
            // 使用传入的日期或当前日期
            let dateObj;
            if (selectedDate) {
                dateObj = new Date(selectedDate);
            } else {
                // 默认查询当前日期的数据
                dateObj = new Date();
            }
            
            const todayNum = parseInt(this.formatDate(dateObj, 'yyyymmdd'));
            const yesterdayObj = new Date(dateObj);
            yesterdayObj.setDate(yesterdayObj.getDate() - 1);
            const yesterdayNum = parseInt(this.formatDate(yesterdayObj, 'yyyymmdd'));
            
            const year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1;
            const monthStart = parseInt(`${year}${month.toString().padStart(2, '0')}01`);
            const lastDay = new Date(year, month, 0).getDate();
            const monthEnd = parseInt(`${year}${month.toString().padStart(2, '0')}${lastDay.toString().padStart(2, '0')}`);
            
            let lastMonth, lastYear;
            if (month === 1) {
                lastMonth = 12;
                lastYear = year - 1;
            } else {
                lastMonth = month - 1;
                lastYear = year;
            }
            
            const lastMonthStart = parseInt(`${lastYear}${lastMonth.toString().padStart(2, '0')}01`);
            const lastMonthLastDay = new Date(lastYear, lastMonth, 0).getDate();
            const lastMonthEnd = parseInt(`${lastYear}${lastMonth.toString().padStart(2, '0')}${lastMonthLastDay.toString().padStart(2, '0')}`);
            
            // 今日销售数据
            const todayQuery = `
                SELECT 
                    NVL(SUM(tot_amt_actual), 0) as today_sales,
                    COUNT(*) as today_orders
                FROM m_retail 
                WHERE billdate = :today_date
                AND c_store_id NOT IN (
                    SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                )
            `;
            
            const todayResult = await connection.execute(todayQuery, { today_date: todayNum });
            const todaySales = parseFloat(todayResult.rows[0][0]) || 0;
            const todayOrders = todayResult.rows[0][1] || 0;
            
            // 昨日销售数据
            const yesterdayQuery = `
                SELECT 
                    NVL(SUM(tot_amt_actual), 0) as yesterday_sales
                FROM m_retail 
                WHERE billdate = :yesterday_date
                AND c_store_id NOT IN (
                    SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                )
            `;
            
            const yesterdayResult = await connection.execute(yesterdayQuery, { yesterday_date: yesterdayNum });
            const yesterdaySales = parseFloat(yesterdayResult.rows[0][0]) || 0;
            
            let todayGrowth = 0;
            if (yesterdaySales > 0) {
                todayGrowth = ((todaySales - yesterdaySales) / yesterdaySales) * 100;
            }
            
            // 本月销售数据
            const monthQuery = `
                SELECT 
                    NVL(SUM(tot_amt_actual), 0) as month_sales,
                    COUNT(*) as month_orders
                FROM m_retail 
                WHERE billdate >= :month_start AND billdate <= :month_end
                AND c_store_id NOT IN (
                    SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                )
            `;
            
            const monthResult = await connection.execute(monthQuery, { 
                month_start: monthStart, 
                month_end: monthEnd 
            });
            const monthSales = parseFloat(monthResult.rows[0][0]) || 0;
            const monthOrders = monthResult.rows[0][1] || 0;
            
            // 上月销售数据
            const lastMonthQuery = `
                SELECT 
                    NVL(SUM(tot_amt_actual), 0) as last_month_sales
                FROM m_retail 
                WHERE billdate >= :last_month_start AND billdate <= :last_month_end
                AND c_store_id NOT IN (
                    SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                )
            `;
            
            const lastMonthResult = await connection.execute(lastMonthQuery, { 
                last_month_start: lastMonthStart, 
                last_month_end: lastMonthEnd 
            });
            const lastMonthSales = parseFloat(lastMonthResult.rows[0][0]) || 0;
            
            let monthGrowth = 0;
            if (lastMonthSales > 0) {
                monthGrowth = ((monthSales - lastMonthSales) / lastMonthSales) * 100;
            }
            
            return {
                today_sales: todaySales,
                today_orders: todayOrders,
                today_growth: Math.round(todayGrowth * 10) / 10,
                month_sales: monthSales,
                month_orders: monthOrders,
                month_growth: Math.round(monthGrowth * 10) / 10
            };
        } finally {
            await connection.close();
        }
    }
    
    async getTopStores(limit = 10, selectedDate = null, analysisType = 'month') {
        const connection = await this.getConnection();
        try {
            // 使用传入的日期或当前日期
            let dateObj;
            if (selectedDate) {
                dateObj = new Date(selectedDate);
            } else {
                // 默认查询当前日期的数据
                dateObj = new Date();
            }
            
            const year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1;
            const day = dateObj.getDate();
            
            let startDate, endDate;
            
            if (analysisType === 'day') {
                startDate = parseInt(`${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`);
                endDate = startDate;
            } else {
                startDate = parseInt(`${year}${month.toString().padStart(2, '0')}01`);
                const lastDay = new Date(year, month, 0).getDate();
                endDate = parseInt(`${year}${month.toString().padStart(2, '0')}${lastDay.toString().padStart(2, '0')}`);
            }
            
            const query = `
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
            `;
            
            const result = await connection.execute(query, { 
                start_date: startDate, 
                end_date: endDate, 
                limit: limit 
            });
            
            const stores = [];
            for (const row of result.rows) {
                stores.push({
                    name: row[0],
                    sales: parseFloat(row[1]),
                    orders: row[2],
                    avg_order: parseFloat(row[3])
                });
            }
            
            return stores;
        } finally {
            await connection.close();
        }
    }
    
    async getSalesMetrics(selectedDate = null, analysisType = 'month') {
        const connection = await this.getConnection();
        try {
            // 使用传入的日期或当前日期
            let dateObj;
            if (selectedDate) {
                dateObj = new Date(selectedDate);
            } else {
                dateObj = new Date();
            }
            
            const year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1;
            const day = dateObj.getDate();
            
            // 根据分析类型确定日期范围
            let currentStart, currentEnd, prevStart, prevEnd, lastyearStart, lastyearEnd;
            
            if (analysisType === 'day') {
                // 日数据分析
                currentStart = parseInt(`${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`);
                currentEnd = currentStart;
                
                // 上一日
                const prevDayObj = new Date(dateObj);
                prevDayObj.setDate(prevDayObj.getDate() - 1);
                prevStart = parseInt(this.formatDate(prevDayObj, 'yyyymmdd'));
                prevEnd = prevStart;
                
                // 去年同期
                const lastyearDayObj = new Date(dateObj);
                lastyearDayObj.setFullYear(year - 1);
                lastyearStart = parseInt(this.formatDate(lastyearDayObj, 'yyyymmdd'));
                lastyearEnd = lastyearStart;
                
            } else {
                // 月数据分析
                currentStart = parseInt(`${year}${month.toString().padStart(2, '0')}01`);
                const lastDay = new Date(year, month, 0).getDate();
                currentEnd = parseInt(`${year}${month.toString().padStart(2, '0')}${lastDay.toString().padStart(2, '0')}`);
                
                // 上月
                let prevMonth, prevYear;
                if (month === 1) {
                    prevMonth = 12;
                    prevYear = year - 1;
                } else {
                    prevMonth = month - 1;
                    prevYear = year;
                }
                
                prevStart = parseInt(`${prevYear}${prevMonth.toString().padStart(2, '0')}01`);
                const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
                prevEnd = parseInt(`${prevYear}${prevMonth.toString().padStart(2, '0')}${prevLastDay.toString().padStart(2, '0')}`);
                
                // 去年同期
                lastyearStart = parseInt(`${year-1}${month.toString().padStart(2, '0')}01`);
                const lastyearLastDay = new Date(year-1, month, 0).getDate();
                lastyearEnd = parseInt(`${year-1}${month.toString().padStart(2, '0')}${lastyearLastDay.toString().padStart(2, '0')}`);
            }
            
            // 当期基础数据
            const currentQuery = `
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
            `;
            
            const currentResult = await connection.execute(currentQuery, { 
                current_start: currentStart, 
                current_end: currentEnd 
            });
            
            const currentData = currentResult.rows[0];
            const currentSales = parseFloat(currentData[0]) || 0;
            const currentListPrice = parseFloat(currentData[1]) || 0;
            const currentDiscountRate = parseFloat(currentData[2]) || 0;
            const currentOrders = currentData[3] || 0;
            const currentQuantity = currentData[4] || 0;
            const currentLines = currentData[5] || 0;
            const activeStores = currentData[6] || 0;
            const currentCustomers = currentData[7] || 0;
            const currentMemberOrders = currentData[8] || 0;
            
            // 上期数据
            const prevResult = await connection.execute(currentQuery, { 
                current_start: prevStart, 
                current_end: prevEnd 
            });
            const prevData = prevResult.rows[0];
            const prevSales = parseFloat(prevData[0]) || 0;
            const prevOrders = prevData[3] || 0;
            
            // 去年同期数据
            const lastyearResult = await connection.execute(currentQuery, { 
                current_start: lastyearStart, 
                current_end: lastyearEnd 
            });
            const lastyearData = lastyearResult.rows[0];
            const lastyearSales = parseFloat(lastyearData[0]) || 0;
            const lastyearOrders = lastyearData[3] || 0;
            
            // 计算新客占比（在当期内新开卡的会员）
            let newCustomers = 0;
            try {
                const newCustomerQuery = `
                    SELECT COUNT(DISTINCT v.id) as new_customers
                    FROM c_vips v
                    WHERE v.enterdate >= :current_start AND v.enterdate <= :current_end
                    AND EXISTS (
                        SELECT 1 FROM m_retail r 
                        WHERE r.c_vip_id = v.id 
                        AND r.billdate >= :current_start AND r.billdate <= :current_end
                    )
                `;
                const newCustomerResult = await connection.execute(newCustomerQuery, { 
                    current_start: currentStart, 
                    current_end: currentEnd 
                });
                newCustomers = newCustomerResult.rows[0][0] || 0;
            } catch (error) {
                console.log('c_vips表查询失败，新客占比设为0');
                newCustomers = 0;
            }
            
            // 计算会员回店率（当期有重复购买的会员比例）
            const repeatCustomerQuery = `
                SELECT COUNT(DISTINCT c_vip_id) as repeat_customers
                FROM (
                    SELECT c_vip_id, COUNT(*) as visit_count
                    FROM m_retail 
                    WHERE billdate >= :current_start AND billdate <= :current_end
                    AND c_vip_id IS NOT NULL
                    GROUP BY c_vip_id
                    HAVING COUNT(*) > 1
                )
            `;
            const repeatCustomerResult = await connection.execute(repeatCustomerQuery, { 
                current_start: currentStart, 
                current_end: currentEnd 
            });
            const repeatCustomers = repeatCustomerResult.rows[0][0] || 0;
            
            // 辅助函数
            const safeDivide = (a, b) => b > 0 ? a / b : 0;
            const safePercent = (current, previous) => previous > 0 ? ((current - previous) / previous) * 100 : 0;
            
            // 计算各项指标
            const avgOrderValue = safeDivide(currentSales, currentOrders);
            const discountRate = currentDiscountRate;
            const attachmentRate = safeDivide(currentLines, currentOrders);
            const newCustomerRatio = safeDivide(newCustomers, currentCustomers) * 100;
            const repeatCustomerRatio = safeDivide(repeatCustomers, currentCustomers) * 100;
            const memberRatio = safeDivide(currentMemberOrders, currentOrders) * 100;
            
            // 计算销售附加（商品附加值比例）
            const salesAttachment = currentListPrice > 0 ? 
                ((currentListPrice - currentSales) / currentListPrice) * 100 : 0;
            
            // 返回核心指标数组
            return [
                {
                    name: '销售额',
                    value: currentSales,
                    unit: '元',
                    yoy_change: Math.round(safePercent(currentSales, lastyearSales) * 10) / 10,
                    mom_change: Math.round(safePercent(currentSales, prevSales) * 10) / 10
                },
                {
                    name: '折扣率',
                    value: Math.round(discountRate * 10) / 10,
                    unit: '%',
                    yoy_change: 0,
                    mom_change: 0
                },
                {
                    name: '客单价',
                    value: Math.round(avgOrderValue * 100) / 100,
                    unit: '元',
                    yoy_change: 0,
                    mom_change: 0
                },
                {
                    name: '销售附加',
                    value: Math.round(salesAttachment * 10) / 10,
                    unit: '%',
                    yoy_change: 0,
                    mom_change: 0
                },
                {
                    name: '活跃店铺',
                    value: activeStores,
                    unit: '家',
                    yoy_change: 0,
                    mom_change: 0
                },
                {
                    name: '新客占比',
                    value: Math.round(newCustomerRatio * 10) / 10,
                    unit: '%',
                    yoy_change: 0,
                    mom_change: 0
                },
                {
                    name: '会员回店率',
                    value: Math.round(repeatCustomerRatio * 10) / 10,
                    unit: '%',
                    yoy_change: 0,
                    mom_change: 0
                },
                {
                    name: '连带率',
                    value: Math.round(attachmentRate * 100) / 100,
                    unit: '',
                    yoy_change: 0,
                    mom_change: 0
                }
            ];
        } finally {
            await connection.close();
        }
    }
    
    async getSalesTrend(selectedDate = null, analysisType = 'month') {
        const connection = await this.getConnection();
        try {
            // 使用传入的日期或当前日期
            let dateObj;
            if (selectedDate) {
                dateObj = new Date(selectedDate);
            } else {
                dateObj = new Date();
            }
            
            const year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1;
            const day = dateObj.getDate();
            
            // 计算近31天的折线图数据
            const chartData = await this.getTrendChartData(dateObj);
            
            if (analysisType === 'day') {
                // 日数据分析：计算当日、往前7天、往前30天数据
                const targetDate = parseInt(`${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`);
                
                // 当日销售（保持不变）
                const dayQuery = `
                    SELECT NVL(SUM(tot_amt_actual), 0) as day_sales
                    FROM m_retail 
                    WHERE billdate = :target_date
                    AND c_store_id NOT IN (
                        SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                    )
                `;
                const dayResult = await connection.execute(dayQuery, { target_date: targetDate });
                const daySales = parseFloat(dayResult.rows[0][0]) || 0;
                
                // 周销售（所选日往前推7天的总销售额）
                const weekEndDate = new Date(dateObj);
                const weekStartDate = new Date(dateObj);
                weekStartDate.setDate(weekStartDate.getDate() - 6); // 往前推6天，加上当日共7天
                
                const weekStartInt = parseInt(this.formatDate(weekStartDate, 'yyyymmdd'));
                const weekEndInt = parseInt(this.formatDate(weekEndDate, 'yyyymmdd'));
                
                const weekQuery = `
                    SELECT NVL(SUM(tot_amt_actual), 0) as week_sales
                    FROM m_retail 
                    WHERE billdate >= :week_start AND billdate <= :week_end
                    AND c_store_id NOT IN (
                        SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                    )
                `;
                const weekResult = await connection.execute(weekQuery, { 
                    week_start: weekStartInt, 
                    week_end: weekEndInt 
                });
                const weekSales = parseFloat(weekResult.rows[0][0]) || 0;
                
                // 月销售（所选日往前推30天的总销售额）
                const monthEndDate = new Date(dateObj);
                const monthStartDate = new Date(dateObj);
                monthStartDate.setDate(monthStartDate.getDate() - 29); // 往前推29天，加上当日共30天
                
                const monthStartInt = parseInt(this.formatDate(monthStartDate, 'yyyymmdd'));
                const monthEndInt = parseInt(this.formatDate(monthEndDate, 'yyyymmdd'));
                
                const monthQuery = `
                    SELECT NVL(SUM(tot_amt_actual), 0) as month_sales
                    FROM m_retail 
                    WHERE billdate >= :month_start AND billdate <= :month_end
                    AND c_store_id NOT IN (
                        SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                    )
                `;
                const monthResult = await connection.execute(monthQuery, { 
                    month_start: monthStartInt, 
                    month_end: monthEndInt 
                });
                const monthSales = parseFloat(monthResult.rows[0][0]) || 0;
                
                // 计算增长率（与前一日对比）
                const prevDate = new Date(dateObj);
                prevDate.setDate(prevDate.getDate() - 1);
                const prevDateInt = parseInt(this.formatDate(prevDate, 'yyyymmdd'));
                
                const prevDayQuery = `
                    SELECT NVL(SUM(tot_amt_actual), 0) as prev_day_sales
                    FROM m_retail 
                    WHERE billdate = :prev_date
                    AND c_store_id NOT IN (
                        SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                    )
                `;
                const prevDayResult = await connection.execute(prevDayQuery, { prev_date: prevDateInt });
                const prevDaySales = parseFloat(prevDayResult.rows[0][0]) || 0;
                
                let dailyGrowth = 0;
                if (prevDaySales > 0) {
                    dailyGrowth = ((daySales - prevDaySales) / prevDaySales) * 100;
                }
                
                // 计算周环比增长率（与前一周7天对比）
                const prevWeekEndDate = new Date(dateObj);
                prevWeekEndDate.setDate(prevWeekEndDate.getDate() - 7);
                const prevWeekStartDate = new Date(prevWeekEndDate);
                prevWeekStartDate.setDate(prevWeekStartDate.getDate() - 6);
                
                const prevWeekStartInt = parseInt(this.formatDate(prevWeekStartDate, 'yyyymmdd'));
                const prevWeekEndInt = parseInt(this.formatDate(prevWeekEndDate, 'yyyymmdd'));
                
                const prevWeekResult = await connection.execute(weekQuery, { 
                    week_start: prevWeekStartInt, 
                    week_end: prevWeekEndInt 
                });
                const prevWeekSales = parseFloat(prevWeekResult.rows[0][0]) || 0;
                
                let weeklyGrowth = 0;
                if (prevWeekSales > 0) {
                    weeklyGrowth = ((weekSales - prevWeekSales) / prevWeekSales) * 100;
                }
                
                console.log(`日销售趋势数据: 日=${daySales}, 周=${weekSales}, 月=${monthSales}`);
                console.log(`增长率: 日环比=${dailyGrowth.toFixed(1)}%, 周环比=${weeklyGrowth.toFixed(1)}%`);
                
                return {
                    daily_average_sales: daySales,
                    weekly_sales: weekSales,
                    monthly_sales: monthSales,
                    daily_growth_rate: Math.round(dailyGrowth * 10) / 10,
                    weekly_growth_rate: Math.round(weeklyGrowth * 10) / 10,
                    monthly_growth_rate: 0,
                    chart_data: chartData
                };
                
            } else { // month analysis
                // 月数据分析：计算当月日均、周均、月总计
                const monthStart = parseInt(`${year}${month.toString().padStart(2, '0')}01`);
                const lastDay = new Date(year, month, 0).getDate();
                const monthEnd = parseInt(`${year}${month.toString().padStart(2, '0')}${lastDay.toString().padStart(2, '0')}`);
                
                // 当月销售数据
                const monthQuery = `
                    SELECT NVL(SUM(tot_amt_actual), 0) as month_sales
                    FROM m_retail 
                    WHERE billdate >= :month_start AND billdate <= :month_end
                    AND c_store_id NOT IN (
                        SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                    )
                `;
                const monthResult = await connection.execute(monthQuery, { 
                    month_start: monthStart, 
                    month_end: monthEnd 
                });
                const monthSales = parseFloat(monthResult.rows[0][0]) || 0;
                
                // 计算日均和周均
                const daysInMonth = lastDay;
                const dailyAverage = monthSales / Math.max(daysInMonth, 1);
                const weeklyAverage = dailyAverage * 7;
                
                // 与上月对比计算增长率
                let prevMonth = month - 1;
                let prevYear = year;
                if (month === 1) {
                    prevMonth = 12;
                    prevYear = year - 1;
                }
                
                const prevMonthStart = parseInt(`${prevYear}${prevMonth.toString().padStart(2, '0')}01`);
                const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
                const prevMonthEnd = parseInt(`${prevYear}${prevMonth.toString().padStart(2, '0')}${prevLastDay.toString().padStart(2, '0')}`);
                
                const prevMonthQuery = `
                    SELECT NVL(SUM(tot_amt_actual), 0) as prev_month_sales
                    FROM m_retail 
                    WHERE billdate >= :prev_month_start AND billdate <= :prev_month_end
                    AND c_store_id NOT IN (
                        SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                    )
                `;
                const prevMonthResult = await connection.execute(prevMonthQuery, { 
                    prev_month_start: prevMonthStart, 
                    prev_month_end: prevMonthEnd 
                });
                const prevMonthSales = parseFloat(prevMonthResult.rows[0][0]) || 0;
                
                // 计算月环比增长率
                let monthlyGrowth = 0;
                if (prevMonthSales > 0) {
                    monthlyGrowth = ((monthSales - prevMonthSales) / prevMonthSales) * 100;
                }
                
                console.log(`月度趋势数据: 当月=${monthSales}, 上月=${prevMonthSales}, 增长率=${monthlyGrowth.toFixed(1)}%`);
                
                return {
                    daily_average_sales: dailyAverage,
                    weekly_sales: weeklyAverage,
                    monthly_sales: monthSales,
                    daily_growth_rate: 0,
                    weekly_growth_rate: 0,
                    monthly_growth_rate: Math.round(monthlyGrowth * 10) / 10,
                    chart_data: chartData
                };
            }
            
        } catch (error) {
            console.error(`获取销售趋势数据时出错: ${error}`);
            return {
                daily_average_sales: 0,
                weekly_sales: 0,
                monthly_sales: 0,
                daily_growth_rate: 0,
                weekly_growth_rate: 0,
                monthly_growth_rate: 0,
                chart_data: { dates: [], sales: [] }
            };
        } finally {
            await connection.close();
        }
    }
    
    // 新增方法：获取折线图数据
    async getTrendChartData(selectedDate) {
        const connection = await this.getConnection();
        try {
            const today = new Date();
            const daysDiff = Math.floor((today - selectedDate) / (1000 * 60 * 60 * 24));
            
            let startOffset, endOffset;
            
            if (daysDiff < 15) {
                // 如果所选日期距离今天小于15天，显示前30-x天和后x天
                startOffset = 30 - daysDiff;
                endOffset = daysDiff;
            } else {
                // 正常情况下显示前15天和后15天
                startOffset = 15;
                endOffset = 15;
            }
            
            const dates = [];
            const sales = [];
            
            // 生成日期范围
            for (let i = -startOffset; i <= endOffset; i++) {
                const currentDate = new Date(selectedDate);
                currentDate.setDate(currentDate.getDate() + i);
                
                // 跳过未来日期
                if (currentDate > today) continue;
                
                const dateStr = this.formatDate(currentDate, 'yyyymmdd');
                const dateInt = parseInt(dateStr);
                
                const query = `
                    SELECT NVL(SUM(tot_amt_actual), 0) as daily_sales
                    FROM m_retail 
                    WHERE billdate = :date_num
                    AND c_store_id NOT IN (
                        SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                    )
                `;
                
                const result = await connection.execute(query, { date_num: dateInt });
                const dailySales = parseFloat(result.rows[0][0]) || 0;
                
                dates.push(this.formatDate(currentDate, 'mm-dd'));
                sales.push(dailySales);
            }
            
            return {
                dates: dates,
                sales: sales,
                selected_date: this.formatDate(selectedDate, 'mm-dd')
            };
            
        } finally {
            await connection.close();
        }
    }
    
    async getMemberAnalysis(selectedDate = null, analysisType = 'month') {
        const connection = await this.getConnection();
        try {
            // 使用传入的日期或当前日期
            let dateObj;
            if (selectedDate) {
                dateObj = new Date(selectedDate);
            } else {
                // 默认查询当前日期的数据
                dateObj = new Date();
            }
            
            const year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1;
            const day = dateObj.getDate();
            
            // 根据分析类型确定日期范围
            let currentStart, currentEnd, prevStart, prevEnd;
            
            if (analysisType === 'day') {
                // 日数据分析
                currentStart = parseInt(`${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`);
                currentEnd = currentStart;
                
                // 上一日
                const prevDayObj = new Date(dateObj);
                prevDayObj.setDate(prevDayObj.getDate() - 1);
                prevStart = parseInt(this.formatDate(prevDayObj, 'yyyymmdd'));
                prevEnd = prevStart;
                
            } else {
                // 月数据分析
                currentStart = parseInt(`${year}${month.toString().padStart(2, '0')}01`);
                const lastDay = new Date(year, month, 0).getDate();
                currentEnd = parseInt(`${year}${month.toString().padStart(2, '0')}${lastDay.toString().padStart(2, '0')}`);
                
                // 上月
                let prevMonth, prevYear;
                if (month === 1) {
                    prevMonth = 12;
                    prevYear = year - 1;
                } else {
                    prevMonth = month - 1;
                    prevYear = year;
                }
                
                prevStart = parseInt(`${prevYear}${prevMonth.toString().padStart(2, '0')}01`);
                const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
                prevEnd = parseInt(`${prevYear}${prevMonth.toString().padStart(2, '0')}${prevLastDay.toString().padStart(2, '0')}`);
            }
            
            console.log(`会员分析 - 分析类型: ${analysisType}, 当期范围: ${currentStart} - ${currentEnd}`);
            
            // 1. 获取当期新增会员数（需要检查c_vips表是否存在）
            let newMembers = 0;
            try {
                const newMemberQuery = `
                    SELECT COUNT(*) as new_members
                    FROM c_vips
                    WHERE enterdate >= :current_start AND enterdate <= :current_end
                `;
                const newMemberResult = await connection.execute(newMemberQuery, { 
                    current_start: currentStart, 
                    current_end: currentEnd 
                });
                newMembers = newMemberResult.rows[0][0] || 0;
            } catch (error) {
                console.log('c_vips表不存在或字段不匹配，使用0作为新增会员数');
                newMembers = 0;
            }
            
            // 2. 获取当期活跃会员数（有交易的会员）
            const activeMemberQuery = `
                SELECT COUNT(DISTINCT c_vip_id) as active_members
                FROM m_retail
                WHERE billdate >= :current_start AND billdate <= :current_end
                AND c_vip_id IS NOT NULL
                AND c_store_id NOT IN (
                    SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                )
            `;
            
            const activeMemberResult = await connection.execute(activeMemberQuery, { 
                current_start: currentStart, 
                current_end: currentEnd 
            });
            
            const activeMembers = activeMemberResult.rows[0][0] || 0;
            
            // 3. 获取会员销售占比
            const memberSalesQuery = `
                SELECT 
                    NVL(SUM(CASE WHEN c_vip_id IS NOT NULL THEN tot_amt_actual ELSE 0 END), 0) as member_sales,
                    NVL(SUM(tot_amt_actual), 0) as total_sales
                FROM m_retail
                WHERE billdate >= :current_start AND billdate <= :current_end
                AND c_store_id NOT IN (
                    SELECT id FROM c_store WHERE name LIKE '%仓库%' OR name LIKE '%库房%'
                )
            `;
            
            const memberSalesResult = await connection.execute(memberSalesQuery, { 
                current_start: currentStart, 
                current_end: currentEnd 
            });
            
            const memberSales = parseFloat(memberSalesResult.rows[0][0]) || 0;
            const totalSales = parseFloat(memberSalesResult.rows[0][1]) || 0;
            const memberSalesRatio = totalSales > 0 ? (memberSales / totalSales * 100) : 0;
            
            // 4. 获取上期数据用于计算增长率
            // 上期新增会员
            let prevNewMembers = 0;
            try {
                const prevNewMemberQuery = `
                    SELECT COUNT(*) as prev_new_members
                    FROM c_vips
                    WHERE enterdate >= :prev_start AND enterdate <= :prev_end
                `;
                const prevNewMemberResult = await connection.execute(prevNewMemberQuery, { 
                    prev_start: prevStart, 
                    prev_end: prevEnd 
                });
                prevNewMembers = prevNewMemberResult.rows[0][0] || 0;
            } catch (error) {
                prevNewMembers = 0;
            }
            
            // 上期活跃会员
            const prevActiveMemberResult = await connection.execute(activeMemberQuery, { 
                current_start: prevStart, 
                current_end: prevEnd 
            });
            
            const prevActiveMembers = prevActiveMemberResult.rows[0][0] || 0;
            
            // 上期会员销售占比
            const prevMemberSalesResult = await connection.execute(memberSalesQuery, { 
                current_start: prevStart, 
                current_end: prevEnd 
            });
            
            const prevMemberSales = parseFloat(prevMemberSalesResult.rows[0][0]) || 0;
            const prevTotalSales = parseFloat(prevMemberSalesResult.rows[0][1]) || 0;
            const prevMemberSalesRatio = prevTotalSales > 0 ? (prevMemberSales / prevTotalSales * 100) : 0;
            
            // 5. 计算增长率
            const safeGrowthRate = (current, previous) => {
                if (previous > 0) {
                    return ((current - previous) / previous) * 100;
                } else if (current > 0) {
                    return 100.0;
                } else {
                    return 0.0;
                }
            };
            
            const newMemberGrowth = safeGrowthRate(newMembers, prevNewMembers);
            const activeMemberGrowth = safeGrowthRate(activeMembers, prevActiveMembers);
            const memberRatioGrowth = safeGrowthRate(memberSalesRatio, prevMemberSalesRatio);
            
            console.log(`会员数据: 新增=${newMembers}(+${newMemberGrowth.toFixed(1)}%), 活跃=${activeMembers}(+${activeMemberGrowth.toFixed(1)}%), 销售占比=${memberSalesRatio.toFixed(1)}%(+${memberRatioGrowth.toFixed(1)}%)`);
            
            return {
                new_members: newMembers,
                active_members: activeMembers,
                member_sales_ratio: Math.round(memberSalesRatio * 10) / 10,
                new_member_growth: Math.round(newMemberGrowth * 10) / 10,
                active_member_growth: Math.round(activeMemberGrowth * 10) / 10,
                member_ratio_growth: Math.round(memberRatioGrowth * 10) / 10
            };
        } finally {
            await connection.close();
        }
    }
    
    async getDetailedMetrics(date = null, period = 'month') {
        const connection = await this.getConnection();
        try {
            // 使用传入的日期或当前日期
            let dateObj;
            if (date) {
                dateObj = new Date(date);
            } else {
                dateObj = new Date();
            }
            
            const year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1;
            const day = dateObj.getDate();
            
            let startDate, endDate;
            
            if (period === 'today') {
                startDate = parseInt(`${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`);
                endDate = startDate;
            } else if (period === 'week') {
                // 本周开始日期
                const weekStart = new Date(dateObj);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // 周日
                startDate = parseInt(this.formatDate(weekStart, 'yyyymmdd'));
                endDate = parseInt(this.formatDate(dateObj, 'yyyymmdd'));
            } else if (period === 'quarter') {
                // 本季度开始日期
                const quarterMonth = Math.floor((month - 1) / 3) * 3 + 1;
                startDate = parseInt(`${year}${quarterMonth.toString().padStart(2, '0')}01`);
                endDate = parseInt(this.formatDate(dateObj, 'yyyymmdd'));
            } else if (period === 'year') {
                startDate = parseInt(`${year}0101`);
                endDate = parseInt(this.formatDate(dateObj, 'yyyymmdd'));
            } else { // month
                startDate = parseInt(`${year}${month.toString().padStart(2, '0')}01`);
                const lastDay = new Date(year, month, 0).getDate();
                endDate = parseInt(`${year}${month.toString().padStart(2, '0')}${lastDay.toString().padStart(2, '0')}`);
            }
            
            // 获取详细指标
            const query = `
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
            `;
            
            const result = await connection.execute(query, { 
                start_date: startDate, 
                end_date: endDate 
            });
            
            return {
                period: period,
                total_sales: parseFloat(result.rows[0][0]) || 0,
                avg_order_value: parseFloat(result.rows[0][1]) || 0,
                total_orders: result.rows[0][2] || 0,
                active_stores: result.rows[0][3] || 0,
                total_quantity: result.rows[0][4] || 0,
                unique_customers: result.rows[0][5] || 0,
                avg_discount_rate: parseFloat(result.rows[0][6]) || 0,
                conversion_rate: 0, // 可以根据需要计算
                return_rate: 0,
                customer_satisfaction: 0
            };
        } finally {
            await connection.close();
        }
    }
    
    formatDate(date, format) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        switch (format) {
            case 'yyyymmdd':
                return `${year}${month}${day}`;
            case 'yyyy-mm-dd':
                return `${year}-${month}-${day}`;
            default:
                return `${year}${month}${day}`;
        }
    }
}

module.exports = SalesService; 
