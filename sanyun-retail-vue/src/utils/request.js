import axios from 'axios'

//创建axios实例对象
const request = axios.create({
  baseURL: 'http://127.0.0.1:4523/m1/6738857-6450166-default',
  timeout: 600000
})

//axios的请求拦截器
request.interceptors.request.use(
  (config) => { //请求前拦截器
    const loginUser = JSON.parse(localStorage.getItem('loginUser'))
    if (loginUser && loginUser.token) {
      config.headers.token = loginUser.token
    }
    return config
  },
  (error) => { //请求失败拦截器
    return Promise.reject(error)
  }
)

//axios的响应 response 拦截器
request.interceptors.response.use(
  (response) => { //成功回调
    return response.data
  },
  (error) => { //失败回调
    return Promise.reject(error)
  }
)

export default request