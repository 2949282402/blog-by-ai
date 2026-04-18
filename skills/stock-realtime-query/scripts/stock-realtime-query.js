#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { AlipaySdk } = require('alipay-sdk');

// 从 timestamp-convert.js 提取 formatDate 函数
// 所有时间戳转换必须使用此函数
function formatDate(timestamp) {
  const date = new Date(Number(timestamp));
  if (isNaN(date.getTime())) {
    throw new Error(`无效的时间戳: ${timestamp}`);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return {
    full: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
    date: `${year}-${month}-${day}`,
    iso: date.toISOString(),
    local: date.toLocaleString('zh-CN'),
    timestamp: date.getTime(),
  };
}

function parseArgs(argv) {
  const args = {
    config: '/user/.antConfig/config.json',
    day: 1, // 默认1天
  };

  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    const val = argv[i + 1];
    if (!key.startsWith('--')) continue;

    switch (key) {
      case '--config':
        args.config = val; i++; break;
      case '--symbol':
        args.symbol = val; i++; break;
      case '--day':
        args.day = Number(val); i++; break;
      case '--start':
        args.start = Number(val); i++; break;
      default:
        break;
    }
  }

  return args;
}

function validateArgs(args) {
  if (!args.symbol) throw new Error('必须提供 --symbol');
  if (!Number.isFinite(args.day)) throw new Error('必须提供 --day');
  if (args.day < 1 || args.day > 5) throw new Error('--day 必须在 1-5 之间');
}

function toPem(key, type, keyType) {
  if (!key) return '';
  const trimmed = String(key).trim();
  if (trimmed.startsWith('-----BEGIN')) return trimmed;

  const body = trimmed.replace(/\s+/g, '');
  const wrapped = body.match(/.{1,64}/g)?.join('\n') || body;

  if (type === 'public') {
    return `-----BEGIN PUBLIC KEY-----\n${wrapped}\n-----END PUBLIC KEY-----`;
  }

  if (keyType === 'PKCS1') {
    return `-----BEGIN RSA PRIVATE KEY-----\n${wrapped}\n-----END RSA PRIVATE KEY-----`;
  }

  return `-----BEGIN PRIVATE KEY-----\n${wrapped}\n-----END PRIVATE KEY-----`;
}

function buildBody(args) {
  const body = {
    symbol: args.symbol,
    day: args.day,
  };

  if (Number.isFinite(args.start)) {
    body.start = args.start;
  }

  return body;
}

/**
 * 格式化单条分时数据
 * 使用 timestamp-convert.js 的 formatDate 函数进行时间转换
 */
function formatRealtimeItem(item) {
  const timeFormatted = Number.isFinite(item?.date) ? formatDate(item.date) : null;
  return {
    amount: item?.amount ?? 0,
    volume: item?.volume ?? 0,
    averagePrice: item?.average_price ?? item?.averagePrice ?? 0,
    price: item?.price ?? 0,
    date: item?.date ?? 0,
    time: timeFormatted ? timeFormatted.full : '-',
  };
}

/**
 * 输出全部分时数据，按指定格式
 */
function outputAllRealtimeData(dataArray) {
  console.log('\n============================================================');
  console.log('分时数据详情（全部数据）');
  console.log('============================================================');

  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    console.log('无分时数据');
    return;
  }

  dataArray.forEach((entry, entryIdx) => {
    const symbol = entry?.symbol ?? '-';
    const channelExchange = entry?.list?.channel_exchange ?? entry?.channel_exchange ?? '-';
    const items = entry?.list?.items ?? entry?.items ?? [];

    console.log(`\n【标的 ${entryIdx + 1}】symbol: ${symbol}, channel_exchange: ${channelExchange}`);
    console.log(`分时数据条数: ${items.length}`);

    if (items.length > 0) {
      console.log('\n| 序号 | 时间 | 价格(price) | 均价(averagePrice) | 成交量(volume) | 成交额(amount) |');
      console.log('|---:|---|---:|---:|---:|---:|');

      items.forEach((it, idx) => {
        const formatted = formatRealtimeItem(it);
        console.log(`| ${idx + 1} | ${formatted.time} | ${formatted.price} | ${formatted.averagePrice} | ${formatted.volume} | ${formatted.amount} |`);
      });
    }
  });

  console.log('\n============================================================');
}

/**
 * 输出标准JSON格式数据
 * 格式定义:
 * data: [
 *   {
 *     items: [
 *       {
 *         amount: 当前周期成交额,
 *         volume: 当前周期成交量,
 *         averagePrice: 均价,
 *         price: 分时点所对应的价格,
 *         date: 分时点所在的时间(毫秒时间戳)
 *       }
 *     ],
 *     channel_exchange: 渠道来源交易所,
 *     symbol: 标的代码
 *   }
 * ]
 */
function outputStandardJson(dataArray) {
  const result = {
    data: dataArray.map((entry) => ({
      items: (entry?.list?.items ?? entry?.items ?? []).map((it) => ({
        amount: it?.amount ?? 0,
        volume: it?.volume ?? 0,
        averagePrice: it?.average_price ?? it?.averagePrice ?? 0,
        price: it?.price ?? 0,
        date: it?.date ?? 0,
      })),
      channel_exchange: entry?.list?.channel_exchange ?? entry?.channel_exchange ?? '-',
      symbol: entry?.symbol ?? '-',
    })),
  };

  console.log('\n【标准JSON格式】');
  console.log(JSON.stringify(result, null, 2));
}

async function main() {
  const args = parseArgs(process.argv);
  validateArgs(args);

  const config = JSON.parse(fs.readFileSync(args.config, 'utf8'));
  const appId = config['X-OpenPlatform-appId'];

  const keyType = config.keyType || process.env.ALIPAY_KEY_TYPE || 'PKCS8';
  const privateKey = toPem(config['X-OpenPlatform-PrivateKey'], 'private', keyType);
  const alipayPublicKey = toPem(config['X-OpenPlatform-alipayPublicKey'], 'public', keyType);

  const alipaySdk = new AlipaySdk({
    appId,
    privateKey,
    alipayPublicKey,
    endpoint: 'https://openapi.alipay.com',
    keyType,
  });

  const body = buildBody(args);

  console.log('正在查询分时数据...');
  console.log(`  股票代码: ${args.symbol}`);
  console.log(`  查询天数: ${args.day}`);
  if (Number.isFinite(args.start)) {
    const startFormatted = formatDate(args.start);
    console.log(`  起始时间: ${startFormatted.full} (时间戳: ${args.start})`);
  }

  try {
    const result = await alipaySdk.curl('POST', '/v3/alipay/engineering/infrastructure/stock/realtime/query', { body });

    // 处理返回数据，筛选start之后的数据
    if (Array.isArray(result?.data?.data)) {
      result.data.data = result.data.data.map((entry) => {
        const items = entry?.list?.items ?? entry?.items ?? [];
        if (Array.isArray(items) && Number.isFinite(args.start)) {
          const filteredItems = items.filter((it) => {
            if (!Number.isFinite(it?.date)) return false;
            return it.date >= args.start;
          });
          // 更新到正确的位置
          if (entry?.list?.items) {
            entry.list.items = filteredItems;
          } else if (entry?.items) {
            entry.items = filteredItems;
          }
        }
        return entry;
      });
    }

    const dataArray = result?.data?.data ?? [];
    let totalCount = 0;
    dataArray.forEach((entry) => {
      const items = entry?.list?.items ?? entry?.items ?? [];
      totalCount += items.length;
    });

    console.log('\n============================================================');
    console.log(`✓ 查询成功（共 ${totalCount} 条分时数据）`);
    console.log('============================================================');

    // 输出全部分时数据表格
    outputAllRealtimeData(dataArray);

    // 输出原始响应（供调试）
    console.log('\n【原始响应数据】');
    console.log(JSON.stringify(result, null, 2));

  } catch (err) {
    console.log('\n============================================================');
    console.log('✗ 查询失败');
    console.log(`  message: ${err?.message || ''}`);
    console.log(`  code: ${err?.code || ''}`);
    console.log(`  traceId: ${err?.traceId || ''}`);
    console.log(`  responseHttpStatus: ${err?.responseHttpStatus || ''}`);
    if (err?.responseDataRaw) {
      console.log(`  responseDataRaw: ${err.responseDataRaw}`);
    }
    if (err?.links) {
      console.log(`  links: ${JSON.stringify(err.links)}`);
    }
    console.log('============================================================');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(`执行错误: ${e.message}`);
  process.exit(1);
});