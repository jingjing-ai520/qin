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
      <div class="title">积分管理</div>
    </div>

    <div class="main-content">
      <div class="section-card">
        <div class="card-header">
          <h3>积分统计</h3>
        </div>
        <div class="card-content">
          <div class="stats-container">
            <div class="stat-card">
              <div class="stat-value">{{ pointStats.total }}</div>
              <div class="stat-label">总积分</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ pointStats.avgPerMember }}</div>
              <div class="stat-label">人均积分</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ pointStats.monthAdd }}</div>
              <div class="stat-label">本月新增</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ pointStats.monthUse }}</div>
              <div class="stat-label">本月消耗</div>
            </div>
          </div>

          <div class="chart-container" ref="pointChart"></div>
        </div>
      </div>

      <div class="section-card">
        <div class="card-header">
          <h3>积分规则</h3>
          <van-button type="primary" size="small">编辑规则</van-button>
        </div>
        <div class="card-content">
          <van-collapse v-model="activeRule">
            <van-collapse-item title="积分获取规则" name="rule1">
              <div style="padding: 10px;">
                <p>1. 每消费1元人民币可获得1积分</p>
                <p>2. 推荐新会员注册可获得200积分</p>
                <p>3. 生日当月消费可获得双倍积分</p>
                <p>4. 参与活动可获得额外积分奖励</p>
              </div>
            </van-collapse-item>
            <van-collapse-item title="积分兑换规则" name="rule2">
              <div style="padding: 10px;">
                <p>1. 100积分可抵扣1元人民币</p>
                <p>2. 可兑换指定商品或优惠券</p>
                <p>3. 积分有效期2年，过期自动清零</p>
                <p>4. 兑换后积分不可退回</p>
              </div>
            </van-collapse-item>
          </van-collapse>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="bottom-nav">
      <div class="nav-item" @click="goToMemberList">
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
      <div class="nav-item active">
        <div class="nav-icon">
          <van-icon name="diamond-o" />
        </div>
        <div class="nav-text">积分</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { Icon, Button, Collapse, CollapseItem } from 'vant'

export default {
  components: {
    [Icon.name]: Icon,
    [Button.name]: Button,
    [Collapse.name]: Collapse,
    [CollapseItem.name]: CollapseItem
  },
  setup() {
    const router = useRouter()
    const pointChart = ref(null)
    const activeRule = ref(['rule1'])
    
    // 积分统计
    const pointStats = reactive({
      total: 125680,
      avgPerMember: 98,
      monthAdd: 15620,
      monthUse: 8450
    })

    // 返回上一页
    const goBack = () => {
      router.go(-1)
    }

    // 跳转到会员列表页面
    const goToMemberList = () => {
      router.push('/member-list')
    }

    // 跳转到注册页面
    const goToRegister = () => {
      router.push('/member-register')
    }

    // 跳转到会员卡页面
    const goToMemberCard = () => {
      router.push('/member-card')
    }

    // 初始化图表
    onMounted(() => {
      const chart = echarts.init(pointChart.value)
      chart.setOption({
        tooltip: {
          trigger: 'item'
        },
        legend: {
          bottom: '5%',
          left: 'center'
        },
        series: [
          {
            name: '积分分布',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: 65400, name: '普通会员', itemStyle: { color: '#d9a145' } },
              { value: 42800, name: '黄金会员', itemStyle: { color: '#ffd700' } },
              { value: 17480, name: '白金会员', itemStyle: { color: '#e5e4e2' } }
            ]
          }
        ]
      })

      // 响应式调整
      window.addEventListener('resize', () => {
        chart.resize()
      })
    })

    return {
      pointStats,
      activeRule,
      pointChart,
      goBack,
      goToMemberList,
      goToRegister,
      goToMemberCard
    }
  }
}
</script>

<style scoped>
/* 样式与原始HTML文件相同 */
</style>