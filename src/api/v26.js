/**
 * Memos v0.26.x API 服务
 * 适配最新的 gRPC-Gateway RESTful 接口
 */
export const v26Api = {
  /**
   * 创建便签
   */
  async createMemo(host, token, content, visibility = 'PRIVATE', tags = [], pinned = false) {
    const response = await fetch(`${host}/api/v1/memos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content: content,
        visibility: visibility.toUpperCase(),
        // v0.26 建议标签直接写在 content 里，如果传数组，确保它是这种格式
        tags: tags.length > 0 ? tags : [],
        pinned: pinned
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '创建便签失败');
    }

    return response
  },

  /**
   * 测试连接 - 使用 v0.26 最稳妥的 me 接口
   */
  async testConnection(host, token) {
    // v0.26 舍弃了 /auth/sessions/current，改用 /users/me
    const response = await fetch(`${host}/api/v1/users/me`, {
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
          // v0.26 返回的是资源名格式，如 "users/1"
          name: data.displayName || data.username || data.name,
          username: data.username,
          id: data.name 
        }
      };
    }

    // 备用方案：如果 users/me 权限受限，尝试工作空间概览
    const workspaceRes = await fetch(`${host}/api/v1/workspace/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (workspaceRes.ok) {
      return { ok: true, data: { name: 'Memos User' } };
    }

    throw new Error(`认证失败: ${response.status}`);
  },

  /**
   * 获取便签列表
   */
  async getMemos(host, token, { pageSize = 20, pageToken = '', filter = '' } = {}) {
    const url = new URL(`${host}/api/v1/memos`)
    url.searchParams.append('page_size', pageSize)
    if (pageToken) url.searchParams.append('page_token', pageToken)
    if (filter) url.searchParams.append('filter', filter)
    
    // 默认只获取正常状态的
    url.searchParams.append('state', 'NORMAL')

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) throw new Error('获取便签列表失败')
    return response
  },

  /**
   * 获取标签列表
   */
  async getTags(host, token) {
    try {
      // v0.26 推荐从用户信息或直接从 memo 聚合
      const response = await this.getMemos(host, token, { pageSize: 100 });
      if (response.ok) {
        const data = await response.json();
        const allTags = new Set();
        (data.memos || []).forEach(memo => {
          if (memo.tags && Array.isArray(memo.tags)) {
            memo.tags.forEach(tag => allTags.add(tag));
          }
        });
        return Array.from(allTags);
      }
    } catch (error) {
      console.error('获取标签失败:', error);
    }
    return [];
  },

  /**
   * 删除便签
   */
  async deleteMemo(host, token, memoName) {
    // memoName 应该是 "memos/123" 这种格式
    const response = await fetch(`${host}/api/v1/${memoName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) throw new Error('删除失败')
  }
}
