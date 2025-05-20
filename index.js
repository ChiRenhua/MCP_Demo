import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { cityCodes } from './cityCodeData';

// Define our MCP server functionality with correct construction pattern
export class AmapWeatherMCP extends McpAgent {
  constructor(state, env) {
    super(state, env);
    this.server = new McpServer({
      name: "Amap Weather MCP",
      version: "1.0.0",
      protocolVersion: "2025-03-26", // 使用最新协议版本
    });
  }

  async init() {
    // 按照最新规范定义工具
    this.server.defineTool({
      name: 'getCityCode',
      description: '根据城市中文名称获取城市代码',
      paramSchema: {
        cityName: z.string().describe('城市的中文名称，如"北京市"、"上海市"等')
      },
      handler: async ({ cityName }) => {
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
    });

    // 按照最新规范定义工具
    this.server.defineTool({
      name: 'getWeatherForecast',
      description: '获取城市的天气预报信息',
      paramSchema: {
        city: z.string().describe('城市代码（adcode）')
      },
      handler: async ({ city }) => {
        const data = await this.fetchWeatherData(city, 'all');
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
        };
      }
    });
  }

  /**
   * Fetch weather data from Amap Weather API
   * @param {string} city - City code
   * @param {string} extensions - Weather type (base/all)
   * @returns {Promise<Object>} - Weather data
   */
  async fetchWeatherData(city, extensions = 'base') {
    const url = new URL('https://restapi.amap.com/v3/weather/weatherInfo');
    url.searchParams.append('key', this.env.AMAP_API_KEY);
    url.searchParams.append('city', city);
    url.searchParams.append('extensions', extensions);
    url.searchParams.append('output', 'JSON');

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return response.json();
  }
}

// 创建一个默认导出函数，用于处理 Worker 请求
export default {
  // 从 agents/mcp 获取路由器功能
  fetch: AmapWeatherMCP.Router
}; 