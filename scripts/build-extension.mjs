import fs from 'fs'
import path from 'path'
import process from 'process'
import { build as viteBuild } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const rootDir = process.cwd()
const distDir = path.join(rootDir, 'dist')
const buildRootDir = path.join(rootDir, '.build')
const targetArg = process.argv[2] || 'all'
const extensionTargets = ['chrome', 'firefox', 'safari']
const webTarget = 'web'
const targetNames = targetArg === 'all'
  ? [...extensionTargets, webTarget]
  : [targetArg]
const validTargets = new Set(['all', ...extensionTargets, webTarget])
const extensionStaticFiles = ['background.js', 'content.js']

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

async function buildAppAssets(targetName) {
  const isWebTarget = targetName === webTarget
  const htmlFile = isWebTarget ? 'index.html' : 'popup.html'
  const tempDir = path.join(buildRootDir, targetName)

  removeDir(tempDir)

  await viteBuild({
    configFile: false,
    plugins: [vue()],
    base: './',
    define: {
      __BUILD_TARGET__: JSON.stringify(targetName)
    },
    build: {
      outDir: tempDir,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          [isWebTarget ? 'index' : 'popup']: resolve(rootDir, htmlFile)
        },
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]'
        }
      }
    }
  })

  return tempDir
}

function copyExtensionAssets(sourceDir, targetDir) {
  copyDir(sourceDir, targetDir)

  extensionStaticFiles.forEach((fileName) => {
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

async function buildTarget(targetName) {
  const targetDir = path.join(distDir, targetName)
  const sourceDir = await buildAppAssets(targetName)

  removeDir(targetDir)

  if (targetName === webTarget) {
    copyDir(sourceDir, targetDir)
  } else {
    copyExtensionAssets(sourceDir, targetDir)
    writeManifest(targetName, targetDir)
  }

  console.log(`已生成 ${targetName} 构建产物：${path.relative(rootDir, targetDir)}`)
}

async function main() {
  ensureDir(distDir)

  for (const targetName of targetNames) {
    await buildTarget(targetName)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
