# Memos Quick Note 代码审查修复计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复代码审查中发现的 bug、安全漏洞、性能问题和代码质量问题，按优先级从高到低排列。

**Architecture:** 分 7 个任务，按安全 > Bug > 性能 > 代码质量的优先级排序。每个任务独立可提交，不引入新依赖（DOMPurify 除外）。所有修改保持向后兼容。

**Tech Stack:** Vue 3 + Vite, Chrome Extension MV3, marked, DOMPurify (新增)

---

### Task 1: 修复 XSS 安全漏洞 — marked + v-html 未消毒

**Files:**
- Modify: `src/views/MemosList.vue:210-213`
- Modify: `package.json` (添加 dompurify 依赖)

**Step 1: 安装 DOMPurify**

Run: `cd /Users/chendimao/WWW/memos-browers-plugin && npm install dompurify`

**Step 2: 在 MemosList.vue 中引入 DOMPurify 并消毒 marked 输出**

在 `src/views/MemosList.vue` 的 import 区域添加：

```js
import DOMPurify from 'dompurify'
```

修改 `formatContent` 函数（约第 210 行）：

```js
// 格式化内容
const formatContent = (content) => {
  return DOMPurify.sanitize(marked(content))
}
```

**Step 3: 验证**

Run: `cd /Users/chendimao/WWW/memos-browers-plugin && npm run build`
Expected: 构建成功，无错误

**Step 4: Commit**

```bash
git add package.json package-lock.json src/views/MemosList.vue
git commit -m "fix(security): sanitize marked output with DOMPurify to prevent XSS"
```

---

### Task 2: 修复标签数据结构处理错误

**Files:**
- Modify: `src/App.vue:546-563`
- Modify: `src/views/setting.vue:421-448`

**Step 1: 修复 App.vue 中 fetchRemoteTags 的标签处理**

`src/App.vue` 约第 546-563 行，v24/v25/v26 的 `getTags` 返回的是 `string[]`，不是对象数组。当前代码 `data.map(tag => tag.name)` 会产生 `undefined`。

修改为：

```js
    // 处理不同版本的API返回格式
    let remoteTags = []
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
      // v24/v25/v26 返回字符串数组
      remoteTags = data
      tagCounts.value = data.reduce((acc, tag) => {
        acc[tag] = 1
        return acc
      }, {})
    } else if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      // 兼容可能的对象数组格式
      remoteTags = data.map(tag => tag.name || tag)
      tagCounts.value = data.reduce((acc, tag) => {
        acc[tag.name || tag] = tag.count || 1
        return acc
      }, {})
    } else {
      remoteTags = data || []
    }
```

**Step 2: 修复 setting.vue 中 fetchTags 的标签处理**

`src/views/setting.vue` 约第 421-448 行，同样的问题：

```js
    if (localSettings.value.apiVersion === 'v18') {
      tags.value = data || []
      tagCounts.value = (data || []).reduce((acc, tag) => {
        acc[tag] = 1
        return acc
      }, {})
    } else {
      // v24/v25/v26 返回字符串数组
      tags.value = Array.isArray(data) ? data : []
      tagCounts.value = (Array.isArray(data) ? data : []).reduce((acc, tag) => {
        const tagName = typeof tag === 'string' ? tag : (tag.name || tag)
        acc[tagName] = typeof tag === 'object' ? (tag.count || 1) : 1
        return acc
      }, {})
    }
```

**Step 3: 验证**

Run: `cd /Users/chendimao/WWW/memos-browers-plugin && npm run build`
Expected: 构建成功

**Step 4: Commit**

```bash
git add src/App.vue src/views/setting.vue
git commit -m "fix: handle tag data as string array for v24/v25/v26 API versions"
```

---

### Task 3: 修复编辑模式可见性同步 + storage 竞态 + 重复 watcher

**Files:**
- Modify: `src/App.vue:1677-1683` (编辑可见性)
- Modify: `src/views/setting.vue:466-506` (重复 watcher)
- Modify: `src/views/setting.vue:620-656` (storage 竞态)
- Modify: `background.js:92-106` (storage 竞态)

**Step 1: 修复 App.vue 编辑模式可见性同步**

`src/App.vue` 约第 1677-1683 行，`handleEditMemo` 需要同时更新 `visibility.value`：

```js
const handleEditMemo = (memo) => {
  if (!ensureUnlocked()) return
  if (!ensureConfiguredOrOpenSettings()) return
  editingMemo.value = memo
  content.value = memo.content
  currentVisibility.value = memo.visibility
  visibility.value = memo.visibility
  currentView.value = 'editor'
}
```

**Step 2: 合并 setting.vue 中重复的 showSettings watcher**

删除 `src/views/setting.vue` 第 466-468 行的第一个 watcher：

```js
// 删除这段（约第 466-468 行）：
// watch(() => props.showSettings, (newVal) => {
//     showSettings.value = newVal
// })
```

保留第 494-506 行的完整版 watcher（它已经包含了 `showSettings.value = newVal`）。

**Step 3: 修复 setting.vue 中 storage 写入竞态**

`src/views/setting.vue` 约第 641-656 行，将 `chrome.storage.local.set` 改为 Promise 并 await：

```js
    // 使用 Promise 包装确保写入完成
    await new Promise((resolve) => {
      chrome.storage.local.set({ 'memos-settings': settingsToSave }, resolve)
    })
    // 更新父组件设置
    emits('update:settings', settingsToSave)

    // 应用语言设置
    if (setLanguage(currentLanguage.value)) {
      showToast(t('settings.languageChanged'))
      emits('update:showSettings', false)
      window.location.reload()
    } else {
      emits('update:showSettings', false)
    }
```

**Step 4: 修复 background.js 中 storage 写入竞态**

`background.js` 约第 92-106 行：

```js
    // 存储最终内容，等待写入完成后再打开弹窗
    await new Promise((resolve) => {
      chrome.storage.local.set({
        'selectedText': finalContent,
        'sourceUrl': tab.url,
        'sourceTitle': tab.title,
        'hasFormatting': hasFormatting
      }, resolve)
    })

    console.log('Memos: 内容已存储', {
      contentLength: finalContent?.length,
      hasFormatting
    });

    // 打开扩展弹窗
    chrome.action.openPopup();
```

**Step 5: 验证**

Run: `cd /Users/chendimao/WWW/memos-browers-plugin && npm run build`
Expected: 构建成功

**Step 6: Commit**

```bash
git add src/App.vue src/views/setting.vue background.js
git commit -m "fix: sync visibility on edit, merge duplicate watchers, await storage writes"
```

---

### Task 4: 修复 v26 重复查询参数 + v24 createMemo 缺少错误检查

**Files:**
- Modify: `src/api/v26.js:112-156`
- Modify: `src/api/v24.js` (createMemo 方法)

**Step 1: 修复 v26.js getMemos 重复参数**

`src/api/v26.js` 约第 130-149 行，移除重复的 snake_case 参数：

```js
    if (offset) {
      url.searchParams.append('pageToken', offset)
    }

    url.searchParams.append('pageSize', limit)

    if (filter) {
      url.searchParams.append('filter', filter)
    }

    if (tag) {
      console.log('v26 标签过滤将在客户端处理:', tag)
    }

    url.searchParams.append('orderBy', 'pinned desc, display_time desc')
    url.searchParams.append('state', 'NORMAL')
```

**Step 2: 修复 v24.js createMemo 缺少错误检查**

在 v24.js 的 `createMemo` 方法中，fetch 后添加错误检查：

```js
  async createMemo(host, token, content, visibility = 'PUBLIC', relationList = []) {
    const response = await fetch(`${host}/api/v1/memos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content, visibility, createdTs: Date.now(), relationList })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `创建失败 (${response.status})`)
    }

    return response
  },
```

**Step 3: 验证**

Run: `cd /Users/chendimao/WWW/memos-browers-plugin && npm run build`
Expected: 构建成功

**Step 4: Commit**

```bash
git add src/api/v26.js src/api/v24.js
git commit -m "fix: remove duplicate query params in v26, add error check in v24 createMemo"
```

---

### Task 5: 性能优化 — N+1 请求改并行 + 搜索防抖 + 移除高频日志

**Files:**
- Modify: `src/views/MemosList.vue:293-299` (N+1 改 Promise.all)
- Modify: `src/views/MemosList.vue:541-548` (loadMore 同理)
- Modify: `src/views/MemosList.vue:455-463` (搜索防抖)
- Modify: `src/views/MemosList.vue:408-428` (移除 getMemoIdentifier 日志)

**Step 1: 修复 fetchMemos 中 v24 的 N+1 串行请求**

`src/views/MemosList.vue` 约第 293-299 行，改为并行：

```js
      // v24: 并行获取所有 memo 的资源
      await Promise.all(data.map(async (memo) => {
        try {
          const resources = await api.listResources(props.settings.host, props.settings.token, memo.name)
          if (resources && resources.resources && resources.resources.length > 0) {
            memo.resources = resources.resources
          }
        } catch (e) {
          console.warn('获取资源失败:', memo.name, e)
        }
      }))
```

**Step 2: 修复 loadMore 中同样的 N+1 问题**

`src/views/MemosList.vue` 约第 541-548 行，同样改为 `Promise.all`（与 Step 1 相同模式）。

**Step 3: 添加搜索防抖**

`src/views/MemosList.vue` 约第 455-463 行，替换直接 watch 为防抖版本：

```js
// 搜索防抖
let searchTimer = null
watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    fetchMemos()
  }, 400)
})

// 标签选择不需要防抖，但要避免与 selectTag 中的手动调用重复
// 移除 watch(selectedTag) 的自动触发，因为 selectTag/handleTagChange 已经手动调用了 fetchMemos
// watch(selectedTag, () => {
//   fetchMemos()
// })
```

**Step 4: 移除 getMemoIdentifier 中的高频日志**

`src/views/MemosList.vue` 约第 408-428 行：

```js
const getMemoIdentifier = (memo) => {
  if (props.settings.apiVersion === 'v18') {
    return memo.id
  }
  return memo.name || memo.id
}
```

**Step 5: 验证**

Run: `cd /Users/chendimao/WWW/memos-browers-plugin && npm run build`
Expected: 构建成功

**Step 6: Commit**

```bash
git add src/views/MemosList.vue
git commit -m "perf: parallelize resource fetching, debounce search, remove high-frequency logs"
```

---

### Task 6: 代码质量 — 修复 process.env、i18n 硬编码、removeEventListener、warning toast

**Files:**
- Modify: `src/App.vue:248` (process.env → import.meta.env)
- Modify: `src/views/setting.vue:672` (同上)
- Modify: `src/views/setting.vue:558-571` (硬编码中文 → i18n)
- Modify: `src/App.vue:701-704` (removeEventListener 修复)
- Modify: `src/utils/toast.js` (添加 warning 类型)

**Step 1: 替换 process.env 为 import.meta.env**

`src/App.vue` 第 248 行：

```js
const isDev = ref(import.meta.env.DEV)
```

`src/views/setting.vue` 第 672 行：

```js
const isDev = ref(import.meta.env.DEV)
```

**Step 2: 修复 setting.vue 中硬编码的中文错误消息**

`src/views/setting.vue` 约第 558-571 行，在 `saveSettings` 中：

```js
  if (!isValid.value) {
    showToast(t('settings.validationRequired'), 'error')
    return
  }

  if (!localSettings.value.host) {
    showToast(t('settings.hostRequired'), 'error')
    return
  }
  if (!localSettings.value.token) {
    showToast(t('settings.tokenRequired'), 'error')
    return
  }
```

同时在 `src/i18n/messages.js` 的 zh 和 en 中添加对应 key：

zh:
```js
settings: {
  // ... 现有内容
  validationRequired: '请填写必要的设置项',
  hostRequired: '主页网址不能为空',
  tokenRequired: 'Access Token 不能为空',
}
```

en:
```js
settings: {
  // ... 现有内容
  validationRequired: 'Please fill in required settings',
  hostRequired: 'Host URL is required',
  tokenRequired: 'Access Token is required',
}
```

**Step 3: 修复 App.vue removeEventListener**

`src/App.vue` 约第 701-704 行。当前 `document.removeEventListener('click', () => {})` 传入匿名函数无法移除。如果没有对应的 addEventListener，直接删除这行：

```js
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown, { capture: true })
})
```

**Step 4: 在 toast.js 中添加 warning 类型**

在 `src/utils/toast.js` 的样式和图标映射中添加 warning：

在 typeConfig 对象中添加：

```js
  warning: {
    background: '#FEF3C7',
    color: '#92400E',
    icon: 'fas fa-exclamation-triangle'
  }
```

**Step 5: 验证**

Run: `cd /Users/chendimao/WWW/memos-browers-plugin && npm run build`
Expected: 构建成功

**Step 6: Commit**

```bash
git add src/App.vue src/views/setting.vue src/utils/toast.js src/i18n/messages.js
git commit -m "fix: replace process.env, use i18n for error messages, fix event listener cleanup, add warning toast"
```

---

### Task 7: 安全加固 — CEL 注入防护 + toast 样式幂等

**Files:**
- Modify: `src/api/v24.js` (getMemos 中的 filter 拼接)
- Modify: `src/api/v25.js` (同上)
- Modify: `src/api/v26.js` (同上)
- Modify: `src/utils/toast.js` (样式幂等)

**Step 1: 修复 API 层 CEL 过滤表达式注入**

在 v24.js、v25.js、v26.js 的 `getMemos` 方法中，搜索内容拼接到 CEL 表达式前需要转义双引号：

```js
    if (content) {
      const trimmedContent = content.trim()
      if (trimmedContent) {
        // 转义双引号防止 CEL 注入
        const escapedContent = trimmedContent.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
        filter = `content.contains("${escapedContent}")`
      }
    }
```

对三个文件中的相同模式都做此修改。

**Step 2: 修复 toast.js 样式重复注入**

在 `src/utils/toast.js` 中，添加幂等检查：

```js
// 在添加 style 元素前检查是否已存在
if (!document.getElementById('memos-toast-styles')) {
  const style = document.createElement('style')
  style.id = 'memos-toast-styles'
  style.textContent = `...` // 现有样式内容
  document.head.appendChild(style)
}
```

**Step 3: 验证**

Run: `cd /Users/chendimao/WWW/memos-browers-plugin && npm run build`
Expected: 构建成功

**Step 4: Commit**

```bash
git add src/api/v24.js src/api/v25.js src/api/v26.js src/utils/toast.js
git commit -m "fix(security): escape CEL filter input, make toast styles idempotent"
```
