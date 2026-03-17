const isBrowserNamespace = typeof globalThis.browser !== 'undefined'
const extensionApi = isBrowserNamespace ? globalThis.browser : globalThis.chrome

const getLastError = () => {
  if (isBrowserNamespace) {
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

export {
  extensionApi,
  callApi
}

export const storageLocalGet = (keys) => {
  return callApi(extensionApi.storage?.local?.get.bind(extensionApi.storage.local), keys)
}

export const storageLocalSet = (items) => {
  return callApi(extensionApi.storage?.local?.set.bind(extensionApi.storage.local), items)
}

export const storageLocalRemove = (keys) => {
  return callApi(extensionApi.storage?.local?.remove.bind(extensionApi.storage.local), keys)
}
