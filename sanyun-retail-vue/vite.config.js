import { defineConfig, mergeAlias } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  //添加的别名 
  resolve:{
    alias:[
      {
        find:"@",
        replacement:"/src"
      }
    ]
  }
})
/*@/······  的格式代表 在src的目录下查找*/ 