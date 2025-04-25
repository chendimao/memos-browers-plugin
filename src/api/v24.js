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
    const response = await fetch(`${host}/api/v1/memos`, {
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

    if (!response.ok) {
      throw new Error('创建备忘录失败')
    }

    const data = await response.json()
    return {
      response,
      data
    }
  },

  /**
   * 关联资源到备忘录
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} memoName - 备忘录名称
   * @param {Array<Object>} resources - 资源列表
   * @returns {Promise<Response>}
   */
  async associateResources(host, token, memoName, resources) {
    const response = await fetch(`${host}/api/v1/${memoName}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(resources)
    })

    if (!response.ok) {
      throw new Error('关联资源失败')
    }

    return response
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
   * @param {string} visibility - 可见性设置
   * @returns {Promise<Object>}
   */
  async uploadResource(host, token, file, visibility) {
    // 将文件转换为 base64
    const base64Content = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        // 移除 base64 URL 的前缀（如 "data:image/jpeg;base64,"）
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const response = await fetch(`${host}/api/v1/resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content: base64Content,
        filename: file.name,
        type: file.type,
        visibility
      })
    })

    if (!response.ok) {
      throw new Error('上传失败')
    }

    const data = await response.json()
    return {
      id: data.name,
      name: data.name,
      url: data.externalLink || `${host}/file/${data.name}/${data.filename}`,
      type: file.type,
      filename: file.name
    }
  },

  /**
   * 获取标签列表
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @returns {Promise<Array>}
   */
  async getTags(host, token) {
    try {
      // 从缓存中获取用户信息
      const cachedSettings = localStorage.getItem('memos-settings')
      if (!cachedSettings) {
        throw new Error('未找到用户信息')
      }
      
      const settings = JSON.parse(cachedSettings)
      if (!settings.userInfo || !settings.userInfo.name) {
        throw new Error('用户信息不完整')
      }
      
      // 检查是否有缓存的标签
      const cachedTags = localStorage.getItem('memos-tags')
      if (cachedTags) {
        return JSON.parse(cachedTags)
      }
      
      const parent = settings.userInfo.name
      const response = await fetch(`${host}/api/v1/${parent}/memos?pageSize=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('获取标签失败')
      }
      
      const data = await response.json()
      
      // 从 memos 中提取所有标签并去重
      const allTags = data.memos.reduce((tags, memo) => {
        if (memo.tags && Array.isArray(memo.tags)) {
          return [...tags, ...memo.tags]
        }
        return tags
      }, [])
      
      // 去重并缓存
      const uniqueTags = [...new Set(allTags)]
      localStorage.setItem('memos-tags', JSON.stringify(uniqueTags))
      
      return uniqueTags
    } catch (error) {
      console.error('获取标签失败:', error)
      throw error
    }
  },

  /**
   * 清除标签缓存
   */
  clearTagCache() {
    localStorage.removeItem('memos-tags')
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
  async getMemos(host, token, { offset = null, limit = 10, content, visibility, tag } = {}) {
    const url = new URL(`${host}/api/v1/memos`)
    
    // 使用 pageToken 替代 offset
    if (offset) {
      url.searchParams.append('pageToken', offset)
    }
    
    url.searchParams.append('pageSize', limit)
    
    if (content) {
      url.searchParams.append('content', content)
    }
    
    if (visibility && visibility !== 'all') {
      url.searchParams.append('visibility', visibility)
    }
    
    if (tag) {
      url.searchParams.append('tag', tag)
    }

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!res.ok) {
      throw new Error('获取备忘录列表失败')
    }

    return res;
    
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