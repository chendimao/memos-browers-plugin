<template>
<!-- 设置面板 -->
<div v-if="showSettings" class="settings-panel">
  <div class="settings-content">
      <h2>{{ t('settings.basic') }}</h2>
      <div class="form-group">
        <label>{{ t('settings.host') }}</label>
      <input 
        v-model="localSettings.host" 
        type="text" 
        :placeholder="t('settings.hostPlaceholder')"
        :disabled="isLoading"
      >
      </div>
   
      <div class="form-group">
        <label>{{ t('settings.apiVersion') }}</label>
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
      <label>{{ localSettings.apiVersion === 'v18' ? t('settings.token') : t('settings.tokenOpenAPI') }}</label>
      <input 
        v-model="localSettings.token" 
        type="password" 
        :placeholder="localSettings.apiVersion === 'v18' ? t('settings.tokenPlaceholder') : t('settings.tokenOpenAPIPlaceholder')"
        :disabled="isLoading"
      >
      </div>

      <h2>{{ t('settings.content') }}</h2>
    <div class="form-group checkbox ">
      <input 
        type="checkbox" 
        id="addSource" 
        v-model="localSettings.addSource"
        :disabled="isLoading"
      >
      <label for="addSource" class="label-content">{{ t('settings.addSource') }}</label>
    </div>
      <div class="form-group checkbox">
      <input 
        type="checkbox" 
        id="useQuote" 
        v-model="localSettings.useQuote"
        :disabled="isLoading"
      >
      <label for="useQuote" class="label-content">{{ t('settings.useQuote') }}</label>
      </div>
      <div class="form-group checkbox">
      <input 
        type="checkbox" 
        id="skipDefaultTags" 
        v-model="localSettings.skipDefaultTags"
        :disabled="isLoading"
      >
      <label for="skipDefaultTags" class="label-content">{{ t('settings.skipDefaultTags') }}</label>
      </div>
      <div class="form-group checkbox">
      <input 
        type="checkbox" 
        id="preserveFormatting" 
        v-model="localSettings.preserveFormatting"
        :disabled="isLoading"
      >
      <label for="preserveFormatting" class="label-content">{{ t('settings.preserveFormatting') }}</label>
      </div>

      <h2>{{ t('settings.default') }}</h2>
      <div class="form-group">
        <label>{{ t('settings.defaultVisibility') }}</label>
      <CustomSelect
        v-model="localSettings.defaultVisibility"
        :options="[
          { value: 'PUBLIC', label: t('settings.visibility.public') },
          { value: 'PRIVATE', label: t('settings.visibility.private') },
          { value: 'PROTECTED', label: t('settings.visibility.protected') }
        ]"
        :disabled="isLoading"
      />
      </div>
    
      <div class="form-group">
        <label>{{ t('settings.customTags') }}</label>
      <input 
        v-model="localSettings.customTags" 
        type="text" 
        :placeholder="t('settings.customTagsPlaceholder')"
        :disabled="isLoading"
      >
      </div>
      <div class="form-group">
        <label>{{ t('settings.template') }}</label>
        <textarea
        v-model="localSettings.template"
          :placeholder="t('settings.templatePlaceholder')"
          rows="3"
        :disabled="isLoading"
        ></textarea>
      </div>

      <h2>{{ t('settings.shortcut') }}</h2>
      <div class="form-group checkbox">
      <input 
        type="checkbox" 
        id="enableShortcuts" 
        v-model="localSettings.enableShortcuts"
        :disabled="isLoading"
      >
        <label for="enableShortcuts">{{ t('settings.enableShortcuts') }}</label>
      </div>
    <div class="shortcut-list" v-if="localSettings.enableShortcuts">
        <div class="shortcut-item">
          <span>Ctrl/Cmd + Enter</span>
          <span>{{ t('settings.shortcuts.save') }}</span>
        </div>
        <div class="shortcut-item">
          <span>Ctrl/Cmd + Shift + P</span>
          <span>{{ t('settings.shortcuts.visibility') }}</span>
        </div>
      </div>

      <h2 v-if="localSettings.apiVersion !== 'v24'">{{ t('settings.tag') }}</h2>
      
     
    <div class="setting-item" v-if="localSettings.apiVersion !== 'v24'">
     <label>{{ t('settings.tagFilterStyle') }}</label>
     <CustomSelect
       v-model="localSettings.tagFilterStyle"
       :options="[
         { value: 'list', label: t('settings.tagFilterStyleOptions.list') },
         { value: 'selector', label: t('settings.tagFilterStyleOptions.selector') }
       ]"
       :disabled="isLoading"
     />
      </div>
    <div class="setting-item" v-if="localSettings.apiVersion !== 'v24'">
      <label>{{ t('settings.preferredTags') }}</label>
      <div class="setting-description">{{ t('settings.preferredTagsDescription') }}</div>
      <TagSelector
        v-model="localSettings.preferredTags"
        :options="tags"
        :placeholder="t('settings.preferredTagsPlaceholder')"
        multiple
        :disabled="isLoading || !localSettings.host || !localSettings.token"
      />
    </div>

      <h2>{{ t('settings.page') }}</h2>
      <div class="form-group">
      <label>{{ t('settings.defaultView') }}</label>
      <CustomSelect
        v-model="localSettings.defaultView"
        :options="[
          { value: 'editor', label: t('settings.defaultViewOptions.editor') },
          { value: 'list', label: t('settings.defaultViewOptions.list') }
        ]"
        :disabled="isLoading"
      />
    </div>
    <div class="form-group">
      <label>{{ t('settings.width') }}</label>
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
      <label>{{ t('settings.height') }}</label>
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
            min="400" 
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

    <div class="form-group">
      <label>{{ t('settings.settingHeight') }}</label>
      <div class="number-input">
        <button 
          @click="decrementSettingHeight" 
          type="button" 
          class="number-btn"
          :disabled="isLoading"
        >-</button>
        <input 
          type="number" 
          v-model.number="localSettings.settingHeight" 
          min="400" 
          max="600"
          step="50"
          class="count-input"
          :disabled="isLoading"
        >
        <button 
          @click="incrementSettingHeight" 
          type="button" 
          class="number-btn"
          :disabled="isLoading"
        >+</button>
      </div>
        </div>

    <div class="form-group">
      <label>{{ t('settings.listHeight') }}</label>
      <div class="number-input">
        <button 
          @click="decrementListHeight" 
          type="button" 
          class="number-btn"
          :disabled="isLoading"
        >-</button>
        <input 
          type="number" 
          v-model.number="localSettings.listMaxHeight" 
          min="400" 
          max="600"
          step="50"
          class="count-input"
          :disabled="isLoading"
        >
        <button 
          @click="incrementListHeight" 
          type="button" 
          class="number-btn"
          :disabled="isLoading"
        >+</button>
      </div>
    </div>


    <h2>{{ t('settings.other') }}</h2>
    <div class="form-group checkbox">
      <input type="checkbox" id="showWordCount" v-model="localSettings.showWordCount">
      <label for="showWordCount">{{ t('settings.showWordCount') }}</label>
    </div>

    <div class="form-group">
      <label>{{ t('settings.theme') }}</label>
      <select v-model="localSettings.theme">
        <option value="light">{{ t('settings.themeOptions.light') }}</option>
        <option value="dark">{{ t('settings.themeOptions.dark') }}</option>
      </select>
    </div>

    <div class="form-group">
      <label>{{ t('settings.language') }}</label>
      <select v-model="currentLanguage" @change="handleLanguageChange">
        <option v-for="lang in supportedLanguages" :key="lang.code" :value="lang.code">
          {{ lang.name }}
        </option>
      </select>
    </div>

    <h2>{{ t('settings.config') }}</h2>
    <div class="form-group">
    <div class="config-actions">
      <button class="export-btn" @click="exportSettings" :disabled="isLoading">{{ t('settings.export') }}</button>
      <label class="import-btn" :class="{ 'disabled': isLoading }">
        {{ t('settings.import') }}
        <input 
          type="file" 
          accept=".json" 
          @change="importSettings"
          :disabled="isLoading"
          style="display: none"
        >
      </label>
      <button class="reset-btn" @click="resetSettings" :disabled="isLoading">{{ t('settings.reset') }}</button>
    </div>
  </div>

  <h2>{{ t('settings.about.title') }}</h2>
  <div class="about-section">
    <p>{{ t('settings.about.title') }}</p>
    <p>{{ t('settings.about.description') }}</p>
    
    <div class="contact-info">
      <h3>{{ t('settings.about.contact') }}</h3>
      <p><i class="fas fa-envelope"></i> {{ t('settings.about.email') }}：<a href="mailto:admin@chendimao.com">admin@chendimao.com</a></p>
      <p><i class="fab fa-qq"></i> {{ t('settings.about.qq') }}：122803265</p>
      <p><i class="fab fa-github"></i> {{ t('settings.about.github') }}：<a href="https://github.com/chendimao/memos-browers-plugin/" target="_blank">chendimao/memos-browers-plugin</a></p>
    </div>
  </div>
</div>

<div class="settings-footer">
  <button class="cancel-btn" @click="cancelSettings" :disabled="isLoading">{{ t('cancel') }}</button>
  <button class="save-btn" @click="saveSettings" :disabled="isLoading">
    {{ isLoading ? t('loading') : t('save') }}
  </button>
    </div>
  </div>
</template>


<script lang="ts" setup>
import { ref, computed, nextTick, watch } from 'vue';
import { useStorage } from "@vueuse/core";
import { showToast } from '../utils/toast'
import { createApiService } from '../api'
import CustomSelect from '../components/CustomSelect.vue'
import TagSelector from '../components/TagSelector.vue'
import { t, getCurrentLanguage, setLanguage, getSupportedLanguages } from '../i18n'

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
  if (!localSettings.value.host || !localSettings.value.token) return

  try {
    const api = createApiService(localSettings.value.apiVersion)
    const data = await api.getTags(localSettings.value.host, localSettings.value.token)
    
    // 处理不同版本的API返回格式
    if (localSettings.value.apiVersion === 'v18') {
      tags.value = data || []
      // v1版本可能没有标签计数，设置默认值1
      tagCounts.value = (data || []).reduce((acc, tag) => {
        acc[tag] = 1
        return acc
      }, {})
    } else {
      // v2版本的标签数据处理
      tags.value = data;
      tagCounts.value = (data || []).reduce((acc, tag) => {
        acc[tag.name] = tag.count
        return acc
      }, {})
    }
  } catch (error) {
    console.error('获取标签失败:', error)
    showToast('获取标签失败: ' + error.message, 'error')
    tags.value = []
    tagCounts.value = {}
  }
}

// 标签相关状态
const tags = ref([])
const tagCounts = ref({})
  
    const currentContent = ref(props.content);
    const showSettings = ref(props.showSettings);
    const editorRef = ref(props.editorRef); 
const localSettings = ref({ 
  ...props.settings, 
});

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
  // 移除自动保存逻辑
  // if (showSettings.value) {
  //   emits('update:settings', { ...newVal })
  // }
}, { deep: true })

// 监听设置面板状态
watch(() => props.showSettings, (newVal) => {
  showSettings.value = newVal
  // 当设置面板打开时，复制一份原始设置
  if (newVal) {
    localSettings.value = { ...props.settings }
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

// 语言相关
const currentLanguage = ref(getCurrentLanguage())
const supportedLanguages = getSupportedLanguages()

// 修改语言变化处理函数
const handleLanguageChange = (event) => {
  // 只更新本地语言选择，不立即应用
  currentLanguage.value = event.target.value
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
    
    // 保存到缓存
    const settingsToSave = {
      ...localSettings.value,
      userInfo: result.data,
      preferredTags: localSettings.value.preferredTags || [] // 确保 preferredTags 被保存
    }
    console.log('Memos: 准备保存的设置', settingsToSave); 
    console.log('Memos: preserveFormatting值', settingsToSave.preserveFormatting);
    
    // 直接使用chrome.storage.local.set来确保设置被正确保存
    chrome.storage.local.set({ 'memos-settings': settingsToSave });
    // 更新父组件设置
    emits('update:settings', settingsToSave)
    
    // 应用语言设置
    if (setLanguage(currentLanguage.value)) {
      showToast(t('settings.languageChanged'))
      // 关闭设置面板
      emits('update:showSettings', false)
      // 刷新页面以应用新语言
      window.location.reload()
    } else {
      // 关闭设置面板
      emits('update:showSettings', false)
    }
    
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

// 列表高度调整方法
const incrementListHeight = () => {
  if (localSettings.value.listMaxHeight < 1000) {
    localSettings.value.listMaxHeight += 50
  }
}

const decrementListHeight = () => {
  if (localSettings.value.listMaxHeight > 300) {
    localSettings.value.listMaxHeight -= 50
  }
}

// 设置页面高度调整方法
const incrementSettingHeight = () => {
  if (localSettings.value.settingHeight < 1000) {
    localSettings.value.settingHeight += 50
  }
}

const decrementSettingHeight = () => {
  if (localSettings.value.settingHeight > 300) {
    localSettings.value.settingHeight -= 50
  }
}

// 配置导入导出方法
const exportSettings = () => {
  try {
    const settingsData = {
      ...localSettings.value,
      preferredTags: localSettings.value.preferredTags || [] // 确保导出时包含 preferredTags
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
      useQuote: true,
      skipDefaultTags: false,
      defaultVisibility: 'PRIVATE',
      customTags: '',
      template: '{content}\n\n来源：[{title}]({url})',
      enableShortcuts: true,
      tagSpaceCount: 1,
      defaultView: 'editor',
      showWordCount: true,
      theme: 'light',
      width: 550,
      height: 400,
      listMaxHeight: 600,
      settingHeight: 600,
      tagFilterStyle: 'list',
      preferredTags: [], // 确保重置时包含 preferredTags
      preserveFormatting: true // 默认启用样式保留
    }
    showToast('设置已重置')
  }
}

// 修改取消设置函数
const cancelSettings = () => {
  // 恢复原始设置
  localSettings.value = { ...props.settings }
  // 恢复原始语言选择
  currentLanguage.value = getCurrentLanguage()
  // 关闭设置面板
  emits('update:showSettings', false)
}


// 监听设置变化时获取标签
watch(() => localSettings.value.host, () => {
  fetchTags()
}, { immediate: true })

// 监听 token 变化时也获取标签
watch(() => localSettings.value.token, () => {
  fetchTags()
}, { immediate: true })

// 监听 API 版本变化时也获取标签
watch(() => localSettings.value.apiVersion, () => {
  fetchTags()
}, { immediate: true })

</script>

<style scoped>
.settings-icon {
  cursor: pointer;
  color: #666;
}

.settings-panel {
  padding: 16px;
  position: relative;
  height: v-bind('`${localSettings.settingHeight}px`');
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px;
  box-sizing: border-box;
}

.settings-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 16px;
  border-top: 1px solid #eee;
  z-index: 9999;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  box-sizing: border-box;
}

/* 深色模式样式 */
.memos-extension.dark .settings-footer {
  background: #1a1a1a;
  border-top-color: #404040;
}

.save-btn,
.cancel-btn {
  padding: 8px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
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
  background: #f3f4f6;
  color: #666;
}

.cancel-btn:hover {
  background: #e5e7eb;
  color: #333;
}

.memos-extension.dark .cancel-btn {
  background: #2d2d2d;
  color: #999;
}

.memos-extension.dark .cancel-btn:hover {
  background: #404040;
  color: #fff;
}

/* 确保表单组内的 CustomSelect 下拉框可以正常显示 */
.form-group {
  display: flex;
  align-items: start;
  margin-bottom: 16px;
}

.form-group.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-direction: row;
}

.form-group.checkbox label {
  margin: 0;
  cursor: pointer;
  white-space: nowrap;
  width: auto !important;
}

.form-group.checkbox input[type="checkbox"] {
  margin: 0;
  flex-shrink: 0;
}

/* 确保其他表单组的样式不受影响 */
.form-group:not(.checkbox) {
  flex-direction: column;
}

.form-group:not(.checkbox) label {
  width: 100%;
  margin-bottom: 8px;
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

.reset-btn {
  background: #EF4444;
  color: white;
}

.reset-btn:hover:not(:disabled) {
  background: #DC2626;
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
.import-btn,
.reset-btn {
  display: inline-block;
  padding: 8px 16px;
  margin-top: 5px;
  background: #10B981;
  color: white;
  border: none;
  width: 140px;
  height: 36px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
  text-align: center;
  line-height: 20px;
}

.import-btn {
  background: #3B82F6;
}

.reset-btn {
  background: #EF4444;
}

.export-btn:hover:not(:disabled),
.import-btn:hover:not(:disabled),
.reset-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.form-group {
  display: flex;
  align-items: start;
  margin-bottom: 16px;
}

.form-group label {
  width: 120px;
  margin-right: 16px;
}

.form-group .label-content {
  width: 100% !important;
  margin-right: 16px;
}

.form-group input[type="number"] {
  width: 100px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group .unit {
  margin-left: 8px;
  color: #666;
}

.memos-extension.dark .form-group input[type="number"] {
  background: #2d2d2d;
  border-color: #404040;
  color: #fff;
}

.memos-extension.dark .form-group .unit {
  color: #999;
}

/* 添加新的样式 */
.settings-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.settings-actions {
  display: flex;
  gap: 8px;
}

.cancel-btn {
  padding: 8px 16px;
  background: #f3f4f6;
  color: #666;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #e5e7eb;
  color: #333;
}

/* 深色模式样式 */
.memos-extension.dark .settings-footer {
  border-top-color: #404040;
}

.memos-extension.dark .cancel-btn {
  background: #2d2d2d;
  color: #999;
}

.memos-extension.dark .cancel-btn:hover {
  background: #404040;
  color: #fff;
}

.config-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.export-btn,
.import-btn,
.reset-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  height: 36px;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.export-btn {
  background: #10B981;
  color: white;
}

.export-btn:hover:not(:disabled) {
  background: #0D9F6E;
}

.import-btn {
  background: #3B82F6;
  color: white;
}

.import-btn:hover:not(:disabled) {
  background: #2563EB;
}

.reset-btn {
  background: #EF4444;
  color: white;
}

.reset-btn:hover:not(:disabled) {
  background: #DC2626;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.setting-description {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.memos-extension.dark .setting-description {
  color: #999;
}

/* 确保 TagSelector 的容器和下拉菜单样式正确 */
.setting-item {
  position: relative;
  margin-bottom: 16px;
}

.setting-item label {
  display: block;
  margin-bottom: 8px;
}

:deep(.tag-selector) {
  position: relative;
  width: 100%;
}

:deep(.tag-selector-input) {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;
}

:deep(.tag-selector-options) {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

:deep(.tag-selector-option) {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

:deep(.tag-selector-option:hover) {
  background: #f5f5f5;
}

:deep(.tag-selector-option.selected) {
  background: #10B981;
  color: white;
}

:deep(.tag-selector-tags) {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
}

:deep(.tag-selector-tag) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #f0f9f6;
  color: #10B981;
  border-radius: 12px;
  font-size: 12px;
}

:deep(.tag-selector-tag-remove) {
  cursor: pointer;
  opacity: 0.7;
}

:deep(.tag-selector-tag-remove:hover) {
  opacity: 1;
}

/* 深色模式样式 */
.memos-extension.dark :deep(.tag-selector-input) {
  background: #2d2d2d;
  border-color: #404040;
  color: #fff;
}

.memos-extension.dark :deep(.tag-selector-options) {
  background: #2d2d2d;
  border-color: #404040;
  color: #fff;
}

.memos-extension.dark :deep(.tag-selector-option:hover) {
  background: #404040;
}

.memos-extension.dark :deep(.tag-selector-tag) {
  background: #2d2d2d;
  border: 1px solid #404040;
}

.memos-extension.dark :deep(.tag-selector-option.selected) {
  background: #10B981;
  color: white;
}

.about-section {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.about-section p {
  margin: 8px 0;
  line-height: 1.6;
  color: #666;
}

.contact-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.contact-info h3 {
  margin-bottom: 12px;
  color: #333;
  font-size: 16px;
}

.contact-info p {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
}

.contact-info i {
  width: 20px;
  color: #10B981;
}

.contact-info a {
  color: #10B981;
  text-decoration: none;
}

.contact-info a:hover {
  text-decoration: underline;
}

/* 深色模式样式 */
.memos-extension.dark .about-section {
  background: #2d2d2d;
}

.memos-extension.dark .about-section p {
  color: #999;
}

.memos-extension.dark .contact-info {
  border-top-color: #404040;
}

.memos-extension.dark .contact-info h3 {
  color: #fff;
}

.memos-extension.dark .contact-info i {
  color: #10B981;
}

.memos-extension.dark .contact-info a {
  color: #10B981;
}
</style>
