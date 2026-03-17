import { isExtensionTarget } from './runtimeTarget'
import {
  hasStorageApi,
  storageLocalGet,
  storageLocalSet,
  storageLocalRemove
} from './extensionApi'

const normalizeKeys = (keys) => {
  if (Array.isArray(keys)) {
    return keys
  }

  if (typeof keys === 'string') {
    return [keys]
  }

  return []
}

const readLocalValue = (key) => {
  const rawValue = window.localStorage.getItem(key)
  if (rawValue == null) {
    return undefined
  }

  try {
    return JSON.parse(rawValue)
  } catch {
    return rawValue
  }
}

const writeLocalValue = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export const appStorageGet = async (keys) => {
  if (isExtensionTarget && hasStorageApi) {
    return storageLocalGet(keys)
  }

  return normalizeKeys(keys).reduce((result, key) => {
    result[key] = readLocalValue(key)
    return result
  }, {})
}

export const appStorageSet = async (items) => {
  if (isExtensionTarget && hasStorageApi) {
    return storageLocalSet(items)
  }

  Object.entries(items).forEach(([key, value]) => {
    writeLocalValue(key, value)
  })
}

export const appStorageRemove = async (keys) => {
  if (isExtensionTarget && hasStorageApi) {
    return storageLocalRemove(keys)
  }

  normalizeKeys(keys).forEach((key) => {
    window.localStorage.removeItem(key)
  })
}
