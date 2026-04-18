/**
 * Alipay Job Query Script
 *
 * 根据城市和岗位类型查询支付宝上的岗位列表信息
 *
 * 使用方式:
 * node scripts/alipay-job-query.js --cityCode 330100 --cityName "杭州" --typeCode fuwuyuan --typeName "服务员"
 */

const https = require('https');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    cityCode: '',
    cityName: '',
    typeCode: '',
    typeName: ''
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--cityCode' && args[i + 1]) {
      result.cityCode = args[i + 1];
      i++;
    } else if (args[i] === '--cityName' && args[i + 1]) {
      result.cityName = args[i + 1];
      i++;
    } else if (args[i] === '--typeCode' && args[i + 1]) {
      result.typeCode = args[i + 1];
      i++;
    } else if (args[i] === '--typeName' && args[i + 1]) {
      result.typeName = args[i + 1];
      i++;
    }
  }

  return result;
}

function buildRequestPayload(cityCode, cityName, typeCode, typeName) {
  return [
    {},
    "MAIN_Mobilegw_Mobilegw_claw_alipay_govbizwebdeploy",
    "com.shangshu.govbizwebdeploy.biz.job.assistant.rpc.queryRecommendJobList",
    JSON.stringify({
      cityCode: cityCode,
      cityName: cityName,
      typeCode: typeCode,
      typeName: typeName,
      source: "antAssistant"
    })
  ];
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

function formatOutput(result) {
  if (!result || !result.data || !result.data.text) {
    return JSON.stringify({ success: false, message: '抱歉，未能查询到岗位信息，请稍后重试~' });
  }

  try {
    const data = JSON.parse(result.data.text);
    if (!data.success || !data.data || !data.data.assistantJobInfoDTOList || data.data.assistantJobInfoDTOList.length === 0) {
      return JSON.stringify({ success: false, message: '抱歉，未找到符合条件的岗位，请尝试其他城市或岗位类型~' });
    }

    const allJobs = data.data.assistantJobInfoDTOList;
    const totalCount = allJobs.length;
    const maxDisplay = 10;
    const jobs = allJobs.slice(0, maxDisplay);

    // 构建岗位列表，包含 jobId 用于后续投递
    const jobList = jobs.map((job, index) => ({
      index: index + 1,
      jobId: job.jobId,
      jobName: job.jobName,
      salary: job.salary || '面议',
      address: job.address,
      jobDetailUrl: job.jobDetailUrl
    }));

    return JSON.stringify({
      success: true,
      totalCount: totalCount,
      displayedCount: jobs.length,
      city: jobs[0].city || '',
      jobType: jobs[0].jobName ? jobs[0].jobName.match(/[\u4e00-\u9fa5]+/)?.[0] || '' : '',
      jobList: jobList
    });
  } catch (e) {
    return JSON.stringify({ success: false, message: '解析结果失败: ' + e.message });
  }
}

async function main() {
  const args = parseArgs();

  if (!args.cityCode || !args.cityName || !args.typeCode || !args.typeName) {
    console.error('请提供完整的查询参数');
    console.error('示例: node scripts/alipay-job-query.js --cityCode 330100 --cityName "杭州" --typeCode fuwuyuan --typeName "服务员"');
    process.exit(1);
  }

  console.error(`查询参数: 城市=${args.cityName}(${args.cityCode}), 岗位类型=${args.typeName}(${args.typeCode})`);

  const payload = buildRequestPayload(args.cityCode, args.cityName, args.typeCode, args.typeName);

  try {
    const result = await makeRequest(payload);
    console.log(formatOutput(result));
  } catch (e) {
    console.error('请求失败:', e.message);
    process.exit(1);
  }
}

main();