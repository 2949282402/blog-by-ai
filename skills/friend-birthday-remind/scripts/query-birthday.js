#!/usr/bin/env node
/**
 * 好友生日查询脚本
 *
 * 使用方式：
 * HTTP_PROXY=http://127.0.0.1:29080 HTTPS_PROXY=http://127.0.0.1:29080 NO_PROXY=127.0.0.1,localhost,::1 NODE_EXTRA_CA_CERTS="/user/mitmproxy-ca-cert.pem" node --use-env-proxy query-birthday.js --type friends
 */

const https = require('https');
const http = require('http');

// MCP网关配置（按SKILL.md）
const MCP_CONFIG = {
  host: 'webgwmobiler-acl.alipay.com',
  appId: 'KB4e6yamqU1jRp59',
  operationType: 'MAIN_Mobilegw_Mobilegw_mcpfactory_mobilerelation_getNearBirthdayFriends',
  methodName: 'alipay.mobile.relation.getNearBirthdayFriends'
};

// 解析命令行参数
const args = process.argv.slice(2);
const params = { type: 'friends', days: 30 };
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--type') params.type = args[++i];
  if (args[i] === '--days') params.days = parseInt(args[++i]) || 30;
}

// 计算距离生日的天数
function calcDays(birthday) {
  if (!birthday || birthday.length !== 8) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const month = parseInt(birthday.substring(4, 6)) - 1;
  const day = parseInt(birthday.substring(6, 8));
  let bday = new Date(today.getFullYear(), month, day);
  // 只有当生日日期严格小于今天时，才计算明年的生日
  // 注意：当 bday === today 时（今天生日），不应该加一年
  if (bday < today) bday = new Date(today.getFullYear() + 1, month, day);
  const diffDays = (bday - today) / (1000 * 60 * 60 * 24);
  // 返回整数，避免浮点数精度问题
  return Math.round(diffDays);
}

// 格式化生日
function fmtBirthday(birthday) {
  if (!birthday || birthday.length !== 8) return birthday;
  return `${parseInt(birthday.substring(4, 6))}月${parseInt(birthday.substring(6, 8))}日`;
}

// 调用MCP接口（支持重定向跟随）
async function callMcp(redirectCount = 0) {
  const path = '/mcpgw/com.alipay.mcpgw.common.service.facade.rpc.mcp.v2.McpgwMcpOverTrFacade/mcpServerToolsCallLatestVersion';
  const body = JSON.stringify([{}, MCP_CONFIG.operationType, MCP_CONFIG.methodName, '{"reqData":{}}']);

  const useHttp = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  const lib = useHttp ? http : https;

  const options = {
    hostname: MCP_CONFIG.host,
    port: useHttp ? 80 : 443,
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webgw-appId': MCP_CONFIG.appId,
      'x-webgw-version': '2.0',
      'Referer': 'https://yuntu.alipay.com/',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  return new Promise((resolve, reject) => {
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // 处理301/302重定向
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          if (redirectCount >= 5) {
            reject(new Error('重定向次数过多'));
            return;
          }
          console.log(`收到 ${res.statusCode} 重定向，跟随到: ${res.headers.location}`);
          try {
            const newUrl = new URL(res.headers.location);
            const newLib = newUrl.protocol === 'http:' ? http : https;
            const newOptions = {
              hostname: newUrl.hostname,
              port: newUrl.port || (newUrl.protocol === 'https:' ? 443 : 80),
              path: newUrl.pathname + newUrl.search,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-webgw-appId': MCP_CONFIG.appId,
                'x-webgw-version': '2.0',
                'Referer': 'https://yuntu.alipay.com/',
                'Content-Length': Buffer.byteLength(body)
              }
            };
            const redirectReq = newLib.request(newOptions, (redirectRes) => {
              let redirectData = '';
              redirectRes.on('data', chunk => redirectData += chunk);
              redirectRes.on('end', () => resolve({ httpStatus: redirectRes.statusCode, rawData: redirectData }));
            });
            redirectReq.on('error', reject);
            redirectReq.write(body);
            redirectReq.end();
          } catch (e) {
            reject(new Error('解析重定向URL失败: ' + e.message));
          }
        } else {
          resolve({ httpStatus: res.statusCode, rawData: data });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// 解析结果
function parseResult(response) {
  console.log(`HTTP状态码: ${response.httpStatus}`);

  let result;
  try {
    result = JSON.parse(response.rawData);
  } catch (e) {
    return { success: false, error: '解析JSON失败: ' + e.message, friends: [], self: null };
  }

  console.log('\n接口原始返回:');
  console.log(JSON.stringify(result, null, 2));

  // 解析嵌套的 data.text
  let inner = result;
  if (result.data?.text) {
    try {
      inner = JSON.parse(result.data.text);
    } catch (e) {
      return { success: false, error: '解析data.text失败', friends: [], self: null };
    }
  }

  // 解析用户自己生日
  let self = null;
  if (inner.userBirthday) {
    const u = inner.userBirthday;
    self = {
      userId: u.userId,
      name: u.nickName || u.realName || '我',
      birthday: fmtBirthday(u.birthday),
      days_until: calcDays(u.birthday),
      gender: u.gender === 'm' ? '男' : '女'
    };
  }

  // 解析好友列表
  const friends = [];
  const list = inner.friendBirthdayInfos || inner.birthdayFriends || [];
  for (const f of list) {
    const days = calcDays(f.birthday);
    if (days !== null && days <= 30) {
      friends.push({
        userId: f.userId,
        name: f.remarkName || f.nickName || '好友',
        birthday: fmtBirthday(f.birthday),
        days_until: days,
        gender: f.gender === 'm' ? '男' : '女'
      });
    }
  }
  friends.sort((a, b) => a.days_until - b.days_until);

  return { success: self || friends.length > 0, friends, self };
}

// 主函数
async function main() {
  console.log(`\n查询类型: ${params.type === 'friends' ? '好友生日' : '自己的生日'}`);
  if (params.type === 'friends') console.log(`查询范围: 近${params.days}天`);

  try {
    const response = await callMcp();
    const data = parseResult(response);

    // 过滤天数
    if (params.type === 'friends' && data.friends.length > 0) {
      data.friends = data.friends.filter(f => f.days_until <= params.days);
    }

    console.log('\n========================================');
    if (params.type === 'friends') {
      if (data.friends.length > 0) {
        console.log(`🎂 近期过生日的好友（共${data.friends.length}位）\n`);
        data.friends.forEach((f, i) => {
          const daysText = f.days_until === 0 ? '🎂 今天生日' : `还有${f.days_until}天`;
          console.log(`${i + 1}. ${f.name} - ${f.birthday}（${daysText}）`);
        });
      } else {
        console.log('😊 最近没有好友过生日');
      }
    } else {
      if (data.self) {
        const daysText = data.self.days_until === 0 ? '🎂 今天是您的生日' : `还有${data.self.days_until}天`;
        console.log(`🎂 您的生日: ${data.self.birthday}（${daysText}）`);
      } else {
        console.log('⚠️ 未获取到生日信息');
      }
    }
    console.log('========================================');

    console.log('\nJSON结果:');
    console.log(JSON.stringify(params.type === 'friends' ? { success: data.success, friends: data.friends } : { success: data.success, self: data.self }, null, 2));

  } catch (err) {
    console.error('查询失败:', err.message);
  }
}

main();