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
  min-width: 120px;
  width: 100%;
  z-index: 1000;
}

.select-input {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 6px 12px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.select-input:hover {
  border-color: #10B981;
}

.select-input.is-open {
  border-color: #10B981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
}

.selected-value {
  font-size: 14px;
  color: #333;
}

.arrow-icon {
  color: #666;
  transition: transform 0.2s;
}

.select-input.is-open .arrow-icon {
  transform: rotate(180deg);
}

.select-dropdown {
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
}

.select-dropdown.dropdown-up {
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
  font-size: 14px;
  color: #333;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-item.selected {
  background: #f0f9f6;
  color: #10B981;
}

.check-mark {
  color: #10B981;
  font-weight: bold;
}

/* 滚动条样式 */
.select-dropdown::-webkit-scrollbar {
  width: 8px;
}

.select-dropdown::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.select-dropdown::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 4px;
}

.select-dropdown::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}

/* 深色模式样式 */
.memos-extension.dark .select-input {
  background: #2d2d2d;
  border-color: #404040;
}

.memos-extension.dark .select-input:hover {
  border-color: #10B981;
}

.memos-extension.dark .selected-value {
  color: #fff;
}

.memos-extension.dark .arrow-icon {
  color: #999;
}

.memos-extension.dark .select-dropdown {
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