import {createRouter, createWebHashHistory} from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/',
    name: 'Main',
    component: () => import('@/views/Main.vue'),
    redirect: '/home',
    children: [
            {
                path: '/home',
                name: 'Home',
                component: () => import('@/views/Home.vue')
            },
            {
                path: '/customer/list',
                name: 'CustomerList',
                component: () => import('@/views/customer/CustomerList.vue')
            }
        ]
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

// 在导出router之前添加导航守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('authToken')
  
  if (to.name !== 'Login' && !isAuthenticated) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router;