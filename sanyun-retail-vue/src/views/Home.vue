<template>
  <div class="home-page">
    <!-- 顶部状态栏背景 -->
    <div class="status-bar-bg"></div>
    
    <!-- 简化的顶部区域 - 只显示当前时间 -->
    <div class="header-section">
      <div class="current-time">
        {{ currentTime }}
      </div>
    </div>

    <!-- 主要内容区域 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="main-content">
        
        <!-- 实时今日数据区域 -->
        <div class="today-section">
          <div class="section-header">
            <span class="section-title">今日实时数据</span>
            <div class="live-today" @click="showLiveToday">
              <span>实时今日</span>
              <van-icon name="arrow" color="#d9a145" size="12" />
            </div>
          </div>
          
          <!-- 店铺销售排行表头 -->
          <div class="table-header">
            <div class="table-cell">店名</div>
            <div class="table-cell">本日销售</div>
            <div class="table-cell">区域<br>排名</div>
            <div class="table-cell">本月销售</div>
            <div class="table-cell">区域<br>排名</div>
            <div class="table-cell">销售<br>占比%</div>
          </div>
          
          <!-- 店铺数据列表 -->
          <div class="employee-list">
            <div v-for="(store, index) in storeData" :key="store.store_id" class="employee-row">
              <div class="table-cell">{{ store.store_name }}</div>
              <div class="table-cell">{{ formatCurrency(store.today_sales) }}</div>
              <div class="table-cell">{{ store.today_rank }}</div>
              <div class="table-cell">{{ formatCurrency(store.month_sales) }}</div>
              <div class="table-cell">{{ store.month_rank }}</div>
              <div class="table-cell">{{ store.sales_percent }}%</div>
            </div>
          </div>
          
          <!-- 动态统计卡片区域 -->
          <div class="stats-cards">
            <div class="stat-card">
              <div class="card-title">今日销售统计</div>
              <div class="card-content">
                <div class="card-left">
                  <div class="stat-item">
                    <span class="stat-label">目标: {{ formatNumber(salesOverview.today.target) }}</span>
                    <span class="stat-unit">元</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">实际: {{ formatNumber(salesOverview.today.actual) }}</span>
                    <span class="stat-unit">元</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">完成率: {{ salesOverview.today.completion_rate }}%</span>
                  </div>
                </div>
                <div class="card-divider"></div>
                <div class="card-right">
                  <div class="main-value">{{ formatNumber(salesOverview.today.actual) }}</div>
                  <div class="sub-value">今日销售额</div>
                  <div class="trend-value">{{ salesOverview.today.growth_rate >= 0 ? '+' : '' }}{{ salesOverview.today.growth_rate }}%</div>
                </div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="card-title">本月销售统计</div>
              <div class="card-content">
                <div class="card-left">
                  <div class="stat-item">
                    <span class="stat-label">目标: {{ formatNumber(salesOverview.month.target) }}</span>
                    <span class="stat-unit">元</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">实际: {{ formatNumber(salesOverview.month.actual) }}</span>
                    <span class="stat-unit">元</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">完成率: {{ salesOverview.month.completion_rate }}%</span>
                  </div>
                </div>
                <div class="card-divider"></div>
                <div class="card-right">
                  <div class="main-value">{{ formatNumber(salesOverview.month.actual) }}</div>
                  <div class="sub-value">本月销售额</div>
                  <div class="trend-value">{{ salesOverview.month.growth_rate >= 0 ? '+' : '' }}{{ salesOverview.month.growth_rate }}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 本月指标表现 -->
        <div class="performance-section">
          <div class="section-header">
            <span class="section-title">本月指标表现</span>
            <div class="view-more" @click="viewMore">
              <span>查看更多</span>
              <van-icon name="arrow" color="#d9a145" size="12" />
            </div>
          </div>
          
          <!-- 动态指标表格 -->
          <div class="performance-table">
            <!-- 表头 -->
            <div class="perf-header">
              <div class="perf-cell">项目一</div>
              <div class="perf-cell">数值</div>
              <div class="perf-cell">同比%</div>
              <div class="perf-cell">环比%</div>
              <div class="perf-cell">项目二</div>
              <div class="perf-cell">数值</div>
              <div class="perf-cell">同比%</div>
              <div class="perf-cell">环比%</div>
            </div>
            
            <!-- 动态数据行 -->
            <div v-for="(row, index) in performanceRows" :key="index" class="perf-row">
              <div class="perf-cell">{{ row.item1.name }}</div>
              <div class="perf-cell">{{ row.item1.current }}</div>
              <div class="perf-cell" :class="getPercentageClass(row.item1.change_percent)">{{ row.item1.change_percent }}%</div>
              <div class="perf-cell" :class="getPercentageClass(row.item1.month_change)">{{ row.item1.month_change }}%</div>
              <div class="perf-cell">{{ row.item2.name }}</div>
              <div class="perf-cell">{{ row.item2.current }}</div>
              <div class="perf-cell" :class="getPercentageClass(row.item2.change_percent)">{{ row.item2.change_percent }}%</div>
              <div class="perf-cell" :class="getPercentageClass(row.item2.month_change)">{{ row.item2.month_change }}%</div>
            </div>
          </div>
        </div>
      </div>
    </van-pull-refresh>

    <!-- 底部导航栏 -->
    <van-tabbar v-model="activeBottomTab" @change="onTabChange">
      <van-tabbar-item icon="home-o" name="home">首页</van-tabbar-item>
      <van-tabbar-item icon="search" name="navigation">功能</van-tabbar-item>
      <van-tabbar-item icon="user-o" name="profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { showToast } from 'vant'

const router = useRouter()

// API基础URL
const API_BASE_URL = 'http://localhost:5000/api'

// 响应式数据
const refreshing = ref(false)
const activeBottomTab = ref('home')
const currentTime = ref('')
const timeInterval = ref(null)

// 当前日期
const currentDate = computed(() => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

// 更新当前时间
const updateCurrentTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  
  currentTime.value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 店铺数据
const storeData = ref([])

// 销售概览数据
const salesOverview = ref({
  today: {
    target: 50000,
    actual: 0,
    completion_rate: 0,
    orders: 0,
    growth_rate: 0
  },
  month: {
    target: 1500000,
    actual: 0,
    completion_rate: 0,
    orders: 0,
    growth_rate: 0
  }
})

// 销售指标数据
const salesMetrics = ref([])

// 处理后的指标行数据
const performanceRows = computed(() => {
  const rows = []
  for (let i = 0; i < salesMetrics.value.length; i += 2) {
    const item1 = salesMetrics.value[i]
    const item2 = salesMetrics.value[i + 1] || { name: '', current: '', change_percent: 0, month_change: 0 }
    rows.push({ item1, item2 })
  }
  return rows
})

// 加载销售概览数据
const loadSalesOverview = async () => {
  try {
    // 优先使用当前日期，如果没有数据则提示
    const params = new URLSearchParams({
      date: currentDate.value,
      type: 'month'
    });
    const response = await axios.get(`${API_BASE_URL}/sales/overview?${params}`)
    
    if (response.data.success) {
      const data = response.data.data
      
      // 更新今日销售统计
      salesOverview.value.today.target = 50000  // 目标值，可以从配置获取
      salesOverview.value.today.actual = data.today_sales || 0
      salesOverview.value.today.completion_rate = salesOverview.value.today.target > 0 ? 
        (salesOverview.value.today.actual / salesOverview.value.today.target * 100) : 0
      salesOverview.value.today.orders = data.today_orders || 0
      salesOverview.value.today.growth_rate = data.today_growth || 0
      
      // 更新本月销售统计
      salesOverview.value.month.target = 1500000  // 目标值，可以从配置获取
      salesOverview.value.month.actual = data.month_sales || 0
      salesOverview.value.month.completion_rate = salesOverview.value.month.target > 0 ? 
        (salesOverview.value.month.actual / salesOverview.value.month.target * 100) : 0
      salesOverview.value.month.orders = data.month_orders || 0
      salesOverview.value.month.growth_rate = data.month_growth || 0
      
      console.log('销售概览数据加载成功:', salesOverview.value)
    } else {
      throw new Error(response.data.message || '获取销售概览失败')
    }
  } catch (error) {
    console.error('获取销售概览失败:', error)
    showToast('加载销售概览数据失败')
  }
}

// 加载销售指标数据
const loadSalesMetrics = async () => {
  try {
    // 优先使用当前日期，如果没有数据则提示
    const params = new URLSearchParams({
      date: currentDate.value,
      type: 'month'
    });
    const response = await axios.get(`${API_BASE_URL}/sales/metrics?${params}`)
    
    if (response.data.success) {
      salesMetrics.value = response.data.data.map(metric => ({
        name: metric.name,
        current: formatMetricValue(metric.value, metric.unit),
        change_percent: metric.yoy_change || 0,
        month_change: metric.mom_change || 0
      }))
      console.log('销售指标数据加载成功:', salesMetrics.value)
    } else {
      throw new Error(response.data.message || '获取销售指标失败')
    }
  } catch (error) {
    console.error('获取销售指标失败:', error)
    showToast('加载销售指标数据失败')
    // 提供默认数据
    salesMetrics.value = [
      { name: '销售额', current: '0', change_percent: 0, month_change: 0 },
      { name: '折扣率', current: '15.2%', change_percent: -2.1, month_change: 1.8 },
      { name: '客单价', current: '0', change_percent: 0, month_change: 0 },
      { name: '销售附加', current: '85.6%', change_percent: 12.8, month_change: 6.4 },
      { name: '活跃店铺', current: '0', change_percent: 0, month_change: 0 },
      { name: '新客占比', current: '32.4%', change_percent: 8.9, month_change: -1.5 },
      { name: '会员回店', current: '68.5%', change_percent: 5.2, month_change: 8.7 },
      { name: '连带率', current: '1.85', change_percent: 15.6, month_change: 3.2 }
    ]
  }
}

// 加载店铺数据
const loadStoreData = async () => {
  try {
    // 优先使用当前日期，如果没有数据则提示
    const params = new URLSearchParams({
      date: currentDate.value,
      type: 'month',
      limit: 5
    });
    const response = await axios.get(`${API_BASE_URL}/sales/stores?${params}`)
    
    if (response.data.success) {
      storeData.value = response.data.data.map((store, index) => ({
        store_id: index + 1,
        store_name: store.name,
        today_sales: store.sales,
        today_rank: index + 1,
        month_sales: store.sales,
        month_rank: index + 1,
        sales_percent: 0 // 可以根据需要计算
      }))
      console.log('主页店铺数据加载成功:', storeData.value)
    } else {
      throw new Error(response.data.message || '获取店铺数据失败')
    }
  } catch (error) {
    console.error('主页获取店铺数据失败:', error)
    showToast('加载店铺数据失败')
    // 如果API失败，显示测试数据
    storeData.value = [
      { store_id: 1, store_name: '三云零售示例店', today_sales: 0, today_rank: 1, month_sales: 0, month_rank: 1, sales_percent: 0 },
      { store_id: 2, store_name: '李四店铺', today_sales: 0, today_rank: 2, month_sales: 0, month_rank: 2, sales_percent: 0 },
      { store_id: 3, store_name: '王五店铺', today_sales: 0, today_rank: 3, month_sales: 0, month_rank: 3, sales_percent: 0 }
    ]
  }
}

// 加载所有数据
const loadAllData = async () => {
  await Promise.all([
    loadSalesOverview(),
    loadSalesMetrics(),
    loadStoreData()
  ])
}

// 方法
const onRefresh = async () => {
  refreshing.value = true
  await loadAllData()
  refreshing.value = false
}

const showLiveToday = () => {
  router.push('/sales-analysis')
}

const viewMore = () => {
  router.push('/sales-analysis')
}

const onTabChange = (name) => {
  if (name === 'navigation') {
    router.push('/navigation')
  } else if (name === 'profile') {
    router.push('/profile')
  }
}

const getPercentageClass = (value) => {
  return value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0
  }).format(value)
}

const formatNumber = (value) => {
  return new Intl.NumberFormat('zh-CN').format(value)
}

// 格式化指标值显示
const formatMetricValue = (value, unit) => {
  if (value === null || value === undefined) return '0'
  
  if (unit === '元') {
    return value.toLocaleString()
  } else if (unit === '%') {
    return value.toFixed(1)
  } else if (unit === '家') {
    return Math.round(value).toString()
  } else {
    return value.toFixed(2)
  }
}

// 生命周期
onMounted(() => {
  updateCurrentTime()
  timeInterval.value = setInterval(updateCurrentTime, 1000) // 每秒更新时间
  loadAllData()
})

onBeforeUnmount(() => {
  if (timeInterval.value) {
    clearInterval(timeInterval.value)
  }
})
</script>

<style scoped>
.home-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.status-bar-bg {
  height: 24px;
  background-color: #d9a145;
}

.header-section {
  background-color: #d9a145;
  padding: 16px 20px;
  text-align: center;
}

.current-time {
  color: white;
  font-size: 18px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.main-content {
  margin: -5px 5px 0 5px;
}

.today-section {
  background-color: white;
  border-radius: 8px 8px 0 0;
  padding: 16px;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
}

.live-today, .view-more {
  display: flex;
  align-items: center;
  color: #d9a145;
  font-size: 15px;
  cursor: pointer;
}

.live-today span, .view-more span {
  margin-right: 5px;
}

.table-header {
  background-color: #fdf5e6;
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.5fr 1fr 0.5fr 0.6fr;
  border: 1px solid #ddd;
}

.table-cell {
  padding: 8px 4px;
  text-align: center;
  font-size: 12px;
  border-right: 1px solid #ddd;
  color: #333;
  line-height: 1.2;
}

.table-header .table-cell {
  background-color: #d9a145;
  color: white;
  font-weight: bold;
}

.employee-list {
  border: 1px solid #ddd;
  border-top: none;
}

.employee-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.5fr 1fr 0.5fr 0.6fr;
  border-bottom: 1px solid #ddd;
}

.employee-row:last-child {
  border-bottom: none;
}

.stats-cards {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.stat-card {
  flex: 1;
  background-color: #fdf5e6;
  border-radius: 4px;
  padding: 12px;
}

.card-title {
  font-size: 15px;
  color: #333;
  text-align: center;
  margin-bottom: 8px;
}

.card-content {
  display: flex;
  align-items: stretch;
}

.card-left {
  flex: 1;
  padding-right: 10px;
}

.stat-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
}

.stat-label {
  color: #333;
}

.stat-unit {
  color: #999;
  font-size: 12px;
  margin-left: 2px;
}

.card-divider {
  width: 1px;
  background-color: #e5e5e5;
  margin: 0 8px;
}

.card-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.main-value {
  font-size: 18px;
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 4px;
}

.sub-value {
  font-size: 13px;
  color: #333;
  margin-bottom: 4px;
}

.trend-value {
  font-size: 15px;
  font-weight: bold;
  color: #4caf50;
}

.performance-section {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
}

.performance-table {
  border: 1px solid #999;
  border-radius: 4px;
  overflow: hidden;
}

.perf-header {
  background-color: #d9a145;
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr 1.2fr 1fr 1fr 1fr;
}

.perf-cell {
  padding: 8px 4px;
  text-align: center;
  font-size: 13px;
  border-right: 1px solid #999;
  line-height: 1.2;
}

.perf-header .perf-cell {
  color: white;
  font-weight: bold;
}

.perf-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr 1.2fr 1fr 1fr 1fr;
  background-color: white;
  border-bottom: 1px solid #999;
}

.perf-row:last-child {
  border-bottom: none;
}

.perf-row .perf-cell {
  color: #333;
}

.positive {
  color: #f56c6c !important;
}

.negative {
  color: #f56c6c !important;
}

.neutral {
  color: #333 !important;
}

/* 移除最后一列的右边框 */
.table-cell:last-child,
.perf-cell:last-child {
  border-right: none;
}
</style> 