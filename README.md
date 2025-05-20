# Amap Weather MCP Service

这个项目是一个包装高德天气API的MCP服务，可部署在Cloudflare Worker上。使用Model Context Protocol (MCP)，AI代理可以直接调用天气API。

## 功能

- 根据城市中文名称查询城市代码
- 获取城市的天气预报信息

## MCP工具

该服务提供以下MCP工具:

### getCityCode

根据城市中文名称获取城市代码。

**参数:**
- `cityName` - 城市的中文名称，如"北京市"、"上海市"等

**返回:**
包含adcode和citycode的JSON对象

### getWeatherForecast

获取城市天气预报信息。

**参数:**
- `city` - 城市代码（adcode）

**返回:**
高德天气API返回的预报天气数据

## 项目文件

- `index.js` - MCP服务的主要实现
- `auth-handler.js` - 简单的认证处理器
- `cityCodeData.js` - 包含所有中国城市的代码数据的JS文件
- `wrangler.toml` - Cloudflare Workers配置文件

## 连接到MCP服务

### 使用远程MCP客户端

您可以使用支持远程MCP的客户端直接连接:

```
https://your-worker-subdomain.workers.dev/sse
```

### 使用Claude Desktop或其他本地MCP客户端

对于本地MCP客户端，您可以使用`mcp-remote`作为代理:

1. 确保您已安装Node.js
2. 在Claude Desktop配置中添加:

```json
{
  "mcpServers": {
    "amap-weather": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-worker-subdomain.workers.dev/sse"
      ]
    }
  }
}
```

3. 重启Claude Desktop

## 部署说明

1. 安装依赖：
   ```
   npm install
   ```

2. 本地开发：
   ```
   npm run dev
   ```

3. 部署到Cloudflare Workers：
   ```
   npm run deploy
   ```

## 环境变量

- `AMAP_API_KEY` - 高德地图API密钥（已在wrangler.toml中配置）

## 注意事项

- 该服务使用Cloudflare Workers的Durable Objects来支持MCP协议的会话管理
- 当前实现使用简单认证，生产环境建议实现更完善的认证方案
- 使用前请确保您有有效的高德地图API密钥。详情请参考[高德开放平台](https://lbs.amap.com/) 