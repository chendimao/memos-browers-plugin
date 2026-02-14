<template>
  <div class="memos-list-wrapper">
    <div class="memos-list">
      <!-- 标签列表 -->
      <div v-if="settings.tagFilterStyle === 'list' && settings.apiVersion !== 'v24' && settings.apiVersion !== 'v25'" class="tag-list-container">
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
              v-if="settings.tagFilterStyle === 'selector' && settings.apiVersion !== 'v24' && settings.apiVersion !== 'v25'"
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
          <div v-for="memo in memos" :key="getMemoIdentifier(memo)" class="memo-item" :data-memo-id="getMemoIdentifier(memo)">
            <div class="memo-content-wrapper">
              <div class="memo-content" :class="{ expanded: expandedItems.has(getMemoIdentifier(memo)) }">
                <div class="memo-text" v-html="formatContent(memo.content)"></div>
              </div>
              <div v-if="isOverflow(getMemoIdentifier(memo))" class="expand-button" @click="toggleExpand(getMemoIdentifier(memo))">
                <div class="expand-button-content">
                  <span>{{ expandedItems.has(getMemoIdentifier(memo)) ? t('memo.showLess') : t('memo.expandMore') }}</span>
                  <i class="fas" :class="expandedItems.has(getMemoIdentifier(memo)) ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                </div>
              </div>
            </div>
            <div class="memo-meta">
              <span class="memo-time">{{ formatTime( settings.apiVersion == 'v18' ? memo.createdTs :  memo.updateTime) }}</span>
              <span class="memo-visibility">
                <i :class="getVisibilityIcon(memo.visibility)"></i>
              </span>
              <!-- 标签显示 -->
              <div v-if="memo.tags && memo.tags.length > 0" class="memo-tags">
                <span v-for="tag in memo.tags" :key="tag" class="tag" @click="selectTag(tag)">
                  <i class="fas fa-tag"></i>{{ tag }}
                </span>
              </div>
              <div class="memo-actions">
                <button class="edit-btn" @click="editMemo(memo)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" @click="deleteMemo(getMemoIdentifier(memo))">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            
            <!-- 资源列表展示 -->
            <div v-if="(settings.apiVersion === 'v24' || settings.apiVersion === 'v25' || settings.apiVersion === 'v26') && memo.resources && memo.resources.length > 0" class="resources-container">
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { createApiService } from '../api'
import CustomSelect from '../components/CustomSelect.vue'
import TagSelector from '../components/TagSelector.vue'
import { showToast } from '../utils/toast'
import { formatTime } from '../utils/index'
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
const limit = 50 // 临时增加limit来测试
const isTagsExpanded = ref(false)
const memosContainerRef = ref(null)
const hasMore = ref(true)
const nextPageToken = ref(null)
const isLoadingMore = ref(false)
const expandedItems = ref(new Set())
const overflowStates = ref(new Map())

// 自定义 renderer，使代码块以字符串形式展示
const renderer = {
  code({ text }) {
    // 直接输出原始代码字符串，不做高亮和 HTML 转义
    return `<pre class=\"plain-code\"><code>@${text}</code></pre>`
  }
}
marked.use({ renderer })

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
  // 处理 Markdown 格式，代码块用自定义 renderer
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
      // v24和v25版本返回的是字符串数组，不是对象数组
      tags.value = data || []
      // 更新标签计数
      tagCounts.value = (data || []).reduce((acc, tag) => {
        acc[tag] = 1
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
    } else if (props.settings.apiVersion === 'v25' || props.settings.apiVersion === 'v26') {
      // v25/v26 版本数据处理
      nextPageToken.value = data.nextPageToken || data.next_page_token || ''
      data = data.memos || []
      
      // v25/v26 字段映射和处理
      for (const memo of data) {
        // 确保时间字段兼容性
        if (memo.createTime && !memo.createdTs) {
          memo.createdTs = new Date(memo.createTime).getTime()
        }
        if (memo.displayTime && !memo.displayTs) {
          memo.displayTs = new Date(memo.displayTime).getTime()
        }
        if (memo.updateTime && !memo.updatedTs) {
          memo.updatedTs = new Date(memo.updateTime).getTime()
        }
        
        // 处理附件
        if (memo.attachments && memo.attachments.length > 0) {
          try {
            const attachments = await api.listMemoAttachments(props.settings.host, props.settings.token, memo.name)
            if (attachments && attachments.attachments) {
              memo.resources = attachments.attachments
            } else {
              memo.resources = memo.attachments
            }
          } catch (error) {
            console.warn('获取附件失败:', error)
            memo.resources = memo.attachments
          }
        }
      }
    }
    
    // 客户端标签过滤（v25/v26）
    if ((props.settings.apiVersion === 'v25' || props.settings.apiVersion === 'v26') && selectedTag.value) {
      data = data.filter(memo => {
        return memo.tags && memo.tags.includes(selectedTag.value)
      })
      console.log('客户端标签过滤结果:', data.length, '条便签包含标签:', selectedTag.value)
    }
    
    // 检查是否还有更多数据
    if (props.settings.apiVersion === 'v25' || props.settings.apiVersion === 'v26') {
      // v25/v26：如果返回的数据量等于 limit，假设还有更多数据
      if (data.length >= limit) {
        hasMore.value = true
        console.log('fetchMemos保持hasMore为true (v25/v26，数据量达到limit):', {
          dataLength: data.length,
          limit,
          nextPageToken: nextPageToken.value
        })
      } else {
        hasMore.value = false
        console.log('fetchMemos设置hasMore为false (v25/v26，数据量不足):', {
          dataLength: data.length,
          limit,
          nextPageToken: nextPageToken.value
        })
      }
    } else {
      // 其他版本：综合判断nextPageToken和数据量
      if ((!nextPageToken.value || nextPageToken.value === '') && data.length < limit) {
        hasMore.value = false
        console.log('fetchMemos设置hasMore为false (nextPageToken为空且数据不足):', {
          dataLength: data.length,
          limit,
          nextPageToken: nextPageToken.value
        })
      } else {
        hasMore.value = true
        console.log('fetchMemos保持hasMore为true:', {
          dataLength: data.length,
          limit,
          nextPageToken: nextPageToken.value,
          reason: nextPageToken.value ? 'has nextPageToken' : 'data equals limit'
        })
      }
    }
    
    console.log('fetchMemos完成:', {
      dataCount: data.length,
      hasMore: hasMore.value,
      nextPageToken: nextPageToken.value
    })
    
    memos.value = data
    // 在数据加载完成后检查每个 memo 的高度
    nextTick(() => {
      memos.value.forEach(memo => {
        checkOverflow(memo)
      })
    })
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

// 获取便签标识符（根据API版本）
const getMemoIdentifier = (memo) => {
  let identifier
  if (props.settings.apiVersion === 'v18') {
    identifier = memo.id
  } else if (props.settings.apiVersion === 'v24') {
    identifier = memo.name
  } else if (props.settings.apiVersion === 'v25' || props.settings.apiVersion === 'v26') {
    identifier = memo.name
  } else {
    // 默认尝试使用name，如果没有则使用id
    identifier = memo.name || memo.id
  }
  
  console.log('getMemoIdentifier:', {
    apiVersion: props.settings.apiVersion,
    memo: { id: memo.id, name: memo.name },
    identifier
  })
  
  return identifier
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
  if (!hasMore.value || isLoadingMore.value) return

  console.log('loadMore开始执行:', {
    hasMore: hasMore.value,
    isLoadingMore: isLoadingMore.value,
    nextPageToken: nextPageToken.value,
    currentMemosCount: memos.value.length
  })

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
    } else if (props.settings.apiVersion === 'v25' || props.settings.apiVersion === 'v26') {
      // v25/v26 版本数据处理
      nextPageToken.value = data.nextPageToken || data.next_page_token || ''
      data = data.memos || []
      
      // v25/v26 字段映射和处理
      for (const memo of data) {
        // 确保时间字段兼容性
        if (memo.createTime && !memo.createdTs) {
          memo.createdTs = new Date(memo.createTime).getTime()
        }
        if (memo.displayTime && !memo.displayTs) {
          memo.displayTs = new Date(memo.displayTime).getTime()
        }
        if (memo.updateTime && !memo.updatedTs) {
          memo.updatedTs = new Date(memo.updateTime).getTime()
        }
        
        // 处理附件
        if (memo.attachments && memo.attachments.length > 0) {
          try {
            const attachments = await api.listMemoAttachments(props.settings.host, props.settings.token, memo.name)
            if (attachments && attachments.attachments) {
              memo.resources = attachments.attachments
            } else {
              memo.resources = memo.attachments
            }
          } catch (error) {
            console.warn('获取附件失败:', error)
            memo.resources = memo.attachments
          }
        }
      }
    }

    // 客户端标签过滤（v25/v26）
    if ((props.settings.apiVersion === 'v25' || props.settings.apiVersion === 'v26') && selectedTag.value) {
      data = data.filter(memo => {
        return memo.tags && memo.tags.includes(selectedTag.value)
      })
      console.log('loadMore客户端标签过滤结果:', data.length, '条便签包含标签:', selectedTag.value)
    }

    // 根据版本和数据量判断是否还有更多数据
    if (props.settings.apiVersion === 'v25' || props.settings.apiVersion === 'v26') {
      // v25/v26：如果返回的数据量等于limit，假设还有更多数据
      if (data.length >= limit) {
        hasMore.value = true
        console.log('loadMore保持hasMore为true (v25/v26，数据量达到limit):', {
          dataLength: data.length,
          limit,
          nextPageToken: nextPageToken.value
        })
      } else {
        hasMore.value = false
        console.log('loadMore设置hasMore为false (v25/v26，数据量不足):', {
          dataLength: data.length,
          limit,
          nextPageToken: nextPageToken.value
        })
      }
    } else {
      // 其他版本：综合判断nextPageToken和数据量
      if ((!nextPageToken.value || nextPageToken.value === '') && data.length < limit) {
        hasMore.value = false
        console.log('loadMore设置hasMore为false (nextPageToken为空且数据不足):', {
          dataLength: data.length,
          limit,
          nextPageToken: nextPageToken.value
        })
      } else {
        hasMore.value = true
        console.log('loadMore保持hasMore为true:', {
          dataLength: data.length,
          limit,
          nextPageToken: nextPageToken.value,
          reason: nextPageToken.value ? 'has nextPageToken' : 'data equals limit'
        })
      }
    }

    // 将新数据添加到现有数据后面
    memos.value = [...memos.value, ...data]
    page.value++
    
    console.log('loadMore完成:', {
      newDataCount: data.length,
      totalMemosCount: memos.value.length,
      hasMore: hasMore.value,
      nextPageToken: nextPageToken.value
    })
    // 在加载更多数据后检查新加载的 memo 的高度
    nextTick(() => {
      data.forEach(memo => {
        checkOverflow(memo)
      })
    })
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

// 修改 isOverflow 方法
const isOverflow = (memoId) => {
  return overflowStates.value.get(memoId) || false
}

// 修改 checkOverflow 方法
const checkOverflow = (memo) => {
  const memoId = getMemoIdentifier(memo)
  console.log('checkOverflow调用:', memoId, memo)
  nextTick(() => {
    const element = document.querySelector(`[data-memo-id="${memoId}"] .memo-content`)
    console.log('DOM查询结果:', element, `[data-memo-id="${memoId}"] .memo-content`)
    if (!element) return
    
    // 等待内容渲染完成
    setTimeout(() => {
      const contentHeight = element.scrollHeight
      const isOverflowing = contentHeight > 300
      overflowStates.value.set(memoId, isOverflowing)
      console.log('溢出检查结果:', {
        memoId,
        contentHeight,
        threshold: 300,
        isOverflowing
      })
    }, 100)
  })
}

const toggleExpand = (memoId) => {
  if (expandedItems.value.has(memoId)) {
    expandedItems.value.delete(memoId)
  } else {
    expandedItems.value.add(memoId)
  }
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

.memo-content-wrapper {
  position: relative;
  margin-bottom: 12px;
}

.memo-content {
  position: relative;
  max-height: 300px;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.memo-content.expanded {
  max-height: none;
}

.memo-content .memo-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  font-size: 14px;
  color: var(--text-color);
}

.memo-content .memo-text img {
  max-width: 100%;
  height: auto;
}

.expand-button {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.95));
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
  transition: all 0.2s ease;
  z-index: 2;
}

.expand-button .expand-button-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  color: #4B5563;
  font-size: 13px;
  transition: all 0.2s ease;
}

.expand-button .expand-button-content i {
  font-size: 12px;
  color: #10B981;
  transition: transform 0.3s ease;
}

.expand-button:hover .expand-button-content {
  background: #10B981;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.2);
  border-color: #10B981;
}

.expand-button:hover .expand-button-content i {
  color: white;
  transform: translateY(2px);
}

.memo-content.expanded + .expand-button {
  height: 40px;
  background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.95));
}

.memo-content.expanded + .expand-button .expand-button-content {
  background: rgba(255, 255, 255, 0.95);
  color: #4B5563;
  border-color: #e5e7eb;
}

.memo-content.expanded + .expand-button .expand-button-content i {
  color: #10B981;
}

.memo-content.expanded + .expand-button:hover .expand-button-content {
  background: #10B981;
  color: white;
  border-color: #10B981;
}

.memo-content.expanded + .expand-button:hover .expand-button-content i {
  color: white;
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

.memo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 4px 0;
}

.memo-tags .tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  background: #f0f9f6;
  border: 1px solid #10B981;
  border-radius: 12px;
  font-size: 11px;
  color: #10B981;
  cursor: pointer;
  transition: all 0.2s;
}

.memo-tags .tag:hover {
  background: #10B981;
  color: white;
}

.memo-tags .tag i {
  margin-right: 2px;
  font-size: 10px;
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

.memos-extension.dark .memo-tags .tag {
  background: #2d2d2d;
  border-color: #10B981;
  color: #10B981;
}

.memos-extension.dark .memo-tags .tag:hover {
  background: #10B981;
  color: white;
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
  max-width: 200px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
  border: 1px solid #eee;
  display: inline-block;
}

.image-resource:hover {
  transform: scale(1.02);
  border-color: #10B981;
}

.resource-image {
  width: 100%;
  height: auto;
  max-height: 150px;
  object-fit: contain;
  display: block;
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

.memo-item .memo-header .memo-visibility i {
  margin-right: 4px;
  font-size: 12px;
}

.memo-item .memo-header .memo-visibility i.fa-lock {
  color: #EF4444;
}

.memo-item .memo-header .memo-visibility i.fa-globe {
  color: #10B981;
}

.memo-item .memo-header .memo-visibility i.fa-users {
  color: #3B82F6;
}

.memo-item .memo-actions .action-button i {
  font-size: 12px;
  margin-right: 4px;
}

.memo-item .memo-actions .action-button i.fa-edit {
  color: #3B82F6;
}

.memo-item .memo-actions .action-button i.fa-trash-alt {
  color: #EF4444;
}

.memo-item .memo-tags .tag i {
  margin-right: 4px;
  font-size: 11px;
  color: #10B981;
}

.memo-item .expand-button i {
  margin-left: 4px;
  font-size: 12px;
  color: #10B981;
}

.memos-extension.dark .memo-item .memo-visibility i.fa-lock {
  color: #EF4444;
}

.memos-extension.dark .memo-item .memo-visibility i.fa-globe {
  color: #10B981;
}

.memos-extension.dark .memo-item .memo-visibility i.fa-users {
  color: #3B82F6;
}

.memos-extension.dark .memo-item .memo-actions .action-button i.fa-edit {
  color: #3B82F6;
}

.memos-extension.dark .memo-item .memo-actions .action-button i.fa-trash-alt {
  color: #EF4444;
}

.memos-extension.dark .memo-item .memo-tags .tag i {
  color: #10B981;
}

.memos-extension.dark .memo-item .expand-button i {
  color: #10B981;
}

.plain-code {
  background: #f8f8f8;
  color: #333;
  border-radius: 4px;
  padding: 8px;
  font-family: 'Fira Mono', 'Consolas', 'Menlo', 'Monaco', 'monospace';
  font-size: 13px;
  overflow-x: auto;
  margin: 8px 0;
}
</style> 
