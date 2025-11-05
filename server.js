const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Proxy route
app.get('/', (req, res) => {
  const target = req.query.url || 'https://motox3m.gitlab.io';
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { '^/': '' },
    onProxyRes: (proxyRes) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    }
  })(req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
