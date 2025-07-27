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
      <div class="title">会员卡管理</div>
    </div>

    <div class="main-content">
      <div class="section-card">
        <div class="card-header">
          <h3>会员卡管理</h3>
          <van-button type="primary" size="small" @click="showIssueCard = true">发卡</van-button>
        </div>
        <div class="card-content">
          <div class="card-item">
            <div class="card-header">
              <div class="card-type">普通会员卡</div>
              <div class="card-status">正常</div>
            </div>
            <div class="card-details">
              <div class="card-detail">
                <div class="label">卡号</div>
                <div class="value">C20230615001</div>
              </div>
              <div class="card-detail">
                <div class="label">持卡人</div>
                <div class="value">张先生</div>
              </div>
              <div class="card-detail">
                <div class="label">有效期</div>
                <div class="value">2025-06-15</div>
              </div>
              <div class="card-detail">
                <div class="label">余额</div>
                <div class="value">¥ 1,250.00</div>
              </div>
            </div>
            <div class="card-actions">
              <button class="card-btn secondary-btn">冻结</button>
              <button class="card-btn primary-btn">充值</button>
            </div>
          </div>

          <div class="card-item">
            <div class="card-header">
              <div class="card-type">白金会员卡</div>
              <div class="card-status">正常</div>
            </div>
            <div class="card-details">
              <div class="card-detail">
                <div class="label">卡号</div>
                <div class="value">C20230822002</div>
              </div>
              <div class="card-detail">
                <div class="label">持卡人</div>
                <div class="value">李女士</div>
              </div>
              <div class="card-detail">
                <div class="label">有效期</div>
                <div class="value">2026-08-22</div>
              </div>
              <div class="card-detail">
                <div class="label">余额</div>
                <div class="value">¥ 3,500.00</div>
              </div>
            </div>
            <div class="card-actions">
              <button class="card-btn secondary-btn">冻结</button>
              <button class="card-btn primary-btn">充值</button>
            </div>
          </div>
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
      <div class="nav-item active">
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

    <!-- 发卡弹窗 -->
    <van-popup v-model:show="showIssueCard" position="bottom" round>
      <div style="padding: 20px;">
        <h3 style="text-align: center; margin-bottom: 20px;">发行新会员卡</h3>
        <van-form>
          <van-field
            v-model="newCard.member"
            label="会员"
            placeholder="选择会员"
            readonly
            right-icon="arrow"
          />
          <van-field
            v-model="newCard.type"
            label="卡类型"
            placeholder="选择卡类型"
            readonly
            right-icon="arrow"
          />
          <van-field
            v-model="newCard.amount"
            label="初始金额"
            placeholder="请输入初始金额"
            type="number"
          />
          <div style="margin: 16px;">
            <van-button round block type="primary" @click="issueCard">确认发卡</van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Icon, Button, Popup, Field, Form } from 'vant'

export default {
  components: {
    [Icon.name]: Icon,
    [Button.name]: Button,
    [Popup.name]: Popup,
    [Field.name]: Field,
    [Form.name]: Form
  },
  setup() {
    const router = useRouter()
    const showIssueCard = ref(false)
    
    // 新会员卡表单
    const newCard = reactive({
      member: '',
      type: '普通会员卡',
      amount: 1000
    })

    // 返回上一页
    const goBack = () => {
      router.go(-1)
    }

    // 发卡
    const issueCard = () => {
      alert(`已为 ${newCard.member || '新会员'} 发行 ${newCard.type}，初始金额 ${newCard.amount} 元`)
      showIssueCard.value = false
      newCard.member = ''
      newCard.amount = 1000
    }

    // 跳转到会员列表页面
    const goToMemberList = () => {
      router.push('/member-list')
    }

    // 跳转到注册页面
    const goToRegister = () => {
      router.push('/member-register')
    }

    // 跳转到积分管理页面
    const goToPointsManagement = () => {
      router.push('/points-management')
    }

    return {
      showIssueCard,
      newCard,
      goBack,
      issueCard,
      goToMemberList,
      goToRegister,
      goToPointsManagement
    }
  }
}
</script>

<style scoped>
/* 样式与原始HTML文件相同 */
</style>