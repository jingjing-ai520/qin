# 三云零售通后端API服务

本项目为三云零售通前端提供数据API服务，基于Flask框架开发，连接Oracle数据库获取实时销售数据。

## 📊 项目概述

- **框架**: Flask 2.3.3
- **数据库**: Oracle 11g (hostname: 49.235.20.50:8853)
- **架构**: RESTful API服务
- **功能**: 销售数据统计、店铺排行、指标分析

## 🗂️ 目录结构

```
sanyun-back-end/
├── app.py                    # Flask应用主文件
├── config.py                 # 配置文件
├── database.py              # 数据库连接管理
├── services/               # 业务服务层
│   └── sales_service.py    # 销售数据服务
├── requirements.txt        # Python依赖包
├── .env.example           # 环境变量示例
└── README.md              # 项目说明文档
```

## 🚀 快速开始

### 1. 环境准备

确保已安装Python 3.8+和Oracle客户端。

### 2. 安装依赖

```bash
cd sanyun-back-end
pip install -r requirements.txt
```

### 3. 配置环境

复制`.env.example`为`.env`并配置数据库连接：

```bash
cp .env.example .env
```

编辑`.env`文件设置数据库连接参数。

### 4. 启动服务

```bash
python app.py
```

服务将在 `http://localhost:5000` 启动。

## 📝 API接口文档

### 销售概览

**GET** `/api/sales/overview`

**参数:**
- `date` (可选): 查询日期，格式YYYY-MM-DD，默认今天

**响应示例:**
```json
{
  "success": true,
  "today": {
    "target": 50000,
    "actual": 42850,
    "completion_rate": 85.7,
    "orders": 156,
    "growth_rate": 12.5
  },
  "month": {
    "target": 1500000,
    "actual": 1285460,
    "completion_rate": 85.6,
    "orders": 1856,
    "growth_rate": 8.3
  }
}
```

### 店铺销售排行

**GET** `/api/sales/stores`

**参数:**
- `date` (可选): 查询日期，格式YYYY-MM-DD，默认今天
- `limit` (可选): 返回条数，默认10

**响应示例:**
```json
{
  "success": true,
  "stores": [
    {
      "store_name": "王五店",
      "store_id": 3,
      "today_sales": 9120,
      "month_sales": 142560,
      "today_rank": 2,
      "month_rank": 1,
      "sales_percent": 18.5
    }
  ],
  "date": "2024-01-15",
  "total_count": 10
}
```

### 销售指标

**GET** `/api/sales/metrics`

**参数:**
- `date` (可选): 查询日期，格式YYYY-MM-DD，默认今天

**响应示例:**
```json
{
  "success": true,
  "metrics": [
    {
      "name": "销售额",
      "current": "1,285,460",
      "change_percent": 8.3,
      "month_change": 12.5
    }
  ],
  "date": "2024-01-15"
}
```

### 健康检查

**GET** `/api/health`

**响应示例:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00",
  "version": "1.0.0"
}
```

## 🔧 核心功能模块

### 数据库管理 (database.py)
- **DatabaseManager类**: 管理Oracle数据库连接
- **连接池**: 自动管理数据库连接生命周期
- **查询封装**: 提供便捷的查询方法

### 销售服务 (services/sales_service.py)
- **SalesService类**: 销售数据业务逻辑
- **日销售统计**: 获取当日销售概览数据
- **月销售统计**: 获取当月销售汇总数据
- **店铺排行**: 按销售额对店铺进行排名
- **指标分析**: 计算各项销售指标和同比环比

### API路由 (app.py)
- **RESTful设计**: 符合REST规范的API接口
- **错误处理**: 统一的错误响应格式
- **跨域支持**: 配置CORS允许前端访问
- **参数验证**: 输入参数校验和默认值处理

## 🎯 近期功能更新

### v1.0.0 (2025-01-20)
- ✅ 完成基础API框架搭建
- ✅ 实现销售概览数据接口
- ✅ 完成店铺销售排行功能
- ✅ 添加销售指标分析接口
- ✅ 集成Oracle数据库连接

### v1.1.0 (计划)
- 🔄 增加缓存机制提升性能
- 🔄 添加数据权限控制
- 🔄 实现数据导出功能
- 🔄 完善日志记录系统

## 📞 数据库连接信息

```python
# 连接配置 (通过环境变量配置)
DATABASE_CONFIG = {
    'username': 'bosnds3',      # 用户名
    'password': 'abc123',       # 密码  
    'hostname': '49.235.20.50', # 主机地址
    'port': 8853,               # 端口
    'service_name': 'orcl'      # 服务名
}
```

## 🔍 主要数据表

| 表名 | 说明 | 用途 |
|------|------|------|
| **app_dayretail** | 日销售汇总表 | 存储每日销售统计数据 |
| **c_store** | 店铺基础信息表 | 存储店铺名称、地址等信息 |
| **c_customer** | 客户信息表 | 存储客户基础信息 |

## ⚠️ 注意事项

1. **Oracle客户端**: 确保已正确安装Oracle Instant Client
2. **网络连接**: 确保服务器能访问Oracle数据库
3. **权限配置**: 数据库用户需要有相应表的查询权限
4. **环境变量**: 生产环境请使用环境变量配置敏感信息
5. **跨域配置**: 根据前端部署地址调整CORS配置

## 🤝 开发说明

本项目采用分层架构设计：
- **表现层**: Flask路由处理HTTP请求
- **业务层**: Service类处理业务逻辑
- **数据层**: DatabaseManager处理数据库操作

这种设计便于测试、维护和扩展，确保代码的可读性和可维护性。 