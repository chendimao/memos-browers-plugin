# GitHub Releases 自动发布说明

## 工作流说明

当前仓库使用两套 GitHub Actions 工作流：

- `CI`：在推送到 `master` 或创建 / 更新 Pull Request 时执行，只做构建与产物校验。
- `Release`：在推送版本标签（如 `1.2.9` 或 `v1.2.9`）时执行，自动构建并发布 GitHub Release。

## 自动发布流程

1. 修改 `package.json` 中的版本号，例如 `1.2.9`。
2. 提交并推送代码到 `master`。
3. 创建版本标签：`git tag 1.2.9` 或 `git tag v1.2.9`。
4. 推送标签：`git push origin 1.2.9` 或 `git push origin v1.2.9`。
5. GitHub Actions 自动执行 Release 工作流。
6. GitHub Releases 中自动生成对应版本并上传资产。

## 版本一致性要求

- Git tag 必须与 `package.json` 版本一致，允许带或不带 `v` 前缀。
- 例如：
  - `package.json`：`1.2.9`
  - Git tag：`v1.2.9`

如果两者不一致，Release 工作流会直接失败，避免错误版本被发布。

## 自动上传的发布资产

每次正式发布会自动上传以下文件：

- `memos-chrome-v<版本号>.zip`
- `memos-firefox-v<版本号>.zip`
- `memos-safari-v<版本号>.zip`
- `memos-web-v<版本号>.zip`

其中：

- Chrome / Firefox / Safari 压缩包用于离线安装或本地测试。
- Web 压缩包可解压后部署到静态服务器。

## 相关文件

- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `scripts/package-release-assets.mjs`

## 本地验证建议

在正式打 tag 前，建议先本地执行：

```bash
npm run build
npm run verify:build
npm run build:release-assets
```

确认构建、校验和压缩都通过后，再推送版本标签。
