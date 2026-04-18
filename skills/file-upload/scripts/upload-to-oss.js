#!/usr/bin/env node

/**
 * OSS 直传脚本 — 使用服务端签名直传文件到阿里云 OSS
 *
 * 用法:
 *   node upload-to-oss.js <filePath> <host> <key> <policy> <signature> \
 *     <credential> <ossDate> <contentType>
 *
 * 所有上传参数由 MCP get_oss_upload_signature 工具返回。
 * 本脚本仅使用 Node.js 标准库，无外部依赖。
 * 支持流式上传大文件（最大 5GB）。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ─── 参数解析 ───────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length < 8) {
    process.stderr.write(
      'Usage: node upload-to-oss.js <filePath> <host> <key> <policy> <signature> <credential> <ossDate> <contentType>\n'
    );
    process.exit(1);
  }
  return {
    filePath: args[0],
    host: args[1],
    key: args[2],
    policy: args[3],
    signature: args[4],
    credential: args[5],
    ossDate: args[6],
    contentType: args[7],
  };
}

// ─── 格式化文件大小 ─────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

// ─── multipart/form-data 构建 ───────────────────────────────

function buildMultipartField(boundary, name, value) {
  return `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;
}

function buildMultipartFileHeader(boundary, filename, contentType) {
  return (
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
    `Content-Type: ${contentType}\r\n` +
    `\r\n`
  );
}

function buildMultipartEpilogue(boundary) {
  return `\r\n--${boundary}--\r\n`;
}

// ─── 解析 OSS XML 错误响应 ──────────────────────────────────

function parseOssError(xml) {
  const codeMatch = xml.match(/<Code>(.*?)<\/Code>/);
  const msgMatch = xml.match(/<Message>(.*?)<\/Message>/);
  const code = codeMatch ? codeMatch[1] : 'UnknownError';
  const message = msgMatch ? msgMatch[1] : xml.slice(0, 200);
  return { code, message };
}

// ─── 流式上传到 OSS ─────────────────────────────────────────

function uploadToOss(config, fileSize) {
  return new Promise((resolve, reject) => {
    const boundary = '----OSSUploadBoundary' + Date.now().toString(36) + Math.random().toString(36).slice(2);
    const filename = path.basename(config.filePath);

    // 构建 Content-Disposition 值（RFC 6266: ASCII fallback + UTF-8 扩展）
    const safeFilename = encodeURIComponent(filename);
    const asciiFallback = filename.replace(/[^\x20-\x7E]/g, '_');
    const contentDisposition = `attachment; filename="${asciiFallback}"; filename*=UTF-8''${safeFilename}`;

    // 表单字段顺序：OSS 要求 file 字段必须在最后
    // 注意：PostObject 的元数据（Content-Disposition 等）必须作为表单字段传递，不能放在 HTTP header 中
    const fields = [
      buildMultipartField(boundary, 'success_action_status', '200'),
      buildMultipartField(boundary, 'Content-Type', config.contentType),
      buildMultipartField(boundary, 'Content-Disposition', contentDisposition),
      buildMultipartField(boundary, 'key', config.key),
      buildMultipartField(boundary, 'policy', config.policy),
      buildMultipartField(boundary, 'x-oss-signature', config.signature),
      buildMultipartField(boundary, 'x-oss-signature-version', 'OSS4-HMAC-SHA256'),
      buildMultipartField(boundary, 'x-oss-credential', config.credential),
      buildMultipartField(boundary, 'x-oss-date', config.ossDate),
    ];

    const preamble = Buffer.from(fields.join(''), 'utf8');
    const fileHeader = Buffer.from(buildMultipartFileHeader(boundary, filename, config.contentType), 'utf8');
    const epilogue = Buffer.from(buildMultipartEpilogue(boundary), 'utf8');

    // 精确计算 Content-Length
    const contentLength = preamble.length + fileHeader.length + fileSize + epilogue.length;

    const url = new URL(config.host);
    const proto = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': contentLength,
      },
      timeout: 600000, // 10 分钟超时
    };

    const req = proto.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body });
        } else {
          const ossErr = parseOssError(body);
          reject(new Error(`OSS upload failed (HTTP ${res.statusCode}): ${ossErr.code} - ${ossErr.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('OSS upload timeout (600s)'));
    });

    // 写入 preamble（文本字段）
    req.write(preamble);
    // 写入 file header
    req.write(fileHeader);

    // 流式写入文件内容
    const fileStream = fs.createReadStream(config.filePath);
    fileStream.on('error', (err) => {
      req.destroy();
      reject(new Error(`File read error: ${err.message}`));
    });
    fileStream.on('end', () => {
      // 写入 epilogue 并结束请求
      req.end(epilogue);
    });
    fileStream.pipe(req, { end: false });
  });
}

// ─── 主逻辑 ─────────────────────────────────────────────────

async function main() {
  const config = parseArgs(process.argv);

  // 验证文件存在
  if (!fs.existsSync(config.filePath)) {
    process.stderr.write(`Error: File not found: ${config.filePath}\n`);
    process.exit(1);
  }

  const stat = fs.statSync(config.filePath);
  const fileSize = stat.size;
  const filename = path.basename(config.filePath);

  process.stderr.write(`Uploading: ${filename} (${formatBytes(fileSize)}) → OSS direct upload\n`);

  await uploadToOss(config, fileSize);

  // 输出结果 JSON 到 stdout
  const result = {
    key: config.key,
    filename,
    size: fileSize,
    sizeFormatted: formatBytes(fileSize),
  };

  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

main().catch((err) => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
