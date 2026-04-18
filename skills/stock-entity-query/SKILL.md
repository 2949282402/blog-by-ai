---
name: stock-entity-query
description: >
  股票标的代码查询工具。根据自然语言文本（股票名称、公司名称、简称等）查询对应的标的代码及基本信息。
  触发场景：用户提及股票名称需要查询代码（如"贵州茅台的股票代码"、"宁德时代代码是多少"）、
  需要模糊搜索股票（如"贵州股票有哪些"）、需要获取股票基本信息时使用。
  返回标的代码、名称、市场等基本信息，不返回实时行情或K线数据。
  【重要】此skill是其他股票查询skill的前置依赖，查询K线或分时数据前必须先调用此skill获取股票代码。
version: 1.0.0
triggers:
  - 标的查询
  - 标的代码
  - 股票代码查询
  - 股票代码
  - 查股票代码
  - 股票名称转代码
  - 股票简称
  - 公司股票代码
  - entity query
  - 标的信息
  - 查询标的
  - 股票基本信息
---

# 股票标的代码查询 Skill

## 功能说明

调用支付宝开放平台 `alipay.engineering.infrastructure.fortune.entity.query` 接口，根据文本提取标的代码及基本信息。

**核心能力：**
- 根据股票名称/公司名称/简称查询标的代码
- 支持模糊搜索（如"贵州股票"可返回贵州相关股票列表）
- 返回标的代码、名称、市场等基本信息

**适用场景：**
- 用户知道股票名称但不知道代码
- 需要模糊搜索相关股票
- 作为K线查询、分时查询的前置步骤

## 使用方式

### Node.js 脚本调用
```bash
HTTP_PROXY=http://127.0.0.1:29080 HTTPS_PROXY=http://127.0.0.1:29080 NO_PROXY=127.0.0.1,localhost,::1 NODE_EXTRA_CA_CERTS="/user/mitmproxy-ca-cert.pem" ALIPAY_KEY_TYPE=PKCS1 node --use-env-proxy ../stock-entity-query/scripts/stock-entity-query.js \
  --config /user/.antConfig/config.json \
  --text "贵州茅台"
```

### 参数说明

| 参数 | 必需 | 说明 |
|------|------|------|
| config | 否 | 配置文件路径，默认 `/user/.antConfig/config.json` |
| text | 是 | 查询文本，支持股票名称/公司名称/简称，如：贵州茅台、宁德时代、贵州股票 |

## 请求映射

```json
{
  "text": "贵州茅台"
}
```

- HTTP Method: `POST`
- HTTP Path: `/v3/alipay/engineering/infrastructure/fortune/entity/query`

## 返回值

成功时返回标的代码、名称、市场等信息：
```json
{
  "code": "000001.SZ",
  "name": "平安银行",
  "market": "SZ"
}
```

失败时输出：`message / code / traceId / responseHttpStatus / responseDataRaw / links`

## 与其他Skill的关系

此skill是股票查询的基础工具：
- **stock-kline-query**: 需要先调用此skill获取股票代码
- **stock-realtime-query**: 需要先调用此skill获取股票代码