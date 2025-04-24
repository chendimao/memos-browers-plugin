/**
 * Memos v1 (0.18.x) API 服务
 */
export const v1Api = {
  /**
   * 创建备忘录
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @param {string} content - 备忘录内容
   * @param {string} visibility - 可见性设置
   * @returns {Promise<Response>}
   */
  async createMemo(host, token, content, visibility) {
    return fetch(`${host}/api/v1/memo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content,
        visibility
      })
    })
  },

  /**
   * 测试连接
   * @param {string} host - Memos 主机地址
   * @param {string} token - 访问令牌
   * @returns {Promise<Response>}
   */
  async testConnection(host, token) {
    return fetch(`${host}/api/v1/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
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

    const response = await fetch(`${host}/api/v1/resource/blob`, {
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
      url: `${host}/o/r/${data.id}/${data.name}`,
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