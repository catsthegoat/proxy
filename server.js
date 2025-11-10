const express = require('express');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const session = require('express-session');
const app = express();

const PORT = process.env.PORT || 3000;
const ACCESS_CODE = process.env.PROXY_PASSWORD || 'rainbow123';

// Increase payload size limits for proxied content
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'rainbow-proxy-secret-key-change-this',
  resave: false,
  saveUninitialized: true,
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

// Health check endpoint for Render
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
  console.log('Login attempt with password:', password);
  console.log('Expected password:', ACCESS_CODE);
  
  if (password === ACCESS_CODE) {
    req.session.authenticated = true;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect('/login?error=1');
      }
      console.log('Login successful, session saved');
      res.redirect('/');
    });
  } else {
    console.log('Incorrect password');
    res.redirect('/login?error=1');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/', requireAuth, (req, res) => {
  // Pre-encode all proxy URLs
  const croxyproxy = encodeURIComponent(Buffer.from('https://www.croxyproxy.com').toString('base64'));
  const blockaway = encodeURIComponent(Buffer.from('https://www.blockaway.net').toString('base64'));
  const croxyrocks = encodeURIComponent(Buffer.from('https://www.croxyproxy.rocks').toString('base64'));
  const proxysite = encodeURIComponent(Buffer.from('https://www.proxysite.com').toString('base64'));
  const hideme = encodeURIComponent(Buffer.from('https://hide.me/en/proxy').toString('base64'));
  const plainproxies = encodeURIComponent(Buffer.from('https://www.plainproxies.com').toString('base64'));
  
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
.container{text-align:center;max-width:800px;width:100%;}
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
.test-box{margin-top:20px;padding:20px;background:rgba(0,255,153,0.1);border:1px solid rgba(0,255,153,0.3);border-radius:8px;}
.test-title{font-size:16px;font-weight:700;color:#00ff99;margin-bottom:15px;}
.test-steps{text-align:left;font-size:13px;color:rgba(255,255,255,0.8);line-height:1.8;}
.test-steps li{margin-bottom:8px;}
.url-example{font-family:monospace;background:rgba(0,0,0,0.5);padding:8px;border-radius:4px;color:#00ff99;margin-top:5px;word-break:break-all;font-size:11px;}
</style>
</head>
<body>
<button class="disguise-btn" onclick="toggleDisguise()">🎭 Disguise: ON</button>
<a href="/logout" class="logout">🔒 Logout</a>
<div class="container">
<h1>🌈 RAINBOW GATEWAY</h1>
<div class="subtitle">Access Professional Proxy Services Through Your Proxy</div>

<div class="test-box">
  <div class="test-title">✅ How to Test It's Using YOUR Proxy:</div>
  <ol class="test-steps">
    <li><strong>Look at the URL bar</strong> - It should show:<br>
      <div class="url-example">proxy-41so.onrender.com/p/aHR0cHM6Ly93d3cu...</div>
    </li>
    <li><strong>Check the address</strong> - It should ALWAYS start with your domain (proxy-41so.onrender.com)</li>
    <li><strong>Tab disguise</strong> - Shows "Clever | Portal" with Clever icon to blend in at school!</li>
    <li><strong>School network sees</strong> - Only traffic to proxy-41so.onrender.com, nothing else!</li>
  </ol>
</div>

<div class="proxy-grid">
  <a href="/p/${croxyproxy}" class="proxy-card">
    <div class="proxy-icon">🔵</div>
    <div class="proxy-name">CroxyProxy</div>
    <div class="proxy-desc">Best for TikTok, Instagram, YouTube. Very reliable and fast.</div>
    <span class="proxy-tag">RECOMMENDED</span>
  </a>

  <a href="/p/${blockaway}" class="proxy-card">
    <div class="proxy-icon">🟢</div>
    <div class="proxy-name">BlockAway</div>
    <div class="proxy-desc">Great for social media and streaming. Modern interface.</div>
    <span class="proxy-tag">FAST</span>
  </a>

  <a href="/p/${croxyrocks}" class="proxy-card">
    <div class="proxy-icon">🟣</div>
    <div class="proxy-name">CroxyProxy Rocks</div>
    <div class="proxy-desc">Alternative CroxyProxy mirror. Works if main is blocked.</div>
    <span class="proxy-tag">MIRROR</span>
  </a>

  <a href="/p/${proxysite}" class="proxy-card">
    <div class="proxy-icon">🔴</div>
    <div class="proxy-name">ProxySite</div>
    <div class="proxy-desc">Simple and clean. Good for basic browsing.</div>
    <span class="proxy-tag">SIMPLE</span>
  </a>

  <a href="/p/${hideme}" class="proxy-card">
    <div class="proxy-icon">🟡</div>
    <div class="proxy-name">Hide.me</div>
    <div class="proxy-desc">Privacy-focused proxy. SSL encryption included.</div>
    <span class="proxy-tag">SECURE</span>
  </a>

  <a href="/p/${plainproxies}" class="proxy-card">
    <div class="proxy-icon">🟠</div>
    <div class="proxy-name">PlainProxies</div>
    <div class="proxy-desc">Clean interface. Good for social media and general browsing.</div>
    <span class="proxy-tag">CLEAN</span>
  </a>
</div>

<div class="note">
  <strong>💡 How it works:</strong><br>
  1. Click any proxy service above<br>
  2. You paste in the website you want (URL stays on YOUR domain)<br>
  3. Use that service to access TikTok, Snapchat, etc.<br>
  <br>
  <strong>⚡ Triple Layer:</strong> --- <br>
  <strong>🎭 Disguised:</strong> Tab shows "Clever | Portal" 
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

// Auto-disguise on blur (when teacher walks by)
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    disguised = true;
    document.title = 'Clever | Portal';
    document.querySelector('link[rel="icon"]').href = 'https://clever.com/favicon.ico';
  }
});
</script>
</body>
</html>`);
});

// Simple redirect endpoint that goes straight to the proxy service
app.get('/go', requireAuth, (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.redirect('/');
  }
  
  // Just redirect directly - simple and clean
  res.redirect(targetUrl);
});

// FULL PROXY MODE - for when you want to actually proxy the proxy site
app.get('/p/:encodedUrl(*)', requireAuth, async (req, res) => {
  try {
    const decodedParam = decodeURIComponent(req.params.encodedUrl);
    const targetUrl = Buffer.from(decodedParam, 'base64').toString('utf-8');
    
    console.log('Proxying:', targetUrl);

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': new URL(targetUrl).origin
      },
      redirect: 'follow',
      signal: controller.signal
    });

    clearTimeout(timeout);

    const contentType = response.headers.get('content-type') || '';
    
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('X-Frame-Options');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (contentType.includes('text/html')) {
      let html = await response.text();
      const url = new URL(targetUrl);
      const baseUrl = url.origin;
      const basePath = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      req.session.proxyBase = baseUrl;

      // Aggressive URL rewriting
      html = html.replace(/(href|src|action|data|poster)=["']([^"']+)["']/gi, (match, attr, urlVal) => {
        if (!urlVal || urlVal.startsWith('data:') || urlVal.startsWith('javascript:') || urlVal.startsWith('mailto:') || urlVal === '#') {
          return match;
        }
        
        try {
          let absoluteUrl;
          if (urlVal.startsWith('//')) {
            absoluteUrl = 'https:' + urlVal;
          } else if (urlVal.startsWith('http')) {
            absoluteUrl = urlVal;
          } else if (urlVal.startsWith('/')) {
            absoluteUrl = baseUrl + urlVal;
          } else {
            absoluteUrl = new URL(urlVal, basePath).href;
          }
          const encoded = encodeURIComponent(Buffer.from(absoluteUrl).toString('base64'));
          return `${attr}="/p/${encoded}"`;
        } catch (e) {
          return match;
        }
      });

      html = html.replace(/url\(['"]?([^'")\s]+)['"]?\)/gi, (match, urlVal) => {
        if (urlVal.startsWith('data:')) return match;
        try {
          let absoluteUrl;
          if (urlVal.startsWith('//')) {
            absoluteUrl = 'https:' + urlVal;
          } else if (urlVal.startsWith('http')) {
            absoluteUrl = urlVal;
          } else if (urlVal.startsWith('/')) {
            absoluteUrl = baseUrl + urlVal;
          } else {
            absoluteUrl = new URL(urlVal, basePath).href;
          }
          const encoded = encodeURIComponent(Buffer.from(absoluteUrl).toString('base64'));
          return `url('/p/${encoded}')`;
        } catch (e) {
          return match;
        }
      });

      // Minimal proxy script
      const proxyScript = `
<script>
(function(){
  const baseUrl = '${baseUrl}';
  const proxyUrl = (url) => {
    if(!url || url.startsWith('data:') || url.startsWith('javascript:') || url === '#') return url;
    try {
      let abs;
      if(url.startsWith('//')) abs = 'https:' + url;
      else if(url.startsWith('http')) abs = url;
      else if(url.startsWith('/')) abs = baseUrl + url;
      else abs = new URL(url, '${targetUrl}').href;
      return '/p/' + encodeURIComponent(btoa(abs));
    } catch(e) { return url; }
  };
  
  const origFetch = window.fetch;
  window.fetch = function(url, opts) {
    if(typeof url === 'string') url = proxyUrl(url);
    return origFetch(url, opts);
  };
  
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(m, url, ...args) {
    if(typeof url === 'string') url = proxyUrl(url);
    return origOpen.call(this, m, url, ...args);
  };
  
  try {
    Object.defineProperty(window, 'top', {get: () => window.self});
    Object.defineProperty(window, 'parent', {get: () => window.self});
  } catch(e) {}
})();
</script>
`;
      
      html = html.replace('</head>', proxyScript + '</head>');
      if (!html.includes('</head>')) {
        html = proxyScript + html;
      }

      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }

    if (contentType.includes('text/css')) {
      let css = await response.text();
      const url = new URL(targetUrl);
      const baseUrl = url.origin;
      
      css = css.replace(/url\(['"]?([^'")\s]+)['"]?\)/gi, (match, urlVal) => {
        if (urlVal.startsWith('data:')) return match;
        try {
          let absoluteUrl;
          if (urlVal.startsWith('//')) absoluteUrl = 'https:' + urlVal;
          else if (urlVal.startsWith('http')) absoluteUrl = urlVal;
          else if (urlVal.startsWith('/')) absoluteUrl = baseUrl + urlVal;
          else absoluteUrl = new URL(urlVal, targetUrl).href;
          const encoded = encodeURIComponent(Buffer.from(absoluteUrl).toString('base64'));
          return `url('/p/${encoded}')`;
        } catch (e) {
          return match;
        }
      });
      
      res.setHeader('Content-Type', 'text/css');
      return res.send(css);
    }

    const buffer = await response.buffer();
    res.setHeader('Content-Type', contentType);
    res.send(buffer);

  } catch (error) {
    console.error('Proxy error:', error);
    
    // Send a simpler error response
    res.status(500).send(`
      <html>
      <head><style>body{background:#000;color:#fff;font-family:system-ui;padding:50px;text-align:center;}</style></head>
      <body>
        <h1 style="color:#ff0066;">❌ Error</h1>
        <p>${error.message}</p>
        <a href="/" style="color:#00ff99;text-decoration:none;">← Back to Gateway</a>
      </body>
      </html>
    `);
  }
});

// Catch-all route should be last
app.get('*', requireAuth, (req, res) => {
  if (req.path === '/' || req.path === '/login' || req.path === '/logout' || req.path === '/go' || req.path.startsWith('/p/') || req.path === '/health') {
    return;
  }

  if (req.session.proxyBase) {
    const targetUrl = req.session.proxyBase + req.path + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
    const encoded = encodeURIComponent(Buffer.from(targetUrl).toString('base64'));
    return res.redirect(`/p/${encoded}`);
  }

  res.redirect('/');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌈 Rainbow Gateway on port ${PORT}`);
  console.log(`🔒 Password: ${ACCESS_CODE}`);
});
