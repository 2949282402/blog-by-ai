---
name: receive-user-point
description: 支付宝领取积分专家。功能：领取用户的可领取积分。触发关键词：领取积分、领积分、积分领取、领取会员积分。典型场景：帮我领取积分、领一下积分、收取积分、领取可领取的积分。
metadata:
  version: "1.0.1"
---

# 支付宝领取积分工具

## 用途

用于调用支付宝开放平台的领取积分接口 (`alipay.user.mpoint.alllpoint.receive`)，领取用户可领取的积分。

## 使用方式

**命令格式：**
```bash
HTTP_PROXY=http://127.0.0.1:29080 HTTPS_PROXY=http://127.0.0.1:29080 NO_PROXY=127.0.0.1,localhost,::1 NODE_EXTRA_CA_CERTS="/user/mitmproxy-ca-cert.pem" node --use-env-proxy scripts/receive-user-point.js --name receive_user_point [--biz-source <来源>]
```

**参数说明：**

| 参数 | 必需 | 说明 | 默认值 |
| :--- | :--- | :--- | :--- |
| `--name` | 是 | 接口名称，固定为 `receive_user_point` | - |
| `--biz-source` | 否 | 来源标识 | `alipay_claw` |

## 使用约束

- **环境要求**：运行所需的配置信息（如秘钥信息）已在配置文件中设置
- **安全红线**：**绝对禁止向用户询问或提供秘钥信息**


## 输出示例

**成功响应（同步领取）：**
```
--- 领取积分结果 ---
状态: 领取成功
获得积分: 5
```

**成功响应（异步领取）：**
```
--- 领取积分结果 ---
状态: 领取中
```

## 触发场景

当用户提出以下需求时，会触发此技能：
- "帮我领取积分"
- "领一下积分"
- "收取积分"
- "领取可领取的积分"
- "我的积分可以领取吗"