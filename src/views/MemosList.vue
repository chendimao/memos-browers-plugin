<template>
  <div class="memos-list">
    <div class="list-header">
      <h2>我的备忘录</h2>
      <div class="list-actions">
        <button class="refresh-btn" @click="refreshMemos" title="刷新">
          <i class="fas fa-sync-alt"></i>
        </button>
        <button class="new-memo-btn" @click="switchToEditor" title="新建">
          <i class="fas fa-plus"></i>
        </button>
      </div>
    </div>

    <div class="memos-container">
      <div v-if="loading" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>加载中...</span>
      </div>
      <div v-else-if="memos.length === 0" class="empty-state">
        <i class="fas fa-sticky-note"></i>
        <p>暂无备忘录</p>
      </div>
      <div v-else class="memos">
        <div v-for="memo in memos" :key="memo.id" class="memo-item">
          <div class="memo-content" v-html="formatContent(memo.content)"></div>
          <div class="memo-meta">
            <span class="memo-time">{{ formatTime(memo.createdTs) }}</span>
            <div class="memo-actions">
              <button class="edit-btn" @click="editMemo(memo)" title="编辑">
                <i class="fas fa-edit"></i>
              </button>
              <button class="delete-btn" @click="deleteMemo(memo)" title="删除">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { createApiService } from '../api'
import { showToast } from '../utils/toast'
import { marked } from 'marked'

const props = defineProps({
  settings: {
    type: Object,
    required: true
  }
})

const emits = defineEmits(['switchToEditor', 'editMemo'])

const memos = ref([])
const loading = ref(false)

// 获取备忘录列表
const fetchMemos = async () => {
  if (!props.settings.host || !props.settings.token) {
    showToast('请先配置 Memos 设置', 'error')
    return
  }

  loading.value = true
  try {
    const api = createApiService(props.settings.apiVersion)
    const data = await api.getMemos(props.settings.host, props.settings.token)
    memos.value = data
  } catch (error) {
    console.error('获取备忘录失败:', error)
    showToast('获取备忘录失败: ' + error.message, 'error')
  } finally {
    loading.value = false
  }
}

// 刷新备忘录列表
const refreshMemos = () => {
  fetchMemos()
}

// 编辑备忘录
const editMemo = (memo) => {
  emits('editMemo', memo)
}

// 删除备忘录
const deleteMemo = async (memo) => {
  if (!confirm('确定要删除这条备忘录吗？')) return

  try {
    const api = createApiService(props.settings.apiVersion)
    await api.deleteMemo(props.settings.host, props.settings.token, memo.id)
    showToast('删除成功')
    refreshMemos()
  } catch (error) {
    console.error('删除备忘录失败:', error)
    showToast('删除失败: ' + error.message, 'error')
  }
}

// 切换到编辑器
const switchToEditor = () => {
  emits('switchToEditor')
}

// 格式化内容（支持 Markdown）
const formatContent = (content) => {
  return marked(content)
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString()
}

onMounted(() => {
  fetchMemos()
})
</script>

<style scoped>
.memos-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.list-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.list-actions {
  display: flex;
  gap: 8px;
}

.refresh-btn,
.new-memo-btn {
  padding: 6px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.refresh-btn:hover,
.new-memo-btn:hover {
  background: #f5f5f5;
  color: #10B981;
}

.memos-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.loading i {
  font-size: 24px;
  margin-bottom: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
}

.memos {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.memo-item {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.memo-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.memo-content {
  margin-bottom: 12px;
  line-height: 1.6;
}

.memo-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.memo-actions {
  display: flex;
  gap: 8px;
}

.edit-btn,
.delete-btn {
  padding: 4px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #f0f9f6;
  color: #10B981;
}

.delete-btn:hover {
  background: #fef2f2;
  color: #EF4444;
}

/* 深色模式样式 */
.memos-extension.dark .list-header {
  border-bottom-color: #404040;
}

.memos-extension.dark .list-header h2 {
  color: #fff;
}

.memos-extension.dark .refresh-btn,
.memos-extension.dark .new-memo-btn {
  color: #999;
}

.memos-extension.dark .refresh-btn:hover,
.memos-extension.dark .new-memo-btn:hover {
  background: #404040;
  color: #fff;
}

.memos-extension.dark .loading,
.memos-extension.dark .empty-state {
  color: #999;
}

.memos-extension.dark .memo-item {
  background: #2d2d2d;
  border-color: #404040;
}

.memos-extension.dark .memo-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
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
  background: #404040;
  color: #10B981;
}

.memos-extension.dark .delete-btn:hover {
  background: #404040;
  color: #EF4444;
}
</style> 