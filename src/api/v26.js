export const v26Api = {
  async testConnection(host, token) {
    const cleanHost = host.replace(/\/+$/, '');
    try {
      const resMe = await fetch(`${cleanHost}/api/v1/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resMe.ok) {
        const data = await resMe.json();
        return { ok: true, data: { name: data.displayName || data.username } };
      }
      const resMemos = await fetch(`${cleanHost}/api/v1/memos?pageSize=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resMemos.ok) {
        return { ok: true, data: { name: '已连接到 Memos' } };
      }
    } catch (err) {
      console.error('Test connection error:', err);
    }
    throw new Error('认证失败：请检查 Token 或 API 基础路径');
  },

  async createMemo(host, token, content, visibility = 'PRIVATE', tags = [], pinned = false) {
    const cleanHost = host.replace(/\/+$/, '');
    const response = await fetch(`${cleanHost}/api/v1/memos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content: content,
        visibility: visibility.toUpperCase(),
        tags: tags,
        pinned: pinned
      })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `发送失败 (${response.status})`);
    }
    return response;
  },

  async getMemos(host, token, { pageSize = 20, pageToken = '', filter = '' } = {}) {
    const cleanHost = host.replace(/\/+$/, '');
    const url = new URL(`${cleanHost}/api/v1/memos`);
    url.searchParams.append('pageSize', pageSize);
    if (pageToken) url.searchParams.append('pageToken', pageToken);
    if (filter) url.searchParams.append('filter', filter);
    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('列表获取失败');
    return response;
  },

  async getTags(host, token) {
    try {
      const response = await this.getMemos(host, token, { pageSize: 50 });
      if (response.ok) {
        const data = await response.json();
        const tagSet = new Set();
        (data.memos || []).forEach(m => {
          if (m.tags) m.tags.forEach(t => tagSet.add(t));
        });
        return Array.from(tagSet);
      }
    } catch (e) {
      console.error('Tags fetch error:', e);
    }
    return [];
  },
  
   async createAttachment(host, token, file, memoName = null) {
  const cleanHost = host.replace(/\/+$/, '');
  
  // 1. 将文件转换为 Base64（你的原有逻辑）
  const base64Content = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // 2. 构造请求体（你的原有逻辑）
  const requestBody = {
    filename: file.name,
    content: base64Content,
    type: file.type
  };
  if (memoName && memoName.startsWith('memos/')) {
    requestBody.memo = memoName;
  }

  // 3. 上传请求（你的原有逻辑）
  const response = await fetch(`${cleanHost}/api/v1/attachments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`附件上传失败: ${errorData.message || response.statusText}`);
  }

  const data = await response.json();

  // 4. 关键修改：返回完整的附件信息（含ID），而非只处理URL
  const attachmentId = data.name.split('/').pop(); // 提取附件ID
  const fileUrl = data.externalLink || `${cleanHost}/file/attachments/${attachmentId}/${data.filename}`;
  
  // 返回包含ID、URL、名称、类型的完整对象
  return {
    id: attachmentId, // 核心：附件ID，用于关联Memo
    url: fileUrl,
    name: file.name,
    type: file.type,
    originalData: data // 保留原始返回数据，备用
  };
}
};


