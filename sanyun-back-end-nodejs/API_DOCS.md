# 三云零售系统 API 文档 - Node.js版本

## 基本信息

- **服务器地址**: http://localhost:5000
- **API版本**: v1.0.0
- **数据格式**: JSON

## 通用响应格式

### 成功响应
```json
{
    "success": true,
    "data": {
        // 具体数据
    }
}
```

### 错误响应
```json
{
    "success": false,
    "message": "错误信息"
}
```

## API 接口列表

### 1. 服务状态检查

**接口地址**: `GET /`

**描述**: 检查服务器运行状态

**响应示例**:
```json
{
    "message": "三云零售系统后端API",
    "status": "running"
}
```

### 2. 数据库连接测试

**接口地址**: `GET /api/test/db`

**描述**: 测试数据库连接状态并返回最近记录数

**响应示例**:
```json
{
    "success": true,
    "message": "数据库连接成功",
    "recent_records": 1234
}
```

### 3. 销售概览

**接口地址**: `GET /api/sales/overview`

**描述**: 获取销售概览数据，包括今日和本月的销售情况

**查询参数**:
- `date` (可选): 指定日期，格式为 YYYY-MM-DD
- `type` (可选): 分析类型，`day` 或 `month`，默认为 `month`

**响应示例**:
```json
{
    "success": true,
    "data": {
        "today_sales": 125000.50,
        "today_orders": 85,
        "today_growth": 12.5,
        "month_sales": 2850000.75,
        "month_orders": 1856,
        "month_growth": 8.3
    }
}
```

### 4. 店铺排行

**接口地址**: `GET /api/sales/stores`

**描述**: 获取店铺销售排行榜

**查询参数**:
- `limit` (可选): 返回店铺数量，默认为 10
- `date` (可选): 指定日期，格式为 YYYY-MM-DD
- `type` (可选): 分析类型，`day` 或 `month`，默认为 `month`

**响应示例**:
```json
{
    "success": true,
    "data": [
        {
            "name": "旗舰店",
            "sales": 156000.00,
            "orders": 120,
            "avg_order": 1300.00
        },
        {
            "name": "分店A",
            "sales": 98000.50,
            "orders": 85,
            "avg_order": 1152.95
        }
    ]
}
```

### 5. 销售指标

**接口地址**: `GET /api/sales/metrics`

**描述**: 获取详细的销售指标分析

**查询参数**:
- `date` (可选): 指定日期，格式为 YYYY-MM-DD
- `type` (可选): 分析类型，`day` 或 `month`，默认为 `month`

**响应示例**:
```json
{
    "success": true,
    "data": [
        {
            "name": "销售额",
            "value": 2850000.75,
            "unit": "元",
            "mom_change": 8.3,
            "yoy_change": 15.2
        },
        {
            "name": "折扣率",
            "value": 15.2,
            "unit": "%",
            "mom_change": -2.1,
            "yoy_change": 1.8
        },
        {
            "name": "客单价",
            "value": 1536.5,
            "unit": "元",
            "mom_change": 5.7,
            "yoy_change": -3.2
        },
        {
            "name": "活跃店铺",
            "value": 12,
            "unit": "家",
            "mom_change": 0,
            "yoy_change": 9.1
        },
        {
            "name": "连带率",
            "value": 1.85,
            "unit": "",
            "mom_change": 15.6,
            "yoy_change": 3.2
        }
    ]
}
```

### 6. 销售趋势

**接口地址**: `GET /api/sales/trend`

**描述**: 获取销售趋势分析数据

**查询参数**:
- `date` (可选): 指定日期，格式为 YYYY-MM-DD
- `type` (可选): 分析类型，`day` 或 `month`，默认为 `month`

**响应示例**:
```json
{
    "success": true,
    "data": {
        "daily_average_sales": 91935.5,
        "weekly_sales": 643548.5,
        "monthly_sales": 2850000.75,
        "daily_growth_rate": 2.1,
        "weekly_growth_rate": 5.8,
        "monthly_growth_rate": 8.3
    }
}
```

### 7. 会员分析

**接口地址**: `GET /api/members/analysis`

**描述**: 获取会员相关分析数据

**查询参数**:
- `date` (可选): 指定日期，格式为 YYYY-MM-DD
- `type` (可选): 分析类型，`day` 或 `month`，默认为 `month`

**响应示例**:
```json
{
    "success": true,
    "data": {
        "new_members": 156,
        "active_members": 1234,
        "member_sales_ratio": 68.5,
        "new_member_growth": 12.3,
        "active_member_growth": 5.7,
        "member_ratio_growth": 2.8
    }
}
```

### 8. 详细销售指标

**接口地址**: `GET /api/sales/detailed-metrics`

**描述**: 获取更详细的销售指标数据

**查询参数**:
- `date` (可选): 指定日期，格式为 YYYY-MM-DD
- `period` (可选): 时间周期，可选值：`today`, `week`, `month`, `quarter`, `year`，默认为 `month`

**响应示例**:
```json
{
    "success": true,
    "data": {
        "period": "month",
        "total_sales": 2850000.75,
        "avg_order_value": 1536.5,
        "total_orders": 1856,
        "active_stores": 12,
        "total_quantity": 5632,
        "unique_customers": 1234,
        "avg_discount_rate": 15.2,
        "conversion_rate": 0,
        "return_rate": 0,
        "customer_satisfaction": 0
    }
}
```

## 数据字段说明

### 销售概览字段
- `today_sales`: 今日销售额（元）
- `today_orders`: 今日订单数
- `today_growth`: 今日增长率（%）
- `month_sales`: 本月销售额（元）
- `month_orders`: 本月订单数
- `month_growth`: 本月增长率（%）

### 店铺排行字段
- `name`: 店铺名称
- `sales`: 销售额（元）
- `orders`: 订单数
- `avg_order`: 平均订单金额（元）

### 销售指标字段
- `name`: 指标名称
- `value`: 指标值
- `unit`: 单位
- `mom_change`: 环比变化（%）
- `yoy_change`: 同比变化（%）

### 销售趋势字段
- `daily_average_sales`: 日均销售额（元）
- `weekly_sales`: 周销售额（元）
- `monthly_sales`: 月销售额（元）
- `daily_growth_rate`: 日增长率（%）
- `weekly_growth_rate`: 周增长率（%）
- `monthly_growth_rate`: 月增长率（%）

### 会员分析字段
- `new_members`: 新增会员数
- `active_members`: 活跃会员数
- `member_sales_ratio`: 会员销售占比（%）
- `new_member_growth`: 新增会员增长率（%）
- `active_member_growth`: 活跃会员增长率（%）
- `member_ratio_growth`: 会员占比增长率（%）

## 错误码说明

- `500`: 服务器内部错误
- `400`: 请求参数错误
- `404`: 接口不存在

## 使用示例

### cURL 示例

```bash
# 获取销售概览
curl -X GET "http://localhost:5000/api/sales/overview"

# 获取店铺排行（前5名）
curl -X GET "http://localhost:5000/api/sales/stores?limit=5"

# 获取销售指标（按日分析）
curl -X GET "http://localhost:5000/api/sales/metrics?type=day"

# 测试数据库连接
curl -X GET "http://localhost:5000/api/test/db"
```

### JavaScript 示例

```javascript
// 获取销售概览
fetch('http://localhost:5000/api/sales/overview')
    .then(response => response.json())
    .then(data => console.log(data));

// 获取店铺排行
fetch('http://localhost:5000/api/sales/stores?limit=10&type=month')
    .then(response => response.json())
    .then(data => console.log(data));
```

## 注意事项

1. 所有时间相关的查询都基于数据库中的 `billdate` 字段
2. 仓库相关的店铺会被自动过滤掉
3. 日期格式必须为 `YYYY-MM-DD`
4. API支持CORS，可以从浏览器直接调用
5. 建议在生产环境中配置适当的CORS策略 