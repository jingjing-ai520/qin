<template>
  <div class="sales-analysis-page">
    <!-- 顶部状态栏背景 -->
    <div class="status-bar-bg"></div>
    
    <!-- 顶部导航栏 -->
    <div class="nav-header">
      <van-nav-bar
        title="销售分析"
        left-text="返回"
        left-arrow
        @click-left="goBack"
        :style="{ backgroundColor: '#d9a145', color: 'white' }"
      />
    </div>

    <!-- 加载状态 -->
    <van-loading v-if="loading" type="spinner" color="#d9a145" vertical>
      正在加载数据...
    </van-loading>

    <div class="main-content" v-else>
      <!-- 分析设置区域 -->
      <div class="filter-section">
        <van-cell-group inset>
          <van-field
            v-model="analysisTypeDisplay"
            readonly
            label="分析类型"
            placeholder="选择分析类型"
            @click="showAnalysisTypePicker = true"
            input-align="right"
          />
          <van-field
            v-model="selectedDateDisplay"
            readonly
            label="具体时间"
            placeholder="选择具体时间"
            @click="openDateSelector"
            input-align="right"
          />
        </van-cell-group>
        

      </div>

      <!-- 销售概览卡片 -->
      <div class="overview-section">
        <div class="overview-card">
          <div class="card-header">
            <h3>销售概览</h3>
            <div class="date-range">{{ dateRangeText }}</div>
          </div>
          
          <div class="overview-stats">
            <div class="stat-item">
              <div class="stat-value">{{ formatCurrency(todaySales.actual) }}</div>
              <div class="stat-label">今日销售额</div>
              <div class="growth-rate" :class="getChangeClass(todaySales.growth_rate)">
                {{ formatPercentage(todaySales.growth_rate) }}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ todaySales.orders }}</div>
              <div class="stat-label">今日订单数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ formatCurrency(averageOrderValue) }}</div>
              <div class="stat-label">客单价</div>
            </div>
          </div>

          <div class="summary-stats">
            <div class="summary-item">
              <span>本月销售额</span>
              <div>
                <span class="summary-value">{{ formatCurrency(monthlySales.actual) }}</span>
                <span class="growth-rate" :class="getChangeClass(monthlySales.growth_rate)">
                  {{ formatPercentage(monthlySales.growth_rate) }}
                </span>
              </div>
            </div>
            <div class="summary-item">
              <span>本月完成率</span>
              <div>
                <span class="summary-value">{{ monthlySales.completion_rate.toFixed(1) }}%</span>
              </div>
            </div>
            <div class="summary-item">
              <span>本月订单数</span>
              <div>
                <span class="summary-value">{{ monthlySales.orders }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 销售趋势分析 -->
      <div class="trend-section">
        <div class="trend-card">
          <div class="card-header">
            <h3>销售趋势</h3>
          </div>
          
          <div class="trend-metrics">
            <div class="metric-item">
              <div class="metric-title">日均销售额</div>
              <div class="metric-value">{{ formatCurrency(dailyAverageSales) }}</div>
              <div class="metric-compare" :class="getChangeClass(dailyGrowthRate)">
                环比 {{ formatPercentage(dailyGrowthRate) }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-title">周销售额</div>
              <div class="metric-value">{{ formatCurrency(weeklySales) }}</div>
              <div class="metric-compare" :class="getChangeClass(weeklyGrowthRate)">
                环比 {{ formatPercentage(weeklyGrowthRate) }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-title">月销售额</div>
              <div class="metric-value">{{ formatCurrency(monthlySales.actual) }}</div>
              <div class="metric-compare" :class="getChangeClass(monthlySales.growth_rate)">
                同比 {{ formatPercentage(monthlySales.growth_rate) }}
              </div>
            </div>
          </div>
          
          <!-- 添加折线图 -->
          <div class="trend-chart-container">
            <div class="chart-title">近期销售趋势 (近31天)</div>
            <div class="chart-wrapper" v-if="trendChartData.dates.length > 0">
              <v-chart 
                class="trend-chart" 
                :option="chartOption" 
                autoresize
              />
            </div>
            <div v-else class="chart-empty">
              <van-empty description="暂无图表数据" />
            </div>
          </div>
        </div>
      </div>

      <!-- 店铺排行榜 -->
      <div class="ranking-section">
        <div class="ranking-card">
          <div class="card-header">
            <h3>店铺排行榜</h3>
            <van-button size="small" plain @click="viewMoreRanking">查看更多</van-button>
          </div>
          
          <div class="ranking-list">
            <div v-for="(store, index) in storeRanking" :key="store.name" class="ranking-item">
              <div class="rank-number" :class="{ 'top-rank': index < 3 }">{{ index + 1 }}</div>
              <div class="store-info">
                <div class="store-name">{{ store.name }}</div>
                <div class="store-details">
                  订单：{{ store.orders }} | 客单价：{{ formatCurrency(store.avg_order) }}
                </div>
              </div>
              <div class="store-sales">
                <div class="sales-amount">{{ formatCurrency(store.sales) }}</div>
                <div class="sales-trend" :class="getChangeClass(store.growth || 0)">
                  {{ formatPercentage(store.growth || 0) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 销售指标分析 -->
      <div class="metrics-section">
        <div class="metrics-card">
          <div class="card-header">
            <h3>核心指标分析</h3>
            <van-button size="small" plain @click="viewMoreMetrics">详细报告</van-button>
          </div>
          
          <div class="metrics-grid">
            <div v-for="metric in salesMetrics" :key="metric.name" class="metric-card">
              <div class="metric-header">
                <span class="metric-name">{{ metric.name }}</span>
                <van-icon name="info-o" size="14" color="#999" />
              </div>
              <div class="metric-value-main">{{ metric.current }}</div>
              <div class="metric-changes">
                <div class="change-item">
                  <span class="change-label">同比</span>
                  <span class="change-value" :class="getChangeClass(metric.change_percent)">
                    {{ formatPercentage(metric.change_percent) }}
                  </span>
                </div>
                <div class="change-item">
                  <span class="change-label">环比</span>
                  <span class="change-value" :class="getChangeClass(metric.month_change)">
                    {{ formatPercentage(metric.month_change) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 会员分析 -->
      <div class="member-section">
        <div class="member-card">
          <div class="card-header">
            <h3>会员分析</h3>
          </div>
          
          <div class="member-stats">
            <div class="member-stat">
              <div class="stat-title">新增会员</div>
              <div class="stat-number">{{ newMembers }}</div>
              <div class="stat-change" :class="getChangeClass(newMemberGrowth)">
                {{ formatPercentage(newMemberGrowth) }}
              </div>
            </div>
            <div class="member-stat">
              <div class="stat-title">活跃会员</div>
              <div class="stat-number">{{ activeMembers }}</div>
              <div class="stat-change" :class="getChangeClass(activeMemberGrowth)">
                {{ formatPercentage(activeMemberGrowth) }}
              </div>
            </div>
            <div class="member-stat">
              <div class="stat-title">会员销售占比</div>
              <div class="stat-number">{{ memberSalesRatio }}%</div>
              <div class="stat-change" :class="getChangeClass(memberRatioGrowth)">
                {{ formatPercentage(memberRatioGrowth) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分析类型选择器 -->
    <van-popup 
      v-model:show="showAnalysisTypePicker" 
      position="bottom"
    >
      <van-picker
        :columns="analysisTypeColumns"
        title="选择分析类型"
        @confirm="onAnalysisTypeConfirm"
        @cancel="() => showAnalysisTypePicker = false"
      />
    </van-popup>

          <!-- 日期选择器 -->
      <van-popup 
        :show="showDatePicker" 
        @update:show="val => showDatePicker = val"
        position="bottom"
      >
        <van-date-picker
          v-model="currentDate"
          title="选择具体日期"
          :min-date="minDate"
          :max-date="maxDate"
          @confirm="onDateConfirm"
          @cancel="() => showDatePicker = false"
        />
      </van-popup>

      <!-- 月份选择器 -->
      <van-popup 
        :show="showMonthPicker"
        @update:show="val => showMonthPicker = val" 
        position="bottom"
      >
        <van-date-picker
          v-model="currentDate"
          type="year-month"
          title="选择月份"
          :min-date="minDate"
          :max-date="maxDate"
          @confirm="onMonthConfirm"
          @cancel="() => showMonthPicker = false"
        />
      </van-popup>



    <!-- 底部导航栏 -->
    <van-tabbar v-model="activeBottomTab" @change="onTabChange">
      <van-tabbar-item icon="home-o" name="home">首页</van-tabbar-item>
      <van-tabbar-item icon="search" name="navigation">功能</van-tabbar-item>
      <van-tabbar-item icon="user-o" name="profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { showToast } from 'vant'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'

// 注册必要的组件
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// 注册VChart组件
import { defineAsyncComponent } from 'vue'

const router = useRouter()
const activeBottomTab = ref('navigation')

// API基础URL
const API_BASE_URL = 'http://localhost:5000/api'

// 响应式数据
const loading = ref(false)
const selectedDate = ref(new Date().toISOString().split('T')[0]) // 使用当前日期
// 设置currentDate为当前日期的数组格式
const now = new Date()
const currentDate = ref([now.getFullYear(), now.getMonth() + 1, now.getDate()])
const analysisType = ref('month')
const showAnalysisTypePicker = ref(false)
const showDatePicker = ref(false)
const showMonthPicker = ref(false)

// 设置日期选择器的范围（2020年1月1日到今天）
const minDate = new Date(2020, 0, 1)
const maxDate = new Date()

// 销售数据
const todaySales = ref({
  target: 50000,
  actual: 0,
  completion_rate: 0,
  orders: 0,
  growth_rate: 0
})

const monthlySales = ref({
  target: 1500000,
  actual: 0,
  completion_rate: 0,
  orders: 0,
  growth_rate: 0
})

const storeRanking = ref([])
const salesMetrics = ref([])

// 趋势数据
const dailyAverageSales = ref(0)
const weeklySales = ref(0)
const dailyGrowthRate = ref(0)
const weeklyGrowthRate = ref(0)

// 会员数据
const newMembers = ref(0)
const activeMembers = ref(0)
const memberSalesRatio = ref(0)
const newMemberGrowth = ref(0)
const activeMemberGrowth = ref(0)
const memberRatioGrowth = ref(0)

// 折线图数据
const trendChartData = ref({
  dates: [],
  sales: [],
  selected_date: ''
})

// 分析类型选择选项
const analysisTypeColumns = [
  { text: '日数据分析', value: 'day' },
  { text: '月数据分析', value: 'month' }
]

// 计算属性
const analysisTypeDisplay = computed(() => {
  const typeMap = {
    'day': '日数据分析',
    'month': '月数据分析'
  }
  return typeMap[analysisType.value] || '月数据分析'
})

const selectedDateDisplay = computed(() => {
  const date = new Date(selectedDate.value)
  if (analysisType.value === 'day') {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } else if (analysisType.value === 'month') {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long'
    })
  }
  return date.toLocaleDateString('zh-CN')
})

const dateRangeText = computed(() => {
  const date = new Date(selectedDate.value)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
})

const averageOrderValue = computed(() => {
  return todaySales.value.orders > 0 ? todaySales.value.actual / todaySales.value.orders : 0
})

// 图表配置选项
const chartOption = computed(() => {
  if (!trendChartData.value.dates.length) return {}
  
  // 找到所选日期的索引
  const selectedIndex = trendChartData.value.dates.findIndex(
    date => date === trendChartData.value.selected_date
  )
  
  return {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const data = params[0]
        return `${data.name}<br/>销售额: ¥${(data.value || 0).toLocaleString()}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: trendChartData.value.dates,
      axisLabel: {
        fontSize: 10,
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: function(value) {
          if (value >= 10000) {
            return Math.round(value / 10000) + '万'
          }
          return value
        },
        fontSize: 10,
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    series: [{
      name: '销售额',
      type: 'line',
      data: trendChartData.value.sales.map((value, index) => ({
        value: value,
        itemStyle: index === selectedIndex ? {
          color: '#ff6b6b',
          borderWidth: 3
        } : {
          color: '#d9a145'
        }
      })),
      smooth: true,
      lineStyle: {
        color: '#d9a145',
        width: 2
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: 'rgba(217, 161, 69, 0.3)'
          }, {
            offset: 1, color: 'rgba(217, 161, 69, 0.05)'
          }]
        }
      }
    }]
  }
})

// 方法
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatPercentage = (value) => {
  if (value === null || value === undefined || value === 0) return '0.0%'
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

const getChangeClass = (change) => {
  return change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
}

// 加载销售概览数据
const fetchSalesOverview = async () => {
  try {
    console.log('开始获取销售概览...', { date: selectedDate.value, type: analysisType.value })
    const params = new URLSearchParams({
      date: selectedDate.value,
      type: analysisType.value
    })
    const response = await axios.get(`${API_BASE_URL}/sales/overview?${params}`)
    
    if (response.data.success) {
      const data = response.data.data
      
      // 更新今日销售统计
      todaySales.value.actual = data.today_sales || 0
      todaySales.value.orders = data.today_orders || 0
      todaySales.value.growth_rate = data.today_growth || 0
      todaySales.value.completion_rate = todaySales.value.target > 0 ? 
        (todaySales.value.actual / todaySales.value.target * 100) : 0
      
      // 更新本月销售统计
      monthlySales.value.actual = data.month_sales || 0
      monthlySales.value.orders = data.month_orders || 0
      monthlySales.value.growth_rate = data.month_growth || 0
      monthlySales.value.completion_rate = monthlySales.value.target > 0 ? 
        (monthlySales.value.actual / monthlySales.value.target * 100) : 0
      
      console.log('销售概览数据更新成功')
    } else {
      throw new Error(response.data.message || '获取销售概览失败')
    }
  } catch (error) {
    console.error('获取销售概览失败:', error)
    showToast(`获取销售概览失败: ${error.message}`)
  }
}

// 加载店铺排行数据
const fetchStoreRanking = async () => {
  try {
    console.log('开始获取店铺排行...', { date: selectedDate.value, type: analysisType.value })
    const params = new URLSearchParams({
      date: selectedDate.value,
      type: analysisType.value,
      limit: 10
    })
    const response = await axios.get(`${API_BASE_URL}/sales/stores?${params}`)
    
    if (response.data.success) {
      storeRanking.value = response.data.data.map((store, index) => ({
        name: store.name,
        sales: store.sales,
        orders: store.orders,
        avg_order: store.avg_order,
        growth: 0 // 暂时设为0，后续可以计算实际增长率
      }))
      console.log('店铺排行数据更新成功')
    } else {
      throw new Error(response.data.message || '获取店铺排行失败')
    }
  } catch (error) {
    console.error('获取店铺排行失败:', error)
    showToast(`获取店铺排行失败: ${error.message}`)
  }
}

// 加载销售指标数据
const fetchSalesMetrics = async () => {
  try {
    console.log('开始获取销售指标...', { date: selectedDate.value, type: analysisType.value })
    const params = new URLSearchParams({
      date: selectedDate.value,
      type: analysisType.value
    })
    const response = await axios.get(`${API_BASE_URL}/sales/metrics?${params}`)
    
    if (response.data.success) {
      salesMetrics.value = response.data.data.map(metric => ({
        name: metric.name,
        current: formatMetricValue(metric.value, metric.unit),
        change_percent: metric.yoy_change || 0,
        month_change: metric.mom_change || 0
      }))
      console.log('销售指标数据更新成功')
    } else {
      throw new Error(response.data.message || '获取销售指标失败')
    }
  } catch (error) {
    console.error('获取销售指标失败:', error)
    showToast(`获取销售指标失败: ${error.message}`)
  }
}

// 格式化指标值
const formatMetricValue = (value, unit) => {
  if (value === null || value === undefined) return '0'
  
  if (unit === '元') {
    return value.toLocaleString()
  } else if (unit === '%') {
    return `${value.toFixed(1)}%`
  } else if (unit === '家') {
    return Math.round(value).toString()
  } else {
    return value.toFixed(2)
  }
}

// 加载销售趋势数据
const fetchSalesTrend = async () => {
  try {
    console.log('开始获取销售趋势...', { date: selectedDate.value, type: analysisType.value })
    const params = new URLSearchParams({
      date: selectedDate.value,
      type: analysisType.value
    })
    const response = await axios.get(`${API_BASE_URL}/sales/trend?${params}`)
    
    if (response.data.success) {
      const data = response.data.data
      
      // 更新趋势数据
      dailyAverageSales.value = data.daily_average_sales || 0
      weeklySales.value = data.weekly_sales || 0
      dailyGrowthRate.value = data.daily_growth_rate || 0
      weeklyGrowthRate.value = data.weekly_growth_rate || 0
      
      // 更新折线图数据
      if (data.chart_data) {
        trendChartData.value = {
          dates: data.chart_data.dates || [],
          sales: data.chart_data.sales || [],
          selected_date: data.chart_data.selected_date || ''
        }
        console.log('折线图数据更新成功', trendChartData.value)
      }
      
      console.log('销售趋势数据更新成功')
    } else {
      throw new Error(response.data.message || '获取销售趋势失败')
    }
  } catch (error) {
    console.error('获取销售趋势失败:', error)
    showToast(`获取销售趋势失败: ${error.message}`)
  }
}

// 加载会员分析数据
const fetchMemberAnalysis = async () => {
  try {
    console.log('开始获取会员分析...', { date: selectedDate.value, type: analysisType.value })
    const params = new URLSearchParams({
      date: selectedDate.value,
      type: analysisType.value
    })
    const response = await axios.get(`${API_BASE_URL}/members/analysis?${params}`)
    
    if (response.data.success) {
      const data = response.data.data
      
      // 更新会员数据
      newMembers.value = data.new_members || 0
      activeMembers.value = data.active_members || 0
      memberSalesRatio.value = data.member_sales_ratio || 0
      newMemberGrowth.value = data.new_member_growth || 0
      activeMemberGrowth.value = data.active_member_growth || 0
      memberRatioGrowth.value = data.member_ratio_growth || 0
      
      console.log('会员分析数据更新成功')
    } else {
      throw new Error(response.data.message || '获取会员分析失败')
    }
  } catch (error) {
    console.error('获取会员分析失败:', error)
    showToast(`获取会员分析失败: ${error.message}`)
  }
}

// 加载所有数据
const loadAllData = async () => {
  loading.value = true
  try {
    // 并行加载所有数据
    await Promise.all([
      fetchSalesOverview(),
      fetchStoreRanking(),
      fetchSalesMetrics(),
      fetchSalesTrend(), // 添加销售趋势数据加载
      fetchMemberAnalysis()
    ])
  } catch (error) {
    console.error('加载数据失败:', error)
    showToast('加载数据失败，请重试')
  } finally {
    loading.value = false
  }
}

const onAnalysisTypeConfirm = ({ selectedOptions }) => {
  analysisType.value = selectedOptions[0]?.value || 'month'
  showAnalysisTypePicker.value = false
  
  // 重新加载数据
  loadAllData()
}

const openDateSelector = () => {
  console.log('openDateSelector called, analysisType:', analysisType.value)
  if (analysisType.value === 'day') {
    console.log('Opening day picker')
    showDatePicker.value = true
  } else if (analysisType.value === 'month') {
    console.log('Opening month picker')
    showMonthPicker.value = true
  }
  console.log('Picker states:', {
    showDatePicker: showDatePicker.value,
    showMonthPicker: showMonthPicker.value
  })
}

const onDateConfirm = ({ selectedValues }) => {
  const [year, month, day] = selectedValues
  const monthStr = String(month).padStart(2, '0')
  const dayStr = String(day).padStart(2, '0')
  selectedDate.value = `${year}-${monthStr}-${dayStr}`
  showDatePicker.value = false
  
  // 重新加载数据
  loadAllData()
}

const onMonthConfirm = ({ selectedValues }) => {
  const [year, month] = selectedValues
  const monthStr = String(month).padStart(2, '0')
  selectedDate.value = `${year}-${monthStr}-01`
  showMonthPicker.value = false
  
  // 重新加载数据
  loadAllData()
}

const goBack = () => {
  router.go(-1)
}

const viewMoreRanking = () => {
  showToast('查看更多店铺排行功能开发中')
}

const viewMoreMetrics = () => {
  showToast('查看详细报告功能开发中')
}

const onTabChange = (name) => {
  if (name === 'home') {
    router.push('/')
  } else if (name === 'navigation') {
    router.push('/navigation')
  } else if (name === 'profile') {
    router.push('/profile')
  }
}

// 生命周期
onMounted(() => {
  loadAllData()
})
</script>

<style scoped>
.sales-analysis-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.status-bar-bg {
  height: 24px;
  background-color: #d9a145;
}

.nav-header {
  background-color: #d9a145;
}

.nav-header :deep(.van-nav-bar__title) {
  color: white;
}

.nav-header :deep(.van-nav-bar__left) {
  color: white;
}

.main-content {
  padding: 16px 16px 80px;
}

.filter-section {
  margin-bottom: 16px;
}

.overview-section,
.trend-section,
.ranking-section,
.metrics-section,
.member-section {
  margin-bottom: 16px;
}

.overview-card,
.trend-card,
.ranking-card,
.metrics-card,
.member-card {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.date-range {
  font-size: 14px;
  color: #666;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px 8px;
  background-color: #fdf5e6;
  border-radius: 8px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #d9a145;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.growth-rate {
  font-size: 12px;
  font-weight: bold;
}

.summary-stats {
  border-top: 1px solid #e5e5e5;
  padding-top: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
}

.summary-value {
  font-weight: bold;
  color: #d9a145;
  margin-right: 8px;
}

.trend-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.metric-item {
  text-align: center;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.metric-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.metric-compare {
  font-size: 11px;
}

.ranking-list {
  max-height: 300px;
  overflow-y: auto;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.ranking-item:last-child {
  border-bottom: none;
}

.rank-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  background-color: #f5f5f5;
  color: #666;
  margin-right: 12px;
}

.top-rank {
  background-color: #d9a145;
  color: white;
}

.store-info {
  flex: 1;
}

.store-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.store-details {
  font-size: 12px;
  color: #666;
}

.store-sales {
  text-align: right;
}

.sales-amount {
  font-size: 14px;
  font-weight: bold;
  color: #d9a145;
  margin-bottom: 2px;
}

.sales-trend {
  font-size: 12px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.metric-card {
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.metric-name {
  font-size: 13px;
  color: #666;
}

.metric-value-main {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.metric-changes {
  display: flex;
  justify-content: space-between;
}

.change-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.change-label {
  font-size: 11px;
  color: #999;
  margin-bottom: 2px;
}

.change-value {
  font-size: 12px;
  font-weight: bold;
}

.member-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.member-stat {
  text-align: center;
  padding: 16px 8px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.stat-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 20px;
  font-weight: bold;
  color: #d9a145;
  margin-bottom: 4px;
}

.stat-change {
  font-size: 12px;
  font-weight: bold;
}

.positive {
  color: #4caf50 !important;
}

.negative {
  color: #f56c6c !important;
}

.neutral {
  color: #333 !important;
}

@media (max-width: 360px) {
  .overview-stats,
  .trend-metrics,
  .member-stats {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

/* 销售趋势卡片 */
.trend-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin: 0 16px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.trend-metrics {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.metric-item {
  flex: 1;
  text-align: center;
  padding: 0 8px;
}

.metric-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.metric-compare {
  font-size: 11px;
}

/* 折线图容器样式 */
.trend-chart-container {
  margin-top: 20px;
  border-top: 1px solid #f0f0f0;
  padding-top: 20px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  text-align: center;
}

.chart-wrapper {
  width: 100%;
  height: 250px;
  position: relative;
}

.trend-chart {
  width: 100%;
  height: 100%;
}

.chart-empty {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}
</style> 