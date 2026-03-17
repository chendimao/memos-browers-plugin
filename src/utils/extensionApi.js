const extensionApi = globalThis.browser || globalThis.chrome || null
const isBrowserNamespace = typeof globalThis.browser !== 'undefined'
const hasStorageApi = Boolean(extensionApi?.storage?.local)

const getLastError = () => {
  if (isBrowserNamespace || !extensionApi) {
    return null
  }

  return extensionApi.runtime?.lastError || null
}

const callApi = (method, ...args) => {
  if (!method) {
    return Promise.reject(new Error('扩展 API 不可用'))
  }

  if (isBrowserNamespace) {
    return method(...args)
  }

  if (method.length <= args.length) {
    const result = method(...args)
    if (result && typeof result.then === 'function') {
      return result
    }

    return Promise.resolve(result)
  }

  return new Promise((resolve, reject) => {
    method(...args, (result) => {
      const lastError = getLastError()
      if (lastError) {
        reject(new Error(lastError.message))
        return
      }

      resolve(result)
    })
  })
}

const getStorageArea = () => {
  return extensionApi?.storage?.local || null
}

export {
  extensionApi,
  callApi,
  hasStorageApi
}

export const hasExtensionMethod = (method) => {
  return typeof method === 'function'
}

export const storageLocalGet = (keys) => {
  const storageArea = getStorageArea()
  return callApi(storageArea?.get?.bind(storageArea), keys)
}

export const storageLocalSet = (items) => {
  const storageArea = getStorageArea()
  return callApi(storageArea?.set?.bind(storageArea), items)
}

export const storageLocalRemove = (keys) => {
  const storageArea = getStorageArea()
  return callApi(storageArea?.remove?.bind(storageArea), keys)
}
