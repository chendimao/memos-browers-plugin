<template>
  <div class="memos-list-wrapper">
    <div class="memos-list">
      <!-- 标签列表 -->
      <div v-if="settings.tagFilterStyle === 'list' && settings.apiVersion !== 'v24'" class="tag-list-container">
        <div class="tag-list" :class="{ expanded: isTagsExpanded }">
          <button 
            class="tag-item" 
            :class="{ active: !selectedTag }"
            @click="selectTag(null)"
          >
            {{ t('list.all') }}
          </button> 
          <button
            v-for="tag in sortedTags"
            :key="tag"
            class="tag-item"
            :class="{ 
              active: selectedTag === tag,
              preferred: settings.preferredTags?.includes(tag)
            }"
            @click="selectTag(tag)"
          >
            {{ tag }}
            <!-- <span class="tag-count" v-if="tagCounts[tag]">({{ tagCounts[tag] }})</span> -->
          </button>
        </div>
        <button 
          class="expand-tags" 
          :class="{ expanded: isTagsExpanded }"
          @click="toggleTagsExpand"
        >
          {{ isTagsExpanded ? t('list.collapse') : t('list.expand') }}
          <i class="fas fa-chevron-down"></i>
        </button>
      </div>

      <div class="list-header">
        <div class="filters">
          <div class="filters-row">
            <TagSelector
              v-if="settings.tagFilterStyle === 'selector' && settings.apiVersion !== 'v24'"
              :modelValue="selectedTag ? [selectedTag] : []"
              :options="tags"
              :placeholder="t('list.selectTag')"
              @update:modelValue="handleTagChange"
            />
            <div class="search-box">
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('list.search')"
                class="search-input"
              >
              <i class="fas fa-search search-icon"></i>
            </div>
            <div class="actions">
              <button class="refresh-btn" @click="refreshMemos" :disabled="isLoading">
                <i class="fas fa-sync-alt" :class="{ 'fa-spin': isLoading }"></i>
              </button>
              <button class="create-btn" @click="switchToEditor">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="memos-container" 
           :style="{ maxHeight: settings.listMaxHeight + 'px' }"
           @scroll="handleScroll"
           ref="memosContainerRef">
        <div v-if="isLoading" class="loading">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <div v-else-if="memos.length === 0" class="empty-state">
          {{ searchQuery ? t('list.noResults') : t('list.noMemos') }}
        </div>
        <div v-else class="memo-list">
          <div v-for="memo in memos" :key="memo.id" class="memo-item">
            <div class="memo-content" v-html="formatContent(memo.content)"></div>
            <div class="memo-meta">
              <span class="memo-time">{{ formatTime(memo.createdTs??memo.updateTime) }}</span>
              <span class="memo-visibility">
                <i :class="getVisibilityIcon(memo.visibility)"></i>
              </span>
              <div class="memo-actions">
                <button class="edit-btn" @click="editMemo(memo)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" @click="deleteMemo(settings.apiVersion == 'v24' ? memo.name : memo.id)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            
            <!-- 资源列表展示 -->
            <div v-if="settings.apiVersion === 'v24' && memo.resources && memo.resources.length > 0" class="resources-container">
              <div class="resources-list">
                <!-- 图片资源 -->
                <div v-for="resource in memo.resources.filter(r => r.type.startsWith('image/'))" 
                     :key="resource.name" 
                     class="resource-item image-resource">
                  <img :src="resource.url" 
                       :alt="resource.filename"
                       @click="openImagePreview(resource.url)"
                       class="resource-image" />
                  <span class="resource-filename">{{ resource.filename }}</span>
                </div>
                
                <!-- 文件资源 -->
                <div v-for="resource in memo.resources.filter(r => !r.type.startsWith('image/'))" 
                     :key="resource.name" 
                     class="resource-item file-resource">
                  <a :href="resource.url" 
                     :download="resource.filename"
                     class="file-link">
                    <i class="fas fa-file"></i>
                    <span class="resource-filename">{{ resource.filename }}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div v-if="hasMore" class="loading-more">
            <i class="fas fa-spinner fa-spin"></i> {{ t('list.loadMore') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { createApiService } from '../api'
import CustomSelect from '../components/CustomSelect.vue'
import TagSelector from '../components/TagSelector.vue'
import { showToast } from '../utils/toast'
import { formatTime } from '../utils'
import { marked } from 'marked'
import { t } from '../i18n'

const props = defineProps({
  settings: {
    type: Object,
    required: true
  }
})
const emits = defineEmits(['switchToEditor', 'editMemo'])

// 状态管理
const memos = ref([])
const isLoading = ref(false)
const visibilityFilter = ref('all')
const searchQuery = ref('')
const tags = ref([])
const tagCounts = ref({})
const selectedTag = ref(null)
const page = ref(1)
const limit = 20
const isTagsExpanded = ref(false)
const memosContainerRef = ref(null)
const hasMore = ref(true)
const nextPageToken = ref(null)
const isLoadingMore = ref(false)

// 获取可见性图标
const getVisibilityIcon = (visibility) => {
  switch (visibility) {
    case 'PUBLIC':
      return 'fas fa-globe'
    case 'PRIVATE':
      return 'fas fa-lock'
    case 'PROTECTED':
      return 'fas fa-user-shield'
    default:
      return 'fas fa-question'
  }
}


// 格式化内容
const formatContent = (content) => {
  // 处理 Markdown 格式
  return marked(content)
}

// 获取标签列表
const fetchTags = async () => {
  if (!props.settings.host || !props.settings.token) return

  try {
    const api = createApiService(props.settings.apiVersion)
    const data = await api.getTags(props.settings.host, props.settings.token)
    
    if (props.settings.apiVersion === 'v18') {
      tags.value = data || []
      // 更新标签计数
      tagCounts.value = (data || []).reduce((acc, tag) => {
        acc[tag] = 1
        return acc
      }, {})
    } else {
      tags.value = (data || []).map(tag => tag.name)
      // 更新标签计数
      tagCounts.value = (data || []).reduce((acc, tag) => {
        acc[tag.name] = tag.count || 1
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

// 处理标签变化
const handleTagChange = (tags) => {
  selectedTag.value = tags && tags.length > 0 ? tags[0] : null
  page.value = 1 // 重置页码
  fetchMemos()
}

// 选择标签
const selectTag = (tag) => {
  selectedTag.value = tag
  page.value = 1 // 重置页码
  fetchMemos()
}

// 获取备忘录列表
const fetchMemos = async () => {
  if (!props.settings.host || !props.settings.token) return

  isLoading.value = true
  try {
    const api = createApiService(props.settings.apiVersion)
    const offset = 0 // 重置 offset
    page.value = 1 // 重置页码
    hasMore.value = true // 重置加载更多状态
    
    const response = await api.getMemos(
      props.settings.host,
      props.settings.token,
      {
        offset,
        limit,
        visibility: props.settings.visibilityFilter,
        content: searchQuery.value,
        tag: selectedTag.value
      }
    )

    if (!response.ok) {
      throw new Error('获取备忘录失败')
    }

    let data = await response.json()
    if ( props.settings.apiVersion === 'v24') {
      nextPageToken.value = data.nextPageToken;
        data = data.memos;
        for (const memo of data) {
          const resources = await api.listResources(props.settings.host, props.settings.token, memo.name);
          console.log(resources, 'resources');
          if (resources && resources.resources.length > 0) {
            memo.resources = resources.resources;
          }
        }
      }  
    // 检查是否还有更多数据
    if (data.length < limit) {
      hasMore.value = false
    }
    
    memos.value = data
  } catch (error) {
    console.error('获取备忘录失败:', error)
    showToast('获取备忘录失败: ' + error.message, 'error')
  } finally {
    isLoading.value = false
  }
}

// 刷新备忘录列表
const refreshMemos = () => {
  fetchMemos()
}

// 删除备忘录
const deleteMemo = async (id) => {
  if (!confirm(t('list.confirmDelete'))) return

  try {
    const api = createApiService(props.settings.apiVersion)
    await api.deleteMemo(props.settings.host, props.settings.token, id)
    showToast(t('list.deleteSuccess'))
    fetchMemos()
  } catch (error) {
    console.error('删除备忘录失败:', error)
    showToast(t('list.deleteError') + error.message, 'error')
  }
}

// 编辑备忘录
const editMemo = (memo) => {
  emits('editMemo', memo)
}

// 切换到编辑器
const switchToEditor = () => {
  emits('switchToEditor')
}

// 监听搜索查询变化
watch(searchQuery, () => {
  fetchMemos()
})

// 监听标签选择变化
watch(selectedTag, () => {
  fetchMemos()
})

// 监听设置变化
watch(() => props.settings, () => {
  fetchMemos()
  fetchTags()
}, { deep: true })

// 生命周期钩子
onMounted(() => {
  fetchMemos()
  fetchTags()
})

// 计算属性：控制标签列表的样式
const tagListStyle = computed(() => ({
  maxHeight: isTagsExpanded.value ? 'none' : '64px', // 约两行的高度
  overflow: 'hidden',
  transition: 'max-height 0.3s ease'
}))

// 计算属性：是否显示展开按钮
const shouldShowExpandButton = computed(() => {
  return tags.value.length > 10 // 假设超过10个标签就需要展开按钮
})

// 切换标签列表展开状态
const toggleTagsExpand = () => {
  isTagsExpanded.value = !isTagsExpanded.value
}

// 处理滚动事件
const handleScroll = async (e) => {
  if (!hasMore.value || isLoading.value || isLoadingMore.value) return

  const container = e.target
  // 当距离底部小于 50px 时加载更多
  if (container.scrollHeight - container.scrollTop - container.clientHeight < 50) {
    await loadMore()
  }
}

// 加载更多数据
const loadMore = async () => {
  if (!hasMore.value || isLoadingMore.value || !nextPageToken.value) return

  isLoadingMore.value = true
  try {
    const api = createApiService(props.settings.apiVersion)
    const response = await api.getMemos(
      props.settings.host,
      props.settings.token,
      {
        offset: nextPageToken.value,
        limit,
        visibility: props.settings.visibilityFilter,
        content: searchQuery.value,
        tag: selectedTag.value
      }
    )

    if (!response.ok) {
      throw new Error('获取备忘录失败')
    }

    let data = await response.json()
    console.log(data);

    if (props.settings.apiVersion === 'v24') {
      nextPageToken.value = data.nextPageToken;
      data = data.memos;
      for (const memo of data) {
        const resources = await api.listResources(props.settings.host, props.settings.token, memo.name);
        console.log(resources, 'resources');
        if (resources && resources.resources.length > 0) {
          memo.resources = resources.resources;
        }
      }
    } 

    // 如果返回的数据少于 limit 或没有 nextPageToken，说明没有更多数据了
    if (data.length < limit || !nextPageToken.value) {
      hasMore.value = false
    }

    // 将新数据添加到现有数据后面
    memos.value = [...memos.value, ...data]
    page.value++
  } catch (error) {
    console.error('加载更多备忘录失败:', error)
    showToast('加载更多失败: ' + error.message, 'error')
  } finally {
    isLoadingMore.value = false
  }
}

// 计算属性：排序后的标签列表
const sortedTags = computed(() => {
  if (!props.settings.preferredTags || props.settings.preferredTags.length === 0) {
    return tags.value
  }
  const preferredTags = props.settings.preferredTags.filter(tag => tag && tag.trim())
  const otherTags = tags.value.filter(tag => !preferredTags.includes(tag) && tag && tag.trim())
  
  return [...preferredTags, ...otherTags]
})

// 图片预览功能
const openImagePreview = (url) => {
  window.open(url, '_blank')
}
</script>

<style>
.memos-list-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.memos-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.tag-list-container {
  flex-shrink: 0;
  padding: 8px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #eee;
  position: relative;
  margin-right: 1px;
  z-index: 1;
}

.list-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  position: relative;
  z-index: 100;
  padding: 0 16px;
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  position: relative;
  margin-top: 10px ;
  z-index: 100;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  position: relative;
  min-width: 200px;
  max-width: 300px;
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #10B981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
  outline: none;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  pointer-events: none;
}

.actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.refresh-btn,
.create-btn {
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #f3f4f6;
  color: #666;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.refresh-btn:hover,
.create-btn:hover {
  background: #e5e7eb;
  color: #333;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.memos-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid #eee;
  border-radius: 4px;
  background: #fff;
  position: relative;
  z-index: 1;
}

.memo-list {
  padding: 8px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #666;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #666;
}

.memo-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.memo-item:last-child {
  border-bottom: none;
}

.memo-content {
  margin-bottom: 8px;
  line-height: 1.6;
  position: relative;
  z-index: 1;
}

.memo-content img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 8px 0;
  border-radius: 4px;
  object-fit: contain;
  max-height: 300px;
  width: auto;
  position: relative;
  z-index: 1;
}

/* 新增标签样式 */
.memo-content :deep(a[href^="#"]) {
  display: inline-block;
  padding: 2px 8px;
  background: #f0f9f6;
  color: #10B981;
  border-radius: 12px;
  font-size: 12px;
  margin: 0 4px 4px 0;
  text-decoration: none;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.memo-content :deep(a[href^="#"]:hover) {
  background: #10B981;
  color: white;
  border-color: #10B981;
}

/* 深色模式下的标签样式 */
.memos-extension.dark .memo-content :deep(a[href^="#"]) {
  background: #2d2d2d;
  color: #10B981;
  border: 1px solid #404040;
}

.memos-extension.dark .memo-content :deep(a[href^="#"]:hover) {
  background: #10B981;
  color: white;
  border-color: #10B981;
}

.memo-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.memo-time {
  flex: 1;
}

.memo-visibility {
  margin: 0 8px;
}

.memo-actions {
  display: flex;
  gap: 8px;
}

.edit-btn,
.delete-btn {
  padding: 4px;
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.edit-btn:hover {
  color: #10B981;
}

.delete-btn:hover {
  color: #EF4444;
}

.tag {
  color: #10B981;
  font-weight: 500;
}

/* 深色模式样式 */
.memos-extension.dark .memos-container {
  background: #1a1a1a;
  border-color: #404040;
}

.memos-extension.dark .search-input {
  background: #2d2d2d;
  border-color: #404040;
  color: #fff;
}

.memos-extension.dark .search-input:focus {
  border-color: #10B981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
}

.memos-extension.dark .search-icon {
  color: #999;
}

.memos-extension.dark .refresh-btn,
.memos-extension.dark .create-btn {
  background: #2d2d2d;
  color: #999;
}

.memos-extension.dark .refresh-btn:hover,
.memos-extension.dark .create-btn:hover {
  background: #404040;
  color: #fff;
}

.memos-extension.dark .memo-item {
  border-bottom-color: #404040;
}

.memos-extension.dark .memo-content {
  color: #fff;
}

.memos-extension.dark .memo-meta {
  color: #999;
}

.memos-extension.dark .edit-btn,
.memos-extension.dark .delete-btn {
  color: #999;
}

.memos-extension.dark .edit-btn:hover {
  color: #10B981;
}

.memos-extension.dark .delete-btn:hover {
  color: #EF4444;
}

.memos-extension.dark .tag {
  color: #10B981;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 32px;
  overflow: hidden;
  padding-right: 1px;
  transition: max-height 0.3s ease;
}

.tag-list.expanded {
  max-height: none;
}

.tag-item {
  padding: 2px 8px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.tag-item:hover {
  background: #f0f9f6;
  border-color: #10B981;
  color: #10B981;
}

.tag-item.active {
  background: #10B981;
  border-color: #10B981;
  color: white;
}

/* 优先展示标签的样式 */
.tag-item.preferred {
  background: #f0f9f6;
  border: 1px dashed #10B981;
  color: #10B981;
  font-weight: 500;
  position: relative;
}

.tag-item.preferred:hover {
  background: #e6f7f3;
  border-style: solid;
}

.tag-item.preferred.active {
  background: #10B981;
  border-style: solid;
  color: white;
  font-weight: 600;
}

/* 深色模式样式 */
.memos-extension.dark .tag-item {
  background: #2d2d2d;
  border-color: #404040;
  color: #999;
}

.memos-extension.dark .tag-item:hover {
  background: #404040;
  border-color: #10B981;
  color: #10B981;
}

.memos-extension.dark .tag-item.active {
  background: #10B981;
  color: white;
  border-color: #10B981;
}

.memos-extension.dark .tag-item.preferred {
  background: #2d2d2d;
  border: 1px dashed #10B981;
  color: #10B981;
}

.memos-extension.dark .tag-item.preferred:hover {
  background: #363636;
  border-style: solid;
}

.memos-extension.dark .tag-item.preferred.active {
  background: #10B981;
  border-style: solid;
  color: white;
}

.tag-count {
  font-size: 10px;
  color: #999;
  background: #f5f5f5;
  padding: 0 4px;
  border-radius: 8px;
}

.tag-item.active .tag-count {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

.expand-tags {
  position: absolute;
  right: 0px;
  top: 8px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  transition: color 0.2s;
}

.expand-tags:hover {
  color: #10B981;
}

.expand-tags i {
  font-size: 10px;
  transition: transform 0.3s ease;
}

.expand-tags.expanded i {
  transform: rotate(180deg);
}

/* 深色模式样式 */
.memos-extension.dark .tag-list {
  background: #1a1a1a;
  border-bottom-color: #404040;
}

.memos-extension.dark .tag-item {
  background: #2d2d2d;
  border-color: #404040;
  color: #999;
}

.memos-extension.dark .tag-item:hover {
  background: #404040;
  color: #fff;
}

.memos-extension.dark .tag-item.active {
  background: #10B981;
  color: white;
  border-color: #10B981;
}

/* 确保 TagSelector 的下拉菜单能够正确显示 */
:deep(.tag-selector) {
  position: relative;
  z-index: 3;
}

:deep(.tag-selector-options) {
  z-index: 1000;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 深色模式下的下拉菜单样式 */
.memos-extension.dark :deep(.tag-selector-options) {
  background: #2d2d2d;
  border-color: #404040;
  color: #fff;
}

.memos-extension.dark :deep(.tag-selector-option:hover) {
  background: #404040;
}

.memos-extension.dark :deep(.tag-selector-option.selected) {
  background: #10B981;
  color: white;
}

.loading-more {
  text-align: center;
  padding: 12px;
  color: #666;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.memos-extension.dark .loading-more {
  color: #999;
}

.resources-container {
  margin-top: 12px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.resources-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.resource-item {
  position: relative;
}

.image-resource {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
  border: 1px solid #eee;
}

.image-resource:hover {
  transform: scale(1.05);
  border-color: #10B981;
}

.resource-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-resource {
  padding: 6px 10px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #eee;
}

.file-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #333;
  text-decoration: none;
  font-size: 12px;
}

.file-link:hover {
  color: #10B981;
}

.resource-filename {
  font-size: 10px;
  color: #666;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.image-resource .resource-filename {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 2px 4px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 9px;
  line-height: 1.2;
}
</style> 