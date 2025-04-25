<template>
  <div class="tag-selector" ref="containerRef">
    <div 
      class="tag-input-container" 
      @click="showDropdown = true"
      @focusout="handleFocusOut"
    >
      <div class="selected-tags">
        <span v-for="tag in modelValue" :key="tag" class="tag-item">
          #{{ tag }}
          <span class="remove-tag" @click.stop="removeTag(tag)">×</span>
        </span>
      </div>
      <input
        ref="inputRef"
        v-model="tagFilter"
        class="tag-filter"
        :placeholder="placeholder"
        @keydown="handleKeydown"
      />
    </div>
    <div 
      v-if="showDropdown" 
      class="tag-dropdown"
      :class="{ 'dropdown-up': shouldShowUp }"
      :style="dropdownStyle"
    >
      <div
        v-for="tag in filteredOptions"
        :key="tag"
        class="dropdown-item"
        :class="{ selected: modelValue.includes(tag) }"
        @click="toggleTag(tag)"
      >
        #{{ tag }}
        <span v-if="modelValue.includes(tag)" class="check-mark">✓</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: '选择标签...'
  }
})

const emit = defineEmits(['update:modelValue'])

const containerRef = ref(null)
const inputRef = ref(null)
const showDropdown = ref(false)
const tagFilter = ref('')

// 计算下拉框应该显示的位置
const shouldShowUp = computed(() => {
  if (!containerRef.value) return false
  
  const containerRect = containerRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - containerRect.bottom
  const dropdownHeight = 200 // 预估下拉框高度
  
  return spaceBelow < dropdownHeight
})

// 计算下拉框样式
const dropdownStyle = computed(() => {
  return {}
})

// 过滤选项
const filteredOptions = computed(() => {
  if (!tagFilter.value) return props.options
  return props.options.filter(tag => 
    tag.toLowerCase().includes(tagFilter.value.toLowerCase())
  )
})

// 处理键盘事件
const handleKeydown = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (tagFilter.value && !props.modelValue.includes(tagFilter.value)) {
      toggleTag(tagFilter.value)
    }
    tagFilter.value = ''
  } else if (e.key === 'Escape') {
    showDropdown.value = false
  }
}

// 处理失去焦点
const handleFocusOut = (e) => {
  // 延迟关闭下拉框，以便处理点击事件
  setTimeout(() => {
    if (!containerRef.value?.contains(e.relatedTarget)) {
      showDropdown.value = false
    }
  }, 100)
}

// 切换标签
const toggleTag = (tag) => {
  const newValue = [...props.modelValue]
  const index = newValue.indexOf(tag)
  
  if (index === -1) {
    newValue.push(tag)
  } else {
    newValue.splice(index, 1)
  }
  
  emit('update:modelValue', newValue)
  tagFilter.value = ''
}

// 移除标签
const removeTag = (tag) => {
  const newValue = props.modelValue.filter(t => t !== tag)
  emit('update:modelValue', newValue)
}

// 监听窗口大小变化
const handleResize = () => {
  // 重新计算位置
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.tag-selector {
  position: relative;
  width: 100%;
  z-index: 1000;
}

.tag-input-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  min-height: 32px;
  background: white;
  cursor: text;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  width: 100%;
  box-sizing: border-box;
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
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1001;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;
}

.tag-dropdown.dropdown-up {
  bottom: 100%;
  top: auto;
  margin-top: 0;
  margin-bottom: 4px;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.tag-dropdown::-webkit-scrollbar {
  width: 8px;
}

.tag-dropdown::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.tag-dropdown::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 4px;
}

.tag-dropdown::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}

/* 深色模式样式 */
.memos-extension.dark .tag-input-container {
  background: #2d2d2d;
  border-color: #404040;
}

.memos-extension.dark .tag-item {
  background: #404040;
  color: #fff;
}

.memos-extension.dark .remove-tag {
  color: #999;
}

.memos-extension.dark .remove-tag:hover {
  color: #fff;
}

.memos-extension.dark .tag-filter {
  background: #2d2d2d;
  color: #fff;
}

.memos-extension.dark .tag-dropdown {
  background: #2d2d2d;
  border-color: #404040;
}

.memos-extension.dark .dropdown-item {
  color: #fff;
}

.memos-extension.dark .dropdown-item:hover {
  background: #404040;
}

.memos-extension.dark .dropdown-item.selected {
  background: #10B981;
  color: #fff;
}

.memos-extension.dark .check-mark {
  color: #fff;
}
</style> 