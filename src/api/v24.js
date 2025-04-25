/**
 * Memos v2 (0.24.x) API 服务
 */
export const v24Api = {
  /**
   * 创建备忘录
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} content - 备忘录内容
   * @param {string} visibility - 可见性设置
   * @param {Array<string>} resourceIds - 资源ID列表
   * @returns {Promise<Response>}
   */
  async createMemo(host, token, content, visibility, resourceIds = []) {
    return fetch(`${host}/api/v1/memos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content,
        visibility,
        createdTs: Date.now(),
        relationList: [],
        resourceIdList: resourceIds
      })
    })
  },

  /**
   * 测试连接
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @returns {Promise<Object>}
   */
  async testConnection(host, token) {
    const response = await fetch(`${host}/api/v1/auth/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({})
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 检查返回数据是否包含必要的字段
    if (!data.name || !data.role) {
      throw new Error('无效的 API 响应')
    }
    
    // 检查用户状态
    if (data.state !== 'NORMAL') {
      throw new Error('用户状态异常')
    }
    
    return { ok: true, data }
  },

  /**
   * 上传资源
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {File} file - 要上传的文件
   * @returns {Promise<Object>}
   */
  async uploadResource(host, token, file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${host}/api/v1/resources`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error('上传失败')
    }

    const data = await response.json()
    return {
      id: data.id,
      url: data.externalLink || `${host}/o/r/${data.id}`,
      type: file.type,
      name: file.name
    }
  },

  /**
   * 获取标签列表
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @returns {Promise<Array>}
   */
  async getTags(host, token) {
    const response = await fetch(`${host}/api/v1/tag`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!response.ok) throw new Error('获取标签失败')
    return response.json()
  },

  /**
   * 获取备忘录列表
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {Object} options - 查询选项
   * @param {number} options.offset - 偏移量
   * @param {number} options.limit - 每页数量
   * @param {string} options.content - 搜索内容
   * @param {string} options.visibility - 可见性过滤
   * @param {string} options.tag - 标签过滤
   * @returns {Promise<Array>}
   */
  async getMemos(host, token, { offset = 0, limit = 20, content, visibility, tag } = {}) {
    const url = new URL(`${host}/api/v1/memos`)
    url.searchParams.append('offset', offset)
    url.searchParams.append('limit', limit)
    
    if (content) {
      url.searchParams.append('content', content)
    }
    
    if (visibility && visibility !== 'all') {
      url.searchParams.append('visibility', visibility)
    }
    
    if (tag) {
      url.searchParams.append('tag', tag)
    }

    return await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
 
  },

  /**
   * 删除备忘录
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {number} id - 备忘录ID
   * @returns {Promise<void>}
   */
  async deleteMemo(host, token, id) {
    const response = await fetch(`${host}/api/v1/memo/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`删除备忘录失败: ${response.statusText}`)
    }
  },

  /**
   * 更新备忘录
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {number} id - 备忘录ID
   * @param {Object} memo - 备忘录数据
   * @param {string} memo.content - 备忘录内容
   * @param {string} memo.visibility - 可见性设置
   * @param {Array} memo.resourceIdList - 资源ID列表
   * @param {number} memo.createdTs - 创建时间戳
   * @param {Array} memo.relationList - 关联列表
   * @returns {Promise<Response>}
   */
  async updateMemo(host, token, id, memo) {
    return fetch(`${host}/api/v1/memos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(memo)
    })
  }
} 