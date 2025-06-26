# 三云零售系统后端API - Node.js版本

这是三云零售系统后端API的Node.js版本，完全对应Python版本的功能。

## 项目结构

```
sanyun-back-end-nodejs/
├── app.js                    # 主应用程序入口
├── config.js                 # 配置文件
├── database.js               # 数据库管理
├── package.json              # 项目依赖配置
├── services/                 # 业务逻辑服务
│   └── salesService.js       # 销售服务
└── README.md                # 项目说明文档
```

## 功能特性

### API 接口

1. **销售概览** - `/api/sales/overview`
   - 获取今日销售额、订单数和增长率
   - 获取本月销售额、订单数和增长率

2. **店铺排行** - `/api/sales/stores`
   - 获取销售额排名前N的店铺
   - 支持日度和月度分析

3. **销售指标** - `/api/sales/metrics`
   - 获取详细的销售指标数据
   - 包括环比和同比增长

4. **销售趋势** - `/api/sales/trend`
   - 获取销售趋势分析数据
   - 支持日均、周均、月总计

5. **会员分析** - `/api/members/analysis`
   - 获取会员相关分析数据
   - 新增会员、活跃会员统计

6. **详细指标** - `/api/sales/detailed-metrics`
   - 获取详细的销售指标
   - 支持多种时间周期

7. **数据库测试** - `/api/test/db`
   - 测试数据库连接状态

### 数据库配置

- **用户名**: bosnds3
- **密码**: abc123  
- **主机**: 49.235.20.50
- **端口**: 8853
- **服务名**: orcl
- **数据库版本**: Oracle 11g

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件（可选，已有默认配置）:

```env
DB_USERNAME=bosnds3
DB_PASSWORD=abc123
DB_HOSTNAME=49.235.20.50
DB_PORT=8853
DB_SERVICE_NAME=orcl
NODE_ENV=development
PORT=5000
```

### 3. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务器将在 `http://localhost:5000` 启动。

## 依赖包

- **express**: Web应用框架
- **cors**: 跨域资源共享
- **oracledb**: Oracle数据库驱动
- **dotenv**: 环境变量管理

## API 使用示例

### 获取销售概览

```bash
curl http://localhost:5000/api/sales/overview
```

### 获取店铺排行

```bash
curl "http://localhost:5000/api/sales/stores?limit=10&type=month"
```

### 测试数据库连接

```bash
curl http://localhost:5000/api/test/db
```

## 技术特点

1. **异步处理**: 所有数据库操作使用async/await
2. **连接池**: 使用Oracle连接池提高性能
3. **错误处理**: 完善的错误处理和日志记录
4. **CORS支持**: 支持跨域请求
5. **环境配置**: 支持多环境配置

## 开发说明

- 项目使用ES6+语法
- 数据库查询使用参数化查询防止SQL注入
- 支持graceful shutdown
- 完全对应Python版本的API接口和返回格式

## 故障排除

### Oracle数据库连接问题

如果遇到 `NJS-138: connections to this database server version are not supported by node-oracledb in Thin mode` 错误：

#### 方法1：运行自动修复脚本
```bash
node fix-oracle.js
```

#### 方法2：手动修复
1. **降级到兼容版本**：
   ```bash
   npm uninstall oracledb
   npm install oracledb@5.5.0
   ```

2. **安装Oracle Instant Client 11.2**：
   - 下载地址：https://www.oracle.com/database/technologies/instant-client/downloads.html
   - 解压到：`E:\oracle\instantclient_11_2`

3. **设置环境变量**：
   ```bash
   set ORACLE_CLIENT_LIB_DIR=E:\oracle\instantclient_11_2
   ```

4. **测试连接**：
   ```bash
   node test-db-connection.js
   ```

#### 方法3：使用Thick模式
如果安装了Oracle Instant Client，应用会自动尝试使用Thick模式。

### 常见问题

**Q: 连接超时怎么办？**
A: 检查网络连接和防火墙设置，确保能访问 `49.235.20.50:8853`

**Q: 权限错误怎么办？**
A: 确认数据库用户名和密码正确，用户有足够权限

**Q: 端口被占用怎么办？**
A: 修改 `PORT` 环境变量或在启动时指定：`PORT=3000 npm start`

## 最近更新

### v1.0.1 (2024-12-20)
- 添加Oracle 11g兼容性支持
- 修复 NJS-138 错误
- 添加自动修复脚本
- 改进错误处理和诊断

### v1.0.0 (2024-12-20)
- 初始版本发布
- 完整实现所有Python版本的API接口
- 支持Oracle数据库连接和查询
- 添加完善的错误处理和日志记录 