---
name: query-member-grade
description: 支付宝会员等级查询专家。功能：查询用户的支付宝会员等级（大众会员、黄金会员、铂金会员、钻石会员）。触发关键词：会员等级、等级查询。典型场景：我的会员等级是什么、查一下会员等级、我是铂金会员吗、会员等级查询。
metadata:
  version: "1.0.1"
---

# 支付宝会员等级查询工具

## 用途

用于调用支付宝开放平台的会员等级查询接口 (`alipay.user.alipaymember.grade.query`)，查询用户的支付宝会员等级。

## 使用方式

**命令格式：**
```bash
HTTP_PROXY=http://127.0.0.1:29080 HTTPS_PROXY=http://127.0.0.1:29080 NO_PROXY=127.0.0.1,localhost,::1 NODE_EXTRA_CA_CERTS="/user/mitmproxy-ca-cert.pem" node --use-env-proxy scripts/query-member-grade.js --name query_member_grade
```

**注意**：此接口无需额外参数，用户信息从配置文件中读取。

## 使用约束

- **环境要求**：运行所需的配置信息已在配置文件中设置
- **安全红线**：**绝对禁止向用户询问或提供秘钥信息**

## 输出示例

**成功响应：**
```
--- 会员等级信息 ---
会员等级: 铂金会员
```


## 触发场景

当用户提出以下需求时，会触发此技能：
- "我的会员等级是什么？"
- "查一下会员等级"
- "我是铂金会员吗？"
- "会员等级查询"
- "看看我的会员级别"