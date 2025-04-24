/**
 * 显示全局 Toast 提示
 * @param {string} message - 提示消息
 * @param {string} type - 提示类型 ('success', 'error', 'info')
 */
export const showToast = (message, type = 'success') => {
  // 创建 toast 元素
  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  
  // 创建图标
  const icon = document.createElement('i')
  icon.className = getToastIcon(type)
  
  // 创建消息文本
  const text = document.createElement('span')
  text.textContent = message
  
  // 组装 toast
  toast.appendChild(icon)
  toast.appendChild(text)
  
  // 添加到页面
  document.body.appendChild(toast)
  
  // 添加动画
  setTimeout(() => {
    toast.style.opacity = '1'
    toast.style.transform = 'translate(-50%, 0)'
  }, 10)
  
  // 3秒后移除
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translate(-50%, -100%)'
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 300)
  }, 3000)
}

/**
 * 获取 Toast 图标类名
 * @param {string} type - 提示类型
 * @returns {string} 图标类名
 */
const getToastIcon = (type) => {
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle'
  }
  return icons[type] || icons.success
}

// 添加全局样式
const style = document.createElement('style')
style.textContent = `
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translate(-50%, -100%);
  padding: 12px 24px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: all 0.3s ease-out;
  z-index: 1000;
}

.toast.success {
  background: #10B981;
  color: white;
}

.toast.error {
  background: #EF4444;
  color: white;
}

.toast.info {
  background: #3B82F6;
  color: white;
}
`
document.head.appendChild(style) 