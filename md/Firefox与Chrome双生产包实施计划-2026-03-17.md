# Firefox 与 Chrome 双生产包实施计划

> 执行要求：实现阶段使用 `subagent-driven-development` 或 `executing-plans`，并在隔离 worktree 中完成。

## 功能目标

在不改变现有扩展功能的前提下，为项目增加双浏览器生产打包能力。执行 `npm run build` 后，需要同时产出 `dist/chrome` 与 `dist/firefox` 两个目录包，分别包含对应浏览器可安装使用的扩展文件，并确保 Chrome 与 Firefox 的功能保持完全一致。

## 技术方案 / 架构说明

本次改造采用“共享基础构建产物 + 浏览器差异化 manifest + 轻量扩展 API 适配层”的方案。Vite 仍负责构建 Vue 页面资源，随后由自定义构建脚本分别组装 Chrome 与 Firefox 的扩展目录。扩展运行时代码通过统一的浏览器 API 适配模块访问 `storage`、`runtime`、`tabs`、`action` 等接口，避免业务代码直接依赖单一浏览器命名空间。

## 分步骤任务列表

### 任务 1：梳理现有扩展入口与浏览器差异点

**涉及文件：**
- 读取：`package.json`
- 读取：`vite.config.js`
- 读取：`manifest.json`
- 读取：`background.js`
- 读取：`content.js`
- 读取：`src/App.vue`
- 读取：`src/views/setting.vue`

**步骤：**
1. 确认当前构建流程如何输出 `dist/`，以及哪些静态文件由 Vite 插件复制。
2. 检查 `manifest_version`、后台脚本、权限、图标与本地化配置是否存在 Firefox 兼容性差异。
3. 检查项目中所有 `chrome.*` API 调用位置，确认是否需要收口到统一适配层。
4. 记录需要保持完全一致的核心功能路径：右键菜单、选中文本注入、存储读写、弹窗打开、设置保存。

### 任务 2：先补构建级回归测试或校验脚本

**涉及文件：**
- 新增：`scripts/verify-build-output.mjs`
- 可能新增：`tests/build-output.test.mjs`（若项目更适合测试文件形式）

**步骤：**
1. 先编写一个失败的校验脚本或测试，断言构建完成后必须存在 `dist/chrome/manifest.json` 与 `dist/firefox/manifest.json`。
2. 断言两个目录都包含 `background.js`、`content.js`、`popup.html`、`_locales`、图标资源。
3. 断言两个 manifest 的关键能力一致，只允许浏览器兼容字段存在预期差异。
4. 先运行校验，确认在现状下失败，再开始修改构建逻辑。

### 任务 3：重组 manifest 配置并实现双目标构建脚本

**涉及文件：**
- 新增：`manifest/base.json`
- 新增：`manifest/chrome.json`
- 新增：`manifest/firefox.json`
- 新增：`scripts/build-extension.mjs`
- 修改：`package.json`
- 修改：`vite.config.js`
- 可能修改：`manifest.json`（若保留为兼容入口或移除其职责）

**步骤：**
1. 抽取现有 `manifest.json` 为基础配置，并建立 Chrome / Firefox 差异补丁文件。
2. 编写构建脚本：先调用 Vite 生成基础前端产物，再复制静态资源并分别组装到 `dist/chrome` 与 `dist/firefox`。
3. 在脚本中生成两个最终 manifest，确保共同字段来自同一份基础配置。
4. 更新 `package.json` 命令，提供 `build`、`build:chrome`、`build:firefox`。
5. 移除旧的单目录复制逻辑，避免继续写入平铺的 `dist/manifest.json`。

### 任务 4：新增浏览器 API 适配层并收口运行时代码

**涉及文件：**
- 新增：`src/utils/browser.js` 或 `src/utils/extensionApi.js`
- 修改：`background.js`
- 修改：`content.js`
- 修改：`src/App.vue`
- 修改：`src/views/setting.vue`

**步骤：**
1. 新建统一适配模块，优先暴露项目实际使用的 API：`runtime`、`storage`、`tabs`、`scripting`、`contextMenus`、`action`。
2. 对回调式与 Promise 式接口做统一封装，保证业务侧调用方式一致。
3. 将现有直接使用 `chrome.*` 的位置改为通过适配层访问。
4. 确认内容脚本消息监听仍兼容两个浏览器，不引入行为变化。

### 任务 5：执行构建验证与产物核对

**涉及文件：**
- 验证：`dist/chrome/**`
- 验证：`dist/firefox/**`

**步骤：**
1. 运行 `npm run build`，确认命令完成且生成两个目录。
2. 运行构建校验脚本，确认目录结构与 manifest 差异符合预期。
3. 抽查两个 manifest 的关键字段是否一致：名称、版本、权限、入口、图标、主机权限。
4. 记录仍需人工在浏览器中验证的功能流程：右键菜单、新建 memo、图片上传、标签选择、设置保存、API 版本切换。

## 涉及文件

- `package.json`
- `vite.config.js`
- `manifest.json` 或 `manifest/*.json`
- `scripts/build-extension.mjs`
- `scripts/verify-build-output.mjs`
- `background.js`
- `content.js`
- `src/App.vue`
- `src/views/setting.vue`
- `src/utils/browser.js` 或 `src/utils/extensionApi.js`

## 潜在风险

- Firefox 对 Manifest V3 支持细节可能与 Chrome 不完全一致，尤其是后台脚本声明与部分 API 行为。
- `chrome.scripting.executeScript`、`chrome.action.openPopup` 等接口在 Firefox 的行为可能存在限制，需要通过适配层与 manifest 字段共同验证。
- 现有构建流程直接复制到单一 `dist/` 目录，改造后若清理逻辑不完整，容易残留旧产物影响验证。
- 项目当前缺少完整自动化测试，只能通过构建校验脚本加人工验证降低回归风险。
