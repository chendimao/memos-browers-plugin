/**
 * Memos v2 (0.24.x) API 服务
 */
export const v2Api = {
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
  }
} 