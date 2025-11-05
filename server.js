const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

// Allow all CORS and remove blocking headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

// Main page
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rainbow Proxy</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; background:#000; color:#fff; min-height:100vh; display:flex; align-items:center; justify-content:center; }
    .container { text-align:center; padding:40px; }
    h1 { font-size:48px; margin-bottom:30px; background:linear-gradient(90deg,#fff 20%,#ff0066 40%,#00ff99 60%,#3399ff 80%,#fff 100%); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:flow 4s linear infinite; }
    @keyframes flow { to { background-position:200% center; } }
    input { width:400px; max-width:90%; padding:15px; margin:20px 0; border-radius:12px; border:1px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.05); color:#fff; font-size:16px; text-align:center; }
    input::placeholder { color:rgba(255,255,255,0.4); }
    button { padding:15px 40px; background:#fff; color:#000; border:none; border-radius:12px; font-weight:700; cursor:pointer; font-size:14px; text-transform:uppercase; transition:0.3s; }
    button:hover { transform:translateY(-2px); box-shadow:0 10px 30px rgba(255,255,255,0.3); }
    .status { margin-top:20px; font-size:14px; color:rgba(255,255,255,0.6); }
  </style>
</head>
<body>
  <div class="container">
    <h1>RAINBOW PROXY</h1>
    <input id="url" placeholder="enter url (e.g. example.com)">
    <br>
    <button onclick="go()">GO</button>
    <div class="status">Server running ✓</div>
  </div>
  <script>
    function go() {
      let url = document.getElementById('url').value.trim();
      if (!url) return;
      if (!url.match(/^https?:\\/\\//)) url = 'https://' + url;
      window.location.href = '/proxy?url=' + encodeURIComponent(url);
    }
    document.getElementById('url').addEventListener('keypress', e => e.key === 'Enter' && go());
  </script>
</body>
</html>`);
});

// Proxy endpoint
app.use('/proxy', (req, res, next) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Missing URL parameter');
  }

  try {
    const url = new URL(targetUrl);
    
    createProxyMiddleware({
      target: url.origin,
      changeOrigin: true,
      pathRewrite: () => url.pathname + url.search,
      onProxyRes: (proxyRes) => {
        // Remove headers that block embedding
        delete proxyRes.headers['x-frame-options'];
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-content-type-options'];
        delete proxyRes.headers['strict-transport-security'];
      },
      onError: (err, req, res) => {
        res.status(500).send('Proxy error: ' + err.message);
      }
    })(req, res, next);
  } catch (e) {
    res.status(400).send('Invalid URL');
  }
});

app.listen(PORT, () => {
  console.log(`🌈 Rainbow Proxy running on port ${PORT}`);
});
