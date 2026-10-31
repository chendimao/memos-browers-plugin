/**
 * Memos v0.30 API 服务
 *
 * 基于 Protocol Buffers (gRPC-Gateway) 的 RESTful API 接口。
 *
 * 与 v0.26 的差异（依据 Memos 0.30.0 源码 proto/api/v1/*.proto 与实例实测）：
 *
 * 1. 当前用户：`GET /api/v1/users/me` 已不存在（返回 404 "user not found"），
 *    改用 `GET /api/v1/auth/me`，响应体为 `{ user: {...} }`。
 *    账号体系改为 JWT + 个人访问令牌（`/api/v1/users/{user}/personalAccessTokens`）。
 *
 * 2. 列表排序：`Memo.display_time` 已被移除（proto 中 `reserved 6, "display_time"`），
 *    `order_by` 仅支持 `pinned / create_time / update_time / name`。
 *    传 `display_time` 会直接 400：
 *    `invalid order_by: unsupported order field: display_time`。
 *
 * 3. 更新便签：`PATCH /api/v1/{memo.name=memos/*}` 的 `body` 绑定的是 `Memo` 本身，
 *    因此 `update_mask` **不能**放在请求体里（会报
 *    `could not find field "updateMask" in "memos.api.v1.Memo"`），
 *    必须通过查询参数传递；且服务端要求 update_mask 非空。
 *
 * 4. 创建便签：`Memo.tags` 为 OUTPUT_ONLY（由正文中的 `#标签` 派生，传入会被忽略），
 *    `Memo.pinned` 在 CreateMemo 中不被读取（源码只取 content/visibility/时间/位置/附件/关联）。
 *    → 自定义标签需写入正文；置顶需创建后再 PATCH（update_mask=pinned）。
 *
 * 5. 附件：`POST /api/v1/attachments` 的 `memo` 字段可直接绑定所属便签（无需再调
 *    SetMemoAttachments），响应中 `size` 为字符串（proto3 int64 JSON 表示）。
 *
 * 6. 私有实例：未配置 `--instance-url` 时匿名访问受限（本项目统一使用令牌，不受影响）。
 */

/**
 * 去掉 host 末尾的斜杠
 * @param {string} host
 * @returns {string}
 */
const cleanHost = (host) => (host || '').replace(/\/+$/, '')

/**
 * 构造请求头
 * @param {string} token
 * @param {boolean} [json]
 * @returns {Object}
 */
const buildHeaders = (token, json = false) => {
  const headers = { Authorization: `Bearer ${token}` }
  if (json) {
    headers['Content-Type'] = 'application/json'
  }
  return headers
}

/**
 * 规范化便签资源名，保证带 `memos/` 前缀
 * @param {string} memoName
 * @returns {string}
 */
const normalizeMemoName = (memoName) => {
  if (!memoName) return ''
  const name = String(memoName).replace(/^\/+/, '')
  return name.startsWith('memos/') ? name : `memos/${name}`
}

/** UpdateMemo 允许的字段掩码（其余字段服务端会忽略） */
const WRITABLE_MASK_PATHS = ['content', 'visibility', 'pinned', 'state', 'create_time', 'update_time', 'location']

/**
 * 根据请求体推断 update_mask（仅保留服务端可写字段）
 * @param {Object} body
 * @returns {Array<string>}
 */
const inferUpdateMask = (body) => {
  const paths = []
  for (const key of WRITABLE_MASK_PATHS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      paths.push(key)
    }
  }
  return paths
}

/**
 * 0.30 的标签由正文派生，这里把列表中的标签补进正文，避免用户选择的自定义标签丢失
 * @param {string} content
 * @param {Array<string>} tags
 * @returns {string}
 */
const appendTagsToContent = (content, tags) => {
  const list = (tags || [])
    .map((tag) => String(tag == null ? '' : tag).trim())
    .filter((tag) => tag.length > 0)
  if (list.length === 0) {
    return content
  }

  const existing = new Set((content.match(/#[^\s#]+/g) || []).map((tag) => tag.slice(1)))
  const missing = list.filter((tag) => !existing.has(tag))
  if (missing.length === 0) {
    return content
  }

  let text = content
  if (!text.endsWith('\n')) {
    text += '\n'
  }
  return text + missing.map((tag) => `#${tag}`).join('\n') + '\n'
}

export const v30Api = {
  /**
   * 测试连接 - v0.30 使用 /api/v1/auth/me 获取当前用户
   * @param {string} host
   * @param {string} token
   * @returns {Promise<{ok: boolean, data: Object}>}
   */
  async testConnection(host, token) {
    const base = cleanHost(host)

    try {
      const resMe = await fetch(`${base}/api/v1/auth/me`, {
        headers: buildHeaders(token)
      })
      if (resMe.ok) {
        const data = await resMe.json()
        const user = data.user || {}
        return { ok: true, data: { name: user.displayName || user.username || '已连接到 Memos' } }
      }

      const resMemos = await fetch(`${base}/api/v1/memos?pageSize=1`, {
        headers: buildHeaders(token)
      })
      if (resMemos.ok) {
        return { ok: true, data: { name: '已连接到 Memos' } }
      }
    } catch (err) {
      console.error('Test connection error:', err)
    }

    throw new Error('认证失败：请检查 Token 或 API 基础路径（Memos 0.30 需要个人访问令牌）')
  },

  /**
   * 创建便签
   *
   * 注意：0.30 的 `tags` 为只读字段，这里把标签写入正文；
   * `pinned` 不在创建接口中生效，创建成功后再单独更新。
   *
   * @param {string} host
   * @param {string} token
   * @param {string} content
   * @param {string} visibility - PRIVATE / PROTECTED / PUBLIC
   * @param {Array<string>} tags
   * @param {boolean} pinned
   * @returns {Promise<Response>}
   */
  async createMemo(host, token, content, visibility = 'PRIVATE', tags = [], pinned = false) {
    const base = cleanHost(host)

    const response = await fetch(`${base}/api/v1/memos`, {
      method: 'POST',
      headers: buildHeaders(token, true),
      body: JSON.stringify({
        content: appendTagsToContent(content, tags),
        visibility: String(visibility || 'PRIVATE').toUpperCase()
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `发送失败 (${response.status})`)
    }

    // 置顶需在创建后单独更新（CreateMemo 会忽略 pinned）
    if (pinned) {
      try {
        const created = await response.clone().json()
        if (created && created.name) {
          await this.updateMemo(base, token, created.name, { pinned: true }, ['pinned'])
        }
      } catch (error) {
        console.warn('v30 置顶失败（便签已创建）:', error)
      }
    }

    return response
  },

  /**
   * 获取便签列表 - v0.30 排序字段移除 display_time
   * @param {string} host
   * @param {string} token
   * @param {Object} options
   * @returns {Promise<Response>}
   */
  async getMemos(host, token, { offset = null, limit = 10, content, visibility, tag } = {}) {
    const base = cleanHost(host)
    const url = new URL(`${base}/api/v1/memos`)

    let filter = ''
    if (content) {
      const trimmedContent = content.trim()
      if (trimmedContent) {
        // 转义双引号防止 CEL 注入
        const escapedContent = trimmedContent.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
        filter = `content.contains("${escapedContent}")`
      }
    }

    if (visibility && visibility !== 'all') {
      const visibilityFilter = `visibility == '${String(visibility).toUpperCase()}'`
      filter = filter ? `${filter} && ${visibilityFilter}` : visibilityFilter
    }

    if (offset) {
      url.searchParams.append('pageToken', offset)
    }

    url.searchParams.append('pageSize', limit)

    if (filter) {
      url.searchParams.append('filter', filter)
    }

    // v30 标签过滤沿用客户端过滤策略，避免分页与 CEL 语法差异带来的兼容性问题
    if (tag) {
      console.log('v30 标签过滤将在客户端处理:', tag)
    }

    url.searchParams.append('orderBy', 'pinned desc, create_time desc')
    url.searchParams.append('state', 'NORMAL')

    return await fetch(url.toString(), {
      headers: buildHeaders(token)
    })
  },

  /**
   * 获取单个便签
   * @param {string} host
   * @param {string} token
   * @param {string} memoName
   * @returns {Promise<Response>}
   */
  async getMemo(host, token, memoName) {
    const base = cleanHost(host)
    const name = normalizeMemoName(memoName)
    return await fetch(`${base}/api/v1/${name}`, {
      headers: buildHeaders(token)
    })
  },

  /**
   * 更新便签
   *
   * v0.30 的 `update_mask` 必须是查询参数（放在请求体会解析失败），
   * 且服务端要求非空，因此这里始终显式发送 mask。
   *
   * @param {string} host
   * @param {string} token
   * @param {string} memoName
   * @param {Object} memo - 需要更新的字段
   * @param {Array<string>} updateMask
   * @returns {Promise<Response>}
   */
  async updateMemo(host, token, memoName, memo = {}, updateMask = []) {
    const base = cleanHost(host)
    const name = normalizeMemoName(memoName)

    const requestBody = {
      name,
      ...memo
    }

    let paths = Array.isArray(updateMask) ? updateMask.filter(Boolean) : []
    if (paths.length === 0) {
      paths = inferUpdateMask(requestBody)
    }
    if (paths.length === 0) {
      throw new Error('更新失败：缺少需要更新的字段')
    }

    const query = new URLSearchParams()
    query.set('updateMask', paths.join(','))

    const response = await fetch(`${base}/api/v1/${name}?${query.toString()}`, {
      method: 'PATCH',
      headers: buildHeaders(token, true),
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `更新失败 (${response.status})`)
    }

    return response
  },

  /**
   * 删除便签
   * @param {string} host
   * @param {string} token
   * @param {string} memoName
   * @returns {Promise<Response>}
   */
  async deleteMemo(host, token, memoName) {
    const base = cleanHost(host)
    const name = normalizeMemoName(memoName)
    const response = await fetch(`${base}/api/v1/${name}`, {
      method: 'DELETE',
      headers: buildHeaders(token)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `删除失败 (${response.status})`)
    }

    return response
  },

  /**
   * 获取便签附件列表
   * @param {string} host
   * @param {string} token
   * @param {string} memoName
   * @returns {Promise<Object>} `{ attachments: [...] }`
   */
  async listMemoAttachments(host, token, memoName) {
    const base = cleanHost(host)
    const name = normalizeMemoName(memoName)
    const response = await fetch(`${base}/api/v1/${name}/attachments`, {
      headers: buildHeaders(token)
    })

    if (!response.ok) {
      throw new Error('获取附件列表失败')
    }

    return response.json()
  },

  /**
   * 获取标签列表（0.30 从便签正文派生的 tags 字段汇总）
   * @param {string} host
   * @param {string} token
   * @returns {Promise<Array<string>>}
   */
  async getTags(host, token) {
    try {
      const response = await this.getMemos(host, token, { limit: 50 })
      if (response.ok) {
        const data = await response.json()
        const memos = Array.isArray(data) ? data : (data.memos || [])
        const tagSet = new Set()

        memos.forEach((memo) => {
          if (memo.tags && Array.isArray(memo.tags)) {
            memo.tags.forEach((tag) => tagSet.add(tag))
          }
        })

        return Array.from(tagSet)
      }
    } catch (e) {
      console.error('Tags fetch error:', e)
    }

    return []
  },

  /**
   * 上传附件（可直接通过 `memo` 字段绑定到便签）
   * @param {string} host
   * @param {string} token
   * @param {File} file
   * @param {string|null} memoName
   * @returns {Promise<Object>} `{ id, url, name, type, originalData }`
   */
  async createAttachment(host, token, file, memoName = null) {
    const base = cleanHost(host)

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

    if (memoName) {
      requestBody.memo = normalizeMemoName(memoName)
    }

    const response = await fetch(`${base}/api/v1/attachments`, {
      method: 'POST',
      headers: buildHeaders(token, true),
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`附件上传失败: ${errorData.message || response.statusText}`)
    }

    const data = await response.json()
    const attachmentId = data.name ? data.name.split('/').pop() : ''
    const filename = data.filename || file.name
    const fileUrl = data.externalLink || data.external_link || `${base}/file/attachments/${attachmentId}/${filename}`

    return {
      id: data.name || attachmentId,
      url: fileUrl,
      name: file.name,
      type: file.type,
      originalData: data
    }
  },

  /**
   * 兼容旧调用名
   */
  async uploadResource(host, token, file, memoName = null) {
    return await this.createAttachment(host, token, file, memoName)
  }
}
