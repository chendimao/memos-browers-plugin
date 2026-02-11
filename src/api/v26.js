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
  }
};
