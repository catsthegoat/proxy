const express = require('express');
const fetch = require('node-fetch');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const app = express();

const PORT = process.env.PORT || 3000;
const ACCESS_CODE = process.env.PROXY_PASSWORD || 'rainbow123';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'rainbow-proxy-secret-key-change-this',
  resave: false,
  saveUninitialized: true,
  store: new MemoryStore({
    checkPeriod: 86400000
  }),
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,
    secure: false,
    httpOnly: true,
    sameSite: 'lax'
  },
  name: 'rainbow.sid'
}));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const requireAuth = (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect('/login');
  }
};

app.get('/login', (req, res) => {
  const error = req.query.error;
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Clever | Portal</title>
<link rel="icon" type="image/x-icon" href="https://clever.com/favicon.ico">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:system-ui;background:#000;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;}
.login-container{text-align:center;padding:40px;max-width:400px;}
h1{font-size:48px;margin-bottom:30px;background:linear-gradient(90deg,#fff 0%,#ff0066 50%,#00ff99 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:flow 3s linear infinite;}
@keyframes flow{to{background-position:200% center;}}
input{width:100%;padding:15px 20px;border-radius:8px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.05);color:#fff;font-size:16px;text-align:center;outline:none;margin:20px 0;}
input::placeholder{color:rgba(255,255,255,0.4);}
button{width:100%;padding:15px;background:#fff;color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;}
button:hover{opacity:0.9;}
.error{margin-top:15px;padding:12px;background:rgba(255,0,0,0.2);border:1px solid rgba(255,0,0,0.4);border-radius:8px;color:#ff6666;}
</style>
</head>
<body>
<div class="login-container">
<h1>🌈 RAINBOW GATEWAY</h1>
<form method="POST" action="/login">
  <input type="password" name="password" placeholder="enter access code" autofocus required>
  <button type="submit">UNLOCK</button>
</form>
${error ? '<div class="error">❌ Incorrect access code</div>' : ''}
</div>
</body>
</html>`);
});

app.post('/login', (req, res) => {
  const { password } = req.body;
  
  if (password === ACCESS_CODE) {
    req.session.authenticated = true;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect('/login?error=1');
      }
      res.redirect('/');
    });
  } else {
    res.redirect('/login?error=1');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/', requireAuth, (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Clever | Portal</title>
<link rel="icon" type="image/x-icon" href="https://clever.com/favicon.ico">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:system-ui;background:#000;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
.container{text-align:center;max-width:900px;width:100%;}
h1{font-size:48px;margin-bottom:15px;background:linear-gradient(90deg,#fff 0%,#ff0066 50%,#00ff99 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:flow 3s linear infinite;}
@keyframes flow{to{background-position:200% center;}}
.subtitle{color:rgba(255,255,255,0.6);margin-bottom:40px;font-size:14px;}
.logout{position:fixed;top:20px;right:20px;padding:10px 20px;background:rgba(255,0,0,0.3);border:1px solid rgba(255,0,0,0.5);border-radius:8px;font-size:12px;color:#fff;text-decoration:none;}
.logout:hover{background:rgba(255,0,0,0.5);}
.disguise-btn{position:fixed;top:20px;left:20px;padding:10px 20px;background:rgba(0,255,153,0.3);border:1px solid rgba(0,255,153,0.5);border-radius:8px;font-size:12px;color:#00ff99;border:none;cursor:pointer;}
.disguise-btn:hover{background:rgba(0,255,153,0.5);}
.proxy-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-top:30px;}
.proxy-card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:25px;cursor:pointer;transition:all 0.3s;text-decoration:none;color:#fff;display:block;}
.proxy-card:hover{transform:translateY(-5px);border-color:rgba(255,255,255,0.5);background:rgba(255,255,255,0.1);}
.proxy-icon{font-size:40px;margin-bottom:15px;}
.proxy-name{font-size:20px;font-weight:700;margin-bottom:8px;}
.proxy-desc{font-size:13px;color:rgba(255,255,255,0.6);line-height:1.4;}
.proxy-tag{display:inline-block;margin-top:10px;padding:4px 10px;background:rgba(0,255,153,0.2);border:1px solid rgba(0,255,153,0.4);border-radius:4px;font-size:11px;color:#00ff99;}
.note{margin-top:40px;padding:20px;background:rgba(255,255,0,0.1);border:1px solid rgba(255,255,0,0.3);border-radius:8px;font-size:13px;color:rgba(255,255,0,0.8);line-height:1.6;}
.quick-access{margin-top:30px;padding:25px;background:rgba(0,150,255,0.1);border:1px solid rgba(0,150,255,0.3);border-radius:12px;}
.quick-title{font-size:18px;font-weight:700;color:#0096ff;margin-bottom:15px;}
.quick-input{width:100%;padding:15px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#fff;font-size:14px;margin-bottom:10px;}
.quick-input::placeholder{color:rgba(255,255,255,0.4);}
.quick-btn{padding:12px 30px;background:#00ff99;color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;}
.quick-btn:hover{opacity:0.9;}
</style>
</head>
<body>
<button class="disguise-btn" onclick="toggleDisguise()">🎭 Disguise: ON</button>
<a href="/logout" class="logout">🔒 Logout</a>
<div class="container">
<h1>🌈 RAINBOW GATEWAY</h1>
<div class="subtitle">Your Protected Access Point</div>

<div class="quick-access">
  <div class="quick-title">⚡ Quick Access</div>
  <input type="text" id="quickUrl" class="quick-input" placeholder="Enter website (e.g., tiktok.com, youtube.com)" />
  <button class="quick-btn" onclick="quickGo()">GO 🚀</button>
</div>

<div class="proxy-grid">
  <a href="/proxy?url=https%3A%2F%2Fwww.croxyproxy.com" class="proxy-card">
    <div class="proxy-icon">🔵</div>
    <div class="proxy-name">CroxyProxy</div>
    <div class="proxy-desc">Best for TikTok, Instagram, YouTube. Very reliable and fast.</div>
    <span class="proxy-tag">RECOMMENDED</span>
  </a>

  <a href="/proxy?url=https%3A%2F%2Fwww.blockaway.net" class="proxy-card">
    <div class="proxy-icon">🟢</div>
    <div class="proxy-name">BlockAway</div>
    <div class="proxy-desc">Great for social media and streaming. Modern interface.</div>
    <span class="proxy-tag">FAST</span>
  </a>

  <a href="/proxy?url=https%3A%2F%2Fwww.croxyproxy.rocks" class="proxy-card">
    <div class="proxy-icon">🟣</div>
    <div class="proxy-name">CroxyProxy Rocks</div>
    <div class="proxy-desc">Alternative CroxyProxy mirror. Works if main is blocked.</div>
    <span class="proxy-tag">MIRROR</span>
  </a>

  <a href="/proxy?url=https%3A%2F%2Fwww.proxysite.com" class="proxy-card">
    <div class="proxy-icon">🔴</div>
    <div class="proxy-name">ProxySite</div>
    <div class="proxy-desc">Simple and clean. Good for basic browsing.</div>
    <span class="proxy-tag">SIMPLE</span>
  </a>

  <a href="/proxy?url=https%3A%2F%2Fhide.me%2Fen%2Fproxy" class="proxy-card">
    <div class="proxy-icon">🟡</div>
    <div class="proxy-name">Hide.me</div>
    <div class="proxy-desc">Privacy-focused proxy. SSL encryption included.</div>
    <span class="proxy-tag">SECURE</span>
  </a>

  <a href="/proxy?url=https%3A%2F%2Fwww.plainproxies.com" class="proxy-card">
    <div class="proxy-icon">🟠</div>
    <div class="proxy-name">PlainProxies</div>
    <div class="proxy-desc">Clean interface. Good for social media and general browsing.</div>
    <span class="proxy-tag">CLEAN</span>
  </a>
</div>

<div class="note">
  <strong>💡 How to use:</strong><br>
  1. Use Quick Access above to go directly to any site<br>
  2. OR click any proxy service and use their interface<br>
  3. Your school only sees you visiting THIS site!<br>
  <br>
  <strong>🎭 Tab Disguise:</strong> Shows "Clever | Portal" so teachers think you're on Clever
</div>
</div>

<script>
let disguised = true;

function toggleDisguise() {
  disguised = !disguised;
  const btn = document.querySelector('.disguise-btn');
  
  if (disguised) {
    document.title = 'Clever | Portal';
    document.querySelector('link[rel="icon"]').href = 'https://clever.com/favicon.ico';
    btn.textContent = '🎭 Disguise: ON';
    btn.style.background = 'rgba(0,255,153,0.3)';
    btn.style.color = '#00ff99';
  } else {
    document.title = 'Rainbow Gateway';
    document.querySelector('link[rel="icon"]').href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌈</text></svg>';
    btn.textContent = '🎭 Disguise: OFF';
    btn.style.background = 'rgba(255,0,0,0.3)';
    btn.style.color = '#ff6666';
  }
}

function quickGo() {
  let url = document.getElementById('quickUrl').value.trim();
  if (!url) return;
  
  // Add https:// if not present
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Go through our proxy
  window.location.href = '/proxy?url=' + encodeURIComponent(url);
}

// Auto-disguise on blur
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    disguised = true;
    document.title = 'Clever | Portal';
    document.querySelector('link[rel="icon"]').href = 'https://clever.com/favicon.ico';
  }
});

// Allow Enter key in quick access
document.getElementById('quickUrl').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') quickGo();
});
</script>
</body>
</html>`);
});

// Actual proxy endpoint - fetches and serves content through YOUR server
// Handle both GET and POST requests
const proxyHandler = async (req, res) => {
  const targetUrl = req.query.url || req.body.url;
  
  console.log(`[PROXY] ${req.method} request to: ${targetUrl}`);
  
  if (!targetUrl) {
    console.log('[PROXY] Error: No target URL provided');
    return res.status(400).send('Missing URL parameter');
  }

  try {
    // Build fetch options based on request method
    const fetchOptions = {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      redirect: 'follow'
    };

    // If POST, include the body
    if (req.method === 'POST' && req.body) {
      console.log('[PROXY] POST body:', req.body);
      // Forward form data
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(req.body)) {
        if (key !== 'url') { // Don't send our internal url param
          formData.append(key, value);
        }
      }
      fetchOptions.body = formData.toString();
    }

    console.log('[PROXY] Fetching with options:', fetchOptions.method, fetchOptions.headers);
    const response = await fetch(targetUrl, fetchOptions);
    console.log('[PROXY] Response status:', response.status, response.statusText);

    // Get content type
    const contentType = response.headers.get('content-type');
    console.log('[PROXY] Content-Type:', contentType);
    
    // If it's HTML, rewrite links to go through proxy
    if (contentType && contentType.includes('text/html')) {
      let html = await response.text();
      console.log('[PROXY] HTML length:', html.length);
      
      // Basic link rewriting - make all links go through our proxy
      const urlObj = new URL(targetUrl);
      const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
      console.log('[PROXY] Base URL:', baseUrl);
      
      // Rewrite relative and absolute URLs
      html = html.replace(/href="([^"]+)"/g, (match, url) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return `href="/proxy?url=${encodeURIComponent(url)}"`;
        } else if (url.startsWith('/')) {
          return `href="/proxy?url=${encodeURIComponent(baseUrl + url)}"`;
        }
        return match;
      });
      
      html = html.replace(/src="([^"]+)"/g, (match, url) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return `src="/proxy?url=${encodeURIComponent(url)}"`;
        } else if (url.startsWith('/')) {
          return `src="/proxy?url=${encodeURIComponent(baseUrl + url)}"`;
        }
        return match;
      });
      
      // Rewrite forms to POST through proxy
      html = html.replace(/<form([^>]*?)action="([^"]+)"/g, (match, attrs, action) => {
        let newAction;
        if (action.startsWith('http://') || action.startsWith('https://')) {
          newAction = `/proxy?url=${encodeURIComponent(action)}`;
        } else if (action.startsWith('/')) {
          newAction = `/proxy?url=${encodeURIComponent(baseUrl + action)}`;
        } else if (action) {
          // Relative URL
          const currentPath = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
          newAction = `/proxy?url=${encodeURIComponent(baseUrl + currentPath + action)}`;
        } else {
          newAction = `/proxy?url=${encodeURIComponent(targetUrl)}`;
        }
        return `<form${attrs}action="${newAction}"`;
      });
      
      // Add hidden input to forms to preserve URL
      html = html.replace(/<\/form>/g, '</form>');
      
      // Add base tag and back button
      html = html.replace('<head>', `<head><style>.rainbow-back{position:fixed;top:10px;left:10px;padding:10px 20px;background:rgba(0,255,153,0.9);border:none;border-radius:8px;color:#000;font-weight:700;cursor:pointer;z-index:999999;font-size:12px;text-decoration:none;}</style>`);
      html = html.replace('<body>', '<body><a href="/" class="rainbow-back">← BACK TO GATEWAY</a>');
      
      res.send(html);
    } else {
      // For non-HTML content (CSS, JS, images), just pipe through
      const buffer = await response.buffer();
      res.set('Content-Type', contentType);
      res.send(buffer);
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body style="background:#000;color:#fff;font-family:system-ui;padding:40px;text-align:center;">
        <h1>❌ Unable to load site</h1>
        <p>${error.message}</p>
        <a href="/" style="color:#00ff99;">← Back to Gateway</a>
      </body>
      </html>
    `);
  }
};

// Register both GET and POST for the proxy
app.get('/proxy', requireAuth, proxyHandler);
app.post('/proxy', requireAuth, proxyHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌈 Rainbow Gateway on port ${PORT}`);
  console.log(`🔒 Password: ${ACCESS_CODE}`);
});
