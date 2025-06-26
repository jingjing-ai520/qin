<template>
  <div class="login-page">
    <!-- 顶部状态栏背景 -->
    <div class="status-bar-bg"></div>
    
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- Logo区域 -->
      <div class="logo-section">
        <div class="logo-container">
          <div class="logo-icon">
            <van-icon name="shop-o" size="60" color="#d9a145" />
          </div>
          <div class="app-name">三云零售通</div>
          <div class="app-slogan">企业零售数据分析平台</div>
        </div>
      </div>

      <!-- 登录表单区域 -->
      <div class="login-form-section">
        <van-form @submit="onSubmit">
          <van-cell-group inset>
            <van-field
              v-model="username"
              name="username"
              label="用户名"
              placeholder="请输入用户名或手机号"
              :rules="[{ required: true, message: '请输入用户名' }]"
              clearable
            />
            <van-field
              v-model="password"
              type="password"
              name="password"
              label="密码"
              placeholder="请输入密码"
              :rules="[{ required: true, message: '请输入密码' }]"
              clearable
            />
          </van-cell-group>

          <!-- 记住密码和忘记密码 -->
          <div class="login-options">
            <van-checkbox v-model="rememberPassword">记住密码</van-checkbox>
            <span class="forgot-password" @click="forgotPassword">忘记密码？</span>
          </div>

          <!-- 登录按钮 -->
          <div class="login-button-container">
            <van-button
              round
              block
              type="primary"
              native-type="submit"
              :loading="loading"
              :style="{ backgroundColor: '#d9a145', borderColor: '#d9a145' }"
            >
              登录
            </van-button>
          </div>
        </van-form>

        <!-- 其他登录方式 -->
        <div class="other-login">
          <div class="divider">
            <span>其他登录方式</span>
          </div>
          <div class="social-login">
            <div class="social-item" @click="wechatLogin">
              <van-icon name="wechat" size="24" color="#07c160" />
              <span>微信</span>
            </div>
            <div class="social-item" @click="phoneLogin">
              <van-icon name="phone-o" size="24" color="#d9a145" />
              <span>手机验证码</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="footer-info">
      <div class="version-info">版本号：v6.10.0</div>
      <div class="copyright">© 2024 三云软件科技有限公司</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

// 表单数据
const username = ref('')
const password = ref('')
const rememberPassword = ref(false)
const loading = ref(false)

// 登录提交
const onSubmit = async (values) => {
  loading.value = true
  
  try {
    // 模拟登录验证
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    if (values.username && values.password) {
      showToast('登录成功')
      router.push('/')
    } else {
      showToast('请输入用户名和密码')
    }
  } catch (error) {
    showToast('登录失败，请重试')
  } finally {
    loading.value = false
  }
}

// 忘记密码
const forgotPassword = () => {
  showToast('请联系管理员重置密码')
}

// 微信登录
const wechatLogin = () => {
  showToast('微信登录功能开发中')
}

// 手机验证码登录
const phoneLogin = () => {
  showToast('手机验证码登录功能开发中')
}
</script>

<style scoped>
.login-page {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.status-bar-bg {
  height: 24px;
  background-color: #d9a145;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 40px 20px 20px;
}

.logo-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 40px;
}

.logo-container {
  text-align: center;
}

.logo-icon {
  margin-bottom: 20px;
}

.app-name {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.app-slogan {
  font-size: 14px;
  color: #666;
}

.login-form-section {
  flex: 1;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 16px 24px;
}

.forgot-password {
  color: #d9a145;
  font-size: 14px;
  cursor: pointer;
}

.login-button-container {
  margin: 0 16px 32px;
}

.other-login {
  margin: 0 16px;
}

.divider {
  position: relative;
  text-align: center;
  margin: 20px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #e5e5e5;
}

.divider span {
  background-color: #f5f5f5;
  padding: 0 16px;
  color: #999;
  font-size: 14px;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 20px;
}

.social-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.social-item:hover {
  background-color: rgba(217, 161, 69, 0.1);
}

.social-item span {
  margin-top: 8px;
  font-size: 12px;
  color: #333;
}

.footer-info {
  text-align: center;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.8);
}

.version-info {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.copyright {
  font-size: 12px;
  color: #999;
}
</style> 