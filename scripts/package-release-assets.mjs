import fs from 'fs'
import path from 'path'
import process from 'process'
import { execFileSync } from 'child_process'

const rootDir = process.cwd()
const distDir = path.join(rootDir, 'dist')
const outputDir = path.join(rootDir, 'release-assets')
const packageJsonPath = path.join(rootDir, 'package.json')
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const targetNames = ['chrome', 'firefox', 'safari', 'web']

function getArgValue(flagName) {
  const flagIndex = process.argv.indexOf(flagName)
  if (flagIndex === -1) {
    return ''
  }

  return process.argv[flagIndex + 1] || ''
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function removeDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true })
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function normalizeVersion(versionValue) {
  return versionValue.startsWith('v') ? versionValue.slice(1) : versionValue
}

function zipDirectory(sourceDir, targetFile) {
  execFileSync('zip', ['-qr', targetFile, '.'], {
    cwd: sourceDir,
    stdio: 'inherit'
  })
}

function main() {
  const rawVersion = getArgValue('--version') || pkg.version
  const normalizedVersion = normalizeVersion(rawVersion)
  const versionLabel = `v${normalizedVersion}`

  assert(pkg.version === normalizedVersion, `版本不一致：package.json=${pkg.version}，传入版本=${rawVersion}`)
  assert(fs.existsSync(distDir), '缺少 dist 目录，请先执行 npm run build')

  removeDir(outputDir)
  ensureDir(outputDir)

  for (const targetName of targetNames) {
    const sourceDir = path.join(distDir, targetName)
    const archiveName = `memos-${targetName}-${versionLabel}.zip`
    const archivePath = path.join(outputDir, archiveName)

    assert(fs.existsSync(sourceDir), `缺少构建产物目录：dist/${targetName}`)
    zipDirectory(sourceDir, archivePath)
    console.log(`已生成发布包：${path.relative(rootDir, archivePath)}`)
  }
}

try {
  main()
} catch (error) {
  console.error(`发布包生成失败：${error.message}`)
  process.exit(1)
}
