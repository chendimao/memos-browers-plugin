<template>
  <div class="tag-selector" ref="containerRef">
    <div 
      class="tag-input-container" 
      @click="handleContainerClick"
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
        @focus="showDropdown = true"
        @blur="handleBlur"
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
        @mousedown.prevent="toggleTag(tag)"
      >
        #{{ tag }}
        <span v-if="modelValue.includes(tag)" class="check-mark">✓</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

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

// 处理容器点击
const handleContainerClick = () => {
  showDropdown.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 处理失去焦点
const handleBlur = (e) => {
  // 延迟关闭下拉框，以便处理点击事件
  setTimeout(() => {
    if (!containerRef.value?.contains(e.relatedTarget)) {
      showDropdown.value = false
      tagFilter.value = ''
    }
  }, 200)
}

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
    tagFilter.value = ''
  }
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
  
  // 保持输入框焦点
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 移除标签
const removeTag = (tag) => {
  const newValue = props.modelValue.filter(t => t !== tag)
  emit('update:modelValue', newValue)
  
  // 保持输入框焦点
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 监听窗口大小变化
const handleResize = () => {
  // 重新计算位置
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  // 添加全局点击事件监听
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  // 移除全局点击事件监听
  document.removeEventListener('click', handleDocumentClick)
})

// 处理全局点击事件
const handleDocumentClick = (e) => {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    showDropdown.value = false
    tagFilter.value = ''
  }
}
</script>

<style scoped>
.tag-selector {
  position: relative;
  width: 100%;
  z-index: 20;
}

.tag-input-container {
  border: 1px solid var(--mqn-border-soft);
  border-radius: var(--mqn-radius-sm);
  padding: 6px 10px;
  min-height: 38px;
  background: var(--mqn-surface-strong);
  backdrop-filter: blur(8px);
  cursor: text;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  width: 100%;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.tag-input-container:focus-within {
  border-color: #34d399;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
  background: rgba(255, 255, 255, 0.9);
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(52, 211, 153, 0.34);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  color: #047857;
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
  background: transparent;
  outline: none;
  flex: 1;
  min-width: 60px;
  font-size: 14px;
  color: var(--mqn-text);
  padding: 2px 0;
}

.tag-filter::placeholder {
  color: var(--mqn-text-soft);
}

.tag-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  margin-top: 6px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--mqn-border-soft);
  border-radius: var(--mqn-radius-md);
  max-height: 240px;
  overflow-y: auto;
  z-index: 30;
  box-shadow: var(--mqn-shadow-md);
  backdrop-filter: blur(10px);
  width: 100%;
}

.tag-dropdown.dropdown-up {
  bottom: 100%;
  top: auto;
  margin-top: 0;
  margin-bottom: 6px;
}

.dropdown-item {
  padding: 9px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--mqn-text);
  transition: background 0.2s ease, color 0.2s ease;
}

.dropdown-item:hover {
  background: rgba(16, 185, 129, 0.09);
}

.dropdown-item.selected {
  background: rgba(16, 185, 129, 0.16);
  color: #059669;
}

.check-mark {
  color: #059669;
  font-weight: bold;
}

.tag-dropdown::-webkit-scrollbar {
  width: 6px;
}

.tag-dropdown::-webkit-scrollbar-track {
  background: transparent;
}

.tag-dropdown::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.45);
  border-radius: 999px;
}

.memos-extension.dark .tag-input-container {
  background: rgba(31, 41, 55, 0.82);
  border-color: rgba(75, 85, 99, 0.8);
}

.memos-extension.dark .tag-item {
  background: rgba(16, 185, 129, 0.26);
  border-color: rgba(52, 211, 153, 0.5);
  color: #d1fae5;
}

.memos-extension.dark .remove-tag {
  color: #999;
}

.memos-extension.dark .remove-tag:hover {
  color: #fff;
}

.memos-extension.dark .tag-filter {
  color: #e5e7eb;
}

.memos-extension.dark .tag-dropdown {
  background: rgba(17, 24, 39, 0.96);
  border-color: rgba(75, 85, 99, 0.72);
}

.memos-extension.dark .dropdown-item {
  color: #e5e7eb;
}

.memos-extension.dark .dropdown-item:hover {
  background: rgba(16, 185, 129, 0.2);
}

.memos-extension.dark .dropdown-item.selected {
  background: rgba(16, 185, 129, 0.3);
  color: #d1fae5;
}

.memos-extension.dark .check-mark {
  color: #d1fae5;
}
</style>
