import { v18Api } from './v18'
import { v24Api } from './v24'
import { v25Api } from './v25'
import { v26Api } from './v26'
import { v30Api } from './v30'

/**
 * 新一代 API 版本（0.24+）：列表响应为 `{ memos, nextPageToken }` 信封，
 * 便签标识使用 `memos/{uid}` 资源名，标签为字符串数组。
 */
const ENVELOPE_API_VERSIONS = ['v24', 'v25', 'v26', 'v30']

/**
 * 附件先暂存本地、创建便签后再通过附件接口绑定（不使用 resourceIdList）
 */
const STAGED_ATTACHMENT_VERSIONS = ['v26', 'v30']

/**
 * 列表/附件流程与 0.25 同构的版本（返回 `{ memos, nextPageToken }` 信封）
 */
const MODERN_LIST_VERSIONS = ['v25', 'v26', 'v30']

/**
 * 判断是否为「0.25 同构」的列表接口（v25 / v26 / v30）
 * @param {string} version
 * @returns {boolean}
 */
export const isModernListApi = (version) => MODERN_LIST_VERSIONS.includes(version)

/**
 * 判断更新便签时是否仍走旧的 resourceIdList 字段（v18 / v24）
 * @param {string} version
 * @returns {boolean}
 */
export const usesLegacyResourceIdList = (version) => !isModernListApi(version)

/**
 * 判断是否为列表信封（`{ memos, nextPageToken }`）返回格式
 * @param {string} version
 * @returns {boolean}
 */
export const usesMemosEnvelope = (version) => ENVELOPE_API_VERSIONS.includes(version)

/**
 * 判断是否使用「暂存文件 + 附件接口」的上传流程
 * @param {string} version
 * @returns {boolean}
 */
export const usesStagedAttachmentUpload = (version) => STAGED_ATTACHMENT_VERSIONS.includes(version)

/**
 * API 服务工厂
 * @param {string} version - API 版本 ('v18', 'v24', 'v25', 'v26' 或 'v30')
 * @returns {Object} API 服务实例
 */
export const createApiService = (version) => {
  const apiMap = {
    v18: v18Api,
    v24: v24Api,
    v25: v25Api,
    v26: v26Api,
    v30: v30Api
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
    v25: '0.25',
    v26: '0.26',
    v30: '0.30'
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
    v25: '0.25',
    v26: '0.26',
    v30: '0.30'
  }
  return versionMap[version] || version
}
