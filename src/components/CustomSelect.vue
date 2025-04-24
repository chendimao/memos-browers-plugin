<template>
  <div class="custom-select" ref="selectRef">
    <div 
      class="select-trigger" 
      @click="toggleDropdown"
      :class="{ 'active': showDropdown }"
    >
      <span class="selected-text">
        {{ selectedLabel }}
      </span>
      <span class="select-arrow" :class="{ 'open': showDropdown }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </span>
    </div>
    <div v-if="showDropdown" class="select-dropdown">
      <div
        v-for="option in options"
        :key="option.value"
        class="select-option"
        :class="{ 'selected': modelValue === option.value }"
        @click="selectOption(option)"
      >
        <span class="check-mark" v-if="modelValue === option.value">✓</span>
        {{ option.label }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true
  },
  options: {
    type: Array,
    required: true,
    validator: (options) => {
      return options.every(option => 
        option.hasOwnProperty('value') && 
        option.hasOwnProperty('label')
      )
    }
  }
})

const emit = defineEmits(['update:modelValue'])

const showDropdown = ref(false)

const selectRef = ref(null)

// 计算当前选中项的标签
const selectedLabel = computed(() => {
  const selected = props.options.find(option => option.value === props.modelValue)
  return selected ? selected.label : ''
})

// 切换下拉框显示状态
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

// 选择选项
const selectOption = (option) => {
  emit('update:modelValue', option.value)
  showDropdown.value = false
}

// 修改点击外部关闭下拉框的处理
const handleOutsideClick = (e) => {
  if (selectRef.value && !selectRef.value.contains(e.target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<style scoped>
.custom-select {
  position: relative;
  min-width: 120px;
  user-select: none;
}

.select-trigger {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 6px 32px 6px 12px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 32px;
  position: relative;
  transition: all 0.2s;
}

.select-trigger:hover {
  border-color: #10B981;
}

.select-trigger.active {
  border-color: #10B981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
}

.selected-text {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #666;
  transition: transform 0.2s;
}

.select-arrow.open {
  transform: translateY(-50%) rotate(180deg);
}

.select-dropdown {
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

.select-option {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-option:hover {
  background: #f5f5f5;
}

.select-option.selected {
  background: #f0f9f6;
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
</style> 