<script setup>

</script>

<template >
    <el-row :gutter="20" class="salses-section">
        <el-col :span="6">
            <el-card>
                <div class="top-card">
                    <el-icon class="card-icons"><Tickets /></el-icon>
                    <div class="card-content">
                        <p>今日订单总数</p>
                        <p>100</p>
                    </div>
                </div>
            </el-card>
        </el-col>
        <el-col :span="6">
            <el-card>
                <div class="top-card">
                    <el-icon class="card-icons"><Money /></el-icon>
                    <div class="card-content">
                        <p>今日销售总额</p>
                        <p>1000000</p>
                    </div>
                </div>
            </el-card>
        </el-col>
        <el-col :span="6">
            <el-card>
                <div class="top-card">
                    <el-icon class="card-icons"><Coin /></el-icon>
                    <div class="card-content">
                        <p>昨日销售总额</p>
                        <p>1000000</p>
                    </div>
                </div>
            </el-card>
        </el-col>
        <el-col :span="6">
            <el-card>
                <div class="top-card">
                    <el-icon class="card-icons"><DataLine /></el-icon>
                    <div class="card-content">
                        <p>近七天销售总额</p>
                        <p>1000000</p>
                    </div>
                </div>
            </el-card>
        </el-col>
    </el-row>
    <el-row class="shortcut-keys-section">
        <el-card>
            <div class="shortcut-keys">
                <div class="shortcut-keys-title">
                    <p>运营快捷入口</p>
                </div>
                <div class="shortcut-keys-items">
                    <div class="shortcut-keys-item">
                        <el-icon><DocumentAdd /></el-icon>
                        <p>新增商品</p>
                    </div>
                    <div class="shortcut-keys-item">
                        <el-icon><List /></el-icon>
                        <p>订单列表</p>
                    </div>
                    <div class="shortcut-keys-item">
                        <el-icon><User /></el-icon>
                        <p>用户管理</p>
                    </div>
                    <div class="shortcut-keys-item">
                        <el-icon><DataAnalysis /></el-icon>
                        <p>交易统计</p>
                    </div>
                    <div class="shortcut-keys-item">
                        <el-icon><Management /></el-icon>
                        <p>事务管理</p>
                    </div>
                    <div class="shortcut-keys-item">
                        <el-icon><Reading /></el-icon>
                        <p>报表管理</p>
                    </div>
                    <div class="shortcut-keys-item">
                        <el-icon><Reading /></el-icon>
                        <p>权限管理</p>
                    </div>
                </div>
            </div>
        </el-card>
    </el-row>
    <el-row class="sales-chart-section">
        <el-card>
            <!-- 模块标题 -->
            <div class="chart-title">
                <p>销售额统计分析</p>
            </div>
            
            <!-- 模块主体 -->
            <div class="chart-main">
                <!-- 左侧统计部分 -->
                <div class="chart-stats">
                    <div class="stat-item">
                        <p class="stat-label">本月销售额</p>
                        <p class="stat-value">850,000</p>
                    </div>
                    <div class="stat-item">
                        <p class="stat-label">本周销售额</p>
                        <p class="stat-value">220,000</p>
                    </div>
                </div>
    
                <!-- 右侧折线图部分 -->
                <div class="chart-content">
                    <!-- 切换按钮 -->
                    <div class="chart-switch">
                        <el-button-group>
                            <el-button size="small">本日</el-button>
                            <el-button size="small">本周</el-button>
                            <el-button size="small">本月</el-button>
                        </el-button-group>
                    </div>
                    <!-- 折线图占位区域 -->
                    <div class="chart-placeholder">
                        <!-- 实际使用时替换为ECharts等图表组件 -->
                        <p>折线图显示区域（示例数据）</p>
                    </div>
                </div>
            </div>
        </el-card>
    </el-row>
</template>

<style scoped lang="less">
.salses-section {
    margin-top: 20px;
    overflow: hidden;
    .top-card {
        display: flex;
        align-items: center;
        .card-icons {
            font-size: 70px;
            margin-right: 20px;
        }
        .card-content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            height: 100%;

            p:first-child {
                font-size: 24px;
                color: rgb(128, 128, 128);
                margin: 0;
            }
            p:last-child {
                font-size: 24px;
            }

        }
    }
}

.shortcut-keys-section {
    margin-top: 50px;
    width: 100%;
    .el-card {
            width: 100%;
            
        }
    /* 新增快捷入口模块样式 */
    .shortcut-keys {

        /* 标题样式 */
        .shortcut-keys-title {
            text-align: center;  /* 文字居中 */
            background-color: #f5f5f5;  /* 灰色背景 */
            padding: 12px;  /* 增加内边距 */
            margin-bottom: 16px;  /* 与下方内容间距 */
        }

        /* 快捷入口项容器 */
        .shortcut-keys-items {
            display: flex;  /* 一行排列 */
            flex-wrap: wrap;  /* 超出换行 */
            gap: 36px;  /* 项之间间距 */
            padding: 0 20px 20px;  /* 内边距 */
            justify-content: center;
        }

        /* 单个入口项 */
        .shortcut-keys-item {
            display: flex;
            flex-direction: column;  /* 图标文字上下排列 */
            align-items: center;  /* 内容居中 */
            min-width: 100px;  /* 最小宽度 */
            
            .el-icon {
                font-size: 28px;  /* 图标大小 */
                margin-bottom: 8px;  /* 图标与文字间距 */
            }
            
            p {
                margin: 0;  /* 清除默认边距 */
                font-size: 14px;
                text-align: center;  /* 文字居中 */
            }
        }
    }
}

.sales-chart-section {
    margin-top: 50px;
    .el-card {
        width: 100%;
        padding: 20px;
    }

    /* 标题样式 */
    .chart-title {
        background-color: #f5f5f5;  /* 灰色背景 */
        text-align: center;  /* 文字居中 */
        padding: 12px;
        margin-bottom: 20px;
        font-size: 16px;
        font-weight: 500;
    }

    /* 主体布局 */
    .chart-main {
        display: flex;
        gap: 30px;
    }

    /* 左侧统计部分 */
    .chart-stats {
        min-width: 200px;  /* 左侧固定宽度 */
        display: flex;
        flex-direction: column;
        gap: 20px;
        
        .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 15px;
            border: 1px solid #e4e7ed;  /* 浅边框 */
            border-radius: 4px;
            
            .stat-label {
                color: #606266;
                font-size: 14px;
                margin-bottom: 8px;
            }
            .stat-value {
                font-size: 18px;
                font-weight: bold;
                color: #303133;
            }
        }
    }

    /* 右侧图表部分 */
    .chart-content {
        flex: 1;  /* 占据剩余空间 */
        
        .chart-switch {
            display: flex;
            justify-content: flex-end;  /* 按钮右对齐 */
            margin-bottom: 15px;
        }
        
        .chart-placeholder {
            height: 300px;  /* 图表区域高度 */
            border: 1px solid #e4e7ed;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #909399;
        }
    }
}
</style>
