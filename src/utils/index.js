// 格式化时间
export const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  let date
  // 检查是否是 ISO 8601 格式的字符串
  if (typeof timestamp === 'string' && timestamp.includes('T')) {
    date = new Date(timestamp)
  } else {
    // 处理数字类型的时间戳
    const numTimestamp = Number(timestamp)
    if (isNaN(numTimestamp)) return ''
    
    // 检查时间戳是秒还是毫秒
    if (numTimestamp.toString().length === 10) {
      date = new Date(numTimestamp * 1000) // 秒级时间戳
    } else {
      date = new Date(numTimestamp) // 毫秒级时间戳
    }
  }
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    console.error('Invalid date:', timestamp)
    return ''
  }
  
  const now = new Date()
  const diff = now - date
  const oneDay = 24 * 60 * 60 * 1000
  
  // 今天
  if (diff < oneDay && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  // 昨天
  if (diff < 2 * oneDay && date.getDate() === now.getDate() - 1) {
    return '昨天 ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  // 本周
  if (diff < 7 * oneDay) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return days[date.getDay()] + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  // 今年
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: '2-digit', day: '2-digit' })
  }
  
  // 其他
  return date.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' })
} 