#!/usr/bin/env node

const fs = require('fs');
const { AlipaySdk } = require('alipay-sdk');

function parseArgs(argv) {
  const args = {
    config: '/user/.antConfig/config.json',
  };

  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    const val = argv[i + 1];
    if (!key.startsWith('--')) continue;

    switch (key) {
      case '--config':
        args.config = val; i++; break;
      case '--text':
        args.text = val; i++; break;
      default:
        break;
    }
  }

  return args;
}

function validateArgs(args) {
  if (!args.text) throw new Error('必须提供 --text');
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
  return {
    text: args.text,
  };
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

  console.log('正在查询标的代码及基本信息...');
  console.log(`  查询文本: ${args.text}`);

  try {
    const result = await alipaySdk.curl('POST', '/v3/alipay/engineering/infrastructure/fortune/entity/query', { body });
    console.log('\n============================================================');
    console.log('✓ 查询成功');
    console.log(JSON.stringify(result, null, 2));
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