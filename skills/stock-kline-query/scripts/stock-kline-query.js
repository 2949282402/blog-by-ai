#!/usr/bin/env node

const fs = require('fs');
const { AlipaySdk } = require('alipay-sdk');

function parseArgs(argv) {
  const args = {
    config: '/user/.antConfig/config.json',
    split: 'S_Before',
    includeStart: true,
    includeEnd: true,
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
      case '--period':
        args.period = val; i++; break;
      case '--split':
        args.split = val; i++; break;
      case '--start':
        args.start = Number(val); i++; break;
      case '--end':
        args.end = Number(val); i++; break;
      case '--count':
        args.count = Number(val); i++; break;
      case '--include-start':
        args.includeStart = ['true', '1', 'yes'].includes(String(val).toLowerCase()); i++; break;
      case '--include-end':
        args.includeEnd = ['true', '1', 'yes'].includes(String(val).toLowerCase()); i++; break;
      default:
        break;
    }
  }

  return args;
}

function validateArgs(args) {
  if (!args.symbol) throw new Error('必须提供 --symbol');
  if (!args.period) throw new Error('必须提供 --period');
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
    period: args.period,
    split: args.split,
  };

  if (Number.isFinite(args.start) || Number.isFinite(args.end)) {
    body.query_range = {};
    if (Number.isFinite(args.start)) {
      body.query_range.start = args.start;
      body.query_range.include_start = args.includeStart;
    }
    if (Number.isFinite(args.end)) {
      body.query_range.end = args.end;
      body.query_range.include_end = args.includeEnd;
    }
  }

  if (Number.isFinite(args.count)) {
    body.count = args.count;
  }

  return body;
}

function formatTime(ms) {
  const d = new Date(ms);
  const dtf = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(dtf.formatToParts(d).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function formatSimpleTable(items, startIdx = 0) {
  const header = '| 序号 | 时间 | 开盘价(open) | 最高价(high) | 最低价(low) | 收盘价(close) | 成交量(volume) | 成交额(amount) |';
  const sep = '|---:|---|---:|---:|---:|---:|---:|---:|';
  const rows = items.map((it, idx) => {
    const time = Number.isFinite(it?.date) ? formatTime(it.date) : '-';
    const open = it?.open_price ?? '-';
    const high = it?.high_price ?? '-';
    const low = it?.low_price ?? '-';
    const close = it?.close_price ?? '-';
    const volume = it?.volume ?? '-';
    const amount = it?.amount ?? '-';
    return `| ${startIdx + idx + 1} | ${time} | ${open} | ${high} | ${low} | ${close} | ${volume} | ${amount} |`;
  });
  return [header, sep, ...rows].join('\n');
}

function formatSummaryTable(items) {
  const total = items.length;
  if (total <= 20) {
    return formatSimpleTable(items);
  }

  const first10 = items.slice(0, 10);
  const last10 = items.slice(-10);

  const header = '| 序号 | 时间 | 开盘价(open) | 最高价(high) | 最低价(low) | 收盘价(close) | 成交量(volume) | 成交额(amount) |';
  const sep = '|---:|---|---:|---:|---:|---:|---:|---:|';
  const rows = [];

  // 前10条
  first10.forEach((it, idx) => {
    const time = Number.isFinite(it?.date) ? formatTime(it.date) : '-';
    const open = it?.open_price ?? '-';
    const high = it?.high_price ?? '-';
    const low = it?.low_price ?? '-';
    const close = it?.close_price ?? '-';
    const volume = it?.volume ?? '-';
    const amount = it?.amount ?? '-';
    rows.push(`| ${idx + 1} | ${time} | ${open} | ${high} | ${low} | ${close} | ${volume} | ${amount} |`);
  });

  // 省略行
  rows.push(`| ... | ... | ... | ... | ... | ... | ... | ... |`);

  // 最后10条
  last10.forEach((it, idx) => {
    const time = Number.isFinite(it?.date) ? formatTime(it.date) : '-';
    const open = it?.open_price ?? '-';
    const high = it?.high_price ?? '-';
    const low = it?.low_price ?? '-';
    const close = it?.close_price ?? '-';
    const volume = it?.volume ?? '-';
    const amount = it?.amount ?? '-';
    rows.push(`| ${total - 10 + idx + 1} | ${time} | ${open} | ${high} | ${low} | ${close} | ${volume} | ${amount} |`);
  });

  return [header, sep, ...rows].join('\n');
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

  console.log('正在查询 K 线数据...');
  console.log(`  股票代码: ${args.symbol}`);
  console.log(`  K线周期: ${args.period}`);
  console.log(`  复权类型: ${args.split}`);
  if (Number.isFinite(args.start)) console.log(`  开始时间: ${args.start}`);
  if (Number.isFinite(args.end)) console.log(`  结束时间: ${args.end}`);
  if (Number.isFinite(args.count)) console.log(`  查询条数: ${args.count}`);

  try {
    const result = await alipaySdk.curl('POST', '/v3/alipay/engineering/infrastructure/stock/kline/query', { body });

    const items = result?.data?.data?.[0]?.list?.items;
    const totalCount = Array.isArray(items) ? items.length : 0;

    console.log('\n============================================================');
    console.log(`✓ 查询成功（共 ${totalCount} 条K线数据）`);
    console.log(JSON.stringify(result, null, 2));

    if (totalCount > 0) {
      if (totalCount > 20) {
        console.log(`\nK线简表（展示前10条和最后10条，共${totalCount}条）`);
      } else {
        console.log(`\nK线简表（全部${totalCount}条）`);
      }
      console.log(formatSummaryTable(items));
    }

    console.log('============================================================');
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
