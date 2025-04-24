<template>
  <div class="custom-tags-selector" ref="selectorRef">
    <div class="tag-input-container" @click="showTagDropdown = true">
      <div class="selected-tags">
        <span v-for="tag in modelValue" 
              :key="tag" 
              class="tag-item">
          {{ tag }}
          <span class="remove-tag" @click.stop="removeTag(tag)">×</span>
        </span>
      </div>
      <input
        type="text"
        class="tag-filter"
        v-model="tagFilter"
        @input="filterTags"
        :placeholder="placeholder"
        ref="tagInput"
      >
    </div>
    <div v-if="showTagDropdown" class="tag-dropdown">
      <div v-for="tag in filteredAvailableTags"
           :key="tag"
           class="dropdown-item"
           :class="{ 'selected': modelValue.includes(tag) }"
           @click="toggleTag(tag)">
        <span class="check-mark" v-if="modelValue.includes(tag)">✓</span>
        {{ tag }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  },
  options: {
    type: Array,
    required: true
  },
  placeholder: {
    type: String,
    default: '选择标签...'
  }
})

const emit = defineEmits(['update:modelValue'])

// 状态
const showTagDropdown = ref(false)
const tagFilter = ref('')
const tagInput = ref(null)
const selectorRef = ref(null)

// 过滤后的可用标签
const filteredAvailableTags = computed(() => {
  if (!tagFilter.value) return props.options
  return props.options.filter(tag =>
    tag.toLowerCase().includes(tagFilter.value.toLowerCase())
  )
})

// 切换标签选择状态
const toggleTag = (tag) => {
  const newValue = [...props.modelValue]
  const index = newValue.indexOf(tag)
  if (index === -1) {
    newValue.push(tag)
  } else {
    newValue.splice(index, 1)
  }
  emit('update:modelValue', newValue)
}

// 移除标签
const removeTag = (tag) => {
  const newValue = props.modelValue.filter(t => t !== tag)
  emit('update:modelValue', newValue)
}

// 过滤标签
const filterTags = () => {
  showTagDropdown.value = true
}

// 点击外部关闭下拉框
const handleOutsideClick = (e) => {
  if (selectorRef.value && !selectorRef.value.contains(e.target)) {
    showTagDropdown.value = false
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
.custom-tags-selector {
  position: relative;
  margin-right: 8px;
  min-width: 200px;
}

.tag-input-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px;
  min-height: 32px;
  background: white;
  cursor: text;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
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

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
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
</style> 