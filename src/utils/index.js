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

  // 返回 YYYY-MM-DD HH:mm:ss 格式
  const pad = (n) => n.toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())
  const second = pad(date.getSeconds())
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
} 