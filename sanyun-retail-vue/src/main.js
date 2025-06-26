import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './views/Home.vue'
import Login from './views/Login.vue'
import Navigation from './views/Navigation.vue'
import SalesAnalysis from './views/SalesAnalysis.vue'
import Profile from './views/Profile.vue'

// Vant 样式
import 'vant/lib/index.css'

// 路由配置
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/navigation',
      name: 'Navigation',
      component: Navigation
    },
    {
      path: '/sales-analysis',
      name: 'SalesAnalysis',
      component: SalesAnalysis
    },
    {
      path: '/profile',
      name: 'Profile',
      component: Profile
    }
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app') 