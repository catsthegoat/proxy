const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

// Allow all CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

// Serve main page
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rainbow Proxy</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
<style>
  /* ...all your previous CSS, including rainbow h1, glow input, cursor trail... */
</style>
</head>
<body>
<canvas id="trail"></canvas>
<div class="cursor"></div>
<div class="mode-toggle" onclick="toggleMode()">⚫ / ⚪</div>
<div class="container">
<h1>RAINBOW PROXY</h1>
<div class="input-wrapper">
<input id="url" placeholder="enter url (e.g. example.com)">
</div>
<br>
<button onclick="go()">GO</button>
<div class="status">Server running ✓</div>
<div class="secret">made by emma</div>
</div>
<script>
  /* Your JS for mouse trail, theme toggle, and go() function */
</script>
</body>
</html>`);
});

// Proxy endpoint
app.use('/proxy', (req,res,next)=>{
  const targetUrl=req.query.url;
  if(!targetUrl) return res.status(400).send('Missing URL');

  let url;
  try { url = new URL(targetUrl); } 
  catch { return res.status(400).send('Invalid URL'); }

  createProxyMiddleware({
    target: url.origin,
    changeOrigin: true,
    pathRewrite: ()=>url.pathname + url.search,
    onProxyRes: proxyRes => {
      delete proxyRes.headers['x-frame-options'];
      delete proxyRes.headers['content-security-policy'];
      delete proxyRes.headers['x-content-type-options'];
      delete proxyRes.headers['strict-transport-security'];
    },
    onError: (err, req, res) => res.status(500).send('Proxy error: ' + err.message)
  })(req, res, next);
});

// Start server
app.listen(PORT, () => {
  console.log(`🌈 Rainbow Proxy running on port ${PORT}`);

  // Keep server awake (Node 18+ global fetch)
  setInterval(() => {
    fetch(`https://${process.env.RENDER_EXTERNAL_URL || 'localhost:'+PORT}`)
      .then(()=>console.log('⏰ Keep-alive ping sent'))
      .catch(err=>console.log('Ping failed:', err.message));
  }, 10 * 60 * 1000); // every 10 minutes
});
