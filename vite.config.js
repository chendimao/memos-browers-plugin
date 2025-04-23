import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import fs from 'fs'

// 复制 manifest.json 和图标文件到构建目录
const copyFiles = () => {
  return {
    name: 'copy-files',
    writeBundle() {
      // 复制 manifest.json
      fs.copyFileSync('manifest.json', 'dist/manifest.json')
      
      // 确保目标目录存在
      if (!fs.existsSync('dist/assets/icons')) {
        fs.mkdirSync('dist/assets/icons', { recursive: true })
      }
      
      // 复制图标文件
      const iconSizes = ['16', '48', '128']
      iconSizes.forEach(size => {
        const iconPath = `src/assets/icons/icon${size}.png`
        if (fs.existsSync(iconPath)) {
          fs.copyFileSync(iconPath, `dist/assets/icons/icon${size}.png`)
        }
      })

      // 复制后台脚本
      fs.copyFileSync('src/background.js', 'dist/background.js')
    }
  }
}

export default defineConfig({
  plugins: [vue(), copyFiles()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html')
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  base: './'
}) 