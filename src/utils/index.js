// 格式化时间
export const formatTime = (timestamp) => {
  // 确保时间戳是数字类型
  const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp
   
  
  // 创建日期对象（假设时间戳是秒级的）
  const date = new Date(ts * 1000)
   
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) { 
    return 'Invalid date'
  }
  
  // 获取当前时间
  const now = new Date()
  
  // 获取今天的开始时间（0点0分0秒）
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // 获取昨天的开始时间
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  // 获取前天的开始时间
  const beforeYesterday = new Date(today)
  beforeYesterday.setDate(beforeYesterday.getDate() - 2)
  
  // 获取本周的开始时间（周一）
  const thisWeek = new Date(today)
  thisWeek.setDate(today.getDate() - today.getDay() + 1)
  
  // 获取上周的开始时间（周一）
  const lastWeek = new Date(thisWeek)
  lastWeek.setDate(thisWeek.getDate() - 7)
  
  // 获取本月的开始时间（1号）
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  // 获取上月的开始时间（1号）
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  
  // 获取本年的开始时间（1月1号）
  const thisYear = new Date(today.getFullYear(), 0, 1)
  
  // 格式化时间
  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }
  
  // 判断时间范围并返回相应的格式化字符串
  if (date >= today) {
    // 今天，显示时间
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (date >= yesterday && date < today) {
    // 昨天，显示"昨天 时间"
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (date >= beforeYesterday && date < yesterday) {
    // 前天，显示"前天 时间"
    return `前天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (date >= thisWeek && date < today) {
    // 本周，显示星期几和时间
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return `星期${weekdays[date.getDay()]} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (date >= lastWeek && date < thisWeek) {
    // 上周，显示"上周几 时间"
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return `上周${weekdays[date.getDay()]} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (date >= thisMonth && date < today) {
    // 本月，显示"几月几日 时间"
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (date >= lastMonth && date < thisMonth) {
    // 上月，显示"几月几日 时间"
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (date >= thisYear && date < today) {
    // 今年，显示"几月几日 时间"
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else {
    // 更早，显示完整日期时间
    return formatDate(date)
  }
} 