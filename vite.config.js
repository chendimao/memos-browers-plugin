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

      // 复制后台脚本和内容脚本
      fs.copyFileSync('background.js', 'dist/background.js')
      fs.copyFileSync('content.js', 'dist/content.js')
      
      // 复制 _locales 文件夹
      if (fs.existsSync('_locales')) {
        // 确保目标目录存在
        if (!fs.existsSync('dist/_locales')) {
          fs.mkdirSync('dist/_locales', { recursive: true })
        }
        
        // 复制所有语言文件夹
        const locales = fs.readdirSync('_locales')
        locales.forEach(locale => {
          const localePath = `_locales/${locale}`
          const distLocalePath = `dist/_locales/${locale}`
          
          // 确保目标语言目录存在
          if (!fs.existsSync(distLocalePath)) {
            fs.mkdirSync(distLocalePath, { recursive: true })
          }
          
          // 复制语言文件
          const files = fs.readdirSync(localePath)
          files.forEach(file => {
            fs.copyFileSync(`${localePath}/${file}`, `${distLocalePath}/${file}`)
          })
        })
      }
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