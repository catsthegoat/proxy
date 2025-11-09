const express = require('express');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const session = require('express-session');
const app = express();

const PORT = process.env.PORT || 3000;
const ACCESS_CODE = process.env.PROXY_PASSWORD || 'rainbow123';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'rainbow-proxy-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
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
<title>Rainbow Proxy - Login</title>
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
    res.redirect('/');
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
<title>Rainbow Gateway</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:system-ui;background:#000;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
.container{text-align:center;max-width:800px;width:100%;}
h1{font-size:48px;margin-bottom:15px;background:linear-gradient(90deg,#fff 0%,#ff0066 50%,#00ff99 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:flow 3s linear infinite;}
@keyframes flow{to{background-position:200% center;}}
.subtitle{color:rgba(255,255,255,0.6);margin-bottom:40px;font-size:14px;}
.logout{position:fixed;top:20px;right:20px;padding:10px 20px;background:rgba(255,0,0,0.3);border:1px solid rgba(255,0,0,0.5);border-radius:8px;font-size:12px;color:#fff;text-decoration:none;}
.logout:hover{background:rgba(255,0,0,0.5);}
.proxy-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-top:30px;}
.proxy-card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:25px;cursor:pointer;transition:all 0.3s;text-decoration:none;color:#fff;display:block;}
.proxy-card:hover{transform:translateY(-5px);border-color:rgba(255,255,255,0.5);background:rgba(255,255,255,0.1);}
.proxy-icon{font-size:40px;margin-bottom:15px;}
.proxy-name{font-size:20px;font-weight:700;margin-bottom:8px;}
.proxy-desc{font-size:13px;color:rgba(255,255,255,0.6);line-height:1.4;}
.proxy-tag{display:inline-block;margin-top:10px;padding:4px 10px;background:rgba(0,255,153,0.2);border:1px solid rgba(0,255,153,0.4);border-radius:4px;font-size:11px;color:#00ff99;}
.note{margin-top:40px;padding:20px;background:rgba(255,255,0,0.1);border:1px solid rgba(255,255,0,0.3);border-radius:8px;font-size:13px;color:rgba(255,255,0,0.8);line-height:1.6;}
</style>
</head>
<body>
<a href="/logout" class="logout">🔒 Logout</a>
<div class="container">
<h1>🌈 RAINBOW GATEWAY</h1>
<div class="subtitle">Access Professional Proxy Services</div>

<div class="proxy-grid">
  <a href="/go?url=https://www.croxyproxy.com" class="proxy-card">
    <div class="proxy-icon">🔵</div>
    <div class="proxy-name">CroxyProxy</div>
    <div class="proxy-desc">Best for TikTok, Instagram, YouTube. Very reliable and fast.</div>
    <span class="proxy-tag">RECOMMENDED</span>
  </a>

  <a href="/go?url=https://www.blockaway.net" class="proxy-card">
    <div class="proxy-icon">🟢</div>
    <div class="proxy-name">BlockAway</div>
    <div class="proxy-desc">Great for social media and streaming. Modern interface.</div>
    <span class="proxy-tag">FAST</span>
  </a>

  <a href="/go?url=https://www.croxyproxy.rocks" class="proxy-card">
    <div class="proxy-icon">🟣</div>
    <div class="proxy-name">CroxyProxy Rocks</div>
    <div class="proxy-desc">Alternative CroxyProxy mirror. Works if main is blocked.</div>
    <span class="proxy-tag">MIRROR</span>
  </a>

  <a href="/go?url=https://www.proxysite.com" class="proxy-card">
    <div class="proxy-icon">🔴</div>
    <div class="proxy-name">ProxySite</div>
    <div class="proxy-desc">Simple and clean. Good for basic browsing.</div>
    <span class="proxy-tag">SIMPLE</span>
  </a>

  <a href="/go?url=https://hide.me/en/proxy" class="proxy-card">
    <div class="proxy-icon">🟡</div>
    <div class="proxy-name">Hide.me</div>
    <div class="proxy-desc">Privacy-focused proxy. SSL encryption included.</div>
    <span class="proxy-tag">SECURE</span>
  </a>

  <a href="/go?url=https://www.hidemyass.com/proxy" class="proxy-card">
    <div class="proxy-icon">🟠</div>
    <div class="proxy-name">HideMyAss</div>
    <div class="proxy-desc">Popular proxy service. Multiple server locations.</div>
    <span class="proxy-tag">POPULAR</span>
  </a>
</div>

<div class="note">
  <strong>💡 How to use:</strong><br>
  1. Click any proxy service above<br>
  2. Once loaded, enter your desired website (TikTok, Snapchat, etc.)<br>
  3. These professional proxies handle all the complex stuff!<br>
  <br>
  <strong>⚡ Pro tip:</strong> Try CroxyProxy or BlockAway first - they work best for social media!
</div>
</div>
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

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': new URL(targetUrl).origin
      },
      redirect: 'follow'
    });

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

app.get('*', requireAuth, (req, res, next) => {
  if (req.path === '/' || req.path === '/login' || req.path === '/logout' || req.path === '/go' || req.path.startsWith('/p/')) {
    return next();
  }

  if (req.session.proxyBase) {
    const targetUrl = req.session.proxyBase + req.path + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
    const encoded = encodeURIComponent(Buffer.from(targetUrl).toString('base64'));
    return res.redirect(`/p/${encoded}`);
  }

  res.redirect('/');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌈 Rainbow Gateway on port ${PORT}`);
  console.log(`🔒 Password: ${ACCESS_CODE}`);
});
