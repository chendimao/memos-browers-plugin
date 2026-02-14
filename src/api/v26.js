export const v26Api = {
  async testConnection(host, token) {
    const cleanHost = host.replace(/\/+$/, '')

    try {
      const resMe = await fetch(`${cleanHost}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (resMe.ok) {
        const data = await resMe.json()
        return { ok: true, data: { name: data.displayName || data.username } }
      }

      const resMemos = await fetch(`${cleanHost}/api/v1/memos?pageSize=1`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (resMemos.ok) {
        return { ok: true, data: { name: '已连接到 Memos' } }
      }
    } catch (err) {
      console.error('Test connection error:', err)
    }

    throw new Error('认证失败：请检查 Token 或 API 基础路径')
  },

  async createMemo(host, token, content, visibility = 'PRIVATE', tags = [], pinned = false) {
    const cleanHost = host.replace(/\/+$/, '')

    const response = await fetch(`${cleanHost}/api/v1/memos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        content,
        visibility: visibility.toUpperCase(),
        tags,
        pinned
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `发送失败 (${response.status})`)
    }

    return response
  },

  async updateMemo(host, token, memoName, memo, updateMask = []) {
    const cleanHost = host.replace(/\/+$/, '')
    const requestBody = {
      name: memoName,
      ...memo
    }

    if (updateMask.length > 0) {
      requestBody.update_mask = {
        paths: updateMask
      }
    }

    const response = await fetch(`${cleanHost}/api/v1/${memoName}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `更新失败 (${response.status})`)
    }

    return response
  },

  async deleteMemo(host, token, memoName) {
    const cleanHost = host.replace(/\/+$/, '')
    const response = await fetch(`${cleanHost}/api/v1/${memoName}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `删除失败 (${response.status})`)
    }
  },

  async listMemoAttachments(host, token, memoName) {
    const cleanHost = host.replace(/\/+$/, '')
    const response = await fetch(`${cleanHost}/api/v1/${memoName}/attachments`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取附件列表失败')
    }

    return response.json()
  },

  async getMemos(host, token, { offset = null, limit = 10, content, visibility, tag } = {}) {
    const cleanHost = host.replace(/\/+$/, '')
    const url = new URL(`${cleanHost}/api/v1/memos`)

    let filter = ''
    if (content) {
      const trimmedContent = content.trim()
      if (trimmedContent) {
        filter = `content.contains("${trimmedContent}")`
      }
    }

    if (visibility && visibility !== 'all') {
      const visibilityFilter = `visibility == '${visibility.toUpperCase()}'`
      filter = filter ? `${filter} && ${visibilityFilter}` : visibilityFilter
    }

    // 与现有调用约定对齐，同时兼容常见查询参数命名
    if (offset) {
      url.searchParams.append('pageToken', offset)
      url.searchParams.append('page_token', offset)
    }

    url.searchParams.append('pageSize', limit)
    url.searchParams.append('page_size', limit)

    if (filter) {
      url.searchParams.append('filter', filter)
    }

    // v26 标签过滤优先沿用客户端过滤策略，避免 CEL 语法兼容性问题
    if (tag) {
      console.log('v26 标签过滤将在客户端处理:', tag)
    }

    url.searchParams.append('orderBy', 'pinned desc, display_time desc')
    url.searchParams.append('order_by', 'pinned desc, display_time desc')
    url.searchParams.append('state', 'NORMAL')

    return await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },

  async getTags(host, token) {
    try {
      const response = await this.getMemos(host, token, { limit: 50 })
      if (response.ok) {
        const data = await response.json()
        const memos = Array.isArray(data) ? data : (data.memos || [])
        const tagSet = new Set()

        memos.forEach(memo => {
          if (memo.tags && Array.isArray(memo.tags)) {
            memo.tags.forEach(tag => tagSet.add(tag))
          }
        })

        return Array.from(tagSet)
      }
    } catch (e) {
      console.error('Tags fetch error:', e)
    }

    return []
  },

  async createAttachment(host, token, file, memoName = null) {
    const cleanHost = host.replace(/\/+$/, '')

    const base64Content = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const requestBody = {
      filename: file.name,
      content: base64Content,
      type: file.type
    }

    if (memoName && memoName.startsWith('memos/')) {
      requestBody.memo = memoName
    }

    const response = await fetch(`${cleanHost}/api/v1/attachments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`附件上传失败: ${errorData.message || response.statusText}`)
    }

    const data = await response.json()
    const attachmentId = data.name ? data.name.split('/').pop() : ''
    const filename = data.filename || file.name
    const fileUrl = data.externalLink || data.external_link || `${cleanHost}/file/attachments/${attachmentId}/${filename}`

    return {
      id: data.name || attachmentId,
      url: fileUrl,
      name: file.name,
      type: file.type,
      originalData: data
    }
  },

  async uploadResource(host, token, file, memoName = null) {
    return await this.createAttachment(host, token, file, memoName)
  }
}
