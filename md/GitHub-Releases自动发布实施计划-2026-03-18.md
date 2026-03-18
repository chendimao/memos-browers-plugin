# GitHub Releases 自动发布实施计划-2026-03-18

> **执行要求：** 实施阶段必须使用 `executing-plans` 按任务逐步落地。

## 功能目标

为当前仓库新增一套可自动发布到 GitHub Releases 的流程：平时提交时执行基础构建校验；当推送版本标签时，自动构建 Chrome / Firefox / Safari / Web 四类产物、压缩为发布包，并自动创建或更新 GitHub Release 上传资产。

## 技术方案 / 架构说明

本次采用 GitHub Actions 作为自动化入口，拆分为两个工作流：一个用于日常 CI 构建校验，另一个用于标签发布。发布工作流在 `push` 到版本 tag 时运行，复用现有 `npm run build` 输出的 `dist/chrome`、`dist/firefox`、`dist/safari`、`dist/web` 目录，再通过脚本统一压缩产物，最后由 GitHub Actions 官方 release action 创建 Release 并上传资产。

为避免构建逻辑散落在 YAML 中，本次会新增一个本地可复用的发布打包脚本，统一负责把四类产物压缩为 zip。这样后续本地手工发版、CI 校验、Release 发布都可以共用同一套打包规则。

## 分步骤任务列表

### 任务 1：梳理当前构建与版本信息

**涉及文件：**
- 检查：`package.json`
- 检查：`scripts/build-extension.mjs`
- 检查：`scripts/verify-build-output.mjs`
- 检查：仓库现有 `.github/` 目录（如存在）

**步骤：**
1. 确认当前构建命令、可复用脚本和产物目录结构。
2. 检查仓库是否已有 GitHub Actions 工作流，避免覆盖或冲突。
3. 明确发布命名规则，确定 zip 文件名与 tag / package version 的映射方式。

### 任务 2：新增发布产物打包脚本

**涉及文件：**
- 新增：`scripts/package-release-assets.mjs`
- 可能修改：`package.json`

**步骤：**
1. 新增脚本，读取版本号与目标目录。
2. 将 `dist/chrome`、`dist/firefox`、`dist/safari`、`dist/web` 分别压缩为 zip。
3. 统一输出到例如 `release-assets/` 一类目录。
4. 在 `package.json` 中新增可复用命令，如 `build:release-assets`。

### 任务 3：新增日常 CI 工作流

**涉及文件：**
- 新增：`.github/workflows/ci.yml`

**步骤：**
1. 配置在 `push` 和 `pull_request` 时运行。
2. 执行 checkout、Node 安装、依赖安装。
3. 运行 `npm run build` 与 `npm run verify:build`。
4. 保持工作流只做校验，不创建 Release。

### 任务 4：新增 GitHub Releases 自动发布工作流

**涉及文件：**
- 新增：`.github/workflows/release.yml`

**步骤：**
1. 配置在推送版本 tag（如 `v*`）时运行。
2. 声明 `contents: write` 权限，以允许创建 Release 和上传资产。
3. 执行依赖安装、构建、产物校验、发布资产压缩。
4. 按 tag 生成 Release 标题与资产名。
5. 自动创建或更新 Release，并上传四个 zip 资产。

### 任务 5：补充发布说明文档

**涉及文件：**
- 修改：`README.md`
- 修改：`README.en.md`
- 可选新增：`md/GitHub-Releases自动发布说明-2026-03-18.md`

**步骤：**
1. 说明日常 CI 与正式 Release 的区别。
2. 说明发版方式：更新版本、打 tag、推送 tag。
3. 说明 Release 资产包含 Chrome / Firefox / Safari / Web 四类包。

### 任务 6：最终验证与提交

**涉及文件：**
- 验证：`.github/workflows/ci.yml`
- 验证：`.github/workflows/release.yml`
- 验证：`scripts/package-release-assets.mjs`
- 验证：`package.json`

**步骤：**
1. 本地运行 `npm run build` 与 `npm run verify:build`。
2. 本地运行发布资产打包命令，确认能生成四个 zip。
3. 检查 YAML 语法与引用 action 是否正确。
4. 检查 `git status --short`，确认只有计划内变更。
5. 提交改动，提交信息使用中文。

## 涉及文件

- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `scripts/package-release-assets.mjs`
- `package.json`
- `README.md`
- `README.en.md`
- `md/GitHub-Releases自动发布实施计划-2026-03-18.md`
- `md/GitHub-Releases自动发布说明-2026-03-18.md`

## 潜在风险

- GitHub Release 权限不足会导致工作流创建 Release 失败，需要显式声明 `contents: write`。
- 如果 tag 命名与 `package.json` 版本不一致，可能导致资产命名混乱，需要统一策略。
- Safari 与 Web 产物都是目录型输出，压缩时若根目录层级处理不一致，会影响下载后的使用体验。
- 现有仓库本地有未提交 README 改动，必须在 worktree 中实现，避免污染用户当前工作区。
