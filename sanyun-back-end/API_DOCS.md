# 三云零售管理系统 API 文档

## 数据库配置

```python
DB_CONFIG = {
    'user': 'bosnds3',
    'password': 'abc123',
    'dsn': '49.235.20.50:8853/orcl'
}
```

## API 端点概览

### 基础销售API
- `/api/sales/overview` - 销售概览
- `/api/sales/stores` - 店铺排行
- `/api/sales/metrics` - 销售指标

### 扩展销售API  
- `/api/sales/trend` - 销售趋势数据
- `/api/sales/detailed-metrics` - 详细指标查询

### 会员分析API
- `/api/members/analysis` - 会员分析数据

## API 详细文档

### 1. 销售概览
```
GET /api/sales/overview
```

**描述**: 获取今日和本月的销售概览数据

**返回格式**:
```json
{
  "success": true,
  "data": {
    "today_sales": 0,
    "today_orders": 0,
    "today_growth": 0.0,
    "month_sales": 0,
    "month_orders": 0,
    "month_growth": 0.0
  }
}
```

**字段说明**:
- `today_sales`: 今日销售额
- `today_orders`: 今日订单数
- `today_growth`: 今日销售增长率（相比昨日）
- `month_sales`: 本月销售额
- `month_orders`: 本月订单数
- `month_growth`: 本月销售增长率（相比上月）

### 2. 店铺排行
```
GET /api/sales/stores?limit=10
```

**参数**:
- `limit` (可选): 返回店铺数量，默认10

**描述**: 获取店铺销售排行榜

**返回格式**:
```json
{
  "success": true,
  "data": [
    {
      "name": "店铺名称",
      "sales": 销售额,
      "orders": 订单数,
      "avg_order": 客单价,
      "growth": 增长率
    }
  ]
}
```

**字段说明**:
- `name`: 店铺名称
- `sales`: 销售额
- `orders`: 订单数
- `avg_order`: 客单价
- `growth`: 销售增长率

### 3. 销售指标
```
GET /api/sales/metrics
```

**描述**: 获取核心销售指标

**返回格式**:
```json
{
  "success": true,
  "data": [
    {
      "name": "指标名称",
      "value": "指标值",
      "unit": "单位",
      "mom_change": 环比变化,
      "yoy_change": 同比变化
    }
  ]
}
```

**核心指标包括**:
- 销售额
- 折扣率
- 客单价
- 销售附加
- 活跃店铺
- 新客占比
- 会员回店率
- 连带率

### 4. 销售趋势
```
GET /api/sales/trend
```

**描述**: 获取销售趋势分析数据

**返回格式**:
```json
{
  "success": true,
  "data": {
    "daily_average_sales": 日均销售额,
    "weekly_sales": 周销售额,
    "monthly_sales": 月销售额,
    "daily_growth_rate": 日均增长率,
    "weekly_growth_rate": 周增长率,
    "monthly_growth_rate": 月增长率
  }
}
```

### 5. 详细指标查询
```
GET /api/sales/detailed-metrics?period=month&date=2024-12-20
```

**参数**:
- `period` (可选): 分析周期，可选值：today、week、month、quarter、year，默认month
- `date` (可选): 指定日期，格式：YYYY-MM-DD，默认当前日期

**描述**: 根据指定周期获取详细销售指标

**返回格式**:
```json
{
  "success": true,
  "data": {
    "period": "分析周期",
    "total_sales": 总销售额,
    "avg_order_value": 平均订单价值,
    "total_orders": 总订单数,
    "active_stores": 活跃店铺数,
    "total_quantity": 总商品数量,
    "unique_customers": 唯一客户数,
    "avg_discount_rate": 平均折扣率
  }
}
```

### 6. 会员分析
```
GET /api/members/analysis
```

**描述**: 获取会员相关分析数据

**返回格式**:
```json
{
  "success": true,
  "data": {
    "new_members": 新增会员数,
    "active_members": 活跃会员数,
    "member_sales_ratio": 会员销售占比,
    "new_member_growth": 新增会员增长率,
    "active_member_growth": 活跃会员增长率,
    "member_ratio_growth": 会员销售占比增长率
  }
}
```

## 错误处理

所有API调用失败时返回格式：
```json
{
  "success": false,
  "error": "错误描述信息"
}
```

## 数据库表结构说明

### 核心表
- `m_retail`: 零售交易主表
- `c_store`: 店铺信息表
- `c_vips`: 会员信息表
- `m_retailitem`: 零售交易明细表

### 关键字段
- `billdate`: 交易日期（数字格式：YYYYMMDD）
- `tot_amt_actual`: 实际销售金额
- `isactive`: 数据状态标识
- `status`: 记录状态
- `c_store_id`: 店铺ID
- `c_vip_id`: 会员ID

## 性能优化说明

1. **日期格式**: 使用数字格式（YYYYMMDD）避免Oracle日期函数开销
2. **店铺过滤**: 排除仓库类型店铺，专注零售业务
3. **连接池**: 优化数据库连接管理
4. **索引优化**: 基于billdate和store_id的查询优化

## 版本历史

### v1.3 (2024-12-20)
- 新增销售趋势API
- 新增会员分析API
- 新增详细指标查询API
- 支持多周期数据分析

### v1.2 (2024-12-15)
- 修复增长率计算问题
- 优化数据库查询性能
- 完善错误处理机制

### v1.1 (2024-12-10)
- 实现动态数据计算
- 添加核心销售指标
- 优化API响应格式

### v1.0 (2024-12-01)
- 基础销售概览API
- 店铺排行API
- 初始版本发布 