/**
 * Memos v0.25 API 服务
 * 基于 Protocol Buffers (gRPC-Gateway) 的 RESTful API 接口
 * 支持完整的便签管理、用户管理、附件管理等功能
 */
export const v25Api = {
  /**
   * 创建便签 - v0.25版本使用新的数据结构
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} content - 便签内容
   * @param {string} visibility - 可见性设置 (PRIVATE/PROTECTED/PUBLIC)
   * @param {Array} tags - 标签列表
   * @param {boolean} pinned - 是否置顶
   * @returns {Promise<Response>}
   */
  async createMemo(host, token, content, visibility = 'PUBLIC', tags = [], pinned = false) {
    const response = await fetch(`${host}/api/v1/memos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content,
        visibility,
        tags,
        pinned
      })
    })

    if (!response.ok) {
      throw new Error('创建便签失败')
    }

    return response
  },

  /**
   * 获取便签列表 - v0.25版本支持分页和过滤
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {Object} options - 查询选项
   * @param {number} options.pageSize - 每页数量 (默认50，最大1000)
   * @param {string} options.pageToken - 分页令牌
   * @param {string} options.filter - CEL过滤表达式
   * @param {string} options.orderBy - 排序规则
   * @param {string} options.state - 状态过滤 (NORMAL/ARCHIVED)
   * @param {boolean} options.showDeleted - 是否显示已删除
   * @returns {Promise<Response>}
   */
  async listMemos(host, token, options = {}) {
    const {
      pageSize = 50,
      pageToken,
      filter,
      orderBy = 'pinned desc, display_time desc',
      state = 'NORMAL',
      showDeleted = false
    } = options

    const url = new URL(`${host}/api/v1/memos`)
    url.searchParams.append('page_size', pageSize)
    
    if (pageToken) url.searchParams.append('page_token', pageToken)
    if (filter) url.searchParams.append('filter', filter)
    if (orderBy) url.searchParams.append('order_by', orderBy)
    if (state) url.searchParams.append('state', state)
    if (showDeleted) url.searchParams.append('show_deleted', showDeleted)

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取便签列表失败')
    }

    return response
  },

  /**
   * 获取便签详情 - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} memoName - 便签名称 (格式: memos/{memo_id})
   * @returns {Promise<Object>}
   */
  async getMemo(host, token, memoName) {
    const response = await fetch(`${host}/api/v1/${memoName}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取便签失败')
    }

    return response.json()
  },

  /**
   * 更新便签 - v0.25版本支持字段掩码
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} memoName - 便签名称 (格式: memos/{memo_id})
   * @param {Object} memo - 便签对象
   * @param {Array<string>} updateMask - 要更新的字段列表
   * @returns {Promise<Object>}
   */
  async updateMemo(host, token, memoName, memo, updateMask = []) {
    // v0.25版本直接发送字段，不包装在memo对象中
    const requestBody = {
      name: memoName,
      ...memo
    }

    if (updateMask.length > 0) {
      requestBody.update_mask = {
        paths: updateMask
      }
    }

    console.log('v25 updateMemo请求:', {
      url: `${host}/api/v1/${memoName}`,
      body: requestBody
    })

    const response = await fetch(`${host}/api/v1/${memoName}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error('更新便签失败')
    }

    return response
  },

  /**
   * 删除便签 - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} memoName - 便签名称 (格式: memos/{memo_id})
   * @returns {Promise<void>}
   */
  async deleteMemo(host, token, memoName) {
    const response = await fetch(`${host}/api/v1/${memoName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('删除便签失败')
    }
  },

  /**
   * 重命名便签标签 - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} memoName - 便签名称 (格式: memos/{memo_id} 或 memos/- 表示所有便签)
   * @param {string} oldTag - 旧标签名
   * @param {string} newTag - 新标签名
   * @returns {Promise<Object>}
   */
  async renameMemoTag(host, token, memoName, oldTag, newTag) {
    const response = await fetch(`${host}/api/v1/${memoName}/tags:rename`, {
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
   * 删除便签标签 - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} memoName - 便签名称 (格式: memos/{memo_id} 或 memos/- 表示所有便签)
   * @param {string} tag - 要删除的标签名
   * @returns {Promise<void>}
   */
  async deleteMemoTag(host, token, memoName, tag) {
    const response = await fetch(`${host}/api/v1/${memoName}/tags:delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        tag: tag
      })
    })

    if (!response.ok) {
      throw new Error('删除标签失败')
    }
  },

  /**
   * 设置便签附件 - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} memoName - 便签名称 (格式: memos/{memo_id})
   * @param {Array<string>} attachmentNames - 附件名称列表 (格式: attachments/{attachment_id})
   * @returns {Promise<Object>}
   */
  async setMemoAttachments(host, token, memoName, attachmentNames) {
    const response = await fetch(`${host}/api/v1/${memoName}/attachments`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        attachments: attachmentNames.map(name => ({ name }))
      })
    })

    if (!response.ok) {
      throw new Error('设置便签附件失败')
    }

    return response.json()
  },

  /**
   * 获取便签附件列表 - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} memoName - 便签名称 (格式: memos/{memo_id})
   * @returns {Promise<Object>}
   */
  async listMemoAttachments(host, token, memoName) {
    const response = await fetch(`${host}/api/v1/${memoName}/attachments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取便签附件列表失败')
    }

    const data = await response.json()
    
    // 为每个附件添加正确的下载 URL
    if (data.attachments && Array.isArray(data.attachments)) {
      data.attachments = data.attachments.map(attachment => {
        // 从 attachment.name 中提取附件ID (去掉 "attachments/" 前缀)
        const attachmentId = attachment.name.replace('attachments/', '')
        return {
          ...attachment,
          url: `${host}/file/attachments/${attachmentId}/${attachment.filename}`,
          thumbnailUrl: `${host}/file/attachments/${attachmentId}/${attachment.filename}?thumbnail=true`
        }
      })
    }

    return data
  },

  /**
   * 创建附件 - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {File} file - 要上传的文件
   * @param {string} memoName - 关联的便签名称 (可选，格式: memos/{memo_id})
   * @returns {Promise<Object>}
   */
  async createAttachment(host, token, file, memoName = null) {
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

    // 根据错误信息，v0.25版本可能需要直接传递字段
    const requestBody = {
      filename: file.name,
      content: base64Content,
      type: file.type
    }

    // 只有当memoName存在且格式正确时才添加memo字段
    if (memoName && memoName.startsWith('memos/')) {
      requestBody.memo = memoName
    }

    const response = await fetch(`${host}/api/v1/attachments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`创建附件失败: ${errorData.message || response.statusText}`)
    }

    const data = await response.json()
    
    // 添加便于使用的 URL 和 Markdown
    // 从 data.name 中提取附件ID (去掉 "attachments/" 前缀)
    const attachmentId = data.name.replace('attachments/', '')
    const fileUrl = data.external_link || `${host}/file/attachments/${attachmentId}/${data.filename}`
    let markdown = ''
    if (file.type.startsWith('image/')) {
      markdown = `![${file.name}](${fileUrl})`
    } else {
      markdown = `[${file.name}](${fileUrl})`
    }
    
    return {
      ...data,
      id: data.name, // 添加id字段用于兼容
      url: fileUrl,
      thumbnailUrl: `${host}/file/attachments/${attachmentId}/${data.filename}?thumbnail=true`,
      markdown: markdown
    }
  },

  /**
   * 获取附件列表 - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {Object} options - 查询选项
   * @param {number} options.pageSize - 每页数量
   * @param {string} options.pageToken - 分页令牌
   * @param {string} options.filter - 过滤条件
   * @param {string} options.orderBy - 排序规则
   * @returns {Promise<Object>}
   */
  async listAttachments(host, token, options = {}) {
    const { pageSize = 50, pageToken, filter, orderBy = 'create_time desc' } = options

    const url = new URL(`${host}/api/v1/attachments`)
    url.searchParams.append('page_size', pageSize)
    
    if (pageToken) url.searchParams.append('page_token', pageToken)
    if (filter) url.searchParams.append('filter', filter)
    if (orderBy) url.searchParams.append('order_by', orderBy)

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取附件列表失败')
    }

    return response.json()
  },

  /**
   * 删除附件 - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} attachmentName - 附件名称 (格式: attachments/{attachment_id})
   * @returns {Promise<void>}
   */
  async deleteAttachment(host, token, attachmentName) {
    const response = await fetch(`${host}/api/v1/${attachmentName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('删除附件失败')
    }
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
   * 获取标签列表 - v0.25版本从便签中提取标签
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @returns {Promise<Array>}
   */
  async getTags(host, token) {
    try {
      // 从缓存中获取用户信息
      const cachedSettings = localStorage.getItem('memos-settings')
      if (!cachedSettings) {
        console.log('未找到缓存设置，尝试使用通用端点获取标签')
        return await this.getTagsWithoutUserInfo(host, token)
      }
      
      const settings = JSON.parse(cachedSettings)
      if (!settings.userInfo || !settings.userInfo.name) {
        console.log('用户信息不完整，尝试使用通用端点获取标签')
        return await this.getTagsWithoutUserInfo(host, token)
      }
      
      // 检查是否有缓存的标签
      const cachedTags = localStorage.getItem('memos-tags')
      if (cachedTags) {
        return JSON.parse(cachedTags)
      }
      
      // v0.25版本使用新的便签列表端点
      const response = await this.listMemos(host, token, {
        pageSize: 1000,
        orderBy: 'create_time desc'
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // 从便签中提取所有标签并去重
        const allTags = (data.memos || []).reduce((tags, memo) => {
          if (memo.tags && Array.isArray(memo.tags)) {
            return [...tags, ...memo.tags]
          }
          return tags
        }, [])
        
        // 去重并缓存
        const uniqueTags = [...new Set(allTags)]
        localStorage.setItem('memos-tags', JSON.stringify(uniqueTags))
        
        return uniqueTags
      } else {
        throw new Error('获取便签列表失败')
      }
    } catch (error) {
      console.error('获取标签失败:', error)
      // 如果主方法失败，尝试备用方法
      return await this.getTagsWithoutUserInfo(host, token)
    }
  },

  /**
   * 在没有用户信息时获取标签的备用方法 - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @returns {Promise<Array>}
   */
  async getTagsWithoutUserInfo(host, token) {
    try {
      // v0.25版本尝试使用新的便签端点
      const endpoints = [
        `${host}/api/v1/memos?page_size=100&order_by=create_time desc`,
        `${host}/api/v1/users/-/memos?page_size=100`
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            
            // 从便签中提取所有标签并去重
            const allTags = (data.memos || []).reduce((tags, memo) => {
              if (memo.tags && Array.isArray(memo.tags)) {
                return [...tags, ...memo.tags]
              }
              return tags
            }, []);
            
            const uniqueTags = [...new Set(allTags)];
            return uniqueTags;
          }
        } catch (error) {
          console.log(`端点 ${endpoint} 失败:`, error.message);
          continue;
        }
      }

      // 如果所有端点都失败，返回空数组
      return [];
    } catch (error) {
      console.error('备用标签获取方法失败:', error);
      return [];
    }
  },

  /**
   * 清除标签缓存
   */
  clearTagCache() {
    localStorage.removeItem('memos-tags')
  },

  /**
   * 上传附件 (兼容旧接口名称)
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {File} file - 要上传的文件
   * @param {string} memoName - 关联的便签名称 (可选)
   * @returns {Promise<Object>}
   */
  async uploadResource(host, token, file, memoName = null) {
    return await this.createAttachment(host, token, file, memoName)
  },

  /**
   * 测试连接 - v0.25版本使用认证会话端点
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @returns {Promise<Object>}
   */
  async testConnection(host, token) {
    // v0.25版本优先使用认证会话端点
    const endpoints = [
      { url: `${host}/api/v1/auth/sessions/current`, method: 'GET' },
      { url: `${host}/api/v1/users/-`, method: 'GET' },
      { url: `${host}/api/v1/me`, method: 'GET' },
      { url: `${host}/api/v1/user/me`, method: 'GET' }
    ];

    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // 检查返回数据是否包含用户信息
          if (data.user) {
            // 认证会话响应格式
            return { 
              ok: true, 
              data: {
                name: data.user.name || data.user.username || `user_${data.user.id}`,
                username: data.user.username,
                email: data.user.email,
                role: data.user.role || 'USER',
                state: data.user.state || 'NORMAL',
                id: data.user.id,
                lastAccessedAt: data.last_accessed_at,
                endpoint: endpoint.url
              }
            };
          } else if (data.name || data.username || data.id) {
            // 用户信息直接响应格式
            return { 
              ok: true, 
              data: {
                name: data.name || data.username || `user_${data.id}`,
                username: data.username,
                email: data.email,
                role: data.role || 'USER',
                state: data.state || 'NORMAL',
                id: data.id,
                endpoint: endpoint.url
              }
            };
          }
        }
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    
    throw new Error(`所有认证端点都失败。最后错误: ${lastError?.message || '未知错误'}`);
  },

  /**
   * 创建认证会话 (登录) - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<Object>}
   */
  async createSession(host, username, password) {
    const response = await fetch(`${host}/api/v1/auth/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password_credentials: {
          username,
          password
        }
      })
    });

    if (!response.ok) {
      throw new Error('登录失败')
    }

    return response.json()
  },

  /**
   * 删除当前会话 (登出) - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @returns {Promise<void>}
   */
  async deleteSession(host, token) {
    const response = await fetch(`${host}/api/v1/auth/sessions/current`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('登出失败')
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
   * 获取备忘录列表 - 改进的查询和过滤
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {Object} options - 查询选项
   * @param {number} options.offset - 偏移量
   * @param {number} options.limit - 每页数量
   * @param {string} options.content - 搜索内容
   * @param {string} options.visibility - 可见性过滤
   * @param {string} options.tag - 标签过滤
   * @returns {Promise<Response>}
   */
  async getMemos(host, token, { offset = null, limit = 10, content, visibility, tag } = {}) {
    // v0.25版本使用统一的 /api/v1/memos 端点
    const url = new URL(`${host}/api/v1/memos`)
    
    // 构建过滤条件 - v0.25版本支持CEL表达式
    let filter = '';
    if (content) {
      const trimmedContent = content.trim();
      if (trimmedContent) {
        filter = `content.contains("${trimmedContent}")`;
      }
    }  
    
    // v0.25版本使用 page_token 和 page_size
    if (offset) {
      url.searchParams.append('page_token', offset)
    }
    
    url.searchParams.append('page_size', limit)
    
    if (filter) {
      url.searchParams.append('filter', filter)
    }
    
    // v0.25版本的可见性过滤
    if (visibility && visibility !== 'all') {
      if (filter) {
        filter += ` && visibility == '${visibility.toUpperCase()}'`
      } else {
        filter = `visibility == '${visibility.toUpperCase()}'`
      }
      url.searchParams.set('filter', filter)
    }
    
    // v0.25版本的标签过滤 - 暂时禁用服务端过滤，改为客户端过滤
    // TODO: 修复CEL标签过滤语法问题
    if (tag) {
      console.log('标签过滤将在客户端进行:', tag)
      // 暂时不添加标签过滤到服务端请求中
      // 标签过滤将在客户端的 MemosList.vue 中处理
    }

    // 添加默认排序
    url.searchParams.append('order_by', 'pinned desc, display_time desc')
    url.searchParams.append('state', 'NORMAL')

    return await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },

  /**
   * 获取用户列表 - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {Object} options - 查询选项
   * @param {number} options.pageSize - 每页数量
   * @param {string} options.pageToken - 分页令牌
   * @param {string} options.filter - 过滤条件
   * @param {boolean} options.showDeleted - 是否显示已删除用户
   * @returns {Promise<Object>}
   */
  async listUsers(host, token, options = {}) {
    const { pageSize = 50, pageToken, filter, showDeleted = false } = options

    const url = new URL(`${host}/api/v1/users`)
    url.searchParams.append('page_size', pageSize)
    
    if (pageToken) url.searchParams.append('page_token', pageToken)
    if (filter) url.searchParams.append('filter', filter)
    if (showDeleted) url.searchParams.append('show_deleted', showDeleted)

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取用户列表失败')
    }

    return response.json()
  },

  /**
   * 获取用户信息 - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} userIdOrUsername - 用户ID或用户名
   * @returns {Promise<Object>}
   */
  async getUser(host, token, userIdOrUsername) {
    const response = await fetch(`${host}/api/v1/users/${userIdOrUsername}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取用户信息失败')
    }

    return response.json()
  },

  /**
   * 获取用户设置列表 - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} userName - 用户名称 (格式: users/{user_id})
   * @returns {Promise<Object>}
   */
  async listUserSettings(host, token, userName) {
    const response = await fetch(`${host}/api/v1/${userName}/settings`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取用户设置列表失败')
    }

    return response.json()
  },

  /**
   * 获取用户特定设置 - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} userName - 用户名称 (格式: users/{user_id})
   * @param {string} settingKey - 设置键 (GENERAL/SESSIONS/ACCESS_TOKENS/WEBHOOKS)
   * @returns {Promise<Object>}
   */
  async getUserSetting(host, token, userName, settingKey) {
    const response = await fetch(`${host}/api/v1/${userName}/settings/${settingKey}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取用户设置失败')
    }

    return response.json()
  },

  /**
   * 更新用户设置 - v0.25版本支持字段掩码
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} userName - 用户名称 (格式: users/{user_id})
   * @param {string} settingKey - 设置键
   * @param {Object} setting - 设置对象
   * @param {Array<string>} updateMask - 要更新的字段列表
   * @returns {Promise<Object>}
   */
  async updateUserSetting(host, token, userName, settingKey, setting, updateMask = []) {
    const requestBody = {
      setting: {
        name: `${userName}/settings/${settingKey}`,
        ...setting
      }
    }

    if (updateMask.length > 0) {
      requestBody.update_mask = {
        paths: updateMask
      }
    }

    const response = await fetch(`${host}/api/v1/${userName}/settings/${settingKey}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error('更新用户设置失败')
    }

    return response.json()
  },

  /**
   * 获取工作空间概况 - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @returns {Promise<Object>}
   */
  async getWorkspaceProfile(host, token) {
    const response = await fetch(`${host}/api/v1/workspace/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取工作空间概况失败')
    }

    return response.json()
  },

  /**
   * 获取工作空间设置 - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} settingKey - 设置键 (GENERAL/STORAGE/MEMO_RELATED)
   * @returns {Promise<Object>}
   */
  async getWorkspaceSetting(host, token, settingKey) {
    const response = await fetch(`${host}/api/v1/workspace/settings/${settingKey}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取工作空间设置失败')
    }

    return response.json()
  },

  /**
   * 更新工作空间设置 - v0.25版本
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} settingKey - 设置键
   * @param {Object} setting - 设置对象
   * @param {Array<string>} updateMask - 要更新的字段列表
   * @returns {Promise<Object>}
   */
  async updateWorkspaceSetting(host, token, settingKey, setting, updateMask = []) {
    const requestBody = {
      setting: {
        name: `workspace/settings/${settingKey}`,
        ...setting
      }
    }

    if (updateMask.length > 0) {
      requestBody.update_mask = {
        paths: updateMask
      }
    }

    const response = await fetch(`${host}/api/v1/workspace/settings/${settingKey}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error('更新工作空间设置失败')
    }

    return response.json()
  }
}
