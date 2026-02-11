/**
 * Memos v0.26.x API 服务
 * 针对 v0.26.1 版本进行的适配
 */
export const v26Api = {
  // 创建便签
  async createMemo(host, token, content, visibility = 'PRIVATE', tags = [], pinned = false) {
    // v0.26 强制要求 visibility 为大写，且建议默认 PRIVATE
    const response = await fetch(`${host}/api/v1/memos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content: content,
        visibility: visibility.toUpperCase(),
        // v0.26 对标签的处理建议直接放入 content，或者通过这种方式
        tags: tags.length > 0 ? tags : [],
        pinned: pinned
      })
    })

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`创建失败: ${response.status} - ${errorText}`);
    }

    return response
  },

  // 获取便签列表
  async listMemos(host, token, options = {}) {
    const {
      pageSize = 20,
      pageToken = '',
      filter = '',
    } = options

    const url = new URL(`${host}/api/v1/memos`)
    url.searchParams.append('page_size', pageSize)
    if (pageToken) url.searchParams.append('page_token', pageToken)
    if (filter) url.searchParams.append('filter', filter)
    
    // v0.26 默认只看正常状态
    url.searchParams.append('state', 'NORMAL')

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) throw new Error('获取列表失败')
    return response
  },

  // 测试连接 (v0.26.x 建议使用 /me 或者 /auth/sessions/current)
  async testConnection(host, token) {
    const response = await fetch(`${host}/api/v1/auth/sessions/current`, {
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
          name: data.user?.name || 'User',
          id: data.user?.id
        }
      };
    }
    throw new Error('认证失败，请检查 Token 是否正确');
  },

  // 获取所有标签
  async getTags(host, token) {
    // v0.26 已经没有专门的全部标签接口了，通常从 /memos 聚合或者查用户配置
    // 这里采用简单方案：从最近的 memo 列表里提取
    const res = await this.listMemos(host, token, { pageSize: 50 });
    const data = await res.json();
    const tags = new Set();
    (data.memos || []).forEach(m => {
      if (m.tags) m.tags.forEach(t => tags.add(t));
    });
    return Array.from(tags);
  }
}