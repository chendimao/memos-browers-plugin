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
   * @returns {Promise<Object>}
   */
  async createMemo(host, token, content, visibility = 'PUBLIC', relationList = []) {
    return await fetch(`${host}/api/v1/memos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content,
        visibility,
        createdTs: Date.now(),
        relationList: relationList, 
      })
    })


 
  },

  /**
   * 列出备忘录
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} parent - 父级路径
   * @returns {Promise<Object>}
   */
  async listMemos(host, token, parent = 'users/-') {
    const response = await fetch(`${host}/api/v1/${parent}/memos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取备忘录列表失败')
    }

    return response.json()
  },

  /**
   * 获取备忘录
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} name - 备忘录名称
   * @returns {Promise<Object>}
   */
  async getMemo(host, token, name) {
    const response = await fetch(`${host}/api/v1/${name}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取备忘录失败')
    }

    return response.json()
  },

  /**
   * 更新备忘录
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} name - 备忘录名称
   * @param {string} content - 新内容
   * @returns {Promise<Object>}
   */
  async updateMemo(host, token, name, content) {
    const response = await fetch(`${host}/api/v1/${name}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content: content.content,
        visibility: content.visibility,
      
      })
    }) 

    return response;
  },

  /**
   * 删除备忘录
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} name - 备忘录名称
   * @returns {Promise<void>}
   */
  async deleteMemo(host, token, name) {
    const response = await fetch(`${host}/api/v1/${name}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('删除备忘录失败')
    }
  },

  /**
   * 重命名标签
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} parent - 父级路径
   * @param {string} oldTag - 旧标签
   * @param {string} newTag - 新标签
   * @returns {Promise<Object>}
   */
  async renameTag(host, token, parent, oldTag, newTag) {
    const response = await fetch(`${host}/api/v1/${parent}/tags:rename`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        old_tag: oldTag,
        new_tag: newTag
      })
    })

    if (!response.ok) {
      throw new Error('重命名标签失败')
    }

    return response.json()
  },

  /**
   * 删除标签
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} parent - 父级路径
   * @param {string} tag - 标签名
   * @returns {Promise<void>}
   */
  async deleteTag(host, token, parent, tag) {
    const response = await fetch(`${host}/api/v1/${parent}/tags/${tag}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('删除标签失败')
    }
  },

  /**
   * 设置资源
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} name - 备忘录名称
   * @param {Array<string>} resourceIds - 资源ID列表
   * @returns {Promise<Object>}
   */
  async setResources(host, token, name, resourceIds) {
    const response = await fetch(`${host}/api/v1/${name}/resources`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        resources: resourceIds.map(id => ({ id }))
      })
    })

    if (!response.ok) {
      throw new Error('设置资源失败')
    }

    return response.json()
  },

  /**
   * 获取备忘录的资源列表
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} memoName - 备忘录名称
   * @returns {Promise<Object>}
   */
  async listResources(host, token, memoName) {
    const response = await fetch(`${host}/api/v1/${memoName}/resources`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取资源列表失败')
    }

    const data = await response.json()
    
    // 为每个资源添加正确的 URL
    if (data.resources && Array.isArray(data.resources)) {
      data.resources = data.resources.map(resource => ({
        ...resource,
        url: `${host}/file/${resource.name}/${resource.filename}?thumbnail=true`
      }))
    }

    return data
  },

  /**
   * 设置关系
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} name - 备忘录名称
   * @param {Array<Object>} relations - 关系列表
   * @returns {Promise<Object>}
   */
  async setRelations(host, token, name, relations) {
    const response = await fetch(`${host}/api/v1/${name}/relations`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        relations: relations.map(relation => ({
          type: relation.type,
          memo: { id: relation.memoId }
        }))
      })
    })

    if (!response.ok) {
      throw new Error('设置关系失败')
    }

    return response.json()
  },

  /**
   * 列出关系
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} name - 备忘录名称
   * @returns {Promise<Object>}
   */
  async listRelations(host, token, name) {
    const response = await fetch(`${host}/api/v1/${name}/relations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取关系列表失败')
    }

    return response.json()
  },

  /**
   * 创建评论
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} name - 备忘录名称
   * @param {string} content - 评论内容
   * @returns {Promise<Object>}
   */
  async createComment(host, token, name, content) {
    const response = await fetch(`${host}/api/v1/${name}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        comment: { content }
      })
    })

    if (!response.ok) {
      throw new Error('创建评论失败')
    }

    return response.json()
  },

  /**
   * 列出评论
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} name - 备忘录名称
   * @returns {Promise<Object>}
   */
  async listComments(host, token, name) {
    const response = await fetch(`${host}/api/v1/${name}/comments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取评论列表失败')
    }

    return response.json()
  },

  /**
   * 列出反应
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} name - 备忘录名称
   * @returns {Promise<Object>}
   */
  async listReactions(host, token, name) {
    const response = await fetch(`${host}/api/v1/${name}/reactions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取反应列表失败')
    }

    return response.json()
  },

  /**
   * 设置反应
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} name - 备忘录名称
   * @param {string} type - 反应类型
   * @returns {Promise<Object>}
   */
  async setReaction(host, token, name, type) {
    const response = await fetch(`${host}/api/v1/${name}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reaction: { type }
      })
    })

    if (!response.ok) {
      throw new Error('设置反应失败')
    }

    return response.json()
  },

  /**
   * 删除反应
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} id - 反应ID
   * @returns {Promise<void>}
   */
  async deleteReaction(host, token, id) {
    const response = await fetch(`${host}/api/v1/reactions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('删除反应失败')
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
    const fileUrl = data.externalLink || `${host}/file/${data.name}/${data.filename}`
    
    // 根据文件类型返回不同的 markdown 格式
    let markdown = ''
    if (file.type.startsWith('image/')) {
      markdown = `![${file.name}](${fileUrl})`
    } else {
      markdown = `[${file.name}](${fileUrl})`
    }
    
    return {
      id: data.name,
      name: data.name,
      url: fileUrl,
      type: file.type,
      filename: file.name,
      markdown: markdown
    }
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
   * 获取备忘录列表
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {Object} options - 查询选项
   * @param {number} options.offset - 偏移量
   * @param {number} options.limit - 每页数量
   * @param {string} options.content - 搜索内容
   * @param {string} options.visibility - 可见性过滤
   * @param {string} options.tag - 标签过滤
   * @returns {Promise<Object>}
   */
  async getMemos(host, token, { offset = null, limit = 10, content, visibility, tag } = {}) {
    // 从缓存中获取用户信息
    const cachedSettings = localStorage.getItem('memos-settings')
    if (!cachedSettings) {
      throw new Error('未找到用户信息')
    }
    
    const settings = JSON.parse(cachedSettings)
    if (!settings.userInfo || !settings.userInfo.name) {
      throw new Error('用户信息不完整')
    }

    const username = settings.userInfo.name
    const url = new URL(`${host}/api/v1/${username}/memos`)
    
    // 构建过滤条件
    let filter = '';
    if (content) {
      filter = `content.contains("${content}")`;
    }  
    
    // 使用 pageToken 替代 offset
    if (offset) {
      url.searchParams.append('pageToken', offset)
    }
    
    url.searchParams.append('pageSize', limit)
    
    if (filter) {
      url.searchParams.append('filter', filter)
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
  }
} 