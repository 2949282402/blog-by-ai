---
name: query-member-privilege
description: 支付宝会员特权查询专家。功能：查询用户的会员等级特权信息列表。触发关键词：会员特权、特权查询、我的特权、会员权益。典型场景：我的会员特权有哪些、查一下会员特权、会员权益查询。
metadata:
  version: "1.0.1"
---

# 支付宝会员特权查询工具

## 用途

用于调用支付宝开放平台的会员特权查询接口 (`alipay.user.privilege.skill.query`)，查询用户的会员等级特权信息列表。每项特权附带跳转链接，支持直接点击查看详情；同时提供会员特权入口链接，方便用户统一查看所有权益。

## 使用方式

**命令格式：**
```bash
HTTP_PROXY=http://127.0.0.1:29080 HTTPS_PROXY=http://127.0.0.1:29080 NO_PROXY=127.0.0.1,localhost,::1 NODE_EXTRA_CA_CERTS="/user/mitmproxy-ca-cert.pem" node --use-env-proxy scripts/query-member-privilege.js --name query_member_privilege [--city-code <城市码>] [--latitude <纬度>] [--longitude <经度>]
```

**参数说明：**

| 参数 | 必需 | 说明 |
| :--- | :--- | :--- |
| `--name` | 是 | 接口名称，固定为 `query_member_privilege` |
| `--city-code` | 否 | 城市码 |
| `--latitude` | 否 | 用户纬度信息 |
| `--longitude` | 否 | 用户经度信息 |

## 使用约束

- **环境要求**：运行所需的配置信息已在配置文件中设置
- **安全红线**：**绝对禁止向用户询问或提供秘钥信息**

## 输出示例

**成功响应：**

[查看会员特权](alipays://platformapi/startapp?appId=68687805&url=https%3A%2F%2Frender.alipay.com%2Fp%2Fyuyan%2F180020380000000023%2Fhome-page.html%3FchInfo%3Dch_aclaw)

```
## 会员特权列表

- [淘票票新片优惠](alipays://platformapi/startapp?appId=68687805&url=https%3A%2F%2Frender.alipay.com%2Fp%2Fyuyan%2F180020010001280261%2Fmember-grade.html%3FtopPrivilegeId%3D{privilege_id}%26source%3Dch_aclaw%26chInfo%3Dch_aclaw)
- [饿了么会员红包](alipays://platformapi/startapp?appId=68687805&url=https%3A%2F%2Frender.alipay.com%2Fp%2Fyuyan%2F180020010001280261%2Fmember-grade.html%3FtopPrivilegeId%3D{privilege_id}%26source%3Dch_aclaw%26chInfo%3Dch_aclaw)
- 免费提现额度
```

> 说明：每项特权以 `[特权名称](链接)` 的 markdown 链接格式输出，链接跳转至对应特权详情页；若特权无 ID 则降级为纯文本展示。末尾附带会员特权入口链接。

**失败响应：**

```
## 查询失败

**错误信息：** <错误描述>

[查看会员特权](alipays://platformapi/startapp?appId=68687805&url=https%3A%2F%2Frender.alipay.com%2Fp%2Fyuyan%2F180020380000000023%2Fhome-page.html%3FchInfo%3Dch_aclaw)
```

## 触发场景

当用户提出以下需求时，会触发此技能：
- "我的会员特权有哪些？"
- "查一下会员特权"
- "会员权益查询"
- "查看我的特权"