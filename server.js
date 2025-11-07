const express = require('express');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;

const ACCESS_CODE = process.env.PROXY_PASSWORD || 'rainbow123';

app.use(session({
  secret: 'rainbow-proxy-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(express.urlencoded({ extended: true }));

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
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Inter',sans-serif;background:#000;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.login-container{text-align:center;padding:40px;max-width:400px;}
h1{font-size:48px;margin-bottom:30px;background:linear-gradient(90deg,#fff 0%,#ff0066 25%,#00ff99 50%,#3399ff 75%,#fff 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:flow 4s linear infinite;}
@keyframes flow{to{background-position:200% center;}}
input{width:100%;padding:15px 20px;border-radius:8px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.05);color:#fff;font-size:16px;text-align:center;outline:none;margin:20px 0;}
input::placeholder{color:rgba(255,255,255,0.4);}
button{width:100%;padding:15px;background:#fff;color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;}
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
<title>Rainbow Proxy</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:system-ui;background:#000;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;}
.container{text-align:center;padding:40px;max-width:600px;}
h1{font-size:48px;margin-bottom:30px;background:linear-gradient(90deg,#fff 0%,#ff0066 50%,#00ff99 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:flow 3s linear infinite;}
@keyframes flow{to{background-position:200% center;}}
input{width:100%;padding:15px;border-radius:8px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.05);color:#fff;font-size:16px;outline:none;margin:20px 0;}
button{padding:15px 40px;background:#fff;color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer;}
.logout{position:fixed;top:20px;left:20px;padding:10px 20px;background:rgba(255,0,0,0.3);border-radius:8px;color:#fff;text-decoration:none;}
.quick-links{margin-top:20px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
.quick-link{padding:10px 15px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);border-radius:8px;cursor:pointer;}
</style>
</head>
<body>
<a href="/logout" class="logout">🔒 Logout</a>
<div class="container">
<h1>🌈 RAINBOW PROXY</h1>
<input id="url" placeholder="enter website URL">
<br>
<button onclick="go()">GO</button>
<div class="quick-links">
  <span class="quick-link" onclick="fillUrl('coolmathgames.com')">🎮 Coolmath</span>
  <span class="quick-link" onclick="fillUrl('poki.com')">🎯 Poki</span>
  <span class="quick-link" onclick="fillUrl('krunker.io')">🔫 Krunker</span>
  <span class="quick-link" onclick="fillUrl('slither.io')">🐍 Slither</span>
</div>
</div>
<script>
function fillUrl(url){document.getElementById('url').value=url;}
function go(){
  let url=document.getElementById('url').value.trim();
  if(!url)return;
  if(!url.match(/^https?:\\/\\//))url='https://'+url;
  window.location.href='/proxy?url='+encodeURIComponent(url);
}
document.getElementById('url').addEventListener('keypress',e=>{if(e.key==='Enter')go();});
</script>
</body>
</html>`);
});

app.get('*', requireAuth, async (req, res, next) => {
  if (req.path === '/' || req.path === '/login' || req.path === '/logout' || req.path.startsWith('/proxy')) {
    return next();
  }
  
  const referer = req.get('referer');
  if (referer && referer.includes('/proxy?url=')) {
    const urlMatch = referer.match(/url=([^&]+)/);
    if (urlMatch) {
      try {
        const baseUrl = decodeURIComponent(urlMatch[1]);
        const parsedBase = new URL(baseUrl);
        const targetUrl = parsedBase.origin + req.path + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
        return res.redirect('/proxy?url=' + encodeURIComponent(targetUrl));
      } catch (e) {}
    }
  }
  next();
});

app.get('/proxy', requireAuth, async (req, res) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).send('Missing URL');
  }

  try {
    let validUrl = targetUrl;
    if (!validUrl.match(/^https?:\/\//)) {
      validUrl = 'https://' + validUrl;
    }
    
    new URL(validUrl); // Validate
    
    const response = await fetch(validUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*'
      },
      redirect: 'follow'
    });

    const contentType = response.headers.get('content-type') || '';
    
    // CRITICAL: Remove all security headers
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('Content-Security-Policy-Report-Only');
    res.removeHeader('X-Frame-Options');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    
    if (!contentType.includes('text/html')) {
      const buffer = await response.buffer();
      res.set('Content-Type', contentType);
      return res.send(buffer);
    }

    let html = await response.text();
    const url = new URL(validUrl);
    const baseUrl = url.origin;
    const fullBase = validUrl.substring(0, validUrl.lastIndexOf('/') + 1);

    const rewriteUrl = (originalUrl) => {
      if (!originalUrl || originalUrl === '#' || originalUrl === '/' || originalUrl.startsWith('data:') || originalUrl.startsWith('javascript:') || originalUrl.startsWith('mailto:') || originalUrl.startsWith('tel:') || originalUrl.startsWith('blob:')) {
        return originalUrl;
      }
      
      try {
        let absolute;
        if (originalUrl.startsWith('//')) {
          absolute = url.protocol + originalUrl;
        }
        else if (originalUrl.match(/^https?:\/\//)) {
          absolute = originalUrl;
        }
        else if (originalUrl.startsWith('/')) {
          absolute = baseUrl + originalUrl;
        }
        else if (originalUrl.startsWith('?')) {
          absolute = validUrl.split('?')[0] + originalUrl;
        }
        else if (originalUrl.startsWith('#')) {
          return originalUrl;
        }
        else {
          absolute = new URL(originalUrl, fullBase).href;
        }
        return '/proxy?url=' + encodeURIComponent(absolute);
      } catch (e) {
        return originalUrl;
      }
    };

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const navBar = document.createElement('div');
    navBar.innerHTML = `
      <div style="position:fixed;top:10px;left:10px;z-index:999999;display:flex;gap:10px;">
        <button onclick="window.history.back()" style="background:rgba(0,0,0,0.8);color:#fff;padding:10px 15px;border-radius:8px;border:none;cursor:pointer;">← Back</button>
        <a href="/" style="background:rgba(255,0,0,0.6);color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">🏠 Home</a>
      </div>
    `;
    
    // SUPER AGGRESSIVE PROXY SCRIPT
    const proxyScript = document.createElement('script');
    proxyScript.textContent = `
      (function() {
        console.log('🌈 Rainbow Proxy Active');
        
        // Block frame detection
        Object.defineProperty(window, 'top', {get: () => window.self, set: () => {}});
        Object.defineProperty(window, 'parent', {get: () => window.self, set: () => {}});
        Object.defineProperty(window, 'frameElement', {get: () => null});
        
        // Intercept ALL iframes
        const origCreateElement = document.createElement.bind(document);
        document.createElement = function(tag) {
          const el = origCreateElement(tag);
          if (tag.toLowerCase() === 'iframe') {
            const origSetAttr = el.setAttribute.bind(el);
            el.setAttribute = function(name, val) {
              if (name === 'src' && val && val.startsWith('http') && !val.includes('/proxy?url=')) {
                console.log('🎮 Proxying iframe:', val);
                val = '/proxy?url=' + encodeURIComponent(val);
              }
              if (name === 'sandbox') return; // Block sandbox!
              return origSetAttr(name, val);
            };
            Object.defineProperty(el, 'src', {
              get: function() { return this.getAttribute('src'); },
              set: function(val) {
                if (val && val.startsWith('http') && !val.includes('/proxy?url=')) {
                  console.log('🎮 Proxying iframe.src:', val);
                  val = '/proxy?url=' + encodeURIComponent(val);
                }
                this.setAttribute('src', val);
              }
            });
          }
          return el;
        };
        
        // Intercept fetch
        const origFetch = window.fetch;
        window.fetch = function(url, opts) {
          if (typeof url === 'string' && url.startsWith('http') && !url.includes('/proxy?url=')) {
            console.log('📡 Proxying fetch:', url);
            url = '/proxy?url=' + encodeURIComponent(url);
          }
          return origFetch(url, opts);
        };
        
        // Intercept XHR
        const origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
          if (typeof url === 'string' && url.startsWith('http') && !url.includes('/proxy?url=')) {
            console.log('📡 Proxying XHR:', url);
            url = '/proxy?url=' + encodeURIComponent(url);
          }
          return origOpen.call(this, method, url, ...args);
        };
        
        // Fix all iframes NOW
        function fixIframes() {
          document.querySelectorAll('iframe').forEach(iframe => {
            const src = iframe.getAttribute('src');
            if (src && src.startsWith('http') && !src.includes('/proxy?url=')) {
              console.log('🔧 Fixing iframe:', src);
              iframe.src = '/proxy?url=' + encodeURIComponent(src);
            }
            iframe.removeAttribute('sandbox');
            iframe.setAttribute('allow', 'autoplay; fullscreen; *');
          });
        }
        
        fixIframes();
        setInterval(fixIframes, 1000); // Keep fixing!
        
        new MutationObserver(fixIframes).observe(document.body, {childList: true, subtree: true});
        
        console.log('✅ Proxy ready!');
      })();
    `;
    
    if (document.head) {
      document.head.insertBefore(proxyScript, document.head.firstChild);
    }
    if (document.body) {
      document.body.insertBefore(navBar, document.body.firstChild);
    }

    // Rewrite all URLs in DOM
    document.querySelectorAll('a[href]').forEach(el => {
      el.setAttribute('href', rewriteUrl(el.getAttribute('href')));
    });

    document.querySelectorAll('[src]').forEach(el => {
      el.setAttribute('src', rewriteUrl(el.getAttribute('src')));
    });

    document.querySelectorAll('link[href]').forEach(el => {
      el.setAttribute('href', rewriteUrl(el.getAttribute('href')));
    });

    // FIX IFRAMES
    document.querySelectorAll('iframe').forEach(el => {
      const src = el.getAttribute('src');
      if (src) {
        el.setAttribute('src', rewriteUrl(src));
      }
      el.removeAttribute('sandbox'); // CRITICAL!
      el.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; *');
    });

    document.querySelectorAll('style').forEach(el => {
      let content = el.textContent;
      content = content.replace(/url\(['"]?(https?:\/\/[^'")\s]+)['"]?\)/gi, (match, url) => {
        return `url('${rewriteUrl(url)}')`;
      });
      el.textContent = content;
    });

    res.send(dom.serialize());

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Error: ' + error.message);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log("🌈 Rainbow Proxy running on port " + PORT);
  console.log("🔒 Password: " + ACCESS_CODE);
});
