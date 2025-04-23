// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToMemos",
    title: "添加到 Memos",
    contexts: ["selection"]
  });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addToMemos") {
    const selectedText = info.selectionText;
    
    // 存储选中的文本
    chrome.storage.local.set({ 
      'selectedText': selectedText,
      'sourceUrl': tab.url,
      'sourceTitle': tab.title
    });

    // 打开扩展弹窗
    chrome.action.openPopup();
  }
}); 