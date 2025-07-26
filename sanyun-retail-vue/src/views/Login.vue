<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2 class="login-title">三云管理系统登录</h2>
      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="门店登录" name="store">
          <el-form :model="storeForm" :rules="rules" ref="storeFormRef">
            <el-form-item prop="username">
              <el-input v-model="storeForm.username" placeholder="请输入用户名" prefix-icon="User" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="storeForm.password" placeholder="请输入密码" prefix-icon="Lock" show-password />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="员工登录" name="staff">
          <el-form :model="staffForm" :rules="rules" ref="staffFormRef">
            <el-form-item prop="username">
              <el-input v-model="staffForm.username" placeholder="请输入用户名" prefix-icon="User" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="staffForm.password" placeholder="请输入密码" prefix-icon="Lock" show-password />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <el-button type="primary" class="login-btn" @click="handleLogin">登录</el-button>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { LoginApi } from '@/api/log'
import { ElMessage } from 'element-plus'

const router = useRouter()
const activeTab = ref('store')
const loginapi = 'http://127.0.0.1:4523/m1/6738857-6450166-default/api/user/login'

const storeForm = ref({
  username: '',
  password: ''
})

const staffForm = ref({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  try {
    const form = activeTab.value === 'store' ? storeForm.value : staffForm.value
    
    const loginform = ref({
      username: form.username,
      password: form.password,
      loginType: activeTab.value
    })
    // 调用登录API
    // const response = await axios.post(loginapi, {
    //   username: form.username,
    //   password: form.password,
    //   loginType: activeTab.value
    // })
    const response = await LoginApi(loginform.value);
    if (response.code === 200) {
      // 存储返回数据到localStorage
      localStorage.setItem('loginUser',JSON.stringify(response.data))
      
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      ElMessage.error(response.message || '登录失败')
    }
  } catch (error) {
    ElMessage.error('登录请求失败')
    console.error(error)
  }
}
</script>

<style scoped lang="less">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;

  .login-card {
    width: 400px;
    padding: 20px;

    .login-title {
      text-align: center;
      margin-bottom: 20px;
    }

    .login-tabs {
      margin-bottom: 20px;
    }

    .login-btn {
      width: 100%;
    }
  }
}
</style>