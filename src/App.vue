<template>
  <div class="memos-extension" :class="settings.theme" :style="{ width: settings.width + 'px', height: settings.height + 'px' }">
    <header>
      <h1>MEMOS</h1>
      <div class="settings-icon" @click="openSettings">
        <i class="fas fa-cog"></i>
      </div>
    </header>

    <!-- 设置面板 -->
    <Setting
      v-model:content="content"
      v-model:settings="settings"
      :editorRef="editorRef"
      v-model:showSettings="showSettings"
      @settings-saved="handleSettingsSaved"
    />

    <!-- 主编辑器区域 -->
    <div v-if="!showSettings" class="editor-container">
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
        
        <!-- 添加预览面板 -->
        <div v-if="showPreview && settings.enablePreview" class="preview-panel">
          <div class="preview-content" v-html="previewContent"></div>
        </div>
        
        <!-- 添加统计信息 -->
        <div v-if="settings.showWordCount" class="stats-panel">
          <span>字数: {{ wordCount }}</span>
          <span>字符: {{ charCount }}</span>
          <span>行数: {{ lineCount }}</span>
        </div>
      </div>
      
      <div class="toolbar">
        <!-- Markdown 操作菜单 -->
        <div class="markdown-tools">
          <button title="标题 (Ctrl+H)" @click="insertMarkdown('# ')"><i class="fas fa-heading"></i></button>
          <button title="粗体 (Ctrl+B)" @click="insertMarkdown('**', '**')"><i class="fas fa-bold"></i></button>
          <button title="斜体 (Ctrl+I)" @click="insertMarkdown('*', '*')"><i class="fas fa-italic"></i></button>
          <button title="删除线" @click="insertMarkdown('~~', '~~')"><i class="fas fa-strikethrough"></i></button>
          <span class="divider"></span>
          <button title="无序列表" @click="insertMarkdown('- ')"><i class="fas fa-list-ul"></i></button>
          <button title="有序列表" @click="insertMarkdown('1. ')"><i class="fas fa-list-ol"></i></button>
          <button title="任务列表" @click="insertMarkdown('- [ ] ')"><i class="fas fa-tasks"></i></button>
          <span class="divider"></span>
          <button title="引用" @click="insertMarkdown('> ')"><i class="fas fa-quote-right"></i></button>
          <button title="代码块" @click="insertCodeBlock"><i class="fas fa-code"></i></button>
          <button title="表格" @click="insertTable"><i class="fas fa-table"></i></button>
          <button title="链接 (Ctrl+K)" @click="insertMarkdown('[', '](url)')"><i class="fas fa-link"></i></button>
          <button title="分割线" @click="insertMarkdown('\n---\n')"><i class="fas fa-minus"></i></button>
        </div>
        
        <!-- 其他操作菜单 -->
        <div class="action-tools">
          <div class="left-tools">
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
            <button 
              class="preview-btn" 
              :class="{ active: showPreview }"
              @click="showPreview = !showPreview"
              title="预览"
            >
              <i class="fas fa-eye"></i>
            </button>
          </div>
          <div class="right-tools">
            <TagSelector
              v-model="selectedCustomTags"
              :options="availableCustomTags"
              placeholder="选择标签..."
              @update:modelValue="handleCustomTagsChange"
            />
            <CustomSelect
              v-model="visibility"
              :options="[
                { value: 'PUBLIC', label: '所有人可见' },
                { value: 'PRIVATE', label: '仅自己可见' },
                { value: 'PROTECTED', label: '登录可见' }
              ]"
            />
            <button class="submit-btn" @click="submitMemo">记下</button>
          </div>
        </div>
      </div>

      <!-- 上传进度条 -->
      <div v-if="isUploading" class="upload-progress">
        <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
        <span class="progress-text">上传中... {{ uploadProgress }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { useStorage } from '@vueuse/core'
import { createApiService } from './api'
import Setting from "./views/setting.vue"
import { showToast } from './utils/toast'
import TagSelector from './components/TagSelector.vue'
import CustomSelect from './components/CustomSelect.vue'

// 开发模式标志
const isDev = ref(process.env.NODE_ENV === 'development')

// 状态管理
const showSettings = ref(false)
const content = ref('')
const visibility = ref('PUBLIC')
const lastError = ref(null)
const editorRef = ref(null)
const showPreview = ref(false)

// 使用 useStorage 管理设置
const settings = useStorage('memos-settings', {
  host: '',
  token: '',
  apiVersion: 'v18',
  addSource: true,
  addTag: true,
  useQuote: true,
  skipDefaultTags: false,
  defaultVisibility: 'PRIVATE',
  customTags: '',
  template: '{content}\n\n来源：[{title}]({url})',
  enableShortcuts: true,
  tagBehavior: 'space',
  tagSpaceCount: 1,
  width: 450,
  height: 300,
  showWordCount: true,
  enablePreview: true,
  theme: 'light'
})

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

// 添加自定义标签相关状态
const selectedCustomTags = ref([])
const availableCustomTags = ref([])

// 标签选择相关状态
const showTagDropdown = ref(false)
const tagFilter = ref('')
const tagInput = ref(null)

// 过滤后的可用标签
const filteredAvailableTags = computed(() => {
  if (!tagFilter.value) return availableCustomTags.value
  return availableCustomTags.value.filter(tag =>
    tag.toLowerCase().includes(tagFilter.value.toLowerCase())
  )
})

// 计算属性
const wordCount = computed(() => content.value.length)
const charCount = computed(() => content.value.replace(/\s/g, '').length)
const lineCount = computed(() => content.value.split('\n').length)
const debugInfo = computed(() => ({
  settings: settings.value,
  content: content.value,
  visibility: visibility.value,
  lastError: lastError.value,
  isDev: isDev.value
}))

// 添加预览内容计算属性
const previewContent = computed(() => {
  // 这里可以添加 Markdown 解析逻辑
  return content.value
})

// 方法
const openSettings = () => {
  showSettings.value = true
}

const handleSettingsSaved = async () => {
  // 设置保存后的处理
  visibility.value = settings.value.defaultVisibility
  await fetchRemoteTags()
}

// 获取远程标签列表
const fetchRemoteTags = async () => {
  if (!settings.value.host || !settings.value.token) return

  try {
    const api = createApiService(settings.value.apiVersion)
    const data = await api.getTags(settings.value.host, settings.value.token)
    
    // 处理不同版本的API返回格式
    let remoteTags = []
    if (settings.value.apiVersion === 'v18') {
      remoteTags = data
      // 更新标签计数
      tagCounts.value = data.reduce((acc, tag) => {
        acc[tag] = 1
        return acc
      }, {})
    } else {
      remoteTags = data.map(tag => tag.name)
      // 更新标签计数
      tagCounts.value = data.reduce((acc, tag) => {
        acc[tag.name] = tag.count
        return acc
      }, {})
    }

    // 获取设置中的自定义标签
    const customTags = settings.value.customTags 
      ? settings.value.customTags.split(',').map(tag => tag.trim()).filter(tag => tag)
      : []

    // 合并远程标签和自定义标签，并更新 tags 数组
    tags.value = [...new Set([...remoteTags, ...customTags])]
    
    // 更新可用标签列表
    availableCustomTags.value = tags.value
  } catch (error) {
    console.error('获取标签失败:', error)
  }
}

// 生命周期钩子
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
    document.addEventListener('keydown', handleKeydown)
  }

  // 初始获取标签
  fetchRemoteTags()

  // 点击外部关闭下拉框
  document.addEventListener('click', (e) => {
    const container = document.querySelector('.custom-tags-selector')
    if (container && !container.contains(e.target)) {
      showTagDropdown.value = false
    }
  })
})

// 监听设置变化
watch(() => settings.value, async (newSettings) => {
  if (newSettings.host && newSettings.token) {
    await fetchRemoteTags()
  }
}, { deep: true })

// 监听设置变化
watch(() => settings.value.enableShortcuts, (newVal) => {
  if (newVal) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})

// 组件卸载时清理
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', () => {})
})

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
    const api = createApiService(settings.value.apiVersion)
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      uploadProgress.value = Math.round((i / files.length) * 100)
      
      const uploadedFile = await api.uploadResource(
        settings.value.host,
        settings.value.token,
        file
      )
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

// 修改提交函数
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
    const api = createApiService(settings.value.apiVersion)
    const resourceIds = uploadedFiles.value.map(file => file.id)
    
    // 处理自定义标签
    let finalContent = content.value
    
    // 检查内容中是否已经包含标签
    const hasExistingTags = /#[^\s#]+/.test(finalContent)
    
    // 只有在没有标签或未启用跳过默认标签时才添加默认标签
    if (settings.value.customTags && (!hasExistingTags || !settings.value.skipDefaultTags)) {
      const tags = settings.value.customTags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag)
      
      if (tags.length > 0) {
        const tagsString = tags.map(tag => `#${tag}`).join(' ')
        finalContent = `${finalContent}\n${tagsString}`
      }
    }
    
    const response = await api.createMemo(
      settings.value.host,
      settings.value.token,
      finalContent,
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
  if (!showTagSuggestions.value || filteredTags.value.length === 0) return
  
  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault()
      if (activeTagIndex.value === filteredTags.value.length - 1) {
        // 如果是最后一项，跳转到第一项
        activeTagIndex.value = 0
      } else {
        activeTagIndex.value = (activeTagIndex.value + 1) % filteredTags.value.length
      }
      break
    case 'ArrowDown':
      e.preventDefault()
      if (activeTagIndex.value === 0) {
        // 如果是第一项，跳转到最后一项
        activeTagIndex.value = filteredTags.value.length - 1
      } else {
        activeTagIndex.value = (activeTagIndex.value - 1 + filteredTags.value.length) % filteredTags.value.length
      }
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

// 监听内容变化，同步标签
watch(content, (newContent) => {
  // 从内容中提取标签
  const contentTags = newContent.match(/#[^\s#]+/g) || []
  const normalizedTags = contentTags.map(tag => tag.slice(1)) // 去掉 # 前缀
  
  // 更新选中的标签（只同步已存在的标签）
  selectedCustomTags.value = normalizedTags.filter(tag => 
    availableCustomTags.value.includes(tag)
  )
}, { immediate: true })

// 处理标签选择变化
const handleCustomTagsChange = () => {
  // 获取当前内容中的所有标签
  const contentTags = content.value.match(/#[^\s#]+/g) || []
  const normalizedTags = contentTags.map(tag => tag.slice(1))
  
  // 移除未选中的标签
  const tagsToRemove = normalizedTags.filter(tag => 
    !selectedCustomTags.value.includes(tag) && 
    availableCustomTags.value.includes(tag)
  )
  
  // 添加新选中的标签
  const tagsToAdd = selectedCustomTags.value.filter(tag => 
    !normalizedTags.includes(tag)
  )
  
  // 更新内容
  let newContent = content.value
  tagsToRemove.forEach(tag => {
    newContent = newContent.replace(`#${tag}`, '')
  })
  tagsToAdd.forEach(tag => {
    newContent = newContent + (newContent.endsWith('\n') ? '' : '\n') + `#${tag}`
  })
  
  // 清理多余的空行
  newContent = newContent.replace(/\n{3,}/g, '\n\n')
  content.value = newContent
}

// 切换标签选择状态
const toggleTag = (tag) => {
  const index = selectedCustomTags.value.indexOf(tag)
  if (index === -1) {
    selectedCustomTags.value.push(tag)
  } else {
    selectedCustomTags.value.splice(index, 1)
  }
  handleCustomTagsChange()
}

// 移除标签
const removeTag = (tag) => {
  const index = selectedCustomTags.value.indexOf(tag)
  if (index !== -1) {
    selectedCustomTags.value.splice(index, 1)
    handleCustomTagsChange()
  }
}

// 过滤标签
const filterTags = () => {
  showTagDropdown.value = true
}

// 格式化内容
const formatContent = (text, url, title) => {
  let formattedContent = text

  // 如果启用了引用格式
  if (settings.value.useQuote) {
    formattedContent = `> ${formattedContent.replace(/\n/g, '\n> ')}`
  }

  // 如果启用了来源
  if (settings.value.addSource && url) {
    const sourceText = settings.value.template
      .replace('{content}', formattedContent)
      .replace('{url}', url)
      .replace('{title}', title || '')
    formattedContent = sourceText
  }

  return formattedContent
}
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
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

.markdown-tools {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
}

.markdown-tools button {
  padding: 6px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
}

.markdown-tools button:hover {
  background: #fff;
  color: #10B981;
}

.divider {
  width: 1px;
  height: 20px;
  background: #ddd;
  margin: 0 4px;
}

.action-tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.right-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  cursor: pointer;
  color: #666;
  border-radius: 4px;
  transition: all 0.2s;
}

.upload-btn:hover {
  background: #f5f5f5;
  color: #10B981;
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
  transition: all 0.2s ease;
}

.tag-item:hover,
.tag-item.active {
  background: #f0f9f6;
  color: #10B981;
}

.tag-item.active {
  background: #10B981;
  color: white;
}

.tag-item.active .tag-count {
  color: rgba(255, 255, 255, 0.8);
}

.tag-count {
  color: #666;
  font-size: 12px;
  transition: color 0.2s ease;
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

.custom-tags-selector {
  position: relative;
  margin-right: 8px;
  min-width: 200px;
}

.tag-input-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px;
  min-height: 32px;
  background: white;
  cursor: text;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.tag-input-container:focus-within {
  border-color: #10B981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-item {
  background: #e5e7eb;
  border-radius: 2px;
  padding: 2px 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.remove-tag {
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  color: #666;
}

.remove-tag:hover {
  color: #333;
}

.tag-filter {
  border: none;
  outline: none;
  flex: 1;
  min-width: 60px;
  font-size: 14px;
  padding: 2px;
}

.tag-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-item.selected {
  background: #f0f9f6;
}

.check-mark {
  color: #10B981;
  font-weight: bold;
}

/* 滚动条样式 */
.tag-suggestions::-webkit-scrollbar {
  width: 8px;
}

.tag-suggestions::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.tag-suggestions::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 4px;
}

.tag-suggestions::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}

.submit-btn {
  padding: 8px 16px;
  background: #10B981;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
  min-width: 80px;
}

.submit-btn:hover {
  background: #0D9F6E;
}

/* 添加主题相关样式 */
.memos-extension.dark {
  background: #1a1a1a;
  color: #fff;
}

.memos-extension.dark .content-editor {
  background: #2d2d2d;
  color: #fff;
  border-color: #404040;
}

/* 添加预览面板样式 */
.preview-panel {
  margin-top: 8px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 4px;
  background: #f9f9f9;
  max-height: 200px;
  overflow-y: auto;
}

.dark .preview-panel {
  background: #2d2d2d;
  border-color: #404040;
}

.preview-content {
  font-size: 14px;
  line-height: 1.6;
}

/* 添加统计信息样式 */
.stats-panel {
  margin-top: 8px;
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 16px;
}

.dark .stats-panel {
  background: #2d2d2d;
  color: #999;
}

/* 添加预览按钮样式 */
.preview-btn {
  padding: 6px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.preview-btn:hover {
  background: #f5f5f5;
  color: #10B981;
}

.preview-btn.active {
  background: #10B981;
  color: white;
}

.dark .preview-btn {
  color: #999;
}

.dark .preview-btn:hover {
  background: #404040;
}

.dark .preview-btn.active {
  background: #10B981;
  color: white;
}
</style> 