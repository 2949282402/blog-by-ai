---
name: stock-realtime-query
description: >
  股票分时数据查询工具。查询最近N个交易日的全部分时数据，包括价格、均价、成交量、成交额等。
  触发场景：用户需要查看股票当日走势、分时行情、实时交易明细、分时图时使用
  （如"查询宁德时代今天的分时数据"、"平安银行的分时走势"、"300750.SZ的分时数据"）。
  【重要】必须先通过stock-entity-query获取股票代码，股票代码格式为"代码.市场"（如000001.SZ、600519.SH）。
  【重要】day参数必传，默认1天，最大5天。start参数非必传，用于查询某个时间点后的分时数据。
version: 1.2.0
triggers:
  - 分时数据
  - 分时图
  - 分时行情
  - 股票分时
  - 当日走势
  - 实时行情
  - 分时走势
  - 今日股价
  - 股票实时数据
  - 分钟数据
  - 分时查询
  - realtime
---

# 股票分时数据查询 Skill

## 功能说明

调用支付宝开放平台 `alipay.engineering.infrastructure.stock.realtime.query` 接口，查询指定股票代码的分时数据。

**核心能力：**
- 支持按股票代码查询分时数据
- 查询最近N个交易日的分时数据（最多5天）
- 支持增量查询（通过start参数指定起始时间点）
- 输出全部分时数据供大模型分析

**适用场景：**
- 查看股票当日走势
- 查看实时交易明细
- 绘制分时图
- 统计分析分时数据

## 使用方式

### 前置步骤

**必须先调用 stock-entity-query 获取股票代码**

### Node.js 脚本调用
```bash
HTTP_PROXY=http://127.0.0.1:29080 HTTPS_PROXY=http://127.0.0.1:29080 NO_PROXY=127.0.0.1,localhost,::1 NODE_EXTRA_CA_CERTS="/user/mitmproxy-ca-cert.pem" ALIPAY_KEY_TYPE=PKCS1 node --use-env-proxy ../stock-realtime-query/scripts/stock-realtime-query.js \
  --config /user/.antConfig/config.json \
  --symbol "300750.SZ" \
  --day 3
```

### 参数说明

| 参数 | 必需 | 说明 |
|------|----|------|
| config | 是  | 配置文件路径，默认 `/user/.antConfig/config.json` |
| symbol | 是  | 股票代码，格式：`代码.市场`（如300750.SZ、600519.SH），仅支持沪深市场 |
| day | **是**  | 查询天数，默认1天，最大支持5天 |
| start | 否  | 最早的分时点时间戳（毫秒），用于查询某个时间点后的分时数据 |

## 请求映射

```json
{
  "symbol": "300750.SZ",
  "day": 3,
  "start": 1773970200000
}
```

- HTTP Method: `POST`
- HTTP Path: `/v3/alipay/engineering/infrastructure/stock/realtime/query`

## 使用限制

1. `symbol` 股票代码后缀必须为 `.SH` 或 `.SZ`（仅支持沪深市场）
2. `day` 必传，必须在 1-5 之间

## 返回值格式

成功时返回分时数据，按以下格式输出：

```json
{
  "data": [
    {
      "items": [
        {
          "amount": 530971313,
          "volume": 1316900,
          "averagePrice": 400,
          "price": 400,
          "date": 1773970200000
        }
      ],
      "channel_exchange": "SH",
      "symbol": "300750.SZ"
    }
  ]
}
```

### 字段说明

| 字段 | 说明 |
|------|------|
| amount | 当前周期成交额 |
| volume | 当前周期成交量 |
| averagePrice | 均价 |
| price | 分时点所对应的价格 |
| date | 分时点所在的时间（毫秒时间戳） |
| channel_exchange | 渠道来源交易所 |
| symbol | 标的代码 |

## 辅助工具

该目录下内置了 `timestamp-convert.js` 脚本，用于日期和时间戳的转换。**所有时间戳转换必须使用此脚本**。

```bash
# 日期转时间戳
node timestamp-convert.js -t "2024-01-15 09:30:00"

# 时间戳转日期
node timestamp-convert.js -d 1705276800000
```