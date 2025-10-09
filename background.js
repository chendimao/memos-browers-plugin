// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToMemos",
    title: "添加到 Memos",
    contexts: ["selection"]
  });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "addToMemos") {
    console.log('Memos: 右键菜单被点击', { 
      tabId: tab.id, 
      url: tab.url, 
      selectionText: info.selectionText?.substring(0, 100) 
    });

    let finalContent = info.selectionText;
    let hasFormatting = false;

    // 获取用户设置，检查是否启用样式保留
    const settings = await new Promise((resolve) => {
      chrome.storage.local.get(['memos-settings'], (result) => {
        resolve(result['memos-settings'] || {});
      });
    });

    // 正确处理preserveFormatting设置：undefined时默认为true，明确设置时使用设置值
    const preserveFormatting = settings.preserveFormatting === undefined ? true : settings.preserveFormatting;
    console.log('Memos: 样式保留设置', { 
      preserveFormatting, 
      rawSetting: settings.preserveFormatting,
      settingsKeys: Object.keys(settings)
    });

    // 只有在启用样式保留时才尝试获取HTML格式
    if (preserveFormatting) {
      try {
        // 检查是否可以注入脚本
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || 
            tab.url.startsWith('moz-extension://') || tab.url.startsWith('about:')) {
          console.log('Memos: 无法在此页面注入脚本，使用纯文本');
          throw new Error('无法在系统页面注入脚本');
        }

        // 注入content script并获取选中内容的HTML
        console.log('Memos: 开始注入content script');
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        console.log('Memos: content script注入成功', results);
        
        // 等待一小段时间确保脚本加载完成
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 发送消息获取选中内容
        console.log('Memos: 发送消息获取选中内容');
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelection' });
        
        console.log('Memos: 收到响应', response);
        
        if (response && response.text) {
          // 存储选中的内容（优先使用markdown格式）
          finalContent = response.markdown || response.text || info.selectionText;
          hasFormatting = response.hasFormatting || false;
          
          console.log('Memos: 使用HTML转换内容', { 
            hasFormatting, 
            originalLength: info.selectionText?.length,
            convertedLength: finalContent.length 
          });
        } else {
          console.log('Memos: 响应无效，使用纯文本');
          throw new Error('响应无效');
        }
      } catch (error) {
        console.log('Memos: 获取HTML内容失败，使用纯文本:', error.message);
        // 如果出错，回退到纯文本
        finalContent = info.selectionText;
        hasFormatting = false;
      }
    } else {
      console.log('Memos: 样式保留已禁用，使用纯文本模式');
      finalContent = info.selectionText;
      hasFormatting = false;
    }

    // 存储最终内容
    chrome.storage.local.set({ 
      'selectedText': finalContent,
      'sourceUrl': tab.url,
      'sourceTitle': tab.title,
      'hasFormatting': hasFormatting
    });

    console.log('Memos: 内容已存储', { 
      contentLength: finalContent?.length, 
      hasFormatting 
    });

    // 打开扩展弹窗
    chrome.action.openPopup();
  }
});
