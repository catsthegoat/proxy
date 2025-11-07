const express = require('express');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const session = require('express-session');
const app = express();

// CRITICAL: Render uses PORT environment variable
const PORT = process.env.PORT || 3000;

// CHANGE THIS PASSWORD TO YOUR OWN!
const ACCESS_CODE = process.env.PROXY_PASSWORD || 'rainbow123';

// Parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Session middleware - configured for production
app.use(session({
  secret: process.env.SESSION_SECRET || 'rainbow-proxy-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: false, // Set to false for now to debug
    httpOnly: true,
    sameSite: 'lax'
  },
  name: 'rainbow.sid' // Custom session name
}));

// CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  console.log('Auth check - Session:', req.session);
  console.log('Authenticated:', req.session.authenticated);
  if (req.session.authenticated) {
    next();
  } else {
    console.log('Not authenticated, redirecting to login');
    res.redirect('/login');
  }
};

// Login page
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
.input-wrapper { position: relative; margin: 20px 0; }
.input-wrapper input {
  width: 100%;
  padding: 15px 20px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.05);
  color: #fff;
  font-size: 16px;
  text-align: center;
  outline: none;
  backdrop-filter: blur(10px);
}
.input-wrapper input::placeholder { color: rgba(255,255,255,0.4); }
button{width:100%;padding:15px 40px;background:#fff;color:#000;border:none;border-radius:12px;font-weight:700;cursor:pointer;font-size:14px;text-transform:uppercase;transition:0.3s;margin-top:20px;}
button:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(255,255,255,0.3);}
button:disabled{opacity:0.5;cursor:not-allowed;}
.error{margin-top:15px;padding:12px;background:rgba(255,0,0,0.2);border:1px solid rgba(255,0,0,0.4);border-radius:8px;font-size:14px;color:#ff6666;}
.lock-icon{font-size:60px;margin-bottom:20px;opacity:0.8;}
.loading{margin-top:15px;padding:12px;background:rgba(0,255,153,0.2);border:1px solid rgba(0,255,153,0.4);border-radius:8px;font-size:14px;color:#00ff99;display:none;}
</style>
</head>
<body>
<div class="login-container">
<div class="lock-icon">🔒</div>
<h1>RAINBOW PROXY</h1>
<form id="loginForm" method="POST" action="/login">
  <div class="input-wrapper">
    <input type="password" id="password" name="password" placeholder="enter access code" autofocus required>
  </div>
  <button type="submit" id="submitBtn">UNLOCK</button>
</form>
${error ? '<div class="error">❌ Incorrect access code</div>' : ''}
<div class="loading" id="loading">🔄 Logging in...</div>
</div>
<script>
document.getElementById('loginForm').addEventListener('submit', function(e) {
  const btn = document.getElementById('submitBtn');
  const loading = document.getElementById('loading');
  btn.disabled = true;
  btn.textContent = 'CHECKING...';
  loading.style.display = 'block';
});
</script>
</body>
</html>`);
});

// Login POST handler
app.post('/login', (req, res) => {
  console.log('Login attempt with password:', req.body.password ? '***' : 'empty');
  const { password } = req.body;
  if (password === ACCESS_CODE) {
    req.session.authenticated = true;
    console.log('Login successful, session:', req.session);
    res.redirect('/');
  } else {
    console.log('Login failed - incorrect password');
    res.redirect('/login?error=1');
  }
});

// Logout endpoint
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Main page (protected)
app.get('/', requireAuth, (req, res) => {
  const errorMsg = req.query.error === 'invalid-url' ? 
    '<div class="error-banner">⚠️ Invalid URL detected. Please enter a proper website address below.</div>' : '';
  
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rainbow Proxy</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Inter',sans-serif;background:#000;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:none;transition:background 0.3s,color 0.3s;}
body.light-mode{background:#fff;color:#000;}

#trail{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;}
.container{text-align:center;padding:40px;position:relative;z-index:100;}

h1{font-size:48px;margin-bottom:30px;background:linear-gradient(90deg,#fff 0%,#ff0066 25%,#00ff99 50%,#3399ff 75%,#fff 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:flow 4s linear infinite;}
body.light-mode h1{background:linear-gradient(90deg,#000 0%,#ff0066 25%,#00cc88 50%,#3366ff 75%,#000 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:flow 4s linear infinite;}
@keyframes flow{to{background-position:200% center;}}

.input-wrapper{position:relative;display:inline-block;}
.input-wrapper::before{content:"";position:absolute;top:0;left:0;right:0;bottom:0;border-radius:8px;border:1px solid rgba(255,255,255,0.4);background:rgba(255,255,255,0.03);backdrop-filter:blur(15px);box-shadow:0 0 20px rgba(255,255,255,0.3),inset 0 0 20px rgba(255,255,255,0.05);z-index:-1;pointer-events:none;}
body.light-mode .input-wrapper::before{border:1px solid rgba(0,0,0,0.3);background:rgba(0,0,0,0.02);box-shadow:0 0 20px rgba(0,0,0,0.2),inset 0 0 20px rgba(0,0,0,0.05);}

.input-wrapper input{position:relative;width:400px;max-width:90%;padding:12px 20px;margin:20px 0 40px 0;border-radius:8px;border:none;background:transparent;color:#fff;font-size:14px;text-align:center;z-index:1;outline:none;}
body.light-mode .input-wrapper input{color:#000;}
.input-wrapper input::placeholder{color:rgba(255,255,255,0.4);}
body.light-mode .input-wrapper input::placeholder{color:rgba(0,0,0,0.4);}

button{padding:15px 40px;background:#fff;color:#000;border:none;border-radius:12px;font-weight:700;font-size:14px;text-transform:uppercase;transition:0.3s;cursor:pointer;}
body.light-mode button{background:#000;color:#fff;}
button:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(255,255,255,0.3);}
body.light-mode button:hover{box-shadow:0 10px 30px rgba(0,0,0,0.3);}

.status{margin-top:20px;font-size:14px;color:rgba(255,255,255,0.6);}
body.light-mode .status{color:rgba(0,0,0,0.6);}
.secret{margin-top:10px;font-size:12px;color:#000;background:#000;padding:5px 15px;border-radius:8px;transition:all 0.5s ease;display:inline-block;user-select:none;cursor:pointer;}
body.light-mode .secret{color:#fff;background:#fff;}
.secret:hover{color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.05);}
body.light-mode .secret:hover{color:rgba(0,0,0,0.4);background:rgba(0,0,0,0.05);}

.cursor{position:fixed;width:20px;height:20px;border:2px solid rgba(255,255,255,0.8);border-radius:50%;pointer-events:none;z-index:10000;transform:translate(-50%,-50%);transition:width 0.2s,height 0.2s;}
body.light-mode .cursor{border-color:rgba(0,0,0,0.8);}

.mode-toggle{position:fixed;top:20px;right:20px;padding:10px 20px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:10px;font-size:12px;transition:0.3s;z-index:200;backdrop-filter:blur(10px);cursor:pointer;}
body.light-mode .mode-toggle{background:rgba(0,0,0,0.1);border:1px solid rgba(0,0,0,0.2);}
.mode-toggle:hover{background:rgba(255,255,255,0.2);transform:scale(1.05);}
body.light-mode .mode-toggle:hover{background:rgba(0,0,0,0.2);}

.logout-btn{position:fixed;top:20px;left:20px;padding:10px 20px;background:rgba(255,0,0,0.2);border:1px solid rgba(255,0,0,0.3);border-radius:10px;font-size:12px;transition:0.3s;z-index:200;backdrop-filter:blur(10px);color:#fff;text-decoration:none;cursor:pointer;}
.logout-btn:hover{background:rgba(255,0,0,0.3);transform:scale(1.05);}

.loading-screen{position:fixed;top:0;left:0;width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;z-index:10000;opacity:1;transition:opacity 0.5s;}
.loading-screen.hide{opacity:0;pointer-events:none;}
.loading-content{text-align:center;}
.loading-spinner{width:60px;height:60px;margin:0 auto 20px;border:4px solid rgba(255,255,255,0.1);border-top:4px solid #fff;border-radius:50%;animation:spin 1s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.loading-text{font-size:18px;color:#fff;margin-top:15px;}
.loading-url{font-size:14px;color:rgba(255,255,255,0.5);margin-top:10px;font-family:monospace;max-width:80%;margin-left:auto;margin-right:auto;word-break:break-all;}

.warning{margin-top:25px;padding:15px;background:rgba(255,255,0,0.1);border:1px solid rgba(255,255,0,0.3);border-radius:8px;font-size:12px;color:rgba(255,255,0,0.8);}
.error-banner{margin-bottom:20px;padding:15px;background:rgba(255,100,100,0.2);border:1px solid rgba(255,100,100,0.4);border-radius:8px;font-size:14px;color:#ff6666;}
.quick-links{margin-top:30px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
.quick-link{padding:8px 16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);border-radius:8px;font-size:12px;transition:0.3s;color:#fff;text-decoration:none;cursor:pointer;}
.quick-link:hover{background:rgba(255,255,255,0.1);transform:translateY(-2px);}
body.light-mode .quick-link{background:rgba(0,0,0,0.05);border:1px solid rgba(0,0,0,0.2);color:#000;}
body.light-mode .quick-link:hover{background:rgba(0,0,0,0.1);}
</style>
</head>
<body>
<div class="loading-screen hide">
  <div class="loading-content">
    <div class="loading-spinner"></div>
    <div class="loading-text">Loading page...</div>
    <div class="loading-url"></div>
  </div>
</div>
<canvas id="trail"></canvas>
<div class="cursor"></div>
<a href="/logout" class="logout-btn">🔒 Logout</a>
<div class="mode-toggle" onclick="toggleMode()">⚫ / ⚪</div>
<div class="container">
${errorMsg}
<h1>RAINBOW PROXY</h1>
<div class="input-wrapper">
<input id="url" placeholder="enter url (e.g. coolmathgames.com)">
</div>
<br><br>
<button onclick="go()">GO</button>
<div class="status">Real proxy server running ✓</div>
<div class="quick-links">
  <span class="quick-link" onclick="fillUrl('poki.com')">🎯 Poki</span>
  <span class="quick-link" onclick="fillUrl('coolmathgames.com')">🎮 Coolmath Games</span>
  <span class="quick-link" onclick="fillUrl('armorgames.com')">🛡️ Armor Games</span>
  <span class="quick-link" onclick="fillUrl('y8.com')">🕹️ Y8 Games</span>
  <span class="quick-link" onclick="fillUrl('reddit.com')">💬 Reddit</span>
</div>
<div class="warning">⚠️ Note: Some sites (Google, YouTube, banking) may not work due to security features. Best for: gaming sites, forums, social media.</div>
<div class="secret">made by emma</div>
</div>
<script>
let lightMode=false;

function toggleMode(){
  lightMode=!lightMode;
  document.body.classList.toggle('light-mode',lightMode);
}

const canvas=document.getElementById('trail');
const ctx=canvas.getContext('2d');
const cursor=document.querySelector('.cursor');
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

let particles=[];
let mouseX=window.innerWidth/2;
let mouseY=window.innerHeight/2;

class Particle{
  constructor(x,y){
    this.x=x;
    this.y=y;
    this.size=Math.random()*4+2;
    this.speedX=Math.random()*2-1;
    this.speedY=Math.random()*2-1;
    this.life=1;
  }
  update(){
    this.x+=this.speedX;
    this.y+=this.speedY;
    this.life-=0.015;
    if(this.size>0.1)this.size-=0.03;
  }
  draw(){
    const color=lightMode?'0,0,0':'255,255,255';
    ctx.fillStyle='rgba('+color+','+this.life+')';
    ctx.shadowBlur=10;
    ctx.shadowColor=lightMode?'rgba(0,0,0,'+this.life+')':'rgba(255,255,255,'+this.life+')';
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
    ctx.fill();
  }
}

let cursorX=mouseX;
let cursorY=mouseY;

document.addEventListener('mousemove',e=>{
  mouseX=e.clientX;
  mouseY=e.clientY;
  if(particles.length<100){
    for(let i=0;i<3;i++){
      particles.push(new Particle(mouseX,mouseY));
    }
  }
});

function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  
  cursorX+=(mouseX-cursorX)*0.3;
  cursorY+=(mouseY-cursorY)*0.3;
  cursor.style.left=cursorX+'px';
  cursor.style.top=cursorY+'px';
  
  for(let i=particles.length-1;i>=0;i--){
    particles[i].update();
    particles[i].draw();
    if(particles[i].life<=0){
      particles.splice(i,1);
    }
  }
  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize',()=>{
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
});

function fillUrl(url) {
  document.getElementById('url').value = url;
}

function go(){
  let url=document.getElementById('url').value.trim();
  if(!url)return;
  
  url = url.replace(/^[\\/\\\\]+/, '');
  
  if(!url.match(/^https?:\\/\\//))url='https://'+url;
  
  const loadingScreen = document.querySelector('.loading-screen');
  const loadingUrl = document.querySelector('.loading-url');
  loadingUrl.textContent = url;
  loadingScreen.classList.remove('hide');
  
  window.location.href='/proxy?url='+encodeURIComponent(url);
}

document.getElementById('url').addEventListener('keypress',e=>{
  if(e.key==='Enter') go();
});
</script>
</body>
</html>`);
});

// Catch-all proxy for paths
app.get('*', requireAuth, async (req, res, next) => {
  if (req.path === '/' || req.path === '/login' || req.path === '/logout' || req.path === '/health' || req.path.startsWith('/proxy')) {
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
      } catch (e) {
        console.error('Error parsing referer:', e);
      }
    }
  }
  
  next();
});

// Proxy endpoint
app.get('/proxy', requireAuth, async (req, res) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).send(`
      <html>
      <head>
        <style>
          body{background:#000;color:#fff;font-family:sans-serif;padding:50px;text-align:center;}
          .error-box{background:rgba(255,0,0,0.1);border:2px solid #ff0066;padding:30px;border-radius:15px;max-width:600px;margin:0 auto;}
          h1{color:#ff0066;margin-bottom:20px;}
          a{color:#00ff99;text-decoration:none;padding:10px 20px;background:rgba(0,255,153,0.1);border-radius:8px;display:inline-block;margin-top:20px;}
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>❌ Missing URL</h1>
          <p>You need to provide a URL to proxy!</p>
          <a href="/">← Go Back Home</a>
        </div>
      </body>
      </html>
    `);
  }

  try {
    let validUrl = targetUrl;
    validUrl = validUrl.replace(/^[\\/\\\\]+/, '');
    
    if (!validUrl.match(/^https?:\/\//)) {
      validUrl = 'https://' + validUrl;
    }
    
    new URL(validUrl); // Validate URL
    
    const response = await fetch(validUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      redirect: 'follow',
      timeout: 10000 // 10 second timeout
    });

    const contentType = response.headers.get('content-type') || '';
    
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
      if (!originalUrl || originalUrl === '#' || originalUrl === '/' || originalUrl.startsWith('data:') || originalUrl.startsWith('javascript:') || originalUrl.startsWith('mailto:') || originalUrl.startsWith('tel:')) {
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
        <button onclick="window.history.back()" style="background:rgba(0,0,0,0.8);color:#fff;padding:10px 15px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);font-family:sans-serif;font-size:14px;cursor:pointer;backdrop-filter:blur(10px);">
          ← Back
        </button>
        <button onclick="window.history.forward()" style="background:rgba(0,0,0,0.8);color:#fff;padding:10px 15px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);font-family:sans-serif;font-size:14px;cursor:pointer;backdrop-filter:blur(10px);">
          Forward →
        </button>
        <a href="/" style="background:rgba(255,0,0,0.6);color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:14px;backdrop-filter:blur(10px);border:1px solid rgba(255,0,0,0.3);display:flex;align-items:center;">
          🏠 Home
        </a>
      </div>
    `;
    
    const antiBreakout = document.createElement('script');
    antiBreakout.textContent = `
      (function() {
        Object.defineProperty(window, 'top', {
          get: function() { return window.self; },
          set: function() {}
        });
        Object.defineProperty(window, 'parent', {
          get: function() { return window.self; },
          set: function() {}
        });
        Object.defineProperty(window, 'frameElement', {
          get: function() { return null; }
        });
        
        const originalOpen = window.open;
        window.open = function(url, target, features) {
          if (!url) return null;
          if (url && url.startsWith('http')) {
            window.location.href = '/proxy?url=' + encodeURIComponent(url);
            return null;
          }
          return null;
        };
        
        document.addEventListener('click', function(e) {
          let target = e.target;
          while (target && target.tagName !== 'A') {
            target = target.parentElement;
          }
          
          if (target && target.tagName === 'A') {
            const href = target.getAttribute('href');
            if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
              if (!href.includes('/proxy?url=')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                window.location.href = '/proxy?url=' + encodeURIComponent(href);
                return false;
              }
            }
          }
        }, true);
      })();
    `;
    
    if (document.head) {
      document.head.insertBefore(antiBreakout, document.head.firstChild);
    }
    if (document.body) {
      document.body.insertBefore(navBar, document.body.firstChild);
    }

    document.querySelectorAll('a[href]').forEach(el => {
      el.setAttribute('href', rewriteUrl(el.getAttribute('href')));
    });

    document.querySelectorAll('[src]').forEach(el => {
      el.setAttribute('src', rewriteUrl(el.getAttribute('src')));
    });

    document.querySelectorAll('link[href]').forEach(el => {
      el.setAttribute('href', rewriteUrl(el.getAttribute('href')));
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
    res.status(500).send(`
      <html>
      <head>
        <style>
          body{background:#000;color:#fff;font-family:sans-serif;padding:50px;text-align:center;}
          .error-box{background:rgba(255,0,0,0.1);border:2px solid #ff0066;padding:30px;border-radius:15px;max-width:600px;margin:0 auto;}
          h1{color:#ff0066;margin-bottom:20px;}
          .message{color:#ff6666;margin:15px 0;}
          a{color:#00ff99;text-decoration:none;padding:10px 20px;background:rgba(0,255,153,0.1);border-radius:8px;display:inline-block;margin-top:20px;}
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>❌ Proxy Error</h1>
          <div class="message">${error.message}</div>
          <a href="/">← Go Back</a>
        </div>
      </body>
      </html>
    `);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send(`
    <html>
    <head>
      <style>
        body{background:#000;color:#fff;font-family:sans-serif;padding:50px;text-align:center;}
        .error-box{background:rgba(255,0,0,0.1);border:2px solid #ff0066;padding:30px;border-radius:15px;max-width:600px;margin:0 auto;}
        h1{color:#ff0066;margin-bottom:20px;}
        .message{color:#ff6666;margin:15px 0;}
        a{color:#00ff99;text-decoration:none;padding:10px 20px;background:rgba(0,255,153,0.1);border-radius:8px;display:inline-block;margin-top:20px;}
      </style>
    </head>
    <body>
      <div class="error-box">
        <h1>❌ Server Error</h1>
        <div class="message">Something went wrong. Please try again.</div>
        <a href="/">← Go Back Home</a>
      </div>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌈 Rainbow Proxy running on port ${PORT}`);
  console.log(`🔒 Password: ${ACCESS_CODE}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
