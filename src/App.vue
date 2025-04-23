<template>
  <div class="memos-extension" :style="{ width: settings.width + 'px', height: settings.height + 'px' }">
    <header>
      <h1>MEMOS</h1>
      <div class="settings-icon" @click="showSettings = true">
        <i class="fas fa-cog"></i>
      </div>
    </header>

    <!-- 设置面板 -->
    <div v-if="showSettings" class="settings-panel">
      <h2>基本设置</h2>
      <div class="form-group">
        <label>Memos 主页网址</label>
        <input v-model="settings.host" type="text" placeholder="请输入 Memos 主页网址">
      </div>
      <div class="form-group">
        <label>API 版本</label>
        <select v-model="settings.apiVersion">
          <option value="v1">0.18.x</option>
          <option value="v2">0.24.x</option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ settings.apiVersion === 'v1' ? 'Access Token' : 'Access Token / OpenAPI' }}</label>
        <input v-model="settings.token" type="password" :placeholder="settings.apiVersion === 'v1' ? '请输入 Memos Access Tokens' : '请输入 Access Token 或 OpenAPI'">
      </div>

      <h2>内容设置</h2>
      <div class="form-group checkbox">
        <input type="checkbox" id="addSource" v-model="settings.addSource">
        <label for="addSource">自动添加来源信息</label>
      </div>
      <div class="form-group checkbox">
        <input type="checkbox" id="addTag" v-model="settings.addTag">
        <label for="addTag">自动添加 #quick-capture 标签</label>
      </div>
      <div class="form-group checkbox">
        <input type="checkbox" id="useQuote" v-model="settings.useQuote">
        <label for="useQuote">使用引用格式（>）包裹选中文本</label>
      </div>

      <h2>默认设置</h2>
      <div class="form-group">
        <label>默认可见性</label>
        <select v-model="settings.defaultVisibility">
          <option value="PUBLIC">所有人可见</option>
          <option value="PRIVATE">仅自己可见</option>
          <option value="PROTECTED">登录可见</option>
        </select>
      </div>
      <div class="form-group">
        <label>自定义标签</label>
        <input v-model="settings.customTags" type="text" placeholder="用逗号分隔，如: daily,note">
      </div>
      <div class="form-group">
        <label>内容模板</label>
        <textarea
          v-model="settings.template"
          placeholder="可用变量：{content}, {url}, {title}, {date}"
          rows="3"
        ></textarea>
      </div>

      <h2>快捷键设置</h2>
      <div class="form-group checkbox">
        <input type="checkbox" id="enableShortcuts" v-model="settings.enableShortcuts">
        <label for="enableShortcuts">启用快捷键</label>
      </div>
      <div class="shortcut-list" v-if="settings.enableShortcuts">
        <div class="shortcut-item">
          <span>Ctrl/Cmd + Enter</span>
          <span>快速保存</span>
        </div>
        <div class="shortcut-item">
          <span>Ctrl/Cmd + Shift + P</span>
          <span>切换可见性</span>
        </div>
      </div>

      <h2>标签设置</h2>
      <div class="form-group">
        <label>标签输入后行为</label>
        <select v-model="settings.tagBehavior">
          <option value="space">添加空格</option>
          <option value="newline">添加换行</option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ settings.tagBehavior === 'space' ? '空格' : '换行' }}数量</label>
        <div class="number-input">
          <button @click="decrementCount" type="button" class="number-btn">-</button>
          <input 
            type="number" 
            v-model.number="settings.tagSpaceCount" 
            min="1" 
            max="5"
            class="count-input"
          >
          <button @click="incrementCount" type="button" class="number-btn">+</button>
        </div>
        <div class="preview-box">
          预览：<span class="preview-content">{{ tagEndingPreview }}</span>
        </div>
      </div>

      <h2>页面设置</h2>
      <div class="form-group">
        <label>宽度 (px)</label>
        <div class="number-input">
          <button @click="decrementWidth" type="button" class="number-btn">-</button>
          <input 
            type="number" 
            v-model.number="settings.width" 
            min="300" 
            max="800"
            class="count-input"
          >
          <button @click="incrementWidth" type="button" class="number-btn">+</button>
        </div>
      </div>
      <div class="form-group">
        <label>高度 (px)</label>
        <div class="number-input">
          <button @click="decrementHeight" type="button" class="number-btn">-</button>
          <input 
            type="number" 
            v-model.number="settings.height" 
            min="200" 
            max="600"
            class="count-input"
          >
          <button @click="incrementHeight" type="button" class="number-btn">+</button>
        </div>
      </div>

      <h2>配置管理</h2>
      <div class="form-group">
        <button class="export-btn" @click="exportSettings">导出配置</button>
        <label class="import-btn">
          导入配置
          <input 
            type="file" 
            accept=".json" 
            @change="importSettings"
            style="display: none"
          >
        </label>
      </div>

      <button class="save-btn" @click="saveSettings">保存</button>
      
      <!-- 调试信息 -->
      <div v-if="isDev" class="debug-info">
        <pre>{{ debugInfo }}</pre>
      </div>
    </div>

    <!-- 主编辑器区域 -->
    <div v-else class="editor-container">
      <!-- 文件上传预览区 -->
      <div v-if="uploadedFiles.length > 0" class="upload-preview">
        <div v-for="file in uploadedFiles" :key="file.id" class="upload-item">
          <div class="upload-content">
            <img v-if="file.type.startsWith('image/')" :src="file.url" :alt="file.name">
            <div v-else class="file-info">
              <i class="fas fa-file"></i>
              <span>{{ file.name }}</span>
            </div>
          </div>
          <button class="remove-file" @click="removeFile(file.id)">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div class="editor-wrapper">
        <textarea
          v-model="content"
          placeholder="现在的想法是..."
          class="content-editor"
          @keydown.ctrl.enter.prevent="submitMemo"
          @keydown.meta.enter.prevent="submitMemo"
          @drop.prevent="handleDrop"
          @paste="handlePaste"
          @input="handleInput"
          @keydown="handleKeydown"
          ref="editorRef"
        ></textarea>
        
        <!-- 标签补全弹窗 -->
        <div v-if="showTagSuggestions && filteredTags.length > 0" class="tag-suggestions">
          <div
            v-for="(tag, index) in filteredTags"
            :key="tag"
            :class="['tag-item', { active: index === activeTagIndex }]"
            @click="selectTag(tag)"
          >
            #{{ tag }}
            <span class="tag-count" v-if="tagCounts[tag]">({{ tagCounts[tag] }})</span>
          </div>
        </div>
      </div>
      
      <div class="toolbar">
        <div class="left-tools">
          <button title="标题" @click="insertMarkdown('#')">#</button>
          <button title="列表" @click="insertMarkdown('- ')"><i class="fas fa-list"></i></button>
          <button title="引用" @click="insertMarkdown('> ')"><i class="fas fa-quote-right"></i></button>
          <button title="链接" @click="insertMarkdown('[链接文字](url)')"><i class="fas fa-link"></i></button>
          <label class="upload-btn" title="上传图片">
            <i class="fas fa-image"></i>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              @change="handleFileUpload"
              style="display: none"
            >
          </label>
          <label class="upload-btn" title="上传文件">
            <i class="fas fa-paperclip"></i>
            <input 
              type="file" 
              multiple 
              @change="handleFileUpload"
              style="display: none"
            >
          </label>
        </div>
        <div class="right-tools">
          <select v-model="visibility">
            <option value="PUBLIC">所有人可见</option>
            <option value="PRIVATE">仅自己可见</option>
            <option value="PROTECTED">登录可见</option>
          </select>
          <button class="submit-btn" @click="submitMemo">记下</button>
        </div>
      </div>

      <!-- 上传进度条 -->
      <div v-if="isUploading" class="upload-progress">
        <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
        <span class="progress-text">上传中... {{ uploadProgress }}%</span>
      </div>
    </div>

    <!-- Toast 提示组件 -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      <i :class="toastIcon"></i>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useStorage } from '@vueuse/core'

// 开发模式标志
const isDev = ref(process.env.NODE_ENV === 'development')

const showSettings = ref(false)
const content = ref('')
const visibility = ref('PUBLIC')
const lastError = ref(null)

// 扩展配置
const settings = useStorage('memos-settings', {
  host: '',
  token: '',
  apiVersion: 'v1', // 'v1' 对应 0.18 版本，'v2' 对应 0.24 版本
  // 内容设置
  addSource: true,
  addTag: true,
  useQuote: true,
  defaultVisibility: 'PRIVATE',
  customTags: '',
  template: '{content}\n\n来源：[{title}]({url})',
  // 快捷键设置
  enableShortcuts: true,
  // 标签设置
  tagBehavior: 'space',    // 'space' 或 'newline'
  tagSpaceCount: 1,        // 空格或换行的数量
  // 页面设置
  width: 450,
  height: 300,
})

// 调试信息
const debugInfo = computed(() => ({
  settings: settings.value,
  content: content.value,
  visibility: visibility.value,
  lastError: lastError.value,
  isDev: isDev.value
}))

// 文件上传相关状态
const uploadedFiles = ref([])
const isUploading = ref(false)
const uploadProgress = ref(0)

// 标签相关状态
const tags = ref([])
const tagCounts = ref({})
const showTagSuggestions = ref(false)
const activeTagIndex = ref(0)
const currentTagInput = ref('')
const editorRef = ref(null)

// 计算标签结束符预览
const tagEndingPreview = computed(() => {
  const count = Math.min(Math.max(settings.value.tagSpaceCount, 1), 5)
  const char = settings.value.tagBehavior === 'space' ? ' ' : '⏎'
  return `#tag${char.repeat(count)}`
})

// 添加字数统计
const wordCount = computed(() => {
  return content.value.length
})

// Toast 提示状态
const toast = ref({
  show: false,
  message: '',
  type: 'success' // success, error, info
})

// 计算 Toast 图标
const toastIcon = computed(() => {
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle'
  }
  return icons[toast.value.type]
})

// 显示 Toast 提示
const showToast = (message, type = 'success') => {
  toast.value = {
    show: true,
    message,
    type
  }
  
  // 3秒后自动隐藏
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

// API 处理函数
const apiHandler = {
  v1: {
    async createMemo(content, visibility) {
      const response = await fetch(`${settings.value.host}/api/v1/memo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.value.token}`
        },
        body: JSON.stringify({
          content,
          visibility
        })
      })
      return response
    },
    async testConnection() {
      try {
        const response = await fetch(`${settings.value.host}/api/v1/status`, {
          headers: {
            'Authorization': `Bearer ${settings.value.token}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('API 状态:', data)
        return response
      } catch (error) {
        console.error('API 测试错误:', error)
        throw error
      }
    },
    async uploadResource(file) {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${settings.value.host}/api/v1/resource/blob`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.value.token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('上传失败')
      }

      const data = await response.json()
      return {
        id: data.id,
        url: `${settings.value.host}/o/r/${data.id}/${data.name}`,
        type: file.type,
        name: file.name
      }
    },
    async getTags() {
      const response = await fetch(`${settings.value.host}/api/v1/tag`, {
        headers: {
          'Authorization': `Bearer ${settings.value.token}`
        }
      })
      if (!response.ok) throw new Error('获取标签失败')
      const data = await response.json()
      return data
    }
  },
  v2: {
    async createMemo(content, visibility) {
      const response = await fetch(`${settings.value.host}/api/v1/memos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.value.token}`
        },
        body: JSON.stringify({
          content,
          visibility,
          createdTs: Date.now(),
          relationList: [],
          resourceIdList: []
        })
      })
      return response
    },
    async testConnection() {
      try {
        const response = await fetch(`${settings.value.host}/api/v1/auth/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.value.token}`
          },
          body: JSON.stringify({})
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('API 状态:', data)
        
        // 检查返回数据是否包含必要的字段
        if (!data.name || !data.role) {
          throw new Error('无效的 API 响应')
        }
        
        // 检查用户状态
        if (data.state !== 'NORMAL') {
          throw new Error('用户状态异常')
        }
        
        return { ok: true, data }
      } catch (error) {
        console.error('API 测试错误:', error)
        throw error
      }
    },
    async uploadResource(file) {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${settings.value.host}/api/v1/resources`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.value.token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('上传失败')
      }

      const data = await response.json()
      return {
        id: data.id,
        url: data.externalLink || `${settings.value.host}/o/r/${data.id}`,
        type: file.type,
        name: file.name
      }
    },
    async getTags() {
      const response = await fetch(`${settings.value.host}/api/v1/tag`, {
        headers: {
          'Authorization': `Bearer ${settings.value.token}`
        }
      })
      if (!response.ok) throw new Error('获取标签失败')
      const data = await response.json()
      return data
    }
  }
}

// 格式化内容
const formatContent = (text, sourceUrl, sourceTitle) => {
  let formatted = text

  // 使用引用格式
  if (settings.value.useQuote) {
    formatted = formatted.split('\n').map(line => `> ${line}`).join('\n')
  }

  // 添加来源信息
  if (settings.value.addSource && sourceUrl && sourceTitle) {
    const template = settings.value.template || '{content}\n\n来源：[{title}]({url})'
    formatted = template
      .replace('{content}', formatted)
      .replace('{url}', sourceUrl)
      .replace('{title}', sourceTitle)
      .replace('{date}', new Date().toLocaleString())
  }

  // 添加自定义标签
  if (settings.value.customTags) {
    const tags = settings.value.customTags.split(',').map(tag => `#${tag.trim()}`).join(' ')
    formatted = `${formatted}\n\n${tags}`
  }

  // 添加快速捕获标签
  if (settings.value.addTag) {
    formatted = `${formatted}\n\n#quick-capture`
  }

  return formatted
}

// 监听选中文本
onMounted(() => {
  // 设置默认可见性
  visibility.value = settings.value.defaultVisibility

  // 检查是否有存储的选中文本
  chrome.storage.local.get(['selectedText', 'sourceUrl', 'sourceTitle'], (result) => {
    if (result.selectedText) {
      content.value = formatContent(result.selectedText, result.sourceUrl, result.sourceTitle)
      chrome.storage.local.remove(['selectedText', 'sourceUrl', 'sourceTitle'])
    }
  })

  // 监听存储变化
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.selectedText && changes.selectedText.newValue) {
      content.value = formatContent(
        changes.selectedText.newValue,
        changes.sourceUrl.newValue,
        changes.sourceTitle.newValue
      )
    }
  })

  // 添加快捷键支持
  if (settings.value.enableShortcuts) {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + P: 切换可见性
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        const visibilities = ['PUBLIC', 'PROTECTED', 'PRIVATE']
        const currentIndex = visibilities.indexOf(visibility.value)
        visibility.value = visibilities[(currentIndex + 1) % visibilities.length]
      }
    })
  }

  fetchTags()
})

const saveSettings = async () => {
  console.log('保存设置:', settings.value)
  
  if (!settings.value.host) {
    showToast('主页网址不能为空', 'error')
    return
  }
  if (!settings.value.token) {
    showToast('Access Token 不能为空', 'error')
    return
  }

  try {
    // 测试 API 连接
    const isConnected = await testConnection()
    if (isConnected) {
      showSettings.value = false
      showToast('设置保存成功')
      // 保存成功后刷新标签
      await fetchTags()
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    showToast(`保存失败: ${error.message}`, 'error')
  }
}

const testConnection = async () => {
  try {
    const api = apiHandler[settings.value.apiVersion]
    const result = await api.testConnection()
    
    if (!result.ok) {
      throw new Error('API 连接失败')
    }
    
    const data = result.data
    console.log('API 状态:', data)
    
    // 版本检查
    if (settings.value.apiVersion === 'v2') {
      // 检查 0.24 版本特有的字段
      if (!data.name || !data.role) {
        throw new Error('API 版本不兼容')
      }
    }
    
    return true
  } catch (error) {
    console.error('API 测试错误:', error)
    lastError.value = error.message
    showToast(`连接测试失败: ${error.message}`, 'error')
    return false
  }
}

// 增强的 Markdown 插入函数
const insertMarkdown = (prefix, suffix = '') => {
  const textarea = editorRef.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = content.value
  
  // 获取选中的文本
  const selection = text.substring(start, end)
  
  // 如果有选中文本，在其前后添加标记
  if (selection) {
    content.value = text.substring(0, start) + prefix + selection + suffix + text.substring(end)
    // 保持选中状态
    nextTick(() => {
      textarea.setSelectionRange(
        start + prefix.length,
        end + prefix.length
      )
    })
  } else {
    // 如果没有选中文本，插入标记并将光标置于中间
    content.value = text.substring(0, start) + prefix + suffix + text.substring(end)
    const newCursorPos = start + prefix.length
    nextTick(() => {
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    })
  }
  textarea.focus()
}

// 插入代码块
const insertCodeBlock = () => {
  const template = '\n```\n\n```\n'
  insertMarkdown(template)
  // 将光标移动到代码块中间
  const textarea = editorRef.value
  const cursorPos = textarea.selectionStart - 4
  nextTick(() => {
    textarea.setSelectionRange(cursorPos, cursorPos)
  })
}

// 插入表格
const insertTable = () => {
  const template = '\n| 标题1 | 标题2 | 标题3 |\n| --- | --- | --- |\n| 内容1 | 内容2 | 内容3 |\n'
  insertMarkdown(template)
}

// 处理文件上传
const handleFileUpload = async (event) => {
  const files = event.target.files
  if (!files.length) return

  try {
    isUploading.value = true
    const api = apiHandler[settings.value.apiVersion]
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      uploadProgress.value = Math.round((i / files.length) * 100)
      
      const uploadedFile = await api.uploadResource(file)
      uploadedFiles.value.push(uploadedFile)
      
      // 根据文件类型插入不同的 Markdown
      if (file.type.startsWith('image/')) {
        insertMarkdown(`![${file.name}](${uploadedFile.url})`)
      } else {
        insertMarkdown(`[${file.name}](${uploadedFile.url})`)
      }
    }

    event.target.value = '' // 清除文件选择
  } catch (error) {
    console.error('上传错误:', error)
    showToast('上传失败：' + error.message, 'error')
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

// 处理拖放上传
const handleDrop = async (event) => {
  event.preventDefault()
  const files = event.dataTransfer.files
  if (files.length > 0) {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.files = files
    handleFileUpload({ target: input })
  }
}

// 处理粘贴上传
const handlePaste = async (event) => {
  const clipboardData = event.clipboardData || event.originalEvent.clipboardData
  const items = clipboardData.items

  // 检查是否有文本内容
  const hasText = Array.from(items).some(item => item.type === 'text/plain')
  
  // 收集所有文件
  const files = []
  let hasImageFromUrl = false

  for (const item of items) {
    // 处理文件类型
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file) {
        // 如果是截图，重命名文件
        if (file.name === 'image.png') {
          const newFile = new File([file], `screenshot-${new Date().getTime()}.png`, {
            type: file.type
          })
          files.push(newFile)
        } else {
          files.push(file)
        }
      }
    }
    // 检查是否包含图片URL
    else if (item.type === 'text/plain' && !hasImageFromUrl) {
      try {
        const text = await new Promise(resolve => item.getAsString(resolve))
        // 检查是否是图片URL
        if (text.match(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i)) {
          hasImageFromUrl = true
          // 从URL获取图片
          const response = await fetch(text)
          const blob = await response.blob()
          const fileName = text.split('/').pop()
          const file = new File([blob], fileName, { type: blob.type })
          files.push(file)
        }
      } catch (error) {
        console.error('处理图片URL失败:', error)
      }
    }
  }

  // 如果有文件且不是纯文本粘贴，则处理文件上传
  if (files.length > 0 && (!hasText || hasImageFromUrl)) {
    event.preventDefault() // 阻止默认粘贴行为
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    
    // 创建 DataTransfer 对象并添加文件
    const dataTransfer = new DataTransfer()
    files.forEach(file => dataTransfer.items.add(file))
    input.files = dataTransfer.files
    
    await handleFileUpload({ target: input })
  }
}

// 移除文件
const removeFile = (fileId) => {
  const index = uploadedFiles.value.findIndex(f => f.id === fileId)
  if (index !== -1) {
    uploadedFiles.value.splice(index, 1)
  }
}

// 修改提交函数以包含资源ID
const submitMemo = async () => {
  console.log('准备提交内容:', {
    content: content.value,
    visibility: visibility.value,
    apiVersion: settings.value.apiVersion
  })

  if (!settings.value.host || !settings.value.token) {
    console.error('配置无效')
    showToast('请先配置 Memos 设置', 'error')
    showSettings.value = true
    return
  }

  try {
    const api = apiHandler[settings.value.apiVersion]
    const resourceIds = uploadedFiles.value.map(file => file.id)
    
    const response = await api.createMemo(
      content.value, 
      visibility.value,
      resourceIds
    )
    
    if (response.ok) {
      content.value = ''
      uploadedFiles.value = [] // 清除已上传文件列表
      showToast('保存成功！')
    } else {
      const responseData = await response.json()
      showToast(`保存失败: ${responseData.message || response.statusText}`, 'error')
    }
  } catch (error) {
    console.error('提交错误:', error)
    lastError.value = error.message
    showToast(`保存失败：${error.message}`, 'error')
  }
}

// 获取所有标签
const fetchTags = async () => {
  try {
    const api = apiHandler[settings.value.apiVersion]
    const data = await api.getTags()
    
    // 处理不同版本的API返回格式
    if (settings.value.apiVersion === 'v1') {
      tags.value = data
      // v1版本可能没有标签计数，设置默认值1
      tagCounts.value = data.reduce((acc, tag) => {
        acc[tag] = 1
        return acc
      }, {})
    } else {
      // v2版本的标签数据处理
      tags.value = data.map(tag => tag.name)
      tagCounts.value = data.reduce((acc, tag) => {
        acc[tag.name] = tag.count
        return acc
      }, {})
    }
  } catch (error) {
    console.error('获取标签失败:', error)
  }
}

// 处理输入事件
const handleInput = () => {
  const textarea = editorRef.value
  const text = textarea.value
  const position = textarea.selectionStart
  
  // 查找当前正在输入的标签
  const beforeCursor = text.slice(0, position)
  const match = beforeCursor.match(/#([^#\s]*)$/)
  
  if (match) {
    currentTagInput.value = match[1].toLowerCase()
    showTagSuggestions.value = true
    activeTagIndex.value = 0
  } else {
    showTagSuggestions.value = false
  }
}

// 计算过滤后的标签
const filteredTags = computed(() => {
  if (!currentTagInput.value) return tags.value
  return tags.value.filter(tag => 
    tag.toLowerCase().includes(currentTagInput.value) &&
    tag.toLowerCase() !== currentTagInput.value
  )
})

// 处理键盘事件
const handleKeydown = (e) => {
  if (!showTagSuggestions.value) return
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      activeTagIndex.value = (activeTagIndex.value + 1) % filteredTags.value.length
      break
    case 'ArrowUp':
      e.preventDefault()
      activeTagIndex.value = (activeTagIndex.value - 1 + filteredTags.value.length) % filteredTags.value.length
      break
    case 'Enter':
    case 'Tab':
      if (filteredTags.value.length > 0) {
        e.preventDefault()
        selectTag(filteredTags.value[activeTagIndex.value])
      }
      break
    case 'Escape':
      showTagSuggestions.value = false
      break
  }
}

// 选择标签
const selectTag = (tag) => {
  const textarea = editorRef.value
  const text = textarea.value
  const position = textarea.selectionStart
  const beforeCursor = text.slice(0, position)
  const afterCursor = text.slice(position)
  
  // 根据设置生成结束符
  const count = Math.min(Math.max(settings.value.tagSpaceCount, 1), 5)
  const ending = settings.value.tagBehavior === 'space' 
    ? ' '.repeat(count)
    : '\n'.repeat(count)
  
  // 替换当前正在输入的标签
  const newBeforeCursor = beforeCursor.replace(/#[^#\s]*$/, `#${tag}${ending}`)
  
  content.value = newBeforeCursor + afterCursor
  
  // 设置光标位置
  nextTick(() => {
    const newPosition = newBeforeCursor.length
    textarea.setSelectionRange(newPosition, newPosition)
    textarea.focus()
  })
  
  showTagSuggestions.value = false
}

// 数量调整函数
const incrementCount = () => {
  if (settings.value.tagSpaceCount < 5) {
    settings.value.tagSpaceCount++
  }
}

const decrementCount = () => {
  if (settings.value.tagSpaceCount > 1) {
    settings.value.tagSpaceCount--
  }
}

// 页面尺寸调整方法
const incrementWidth = () => {
  if (settings.value.width < 800) {
    settings.value.width += 50
  }
}

const decrementWidth = () => {
  if (settings.value.width > 300) {
    settings.value.width -= 50
  }
}

const incrementHeight = () => {
  if (settings.value.height < 600) {
    settings.value.height += 50
  }
}

const decrementHeight = () => {
  if (settings.value.height > 200) {
    settings.value.height -= 50
  }
}

// 配置导入导出方法
const exportSettings = () => {
  const settingsData = {
    ...settings.value,
    // 移除一些不需要导出的属性
    width: undefined,
    height: undefined
  }
  const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'memos-settings.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const importSettings = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const importedSettings = JSON.parse(e.target.result)
      // 验证导入的配置是否有效
      if (!importedSettings.host || !importedSettings.token) {
        throw new Error('无效的配置文件')
      }
      
      // 保留当前的页面尺寸设置
      const currentWidth = settings.value.width
      const currentHeight = settings.value.height
      
      // 更新设置
      Object.assign(settings.value, importedSettings)
      settings.value.width = currentWidth
      settings.value.height = currentHeight
      
      showToast('配置导入成功！')
    } catch (error) {
      console.error('导入配置失败:', error)
      showToast(`导入配置失败: ${error.message}`, 'error')
    }
  }
  reader.readAsText(file)
  event.target.value = '' // 清除文件选择
}

// 监听页面尺寸变化
watch(() => [settings.value.width, settings.value.height], ([newWidth, newHeight]) => {
  // 使用 document.documentElement.style 来设置弹窗尺寸
  document.documentElement.style.width = `${newWidth}px`
  document.documentElement.style.height = `${newHeight}px`
}, { immediate: true })
</script>

<style scoped>
.memos-extension {
  width: 400px;
  min-height: 300px;
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

h1, h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

h2 {
  font-size: 16px;
  margin: 16px 0 8px;
  color: #666;
}

.settings-icon {
  cursor: pointer;
  color: #666;
}

.settings-panel {
  padding: 16px;
  position: relative;
  min-height: 100%;
  padding-bottom: 80px; /* 为固定按钮留出空间 */
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
   
}

.form-group.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-group.checkbox label {
  margin: 0;
  cursor: pointer;
}

input[type="text"],
input[type="password"],
select,
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

textarea {
  resize: vertical;
  min-height: 60px;
}

.shortcut-list {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 8px;
  margin-top: 8px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 12px;
  color: #666;
}

.save-btn {
  position: fixed;
  bottom: 16px;
  left: 16px;
  right: 16px;
  padding: 8px;
  background: #10B981;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.save-btn:hover {
  background: #0D9F6E;
}

.editor-container {
  padding: 16px;
}

.editor-wrapper {
  position: relative;
  width: 100%;
}

.content-editor {
  width: 100%;
  height: 150px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 4px;
  resize: none;
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.6;
  position: relative;
  z-index: 1;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.left-tools button {
  margin-right: 8px;
  padding: 4px 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
}

.right-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.submit-btn {
  padding: 6px 16px;
  background: #10B981;
  color: white;
  border: none;
  width: 130px;
  border-radius: 4px;
  cursor: pointer;
}

/* 调试信息样式 */
.debug-info {
  margin-top: 16px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.debug-info pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.upload-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  max-height: 120px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.upload-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #eee;
}

.upload-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-content img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  text-align: center;
}

.file-info i {
  font-size: 24px;
  margin-bottom: 4px;
  color: #666;
}

.file-info span {
  font-size: 10px;
  color: #666;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.remove-file {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  cursor: pointer;
  color: #666;
}

.upload-progress {
  margin-top: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  height: 4px;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: #10B981;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: #666;
}

/* 拖放上传区域样式 */
.content-editor.dragover {
  border-color: #10B981;
  background-color: rgba(16, 185, 129, 0.05);
}

.tag-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #eee;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.tag-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag-item:hover,
.tag-item.active {
  background: #f5f5f5;
}

.tag-count {
  color: #666;
  font-size: 12px;
}

.number-input {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.number-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #666;
}

.number-btn:hover {
  background: #f5f5f5;
}

.count-input {
  width: 60px;
  text-align: center;
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.preview-box {
  margin-top: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
}

.preview-content {
  font-family: monospace;
  background: #fff;
  padding: 2px 4px;
  border-radius: 2px;
  margin-left: 4px;
}

/* 确保数字输入框不显示箭头 */
.count-input::-webkit-inner-spin-button,
.count-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.count-input {
  -moz-appearance: textfield;
}

.export-btn,
.import-btn {
  display: inline-block;
  padding: 8px 16px;
  margin-top: 5px;
  background: #10B981;
  color: white;
  border: none;
  width: 140px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
  text-align: center;
}

.import-btn {
  background: #3B82F6;
}

.export-btn:hover,
.import-btn:hover {
  opacity: 0.9;
}

/* Toast 提示样式 */
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slideDown 0.3s ease-out;
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

@keyframes slideDown {
  from {
    transform: translate(-50%, -100%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}
</style> 