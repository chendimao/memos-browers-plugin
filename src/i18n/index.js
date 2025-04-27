import { languages, messages } from './messages'

// 获取当前语言
export const getCurrentLanguage = () => {
  return localStorage.getItem('memos-language') || 'zh'
}

// 设置语言
export const setLanguage = (lang) => {
  if (languages[lang]) {
    localStorage.setItem('memos-language', lang)
    return true
  }
  return false
}

// 获取翻译
export const t = (key) => {
  const lang = getCurrentLanguage()
  const keys = key.split('.')
  let value = messages[lang]
  
  for (const k of keys) {
    if (value && value[k]) {
      value = value[k]
    } else {
      return key
    }
  }
  
  return value
}

// 获取所有支持的语言
export const getSupportedLanguages = () => {
  return Object.values(languages)
}

// 获取语言名称
export const getLanguageName = (code) => {
  return languages[code]?.name || code
}

// 导出语言配置
export { languages, messages } 