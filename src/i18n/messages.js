export const languages = {
  zh: {
    name: '中文',
    code: 'zh'
  },
  en: {
    name: 'English',
    code: 'en'
  }
};

export const messages = {
  zh: {
    // 通用
    save: '保存',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    edit: '编辑',
    loading: '加载中...',
    success: '成功',
    error: '错误',
    warning: '警告',
    
    // App 组件
    app: {
      title: 'Memos Quick Note',
      editSuccess: '更新成功',
      saveSuccess: '创建成功',
      editError: '更新失败',
      saveError: '创建失败',
      switchToEditor: '切换到编辑器',
      switchToList: '切换到列表',
      editMemo: '编辑备忘录',
      saveMemo: '保存备忘录'
    },
    
    // 设置页面
    settings: {
      title: '设置',
      basic: '基本设置',
      content: '内容设置',
      default: '默认设置',
      shortcut: '快捷键设置',
      tag: '标签设置',
      page: '页面设置',
      other: '其他设置',
      config: '配置管理',
      about: '关于',
      
      // 基本设置
      host: 'Memos 主页网址',
      hostPlaceholder: '请输入 Memos 主页网址',
      apiVersion: 'API 版本',
      token: 'Access Token',
      tokenOpenAPI: 'Access Token / OpenAPI',
      tokenPlaceholder: '请输入 Memos Access Tokens',
      tokenOpenAPIPlaceholder: '请输入 Access Token 或 OpenAPI',
      
      // 内容设置
      addSource: '自动添加来源信息',
      useQuote: '使用引用格式（>）包裹选中文本',
      skipDefaultTags: '当内容不包含标签时添加默认自定义标签',
      preserveFormatting: '右键添加时保留文本样式格式',
      
      // 默认设置
      defaultVisibility: '默认可见性',
      customTags: '自定义标签',
      customTagsPlaceholder: '用逗号分隔，如: daily,note',
      template: '内容模板',
      templatePlaceholder: '可用变量：{content}, {url}, {title}, {date}',
      
      // 快捷键设置
      enableShortcuts: '启用快捷键',
      shortcuts: {
        save: '快速保存',
        visibility: '切换可见性'
      },
      
      // 标签设置
      tagBehavior: '标签输入后行为',
      tagBehaviorOptions: {
        space: '添加空格',
        newline: '添加换行'
      },
      tagSpaceCount: '空格数量',
      tagNewlineCount: '换行数量',
      tagFilterStyle: '标签筛选样式',
      tagFilterStyleOptions: {
        list: '标签列表',
        selector: '下拉选择器'
      },
      preferredTags: '优先展示标签',
      preferredTagsDescription: '选择需要优先展示的标签',
      preferredTagsPlaceholder: '选择优先展示的标签...',
      preview: '预览',
      
      // 页面设置
      defaultView: '默认视图',
      defaultViewOptions: {
        editor: '编辑器',
        list: '列表'
      },
      width: '默认宽度',
      height: '输入页面高度',
      settingHeight: '设置页面高度',
      listHeight: '列表页面高度',
      
      // 其他设置
      showWordCount: '显示字数统计',
      theme: '主题',
      themeOptions: {
        light: '浅色',
        dark: '深色'
      },
      language: '语言',
      languageChanged: '语言已更改，页面将刷新',
      
      // 配置管理
      export: '导出配置',
      import: '导入配置',
      reset: '重置设置',
      
      // 关于
      about: {
        title: 'Memos Quick Note - 您的智能笔记助手',
        description: '快速捕捉灵感，轻松管理知识。支持 Memos v0.18/v0.24 双版本，一键保存网页内容，智能标签补全，文件图片上传，自定义快捷键，个性化设置，让您的笔记体验更高效、更智能。',
        contact: '联系方式',
        email: '邮箱',
        qq: 'QQ',
        github: 'GitHub'
      },
      
      // 可见性选项
      visibility: {
        public: '所有人可见',
        private: '仅自己可见',
        protected: '登录可见'
      }
    },
    
    // 列表页面
    list: {
      all: '全部',
      search: '搜索内容...',
      refresh: '刷新',
      create: '新建',
      noMemos: '暂无备忘录',
      noResults: '没有找到匹配的备忘录',
      loadMore: '加载更多...',
      expand: '展开',
      collapse: '收起',
      selectTag: '选择标签...',
      confirmDelete: '确定要删除这条备忘录吗？',
      deleteSuccess: '删除成功',
      deleteError: '删除失败：',
      visibility: {
        public: '所有人可见',
        private: '仅自己可见',
        protected: '登录可见'
      }
    },
    
    // 编辑器页面
    editor: {
      placeholder: '输入内容...',
      wordCount: '字数',
      charCount: '字符',
      lineCount: '行数',
      cancel: '取消',
      save: '保存',
      saving: '保存中...',
      emptyContent: '内容不能为空',
      saveSuccess: '保存成功',
      saveError: '保存失败：',
      submit: '记下',
      uploading: '上传中...',
      selectTag: '选择标签...',
      tools: {
        heading: '标题 (Ctrl+H)',
        bold: '粗体 (Ctrl+B)',
        italic: '斜体 (Ctrl+I)',
        strikethrough: '删除线',
        unorderedList: '无序列表',
        orderedList: '有序列表',
        taskList: '任务列表',
        quote: '引用',
        codeBlock: '代码块',
        table: '表格',
        link: '链接 (Ctrl+K)',
        divider: '分割线',
        uploadImage: '上传图片',
        uploadFile: '上传文件'
      },
      visibility: {
        public: '所有人可见',
        private: '仅自己可见',
        protected: '登录可见'
      }
    },
    
    memo: {
      expand: '展开更多',
      collapse: '收起',
      edit: '编辑',
      delete: '删除',
      visibility: {
        public: '公开',
        private: '私密',
        protected: '保护'
      },
      expandMore: '展开更多',
      showLess: '收起'
    }
  },
  
  en: {
    // Common
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    
    // App component
    app: {
      title: 'Memos Quick Note',
      editSuccess: 'Update successful',
      saveSuccess: 'Create successful',
      editError: 'Update failed',
      saveError: 'Create failed',
      switchToEditor: 'Switch to editor',
      switchToList: 'Switch to list',
      editMemo: 'Edit memo',
      saveMemo: 'Save memo'
    },
    
    // Settings page
    settings: {
      title: 'Settings',
      basic: 'Basic Settings',
      content: 'Content Settings',
      default: 'Default Settings',
      shortcut: 'Shortcut Settings',
      tag: 'Tag Settings',
      page: 'Page Settings',
      other: 'Other Settings',
      config: 'Configuration Management',
      about: 'About',
      
      // Basic settings
      host: 'Memos Host URL',
      hostPlaceholder: 'Enter Memos host URL',
      apiVersion: 'API Version',
      token: 'Access Token',
      tokenOpenAPI: 'Access Token / OpenAPI',
      tokenPlaceholder: 'Enter Memos Access Tokens',
      tokenOpenAPIPlaceholder: 'Enter Access Token or OpenAPI',
      
      // Content settings
      addSource: 'Automatically add source information',
      useQuote: 'Wrap selected text with quote format (>)',
      skipDefaultTags: 'Add default custom tags when content contains no tags',
      preserveFormatting: 'Preserve text formatting when adding via right-click',
      
      // Default settings
      defaultVisibility: 'Default Visibility',
      customTags: 'Custom Tags',
      customTagsPlaceholder: 'Separate with commas, e.g.: daily,note',
      template: 'Content Template',
      templatePlaceholder: 'Available variables: {content}, {url}, {title}, {date}',
      
      // Shortcut settings
      enableShortcuts: 'Enable Shortcuts',
      shortcuts: {
        save: 'Quick Save',
        visibility: 'Toggle Visibility'
      },
      
      // Tag settings
      tagBehavior: 'Tag Input Behavior',
      tagBehaviorOptions: {
        space: 'Add Space',
        newline: 'Add Newline'
      },
      tagSpaceCount: 'Space Count',
      tagNewlineCount: 'Newline Count',
      tagFilterStyle: 'Tag Filter Style',
      tagFilterStyleOptions: {
        list: 'Tag List',
        selector: 'Dropdown Selector'
      },
      preferredTags: 'Preferred Tags',
      preferredTagsDescription: 'Select tags to display first',
      preferredTagsPlaceholder: 'Select preferred tags...',
      preview: 'Preview',
      
      // Page settings
      defaultView: 'Default View',
      defaultViewOptions: {
        editor: 'Editor',
        list: 'List'
      },
      width: 'Default Width',
      height: 'Editor Height',
      settingHeight: 'Settings Height',
      listHeight: 'List Height',
      
      // Other settings
      showWordCount: 'Show Word Count',
      theme: 'Theme',
      themeOptions: {
        light: 'Light',
        dark: 'Dark'
      },
      language: 'Language',
      languageChanged: 'Language changed, page will refresh',
      
      // Configuration management
      export: 'Export Configuration',
      import: 'Import Configuration',
      reset: 'Reset Settings',
      
      // About
      about: {
        title: 'Memos Quick Note - Your Smart Note Assistant',
        description: 'Quickly capture ideas and manage knowledge. Supports Memos v0.18/v0.24, one-click save webpage content, smart tag completion, file and image upload, custom shortcuts, personalized settings, making your note-taking experience more efficient and intelligent.',
        contact: 'Contact',
        email: 'Email',
        qq: 'QQ',
        github: 'GitHub'
      },
      
      // Visibility options
      visibility: {
        public: 'Public',
        private: 'Private',
        protected: 'Protected'
      }
    },
    
    // List page
    list: {
      all: 'All',
      search: 'Search content...',
      refresh: 'Refresh',
      create: 'Create',
      noMemos: 'No memos yet',
      noResults: 'No matching memos found',
      loadMore: 'Load more...',
      expand: 'Expand',
      collapse: 'Collapse',
      selectTag: 'Select tag...',
      confirmDelete: 'Are you sure you want to delete this memo?',
      deleteSuccess: 'Delete successful',
      deleteError: 'Delete failed: ',
      visibility: {
        public: 'Public',
        private: 'Private',
        protected: 'Protected'
      }
    },
    
    // Editor page
    editor: {
      placeholder: 'Enter content...',
      wordCount: 'Words',
      charCount: 'Characters',
      lineCount: 'Lines',
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving...',
      emptyContent: 'Content cannot be empty',
      saveSuccess: 'Save successful',
      saveError: 'Save failed: ',
      submit: 'Save',
      uploading: 'Uploading...',
      selectTag: 'Select tag...',
      tools: {
        heading: 'Heading (Ctrl+H)',
        bold: 'Bold (Ctrl+B)',
        italic: 'Italic (Ctrl+I)',
        strikethrough: 'Strikethrough',
        unorderedList: 'Unordered list',
        orderedList: 'Ordered list',
        taskList: 'Task list',
        quote: 'Quote',
        codeBlock: 'Code block',
        table: 'Table',
        link: 'Link (Ctrl+K)',
        divider: 'Divider',
        uploadImage: 'Upload image',
        uploadFile: 'Upload file'
      },
      visibility: {
        public: 'Public',
        private: 'Private',
        protected: 'Protected'
      }
    },
    
    memo: {
      expand: 'Show more',
      collapse: 'Show less',
      edit: 'Edit',
      delete: 'Delete',
      visibility: {
        public: 'Public',
        private: 'Private',
        protected: 'Protected'
      },
      expandMore: 'Show More',
      showLess: 'Show Less'
    }
  }
}; 