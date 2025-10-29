import { v18Api } from './v18'
import { v24Api } from './v24'
import { v25Api } from './v25'

/**
 * API 服务工厂
 * @param {string} version - API 版本 ('v18', 'v24' 或 'v25')
 * @returns {Object} API 服务实例
 */
export const createApiService = (version) => {
  const apiMap = {
    v18: v18Api,
    v24: v24Api,
    v25: v25Api
  }

  if (!apiMap[version]) {
    throw new Error(`不支持的 API 版本: ${version}`)
  }

  return apiMap[version]
}

/**
 * 获取所有支持的 API 版本
 * @returns {Array<string>} 支持的版本列表
 */
export const getSupportedVersions = () => {
  return Object.keys({
    v18: '0.18',
    v24: '0.24',
    v25: '0.25'
  })
}

/**
 * 获取版本对应的显示名称
 * @param {string} version - API 版本
 * @returns {string} 显示名称
 */
export const getVersionDisplayName = (version) => {
  const versionMap = {
    v18: '0.18',
    v24: '0.24',
    v25: '0.25'
  }
  return versionMap[version] || version
}
 