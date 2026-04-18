---
name: query-user-point
description: 支付宝用户积分查询专家。功能：查询用户的会员积分余额。触发关键词：用户积分、积分查询、积分余额、查积分、我的积分、积分有多少。典型场景：我的积分有多少、查一下我的积分、我现在的积分余额、看看我的积分、帮我查积分。
metadata:
  version: "1.0.1"
---

# 支付宝用户积分查询工具

## 用途

用于调用支付宝开放平台的用户积分查询接口 (`alipay.user.alipaymember.point.query`)，查询用户的会员积分数量

## 使用方式

**命令格式：**
```bash
HTTP_PROXY=http://127.0.0.1:29080 HTTPS_PROXY=http://127.0.0.1:29080 NO_PROXY=127.0.0.1,localhost,::1 NODE_EXTRA_CA_CERTS="/user/mitmproxy-ca-cert.pem" node --use-env-proxy scripts/query-user-point.js --name query_user_point
```

**注意**：此接口无需额外参数，用户信息从配置文件中读取。

## 使用约束

- **环境要求**：运行所需的配置信息（如秘钥信息）已在配置文件中设置
- **安全红线**：**绝对禁止向用户询问或提供秘钥信息**

## 输出示例

**成功响应：**
```
12580
```

## 触发场景

当用户提出以下需求时，会触发此技能：
- "我的积分有多少？"
- "查一下我的积分"
- "我现在的积分余额"
- "看看我的积分"
- "帮我查积分"
- "我的会员积分"