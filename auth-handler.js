// This is a simple authentication handler that doesn't require login
// For a production application, you would want to add real authentication

export default {
  fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // For simplicity, this handler accepts all requests without authentication
    // In a real application, you would implement authentication here
    if (url.pathname === "/") {
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Amap Weather MCP Service</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                line-height: 1.6;
              }
              h1 {
                color: #333;
              }
              pre {
                background-color: #f5f5f5;
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
              }
              code {
                font-family: monospace;
              }
            </style>
          </head>
          <body>
            <h1>Amap Weather MCP Service</h1>
            <p>这是一个包装高德天气API的MCP服务。</p>
            <h2>可用工具:</h2>
            <ul>
              <li><strong>getCityCode</strong> - 根据城市中文名称获取城市代码</li>
              <li><strong>getWeatherForecast</strong> - 获取城市的天气预报信息</li>
            </ul>
            <h2>连接方式:</h2>
            <p>使用任何支持MCP的客户端连接到以下端点:</p>
            <pre><code>${url.origin}/sse</code></pre>
            <p>对于本地测试，您可以使用 <a href="https://github.com/cloudflare/mcp-remote" target="_blank">mcp-remote</a> 从Claude Desktop等桌面客户端连接到此服务。</p>
          </body>
        </html>
      `, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    }
    
    return new Response("Not Found", { status: 404 });
  }
}; 