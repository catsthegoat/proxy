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

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
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
<h1>🌈 RAINBOW PROXY</h1>
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
<title>Rainbow Proxy</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:system-ui;background:#000;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;}
.container{text-align:center;padding:40px;max-width:600px;width:100%;}
h1{font-size:48px;margin-bottom:30px;background:linear-gradient(90deg,#fff 0%,#ff0066 50%,#00ff99 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:flow 3s linear infinite;}
@keyframes flow{to{background-position:200% center;}}
input{width:100%;padding:15px 20px;border-radius:8px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.05);color:#fff;font-size:16px;text-align:center;outline:none;margin:20px 0;}
input::placeholder{color:rgba(255,255,255,0.4);}
button{padding:15px 40px;background:#fff;color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;margin:10px 5px;}
button:hover{opacity:0.9;}
.logout{position:fixed;top:20px;left:20px;padding:10px 20px;background:rgba(255,0,0,0.3);border:1px solid rgba(255,0,0,0.5);border-radius:8px;font-size:12px;color:#fff;text-decoration:none;}
.quick-links{margin-top:30px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
.quick-link{padding:10px 15px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);border-radius:8px;font-size:13px;color:#fff;cursor:pointer;}
.quick-link:hover{background:rgba(255,255,255,0.1);}
.warning{margin-top:20px;padding:15px;background:rgba(255,255,0,0.1);border:1px solid rgba(255,255,0,0.3);border-radius:8px;font-size:13px;color:rgba(255,255,0,0.8);}
</style>
</head>
<body>
<a href="/logout" class="logout">🔒 Logout</a>
<div class="container">
<h1>🌈 RAINBOW PROXY</h1>
<input id="url" placeholder="enter website (e.g. example.com)">
<br>
<button onclick="go()">🚀 GO</button>
<div class="quick-links">
  <span class="quick-link" onclick="fillUrl('nowgg.me')">🎮 now.gg</span>
  <span class="quick-link" onclick="fillUrl('krunker.io')">🔫 Krunker</span>
  <span class="quick-link" onclick="fillUrl('slither.io')">🐍 Slither.io</span>
  <span class="quick-link" onclick="fillUrl('agar.io')">⚫ Agar.io</span>
  <span class="quick-link" onclick="fillUrl('geoguessr.com')">🌍 GeoGuessr</span>
  <span class="quick-link" onclick="fillUrl('chess.com')">♟️ Chess.com</span>
</div>
<div class="warning">⚠️ Note: Complex sites with heavy DRM/anti-bot (like Poki, some Coolmath games) may not work. Try simple .io games or chess/puzzle sites!</div>
</div>
<script>
function fillUrl(url){document.getElementById('url').value=url;}
function go(){
  let url=document.getElementById('url').value.trim();
  if(!url)return alert('Please enter a URL');
  if(!url.match(/^https?:\\/\\//))url='https://'+url;
  window.location.href='/p/'+btoa(url);
}
document.getElementById('url').addEventListener('keypress',e=>{
  if(e.key==='Enter')go();
});
</script>
</body>
</html>`);
});

// NEW APPROACH: Use path-based proxying instead of query params
app.get('/p/:encodedUrl(*)', requireAuth, async (req, res) => {
  try {
    const targetUrl = Buffer.from(req.params.encodedUrl, 'base64').toString();
    console.log('Proxying:', targetUrl);

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': new URL(targetUrl).origin,
        'Origin': new URL(targetUrl).origin
      },
      redirect: 'follow'
    });

    const contentType = response.headers.get('content-type') || '';
    
    // Remove restrictive headers
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('Content-Security-Policy-Report-Only');
    res.removeHeader('X-Frame-Options');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // Handle HTML
    if (contentType.includes('text/html')) {
      let html = await response.text();
      const url = new URL(targetUrl);
      const baseUrl = url.origin;

      // AGGRESSIVE URL REWRITING
      html = html.replace(/(href|src|action|data|poster|background)=["']([^"']+)["']/gi, (match, attr, url) => {
        if (!url || url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('mailto:') || url.startsWith('#')) {
          return match;
        }
        
        let absoluteUrl;
        try {
          if (url.startsWith('//')) {
            absoluteUrl = 'https:' + url;
          } else if (url.startsWith('http')) {
            absoluteUrl = url;
          } else if (url.startsWith('/')) {
            absoluteUrl = baseUrl + url;
          } else {
            absoluteUrl = new URL(url, targetUrl).href;
          }
          return `${attr}="/p/${Buffer.from(absoluteUrl).toString('base64')}"`;
        } catch (e) {
          return match;
        }
      });

      // Rewrite CSS url()
      html = html.replace(/url\(['"]?([^'")\s]+)['"]?\)/gi, (match, url) => {
        if (url.startsWith('data:')) return match;
        try {
          let absoluteUrl;
          if (url.startsWith('//')) {
            absoluteUrl = 'https:' + url;
          } else if (url.startsWith('http')) {
            absoluteUrl = url;
          } else if (url.startsWith('/')) {
            absoluteUrl = baseUrl + url;
          } else {
            absoluteUrl = new URL(url, targetUrl).href;
          }
          return `url('/p/${Buffer.from(absoluteUrl).toString('base64')}')`;
        } catch (e) {
          return match;
        }
      });

      // Inject super-powered proxy script
      const proxyScript = `
<script>
(function(){
  const baseUrl = '${baseUrl}';
  const proxyUrl = (url) => {
    if(!url || url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('blob:')) return url;
    try {
      let abs;
      if(url.startsWith('//')) abs = 'https:' + url;
      else if(url.startsWith('http')) abs = url;
      else if(url.startsWith('/')) abs = baseUrl + url;
      else abs = new URL(url, window.location.href).href;
      return '/p/' + btoa(abs);
    } catch(e) { return url; }
  };

  // Intercept fetch
  const origFetch = window.fetch;
  window.fetch = function(url, opts) {
    if(typeof url === 'string') url = proxyUrl(url);
    return origFetch(url, opts);
  };

  // Intercept XHR
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    if(typeof url === 'string') url = proxyUrl(url);
    return origOpen.call(this, method, url, ...args);
  };

  // Intercept dynamic elements
  const observer = new MutationObserver((mutations) => {
    document.querySelectorAll('[src], [href]').forEach(el => {
      ['src', 'href'].forEach(attr => {
        const val = el.getAttribute(attr);
        if(val && val.startsWith('http') && !val.startsWith('/p/')) {
          el.setAttribute(attr, proxyUrl(val));
        }
      });
    });
  });
  if(document.body) observer.observe(document.body, {childList:true, subtree:true, attributes:true});

  // Block frame-busting
  Object.defineProperty(window, 'top', {get: () => window.self});
  Object.defineProperty(window, 'parent', {get: () => window.self});
  
  // Override window.open
  window.open = function(url) {
    window.location.href = proxyUrl(url);
    return null;
  };

  console.log('🌈 Proxy active');
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

    // Handle CSS
    if (contentType.includes('text/css')) {
      let css = await response.text();
      const url = new URL(targetUrl);
      const baseUrl = url.origin;
      
      css = css.replace(/url\(['"]?([^'")\s]+)['"]?\)/gi, (match, url) => {
        if (url.startsWith('data:')) return match;
        try {
          let absoluteUrl;
          if (url.startsWith('//')) {
            absoluteUrl = 'https:' + url;
          } else if (url.startsWith('http')) {
            absoluteUrl = url;
          } else if (url.startsWith('/')) {
            absoluteUrl = baseUrl + url;
          } else {
            absoluteUrl = new URL(url, targetUrl).href;
          }
          return `url('/p/${Buffer.from(absoluteUrl).toString('base64')}')`;
        } catch (e) {
          return match;
        }
      });
      
      res.setHeader('Content-Type', 'text/css');
      return res.send(css);
    }

    // Handle JavaScript
    if (contentType.includes('javascript') || contentType.includes('application/json')) {
      const text = await response.text();
      res.setHeader('Content-Type', contentType);
      return res.send(text);
    }

    // Handle binary content (images, videos, etc)
    const buffer = await response.buffer();
    res.setHeader('Content-Type', contentType);
    res.send(buffer);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send(`
      <html>
      <head><style>body{background:#000;color:#fff;font-family:system-ui;padding:50px;text-align:center;}</style></head>
      <body>
        <h1 style="color:#ff0066;">❌ Error Loading Page</h1>
        <p>${error.message}</p>
        <a href="/" style="color:#00ff99;text-decoration:none;">← Go Back</a>
      </body>
      </html>
    `);
  }
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Error');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌈 Rainbow Proxy running on port ${PORT}`);
  console.log(`🔒 Password: ${ACCESS_CODE}`);
});
