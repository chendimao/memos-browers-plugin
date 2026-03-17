const runtimeTarget = typeof __BUILD_TARGET__ === 'string'
  ? __BUILD_TARGET__
  : 'extension'

const isWebTarget = runtimeTarget === 'web'
const isExtensionTarget = !isWebTarget

export {
  runtimeTarget,
  isWebTarget,
  isExtensionTarget
}
