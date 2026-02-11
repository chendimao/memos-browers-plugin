/**
 * Memos v0.26.x API 适配器
 * 严格对齐官方文档: /api/v1/memos
 */
export const v26Api = {
  /**
   * 测试连接 - 严格对齐标准
   */
  async testConnection(host, token) {
    const cleanHost = host.replace(/\/+$/, '');
    
    try {
      // 方案 A: 尝试获取当前用户信息 (RESTful 标准)
      const resMe = await fetch(`${cleanHost}/api/v1/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (resMe.ok) {
        const data = await resMe.json();
        return { ok: true, data: { name: data.displayName || data.username } };
      }

      // 方案 B: 如果 A 报 404/403，直接尝试拉取一条 Memo (对齐你给的文档例子)
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
      throw new Error(error.message || `发送失败 (${response.status})`);
    }
    return response;
  },

  /**
   * 获取便签列表 (对齐文档分页逻辑)
   */
  async getMemos(host, token, { pageSize = 20, pageToken = '', filter = '' } = {}) {
    const cleanHost = host.replace(/\/+$/, '');
    const url = new URL(`${cleanHost}/api/v1/memos`);
    url.searchParams.append('pageSize', pageSize); // 注意文档里是小驼峰 pageSize
    if (pageToken) url.searchParams.append('pageToken', pageToken);
    if (filter) url.searchParams.append('filter', filter);

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('列表获取失败');
    return response;
