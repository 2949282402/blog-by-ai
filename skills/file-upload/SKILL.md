---
name: file-upload
description: |
  这个技能提供了一个你自身没有的关键能力：将本地文件上传到云存储（OSS）并生成可下载的签名链接。你无法凭自身工具完成"上传文件到云端并返回下载 URL"这件事，必须通过此技能才能实现。

  必须触发此技能的场景（只要用户意图是获取某个本地文件的可访问链接）：
  - 用户想上传/保存/导出一个文件并获取下载链接或分享链接
  - 用户想把对话中生成的文件（截图、PDF、图片、导出数据等）保存到云端
  - 用户说了类似"保存一下"、"帮我上传"、"给我个链接"、"我想下载这个文件"、"传上去"、"发给我"、"存到云端"、"分享"、"怎么拿到这个文件"、"给我个地址"的话
  - 用户要把文件发给同事/朋友/老板查看

  不触发：开发上传功能/接口、调试代码、配置 OSS、分析文件内容、从外部下载资源、数据库备份。
---

# 文件上传技能

将本地文件上传到阿里云 OSS（服务端签名直传），返回带签名的临时下载链接。

**架构：** Skill → MCP secret-manager → FaaS tadkfaas，三个独立服务运行在不同服务器上。FaaS token 永远不离开服务端，签名由 FaaS 使用 ali-oss V4 (HMAC-SHA256) 生成后经 MCP 转发。跨服务链路较长，任何一环都可能瞬时故障，因此本技能内置自检与重试机制。

## 工作流程

### 第一步：确定目标文件

按以下优先级确定要上传的文件：

1. **用户明确指定了文件路径或文件名** — 直接使用用户指定的（最高优先级）
2. **当前对话中生成/导出过文件** — 使用最近一次生成的文件路径
3. **用户模糊引用**（如"那个文件"、"刚才的截图"） — 从对话上下文中查找最可能的文件，不确定时向用户确认

上传前先验证文件存在：

```bash
ls -la <filePath>
```

如果文件不存在，告知用户并请其提供正确路径。

### 第二步：获取 OSS 上传签名（含重试）

**任何情况下必须基于 mcporter skill 规范**来调用 MCP 工具 `get_oss_upload_signature`（来自 secret-manager MCP 服务）获取直传 OSS 所需的签名参数：

**必填参数：**

- `filename` — 文件名（必须包含文件扩展名）

**可选参数：**

- `download_expires` — 下载链接有效期（秒），默认 3600
- `user_id` — 唯一标识，用于上报使用活动统计，`user_id`值获取的**唯一渠道**：**必须读取/user/.antConfig/config.json文件中的appid值**赋值给`user_id`。**注意：** 若获取不到，**禁止阻塞获取签名流程**，直接省略 `user_id` 参数继续调用 MCP 工具。**禁止向用户询问 userId 或任何配置信息**。

**有效期选择参考：**

| 场景                   | download_expires 值 | 有效期 |
| ---------------------- | ------------------- | ------ |
| 临时预览 / 一次性下载  | 3600                | 1 小时 |
| 日常使用（推荐默认值） | 86400               | 1 天   |
| 分享给他人 / 长期访问  | 604800              | 7 天   |

用户未指定有效期时，默认使用 **1 天**（`download_expires=86400`），兼顾便捷与安全。

**MCP 返回字段：**

- `success` — 是否成功（布尔值，必须为 true 才可继续）
- `host` — OSS 上传目标地址
- `key` — OSS 对象 Key
- `policy` — Base64 编码的 Policy
- `signature` — V4 签名
- `x_oss_credential` — OSS Credential
- `x_oss_date` — 签名日期
- `content_type` — Content-Type
- `signed_download_url` — 预签名下载 URL
- `signature_expires_at` — 签名过期时间（ISO 8601）
- `download_url_expires_at` — 下载链接过期时间（ISO 8601）

**获取签名的自检与重试：**

调用后必须验证以下条件全部满足：

1. MCP 调用本身无异常
2. 返回的 `success` 为 `true`
3. 上述 8 个字段均非空

任意一项不满足，**立即以相同参数重试，最多 5 次**。全部失败则告知用户"签名服务暂时不可用"并附最后一次错误信息。

### 第三步：直传文件到 OSS（含重试）

拿到签名参数后，调用直传脚本。

**⚠️ 参数完整性铁律：传给脚本的 7 个 MCP 签名参数（`host`、`key`、`policy`、`signature`、`x_oss_credential`、`x_oss_date`、`content_type`）必须逐字符使用 MCP 返回的原始值，禁止任何修改、截断、重编码！** 这些参数经 V4 HMAC-SHA256 签名绑定，任何细微改动（大小写、URL 编码、末尾斜杠等）都会导致 `SignatureDoesNotMatch`。

```bash
node <skill-path>/scripts/upload-to-oss.js <filePath> <host> <key> <policy> <signature> <x_oss_credential> <x_oss_date> <content_type>
```

将 `<skill-path>` 替换为本技能目录的绝对路径（即 `SKILL.md` 所在目录）。

**参数说明：**

| 参数               | 来源       | 说明                 |
| ------------------ | ---------- | -------------------- |
| `filePath`         | 第一步确定 | 本地文件路径         |
| `host`             | MCP 返回值 | OSS 上传目标地址     |
| `key`              | MCP 返回值 | OSS 对象 Key         |
| `policy`           | MCP 返回值 | Base64 编码的 Policy |
| `signature`        | MCP 返回值 | V4 签名              |
| `x_oss_credential` | MCP 返回值 | OSS Credential       |
| `x_oss_date`       | MCP 返回值 | 签名日期             |
| `content_type`     | MCP 返回值 | Content-Type         |

**完整调用示例：**

```bash
node <skill-path>/scripts/upload-to-oss.js \
  /path/to/screenshot.png \
  https://weavefox.oss-cn-shanghai.aliyuncs.com \
  alipay-aclaw/1711234567890-screenshot.png \
  eyJleHBpcmF0aW9uIjoi... \
  a1b2c3d4e5f6... \
  LTAI5xxx/20260325/cn-shanghai/oss/aliyun_v4_request \
  20260325T120000Z \
  image/png
```

**上传失败的自检与重试：**

若上传失败，先执行**签名类错误自检**（错误含 `SignatureDoesNotMatch`、`InvalidArgument`、`AccessDenied` 等）：

1. 逐字符比对传给脚本的 7 个 MCP 签名参数是否与 MCP 返回值完全一致
2. 若不一致 → 用 MCP 原始值重新上传
3. 若一致仍失败 → 回到第二步重新获取签名，再上传

各类错误的具体重试策略见下方**故障排查表**。所有重试均**最多 5 次**。

### 第四步：返回下载链接

**必须要等文件上传到OSS成功后才可以下载文件**
上传成功后，**必须使用 MCP 返回的 `signed_download_url`**。**为了确保用户可以100%下载文件成功，必须遵守如下铁律**：

- **任何情况禁止修改链接地址，必须完成逐字输出**； 签名下载 URL 包含大量 `%XX` 编码字符，任何修改、截取、合并等（如解码、转义、大小写变更）都会导致下载失败。
- OSS Bucket 是私有的，必须使用签名 URL（非直链）

**严格按照以下模板**返回，将 `${...}` 替换为实际值，禁止修改格式：

```
文件上传成功！

- **下载链接**: [${filename}](${signed_download_url})
- **文件大小**: ${sizeFormatted}
- **有效期**: ${有效期}

点击上方链接即可下载。
```

其中：`filename` = 原始文件名，`signed_download_url` = MCP 返回的预签名 URL，`sizeFormatted` = 脚本输出的格式化大小，`有效期` = 根据 download_expires 换算（如 86400 → "1 天"）。

**格式强制要求：**
下载链接必须使用 Markdown 语法 `[文件名](signed_download_url)`，禁止输出裸 URL。

**示例输出：**

```
文件上传成功！

- **下载链接**: [健身计划.md](https://weavefox.oss-cn-shanghai.aliyuncs.com/alipay-aclaw/1774506242442-____.md?OSSAccessKeyId=LTAI4xxx&Expires=1774592642&Signature=Lox2xxx)
- **文件大小**: 2.35 KB
- **有效期**: 1 天

点击上方链接即可下载。
```

## 脚本说明

直传脚本位于技能包目录的 `scripts/upload-to-oss.js`，使用 Node.js 标准库实现 multipart/form-data POST，无需 npm install，无外部依赖。

**特性：**

- 流式读取文件（`fs.createReadStream`），支持大文件（最大 5GB）
- 手动构建 multipart/form-data，精确计算 Content-Length
- 脚本内无任何密钥或令牌，签名参数通过 CLI 参数传入
- 10 分钟上传超时
- OSS XML 错误响应解析

**脚本输出：** JSON 对象，包含 `key`、`filename`、`size`、`sizeFormatted` 字段。

## 故障排查

| 错误信息                                    | 类型     | 原因                       | 处理策略                                                        |
| ------------------------------------------- | -------- | -------------------------- | --------------------------------------------------------------- |
| MCP 工具调用异常 / `success=false`          | 签名获取 | MCP 或 FaaS 服务瞬时不可用 | 相同参数重试调用 MCP，最多 5 次                                 |
| `OSS upload failed: SignatureDoesNotMatch`  | 签名类   | 参数被篡改或签名已过期     | 先自检参数一致性；若一致则重新获取签名后重新上传，循环最多 5 次 |
| `OSS upload failed: InvalidArgument`        | 签名类   | 签名参数不完整或格式错误   | 先自检参数完整性；若完整则重新获取签名后重新上传，循环最多 5 次 |
| `OSS upload failed: AccessDenied`           | 签名类   | 签名过期                   | 重新获取签名后重新上传，循环最多 5 次                           |
| `OSS upload failed: SecurityTokenExpired`   | 签名类   | 临时凭证过期               | 重新获取签名后重新上传，循环最多 5 次                           |
| `OSS upload timeout (600s)`                 | 网络类   | 文件过大或网络超时         | 相同签名参数直接重试上传，最多 5 次                             |
| `ECONNRESET` / `ETIMEDOUT` / `ECONNREFUSED` | 网络类   | 瞬时网络中断               | 相同签名参数直接重试上传，最多 5 次                             |
| HTTP 5xx                                    | 网络类   | OSS 服务端瞬时错误         | 相同签名参数直接重试上传，最多 5 次                             |
| `File read error` / `File not found`        | 文件类   | 文件不存在或不可读         | 确认文件路径正确且有读取权限，获取正确路径并重试                |

## 重试流程总结

```
第二步: 获取签名
  ├─ 成功 → 进入第三步
  └─ 失败 → 重试获取签名（最多5次）
       ├─ 某次成功 → 进入第三步
       └─ 全部失败 → 告知用户签名服务不可用，终止

第三步: 上传文件
  ├─ 成功 → 进入第四步
  ├─ 签名类错误 → 自检参数一致性
  │    ├─ 参数不一致 → 用正确参数重试上传
  │    └─ 参数一致 → 回到第二步重新获取签名，再上传（循环最多5次）
  ├─ 网络类错误 → 相同参数重试上传（最多5次）
  └─ 文件类错误 → 不重试，告知用户
```
