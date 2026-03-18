# Memos Quick Note

A browser extension for quickly adding notes to Memos. This extension allows you to capture ideas, save web content, and manage your knowledge with Memos.

[中文文档](README.md)

> Supports `Edge` / `Chrome` / `Firefox` / `Safari` / `Web`
>
> - `Edge`: install from [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/memos/ldhakmjejmcfahjbjcbfnnagmkkakgdd)
> - `Chrome` / `Firefox` / `Safari`: install offline from local build output
> - `Web`: build `dist/web` and deploy it to your own server

## Features

- Quick note creation with rich text editing
- Markdown support with toolbar
- File and image upload
- Tag management with auto-completion
- Customizable shortcuts
- Dark/Light theme
- Multi-language support
- List view for managing memos
- Settings panel for customization
- Production builds for Chrome / Edge, Firefox, and Safari testing on macOS

## Browser Targets

- Chrome / Edge: load `dist/chrome`
- Firefox: load `dist/firefox`
- Safari: temporary local testing on macOS via `dist/safari`
- HTML / Web: deploy `dist/web` to your own static server

## Usage

1. Click the extension icon in your Edge toolbar
2. Start typing your note in the editor
3. Use the toolbar for Markdown formatting
4. Add tags with # symbol
5. Upload files or images using the upload buttons
6. Click "Save" to create your memo

## Settings

The extension provides various settings to customize your experience:

- Basic Settings: Host URL and API token configuration
- Content Settings: Source information and quote format options
- Default Settings: Default visibility and custom tags
- Shortcut Settings: Customizable keyboard shortcuts
- Tag Settings: Tag input behavior and filter style
- Page Settings: Default view and dimensions
- Other Settings: Word count, theme, and language options

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build all browser targets
npm run build

# Build a single target
npm run build:chrome
npm run build:firefox
npm run build:safari
npm run build:web

# Verify build output
npm run verify:build
```

## Automated Releases

This repository includes two GitHub Actions workflows:

- `CI`: runs on pushes to `master` and on pull requests, and only validates build output
- `Release`: runs when a version tag such as `1.2.9` or `v1.2.9` is pushed, then builds and publishes a GitHub Release automatically

### Release Steps

1. Update the version in `package.json`
2. Commit and push your changes to `master`
3. Create a version tag, for example `git tag 1.2.9` or `git tag v1.2.9`
4. Push the tag, for example `git push origin 1.2.9` or `git push origin v1.2.9`
5. Wait for GitHub Actions to create the Release and upload the assets

### Uploaded Release Assets

- `memos-chrome-v<version>.zip`
- `memos-firefox-v<version>.zip`
- `memos-safari-v<version>.zip`
- `memos-web-v<version>.zip`

### Recommended Local Validation Before Releasing

```bash
npm run build
npm run verify:build
npm run build:release-assets
```

## Installation / Testing

### Chrome / Edge

1. Run `npm run build:chrome`
2. Open the browser extensions page
3. Enable Developer Mode
4. Click "Load unpacked"
5. Select `dist/chrome`

### Firefox

1. Run `npm run build:firefox`
2. Open the Firefox debugging page for extensions
3. Temporarily load an add-on
4. Select `dist/firefox/manifest.json`

### Safari

1. Run `npm run build:safari`
2. Open Safari on macOS
3. Enable Safari development-related options
4. Temporarily install the extension folder
5. Select `dist/safari`

### HTML / Web

1. Run `npm run build:web`
2. Upload the files in `dist/web` to your static hosting directory
3. Open the deployed URL in your browser
4. On first launch, fill in your Memos Host and Token in Settings

## Web Version Scope

### Included in the Web build

- Manual memo input
- Tag selection and auto-completion
- File / image upload
- Settings persistence
- Memo list viewing and editing
- Theme, language, and layout settings

### Not included in the Web build

- Right-click selected text injection from webpages
- Background-script-driven extension interactions
- Content script injection
- Extension popup entry behavior

### Web Deployment Notes

- If your web app and Memos service are on different domains, make sure your server allows CORS
- HTTPS is recommended to avoid browser restrictions around upload, authentication, or cross-origin requests

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Email: admin@aiti.xin
