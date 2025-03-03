import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/note/', // 设置基础路径
  server: {
    host: '0.0.0.0',
    port: 5273,
    hmr: {
      protocol: 'wss',
      host: 'ai.jxnu.edu.cn',  // 使用正确的主机名
      // path: '/sockjs-node/',    // 确保 WebSocket 使用这个路径
    },
  },
})
