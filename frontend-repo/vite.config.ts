import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
  plugins: [react()],
  define: {
    global: 'window', // global을 window로 매핑
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: env.VITE_API_BASE_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost'
      },
     '/oauth2': {                                  // ✅ OAuth 엔드포인트도 프록시
      target: 'https://i13e206.p.ssafy.io',
      changeOrigin: true,
      secure: true,
      cookieDomainRewrite: 'localhost',
    },
    }
  }
  }
})
