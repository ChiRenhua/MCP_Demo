import { Router } from 'itty-router';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { cityCodes } from './cityCodeData';

// 创建 MCP 服务器实例
const server = new McpServer({
  name: "Amap Weather MCP",
  version: "1.0.0",
  protocolVersion: "2025-03-26",
});

// 添加城市代码查询工具
server.tool(
  'getCityCode',
  '根据城市中文名称获取城市代码',
  {
    cityName: z.string().describe('城市的中文名称，如"北京市"、"上海市"等')
  },
  async ({ cityName }) => {
    const cityInfo = cityCodes[cityName];
    
    if (!cityInfo) {
      return {
        content: [{ type: 'text', text: `未找到城市"${cityName}"的代码信息` }]
      };
    }
    
    return {
      content: [{ 
        type: 'text', 
        text: JSON.stringify({
          cityName,
          adcode: cityInfo.adcode,
          citycode: cityInfo.citycode
        }, null, 2) 
      }]
    };
  }
);

// 添加天气预报查询工具
server.tool(
  'getWeatherForecast',
  '获取城市的天气预报信息',
  {
    city: z.string().describe('城市代码（adcode）')
  },
  async ({ city }, env) => {
    const data = await fetchWeatherData(city, 'all', env);
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
    };
  }
);

/**
 * 获取天气数据
 * @param {string} city - 城市代码
 * @param {string} extensions - 天气类型(base/all)
 * @param {Object} env - 环境变量
 * @returns {Promise<Object>} - 天气数据
 */
async function fetchWeatherData(city, extensions = 'base', env) {
  // 如果没有配置API密钥，返回模拟数据
  if (!env.AMAP_API_KEY) {
    return {
      "status": "1",
      "count": "1",
      "info": "OK",
      "infocode": "10000",
      "forecasts": [{
        "city": city,
        "adcode": city,
        "province": "模拟省份",
        "reporttime": new Date().toISOString(),
        "casts": [{
          "date": new Date().toISOString().split('T')[0],
          "week": "1",
          "dayweather": "晴",
          "nightweather": "多云",
          "daytemp": "26",
          "nighttemp": "20",
          "daywind": "西南",
          "nightwind": "西南",
          "daypower": "≤3",
          "nightpower": "≤3"
        }]
      }]
    };
  }
  
  const url = new URL('https://restapi.amap.com/v3/weather/weatherInfo');
  url.searchParams.append('key', env.AMAP_API_KEY);
  url.searchParams.append('city', city);
  url.searchParams.append('extensions', extensions);
  url.searchParams.append('output', 'JSON');

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  
  return response.json();
}

// 创建一个路由处理 MCP 请求
const router = Router();
router.get('/sse', (request, env) => server.handleRequest()(request, env));
router.post('/sse', (request, env) => server.handleRequest()(request, env));

// 添加首页路由
router.get('/', () => new Response('Amap Weather MCP Service is running. Connect to /sse with an MCP client.', {
  headers: {'Content-Type': 'text/plain'}
}));

// 捕获所有其他请求
router.all('*', () => new Response('Not found', { status: 404 }));

// 导出默认处理函数
export default {
  fetch: router.handle
}; 