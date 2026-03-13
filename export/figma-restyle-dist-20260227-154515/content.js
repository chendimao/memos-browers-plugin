// Content script for getting selected HTML content

/**
 * 获取选中内容的HTML
 * @returns {Object} 包含文本和HTML的对象
 */
function getSelectionContent() {
  const selection = window.getSelection();
  
  if (selection.rangeCount === 0) {
    console.log('Memos: 没有选中内容');
    return { text: '', html: '', hasFormatting: false };
  }
  
  const range = selection.getRangeAt(0);
  const text = selection.toString();
  
  // 创建一个临时容器来获取HTML
  const container = document.createElement('div');
  container.appendChild(range.cloneContents());
  const html = container.innerHTML;
  
  // 更严格的格式检测
  const hasFormatting = detectFormatting(html, text, range);
  
  console.log('Memos: 选中内容分析', {
    text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    html: html.substring(0, 200) + (html.length > 200 ? '...' : ''),
    hasFormatting: hasFormatting,
    htmlLength: html.length,
    textLength: text.length
  });
  
  return {
    text: text,
    html: html,
    hasFormatting: hasFormatting
  };
}

/**
 * 检测选中内容是否包含格式
 * @param {string} html - HTML内容
 * @param {string} text - 纯文本内容
 * @param {Range} range - 选中范围
 * @returns {boolean} 是否包含格式
 */
function detectFormatting(html, text, range) {
  // 1. 检查HTML是否包含标签
  if (html && html.includes('<') && html !== text) {
    return true;
  }
  
  // 2. 检查选中范围内是否有格式化元素
  const commonContainer = range.commonAncestorContainer;
  if (commonContainer.nodeType === Node.ELEMENT_NODE) {
    const formattingTags = ['strong', 'b', 'em', 'i', 'code', 'a', 'span', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const hasFormattingElements = formattingTags.some(tag => 
      commonContainer.querySelector && commonContainer.querySelector(tag)
    );
    if (hasFormattingElements) {
      return true;
    }
  }
  
  // 3. 检查选中内容是否跨越多个元素
  if (range.startContainer !== range.endContainer) {
    return true;
  }
  
  // 4. 检查父元素是否有格式
  let parent = range.startContainer.parentElement;
  while (parent && parent !== document.body) {
    const tagName = parent.tagName.toLowerCase();
    if (['strong', 'b', 'em', 'i', 'code', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
      return true;
    }
    parent = parent.parentElement;
  }
  
  return false;
}

/**
 * HTML转Markdown的基础转换器
 * @param {string} html - HTML字符串
 * @returns {string} Markdown字符串
 */
function htmlToMarkdown(html) {
  if (!html) return '';
  
  console.log('Memos: 开始转换HTML到Markdown', html);
  
  // 创建临时元素来解析HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // 递归处理节点
  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }
    
    const tagName = node.tagName.toLowerCase();
    let content = '';
    
    // 处理子节点
    for (const child of node.childNodes) {
      content += processNode(child);
    }
    
    // 根据标签类型转换为Markdown
    switch (tagName) {
      case 'strong':
      case 'b':
        return content ? `**${content}**` : content;
      
      case 'em':
      case 'i':
        return content ? `*${content}*` : content;
      
      case 'code':
        return content ? `\`${content}\`` : content;
      
      case 'pre':
        return content ? `\`\`\`\n${content}\n\`\`\`` : content;
      
      case 'h1':
        return content ? `# ${content}` : content;
      
      case 'h2':
        return content ? `## ${content}` : content;
      
      case 'h3':
        return content ? `### ${content}` : content;
      
      case 'h4':
        return content ? `#### ${content}` : content;
      
      case 'h5':
        return content ? `##### ${content}` : content;
      
      case 'h6':
        return content ? `###### ${content}` : content;
      
      case 'p':
        return content ? `${content}\n\n` : content;
      
      case 'div':
        // 对于div，检查是否有特殊样式
        const style = node.getAttribute('style') || '';
        if (style.includes('font-weight: bold') || style.includes('font-weight:bold')) {
          return content ? `**${content}**` : content;
        }
        if (style.includes('font-style: italic') || style.includes('font-style:italic')) {
          return content ? `*${content}*` : content;
        }
        return content;
      
      case 'span':
        // 对于span，检查样式
        const spanStyle = node.getAttribute('style') || '';
        const className = node.getAttribute('class') || '';
        
        if (spanStyle.includes('font-weight: bold') || spanStyle.includes('font-weight:bold') || 
            className.includes('bold') || className.includes('strong')) {
          return content ? `**${content}**` : content;
        }
        if (spanStyle.includes('font-style: italic') || spanStyle.includes('font-style:italic') ||
            className.includes('italic') || className.includes('emphasis')) {
          return content ? `*${content}*` : content;
        }
        if (spanStyle.includes('text-decoration: underline') || className.includes('underline')) {
          return content ? `<u>${content}</u>` : content;
        }
        return content;
      
      case 'br':
        return '\n';
      
      case 'hr':
        return '\n---\n';
      
      case 'blockquote':
        return content ? content.split('\n').map(line => line ? `> ${line}` : '>').join('\n') : content;
      
      case 'ul':
      case 'ol':
        return content ? `${content}` : content;
      
      case 'li':
        const parent = node.parentElement;
        const isOrdered = parent && parent.tagName.toLowerCase() === 'ol';
        const prefix = isOrdered ? '1. ' : '- ';
        return content ? `${prefix}${content}\n` : '';
      
      case 'a':
        const href = node.getAttribute('href');
        if (href && content) {
          return `[${content}](${href})`;
        }
        return content;
      
      case 'img':
        const src = node.getAttribute('src');
        const alt = node.getAttribute('alt') || '';
        if (src) {
          return `![${alt}](${src})`;
        }
        return content;
      
      case 'table':
        return content ? `${content}\n` : content;
      
      case 'tr':
        return content ? `${content}|\n` : content;
      
      case 'td':
      case 'th':
        return content ? `| ${content} ` : '| ';
      
      case 'del':
      case 's':
        return content ? `~~${content}~~` : content;
      
      case 'mark':
        return content ? `==${content}==` : content;
      
      case 'sup':
        return content ? `^${content}^` : content;
      
      case 'sub':
        return content ? `~${content}~` : content;
      
      case 'u':
        return content ? `<u>${content}</u>` : content;
      
      default:
        return content;
    }
  }
  
  let markdown = processNode(temp);
  
  // 清理多余的换行和空格
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.replace(/\|\s*\|\n/g, '|\n'); // 清理表格空列
  markdown = markdown.trim();
  
  console.log('Memos: 转换结果', markdown);
  
  return markdown;
}

// 监听来自background script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelection') {
    const selectionData = getSelectionContent();
    
    // 如果有HTML格式，转换为Markdown
    if (selectionData.hasFormatting) {
      selectionData.markdown = htmlToMarkdown(selectionData.html);
    } else {
      selectionData.markdown = selectionData.text;
    }
    
    sendResponse(selectionData);
  }
});
