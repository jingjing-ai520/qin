import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router'],
      dts: true
    }),
    Components({
      resolvers: [VantResolver()]
    })
  ],
  server: {
    host: '0.0.0.0', // 允许外网访问
    port: 443,
    open: true
  }
})