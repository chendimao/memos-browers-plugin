/**
 * Memos v0.26.x API 服务
 * 适配最新的 API 路径，不再使用已弃用的 session 接口
 */
export const v26Api = {
  /**
   * 测试连接 - 使用 v0.26.x 的标准用户信息接口
   */
  async testConnection(host, token) {
    // 移除 host 末尾的斜杠，防止拼接出 //api/v1 的错误路径
    const cleanHost = host.replace(/\/+$/, '');
    
    // v0.26.x 必须使用 /api/v1/users/me 获取当前用户信息
    const response = await fetch(`${cleanHost}/api/v1/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        ok: true,
        data: {
          // v0.26 返回的可能是 data.name (格式为 "users/1") 或 data.displayName
          name: data.displayName || data.username || 'Memos User',
          id: data.name
        }
      };
    }

    // 备选方案：尝试工作空间概览
    const profileRes = await fetch(`${cleanHost}/api/v1/workspace/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (profileRes.ok) return { ok: true, data: { name: 'Memos User' } };

    throw new Error(`认证失败: ${response.status}`);
  },

  /**
   * 创建便签
   */
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
      throw new Error(error.message || '发送失败');
    }
    return response;
  },

  /**
   * 获取便签列表
   */
  async getMemos(host, token, { pageSize = 20, pageToken = '', filter = '' } = {}) {
    const cleanHost = host.replace(/\/+$/, '');
    const url = new URL(`${cleanHost}/api/v1/memos`);
    url.searchParams.append('page_size', pageSize);
    if (pageToken) url.searchParams.append('page_token', pageToken);
    if (filter) url.searchParams.append('filter', filter);

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('列表获取失败');
    return response;
  },

  /**
   * 获取标签 (v0.26 建议从 memos 聚合)
   */
  async getTags(host, token) {
    const response = await this.getMemos(host, token, { pageSize: 50 });
    if (response.ok) {
      const data = await response.json();
      const tagSet = new Set();
      (data.memos || []).forEach(m => {
        if (m.tags) m.tags.forEach(t => tagSet.add(t));
      });
      return Array.from(tagSet);
    }
    return [];
  }
};
