# 三云零售通 Vue 版本

这是对Android应用"三云零售通"界面的Vue复现项目。

## 项目特点

- **技术栈**: Vue 3 + Vant UI + Vite
- **界面风格**: 移动端优先，橙色主题
- **功能模块**: 数据统计、销售分析、员工管理等
- **响应式设计**: 支持多设备适配

## 项目结构

```
sanyun-retail-vue/
├── src/
│   ├── views/
│   │   └── Home.vue          # 主页面
│   ├── App.vue               # 根组件
│   └── main.js              # 入口文件
├── index.html               # HTML模板
├── package.json             # 依赖配置
├── vite.config.js          # Vite配置
└── README.md               # 项目说明
```

## 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

## 运行项目

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

## 界面特性

### 1. 顶部导航
- 橙色主题背景
- 日期选择器
- 版本切换按钮
- 店铺信息卡片

### 2. 数据展示
- 员工销售排行表格
- 今日/本月销售统计卡片
- 指标表现对比表格
- 下拉刷新功能

### 3. 交互功能
- 日期选择弹窗
- 数据点击事件
- 滚动刷新
- 响应式布局

## 数据说明

当前使用的是模拟数据，包括：
- 员工销售数据
- 店铺信息
- 销售统计
- 指标表现

## 后续扩展

- [ ] 添加图表展示（ECharts）
- [ ] 增加更多页面路由
- [ ] 集成API接口
- [ ] 添加数据筛选功能
- [ ] 优化移动端体验

## 技术栈说明

- **Vue 3**: 前端框架，支持Composition API
- **Vant**: 移动端UI组件库
- **Vite**: 构建工具，快速开发
- **Vue Router**: 路由管理
- **CSS Grid**: 表格布局

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge
- 移动端浏览器 