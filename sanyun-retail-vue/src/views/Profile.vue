<template>
  <div class="profile-page">
    <!-- 顶部状态栏背景 -->
    <div class="status-bar-bg"></div>
    
    <!-- 顶部导航栏 -->
    <div class="nav-header">
      <van-nav-bar
        title="我的"
        left-text="返回"
        left-arrow
        @click-left="goBack"
        :style="{ backgroundColor: '#d9a145', color: 'white' }"
      />
    </div>

    <div class="main-content">
      <!-- 用户信息卡片 -->
      <div class="user-section">
        <div class="user-card">
          <div class="user-avatar">
            <van-icon name="manager" size="40" color="#d9a145" />
          </div>
          <div class="user-info">
            <div class="user-name">{{ userInfo.name }}</div>
            <div class="user-role">{{ userInfo.role }}</div>
            <div class="user-store">{{ userInfo.store }}</div>
          </div>
          <div class="user-actions">
            <van-button
              size="small"
              type="primary"
              :style="{ backgroundColor: '#d9a145', borderColor: '#d9a145' }"
              @click="editProfile"
            >
              编辑
            </van-button>
          </div>
        </div>
      </div>

      <!-- 功能菜单 -->
      <div class="menu-section">
        <van-cell-group>
          <van-cell
            title="个人设置"
            icon="setting-o"
            is-link
            @click="goToSettings"
          />
          <van-cell
            title="账户安全"
            icon="shield-o"
            is-link
            @click="goToSecurity"
          />
          <van-cell
            title="消息通知"
            icon="bell"
            is-link
            @click="goToNotifications"
          />
          <van-cell
            title="数据同步"
            icon="exchange"
            is-link
            @click="goToSync"
          />
        </van-cell-group>
      </div>

      <!-- 统计信息 -->
      <div class="stats-section">
        <div class="stats-card">
          <div class="card-header">
            <h3>本月统计</h3>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ monthStats.loginDays }}</div>
              <div class="stat-label">登录天数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ monthStats.operations }}</div>
              <div class="stat-label">操作次数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ monthStats.reports }}</div>
              <div class="stat-label">查看报表</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ monthStats.exports }}</div>
              <div class="stat-label">导出数据</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 系统信息 -->
      <div class="system-section">
        <van-cell-group>
          <van-cell
            title="版本信息"
            :value="systemInfo.version"
            icon="info-o"
          />
          <van-cell
            title="最后同步时间"
            :value="systemInfo.lastSync"
            icon="clock-o"
          />
          <van-cell
            title="缓存大小"
            :value="systemInfo.cacheSize"
            icon="delete-o"
            is-link
            @click="clearCache"
          />
          <van-cell
            title="检查更新"
            icon="upgrade"
            is-link
            @click="checkUpdate"
          />
        </van-cell-group>
      </div>

      <!-- 帮助与支持 -->
      <div class="help-section">
        <van-cell-group>
          <van-cell
            title="帮助中心"
            icon="question-o"
            is-link
            @click="goToHelp"
          />
          <van-cell
            title="意见反馈"
            icon="comment-o"
            is-link
            @click="goToFeedback"
          />
          <van-cell
            title="关于我们"
            icon="wechat"
            is-link
            @click="goToAbout"
          />
        </van-cell-group>
      </div>

      <!-- 退出登录 -->
      <div class="logout-section">
        <van-button
          block
          type="danger"
          @click="showLogoutDialog = true"
        >
          退出登录
        </van-button>
      </div>
    </div>

    <!-- 退出登录确认对话框 -->
    <van-dialog
      v-model:show="showLogoutDialog"
      title="确认退出"
      message="您确定要退出登录吗？"
      show-cancel-button
      @confirm="logout"
      @cancel="showLogoutDialog = false"
    />

    <!-- 底部导航栏 -->
    <van-tabbar v-model="activeBottomTab" @change="onTabChange">
      <van-tabbar-item icon="home-o" name="home">首页</van-tabbar-item>
      <van-tabbar-item icon="search" name="navigation">功能</van-tabbar-item>
      <van-tabbar-item icon="user-o" name="profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'

const router = useRouter()
const activeBottomTab = ref('profile')
const showLogoutDialog = ref(false)

// 用户信息
const userInfo = ref({
  name: '管理员',
  role: '店长',
  store: '三云零售示例店'
})

// 本月统计
const monthStats = ref({
  loginDays: '28',
  operations: '1,256',
  reports: '89',
  exports: '23'
})

// 系统信息
const systemInfo = ref({
  version: 'v6.10.0',
  lastSync: '2024-01-15 10:30',
  cacheSize: '15.2MB'
})

// 方法
const goBack = () => {
  router.go(-1)
}

const editProfile = () => {
  showToast('个人信息编辑功能开发中')
}

const goToSettings = () => {
  showToast('个人设置功能开发中')
}

const goToSecurity = () => {
  showToast('账户安全功能开发中')
}

const goToNotifications = () => {
  showToast('消息通知功能开发中')
}

const goToSync = () => {
  showToast('数据同步功能开发中')
}

const clearCache = async () => {
  try {
    await showConfirmDialog({
      title: '清除缓存',
      message: '确定要清除所有缓存数据吗？',
    })
    showToast('缓存清除成功')
  } catch {
    // 用户取消
  }
}

const checkUpdate = () => {
  showToast('正在检查更新...')
  setTimeout(() => {
    showToast('当前已是最新版本')
  }, 1500)
}

const goToHelp = () => {
  showToast('帮助中心功能开发中')
}

const goToFeedback = () => {
  showToast('意见反馈功能开发中')
}

const goToAbout = () => {
  showToast('关于我们功能开发中')
}

const logout = () => {
  showToast('已退出登录')
  router.push('/login')
}

const onTabChange = (name) => {
  if (name === 'home') {
    router.push('/')
  } else if (name === 'navigation') {
    router.push('/navigation')
  }
}
</script>

<style scoped>
.profile-page {
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

.user-section {
  margin-bottom: 16px;
}

.user-card {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-avatar {
  width: 60px;
  height: 60px;
  background-color: #fdf5e6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.user-role {
  font-size: 14px;
  color: #d9a145;
  margin-bottom: 4px;
}

.user-store {
  font-size: 12px;
  color: #999;
}

.menu-section {
  margin-bottom: 16px;
}

.stats-section {
  margin-bottom: 16px;
}

.stats-card {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  margin-bottom: 16px;
}

.card-header h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 12px 8px;
  background-color: #fdf5e6;
  border-radius: 8px;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #d9a145;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.system-section {
  margin-bottom: 16px;
}

.help-section {
  margin-bottom: 32px;
}

.logout-section {
  margin-bottom: 16px;
}

@media (max-width: 360px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .stat-item {
    padding: 8px 4px;
  }
  
  .stat-label {
    font-size: 11px;
  }
}
</style>