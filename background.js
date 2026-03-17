const isBrowserNamespace = typeof globalThis.browser !== 'undefined'
const extensionApi = isBrowserNamespace ? globalThis.browser : globalThis.chrome
const contextMenusApi = extensionApi.contextMenus || extensionApi.menus

const callApi = (method, ...args) => {
  if (!method) {
    return Promise.reject(new Error('扩展 API 不可用'))
  }

  if (isBrowserNamespace) {
    return method(...args)
  }

  if (method.length <= args.length) {
    const result = method(...args)
    if (result && typeof result.then === 'function') {
      return result
    }

    return Promise.resolve(result)
  }

  return new Promise((resolve, reject) => {
    method(...args, (result) => {
      const lastError = extensionApi.runtime?.lastError
      if (lastError) {
        reject(new Error(lastError.message))
        return
      }

      resolve(result)
    })
  })
}

const getStorageValue = async (keys) => {
  return callApi(extensionApi.storage.local.get.bind(extensionApi.storage.local), keys)
}

const setStorageValue = async (items) => {
  return callApi(extensionApi.storage.local.set.bind(extensionApi.storage.local), items)
}

const openPopup = async () => {
  return callApi(extensionApi.action.openPopup.bind(extensionApi.action))
}

const restrictedUrlPrefixes = [
  'chrome://',
  'chrome-extension://',
  'edge://',
  'moz-extension://',
  'about:'
]

const isRestrictedUrl = (url = '') => {
  return restrictedUrlPrefixes.some((prefix) => url.startsWith(prefix))
}

// 创建右键菜单
extensionApi.runtime.onInstalled.addListener(async () => {
  await callApi(contextMenusApi.removeAll.bind(contextMenusApi))
  await callApi(contextMenusApi.create.bind(contextMenusApi), {
    id: 'addToMemos',
    title: '添加到 Memos',
    contexts: ['selection']
  })
})

// 处理右键菜单点击
contextMenusApi.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'addToMemos' || !tab?.id) {
    return
  }

  console.log('Memos: 右键菜单被点击', {
    tabId: tab.id,
    url: tab.url,
    selectionText: info.selectionText?.substring(0, 100)
  })

  let finalContent = info.selectionText
  let hasFormatting = false

  const settingsResult = await getStorageValue(['memos-settings'])
  const settings = settingsResult['memos-settings'] || {}

  // 正确处理 preserveFormatting 设置：undefined 时默认为 true，明确设置时使用设置值
  const preserveFormatting = settings.preserveFormatting === undefined ? true : settings.preserveFormatting
  console.log('Memos: 样式保留设置', {
    preserveFormatting,
    rawSetting: settings.preserveFormatting,
    settingsKeys: Object.keys(settings)
  })

  if (preserveFormatting) {
    try {
      if (isRestrictedUrl(tab.url)) {
        console.log('Memos: 无法在此页面注入脚本，使用纯文本')
        throw new Error('无法在系统页面注入脚本')
      }

      console.log('Memos: 开始注入 content script')
      const results = await callApi(
        extensionApi.scripting.executeScript.bind(extensionApi.scripting),
        {
          target: { tabId: tab.id },
          files: ['content.js']
        }
      )

      console.log('Memos: content script 注入成功', results)

      await new Promise((resolve) => setTimeout(resolve, 100))

      console.log('Memos: 发送消息获取选中内容')
      const response = await callApi(
        extensionApi.tabs.sendMessage.bind(extensionApi.tabs),
        tab.id,
        { action: 'getSelection' }
      )

      console.log('Memos: 收到响应', response)

      if (response && response.text) {
        finalContent = response.markdown || response.text || info.selectionText
        hasFormatting = response.hasFormatting || false

        console.log('Memos: 使用 HTML 转换内容', {
          hasFormatting,
          originalLength: info.selectionText?.length,
          convertedLength: finalContent.length
        })
      } else {
        console.log('Memos: 响应无效，使用纯文本')
        throw new Error('响应无效')
      }
    } catch (error) {
      console.log('Memos: 获取 HTML 内容失败，使用纯文本:', error.message)
      finalContent = info.selectionText
      hasFormatting = false
    }
  } else {
    console.log('Memos: 样式保留已禁用，使用纯文本模式')
    finalContent = info.selectionText
    hasFormatting = false
  }

  await setStorageValue({
    selectedText: finalContent,
    sourceUrl: tab.url,
    sourceTitle: tab.title,
    hasFormatting
  })

  console.log('Memos: 内容已存储', {
    contentLength: finalContent?.length,
    hasFormatting
  })

  await openPopup()
})
