<template>
  <div class="custom-select" ref="containerRef">
    <div 
      class="select-input"
      :class="{ 'is-open': showDropdown }"
      @click="handleContainerClick"
    >
      <span class="selected-value">{{ selectedLabel }}</span>
      <span class="arrow-icon">
        <i class="fas fa-chevron-down"></i>
      </span>
    </div>
    <div 
      v-if="showDropdown" 
      class="select-dropdown"
      :class="{ 'dropdown-up': shouldShowUp }"
      :style="dropdownStyle"
    >
      <div
        v-for="option in options"
        :key="option.value"
        class="dropdown-item"
        :class="{ selected: modelValue === option.value }"
        @mousedown.prevent="selectOption(option)"
      >
        {{ option.label }}
        <span v-if="modelValue === option.value" class="check-mark">✓</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true
  },
  options: {
    type: Array,
    required: true,
    validator: (value) => {
      return value.every(option => 
        typeof option === 'object' && 
        'value' in option && 
        'label' in option
      )
    }
  }
})

const emit = defineEmits(['update:modelValue'])

const containerRef = ref(null)
const showDropdown = ref(false)

// 计算选中的标签
const selectedLabel = computed(() => {
  const option = props.options.find(opt => opt.value === props.modelValue)
  return option ? option.label : ''
})

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
  if (!containerRef.value) return {}
  
  const containerRect = containerRef.value.getBoundingClientRect()
  return {
    width: `${containerRect.width}px`
  }
})

// 处理容器点击
const handleContainerClick = () => {
  showDropdown.value = !showDropdown.value
}

// 选择选项
const selectOption = (option) => {
  emit('update:modelValue', option.value)
  showDropdown.value = false
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
  }
}
</script>

<style scoped>
.custom-select {
  position: relative;
  width: 100%;
  min-width: 120px;
  z-index: 20;
}

.select-input {
  width: 100%;
  min-height: 38px;
  border: 1px solid var(--mqn-border-soft);
  border-radius: var(--mqn-radius-sm);
  padding: 8px 12px;
  background: var(--mqn-surface-strong);
  backdrop-filter: blur(8px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.select-input:hover {
  border-color: rgba(52, 211, 153, 0.7);
  background: rgba(255, 255, 255, 0.9);
}

.select-input.is-open {
  border-color: #34d399;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
  background: rgba(255, 255, 255, 0.92);
}

.selected-value {
  font-size: 14px;
  color: var(--mqn-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow-icon {
  color: var(--mqn-text-soft);
  transition: transform 0.2s;
}

.select-input.is-open .arrow-icon {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  margin-top: 6px;
  border: 1px solid var(--mqn-border-soft);
  border-radius: var(--mqn-radius-md);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: var(--mqn-shadow-md);
  backdrop-filter: blur(10px);
  max-height: 240px;
  overflow-y: auto;
  z-index: 30;
}

.select-dropdown.dropdown-up {
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
  font-size: 14px;
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

.select-dropdown::-webkit-scrollbar {
  width: 6px;
}

.select-dropdown::-webkit-scrollbar-track {
  background: transparent;
}

.select-dropdown::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.45);
  border-radius: 999px;
}

.memos-extension.dark .select-input {
  background: rgba(31, 41, 55, 0.82);
  border-color: rgba(75, 85, 99, 0.8);
}

.memos-extension.dark .select-input:hover {
  border-color: rgba(52, 211, 153, 0.8);
}

.memos-extension.dark .selected-value {
  color: #e5e7eb;
}

.memos-extension.dark .arrow-icon {
  color: #9ca3af;
}

.memos-extension.dark .select-dropdown {
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
