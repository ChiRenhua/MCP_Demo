import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { cityCodes } from './cityCodeData';

// Define our MCP server functionality
export class AmapWeatherMCP extends McpAgent {
  server = new McpServer({
    name: "Amap Weather MCP",
    version: "1.0.0",
  });

  async init() {
    // Add a tool to get city code by Chinese name
    this.server.tool(
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

    // Add a tool to fetch weather forecast
    this.server.tool(
      'getWeatherForecast',
      '获取城市的天气预报信息',
      {
        city: z.string().describe('城市代码（adcode）')
      },
      async ({ city }) => {
        const data = await this.fetchWeatherData(city, 'all');
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
        };
      }
    );
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

// 直接导出 McpAgent 实例，而不是 OAuthProvider
export default new AmapWeatherMCP(); 