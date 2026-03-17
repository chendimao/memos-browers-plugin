import fs from 'fs'
import path from 'path'
import process from 'process'
import { build as viteBuild } from 'vite'

const rootDir = process.cwd()
const distDir = path.join(rootDir, 'dist')
const tempDir = path.join(rootDir, '.build', 'popup')
const targetArg = process.argv[2] || 'all'
const targetNames = targetArg === 'all' ? ['chrome', 'firefox', 'safari'] : [targetArg]
const validTargets = new Set(['all', 'chrome', 'firefox', 'safari'])
const staticFiles = ['background.js', 'content.js']

if (!validTargets.has(targetArg)) {
  console.error(`不支持的构建目标：${targetArg}`)
  process.exit(1)
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function removeDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true })
}

function copyFileToTarget(sourcePath, targetPath) {
  ensureDir(path.dirname(targetPath))
  fs.copyFileSync(sourcePath, targetPath)
}

function copyDir(sourceDir, targetDir) {
  ensureDir(targetDir)

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)

    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath)
    } else {
      copyFileToTarget(sourcePath, targetPath)
    }
  }
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), 'utf8'))
}

function mergeManifest(baseManifest, targetManifest) {
  return {
    ...baseManifest,
    ...targetManifest,
    action: {
      ...baseManifest.action,
      ...targetManifest.action
    },
    icons: {
      ...baseManifest.icons,
      ...targetManifest.icons
    },
    background: targetManifest.background || baseManifest.background
  }
}

async function buildPopupAssets() {
  removeDir(tempDir)

  await viteBuild({
    configFile: path.join(rootDir, 'vite.config.js'),
    build: {
      outDir: tempDir,
      emptyOutDir: true
    }
  })
}

function copySharedAssets(targetDir) {
  copyDir(tempDir, targetDir)

  staticFiles.forEach((fileName) => {
    copyFileToTarget(path.join(rootDir, fileName), path.join(targetDir, fileName))
  })

  const localesDir = path.join(rootDir, '_locales')
  if (fs.existsSync(localesDir)) {
    copyDir(localesDir, path.join(targetDir, '_locales'))
  }

  const iconsDir = path.join(rootDir, 'src', 'assets', 'icons')
  if (fs.existsSync(iconsDir)) {
    copyDir(iconsDir, path.join(targetDir, 'assets', 'icons'))
  }
}

function writeManifest(targetName, targetDir) {
  const baseManifest = readJson('manifest/base.json')
  const targetManifest = readJson(`manifest/${targetName}.json`)
  const finalManifest = mergeManifest(baseManifest, targetManifest)
  const manifestPath = path.join(targetDir, 'manifest.json')

  fs.writeFileSync(manifestPath, `${JSON.stringify(finalManifest, null, 2)}\n`, 'utf8')
}

async function main() {
  ensureDir(distDir)
  await buildPopupAssets()

  targetNames.forEach((targetName) => {
    const targetDir = path.join(distDir, targetName)
    removeDir(targetDir)
    copySharedAssets(targetDir)
    writeManifest(targetName, targetDir)
    console.log(`已生成 ${targetName} 扩展包：${path.relative(rootDir, targetDir)}`)
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
