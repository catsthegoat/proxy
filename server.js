const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

app.use('/', createProxyMiddleware({
  target: 'https://example.com',
  changeOrigin: true,
  router: (req) => req.query.url || 'https://motox3m.gitlab.io',
  pathRewrite: { '^/': '' }
}));

app.listen(10000);
