import fs from 'fs'
import path from 'path'
import process from 'process'

const distRoot = path.resolve(process.cwd(), 'dist')
const targetNames = ['chrome', 'firefox', 'safari']
const requiredFiles = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  '_locales/en/messages.json',
  '_locales/zh_CN/messages.json',
  'assets/icons/icon16.png',
  'assets/icons/icon48.png',
  'assets/icons/icon128.png'
]
const requiredManifestKeys = [
  'manifest_version',
  'name',
  'version',
  'description',
  'default_locale',
  'permissions',
  'host_permissions',
  'action',
  'icons'
]

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function getTargetDir(targetName) {
  return path.join(distRoot, targetName)
}

function verifyTargetFiles(targetName) {
  const targetDir = getTargetDir(targetName)
  assert(fs.existsSync(targetDir), `缺少目录：dist/${targetName}`)

  requiredFiles.forEach((relativeFile) => {
    const fullPath = path.join(targetDir, relativeFile)
    assert(fs.existsSync(fullPath), `缺少文件：dist/${targetName}/${relativeFile}`)
  })
}

function verifyManifestCapabilities(manifests) {
  targetNames.forEach((targetName) => {
    const manifest = manifests[targetName]

    requiredManifestKeys.forEach((key) => {
      assert(key in manifest, `${targetName} manifest 缺少字段：${key}`)
    })
  })

  const chromeManifest = manifests.chrome
  const firefoxManifest = manifests.firefox
  const safariManifest = manifests.safari

  requiredManifestKeys.forEach((key) => {
    const chromeValue = JSON.stringify(chromeManifest[key])
    const firefoxValue = JSON.stringify(firefoxManifest[key])
    const safariValue = JSON.stringify(safariManifest[key])
    assert(
      chromeValue === firefoxValue,
      `manifest 关键字段不一致：${key}`
    )
    assert(
      chromeValue === safariValue,
      `safari manifest 关键字段不一致：${key}`
    )
  })

  assert(
    'service_worker' in (chromeManifest.background || {}),
    'chrome manifest 必须包含 background.service_worker'
  )
  assert(
    Array.isArray(firefoxManifest.background?.scripts),
    'firefox manifest 必须包含 background.scripts'
  )
  assert(
    typeof firefoxManifest.browser_specific_settings?.gecko?.id === 'string' &&
      firefoxManifest.browser_specific_settings.gecko.id.length > 0,
    'firefox manifest 必须包含 browser_specific_settings.gecko.id'
  )
  const requiredDataCollection = firefoxManifest.browser_specific_settings?.gecko?.data_collection_permissions?.required
  assert(
    Array.isArray(requiredDataCollection) && requiredDataCollection.length > 0,
    'firefox manifest 必须包含 browser_specific_settings.gecko.data_collection_permissions.required'
  )

  assert(
    'background' in safariManifest,
    'safari manifest 必须包含 background'
  )
  assert(
    'service_worker' in (safariManifest.background || {}),
    'safari manifest 必须包含 background.service_worker'
  )
}

try {
  targetNames.forEach(verifyTargetFiles)

  const manifests = Object.fromEntries(
    targetNames.map((targetName) => [
      targetName,
      readJson(path.join(getTargetDir(targetName), 'manifest.json'))
    ])
  )

  verifyManifestCapabilities(manifests)
  console.log('构建产物校验通过')
} catch (error) {
  console.error(`构建产物校验失败：${error.message}`)
  process.exit(1)
}
