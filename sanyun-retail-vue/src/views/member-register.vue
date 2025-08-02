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
      <div class="title">会员注册</div>
    </div>

    <div class="main-content">
      <div class="section-card">
        <div class="card-header">
          <h3>新增会员</h3>
        </div>
        <div class="form-container">
          <div class="form-group">
            <label class="form-label">会员姓名</label>
            <input type="text" class="form-input" v-model="newMember.name" placeholder="请输入会员姓名">
          </div>

          <div class="form-group">
            <label class="form-label">手机号码</label>
            <input type="tel" class="form-input" v-model="newMember.phone" placeholder="请输入手机号码">
          </div>

          <div class="form-group">
            <label class="form-label">性别</label>
            <div>
              <van-radio-group v-model="newMember.gender" direction="horizontal">
                <van-radio name="male">男</van-radio>
                <van-radio name="female">女</van-radio>
              </van-radio-group>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">会员等级</label>
            <van-radio-group v-model="newMember.level" direction="horizontal">
              <van-radio name="普通会员">普通会员</van-radio>
              <van-radio name="黄金会员">黄金会员</van-radio>
              <van-radio name="白金会员">白金会员</van-radio>
            </van-radio-group>
          </div>

          <div class="form-group">
            <label class="form-label">初始积分</label>
            <input type="number" class="form-input" v-model="newMember.points" placeholder="请输入初始积分">
          </div>

          <button class="submit-btn" @click="registerMember">提交注册</button>
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
      <div class="nav-item active">
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Icon, RadioGroup, Radio, Button } from 'vant'

export default {
  components: {
    [Icon.name]: Icon,
    [RadioGroup.name]: RadioGroup,
    [Radio.name]: Radio,
    [Button.name]: Button
  },
  setup() {
    const router = useRouter()
    
    // 新会员表单
    const newMember = reactive({
      name: '',
      phone: '',
      gender: 'male',
      level: '普通会员',
      points: 100
    })

    // 返回上一页
    const goBack = () => {
      router.go(-1)
    }

    // 注册新会员
    const registerMember = () => {
      if (!newMember.name || !newMember.phone) {
        alert('请填写会员姓名和手机号')
        return
      }
      
      // 在实际应用中，这里会有API调用
      alert(`会员 ${newMember.name} 注册成功！`)
      
      // 重置表单
      newMember.name = ''
      newMember.phone = ''
      newMember.gender = 'male'
      newMember.level = '普通会员'
      newMember.points = 100
      
      // 返回会员列表
      router.push('/member-list')
    }

    // 跳转到会员列表页面
    const goToMemberList = () => {
      router.push('/member-list')
    }

    // 跳转到会员卡页面
    const goToMemberCard = () => {
      router.push('/member-card')
    }

    // 跳转到积分管理页面
    const goToPointsManagement = () => {
      router.push('/points-management')
    }

    return {
      newMember,
      goBack,
      registerMember,
      goToMemberList,
      goToMemberCard,
      goToPointsManagement
    }
  }
}
</script>

<style scoped>
/* 样式与原始HTML文件相同 */
</style>