/**
 * Alipay Job Apply Script
 *
 * 支付宝岗位投递相关操作，包括查询授权状态、用户授权、岗位投递
 *
 * 使用方式:
 * node scripts/alipay-job-apply.js --action queryAuth
 * node scripts/alipay-job-apply.js --action saveAuth
 * node scripts/alipay-job-apply.js --action applyJobs --jobIds "jobId1,jobId2"
 */

const https = require('https');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    action: '',
    jobIds: ''
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--action' && args[i + 1]) {
      result.action = args[i + 1];
      i++;
    } else if (args[i] === '--jobIds' && args[i + 1]) {
      result.jobIds = args[i + 1];
      i++;
    }
  }

  return result;
}

function buildRequestPayload(action, jobIds) {
  const basePayload = {};

  switch (action) {
    case 'queryAuth':
      return [
        basePayload,
        "MAIN_Mobilegw_Mobilegw_claw_alipay_govbizwebdeploy",
        "com.shangshu.govbizwebdeploy.biz.job.assistant.rpc.queryUserAuthInfo",
        JSON.stringify({
          authTypeList: ["USER_INFO"]
        })
      ];

    case 'saveAuth':
      return [
        basePayload,
        "MAIN_Mobilegw_Mobilegw_claw_alipay_govbizwebdeploy",
        "com.shangshu.govbizwebdeploy.biz.job.assistant.rpc.updateUserAuthInfo",
        JSON.stringify({
          authStatus: 1,
          authTypeList: ["USER_INFO"]
        })
      ];

    case 'applyJobs':
      const jobIdList = jobIds.split(',').map(id => id.trim());
      return [
        basePayload,
        "MAIN_Mobilegw_Mobilegw_claw_alipay_govbizweb",
        "com.shangshu.govbizweb.biz.job.assistant.rpc.applyJobs",
        JSON.stringify({
          jobIdList: jobIdList
        })
      ];

    default:
      return null;
  }
}

function makeRequest(payload) {
  const postData = JSON.stringify(payload);

  const options = {
    hostname: 'webgwmobiler-acl.alipay.com',
    path: '/mcpgw/com.alipay.mcpgw.common.service.facade.rpc.mcp.v2.McpgwMcpOverTrFacade/mcpServerToolsCallLatestVersion',
    method: 'POST',
    headers: {
      'x-webgw-appId': 'KB4e6yamqU1jRp59',
      'x-webgw-version': '2.0',
      'Referer': 'https://yuntu.alipay.com/',
      'Content-Type': 'application/json',
      'Cookie': 'spanner=YGQTAEdyzkeEQbd8jIZ7TKhPR+U6QALAXt2T4qEYgj0=',
      'Content-Length': Buffer.byteLength(postData),
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('解析响应失败: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function formatOutput(action, result) {
  if (!result || !result.data || !result.data.text) {
    return JSON.stringify(result);
  }

  try {
    const data = JSON.parse(result.data.text);

    switch (action) {
      case 'queryAuth':
        if (data.success && data.data) {
          const authInfo = data.data;
          const isAuthorized = authInfo.authStatus === 1;
          return JSON.stringify({
            success: true,
            isAuthorized: isAuthorized,
            authInfo: authInfo
          });
        }
        return JSON.stringify({
          success: false,
          message: '查询授权状态失败'
        });

      case 'saveAuth':
        if (data.success) {
          return JSON.stringify({
            success: true,
            message: '授权成功'
          });
        }
        return JSON.stringify({
          success: false,
          message: data.errMsg || '授权失败'
        });

      case 'applyJobs':
        if (data.success) {
          return JSON.stringify({
            success: true,
            message: '岗位投递成功',
            data: data.data
          });
        }
        return JSON.stringify({
          success: false,
          message: data.errMsg || '岗位投递失败'
        });

      default:
        return JSON.stringify(data);
    }
  } catch (e) {
    return '解析结果失败: ' + e.message;
  }
}

async function main() {
  const args = parseArgs();

  if (!args.action) {
    console.error('请提供 --action 参数');
    console.error('可选值: queryAuth, saveAuth, applyJobs');
    console.error('示例:');
    console.error('  node scripts/alipay-job-apply.js --action queryAuth');
    console.error('  node scripts/alipay-job-apply.js --action saveAuth');
    console.error('  node scripts/alipay-job-apply.js --action applyJobs --jobIds "jobId1,jobId2"');
    process.exit(1);
  }

  if (args.action === 'applyJobs' && !args.jobIds) {
    console.error('applyJobs 操作需要提供 --jobIds 参数');
    process.exit(1);
  }

  console.error(`执行操作: ${args.action}${args.jobIds ? ', 岗位ID: ' + args.jobIds : ''}`);

  const payload = buildRequestPayload(args.action, args.jobIds);

  if (!payload) {
    console.error('无效的操作类型');
    process.exit(1);
  }

  try {
    const result = await makeRequest(payload);
    console.log(formatOutput(args.action, result));
  } catch (e) {
    console.error('请求失败:', e.message);
    process.exit(1);
  }
}

main();