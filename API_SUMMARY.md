# Memos API 接口文档

> 基于 Protocol Buffers (gRPC-Gateway) 的 RESTful API 接口定义
>
> 版本：v1  
> 生成时间：2025-10-29

---

## 📑 目录

- [接口服务总览](#接口服务总览)
  - [1. AuthService (认证服务)](#1-authservice-认证服务)
  - [2. UserService (用户服务)](#2-userservice-用户服务)
  - [3. MemoService (便签服务)](#3-memoservice-便签服务)
  - [4. AttachmentService (附件服务)](#4-attachmentservice-附件服务)
  - [5. ShortcutService (快捷方式服务)](#5-shortcutservice-快捷方式服务)
  - [6. ActivityService (活动服务)](#6-activityservice-活动服务)
  - [7. InboxService (收件箱服务)](#7-inboxservice-收件箱服务)
  - [8. IdentityProviderService (身份提供者服务)](#8-identityproviderservice-身份提供者服务)
  - [9. WorkspaceService (工作空间服务)](#9-workspaceservice-工作空间服务)
- [数据模型](#数据模型)
- [常用枚举类型](#常用枚举类型)

---

## 接口服务总览

### 1. AuthService (认证服务)

**用途**: 用户身份验证和会话管理

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| GetCurrentSession | GET | `/api/v1/auth/sessions/current` | 获取当前会话信息 |
| CreateSession | POST | `/api/v1/auth/sessions` | 创建新会话（用户登录） |
| DeleteSession | DELETE | `/api/v1/auth/sessions/current` | 删除当前会话（用户登出） |

#### CreateSession 支持的认证方式

1. **密码认证**
   ```json
   {
     "password_credentials": {
       "username": "string",
       "password": "string"
     }
   }
   ```

2. **SSO 认证**
   ```json
   {
     "sso_credentials": {
       "idp_id": 1,
       "code": "string",
       "redirect_uri": "string"
     }
   }
   ```

#### 响应示例

```json
{
  "user": {
    "name": "users/123",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "USER"
  },
  "last_accessed_at": "2025-10-29T10:00:00Z"
}
```

---

### 2. UserService (用户服务)

**用途**: 用户管理、配置、统计等完整功能

#### 基础用户操作

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| ListUsers | GET | `/api/v1/users` | 获取用户列表 |
| GetUser | GET | `/api/v1/users/{id_or_username}` | 获取用户信息 |
| CreateUser | POST | `/api/v1/users` | 创建新用户 |
| UpdateUser | PATCH | `/api/v1/users/{user}` | 更新用户信息 |
| DeleteUser | DELETE | `/api/v1/users/{user}` | 删除用户 |
| GetUserAvatar | GET | `/api/v1/users/{user}/avatar` | 获取用户头像 |

**ListUsers 查询参数**:
- `page_size`: 每页数量（默认 50，最大 1000）
- `page_token`: 分页令牌
- `filter`: 过滤条件，如 `username == 'steven'`
- `show_deleted`: 是否显示已删除用户

#### 用户统计

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| GetUserStats | GET | `/api/v1/users/{user}:getStats` | 获取指定用户统计 |
| ListAllUserStats | GET | `/api/v1/users:stats` | 获取所有用户统计 |

**统计数据包含**:
- 便签展示时间戳列表
- 便签类型统计（链接、代码、待办）
- 标签使用统计
- 置顶便签列表
- 便签总数

#### 用户设置

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| ListUserSettings | GET | `/api/v1/users/{user}/settings` | 获取用户设置列表 |
| GetUserSetting | GET | `/api/v1/users/{user}/settings/{setting}` | 获取特定设置 |
| UpdateUserSetting | PATCH | `/api/v1/users/{user}/settings/{setting}` | 更新用户设置 |

**设置类型**:
- `GENERAL`: 通用设置（语言、主题、便签可见性）
- `SESSIONS`: 会话管理
- `ACCESS_TOKENS`: 访问令牌
- `WEBHOOKS`: Webhook 配置

#### 访问令牌管理

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| ListUserAccessTokens | GET | `/api/v1/users/{user}/accessTokens` | 获取访问令牌列表 |
| CreateUserAccessToken | POST | `/api/v1/users/{user}/accessTokens` | 创建访问令牌 |
| DeleteUserAccessToken | DELETE | `/api/v1/users/{user}/accessTokens/{token}` | 删除访问令牌 |

#### 会话管理

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| ListUserSessions | GET | `/api/v1/users/{user}/sessions` | 获取用户会话列表 |
| RevokeUserSession | DELETE | `/api/v1/users/{user}/sessions/{session}` | 撤销指定会话 |

**会话信息包含**:
- 会话 ID
- 创建时间和最后访问时间
- 客户端信息（User-Agent、IP、设备类型、操作系统、浏览器）

#### Webhook 管理

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| ListUserWebhooks | GET | `/api/v1/users/{user}/webhooks` | 获取 Webhook 列表 |
| CreateUserWebhook | POST | `/api/v1/users/{user}/webhooks` | 创建 Webhook |
| UpdateUserWebhook | PATCH | `/api/v1/users/{user}/webhooks/{webhook}` | 更新 Webhook |
| DeleteUserWebhook | DELETE | `/api/v1/users/{user}/webhooks/{webhook}` | 删除 Webhook |

---

### 3. MemoService (便签服务)

**用途**: 便签的完整 CRUD 及相关操作（核心功能）

#### 基础便签操作

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| CreateMemo | POST | `/api/v1/memos` | 创建便签 |
| ListMemos | GET | `/api/v1/memos` | 获取便签列表 |
| GetMemo | GET | `/api/v1/memos/{memo}` | 获取便签详情 |
| UpdateMemo | PATCH | `/api/v1/memos/{memo}` | 更新便签 |
| DeleteMemo | DELETE | `/api/v1/memos/{memo}` | 删除便签 |

**ListMemos 查询参数**:
- `page_size`: 每页数量（默认 50，最大 1000）
- `page_token`: 分页令牌
- `state`: 状态（NORMAL/ARCHIVED）
- `order_by`: 排序规则，如 `"pinned desc, display_time desc"`
- `filter`: CEL 表达式过滤器
- `show_deleted`: 是否显示已删除

**Memo 数据结构**:
```json
{
  "name": "memos/abc123",
  "state": "NORMAL",
  "creator": "users/123",
  "create_time": "2025-10-29T10:00:00Z",
  "update_time": "2025-10-29T10:00:00Z",
  "display_time": "2025-10-29T10:00:00Z",
  "content": "# 我的便签\n\n这是内容",
  "visibility": "PUBLIC",
  "tags": ["工作", "重要"],
  "pinned": false,
  "location": {
    "placeholder": "北京",
    "latitude": 39.9042,
    "longitude": 116.4074
  }
}
```

#### 标签操作

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| RenameMemoTag | PATCH | `/api/v1/memos/{memo}/tags:rename` | 重命名标签 |
| DeleteMemoTag | POST | `/api/v1/memos/{memo}/tags:delete` | 删除标签 |

**注意**: 使用 `memos/-` 可以对所有便签的标签进行操作

#### 附件操作

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| SetMemoAttachments | PATCH | `/api/v1/memos/{memo}/attachments` | 设置便签附件 |
| ListMemoAttachments | GET | `/api/v1/memos/{memo}/attachments` | 获取附件列表 |

#### 关联关系

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| SetMemoRelations | PATCH | `/api/v1/memos/{memo}/relations` | 设置便签关联 |
| ListMemoRelations | GET | `/api/v1/memos/{memo}/relations` | 获取关联列表 |

**关联类型**:
- `REFERENCE`: 引用
- `COMMENT`: 评论

#### 评论功能

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| CreateMemoComment | POST | `/api/v1/memos/{memo}/comments` | 创建评论 |
| ListMemoComments | GET | `/api/v1/memos/{memo}/comments` | 获取评论列表 |

#### 反应功能（点赞/表情）

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| ListMemoReactions | GET | `/api/v1/memos/{memo}/reactions` | 获取反应列表 |
| UpsertMemoReaction | POST | `/api/v1/memos/{memo}/reactions` | 添加/更新反应 |
| DeleteMemoReaction | DELETE | `/api/v1/reactions/{reaction}` | 删除反应 |

**反应示例**:
```json
{
  "name": "reactions/123",
  "creator": "users/456",
  "content_id": "memos/abc",
  "reaction_type": "👍",
  "create_time": "2025-10-29T10:00:00Z"
}
```

---

### 4. AttachmentService (附件服务)

**用途**: 文件上传、下载和管理

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| CreateAttachment | POST | `/api/v1/attachments` | 创建附件（上传文件） |
| ListAttachments | GET | `/api/v1/attachments` | 获取附件列表 |
| GetAttachment | GET | `/api/v1/attachments/{attachment}` | 获取附件元数据 |
| GetAttachmentBinary | GET | `/file/attachments/{attachment}/{filename}` | 下载附件文件 |
| UpdateAttachment | PATCH | `/api/v1/attachments/{attachment}` | 更新附件信息 |
| DeleteAttachment | DELETE | `/api/v1/attachments/{attachment}` | 删除附件 |

**附件数据结构**:
```json
{
  "name": "attachments/xyz",
  "filename": "image.png",
  "type": "image/png",
  "size": 102400,
  "external_link": "https://example.com/file.png",
  "memo": "memos/abc",
  "create_time": "2025-10-29T10:00:00Z"
}
```

**ListAttachments 查询参数**:
- `page_size`: 每页数量
- `page_token`: 分页令牌
- `filter`: 过滤条件，如 `type=image/png` 或 `filename:*.jpg`
- `order_by`: 排序规则，如 `create_time desc`

**GetAttachmentBinary 参数**:
- `thumbnail`: 是否获取缩略图（布尔值）

---

### 5. ShortcutService (快捷方式服务)

**用途**: 用户自定义便签筛选器

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| ListShortcuts | GET | `/api/v1/users/{user}/shortcuts` | 获取快捷方式列表 |
| GetShortcut | GET | `/api/v1/users/{user}/shortcuts/{shortcut}` | 获取快捷方式 |
| CreateShortcut | POST | `/api/v1/users/{user}/shortcuts` | 创建快捷方式 |
| UpdateShortcut | PATCH | `/api/v1/users/{user}/shortcuts/{shortcut}` | 更新快捷方式 |
| DeleteShortcut | DELETE | `/api/v1/users/{user}/shortcuts/{shortcut}` | 删除快捷方式 |

**快捷方式示例**:
```json
{
  "name": "users/123/shortcuts/work",
  "title": "工作相关",
  "filter": "tag == '工作' && visibility == 'PRIVATE'"
}
```

---

### 6. ActivityService (活动服务)

**用途**: 系统活动日志和通知

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| ListActivities | GET | `/api/v1/activities` | 获取活动列表 |
| GetActivity | GET | `/api/v1/activities/{activity}` | 获取活动详情 |

**活动类型**:
- `MEMO_COMMENT`: 便签评论活动
- `VERSION_UPDATE`: 版本更新活动

**活动级别**:
- `INFO`: 信息
- `WARN`: 警告
- `ERROR`: 错误

**活动数据结构**:
```json
{
  "name": "activities/123",
  "creator": "users/456",
  "type": "MEMO_COMMENT",
  "level": "INFO",
  "create_time": "2025-10-29T10:00:00Z",
  "payload": {
    "memo_comment": {
      "memo": "memos/abc",
      "related_memo": "memos/xyz"
    }
  }
}
```

---

### 7. InboxService (收件箱服务)

**用途**: 用户通知消息管理

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| ListInboxes | GET | `/api/v1/users/{user}/inboxes` | 获取收件箱列表 |
| UpdateInbox | PATCH | `/api/v1/inboxes/{inbox}` | 更新收件箱（如标记已读） |
| DeleteInbox | DELETE | `/api/v1/inboxes/{inbox}` | 删除收件箱消息 |

**收件箱状态**:
- `UNREAD`: 未读
- `ARCHIVED`: 已归档

**通知类型**:
- `MEMO_COMMENT`: 便签评论通知
- `VERSION_UPDATE`: 版本更新通知

**ListInboxes 查询参数**:
- `page_size`: 每页数量（默认 50，最大 1000）
- `page_token`: 分页令牌
- `filter`: 过滤条件，如 `status=UNREAD` 或 `type=MEMO_COMMENT`
- `order_by`: 排序规则

**收件箱数据结构**:
```json
{
  "name": "inboxes/123",
  "sender": "users/456",
  "receiver": "users/789",
  "status": "UNREAD",
  "type": "MEMO_COMMENT",
  "activity_id": 100,
  "create_time": "2025-10-29T10:00:00Z"
}
```

---

### 8. IdentityProviderService (身份提供者服务)

**用途**: SSO 单点登录配置（管理员功能）

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| ListIdentityProviders | GET | `/api/v1/identityProviders` | 获取身份提供者列表 |
| GetIdentityProvider | GET | `/api/v1/identityProviders/{idp}` | 获取身份提供者 |
| CreateIdentityProvider | POST | `/api/v1/identityProviders` | 创建身份提供者 |
| UpdateIdentityProvider | PATCH | `/api/v1/identityProviders/{idp}` | 更新身份提供者 |
| DeleteIdentityProvider | DELETE | `/api/v1/identityProviders/{idp}` | 删除身份提供者 |

**支持的身份提供者类型**:
- `OAUTH2`: OAuth 2.0 协议

**OAuth2 配置示例**:
```json
{
  "name": "identityProviders/github",
  "type": "OAUTH2",
  "title": "GitHub",
  "identifier_filter": "",
  "config": {
    "oauth2_config": {
      "client_id": "your_client_id",
      "client_secret": "your_client_secret",
      "auth_url": "https://github.com/login/oauth/authorize",
      "token_url": "https://github.com/login/oauth/access_token",
      "user_info_url": "https://api.github.com/user",
      "scopes": ["read:user", "user:email"],
      "field_mapping": {
        "identifier": "login",
        "display_name": "name",
        "email": "email",
        "avatar_url": "avatar_url"
      }
    }
  }
}
```

---

### 9. WorkspaceService (工作空间服务)

**用途**: 全局工作空间配置和管理

| 方法 | HTTP 方法 | 端点 | 说明 |
|------|----------|------|------|
| GetWorkspaceProfile | GET | `/api/v1/workspace/profile` | 获取工作空间概况 |
| GetWorkspaceSetting | GET | `/api/v1/workspace/settings/{setting}` | 获取工作空间设置 |
| UpdateWorkspaceSetting | PATCH | `/api/v1/workspace/settings/{setting}` | 更新工作空间设置 |

#### 工作空间概况

**WorkspaceProfile 响应**:
```json
{
  "owner": "users/1",
  "version": "v0.25.0",
  "mode": "prod",
  "instance_url": "https://memos.example.com"
}
```

#### 工作空间设置类型

##### 1. GENERAL - 通用设置

```json
{
  "name": "workspace/settings/GENERAL",
  "general_setting": {
    "theme": "default",
    "disallow_user_registration": false,
    "disallow_password_auth": false,
    "additional_script": "",
    "additional_style": "",
    "custom_profile": {
      "title": "我的 Memos",
      "description": "知识管理平台",
      "logo_url": "https://example.com/logo.png",
      "locale": "zh-CN"
    },
    "week_start_day_offset": 0,
    "disallow_change_username": false,
    "disallow_change_nickname": false
  }
}
```

##### 2. STORAGE - 存储设置

**存储类型**:
- `DATABASE`: 数据库存储
- `LOCAL`: 本地文件系统
- `S3`: S3 兼容存储

```json
{
  "name": "workspace/settings/STORAGE",
  "storage_setting": {
    "storage_type": "S3",
    "filepath_template": "assets/{timestamp}_{filename}",
    "upload_size_limit_mb": 32,
    "s3_config": {
      "access_key_id": "your_key",
      "access_key_secret": "your_secret",
      "endpoint": "https://s3.amazonaws.com",
      "region": "us-east-1",
      "bucket": "memos-attachments",
      "use_path_style": false
    }
  }
}
```

##### 3. MEMO_RELATED - 便签相关设置

```json
{
  "name": "workspace/settings/MEMO_RELATED",
  "memo_related_setting": {
    "disallow_public_visibility": false,
    "display_with_update_time": false,
    "content_length_limit": 8192,
    "enable_double_click_edit": true,
    "enable_link_preview": true,
    "reactions": ["👍", "❤️", "😄", "🎉", "😢", "😡"],
    "disable_markdown_shortcuts": false,
    "enable_blur_nsfw_content": false,
    "nsfw_tags": ["nsfw", "adult"]
  }
}
```

---

## 数据模型

### User（用户）

```json
{
  "name": "users/123",
  "role": "USER",
  "username": "john_doe",
  "email": "john@example.com",
  "display_name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg",
  "description": "Hello, I'm John!",
  "state": "NORMAL",
  "create_time": "2025-01-01T00:00:00Z",
  "update_time": "2025-10-29T10:00:00Z"
}
```

### Memo（便签）

```json
{
  "name": "memos/abc123",
  "state": "NORMAL",
  "creator": "users/123",
  "create_time": "2025-10-29T10:00:00Z",
  "update_time": "2025-10-29T10:30:00Z",
  "display_time": "2025-10-29T10:00:00Z",
  "content": "# 标题\n\n这是便签内容，支持 **Markdown**。\n\n- 项目 1\n- 项目 2",
  "visibility": "PUBLIC",
  "tags": ["工作", "重要"],
  "pinned": true,
  "snippet": "标题 这是便签内容，支持 Markdown。 项目 1 项目 2",
  "location": {
    "placeholder": "北京",
    "latitude": 39.9042,
    "longitude": 116.4074
  },
  "property": {
    "has_link": true,
    "has_task_list": true,
    "has_code": false,
    "has_incomplete_tasks": false
  },
  "attachments": [],
  "relations": [],
  "reactions": []
}
```

### Attachment（附件）

```json
{
  "name": "attachments/xyz789",
  "create_time": "2025-10-29T10:00:00Z",
  "filename": "document.pdf",
  "type": "application/pdf",
  "size": 1048576,
  "external_link": "",
  "memo": "memos/abc123"
}
```

### Reaction（反应）

```json
{
  "name": "reactions/123",
  "creator": "users/456",
  "content_id": "memos/abc",
  "reaction_type": "👍",
  "create_time": "2025-10-29T10:00:00Z"
}
```

---

## 常用枚举类型

### 用户角色 (User.Role)

| 值 | 说明 | 权限 |
|----|------|------|
| `HOST` | 系统所有者 | 最高权限，可管理所有内容 |
| `ADMIN` | 管理员 | 管理用户和工作空间设置 |
| `USER` | 普通用户 | 管理自己的内容 |

### 状态 (State)

| 值 | 说明 |
|----|------|
| `NORMAL` | 正常状态 |
| `ARCHIVED` | 已归档 |

### 便签可见性 (Visibility)

| 值 | 说明 |
|----|------|
| `PRIVATE` | 私有，仅创建者可见 |
| `PROTECTED` | 受保护，登录用户可见 |
| `PUBLIC` | 公开，所有人可见 |

### 便签关联类型 (MemoRelation.Type)

| 值 | 说明 |
|----|------|
| `REFERENCE` | 引用关系 |
| `COMMENT` | 评论关系 |

### 活动类型 (Activity.Type)

| 值 | 说明 |
|----|------|
| `MEMO_COMMENT` | 便签评论活动 |
| `VERSION_UPDATE` | 版本更新活动 |

### 活动级别 (Activity.Level)

| 值 | 说明 |
|----|------|
| `INFO` | 信息级别 |
| `WARN` | 警告级别 |
| `ERROR` | 错误级别 |

### 收件箱状态 (Inbox.Status)

| 值 | 说明 |
|----|------|
| `UNREAD` | 未读 |
| `ARCHIVED` | 已归档 |

### 存储类型 (WorkspaceSetting.StorageSetting.StorageType)

| 值 | 说明 |
|----|------|
| `DATABASE` | 数据库存储 |
| `LOCAL` | 本地文件系统 |
| `S3` | S3 兼容存储 |

---

## 通用特性

### 分页

大多数列表接口支持分页，使用以下参数：

- **page_size**: 每页返回的项目数量
  - 默认值：50
  - 最大值：1000
  
- **page_token**: 分页令牌（从上一次响应的 `next_page_token` 获取）

**响应格式**:
```json
{
  "items": [...],
  "next_page_token": "token_for_next_page",
  "total_size": 100
}
```

### 过滤 (Filter)

支持过滤的接口使用 CEL（Common Expression Language）表达式：

**示例**:
- `tag == '工作'` - 标签等于"工作"
- `visibility == 'PUBLIC'` - 公开可见
- `pinned == true` - 已置顶
- `creator == 'users/123'` - 指定创建者
- `type == 'image/png'` - 文件类型
- `filename:*.jpg` - 文件名匹配

### 排序 (Order By)

支持的排序规则格式：`field_name [asc|desc]`

**示例**:
- `create_time desc` - 按创建时间降序
- `pinned desc, display_time desc` - 先按置顶排序，再按展示时间排序
- `filename asc` - 按文件名升序

### 字段掩码 (Field Mask)

更新操作使用 `update_mask` 指定要更新的字段：

```json
{
  "memo": {
    "name": "memos/abc",
    "content": "新内容",
    "pinned": true
  },
  "update_mask": {
    "paths": ["content", "pinned"]
  }
}
```

### 资源命名规范

所有资源遵循统一的命名格式：

- 用户：`users/{user_id}`
- 便签：`memos/{memo_id}`
- 附件：`attachments/{attachment_id}`
- 活动：`activities/{activity_id}`
- 收件箱：`inboxes/{inbox_id}`
- 反应：`reactions/{reaction_id}`
- 快捷方式：`users/{user_id}/shortcuts/{shortcut_id}`
- 用户设置：`users/{user_id}/settings/{setting_key}`
- 工作空间设置：`workspace/settings/{setting_key}`

---

## API 使用示例

### 1. 用户登录

```http
POST /api/v1/auth/sessions
Content-Type: application/json

{
  "password_credentials": {
    "username": "john_doe",
    "password": "secure_password"
  }
}
```

### 2. 创建便签

```http
POST /api/v1/memos
Content-Type: application/json
Authorization: Bearer {token}

{
  "memo": {
    "content": "# 今天的工作\n\n- 完成 API 文档\n- 修复 Bug #123",
    "visibility": "PRIVATE",
    "pinned": false
  }
}
```

### 3. 获取便签列表（带过滤和排序）

```http
GET /api/v1/memos?filter=tag=='工作'&order_by=pinned desc, display_time desc&page_size=20
Authorization: Bearer {token}
```

### 4. 上传附件

```http
POST /api/v1/attachments
Content-Type: application/json
Authorization: Bearer {token}

{
  "attachment": {
    "filename": "report.pdf",
    "content": "base64_encoded_content",
    "type": "application/pdf",
    "memo": "memos/abc123"
  }
}
```

### 5. 添加便签反应

```http
POST /api/v1/memos/abc123/reactions
Content-Type: application/json
Authorization: Bearer {token}

{
  "reaction": {
    "content_id": "memos/abc123",
    "reaction_type": "👍"
  }
}
```

### 6. 更新用户设置

```http
PATCH /api/v1/users/123/settings/GENERAL
Content-Type: application/json
Authorization: Bearer {token}

{
  "setting": {
    "name": "users/123/settings/GENERAL",
    "general_setting": {
      "locale": "zh-CN",
      "theme": "dark",
      "memo_visibility": "PRIVATE"
    }
  },
  "update_mask": {
    "paths": ["general_setting.locale", "general_setting.theme"]
  }
}
```

---

## 注意事项

1. **认证**: 除了登录接口，其他接口通常需要在 HTTP Header 中携带认证信息
2. **资源命名**: 使用资源的完整名称（如 `users/123` 而不是 `123`）
3. **时间格式**: 所有时间戳使用 RFC 3339 格式（ISO 8601）
4. **文件上传**: 附件内容通过 Base64 编码传输或使用外部链接
5. **幂等性**: 创建操作支持 `request_id` 参数实现幂等性
6. **验证模式**: 某些创建/更新操作支持 `validate_only` 参数进行预检
7. **软删除**: 删除操作通常是软删除，可通过 `show_deleted` 参数查看

---

## 版本历史

- **v1**: 当前版本
  - 完整的便签管理功能
  - 用户认证和授权
  - 附件和文件管理
  - 社交功能（评论、反应）
  - 通知系统
  - SSO 单点登录支持
  - 工作空间配置管理

---

## 相关文档

- [Protocol Buffers](https://protobuf.dev/)
- [gRPC-Gateway](https://github.com/grpc-ecosystem/grpc-gateway)
- [Google API Design Guide](https://cloud.google.com/apis/design)
- [CEL (Common Expression Language)](https://github.com/google/cel-spec)

---

**文档维护**: 此文档基于 proto 文件自动生成，如有更新请同步修改源文件。

