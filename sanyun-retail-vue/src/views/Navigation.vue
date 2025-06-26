<template>
    <div class="navigation-page">
      <!-- 顶部状态栏背景 -->
      <div class="status-bar-bg"></div>
      
      <!-- 顶部导航栏 -->
      <div class="nav-header">
        <van-nav-bar
          title="功能导航"
          left-text="返回"
          left-arrow
          @click-left="goBack"
          :style="{ backgroundColor: '#d9a145', color: 'white' }"
        />
      </div>
  
      <div class="main-content">
        <!-- 数据分析模块 -->
        <div class="nav-section">
          <div class="section-title">
            <van-icon name="chart-trending-o" color="#d9a145" />
            <span>数据分析</span>
          </div>
          <div class="nav-grid">
            <div class="nav-item" @click="navigateTo('/sales-analysis')">
              <van-icon name="bar-chart-o" size="24" color="#d9a145" />
              <span>销售分析</span>
            </div>
            <div class="nav-item" @click="navigateTo('/profit-analysis')">
              <van-icon name="pie-chart-o" size="24" color="#d9a145" />
              <span>利润分析</span>
            </div>
            <div class="nav-item" @click="navigateTo('/member-analysis')">
              <van-icon name="user-circle-o" size="24" color="#d9a145" />
              <span>会员分析</span>
            </div>
            <div class="nav-item" @click="navigateTo('/inventory-analysis')">
              <van-icon name="orders-o" size="24" color="#d9a145" />
              <span>库存分析</span>
            </div>
          </div>
        </div>
  
        <!-- 销售管理模块 -->
        <div class="nav-section">
          <div class="section-title">
            <van-icon name="shop-o" color="#d9a145" />
            <span>销售管理</span>
          </div>
          <div class="nav-grid">
            <div class="nav-item" @click="navigateTo('/pos-sales')">
              <van-icon name="cart-o" size="24" color="#d9a145" />
              <span>POS销售</span>
            </div>
            <div class="nav-item" @click="navigateTo('/sales-order')">
              <van-icon name="bill-o" size="24" color="#d9a145" />
              <span>销售单据</span>
            </div>
            <div class="nav-item" @click="navigateTo('/return-exchange')">
              <van-icon name="replay" size="24" color="#d9a145" />
              <span>退换货</span>
            </div>
            <div class="nav-item" @click="navigateTo('/price-management')">
              <van-icon name="gold-coin-o" size="24" color="#d9a145" />
              <span>价格管理</span>
            </div>
          </div>
        </div>
  
        <!-- 库存管理模块 -->
        <div class="nav-section">
          <div class="section-title">
            <van-icon name="records" color="#d9a145" />
            <span>库存管理</span>
          </div>
          <div class="nav-grid">
            <div class="nav-item" @click="navigateTo('/inventory-query')">
              <van-icon name="search" size="24" color="#d9a145" />
              <span>库存查询</span>
            </div>
            <div class="nav-item" @click="navigateTo('/purchase-order')">
              <van-icon name="add-square" size="24" color="#d9a145" />
              <span>采购订单</span>
            </div>
            <div class="nav-item" @click="navigateTo('/inventory-check')">
              <van-icon name="checked" size="24" color="#d9a145" />
              <span>库存盘点</span>
            </div>
            <div class="nav-item" @click="navigateTo('/slow-moving')">
              <van-icon name="warning-o" size="24" color="#d9a145" />
              <span>滞销商品</span>
            </div>
          </div>
        </div>
  
        <!-- 会员管理模块 -->
        <div class="nav-section">
          <div class="section-title">
            <van-icon name="friends-o" color="#d9a145" />
            <span>会员管理</span>
          </div>
          <div class="nav-grid">
            <div class="nav-item" @click="navigateTo('/member-list')">
              <van-icon name="contact" size="24" color="#d9a145" />
              <span>会员列表</span>
            </div>
            <div class="nav-item" @click="navigateTo('/member-register')">
              <van-icon name="add-o" size="24" color="#d9a145" />
              <span>会员注册</span>
            </div>
            <div class="nav-item" @click="navigateTo('/member-card')">
              <van-icon name="card" size="24" color="#d9a145" />
              <span>会员卡管理</span>
            </div>
            <div class="nav-item" @click="navigateTo('/points-management')">
              <van-icon name="diamond-o" size="24" color="#d9a145" />
              <span>积分管理</span>
            </div>
          </div>
        </div>
  
        <!-- 系统设置模块 -->
        <div class="nav-section">
          <div class="section-title">
            <van-icon name="setting-o" color="#d9a145" />
            <span>系统设置</span>
          </div>
          <div class="nav-grid">
            <div class="nav-item" @click="navigateTo('/store-settings')">
              <van-icon name="shop-collect-o" size="24" color="#d9a145" />
              <span>门店设置</span>
            </div>
            <div class="nav-item" @click="navigateTo('/employee-management')">
              <van-icon name="manager-o" size="24" color="#d9a145" />
              <span>员工管理</span>
            </div>
            <div class="nav-item" @click="navigateTo('/system-backup')">
              <van-icon name="completed" size="24" color="#d9a145" />
              <span>系统备份</span>
            </div>
            <div class="nav-item" @click="navigateTo('/help-center')">
              <van-icon name="question-o" size="24" color="#d9a145" />
              <span>帮助中心</span>
            </div>
          </div>
        </div>
      </div>
  
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
  import { showToast } from 'vant'
  
  const router = useRouter()
  const activeBottomTab = ref('navigation')
  
  const goBack = () => {
    router.go(-1)
  }
  
  const navigateTo = (route) => {
    if (route === '/' || route === '/sales-analysis') {
      router.push(route)
    } else {
      showToast(`功能开发中: ${route}`)
    }
  }
  
  const onTabChange = (name) => {
    if (name === 'home') {
      router.push('/')
    } else if (name === 'profile') {
      router.push('/profile')
    }
    // 当前页面保持不变
  }
  </script>
  
  <style scoped>
  .navigation-page {
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
  
  .nav-section {
    background-color: white;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .section-title {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: bold;
    color: #333;
  }
  
  .section-title span {
    margin-left: 8px;
  }
  
  .nav-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  
  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 8px;
    background-color: #fdf5e6;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid transparent;
  }
  
  .nav-item:hover {
    background-color: #f5e6c4;
    border-color: #d9a145;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(217, 161, 69, 0.2);
  }
  
  .nav-item:active {
    transform: translateY(0);
  }
  
  .nav-item span {
    margin-top: 8px;
    font-size: 12px;
    color: #333;
    text-align: center;
    line-height: 1.2;
  }
  
  @media (max-width: 360px) {
    .nav-grid {
      grid-template-columns: repeat(3, 1fr);
    }
    
    .nav-item {
      padding: 12px 6px;
    }
    
    .nav-item span {
      font-size: 11px;
    }
  }
  </style>