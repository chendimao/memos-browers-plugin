# Memos Quick Note

一个用于快速添加笔记到 Memos 的浏览器扩展。这个扩展允许你快速捕捉灵感，保存网页内容，并使用 Memos 管理你的知识。

[English Documentation](README.en.md)

> 现已支持 `Edge` / `Chrome` / `Firefox` / `Safari` / `Web`
>
> - `Edge`：可通过[微软扩展商店](https://microsoftedge.microsoft.com/addons/detail/memos/ldhakmjejmcfahjbjcbfnnagmkkakgdd)下载安装
> - `Chrome` / `Firefox` / `Safari`：可使用项目构建产物离线安装
> - `Web`：可构建为 `dist/web` 后自行部署到服务器

## v1.2.8 更新

- 重做编辑页、列表页、设置页样式，增强编辑区与工具区层次区分。
- 修复编辑页底部内容被固定高度遮挡的问题，编辑区高度改为自适应。
- 关闭插件后会记住上一次所在页面，可在设置中选择“记住上次页面 / 编辑器 / 列表”。
- 设置页新增主题跟随系统选项，默认主题改为跟随系统。
- 默认 API 版本改为 `0.18`。
- 调整设置页结构，移除“优先展示标签”设置项。
- 修复设置页下拉层级遮挡问题，补齐本地图标资源加载。
- 更新联系邮箱为 `admin@aiti.xin`。
- 新增 Chrome / Firefox 双生产包打包支持。
- 新增 Safari 临时安装测试打包支持，可生成 `dist/safari` 目录用于 macOS Safari 本地测试。

# memos-browers-plugin
Memos Quick Note - 您的智能笔记助手  快速捕捉灵感，轻松管理知识。支持 Memos v0.18/v0.24/v0.25/v0.26，多版本兼容，一键保存网页内容，智能标签补全，文件图片上传，自定义快捷键，个性化设置，让您的笔记体验更高效、更智能。

## 浏览器支持

- Chrome / Edge：可直接加载 `dist/chrome`
- Firefox：可加载 `dist/firefox`
- Safari：当前支持 macOS Safari 临时安装测试，构建目录为 `dist/safari`
- HTML / Web：可部署 `dist/web` 到自己的静态服务器

### 主要功能：
- 快速记录想法和笔记
- 支持 Markdown 格式
- 支持标签管理
- 支持文件上传（图片和文档）
- 支持从网页选中文本快速保存
- 编辑器功能：
- Markdown 工具栏（标题、粗体、斜体、列表等）
- 实时字数统计
- 标签自动补全
- 快捷键支持
- 拖拽上传文件
 - 粘贴上传（支持图片和文件）
- 列表功能：
- 标签筛选
- 分页加载
- 编辑已有记录
 - 按时间排序
- 支持展开/收起标签列表
 - 文件管理：
 - 支持图片预览
- 支持文件上传
- 文件删除功能
 - 上传进度显示
- 设置功能：
- API 配置（主机地址和令牌）
- 默认可见性设置
- 自定义标签设置
- 快捷键开关
- 界面主题切换（跟随系统/亮色/暗色）
- 窗口尺寸调整
- 默认视图设置
- 界面特性：
- 响应式布局
- 暗色模式支持
- 可调整窗口大小
- 标签缓存功能
- 平滑的动画效果
- 数据同步：
 - 与 Memos 服务器同步
- 支持 v18、v24、v25 和 v26 API
- 标签自动同步
- 设置本地存储
 - 用户体验：
- 操作提示（Toast 消息）
- 错误处理
- 加载状态显示
- 自动保存和恢复
- 安全特性：
 -- API 令牌管理
- 可见性控制（公开/私有/登录可见）

 

示例图片：

### 编辑页面：
![编辑页面](./docs/images/memos-edit.png)

### 列表页面：
![列表页面](./docs/images/memos-list.png)

### 设置页面：
![设置页面](./docs/images/memos-setting.png)

### 致谢
- 感谢 GitHub 网友 `tianshubenshu` 完成 Memos `0.26` 版本支持。

## 开发与打包

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

### 生产构建

```bash
# 一次构建全部浏览器产物
npm run build

# 仅构建 Chrome / Edge
npm run build:chrome

# 仅构建 Firefox
npm run build:firefox

# 仅构建 Safari（macOS Safari 临时安装测试）
npm run build:safari

# 仅构建 HTML / Web 版本
npm run build:web
```

构建完成后会生成以下目录：

```bash
dist/chrome
dist/firefox
dist/safari
dist/web
```

### 构建校验

```bash
npm run verify:build
```

## 安装与测试

### Chrome / Edge

1. 执行 `npm run build:chrome`
2. 打开浏览器扩展管理页
3. 开启“开发者模式”
4. 选择“加载已解压的扩展程序”
5. 选择 `dist/chrome`

### Firefox

1. 执行 `npm run build:firefox`
2. 打开 Firefox 调试扩展页面
3. 临时加载扩展
4. 选择 `dist/firefox/manifest.json`

### Safari（macOS 临时安装测试）

1. 执行 `npm run build:safari`
2. 打开 Safari，并开启开发相关选项
3. 按 Safari Web Extensions 的临时安装方式加载扩展目录
4. 选择 `dist/safari`
5. 安装并启用扩展后，测试弹窗、设置保存、选中文本导入等核心流程

### HTML / Web（部署到自己的服务器）

1. 执行 `npm run build:web`
2. 将 `dist/web` 中的文件上传到你的静态站点目录
3. 用浏览器访问部署后的网页地址
4. 首次打开后，在设置页填写 Memos 的 Host 与 Token

### Web 版保留功能

- 手动录入 memo
- 标签选择与补全
- 文件 / 图片上传
- 设置保存
- 列表查看与编辑
- 主题、语言、窗口布局相关设置

### Web 版不包含的扩展专属功能

- 网页选中文本右键注入
- 后台脚本驱动的交互
- 内容脚本注入
- 扩展图标弹窗式打开

### Web 部署注意事项

- 如果网页站点与 Memos 服务不在同一域名下，需要服务端允许跨域访问
- 建议使用 HTTPS，避免上传、认证或跨域请求被浏览器限制
