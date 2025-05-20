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
    try {
      const data = await fetchWeatherData(city, 'all', env);
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error.message}` }]
      };
    }
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
  // 如果没有配置API密钥，返回错误信息
  if (!env.AMAP_API_KEY) {
    return {
      "status": "0",
      "info": "ERROR",
      "infocode": "10001",
      "message": "未配置高德地图 API 密钥 (AMAP_API_KEY)"
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

// 导出处理函数
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    
    // 处理 Streamable HTTP 请求 (替代旧的 SSE)
    if (url.pathname === '/mcp') {
      try {
        // 无状态模式 - 为每个请求创建新的实例
        // 处理 Streamable HTTP 请求
        if (method === 'POST') {
          // 处理请求-响应消息
          const body = await request.json();
          return await server.handleStreamableHttpRequest(request, env, body);
        } else if (method === 'GET') {
          // 对于 GET 请求，返回方法不允许
          return new Response(JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: "Method not allowed for stateless server."
            },
            id: null
          }), { 
            status: 405,
            headers: { 'Content-Type': 'application/json' }
          });
        } else if (method === 'DELETE') {
          // 对于 DELETE 请求，返回方法不允许
          return new Response(JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: "Method not allowed for stateless server."
            },
            id: null
          }), { 
            status: 405,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        console.error('MCP Server error:', error);
        
        // 返回错误响应
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: `Internal server error: ${error.message}`
          },
          id: null
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // 向后兼容：保留旧的 /sse 端点，但使用新的处理方式
    else if (url.pathname === '/sse') {
      try {
        // 使用 streamableHttp 处理 SSE 请求，提供兼容性
        return await server.handleSse(request, env);
      } catch (error) {
        console.error('MCP Server error:', error);
        
        // 返回一个正确格式的 SSE 响应
        return new Response(`retry: 1000\ndata: ${JSON.stringify({
          error: 'MCP Server error',
          message: error.message
        })}\n\n`, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    // 首页路由
    if (url.pathname === '/' || url.pathname === '') {
      return new Response('Amap Weather MCP Service is running. Connect to /mcp with an MCP client.', {
        headers: {'Content-Type': 'text/plain'}
      });
    }
    
    // 404 响应
    return new Response('Not found', { status: 404 });
  }
}; 