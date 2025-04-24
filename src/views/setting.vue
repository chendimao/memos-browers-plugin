<template>
<!-- 设置面板 -->
<div v-if="showSettings" class="settings-panel">
      <h2>基本设置</h2>
      <div class="form-group">
        <label>Memos 主页网址</label>
        <input 
          v-model="localSettings.host" 
          type="text" 
          placeholder="请输入 Memos 主页网址"
          :disabled="isLoading"
        >
      </div>
     
      <div class="form-group">
        <label>API 版本</label>
        <CustomSelect
          v-model="localSettings.apiVersion"
          :options="[
            { value: 'v18', label: '0.18' },
            { value: 'v24', label: '0.24' }
          ]"
          :disabled="isLoading"
        />
      </div>
     
      
      <div class="form-group">
        <label>{{ localSettings.apiVersion === 'v18' ? 'Access Token' : 'Access Token / OpenAPI' }}</label>
        <input 
          v-model="localSettings.token" 
          type="password" 
          :placeholder="localSettings.apiVersion === 'v18' ? '请输入 Memos Access Tokens' : '请输入 Access Token 或 OpenAPI'"
          :disabled="isLoading"
        >
      </div>

      <h2>内容设置</h2>
      <div class="form-group checkbox">
        <input 
          type="checkbox" 
          id="addSource" 
          v-model="localSettings.addSource"
          :disabled="isLoading"
        >
        <label for="addSource">自动添加来源信息</label>
      </div>
      <div class="form-group checkbox">
        <input 
          type="checkbox" 
          id="addTag" 
          v-model="localSettings.addTag"
          :disabled="isLoading"
        >
        <label for="addTag">自动添加 #quick-capture 标签</label>
      </div>
      <div class="form-group checkbox">
        <input 
          type="checkbox" 
          id="useQuote" 
          v-model="localSettings.useQuote"
          :disabled="isLoading"
        >
        <label for="useQuote">使用引用格式（>）包裹选中文本</label>
      </div>
      <div class="form-group checkbox">
        <input 
          type="checkbox" 
          id="skipDefaultTags" 
          v-model="localSettings.skipDefaultTags"
          :disabled="isLoading"
        >
        <label for="skipDefaultTags">当内容包含标签时不添加默认自定义标签</label>
      </div>

      <h2>默认设置</h2>
      <div class="form-group">
        <label>默认可见性</label>
        <CustomSelect
          v-model="localSettings.defaultVisibility"
          :options="[
            { value: 'PUBLIC', label: '所有人可见' },
            { value: 'PRIVATE', label: '仅自己可见' },
            { value: 'PROTECTED', label: '登录可见' }
          ]"
          :disabled="isLoading"
        />
      </div>
      
      <div class="form-group">
        <label>自定义标签</label>
        <input 
          v-model="localSettings.customTags" 
          type="text" 
          placeholder="用逗号分隔，如: daily,note"
          :disabled="isLoading"
        >
      </div>
      <div class="form-group">
        <label>内容模板</label>
        <textarea
          v-model="localSettings.template"
          placeholder="可用变量：{content}, {url}, {title}, {date}"
          rows="3"
          :disabled="isLoading"
        ></textarea>
      </div>

      <h2>快捷键设置</h2>
      <div class="form-group checkbox">
        <input 
          type="checkbox" 
          id="enableShortcuts" 
          v-model="localSettings.enableShortcuts"
          :disabled="isLoading"
        >
        <label for="enableShortcuts">启用快捷键</label>
      </div>
      <div class="shortcut-list" v-if="localSettings.enableShortcuts">
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
        <CustomSelect
          v-model="localSettings.tagBehavior"
          :options="[
            { value: 'space', label: '添加空格' },
            { value: 'newline', label: '添加换行' }
          ]"
          :disabled="isLoading"
          @update:modelValue="handleTagBehaviorChange"
        />
      </div>
      <div class="form-group">
        <label>{{ localSettings.tagBehavior === 'space' ? '空格' : '换行' }}数量</label>
        <div class="number-input">
          <button 
            @click="decrementCount" 
            type="button" 
            class="number-btn"
            :disabled="isLoading"
          >-</button>
          <input 
            type="number" 
            v-model.number="localSettings.tagSpaceCount" 
            min="1" 
            max="5"
            class="count-input"
            :disabled="isLoading"
          >
          <button 
            @click="incrementCount" 
            type="button" 
            class="number-btn"
            :disabled="isLoading"
          >+</button>
        </div>
        <div class="preview-box">
          预览：<span class="preview-content">{{ tagEndingPreview }}</span>
        </div>
      </div>

      <h2>页面设置</h2>
      <div class="form-group">
        <label>宽度 (px)</label>
        <div class="number-input">
          <button 
            @click="decrementWidth" 
            type="button" 
            class="number-btn"
            :disabled="isLoading"
          >-</button>
          <input 
            type="number" 
            v-model.number="localSettings.width" 
            min="300" 
            max="800"
            class="count-input"
            :disabled="isLoading"
          >
          <button 
            @click="incrementWidth" 
            type="button" 
            class="number-btn"
            :disabled="isLoading"
          >+</button>
        </div>
      </div>
      <div class="form-group">
        <label>高度 (px)</label>
        <div class="number-input">
          <button 
            @click="decrementHeight" 
            type="button" 
            class="number-btn"
            :disabled="isLoading"
          >-</button>
          <input 
            type="number" 
            v-model.number="localSettings.height" 
            min="200" 
            max="600"
            class="count-input"
            :disabled="isLoading"
          >
          <button 
            @click="incrementHeight" 
            type="button" 
            class="number-btn"
            :disabled="isLoading"
          >+</button>
        </div>
      </div>

      <h2>配置管理</h2>
      <div class="form-group">
        <button 
          class="export-btn" 
          @click="exportSettings"
          :disabled="isLoading"
        >导出配置</button>
        <label class="import-btn" :class="{ 'disabled': isLoading }">
          导入配置
          <input 
            type="file" 
            accept=".json" 
            @change="importSettings"
            :disabled="isLoading"
            style="display: none"
          >
        </label>
        <button 
          class="reset-btn" 
          @click="resetSettings"
          :disabled="isLoading"
        >重置设置</button>
      </div>

      <div class="action-buttons">
        <button 
          class="cancel-btn" 
          @click="cancelSettings"
          :disabled="isLoading"
        >取消</button>
        <button 
          class="save-btn" 
          @click="saveSettings"
          :disabled="isLoading || !isValid"
        >
          <span v-if="isLoading">保存中...</span>
          <span v-else>保存</span>
        </button>
      </div>
      
      <!-- 调试信息 -->
      <div v-if="isDev" class="debug-info">
        <pre>{{ debugInfo }}</pre>
      </div>

      <div class="form-group checkbox">
        <input type="checkbox" id="showWordCount" v-model="localSettings.showWordCount">
        <label for="showWordCount">显示字数统计</label>
      </div>
 

      <div class="form-group">
        <label>主题</label>
        <select v-model="localSettings.theme">
          <option value="light">浅色</option>
          <option value="dark">深色</option>
        </select>
      </div>
    </div>
</template>


<script lang="ts" setup>
import { ref, computed, nextTick, watch } from 'vue';
import { useStorage } from "@vueuse/core";
import { showToast } from '../utils/toast'
import { createApiService } from '../api'
import CustomSelect from '../components/CustomSelect.vue'

const props = defineProps({
    showSettings: {
        type: Boolean,
        default: false
    },
    editorRef: {
        type: Object,
        default: null
    },
    content: {
        type: String,
        default: ''
    },
    settings: {
        type: Object,
        required: true
    }
})

const emits = defineEmits(['update:showSettings', 'update:content', 'update:settings'])

// 获取所有标签
const fetchTags = async () => {
  try {
    const api = createApiService(localSettings.value.apiVersion)
    const data = await api.getTags(localSettings.value.host, localSettings.value.token)
    
    // 处理不同版本的API返回格式
    if (localSettings.value.apiVersion === 'v18') {
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

// 标签相关状态
const tags = ref([])
const tagCounts = ref({})

const currentContent = ref(props.content);
const showSettings = ref(props.showSettings);
const editorRef = ref(props.editorRef); 
const localSettings = ref({ ...props.settings });

watch(() => props.showSettings, (newVal) => {
    showSettings.value = newVal
})

watch(() => props.settings, (newVal) => {
    // 只在设置面板关闭时更新本地设置
    if (!showSettings.value) {
        localSettings.value = { ...newVal }
    }
}, { deep: true })

watch(() => props.content, (newVal) => {
    currentContent.value = newVal
})  

// 监听本地设置变化
watch(localSettings, (newVal) => {
    // 只在设置面板打开时触发更新
    if (showSettings.value) {
        emits('update:settings', { ...newVal })
    }
}, { deep: true })

// 监听设置面板状态
watch(() => props.showSettings, (newVal) => {
    showSettings.value = newVal
    // 当设置面板关闭时，同步本地设置到父组件
    if (!newVal) {
        emits('update:settings', { ...localSettings.value })
    }
})

// 添加标签格式校验函数
const validateTags = (tagsString) => {
  if (!tagsString) return { isValid: true, tags: [] }
  
  // 分割并清理标签
  const tags = tagsString.split(',')
    .map(tag => tag.trim())
    .filter(tag => tag)
  
  // 检查每个标签的格式
  const invalidTags = tags.filter(tag => {
    // 标签不能包含空格
    if (tag.includes(' ')) return true
    // 标签不能包含特殊字符
    if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(tag)) return true
    // 标签长度限制
    if (tag.length > 20) return true
    return false
  })
  
  // 检查重复标签
  const uniqueTags = [...new Set(tags)]
  const hasDuplicates = uniqueTags.length !== tags.length
  
  return {
    isValid: invalidTags.length === 0 && !hasDuplicates,
    tags: uniqueTags,
    invalidTags,
    hasDuplicates
  }
}

// 修改保存设置函数
const saveSettings = async () => {
  if (!isValid.value) {
    showToast('请填写必要的设置项', 'error')
    return
  }

  if (!localSettings.value.host) {
    showToast('主页网址不能为空', 'error')
    return
  }
  if (!localSettings.value.token) {
    showToast('Access Token 不能为空', 'error')
    return
  }

  // 处理主页网址的斜杠
  if (localSettings.value.host.endsWith('/')) {
    localSettings.value.host = localSettings.value.host.slice(0, -1)
  }

  // 校验自定义标签格式
  if (localSettings.value.customTags) {
    const validation = validateTags(localSettings.value.customTags)
    if (!validation.isValid) {
      let errorMessage = '自定义标签格式错误：'
      if (validation.invalidTags.length > 0) {
        errorMessage += `\n- 以下标签包含无效字符或空格：${validation.invalidTags.join(', ')}`
      }
      if (validation.hasDuplicates) {
        errorMessage += '\n- 存在重复标签'
      }
      showToast(errorMessage, 'error')
      return
    }
    // 更新为去重后的标签
    localSettings.value.customTags = validation.tags.join(', ')
  }

  isLoading.value = true
  try {
    // 测试 API 连接
    const api = createApiService(localSettings.value.apiVersion)
    const result = await api.testConnection(localSettings.value.host, localSettings.value.token)
    
    if (!result.ok) {
      throw new Error('API 连接失败')
    }

    // 保存到历史记录
    settingsHistory.value.push(JSON.parse(JSON.stringify(localSettings.value)))
    
    // 更新父组件设置
    emits('update:settings', { ...localSettings.value })
    
    // 关闭设置面板
    emits('update:showSettings', false)
    
    showToast('设置保存成功！')
    // 保存成功后刷新标签
    await fetchTags()
  } catch (error) {
    console.error('保存设置失败:', error)
    showToast(`保存失败: ${error.message}`, 'error')
  } finally {
    isLoading.value = false
  }
}

// 开发模式标志
const isDev = ref(process.env.NODE_ENV === 'development')

// 加载状态
const isLoading = ref(false)

// 设置历史记录
const settingsHistory = ref([JSON.parse(JSON.stringify(props.settings))])

// 计算标签结束符预览
const tagEndingPreview = computed(() => {
  const count = Math.min(Math.max(localSettings.value.tagSpaceCount, 1), 5)
  const char = localSettings.value.tagBehavior === 'space' ? ' ' : '⏎'
  return `#tag${char.repeat(count)}`
})

// 调试信息
const debugInfo = computed(() => ({
  settings: localSettings.value,
  content: props.content,
  showSettings: props.showSettings,
  isDev: isDev.value
}))

// 表单验证
const isValid = computed(() => {
  return localSettings.value.host && localSettings.value.token
})

// 数量调整函数
const incrementCount = () => {
  if (localSettings.value.tagSpaceCount < 5) {
    localSettings.value.tagSpaceCount++
  }
}

const decrementCount = () => {
  if (localSettings.value.tagSpaceCount > 1) {
    localSettings.value.tagSpaceCount--
  }
}

// 页面尺寸调整方法
const incrementWidth = () => {
  if (localSettings.value.width < 800) {
    localSettings.value.width += 50
  }
}

const decrementWidth = () => {
  if (localSettings.value.width > 300) {
    localSettings.value.width -= 50
  }
}

const incrementHeight = () => {
  if (localSettings.value.height < 600) {
    localSettings.value.height += 50
  }
}

const decrementHeight = () => {
  if (localSettings.value.height > 200) {
    localSettings.value.height -= 50
  }
}

// 配置导入导出方法
const exportSettings = () => {
  try {
    const settingsData = {
      ...localSettings.value,
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
    showToast('配置导出成功！')
  } catch (error) {
    console.error('导出配置失败:', error)
    showToast('导出配置失败：' + error.message, 'error')
  }
}

const importSettings = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const importedSettings = JSON.parse(e.target.result)
      if (!importedSettings.host || !importedSettings.token) {
        throw new Error('无效的配置文件')
      }
      
      const currentWidth = localSettings.value.width
      const currentHeight = localSettings.value.height
      
      Object.assign(localSettings.value, importedSettings)
      localSettings.value.width = currentWidth
      localSettings.value.height = currentHeight
      
      settingsHistory.value.push(JSON.parse(JSON.stringify(localSettings.value)))
      showToast('配置导入成功！')
    } catch (error) {
      console.error('导入配置失败:', error)
      showToast('导入配置失败：' + error.message, 'error')
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

// 重置设置
const resetSettings = () => {
  if (confirm('确定要重置所有设置吗？')) {
    localSettings.value = {
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
      height: 300
    }
    settingsHistory.value = [JSON.parse(JSON.stringify(localSettings.value))]
    showToast('设置已重置')
  }
}

// 取消设置
const cancelSettings = () => {
  if (settingsHistory.value.length > 0) {
    localSettings.value = settingsHistory.value[0]
  }
  emits('update:showSettings', false)
}

// 添加标签行为变化处理函数
const handleTagBehaviorChange = (value) => {
  localSettings.value.tagBehavior = value
}

</script>

<style scoped>
.settings-icon {
  cursor: pointer;
  color: #666;
}

.settings-panel {
  padding: 16px;
  position: relative;
  min-height: 100%;
  padding-bottom: 80px; /* 为固定按钮留出空间 */
  z-index: 1; /* 添加基础层级 */
}

/* 确保表单组内的 CustomSelect 下拉框可以正常显示 */
.form-group {
  margin-bottom: 16px;
  position: relative;
}

/* 调整 CustomSelect 在表单中的样式 */
:deep(.custom-select) {
  width: 100%;
}

:deep(.select-dropdown) {
  z-index: 1000; /* 确保下拉列表显示在其他元素之上 */
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

.action-buttons {
  position: fixed;
  bottom: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.save-btn,
.cancel-btn,
.reset-btn {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s;
}

.save-btn {
  background: #10B981;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #0D9F6E;
}

.cancel-btn {
  background: #EF4444;
  color: white;
}

.cancel-btn:hover:not(:disabled) {
  background: #DC2626;
}

.reset-btn {
  background: #3B82F6;
  color: white;
}

.reset-btn:hover:not(:disabled) {
  background: #2563EB;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.import-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* 数字输入框样式 */
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

.number-btn:hover:not(:disabled) {
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

.export-btn:hover:not(:disabled),
.import-btn:hover:not(:disabled) {
  opacity: 0.9;
}
</style>
