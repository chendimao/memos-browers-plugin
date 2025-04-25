<template>
  <div class="memo-editor">
    <div class="editor-header">
      <button class="back-btn" @click="handleSwitchToList">
        <i class="fas fa-arrow-left"></i>
      </button>
      <!-- ... rest of the header ... -->
    </div>
    <!-- ... rest of the template ... -->
  </div>
</template>

<script setup>
// ... existing imports and code ...

const emit = defineEmits(['update:content', 'submit', 'switchToList'])

// 处理切换到列表视图
const handleSwitchToList = () => {
  emit('switchToList')
}

// ... rest of the code ...
</script> 