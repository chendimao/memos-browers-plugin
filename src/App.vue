<template>
  <div class="memos-extension" :class="{ 'dark': settings.theme === 'dark' }" :style="containerStyle">
    <header>
      <h1>{{ t('app.title') }}</h1>
      <div class="header-actions">
        <button 
          class="view-switch-btn" 
          @click="currentView === 'editor' ? switchToList() : switchToEditor()"
          :title="currentView === 'editor' ? t('app.switchToList') : t('app.switchToEditor')"
        >
          <i :class="currentView === 'editor' ? 'fas fa-list' : 'fas fa-edit'"></i>
        </button>
        <div class="settings-icon" @click="openSettings">
          <i class="fas fa-cog"></i>
        </div>
      </div>
    </header>
    
    <!-- 格式保留通知 -->
    <div v-if="formatPreservedNotification" class="format-notification">
      <i class="fas fa-check-circle"></i>
      <span>已保留原文格式样式</span>
    </div>
    
   <!-- 设置面板 -->
   <Setting
      v-model:content="content"
      v-model:settings="settings"
      :editorRef="editorRef"
      v-model:showSettings="showSettings"
      @settings-saved="handleSettingsSaved"
    />
    <template  v-if="!showSettings" >
      <template v-if="currentView === 'editor'">
     

     <!-- 主编辑器区域 -->
     <div   class="editor-container">
       
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
             :placeholder="t('editor.placeholder')"
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
           <div v-if="showTagSuggestions && filteredTags.length > 0" 
                class="tag-suggestions"
                :style="{
                  position: 'absolute',
                  top: tagSuggestionsPosition.top + 'px',
                  left: tagSuggestionsPosition.left + 'px',
                  width: tagSuggestionsPosition.width + 'px'
                }">
             <div
               v-for="(tag, index) in filteredTags"
               :key="tag"
               :class="['tag-item', { active: index === activeTagIndex }]"
               @click="selectTag(tag)"
             >
               #{{ tag }}
             </div>
           </div>
           
          
           
           <!-- 统计信息 -->
           <div v-if="settings.showWordCount" class="stats-panel">
             <span>{{ t('editor.wordCount') }}: {{ wordCount }}&nbsp;&nbsp;&nbsp;</span>
             <span>{{ t('editor.charCount') }}: {{ charCount }}&nbsp;&nbsp;&nbsp;</span>
             <span>{{ t('editor.lineCount') }}: {{ lineCount }}&nbsp;&nbsp;&nbsp;</span>
           </div>
         </div>
         
         <div class="toolbar">
           <!-- Markdown 操作菜单 -->
           <div class="markdown-tools">
             <button :title="t('editor.tools.heading')" @click="insertMarkdown('# ')"><i class="fas fa-heading"></i></button>
             <button :title="t('editor.tools.bold')" @click="insertMarkdown('**', '**')"><i class="fas fa-bold"></i></button>
             <button :title="t('editor.tools.italic')" @click="insertMarkdown('*', '*')"><i class="fas fa-italic"></i></button>
             <button :title="t('editor.tools.strikethrough')" @click="insertMarkdown('~~', '~~')"><i class="fas fa-strikethrough"></i></button>
             <span class="divider"></span>
             <button :title="t('editor.tools.unorderedList')" @click="insertMarkdown('- ')"><i class="fas fa-list-ul"></i></button>
             <button :title="t('editor.tools.orderedList')" @click="insertMarkdown('1. ')"><i class="fas fa-list-ol"></i></button>
             <button :title="t('editor.tools.taskList')" @click="insertMarkdown('- [ ] ')"><i class="fas fa-tasks"></i></button>
             <span class="divider"></span>
             <button :title="t('editor.tools.quote')" @click="insertMarkdown('> ')"><i class="fas fa-quote-right"></i></button>
             <button :title="t('editor.tools.codeBlock')" @click="insertCodeBlock"><i class="fas fa-code"></i></button>
             <button :title="t('editor.tools.table')" @click="insertTable"><i class="fas fa-table"></i></button>
             <button :title="t('editor.tools.link')" @click="insertMarkdown('[', '](url)')"><i class="fas fa-link"></i></button>
             <button :title="t('editor.tools.divider')" @click="insertMarkdown('\n---\n')"><i class="fas fa-minus"></i></button>
           </div>
           
           <!-- 其他操作菜单 -->
           <div class="action-tools">
             <div class="left-tools">
               <label class="upload-btn" :title="t('editor.tools.uploadImage')">
                 <i class="fas fa-image"></i>
                 <input 
                   type="file" 
                   accept="image/*" 
                   multiple 
                   @change="handleFileUpload"
                   style="display: none"
                 >
               </label>
               <label class="upload-btn" :title="t('editor.tools.uploadFile')">
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
               <TagSelector
                 v-if="settings.apiVersion !== 'v25'"
                 v-model="selectedCustomTags"
                 :options="availableCustomTags"
                 :placeholder="t('editor.selectTag')"
                 @update:modelValue="handleCustomTagsChange"
               />
               <CustomSelect
                 v-model="visibility"
                 :options="[
                   { value: 'PUBLIC', label: t('editor.visibility.public') },
                   { value: 'PRIVATE', label: t('editor.visibility.private') },
                   { value: 'PROTECTED', label: t('editor.visibility.protected') }
                 ]"
               />
               <button class="submit-btn" @click="submitMemo">{{ t('editor.submit') }}</button>
             </div>
           </div>
         </div>
 
         <!-- 上传进度条 -->
         <div v-if="isUploading" class="upload-progress">
           <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
           <span class="progress-text">{{ t('editor.uploading') }} {{ uploadProgress }}%</span>
         </div> 
 
      
     </div>
     </template>
   
  <template v-else>
         <div class="list-view">
           <MemosList
             :settings="settings"
             @switchToEditor="switchToEditor"
             @editMemo="handleEditMemo"
           />
         </div>
       </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { useStorage } from '@vueuse/core'
import { createApiService } from './api'
import Setting from "./views/setting.vue"
import { showToast } from './utils/toast'
import TagSelector from './components/TagSelector.vue'
import CustomSelect from './components/CustomSelect.vue'
import MemosList from './views/MemosList.vue'
import { t } from './i18n'

// 定义 emit
const emit = defineEmits(['refresh', 'switchToList'])

// 开发模式标志
const isDev = ref(process.env.NODE_ENV === 'development')

// 状态管理
const showSettings = ref(false)
const content = ref('')
const visibility = ref('PUBLIC')
const lastError = ref(null)
const editorRef = ref(null)
const editingMemo = ref(null)
const currentVisibility = ref('PUBLIC')
const isSubmitting = ref(false)
const formatPreservedNotification = ref(false)

// 使用 useStorage 管理设置
const settings = useStorage('memos-settings', {
  host: '',
  token: '',
  apiVersion: 'v25',
  addSource: true,
  useQuote: true,
  skipDefaultTags: false,
  defaultVisibility: 'PRIVATE',
  customTags: '',
  template: '{content}\n\n来源：[{title}]({url})',
  enableShortcuts: true,
  tagBehavior: 'space',
  tagSpaceCount: 1,
  width: 550,
  height: 400,
  preferredTags: [], // 新增：优先展示的标签
  tagFilterStyle: 'list' ,
  listMaxHeight: 600,
  settingHeight: 600,
  showWordCount: true,
  enablePreview: true,
  theme: 'light',
  defaultView: 'editor',
  preserveFormatting: true // 新增：右键添加时是否保留样式格式
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

// 视图状态
const currentView = ref(settings.value.defaultView || 'editor')

// 计算属性来处理容器样式
const containerStyle = computed(() => {
  const baseStyle = {
    width: settings.value.width + 'px'
  }
  
  // 根据不同视图设置不同的高度
  if (currentView.value === 'list') {
    baseStyle.height = Math.min(settings.value.listMaxHeight, MAX_POPUP_HEIGHT) + 'px'
  } else if (showSettings.value) {
    baseStyle.height = Math.min(settings.value.settingHeight, MAX_POPUP_HEIGHT) + 'px'
  } else {
    // 编辑器视图使用设置中的高度作为最小值
    baseStyle.minHeight = Math.min(settings.value.height, MAX_POPUP_HEIGHT) + 'px'
    baseStyle.height = 'auto'
  }
  
  return baseStyle
})

// 添加扩展窗口的尺寸限制常量
const MAX_POPUP_WIDTH = 800
const MAX_POPUP_HEIGHT = 600

// 添加标签建议位置计算
const tagSuggestionsPosition = ref({
  top: 0,
  left: 0,
  width: 0
})

// 方法
const openSettings = () => {
  showSettings.value = true
}

const handleSettingsSaved = async () => {
  // 设置保存后的处理
  visibility.value = settings.value.defaultVisibility
  
  // 更新编辑器设置
  if (settings.value.enableShortcuts) {
    document.addEventListener('keydown', handleKeydown, { capture: true })
  } else {
    document.removeEventListener('keydown', handleKeydown, { capture: true })
  }

  // 更新标签
  await fetchRemoteTags()

  // 更新视图
  if (settings.value.defaultView) {
    currentView.value = settings.value.defaultView
  }

  // 更新容器尺寸
  nextTick(() => {
    updateEditorHeight()
  })

  // 关闭设置面板
  showSettings.value = false
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
      // v24 版本的标签数据格式不同
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
  chrome.storage.local.get(['selectedText', 'sourceUrl', 'sourceTitle', 'hasFormatting'], (result) => {
    if (result.selectedText) {
      content.value = formatContent(result.selectedText, result.sourceUrl, result.sourceTitle)
      chrome.storage.local.remove(['selectedText', 'sourceUrl', 'sourceTitle', 'hasFormatting'])
      // 切换到编辑器视图
      currentView.value = 'editor'
      
      // 如果内容包含格式，添加用户提示
      if (result.hasFormatting) {
        console.log('Memos: 已保留原文的格式样式')
        // 可以在这里添加一个临时的视觉提示
        showFormatPreservedNotification()
      } else {
        console.log('Memos: 使用纯文本模式')
      }
    }
  })

  // 监听存储变化
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.selectedText && changes.selectedText.newValue) {
      content.value = formatContent(
        changes.selectedText.newValue,
        changes.sourceUrl?.newValue,
        changes.sourceTitle?.newValue
      )
      // 切换到编辑器视图
      currentView.value = 'editor'
      
      // 如果内容包含格式，添加提示
      if (changes.hasFormatting?.newValue) {
        console.log('Memos: 已保留原文的格式样式')
        showFormatPreservedNotification()
      }
    }
  })

  // 添加快捷键支持
  if (settings.value.enableShortcuts) {
    document.addEventListener('keydown', handleKeydown, { capture: true })
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

  // 添加一个 ResizeObserver 来监听编辑器容器的大小变化
  const resizeObserver = new ResizeObserver(() => {
    updateEditorHeight()
  })

  const editorContainer = document.querySelector('.editor-container')
  if (editorContainer) {
    resizeObserver.observe(editorContainer)
  }

  // 在组件卸载时停止观察
  onUnmounted(() => {
    resizeObserver.disconnect()
  })
})

// 监听设置变化
watch(() => settings.value, (newSettings) => {
  if (newSettings.host && newSettings.token) {
    fetchRemoteTags()
  }
}, { deep: true })

// 监听设置变化
watch(() => settings.value.enableShortcuts, (newVal) => {
  if (newVal) {
    document.addEventListener('keydown', handleKeydown, { capture: true })
  } else {
    document.removeEventListener('keydown', handleKeydown, { capture: true })
  }
})

// 组件卸载时清理
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown, { capture: true })
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
        file,
        visibility.value
      )
      uploadedFiles.value.push(uploadedFile)
      
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
const removeFile = async (fileId) => {
  const index = uploadedFiles.value.findIndex(f => f.id === fileId)
  if (index !== -1) {
    const file = uploadedFiles.value[index]
    uploadedFiles.value.splice(index, 1)
    
    // 从内容中删除对应的链接
    if (file.type.startsWith('image/')) {
      // 删除图片链接
      const imagePattern = new RegExp(`!\\[([^\\]]*)\\]\\(${file.url}\\)`, 'g')
      content.value = content.value.replace(imagePattern, '')
    } else {
      // 删除文件链接
      const filePattern = new RegExp(`\\[${file.name}\\]\\(${file.url}\\)`, 'g')
      content.value = content.value.replace(filePattern, '')
    }
    
    // 清理可能产生的多余空行
    content.value = content.value.replace(/\n{3,}/g, '\n\n')
    
    // 等待 DOM 更新后重新计算高度
    await nextTick()
    updateEditorHeight()
  }
}

// 合并提交和保存方法
const submitMemo = async () => {
  if (!content.value.trim()) {
    showToast(t('editor.emptyContent'))
    return
  }

  isSubmitting.value = true
  const isEditMode = !!editingMemo.value
  try {
    const api = createApiService(settings.value.apiVersion)
    let response

    // 获取当前设置值
    const currentSettings = settings.value

    // 处理默认标签
    let finalContent = content.value
    
    // 检查内容中是否包含标签
    const contentTags = content.value.match(/#[^\s#]+/g) || []
    const hasTags = contentTags.length > 0 || selectedCustomTags.value.length > 0
    
    // 如果内容中没有标签，且设置了自定义标签，且设置自动添加默认标签
    if (!hasTags && currentSettings.customTags && currentSettings.skipDefaultTags) {
      const customTags = currentSettings.customTags.split(',').map(tag => tag.trim()).filter(tag => tag)
      if (customTags.length > 0) {
        // 确保内容末尾有换行符
        if (!finalContent.endsWith('\n')) {
          finalContent += '\n'
        }
        // 根据设置生成标签结束符
        const count = Math.min(Math.max(currentSettings.tagSpaceCount, 1), 5)
        const ending = currentSettings.tagBehavior === 'space' 
          ? ' '.repeat(count)
          : '\n'.repeat(count)
        
        finalContent += customTags.map(tag => `#${tag}`).join(ending) + ending
      }
    }

    if (isEditMode) {
      // 编辑模式
      console.log(editingMemo, 663);
      // 根据API版本选择正确的标识符
      let memoIdentifier
      if (currentSettings.apiVersion === 'v18') {
        memoIdentifier = editingMemo.value.id
      } else if (currentSettings.apiVersion === 'v24' || currentSettings.apiVersion === 'v25') {
        memoIdentifier = editingMemo.value.name
      } else {
        memoIdentifier = editingMemo.value.name || editingMemo.value.id
      }
      
      console.log('更新便签标识符:', {
        apiVersion: currentSettings.apiVersion,
        memo: { id: editingMemo.value.id, name: editingMemo.value.name },
        selectedIdentifier: memoIdentifier
      })
      
      // 根据API版本构建更新数据
      let updateData = {
        content: finalContent,
        visibility: visibility.value
      }
      
      // v25版本不使用resourceIdList，而是通过专门的附件接口设置
      if (currentSettings.apiVersion !== 'v25') {
        updateData.resourceIdList = uploadedFiles.value.map(file => file.id)
      }
      
      response = await api.updateMemo(
        currentSettings.host,
        currentSettings.token,
        memoIdentifier,
        updateData
      )
      
      console.log('updateMemo响应:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      })
      
      if (!response.ok) {
        throw new Error(t('app.editError'))
      }
      
      showToast(t('app.editSuccess'))
      
      // v25版本需要单独设置附件（不影响主要的成功提示）
      if (currentSettings.apiVersion === 'v25' && uploadedFiles.value.length > 0) {
        try {
          const attachmentNames = uploadedFiles.value.map(file => file.id).filter(id => id != null)
          if (attachmentNames.length > 0) {
            await api.setMemoAttachments(
              currentSettings.host,
              currentSettings.token,
              memoIdentifier,
              attachmentNames
            )
            console.log('v25版本：附件已关联到便签', { memo: memoIdentifier, attachments: attachmentNames })
          }
        } catch (error) {
          console.warn('关联附件失败:', error)
          // 附件关联失败不影响主要的成功提示
        }
      }
    } else {
      // 新建模式
      if (currentSettings.apiVersion === 'v24') {
        // v24 API 处理文件和文本混合内容
        const result = await api.createMemo(
          currentSettings.host,
          currentSettings.token,
          finalContent,
          visibility.value
        )
        console.log(uploadedFiles.value, result, 'result');
        if (uploadedFiles.value.length > 0) {
          // 关联资源
          const data = await result.json();
          if (data && data.name) {
            const resources = uploadedFiles.value.map(file => ({
              createTime: new Date().toISOString(),
              name: file.name,
              type: file.type
            }))
            
            await api.associateResources(
              currentSettings.host,
              currentSettings.token,
             data.name,
              { resources }
            )
          }
        }
        response = result;
        showToast(t('app.saveSuccess'))
      } else {
        // v25版本或其他版本 API
        if (currentSettings.apiVersion === 'v25') {
          // v25版本：传递实际的标签数组
          const actualTags = selectedCustomTags.value.filter(tag => tag && tag.trim() !== '')
          response = await api.createMemo(
            currentSettings.host,
            currentSettings.token,
            finalContent,
            visibility.value,
            actualTags,
            false // pinned
          )
          
          // v25版本：创建便签后需要关联附件
          if (uploadedFiles.value.length > 0 && response.ok) {
            try {
              // 克隆response以避免消费问题
              const responseClone = response.clone()
              const memoData = await responseClone.json()
              const attachmentNames = uploadedFiles.value.map(file => file.id).filter(id => id != null)
              
              if (attachmentNames.length > 0) {
                await api.setMemoAttachments(
                  currentSettings.host,
                  currentSettings.token,
                  memoData.name,
                  attachmentNames
                )
                console.log('v25版本：附件已关联到便签', { memo: memoData.name, attachments: attachmentNames })
              }
            } catch (error) {
              console.warn('关联附件失败:', error)
              // 不影响主流程，只是警告
            }
          }
        } else if (currentSettings.apiVersion === 'v18') {
          // v18版本：先创建便签，再关联资源
          response = await api.createMemo(
            currentSettings.host,
            currentSettings.token,
            finalContent,
            visibility.value
          )
          
          // v18版本：创建便签后需要关联资源
          if (uploadedFiles.value.length > 0 && response.ok) {
            try {
              const responseClone = response.clone()
              const memoData = await responseClone.json()
              const resourceIds = uploadedFiles.value.map(file => file.id).filter(id => id != null)
              
              if (resourceIds.length > 0 && memoData.id) {
                // v18版本使用updateMemo来关联资源
                await api.updateMemo(
                  currentSettings.host,
                  currentSettings.token,
                  memoData.id,
                  {
                    content: finalContent,
                    visibility: visibility.value,
                    resourceIdList: resourceIds
                  }
                )
                console.log('v18版本：资源已关联到便签', { memo: memoData.id, resources: resourceIds })
              }
            } catch (error) {
              console.warn('v18版本关联资源失败:', error)
              // 不影响主流程，只是警告
            }
          }
        } else {
          // 其他未知版本：传递附件ID数组（保持兼容性）
          const fileIds = uploadedFiles.value.map(file => file.id).filter(id => id != null)
          response = await api.createMemo(
            currentSettings.host,
            currentSettings.token,
            finalContent,
            visibility.value,
            fileIds
          )
        }
        showToast(t('app.saveSuccess'))
      }
    }

    // 对于新建模式，检查响应状态
    if (!isEditMode && !response.ok) {
      throw new Error(t('app.saveError'))
    }

    // 清空编辑器内容
    content.value = ''
    // 清空上传文件
    uploadedFiles.value = []
    // 重置编辑状态
    editingMemo.value = null
    // 清空选中的标签
    selectedCustomTags.value = []
    // 刷新列表
    emit('refresh')
    
    // 只在编辑模式下切换到列表视图
    if (isEditMode) {
      currentView.value = 'list'
    }
  } catch (error) {
    console.error(isEditMode ? t('app.editError') : t('app.saveError'), error)
    showToast((isEditMode ? t('app.editError') : t('app.saveError')) + error.message, 'error')
  } finally {
    isSubmitting.value = false
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
    
    // 计算标签建议列表的位置
    nextTick(() => {
      const textareaRect = textarea.getBoundingClientRect()
      const editorWrapper = textarea.closest('.editor-wrapper')
      const wrapperRect = editorWrapper.getBoundingClientRect()
      
      // 计算相对于编辑器容器的位置
      tagSuggestionsPosition.value = {
        top: textareaRect.bottom - wrapperRect.top + 4, // 在文本框下方 4px
        left: textareaRect.left - wrapperRect.left,
        width: textareaRect.width
      }
    })
  } else {
    showTagSuggestions.value = false
    currentTagInput.value = ''
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
  // 处理标签建议
  if (showTagSuggestions.value && filteredTags.value.length > 0) {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        e.stopPropagation() // 阻止事件冒泡
        if (activeTagIndex.value > 0) {
          activeTagIndex.value--
          scrollActiveTagIntoView()
        }
        return // 直接返回，不继续处理
      case 'ArrowDown':
        e.preventDefault()
        e.stopPropagation() // 阻止事件冒泡
        if (activeTagIndex.value < filteredTags.value.length - 1) {
          activeTagIndex.value++
          scrollActiveTagIntoView()
        }
        return // 直接返回，不继续处理
      case 'Enter':
      case 'Tab':
        if (filteredTags.value.length > 0) {
          e.preventDefault()
          e.stopPropagation() // 阻止事件冒泡
          selectTag(filteredTags.value[activeTagIndex.value])
        }
        return // 直接返回，不继续处理
      case 'Escape':
        e.preventDefault()
        e.stopPropagation() // 阻止事件冒泡
        showTagSuggestions.value = false
        return // 直接返回，不继续处理
    }
  }

  // 处理其他快捷键
  if (settings.value.enableShortcuts) {
    // 快速保存
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      submitMemo()
    }
    // 切换可见性
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'p') {
      e.preventDefault()
      // 循环切换可见性
      const visibilities = ['PUBLIC', 'PRIVATE', 'PROTECTED']
      const currentIndex = visibilities.indexOf(visibility.value)
      const nextIndex = (currentIndex + 1) % visibilities.length
      visibility.value = visibilities[nextIndex]
      showToast(t('editor.visibility.' + visibility.value.toLowerCase()))
    }
  }
}

// 选择标签
const selectTag = (tag) => {
  const textarea = editorRef.value
  const text = textarea.value
  const position = textarea.selectionStart
  const beforeCursor = text.slice(0, position)
  const afterCursor = text.slice(position)
  
  // 获取当前设置值
  const currentSettings = settings.value
  
  // 根据设置生成结束符
  const count = Math.min(Math.max(currentSettings.tagSpaceCount, 1), 5)
  const ending = currentSettings.tagBehavior === 'space' 
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

// 修改页面尺寸调整方法
const incrementWidth = () => {
  if (settings.value.width < MAX_POPUP_WIDTH) {
    settings.value.width = Math.min(settings.value.width + 50, MAX_POPUP_WIDTH)
  }
}

const decrementWidth = () => {
  if (settings.value.width > 300) {
    settings.value.width -= 50
  }
}

const incrementHeight = () => {
  if (settings.value.height < MAX_POPUP_HEIGHT) {
    settings.value.height = Math.min(settings.value.height + 50, MAX_POPUP_HEIGHT)
  }
}

const decrementHeight = () => {
  if (settings.value.height > 200) {
    settings.value.height -= 50
  }
}

// 修改设置高度的方法
const incrementSettingHeight = () => {
  if (settings.value.settingHeight < MAX_POPUP_HEIGHT) {
    settings.value.settingHeight = Math.min(settings.value.settingHeight + 50, MAX_POPUP_HEIGHT)
  }
}

const decrementSettingHeight = () => {
  if (settings.value.settingHeight > 200) {
    settings.value.settingHeight -= 50
  }
}

// 修改列表高度的方法
const incrementListMaxHeight = () => {
  if (settings.value.listMaxHeight < MAX_POPUP_HEIGHT) {
    settings.value.listMaxHeight = Math.min(settings.value.listMaxHeight + 50, MAX_POPUP_HEIGHT)
  }
}

const decrementListMaxHeight = () => {
  if (settings.value.listMaxHeight > 200) {
    settings.value.listMaxHeight -= 50
  }
}

// 监听页面尺寸变化
watch([
  () => settings.value.width, 
  () => settings.value.height,
  () => settings.value.listMaxHeight, 
  () => settings.value.settingHeight,
  () => currentView.value,
  () => showSettings.value,
  () => content.value
], ([newWidth, newHeight, newListMaxHeight, newSettingHeight, newView, isShowingSettings]) => {
  // 限制尺寸在扩展的最大限制内
  const width = Math.min(newWidth, MAX_POPUP_WIDTH)
  let height

  if (isShowingSettings) {
    height = Math.min(newSettingHeight, MAX_POPUP_HEIGHT)
  } else if (newView === 'list') {
    height = Math.min(newListMaxHeight, MAX_POPUP_HEIGHT)
  } else {
    // 编辑器视图 - 让它自适应内容高度，但不小于设置中的高度
    const editorContainer = document.querySelector('.editor-container')
    const contentEditor = document.querySelector('.content-editor')
    const toolbar = document.querySelector('.toolbar')
    const uploadPreview = document.querySelector('.upload-preview')
    
    if (editorContainer && contentEditor && toolbar) {
      // 计算实际所需的总高度
      const toolbarHeight = toolbar.offsetHeight
      const uploadPreviewHeight = uploadPreview ? uploadPreview.offsetHeight : 0
      const contentHeight = contentEditor.scrollHeight
      const totalHeight = contentHeight + toolbarHeight + uploadPreviewHeight + 32 // 32 为 padding
      
      // 使用设置中的高度作为最小值
      const minHeight = Math.min(newHeight, MAX_POPUP_HEIGHT)
      // 取两者中的较大值，但不超过最大限制
      height = Math.min(Math.max(totalHeight, minHeight), MAX_POPUP_HEIGHT)
    } else {
      height = Math.min(newHeight, MAX_POPUP_HEIGHT)
    }
  }
  
  // 设置 HTML 元素的高度
  document.documentElement.style.width = `${width}px`
  document.documentElement.style.height = `${height}px`
  
  // 同时设置 body 元素的高度
  document.body.style.width = `${width}px`
  document.body.style.height = `${height}px`
}, { immediate: true })

// 监听视图变化
watch(() => currentView.value, (newView) => {
  if (newView === 'editor') {
    nextTick(() => {
      updateEditorHeight()
    })
  }
})

// 监听设置变化
watch(() => settings.value.defaultView, (newVal) => {
  if (newVal) {
    currentView.value = newVal
  }
})

// 监听内容变化，同步标签
watch(content, (newContent) => {
  // 从内容中提取标签
  const contentTags = newContent.match(/#[^\s#]+/g) || []
  const normalizedTags = contentTags.map(tag => tag.slice(1)) // 去掉 # 前缀
  
  // 更新选中的标签（只同步已存在的标签）
  selectedCustomTags.value = normalizedTags.filter(tag => 
    availableCustomTags.value.includes(tag)
  )

  // 缓存选中的标签
  localStorage.setItem('memos-cached-tags', JSON.stringify(selectedCustomTags.value))
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

  // 缓存选中的标签
  localStorage.setItem('memos-cached-tags', JSON.stringify(selectedCustomTags.value))
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

// 显示格式保留通知
const showFormatPreservedNotification = () => {
  formatPreservedNotification.value = true
  setTimeout(() => {
    formatPreservedNotification.value = false
  }, 3000) // 3秒后自动隐藏
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

// 切换视图
const switchView = () => {
  if(showSettings.value) showSettings.value = false;
  currentView.value = currentView.value === 'editor' ? 'list' : 'editor'
}

// 切换到编辑器
const switchToEditor = () => {
  if(showSettings.value) showSettings.value = false;
  currentView.value = 'editor'
  // 等待视图切换完成后再计算高度
  nextTick(() => {
    updateEditorHeight()
  })
}

// 切换到列表视图
const switchToList = () => {
  // 如果是从编辑器切换到列表
  if (currentView.value === 'editor') {
    // 清空编辑器内容
    content.value = ''
    // 取消编辑模式
    editingMemo.value = null
    // 重置上传的文件
    uploadedFiles.value = []
  }
  if(showSettings.value) showSettings.value = false;
  currentView.value = 'list'
}

// 处理编辑备忘录
const handleEditMemo = (memo) => {
  editingMemo.value = memo
  content.value = memo.content
  currentVisibility.value = memo.visibility
  currentView.value = 'editor'
}

// 更新高度的函数
const updateEditorHeight = () => {
  if (currentView.value === 'editor' && !showSettings.value) {
    nextTick(() => {
      const editorContainer = document.querySelector('.editor-container')
      if (editorContainer) {
        // 使用设置中的高度作为固定高度
        const height = Math.min(settings.value.height, MAX_POPUP_HEIGHT)

        // 更新所有相关元素的高度
        requestAnimationFrame(() => {
          editorContainer.style.height = `${height}px`
          document.documentElement.style.height = `${height}px`
          document.body.style.height = `${height}px`
        })
      }
    })
  }
}

// 监听上传文件列表变化
watch(() => uploadedFiles.value, () => {
  nextTick(() => {
    updateEditorHeight()
  })
}, { deep: true })

// 处理标签输入
const handleTagInput = (tag) => {
  if (!tag) return
  
  // 根据设置决定标签输入后的行为
  if (settings.value.tagInputBehavior === 'add') {
    // 直接添加到当前标签列表
    if (!selectedCustomTags.value.includes(tag)) {
      selectedCustomTags.value.push(tag)
    }
  } else if (settings.value.tagInputBehavior === 'create') {
    // 创建新备忘录
    content.value = `#${tag} `
    selectedCustomTags.value = [tag]
    switchToEditor()
  } else if (settings.value.tagInputBehavior === 'search') {
    // 搜索标签
    if (settings.value.apiVersion === 'v24') {
      // v24 版本不执行标签搜索
      return
    }
    selectedCustomTags.value = tag
    switchToEditor()
  }
}

// 添加滚动活动标签到可视区域的函数
const scrollActiveTagIntoView = () => {
  nextTick(() => {
    const activeTag = document.querySelector('.tag-item.active')
    if (activeTag) {
      activeTag.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  })
}

// 修改标签建议样式
const tagSuggestionsStyle = `
.tag-suggestions {
  position: absolute;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #eee;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  scroll-behavior: smooth;
  margin-top: 4px;
}

.tag-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f5f5f5;
}

.tag-item:last-child {
  border-bottom: none;
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
`
</script>

<style scoped>
.memos-extension {
  min-height: 300px;
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: auto;
  overflow: visible;
  position: relative;
}

html, body {
  margin: 0;
  padding: 0;
  height: auto !important;
  min-height: 100%;
}

.editor-container {
  padding: 16px;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: auto;
  min-height: 300px;
  overflow: visible;
}

.editor-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: visible;
  flex: 1;
  height: auto;
}

.content-editor {
  width: 100%;
  height: 100%;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 4px;
  resize: none;
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.6;
  position: relative;
  z-index: 1;
  overflow-y: auto;
  flex: 1;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
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
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
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

.toolbar {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
  background: #fff;
  position: relative;
  z-index: 2;
  margin-top: auto;
  height: auto;
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
  flex-shrink: 0;
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  margin-bottom: 12px;
  height: 100px;
  min-height: 40px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 8px;
  border: 1px solid #eee;
  border-radius: 4px;
  transition: all 0.3s ease;
  white-space: nowrap;
  display: none;
}

.upload-preview:not(:empty) {
  display: flex;
}

.upload-preview::-webkit-scrollbar {
  height: 6px;
}

.upload-preview::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.upload-preview::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.upload-preview::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}

.upload-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #eee;
  flex-shrink: 0;
  display: inline-block;
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
  align-items: center;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f5f5f5;
}

.tag-item:last-child {
  border-bottom: none;
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

.memos-extension.dark header {
  border-bottom-color: #404040;
}

.memos-extension.dark h1 {
  color: #fff;
}

.memos-extension.dark .settings-icon {
  color: #999;
}

.memos-extension.dark .settings-icon:hover {
  color: #fff;
}

.memos-extension.dark .content-editor {
  background: #2d2d2d;
  color: #fff;
  border-color: #404040;
}

.memos-extension.dark .content-editor::placeholder {
  color: #666;
}

.memos-extension.dark .markdown-tools {
  background: #2d2d2d;
  border: 1px solid #404040;
}

.memos-extension.dark .markdown-tools button {
  color: #999;
}

.memos-extension.dark .markdown-tools button:hover {
  background: #404040;
  color: #fff;
}

.memos-extension.dark .divider {
  background: #404040;
}

.memos-extension.dark .upload-preview {
  background: #2d2d2d;
  border-color: #404040;
}

.memos-extension.dark .upload-item {
  border-color: #404040;
}

.memos-extension.dark .file-info {
  color: #999;
}

.memos-extension.dark .remove-file {
  background: rgba(255, 255, 255, 0.2);
}

.memos-extension.dark .upload-progress {
  background: #2d2d2d;
}

.memos-extension.dark .progress-text {
  color: #999;
}

.memos-extension.dark .tag-suggestions {
  background: #2d2d2d;
  border-color: #404040;
}

.memos-extension.dark .tag-item {
  color: #fff;
}

.memos-extension.dark .tag-item:hover {
  background: #404040;
}

.memos-extension.dark .tag-item.active {
  background: #10B981;
  color: #fff;
}

.memos-extension.dark .tag-count {
  color: #999;
}

.memos-extension.dark .stats-panel {
  background: #2d2d2d;
  color: #999;
  border: 1px solid #404040;
}

.memos-extension.dark .toolbar {
  border-top-color: #404040;
}

.memos-extension.dark .action-tools {
  border-top-color: #404040;
}

.memos-extension.dark .upload-btn {
  color: #999;
}

.memos-extension.dark .upload-btn:hover {
  background: #404040;
  color: #fff;
}

.memos-extension.dark .submit-btn {
  background: #10B981;
  color: #fff;
}

.memos-extension.dark .submit-btn:hover {
  background: #0D9F6E;
}

/* 设置面板深色模式样式 */
.memos-extension.dark .settings-panel {
  background: #1a1a1a;
  color: #fff;
}

.memos-extension.dark .form-group label {
  color: #fff;
}

.memos-extension.dark input[type="text"],
.memos-extension.dark input[type="password"],
.memos-extension.dark select,
.memos-extension.dark textarea {
  background: #2d2d2d;
  color: #fff;
  border-color: #404040;
}

.memos-extension.dark input::placeholder {
  color: #666;
}

.memos-extension.dark .shortcut-list {
  background: #2d2d2d;
  color: #999;
}

.memos-extension.dark .number-btn {
  background: #2d2d2d;
  border-color: #404040;
  color: #fff;
}

.memos-extension.dark .number-btn:hover {
  background: #404040;
}

.memos-extension.dark .count-input {
  background: #2d2d2d;
  border-color: #404040;
  color: #fff;
}

.memos-extension.dark .preview-box {
  background: #2d2d2d;
  color: #999;
}

.memos-extension.dark .preview-content {
  background: #404040;
  color: #fff;
}

.memos-extension.dark .debug-info {
  background: #2d2d2d;
  color: #999;
}

.memos-extension.dark .debug-info pre {
  color: #fff;
}

/* 滚动条样式 */
.memos-extension.dark ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.memos-extension.dark ::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.memos-extension.dark ::-webkit-scrollbar-thumb {
  background: #404040;
  border-radius: 4px;
}

.memos-extension.dark ::-webkit-scrollbar-thumb:hover {
  background: #666;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-switch-btn {
  padding: 6px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.view-switch-btn:hover {
  background: #f5f5f5;
  color: #10B981;
}

.memos-extension.dark .view-switch-btn {
  color: #999;
}

.memos-extension.dark .view-switch-btn:hover {
  background: #404040;
  color: #fff;
}

/* 确保所有元素都使用 border-box */
*, *::before, *::after {
  box-sizing: border-box;
}

.settings-wrapper {
  position: fixed;
  top: 0;
  right: 0;
  width: 500px;
  height: 100vh;
  background: #fff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.settings-header {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  z-index: 101;
}

.settings-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.settings-header .close-btn {
  padding: 4px;
  cursor: pointer;
  border: none;
  background: none;
  color: #666;
  transition: color 0.2s;
}

.settings-header .close-btn:hover {
  color: #333;
}

.list-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.list-view {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 格式保留通知样式 */
.format-notification {
  background: #4CAF50;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  margin: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  animation: slideIn 0.3s ease-out;
}

.format-notification i {
  font-size: 14px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 暗色主题下的格式通知 */
.dark .format-notification {
  background: #45a049;
}
</style> 
