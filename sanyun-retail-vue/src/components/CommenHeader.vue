<template>
  <div class="header-container">
    <!-- 左侧系统名称和折叠按钮 -->
    <div class="left-section">
      <span class="system-name">三云管理系统</span>
      <el-button 
        class="collapse-btn" 
        :icon="store.state.isCollapse ? 'Expand' : 'Fold'" 
        @click="handleCollapse"
      />
    </div>

    <!-- 中间面包屑导航 -->
    <div class="middle-section">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
          {{ item.label }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 右侧用户信息 -->
    <div class="right-section">
      <el-dropdown trigger="click">
        <div class="user-info">
          <el-avatar :size="32" :src="user.avatar" />
          <span class="user-name">{{ user.name }}</span>
          <el-icon><arrow-down /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="switchUser">身份切换</el-dropdown-item>
            <el-dropdown-item @click="changePassword">修改密码</el-dropdown-item>
            <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { useAllDataStore } from '@/stores'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
// 切换折叠状态
const store = useAllDataStore()
const handleCollapse = () => {
  store.state.isCollapse = !store.state.isCollapse
}


// 用户信息
const user = ref({
  name: '',
  avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
})
onMounted(() => {
  const loginUser = JSON.parse(localStorage.getItem('loginUser'))
    
  if (loginUser && loginUser.name) {
    user.value.name = loginUser.name
  }
})
// 面包屑数据 (实际使用时应该从路由中获取)
const breadcrumbs = ref([
  { path: '/user', label: '用户管理' }
])

// 用户操作
const switchUser = () => {
  console.log('切换用户')
}
const changePassword = () => {
  console.log('修改密码')
}
const logout = () => {
  ElMessageBox.confirm('确定退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    .then(async () => {
        // 退出登录
        localStorage.removeItem('loginUser')
        router.push('/login')
        ElMessage.success('退出成功')
     })
     .catch(() => {
        console.log('取消')
     })
}
</script>

<style scoped lang="less">
.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
  background-color: #333;  
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  color: #fff;  

  .left-section {
    display: flex;
    align-items: center;
    
    .system-name {
      font-size: 18px;
      font-weight: bold;
      margin-right: 15px;
      color: #fff;  
    }

    .collapse-btn {
      font-size: 18px;
      border: none;
      background: transparent;
      color: #fff;  
    }
  }

  .middle-section {
    flex: 1;
    padding: 0 20px;
    
    :deep(.el-breadcrumb) {
      color: #fff;
      
      &__item {
        color: #fff;
        
        &:last-child {
          color: #fff;
          font-weight: bold;
        }
        
        .el-breadcrumb__inner {
          color: inherit;
        }
      }
    }
  }

  .right-section {
    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;
      color: #fff;  // 用户信息文字颜色改为白色

      .user-name {
        margin: 0 8px;
      }
    }
  }
}
</style>
