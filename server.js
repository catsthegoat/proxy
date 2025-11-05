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
    body { font-family:'Inter',sans-serif; background:#000; color:#fff; min-height:100vh; display:flex; align-items:center; justify-content:center; overflow:hidden; cursor:none; transition:background 0.3s, color 0.3s; }
    body.light-mode { background:#fff; color:#000; }
    
    #trail { position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:9998; }
    
    .container { text-align:center; padding:40px; position:relative; z-index:10; }
    h1 { font-size:48px; margin-bottom:30px; background:linear-gradient(90deg,#fff 20%,#ff0066 40%,#00ff99 60%,#3399ff 80%,#fff 100%); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:flow 4s linear infinite; }
    body.light-mode h1 { background:linear-gradient(90deg,#000 20%,#ff0066 40%,#00ff99 60%,#3399ff 80%,#000 100%); }
    @keyframes flow { to { background-position:200% center; } }
    
    input { width:400px; max-width:90%; padding:15px; margin:20px 0; border-radius:12px; border:1px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.05); color:#fff; font-size:16px; text-align:center; cursor:text; }
    body.light-mode input { border:1px solid rgba(0,0,0,0.2); background:rgba(0,0,0,0.05); color:#000; }
    input::placeholder { color:rgba(255,255,255,0.4); }
    body.light-mode input::placeholder { color:rgba(0,0,0,0.4); }
    
    button { padding:15px 40px; background:#fff; color:#000; border:none; border-radius:12px; font-weight:700; cursor:pointer; font-size:14px; text-transform:uppercase; transition:0.3s; }
    body.light-mode button { background:#000; color:#fff; }
    button:hover { transform:translateY(-2px); box-shadow:0 10px 30px rgba(255,255,255,0.3); }
    body.light-mode button:hover { box-shadow:0 10px 30px rgba(0,0,0,0.3); }
    
    .status { margin-top:20px; font-size:14px; color:rgba(255,255,255,0.6); }
    body.light-mode .status { color:rgba(0,0,0,0.6); }
    
    .secret { 
      margin-top:10px; font-size:12px; color:#000; background:#000; padding:5px 15px; border-radius:8px; 
      transition:all 0.5s ease; cursor:pointer; display:inline-block; user-select:none; position:relative; z-index:100;
    }
    body.light-mode .secret { color:#fff; background:#fff; }
    .secret:hover { color:rgba(255,255,255,0.4); background:rgba(255,255,255,0.05); }
    body.light-mode .secret:hover { color:rgba(0,0,0,0.4); background:rgba(0,0,0,0.05); }
    
    .cursor { position:fixed; width:20px; height:20px; border:2px solid rgba(255,255,255,0.8); border-radius:50%; pointer-events:none; z-index:10000; transform:translate(-50%,-50%); }
    body.light-mode .cursor { border-color:rgba(0,0,0,0.8); }
    
    .mode-toggle { position:fixed; top:20px; right:20px; padding:10px 20px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:10px; font-size:12px; cursor:pointer; transition:0.3s; z-index:101; backdrop-filter:blur(10px); }
    body.light-mode .mode-toggle { background:rgba(0,0,0,0.1); border:1px solid rgba(0,0,0,0.2); }
    .mode-toggle:hover { background:rgba(255,255,255,0.2); transform:scale(1.05); }
    body.light-mode .mode-toggle:hover { background:rgba(0,0,0,0.2); }
  </style>
</head>
<body>
  <canvas id="trail"></canvas>
  <div class="cursor"></div>
  <div class="mode-toggle" onclick="toggleMode()">⚫ / ⚪</div>
  <div class="container">
    <h1>RAINBOW PROXY</h1>
    <input id="url" placeholder="enter url (e.g. example.com)">
    <br>
    <button onclick="go()">GO</button>
    <div class="status">Server running ✓</div>
    <div class="secret">made by emma</div>
  </div>
  <script>
    // Theme toggle
    let lightMode = false;
    function toggleMode() {
      lightMode = !lightMode;
      document.body.classList.toggle('light-mode', lightMode);
    }
    
    // Mouse trail effect
    const canvas = document.getElementById('trail');
    const ctx = canvas.getContext('2d');
    const cursor = document.querySelector('.cursor');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let particles = [];
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    
    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 4 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.life = 1;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.015;
        if (this.size > 0.1) this.size -= 0.03;
      }
      
      draw() {
        const color = lightMode ? '0, 0, 0' : '255, 255, 255';
        ctx.fillStyle = 'rgba(' + color + ', ' + this.life + ')';
        ctx.shadowBlur = 10;
        ctx.shadowColor = lightMode ? 'rgba(0,0,0,' + this.life + ')' : 'rgba(255,255,255,' + this.life + ')';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    let cursorX = mouseX;
    let cursorY = mouseY;
    
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      for (let i = 0; i < 5; i++) {
        particles.push(new Particle(mouseX, mouseY));
      }
    });
    
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Smooth cursor follow
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
      
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        
        if (particles[i].life <= 0) {
          particles.splice(i, 1);
        }
      }
      
      requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
    
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
