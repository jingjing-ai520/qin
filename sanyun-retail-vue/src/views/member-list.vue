<template>
  <div class="app-container">
    <!-- 顶部状态栏 -->
    <div class="status-bar-bg"></div>

    <!-- 导航栏 -->
    <div class="nav-header">
      <div class="back-btn" @click="goBack">
        <van-icon name="arrow-left" />
        <span>返回</span>
      </div>
      <div class="title">会员列表</div>
    </div>

    <div class="main-content">
      <div class="section-card">
        <div class="card-header">
          <h3>会员统计</h3>
        </div>
        <div class="card-content">
          <div class="stats-container">
            <div class="stat-card">
              <div class="stat-value">{{ memberStats.total }}</div>
              <div class="stat-label">会员总数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ memberStats.active }}</div>
              <div class="stat-label">活跃会员</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ memberStats.newToday }}</div>
              <div class="stat-label">今日新增</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ memberStats.points }}</div>
              <div class="stat-label">总积分</div>
            </div>
          </div>

          <div class="chart-container" ref="memberChart"></div>
        </div>
      </div>

      <div class="section-card">
        <div class="card-header">
          <h3>会员列表</h3>
          <van-button type="primary" size="small" @click="goToRegister">新增会员</van-button>
        </div>
        <div class="card-content">
          <div class="search-bar">
            <van-icon name="search" />
            <input type="text" placeholder="搜索会员姓名或手机号" v-model="searchKeyword">
          </div>

          <div class="member-list">
            <div class="member-item" v-for="member in filteredMembers" :key="member.id">
              <div class="member-avatar">
                <van-icon name="user-circle-o" />
              </div>
              <div class="member-info">
                <div class="member-name">{{ member.name }}</div>
                <div class="member-detail">
                  {{ member.phone }} | {{ member.level }}会员
                </div>
              </div>
              <div class="member-points">
                {{ member.points }}分
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="bottom-nav">
      <div class="nav-item active">
        <div class="nav-icon">
          <van-icon name="contact" />
        </div>
        <div class="nav-text">会员列表</div>
      </div>
      <div class="nav-item" @click="goToRegister">
        <div class="nav-icon">
          <van-icon name="add-o" />
        </div>
        <div class="nav-text">会员注册</div>
      </div>
      <div class="nav-item" @click="goToMemberCard">
        <div class="nav-icon">
          <van-icon name="card" />
        </div>
        <div class="nav-text">会员卡</div>
      </div>
      <div class="nav-item" @click="goToPointsManagement">
        <div class="nav-icon">
          <van-icon name="diamond-o" />
        </div>
        <div class="nav-text">积分</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { Icon, Button } from 'vant'

export default {
  components: {
    [Icon.name]: Icon,
    [Button.name]: Button
  },
  setup() {
    const router = useRouter()
    const searchKeyword = ref('')
    const memberChart = ref(null)

    // 会员统计
    const memberStats = reactive({
      total: 1285,
      active: 895,
      newToday: 24,
      points: 125680
    })

    // 会员列表数据
    const members = ref([
      { id: 1, name: '张先生', phone: '138****1234', level: '黄金会员', points: 1250 },
      { id: 2, name: '李女士', phone: '139****5678', level: '白金会员', points: 3500 },
      { id: 3, name: '王先生', phone: '137****9012', level: '普通会员', points: 450 },
      { id: 4, name: '赵女士', phone: '136****3456', level: '黄金会员', points: 2200 },
      { id: 5, name: '刘先生', phone: '135****7890', level: '普通会员', points: 780 },
      { id: 6, name: '陈女士', phone: '134****1234', level: '白金会员', points: 5100 },
      { id: 7, name: '杨先生', phone: '133****5678', level: '黄金会员', points: 1800 },
      { id: 8, name: '黄女士', phone: '132****9012', level: '普通会员', points: 650 }
    ])

    // 过滤后的会员列表
    const filteredMembers = computed(() => {
      if (!searchKeyword.value) return members.value;
      const keyword = searchKeyword.value.toLowerCase();
      return members.value.filter(member =>
        member.name.toLowerCase().includes(keyword) ||
        member.phone.includes(keyword)
    })

    // 返回上一页
    const goBack = () => {
      router.go(-1)
    }

    // 跳转到注册页面
    const goToRegister = () => {
      router.push('/member-register')
    }

    // 跳转到会员卡页面
    const goToMemberCard = () => {
      router.push('/member-card')
    }

    // 跳转到积分管理页面
    const goToPointsManagement = () => {
      router.push('/points-management')
    }

    // 初始化图表
    onMounted(() => {
      const chart = echarts.init(memberChart.value)
      chart.setOption({
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '会员总数',
            type: 'line',
            data: [865, 932, 901, 934, 1090, 1130, 1285],
            smooth: true,
            lineStyle: {
              color: '#d9a145',
              width: 3
            },
            itemStyle: {
              color: '#d9a145'
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
          }
        ]
      })

      // 响应式调整
      window.addEventListener('resize', () => {
        chart.resize()
      })
    })

    return {
      searchKeyword,
      memberStats,
      members,
      filteredMembers,
      memberChart,
      goBack,
      goToRegister,
      goToMemberCard,
      goToPointsManagement
    }
  }
}
</script>

<style scoped>
/* 样式与原始HTML文件相同 */
</style>