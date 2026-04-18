#!/usr/bin/env node

/**
 * 时间戳转换工具 - 用于支付宝 K 线查询
 * 支持毫秒级时间戳与日期字符串之间的相互转换
 */

function showHelp() {
  console.log(`
用法: node timestamp-convert.js [选项] <值>

选项:
  --to-ts, -t <日期>     将日期转换为毫秒时间戳
  --to-date, -d <时间戳> 将毫秒时间戳转换为日期
  --now, -n              获取当前时间的毫秒时间戳
  --range, -r <天数>     生成相对于今天的时间范围（用于K线查询）

日期格式:
  - ISO 8601: 2024-01-15, 2024-01-15T09:30:00
  - 简化格式: 20240115, 2024/01/15
  - 相对时间: today, yesterday, tomorrow

示例:
  # 日期转时间戳
  node timestamp-convert.js -t "2024-01-15"
  node timestamp-convert.js -t "2024-01-15 09:30:00"

  # 时间戳转日期
  node timestamp-convert.js -d 1705276800000

  # 获取当前时间戳
  node timestamp-convert.js -n

  # 生成时间范围（最近30天）
  node timestamp-convert.js -r 30
`);
}

function parseArgs(argv) {
  const args = { action: null, value: null };

  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    const val = argv[i + 1];

    switch (key) {
      case '--to-ts':
      case '-t':
        args.action = 'to-timestamp';
        args.value = val;
        i++;
        break;
      case '--to-date':
      case '-d':
        args.action = 'to-date';
        args.value = val;
        i++;
        break;
      case '--now':
      case '-n':
        args.action = 'now';
        break;
      case '--range':
      case '-r':
        args.action = 'range';
        args.value = val;
        i++;
        break;
      case '--help':
      case '-h':
        args.action = 'help';
        break;
      default:
        break;
    }
  }

  return args;
}

function parseDate(input) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 处理相对时间
  if (input.toLowerCase() === 'today') {
    return today.getTime();
  }
  if (input.toLowerCase() === 'yesterday') {
    return today.getTime() - 24 * 60 * 60 * 1000;
  }
  if (input.toLowerCase() === 'tomorrow') {
    return today.getTime() + 24 * 60 * 60 * 1000;
  }

  // 尝试直接解析
  let date = new Date(input);
  if (!isNaN(date.getTime())) {
    return date.getTime();
  }

  // 处理 YYYYMMDD 格式
  if (/^\d{8}$/.test(input)) {
    const year = input.slice(0, 4);
    const month = input.slice(4, 6);
    const day = input.slice(6, 8);
    date = new Date(`${year}-${month}-${day}`);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
  }

  // 处理 YYYY/MM/DD 格式
  if (/^\d{4}\/\d{2}\/\d{2}/.test(input)) {
    date = new Date(input.replace(/\//g, '-'));
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
  }

  throw new Error(`无法解析日期: ${input}`);
}

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

function toTimestamp(value) {
  try {
    const ts = parseDate(value);
    const formatted = formatDate(ts);

    console.log('\n============================================================');
    console.log('日期转时间戳');
    console.log('============================================================');
    console.log(`  输入日期: ${value}`);
    console.log(`  毫秒时间戳: ${ts}`);
    console.log(`  秒级时间戳: ${Math.floor(ts / 1000)}`);
    console.log(`  格式化日期: ${formatted.full}`);
    console.log('============================================================\n');

    return ts;
  } catch (err) {
    console.error(`错误: ${err.message}`);
    process.exit(1);
  }
}

function toDate(value) {
  try {
    const ts = Number(value);
    const formatted = formatDate(ts);

    console.log('\n============================================================');
    console.log('时间戳转日期');
    console.log('============================================================');
    console.log(`  毫秒时间戳: ${ts}`);
    console.log(`  秒级时间戳: ${Math.floor(ts / 1000)}`);
    console.log(`  本地时间:   ${formatted.full}`);
    console.log(`  ISO 8601:   ${formatted.iso}`);
    console.log(`  日期:       ${formatted.date}`);
    console.log('============================================================\n');
  } catch (err) {
    console.error(`错误: ${err.message}`);
    process.exit(1);
  }
}

function showNow() {
  const now = Date.now();
  const formatted = formatDate(now);

  console.log('\n============================================================');
  console.log('当前时间');
  console.log('============================================================');
  console.log(`  毫秒时间戳: ${now}`);
  console.log(`  秒级时间戳: ${Math.floor(now / 1000)}`);
  console.log(`  本地时间:   ${formatted.full}`);
  console.log(`  ISO 8601:   ${formatted.iso}`);
  console.log('============================================================\n');
}

function showRange(days) {
  const daysNum = Number(days);
  if (isNaN(daysNum) || daysNum <= 0) {
    console.error('错误: 天数必须是正整数');
    process.exit(1);
  }

  const now = Date.now();
  const start = now - daysNum * 24 * 60 * 60 * 1000;

  const startFormatted = formatDate(start);
  const endFormatted = formatDate(now);

  console.log('\n============================================================');
  console.log(`时间范围 (${days} 天)`);
  console.log('============================================================');
  console.log('\n开始时间:');
  console.log(`  毫秒时间戳: ${start}`);
  console.log(`  本地时间:   ${startFormatted.full}`);
  console.log('\n结束时间:');
  console.log(`  毫秒时间戳: ${now}`);
  console.log(`  本地时间:   ${endFormatted.full}`);
  console.log('\nK 线查询命令示例:');
  console.log('------------------------------------------------------------');
  console.log(`node alipay-kline-query.js \\`);
  console.log(`  --symbol "000001.SZ" \\`);
  console.log(`  --period "P_Day1" \\`);
  console.log(`  --start ${start} \\`);
  console.log(`  --end ${now}`);
  console.log('============================================================\n');
}

function main() {
  const args = parseArgs(process.argv);

  switch (args.action) {
    case 'to-timestamp':
      if (!args.value) {
        console.error('错误: 请提供日期值');
        showHelp();
        process.exit(1);
      }
      toTimestamp(args.value);
      break;
    case 'to-date':
      if (!args.value) {
        console.error('错误: 请提供时间戳值');
        showHelp();
        process.exit(1);
      }
      toDate(args.value);
      break;
    case 'now':
      showNow();
      break;
    case 'range':
      if (!args.value) {
        console.error('错误: 请提供天数');
        showHelp();
        process.exit(1);
      }
      showRange(args.value);
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

main();