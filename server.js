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
  <span class="quick-link" onclick="fillUrl('coolmathgames.com')">🎮 Coolmath</span>
  <span class="quick-link" onclick="fillUrl('krunker.io')">🔫 Krunker</span>
  <span class="quick-link" onclick="fillUrl('slither.io')">🐍 Slither.io</span>
  <span class="quick-link" onclick="fillUrl('agar.io')">⚫ Agar.io</span>
  <span class="quick-link" onclick="fillUrl('chess.com')">♟️ Chess</span>
</div>
<div class="warning">⚠️ Some sites may not work. Gaming sites work best!</div>
</div>
<script>
function fillUrl(url){document.getElementById('url').value=url;}
function go(){
  let url=document.getElementById('url').value.trim();
  if(!url)return alert('Please enter a URL');
  if(!url.match(/^https?:\\/\\//))url='https://'+url;
  window.location.href='/p/'+encodeURIComponent(btoa(url));
}
document.getElementById('url').addEventListener('keypress',e=>{
  if(e.key==='Enter')go();
});
</script>
</body>
</html>`);
});

// PROXY ROUTE - catches ALL /p/ requests
app.get('/p/:encodedUrl(*)', requireAuth, async (req, res) => {
  try {
    // Store current base URL in session for relative navigation
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
    
    // Remove frame-busting headers
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('X-Frame-Options');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Handle HTML
    if (contentType.includes('text/html')) {
      let html = await response.text();
      const url = new URL(targetUrl);
      const baseUrl = url.origin;
      const basePath = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      // Store base for this session
      req.session.proxyBase = baseUrl;

      // Rewrite all URLs
      html = html.replace(/(href|src|action|data)=["']([^"']+)["']/gi, (match, attr, urlVal) => {
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

      // Rewrite CSS url()
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

      // Inject powerful proxy script that handles ALL navigation
      const proxyScript = `
<base href="/p/${encodeURIComponent(Buffer.from(baseUrl + '/').toString('base64'))}">
<script>
(function(){
  const baseUrl = '${baseUrl}';
  const currentUrl = '${targetUrl}';
  
  const proxyUrl = (url) => {
    if(!url || url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('blob:') || url === '#') return url;
    try {
      let abs;
      if(url.startsWith('//')) abs = 'https:' + url;
      else if(url.startsWith('http')) abs = url;
      else if(url.startsWith('/')) abs = baseUrl + url;
      else abs = new URL(url, currentUrl).href;
      return '/p/' + encodeURIComponent(btoa(abs));
    } catch(e) { 
      console.error('Proxy URL error:', e, url);
      return url; 
    }
  };

  // Intercept fetch
  const origFetch = window.fetch;
  window.fetch = function(url, opts) {
    if(typeof url === 'string') {
      const proxied = proxyUrl(url);
      console.log('Fetch:', url, '->', proxied);
      url = proxied;
    }
    return origFetch(url, opts);
  };

  // Intercept XHR
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    if(typeof url === 'string') {
      url = proxyUrl(url);
    }
    return origOpen.call(this, method, url, ...args);
  };

  // Intercept window.open
  const origWindowOpen = window.open;
  window.open = function(url, ...args) {
    if(url) {
      window.location.href = proxyUrl(url);
      return null;
    }
    return origWindowOpen(url, ...args);
  };

  // Intercept location changes
  const origPushState = history.pushState;
  history.pushState = function(state, title, url) {
    if(url && typeof url === 'string' && !url.startsWith('/p/')) {
      url = proxyUrl(url);
    }
    return origPushState.call(this, state, title, url);
  };

  const origReplaceState = history.replaceState;
  history.replaceState = function(state, title, url) {
    if(url && typeof url === 'string' && !url.startsWith('/p/')) {
      url = proxyUrl(url);
    }
    return origReplaceState.call(this, state, title, url);
  };

  // Watch for dynamically added elements
  const observer = new MutationObserver((mutations) => {
    document.querySelectorAll('[src]:not([data-proxied]), [href]:not([data-proxied])').forEach(el => {
      ['src', 'href'].forEach(attr => {
        const val = el.getAttribute(attr);
        if(val && !val.startsWith('/p/') && !val.startsWith('data:') && !val.startsWith('javascript:') && val !== '#') {
          const proxied = proxyUrl(val);
          if(proxied !== val) {
            el.setAttribute(attr, proxied);
            el.setAttribute('data-proxied', 'true');
          }
        }
      });
    });
  });
  
  if(document.body) {
    observer.observe(document.body, {childList: true, subtree: true, attributes: true});
  }

  // Block frame-busting
  try {
    Object.defineProperty(window, 'top', {get: () => window.self, configurable: false});
    Object.defineProperty(window, 'parent', {get: () => window.self, configurable: false});
  } catch(e) {}

  // Fix iframes
  document.querySelectorAll('iframe').forEach(iframe => {
    const src = iframe.getAttribute('src');
    if(src && !src.startsWith('/p/')) {
      iframe.setAttribute('src', proxyUrl(src));
    }
  });

  console.log('🌈 Proxy active for:', currentUrl);
})();
</script>
`;
      
      html = html.replace('<head>', '<head>' + proxyScript);
      if (!html.includes('<head>')) {
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
      
      css = css.replace(/url\(['"]?([^'")\s]+)['"]?\)/gi, (match, urlVal) => {
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
            absoluteUrl = new URL(urlVal, targetUrl).href;
          }
          const encoded = encodeURIComponent(Buffer.from(absoluteUrl).toString('base64'));
          return `url('/p/${encoded}')`;
        } catch (e) {
          return match;
        }
      });
      
      res.setHeader('Content-Type', 'text/css');
      return res.send(css);
    }

    // Pass through everything else (JS, images, etc)
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
        <a href="/" style="color:#00ff99;">← Home</a>
      </body>
      </html>
    `);
  }
});

// CATCH-ALL ROUTE - handles relative paths like /0-run-3
app.get('*', requireAuth, (req, res, next) => {
  // Skip if it's a known route
  if (req.path === '/' || req.path === '/login' || req.path === '/logout' || req.path === '/health' || req.path.startsWith('/p/')) {
    return next();
  }

  // If we have a base URL in session, proxy the relative path
  if (req.session.proxyBase) {
    const targetUrl = req.session.proxyBase + req.path + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
    console.log('Catching relative path:', req.path, '->', targetUrl);
    const encoded = encodeURIComponent(Buffer.from(targetUrl).toString('base64'));
    return res.redirect(`/p/${encoded}`);
  }

  // Otherwise redirect to home
  res.redirect('/');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌈 Rainbow Proxy on port ${PORT}`);
  console.log(`🔒 Password: ${ACCESS_CODE}`);
});
