---
name: alipay-job-apply
description: 支付宝岗位投递技能，查询用户个人信息使用状态并询问用户意愿后进行岗位投递。使用场景包括：岗位投递、职位申请、支付宝就业岗位投递等。
---

# 支付宝岗位投递

## 功能概述

本skill用于在支付宝就业平台上进行岗位投递，包含以下功能：
1. 查询用户个人信息使用状态
2. 询问用户是否同意使用个人信息
3. 根据用户意愿进行处理或取消操作
4. 投递岗位

## 使用前提

调用本skill前需要准备以下信息：
- **jobIdList**: 岗位ID列表（来自岗位查询接口返回的jobId）

## ⚠️ 强制流程（必须严格按顺序执行）

**必须严格按以下顺序执行，不可跳过任何步骤：**

1. 先调用 `queryAuth` 查询个人信息使用状态
2. 根据返回的 `isAuthorized` 判断：
   - 若 `isAuthorized` 为 `true`：直接投递岗位
   - 若 `isAuthorized` 为 `false`：**必须先询问用户是否同意使用个人信息**，用户同意后再调用 `saveAuth` 确认，最后投递岗位
3. 只有用户同意后才能调用 `applyJobs` 投递岗位

---

## 详细步骤说明

### 步骤1：查询个人信息使用状态（必须执行）

**首先必须调用查询接口：**

```bash
HTTP_PROXY=http://127.0.0.1:29080 HTTPS_PROXY=http://127.0.0.1:29080 NO_PROXY=127.0.0.1,localhost,::1 NODE_EXTRA_CA_CERTS="/user/mitmproxy-ca-cert.pem" node --use-env-proxy ~/.openclaw/workspace/skills/alipay-job-apply/scripts/alipay-job-apply.js --action queryAuth
```

执行 node --use-env-proxy ~/.openclaw/workspace/skills/alipay-job-apply/scripts/alipay-job-apply.js 的时候，需要在 env 参数中设置环境变量 HTTP_PROXY=http://127.0.0.1:29080 HTTPS_PROXY=http://127.0.0.1:29080 NO_PROXY=127.0.0.1,localhost,::1 NODE_EXTRA_CA_CERTS="/user/mitmproxy-ca-cert.pem"

**返回结果示例：**
```json
{
  "success": true,
  "isAuthorized": false,
  "authInfo": {
    "authList": [
      {
        "authStatus": 0,
        "authType": "USER_INFO"
      }
    ]
  }
}
```

### 步骤2：根据 isAuthorized 判断状态

根据返回结果中的 `isAuthorized` 字段判断用户是否已同意使用个人信息：

- **isAuthorized 为 true**：用户已同意，**直接跳到步骤4（投递岗位）**
- **isAuthorized 为 false**：用户未同意，**必须执行步骤3（询问用户意愿）**

**枚举值映射（不要直接暴露给用户）：**

| authType 枚举值 | 友好名称 |
|----------------|----------|
| USER_INFO | 个人信息使用 |
| APPLY_INFO_SYNC | 投递信息同步 |

**展示要求：**
- 当 isAuthorized 为 false 时，不要输出技术性描述，直接进入步骤3输出授权话术
- 错误示例：USER_INFO：未授权（0）、检测到您尚未同意个人信息使用

### 步骤3：询问用户意愿（未同意时必须执行）

**如果 isAuthorized 为 false，必须先向用户输出以下话术说明，再询问意愿：**

**话术（必须完整输出，不可省略或改写）：**

> 收到！为了帮您投递，需要您授权**姓名**、**电话**和**身份信息**。
>
> 请您放心，**虾宝本身无法直接获取这些信息**。您的数据会在支付宝的安全保护下，仅在调用接口时由系统被动传递给**经过认证的招聘企业**，绝不会泄露给第三方。

然后使用 `ask_user_questions` 工具询问用户：

**问题**：是否同意授权以上信息进行岗位投递？

**选项**：
- 同意授权
- 暂不授权

#### 3.1 用户同意使用

调用确认接口：

```bash
HTTP_PROXY=http://127.0.0.1:29080 HTTPS_PROXY=http://127.0.0.1:29080 NO_PROXY=127.0.0.1,localhost,::1 NODE_EXTRA_CA_CERTS="/user/mitmproxy-ca-cert.pem" node --use-env-proxy ~/.openclaw/workspace/skills/alipay-job-apply/scripts/alipay-job-apply.js --action saveAuth
```

确认成功后，继续执行步骤4（投递岗位）

#### 3.2 用户暂不使用

**立即停止，告知用户无法进行岗位投递，不要调用任何投递接口。**

### 步骤4：投递岗位

用户已同意后，调用投递岗位接口：

```bash
HTTP_PROXY=http://127.0.0.1:29080 HTTPS_PROXY=http://127.0.0.1:29080 NO_PROXY=127.0.0.1,localhost,::1 NODE_EXTRA_CA_CERTS="/user/mitmproxy-ca-cert.pem" node --use-env-proxy ~/.openclaw/workspace/skills/alipay-job-apply/scripts/alipay-job-apply.js --action applyJobs --jobIds "${jobId1},${jobId2}"
```

### 步骤5：输出就业频道跳转链接

> 您可以前往 `[支付宝就业](alipays://platformapi/startapp?appId=2021003160674131)` 查看更多岗位信息和投递状态。

---

## 流程图

```
[开始]
   │
   ▼
[步骤1: 查询个人信息使用状态 queryAuth] ← 必须执行
   │
   ▼
[判断 isAuthorized]
   │
   ├── true ──► [步骤4: 投递岗位 applyJobs] ─► [返回结果+就业频道链接] ─► [结束]
   │
   └── false ──► [步骤3: 询问用户是否同意使用个人信息]
                      │
                      ├──同意──► [调用 saveAuth 确认] ─► [步骤4: 投递岗位] ─► [返回结果+就业频道链接] ─► [结束]
                      │
                      └──暂不使用──► [停止，告知用户无法投递+附就业频道链接] ─► [结束]
```

---

## 参数说明

| 参数 | 说明 |
|------|------|
| --action | 操作类型：queryAuth（查询状态）、saveAuth（确认使用）、applyJobs（岗位投递） |
| --jobIds | 岗位ID列表，多个ID用逗号分隔（仅 applyJobs 操作需要） |

## 接口对照表

| action | 功能 | 何时调用 |
|--------|------|----------|
| queryAuth | 查询个人信息使用状态 | **每次投递前必须先调用** |
| saveAuth | 确认使用个人信息 | 用户同意使用后调用 |
| applyJobs | 岗位投递 | 用户同意后调用 |

## ⚠️ 重要提示

1. **必须先查询状态**：每次投递岗位前，必须先调用 `queryAuth` 查询状态，不能跳过此步骤
2. **必须询问用户意愿**：当 `isAuthorized` 为 `false` 时，必须先询问用户是否同意使用个人信息，用户同意后才能调用 `saveAuth`
3. **用户拒绝则停止**：如果用户选择"暂不使用"，立即停止，不执行任何投递操作
4. **岗位ID来源**：jobId 来源于岗位查询接口的返回结果
5. **输出就业频道跳转链接**：输出：`[支付宝就业](alipays://platformapi/startapp?appId=2021003160674131)`查看更多岗位信息和投递状态。