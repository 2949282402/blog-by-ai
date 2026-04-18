/**
 * Alipay Service URL Query Script
 * 
 * 根据用户自然语言描述，查询支付宝内对应服务的跳转链接
 * 
 * 使用方式:
 * node scripts/alipay-service-query.js --text "我要交电费"
 * node scripts/alipay-service-query.js --text "蚂蚁森林收能量" --lbs '{"city":"杭州市","cityCode":"330100"}'
 */

const https = require('https');
const fs = require('fs');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { text: '', lbs: null };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--text' && args[i + 1]) {
      result.text = args[i + 1];
      i++;
    } else if (args[i] === '--lbs' && args[i + 1]) {
      try {
        result.lbs = JSON.parse(args[i + 1]);
      } catch (e) {
        console.error('LBS JSON 解析失败:', e.message);
      }
      i++;
    }
  }
  
  return result;
}

function buildRequestPayload(text, lbsInfo) {
  const flowId = 'chat_audio_' + Date.now();
  const sessionId = 'session_' + Date.now();
  
  // 构建 LBS 信息
  let lbsStr = '';
  if (lbsInfo) {
    lbsStr = JSON.stringify({
      chosenCity: lbsInfo.city || '',
      chosenCityCode: lbsInfo.cityCode || '',
      city: (lbsInfo.city || '') + '市',
      cityCode: lbsInfo.cityCode || '',
      country: '中国',
      district: lbsInfo.district || '',
      districtCode: lbsInfo.districtCode || '',
      latitude: lbsInfo.latitude || 0,
      longitude: lbsInfo.longitude || 0,
      province: lbsInfo.province || ''
    });
  }
  
  const extra = {
    entrance: 'mcpgw'
  };
  
  if (lbsStr) {
    extra.lbsInfo = lbsStr;
  }
  
  return [
    {},
    "MAIN_Mobilegw_Mobilegw_claw_alipay_mmflowprod",
    "com.alipay.mmflowprod.rpc.ServiceIntentFacade.recTextIntent",
    JSON.stringify({
      appId: "mcpgw",
      evalAttrs: {},
      extra: extra,
      flowId: flowId,
      sessionId: sessionId,
      tenantId: "alipay",
      text: text,
      type: "query"
    })
  ];
}

function makeRequest(payload) {
  const postData = JSON.stringify(payload);
  const ca = fs.readFileSync('/user/mitmproxy-ca-cert.pem');

  const options = {
    hostname: 'webgwmobiler-acl.alipay.com',
    path: '/mcpgw/com.alipay.mcpgw.common.service.facade.rpc.mcp.v2.McpgwMcpOverTrFacade/mcpServerToolsCallLatestVersion',
    method: 'POST',
    headers: {
      'x-webgw-appId': 'KB4e6yamqU1jRp59',
      'x-webgw-version': '2.0',
      'Referer': 'https://mobilegw.alipay.com/',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
    agent:new https.Agent({host: '127.0.0.1',port: 29080,ca,}),
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
  if (!result || !result.data) {
    return '抱歉，未能找到对应的支付宝服务，请换个描述试试~';
  }
  
  try {
    const data = JSON.parse(result.data.text);
    if (!data.success || !data.result || !data.result.items || data.result.items.length === 0) {
      return '抱歉，未能找到对应的支付宝服务，请换个描述试试~';
    }
    
    const items = data.result.items;
    let output = '';
    
    if (data.result.extra && data.result.extra.middle_page_result === '1') {
      // 多结果情况
      output += '找到多个相关的支付宝服务，请选择：\n\n';
      items.forEach((item, index) => {
        output += `${index + 1}. [${item.serviceName}](${item.serviceUrl})\n`;
        output += `   ${item.serviceDesc}\n\n`;
      });
    } else {
      // 单结果情况 - 标准markdown链接格式 + 润色文本
      const item = items[0];
      const polishedText = getPolishedText(item);
      output += polishedText + '\n\n';
      output += `[${item.serviceName}](${item.serviceUrl})`;
    }
    
    return output;
  } catch (e) {
    return '解析结果失败: ' + e.message;
  }
}

function getPolishedText(item) {
  // 根据服务类型返回润色后的文本
  const serviceName = item.serviceName || '';
  const serviceDesc = item.serviceDesc || '';
  
  // 常见服务润色模板
  const templates = {
    '生活缴费': `✅ 帮你找到生活缴费服务，${serviceDesc}`,
    '电费': `⚡ 找到电费缴纳入口，${serviceDesc}`,
    '水费': `💧 找到水费缴纳入口，${serviceDesc}`,
    '燃气': `🔥 找到燃气缴费入口，${serviceDesc}`,
    '蚂蚁森林': `🌳 帮你打开蚂蚁森林，${serviceDesc}`,
    '医保码': `🏥 帮你打开医保码，${serviceDesc}`,
    '乘车码': `🚌 帮你打开乘车码，${serviceDesc}`,
    '健康码': `📋 帮你打开健康码，${serviceDesc}`,
    '社保': `🏛️ 帮你找到社保服务，${serviceDesc}`,
    '公积金': `🏠 帮你找到公积金服务，${serviceDesc}`,
    '汽车': `🚗 帮你找到汽车服务，${serviceDesc}`,
    'ETC': `高速帮你办理ETC，${serviceDesc}`,
    '加油': `⛽ 帮你找到加油服务，${serviceDesc}`,
    '停车': `🅿️ 帮你找到停车缴费服务，${serviceDesc}`,
    '理赔': `🛡️ 帮你找到保险理赔服务，${serviceDesc}`,
    '保险': `🛡️ 帮你找到保险服务，${serviceDesc}`,
    '理财': `💰 帮你找到理财服务，${serviceDesc}`,
    '红包': `🧧 帮你找到红包服务，${serviceDesc}`,
    '会员': `⭐ 帮你找到支付宝会员服务，${serviceDesc}`,
    '快递': `📦 帮你找到快递服务，${serviceDesc}`,
    '寄快递': `📦 帮你找到寄快递入口，${serviceDesc}`,
    '外卖': `🍜 帮你找到外卖入口，${serviceDesc}`,
    '点餐': `🍽️ 帮你找到点餐入口，${serviceDesc}`,
    '电影票': `🎬 帮你找到电影票购买入口，${serviceDesc}`,
    '话费': `📱 帮你找到话费和流量充值入口，${serviceDesc}`,
    '流量': `📶 帮你找到流量充值入口，${serviceDesc}`,
    '设置': `⚙️ 帮你找到设置入口，${serviceDesc}`,
    '支付密码': `🔐 帮你找到支付密码设置入口，${serviceDesc}`,
  };
  
  // 精确匹配
  for (const [key, value] of Object.entries(templates)) {
    if (serviceName.includes(key)) {
      return value;
    }
  }
  
  // 默认润色
  return `帮你找到「${serviceName}」，${serviceDesc}`;
}

async function main() {
  const args = parseArgs();
  
  if (!args.text) {
    console.error('请提供 --text 参数');
    console.error('示例: node scripts/alipay-service-query.js --text "我要交电费"');
    process.exit(1);
  }
  
  // 获取 LBS 信息
  let lbsInfo = null;
  try {
    const lbsResponse = await makeRequest([{}, "LBS", "getLbsInfo", "{}"]);
    if (lbsResponse && lbsResponse.data) {
      const lbsData = JSON.parse(lbsResponse.data.text);
      if (lbsData.hasLbs && lbsData.lbs) {
        lbsInfo = lbsData.lbs;
      }
    }
  } catch (e) {
    console.error('获取LBS信息失败:', e.message);
  }
  
  // 如果传入了 LBS 参数，优先使用传入的
  if (args.lbs) {
    lbsInfo = args.lbs;
  }
  
  console.error('LBS 信息:', lbsInfo ? JSON.stringify(lbsInfo) : '无');
  
  const payload = buildRequestPayload(args.text, lbsInfo);
  
  try {
    const result = await makeRequest(payload);
    console.log(formatOutput(result));
  } catch (e) {
    console.error('请求失败:', e.message);
    process.exit(1);
  }
}

main();