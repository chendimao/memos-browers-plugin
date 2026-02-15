# Repository Guidelines

## 项目结构与模块组织
本项目是基于 Vite + Vue 3 的浏览器扩展（Memos Quick Note）。
- `src/`：主业务代码入口。
- `src/views/`：页面级视图（如 `MemosList.vue`、`setting.vue`）。
- `src/components/`：可复用组件。
- `src/api/`：按 Memos 版本拆分的 API 适配（`v18.js`、`v24.js`、`v25.js`、`v26.js`）。
- `src/i18n/` 与 `_locales/`：国际化文案。
- 根目录扩展文件：`manifest.json`、`background.js`、`content.js`、`popup.html`。
- `dist/`：构建产物，用于浏览器“加载已解压的扩展程序”。

## 构建、测试与开发命令
- `npm install`：安装依赖。
- `npm run dev`：启动 Vite 开发服务（用于界面调试）。
- `npm run build`：打包生产构建到 `dist/`。
- `npm run serve`：本地预览构建结果。

推荐流程：
```bash
npm install
npm run build
```
然后在 Edge/Chrome 扩展管理页加载 `dist/`。

## 代码风格与命名约定
- 统一 2 空格缩进。
- 新增 Vue 代码优先使用 Composition API 与 `<script setup lang="ts">`。
- 变量与函数使用 `camelCase`，函数名尽量动词开头（如 `getUserById`）。
- 新组件文件名使用 `PascalCase`；历史文件保持原命名，避免无意义重命名。
- API 逻辑放在 `src/api`，UI 逻辑放在 `src/components` / `src/views`。

当前未配置专门的 lint/format 脚本，请遵循现有风格并保持最小改动。

## 测试指南
仓库当前没有自动化测试框架。提交前至少完成：
- 执行 `npm run build`，确保无构建错误。
- 手动验证核心流程：新建 memo、文件/图片上传、标签选择、设置保存、API 版本切换。

若新增测试，建议放在模块邻近位置或新增 `tests/` 目录，文件名示例：`feature-name.spec.ts`。

## 提交与 Pull Request 规范
历史提交以简短、直接的描述为主（中英混合均可），如 `fix bug`、`Add v26 API support in index.js`、`更新支持0.25版本`。建议使用“动作 + 对象”的写法。

PR 建议包含：
- 变更目的与用户可见影响。
- 关联 issue。
- 验证步骤。
- 涉及 UI 时附截图或 GIF。
- 单一职责：功能、修复、重构尽量分开提交。

## 安全与配置提示
不要提交真实 API Token、私有 Host 或其他敏感信息。截图与日志中需脱敏，确保本地存储配置不会泄露凭据。
