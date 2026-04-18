---
name: alipay-job-query
description: 根据城市和岗位类型查询支付宝上的岗位列表信息。返回岗位链接、名称、薪资、工作地点等详细信息。使用场景包括：查询杭州服务员岗位、查找上海java开发、筛选城市招聘等与支付宝就业服务相关的查询。
---

# 支付宝岗位查询

## 功能概述

该技能用于查询支付宝上的岗位列表，支持按城市和岗位类型进行筛选，返回岗位的链接、名称、薪资、工作地点等详细信息。

## 查询参数构造

根据用户输入的城市和岗位类型，构造对应的查询参数：

### 常见城市代码

- 330100 - 杭州
- 310100 - 上海
- 110100 - 北京
- 440100 - 广州
- 440300 - 深圳

（更多城市代码可根据实际返回结果获取）

### 常见岗位类型代码

- fuwuyuan - 服务员
- canyin - 餐饮
- baomu - 保姆
- zhongdiangong - 钟点工
- chushi - 厨师
- peisongyuan - 外卖骑手
- baojie - 保洁
- baoan - 保安
- yingyeyuan - 营业员
- pugongcaozuogong - 普工/操作工
- diangong - 电工
- java - Java
- s_houduankaifa - 后端开发
- ceshigongchengshi - 测试工程师
- kefu - 客服
- yunying - 运营
- xiaoshou - 销售
- hushi - 护士
- chanpinjingli - 产品经理

## 工作流程

**调用岗位查询脚本**
```bash
HTTP_PROXY=http://127.0.0.1:29080 HTTPS_PROXY=http://127.0.0.1:29080 NO_PROXY=127.0.0.1,localhost,::1 NODE_EXTRA_CA_CERTS="/user/mitmproxy-ca-cert.pem" node --use-env-proxy ~/.openclaw/workspace/skills/alipay-job-query/scripts/alipay-job-query.js --cityCode "城市代码" --cityName "城市名称" --typeCode "岗位类型代码" --typeName "岗位类型名称"
```

执行 node --use-env-proxy ~/.openclaw/workspace/skills/alipay-job-query/scripts/alipay-job-query.js 的时候，需要在 env 参数中设置环境变量 HTTP_PROXY=http://127.0.0.1:29080 HTTPS_PROXY=http://127.0.0.1:29080 NO_PROXY=127.0.0.1,localhost,::1 NODE_EXTRA_CA_CERTS="/user/mitmproxy-ca-cert.pem"

## 使用示例

### 示例1：查询杭州服务员岗位

用户输入："帮我查下杭州的服务员工作"

```bash
HTTP_PROXY=http://127.0.0.1:29080 HTTPS_PROXY=http://127.0.0.1:29080 NO_PROXY=127.0.0.1,localhost,::1 NODE_EXTRA_CA_CERTS="/user/mitmproxy-ca-cert.pem" node --use-env-proxy ~/.openclaw/workspace/skills/alipay-job-query/scripts/alipay-job-query.js --cityCode "330100" --cityName "杭州" --typeCode "fuwuyuan" --typeName "服务员"
```

### 示例2：查询上海外卖骑手岗位

用户输入："上海有没有外卖骑手的工作"

```bash
HTTP_PROXY=http://127.0.0.1:29080 HTTPS_PROXY=http://127.0.0.1:29080 NO_PROXY=127.0.0.1,localhost,::1 NODE_EXTRA_CA_CERTS="/user/mitmproxy-ca-cert.pem" node --use-env-proxy ~/.openclaw/workspace/skills/alipay-job-query/scripts/alipay-job-query.js --cityCode "310100" --cityName "上海" --typeCode "peisongyuan" --typeName "外卖骑手"
```

## 输出格式

脚本返回 JSON 格式结果，包含岗位列表和 jobId 信息：

```json
{
  "success": true,
  "totalCount": 15,
  "displayedCount": 10,
  "city": "杭州市",
  "jobType": "服务员",
  "jobList": [
    {
      "index": 1,
      "jobId": "20881115704491902025040200006663706",
      "jobName": "餐饮服务员",
      "salary": "6000-8000元/月",
      "address": "杭州市西湖区文一路123号",
      "jobDetailUrl": "alipays://..."
    }
  ]
}
```

## 重要：记住 jobId

**必须记住每个岗位的 `jobId` 字段，用于后续岗位投递。**

当用户选择投递某个岗位时，需要使用对应的 `jobId` 调用 `alipay-job-apply` skill 进行投递。

### 输出展示格式

将岗位列表以表格形式展示给用户（最多展示10条）：

| 序号 | 岗位名称 | 薪资范围 | 工作地点 | 投递链接 |
|:---:|---------|---------|---------|---------|
| 1 | XXX | XXX | XXX | [查看详情](URL) |

### 输出示例

```
为您找到以下杭州市服务员岗位（共 2 个）：

| 序号 | 岗位名称 | 薪资范围 | 工作地点 | 投递链接 |
|:---:|---------|---------|---------|---------|
| 1 | 餐饮服务员 | 6000-8000元/月 | 杭州市西湖区文一路123号 | [查看详情](alipays://...) |
| 2 | 酒店客房服务员 | 5000-7000元/月 | 杭州市拱墅区武林路456号 | [查看详情](alipays://...) |

提示：点击「查看详情」可查看岗位详情或投递简历。如需投递，请告诉我岗位序号。
```

## 注意事项

- 执行 `node --use-env-proxy ~/.openclaw/workspace/skills/alipay-job-query/scripts/alipay-job-query.js` 的时候，需要在 env 参数中设置环境变量 `HTTP_PROXY=http://127.0.0.1:29080 HTTPS_PROXY=http://127.0.0.1:29080 NO_PROXY=127.0.0.1,localhost,::1 NODE_EXTRA_CA_CERTS="/user/mitmproxy-ca-cert.pem"`
- 跳转链接为 `alipays://` 协议，在支付宝内可直接打开
- 城市代码和岗位类型代码需要根据实际情况对应
- **必须记住每个岗位的 `jobId`，用于后续调用 `alipay-job-apply` skill 进行岗位投递**
- 每次查询最多展示 10 条岗位，如需投递请让用户告知岗位序号