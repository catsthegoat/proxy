const express = require('express');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;

// CHANGE THIS PASSWORD!
const ACCESS_CODE = process.env.PROXY_PASSWORD || 'rainbow123';

// Rate limiting
const rateLimitStore = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (data.lockedUntil && data.lockedUntil < now) {
      rateLimitStore.delete(ip);
    }
  }
}, 10 * 60 * 1000);

app.set('trust proxy', true);

app.use(session({
  secret: 'rainbow-proxy-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(express.urlencoded({ extended: true }));

const requireAuth = (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Login page
app.get('/login', (req, res) => {
  const error = req.query.error;
  const clientIp = req.ip;
  const rateLimitData = rateLimitStore.get(clientIp) || { attempts: 0, lockedUntil: null };
  
  const now = Date.now();
  const isLocked = rateLimitData.lockedUntil && rateLimitData.lockedUntil > now;
  
  let errorMessage = '';
  let lockoutMessage = '';
  let remainingAttempts = MAX_ATTEMPTS - rateLimitData.attempts;
  
  if (isLocked) {
    const minutesLeft = Math.ceil((rateLimitData.lockedUntil - now) / 60000);
    lockoutMessage = `🔒 Locked out for ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`;
  } else if (error === 'locked') {
    lockoutMessage = `🔒 Too many attempts! Locked out for 5 minutes.`;
  } else if (error === '1') {
    errorMessage = `❌ Wrong code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} left.`;
  }
  
  res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rainbow Proxy - Login</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Inter',sans-serif;background:#000;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;}
.login-container{text-align:center;padding:40px;max-width:400px;}
h1{font-size:48px;margin-bottom:30px;background:linear-gradient(90deg,#fff 0%,#ff0066 25%,#00ff99 50%,#3399ff 75%,#fff 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:flow 4s linear infinite;}
@keyframes flow{to{background-position:200% center;}}
input{width:100%;padding:15px 20px;border-radius:8px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.05);color:#fff;font-size:16px;text-align:center;outline:none;margin:20px 0;}
input::placeholder{color:rgba(255,255,255,0.4);}
button{width:100%;padding:15px;background:#fff;color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;}
button:disabled{opacity:0.5;cursor:not-allowed;}
.error{margin-top:15px;padding:12px;background:rgba(255,0,0,0.2);border:1px solid rgba(255,0,0,0.4);border-radius:8px;color:#ff6666;font-size:14px;}
.lockout{margin-top:15px;padding:12px;background:rgba(255,100,0,0.2);border:1px solid rgba(255,100,0,0.4);border-radius:8px;color:#ffaa66;font-size:14px;font-weight:700;}
.attempts{margin-top:10px;font-size:12px;color:rgba(255,255,255,0.5);}
</style>
</head>
<body>
<div class="login-container">
<div style="font-size:60px;margin-bottom:20px;">${isLocked ? '⛔' : '🔒'}</div>
<h1>RAINBOW PROXY</h1>
<form method="POST" action="/login" ${isLocked ? 'onsubmit="return false;"' : ''}>
  <input type="password" name="password" placeholder="enter access code" ${isLocked ? 'disabled' : 'autofocus'} required>
  <button type="submit" ${isLocked ? 'disabled' : ''}>UNLOCK</button>
</form>
${lockoutMessage ? `<div class="lockout">${lockoutMessage}</div>` : ''}
${errorMessage ? `<div class="error">${errorMessage}</div>` : ''}
${!isLocked && rateLimitData.attempts > 0 ? `<div class="attempts">Attempts: ${rateLimitData.attempts}/${MAX_ATTEMPTS}</div>` : ''}
</div>
<script>
${isLocked ? `
  const lockoutEnd = ${rateLimitData.lockedUntil};
  const lockoutDiv = document.querySelector('.lockout');
  const updateTimer = () => {
    const now = Date.now();
    const remaining = Math.max(0, lockoutEnd - now);
    if (remaining === 0) {
      window.location.reload();
      return;
    }
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    lockoutDiv.textContent = '🔒 Locked: ' + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  };
  updateTimer();
  setInterval(updateTimer, 1000);
` : ''}
</script>
</body>
</html>`);
});

app.post('/login', (req, res) => {
  const { password } = req.body;
  const clientIp = req.ip;
  
  let rateLimitData = rateLimitStore.get(clientIp) || { attempts: 0, lockedUntil: null };
  const now = Date.now();
  
  if (rateLimitData.lockedUntil && rateLimitData.lockedUntil > now) {
    return res.redirect('/login?error=locked');
  }
  
  if (rateLimitData.lockedUntil && rateLimitData.lockedUntil <= now) {
    rateLimitData = { attempts: 0, lockedUntil: null };
  }
  
  if (password === ACCESS_CODE) {
    rateLimitStore.delete(clientIp);
    req.session.authenticated = true;
    res.redirect('/');
  } else {
    rateLimitData.attempts += 1;
    
    if (rateLimitData.attempts >= MAX_ATTEMPTS) {
      rateLimitData.lockedUntil = now + LOCKOUT_TIME;
      rateLimitStore.set(clientIp, rateLimitData);
      return res.redirect('/login?error=locked');
    }
    
    rateLimitStore.set(clientIp, rateLimitData);
    res.redirect('/login?error=1');
  }
});

app.get('/logout', (req, res) => {
  const clientIp = req.ip;
  rateLimitStore.delete(clientIp);
  req.session.destroy();
  res.redirect('/login');
});

// Home page
app.get('/', requireAuth, (req, res) => {
  const errorMsg = req.query.error === 'invalid-url' ? 
    '<div class="error-banner">⚠️ Invalid URL. Please enter a proper website.</div>' : '';
  
  res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rainbow Proxy</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Inter',sans-serif;background:#000;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;transition:background 0.3s,color 0.3s;}
body.light-mode{background:#fff;color:#000;}
body *{cursor:none;}
button, a, input, .mode-toggle, .logout-btn, .quick-link{cursor:pointer !important;}
input{cursor:text !important;}
#trail{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;}
.container{text-align:center;padding:40px;position:relative;z-index:10;max-width:600px;}
.cursor{position:fixed;width:20px;height:20px;border:2px solid rgba(255,255,255,0.8);border-radius:50%;pointer-events:none;z-index:10000;transform:translate(-50%,-50%);transition:border-color 0.3s;}
body.light-mode .cursor{border-color:rgba(0,0,0,0.8);}
h1{font-size:48px;margin-bottom:30px;background:linear-gradient(90deg,#fff 0%,#ff0066 25%,#00ff99 50%,#3399ff 75%,#fff 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:flow 4s linear infinite;}
body.light-mode h1{background:linear-gradient(90deg,#000 0%,#ff0066 25%,#00cc88 50%,#3366ff 75%,#000 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
@keyframes flow{to{background-position:200% center;}}
.input-wrapper{position:relative;display:inline-block;}
.input-wrapper::before{content:"";position:absolute;top:0;left:0;right:0;bottom:0;border-radius:8px;border:1px solid rgba(255,255,255,0.4);background:rgba(255,255,255,0.03);backdrop-filter:blur(15px);box-shadow:0 0 20px rgba(255,255,255,0.3);z-index:0;pointer-events:none;}
body.light-mode .input-wrapper::before{border:1px solid rgba(0,0,0,0.3);background:rgba(0,0,0,0.02);box-shadow:0 0 20px rgba(0,0,0,0.2);}
.input-wrapper input{position:relative;width:400px;max-width:90%;padding:12px 20px;margin:20px 0 40px 0;border-radius:8px;border:none;background:transparent;color:#fff;font-size:14px;text-align:center;z-index:1;outline:none;}
body.light-mode .input-wrapper input{color:#000;}
.input-wrapper input::placeholder{color:rgba(255,255,255,0.4);}
body.light-mode .input-wrapper input::placeholder{color:rgba(0,0,0,0.4);}
button{padding:15px 40px;background:#fff;color:#000;border:none;border-radius:12px;font-weight:700;font-size:14px;text-transform:uppercase;transition:0.3s;}
body.light-mode button{background:#000;color:#fff;}
button:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(255,255,255,0.3);}
.mode-toggle{position:fixed;top:20px;right:20px;padding:10px 20px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:10px;font-size:12px;transition:0.3s;z-index:101;backdrop-filter:blur(10px);}
body.light-mode .mode-toggle{background:rgba(0,0,0,0.1);border:1px solid rgba(0,0,0,0.2);}
.mode-toggle:hover{background:rgba(255,255,255,0.2);transform:scale(1.05);}
.logout-btn{position:fixed;top:20px;left:20px;padding:10px 20px;background:rgba(255,0,0,0.2);border:1px solid rgba(255,0,0,0.3);border-radius:10px;font-size:12px;transition:0.3s;z-index:101;backdrop-filter:blur(10px);color:#fff;text-decoration:none;}
.logout-btn:hover{background:rgba(255,0,0,0.3);transform:scale(1.05);}
.quick-links{margin-top:30px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
.quick-link{padding:8px 16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);border-radius:8px;font-size:12px;transition:0.3s;color:#fff;}
.quick-link:hover{background:rgba(255,255,255,0.1);transform:translateY(-2px);}
.status{margin-top:20px;font-size:14px;color:rgba(255,255,255,0.6);}
.warning{margin-top:25px;padding:15px;background:rgba(255,255,0,0.1);border:1px solid rgba(255,255,0,0.3);border-radius:8px;font-size:12px;color:rgba(255,255,0,0.8);}
.error-banner{margin-bottom:20px;padding:15px;background:rgba(255,100,100,0.2);border:1px solid rgba(255,100,100,0.4);border-radius:8px;font-size:14px;color:#ff6666;}
.secret{margin-top:10px;font-size:12px;color:#000;background:#000;padding:5px 15px;border-radius:8px;transition:0.5s;display:inline-block;user-select:none;}
body.light-mode .secret{color:#fff;background:#fff;}
.secret:hover{color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.05);}
.loading-screen{position:fixed;top:0;left:0;width:100%;height:100%;background:#000;display:none;align-items:center;justify-content:center;z-index:10000;}
.loading-screen.show{display:flex;}
.loading-spinner{width:60px;height:60px;border:4px solid rgba(255,255,255,0.1);border-top:4px solid #fff;border-radius:50%;animation:spin 1s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.loading-text{color:#fff;margin-top:20px;font-size:18px;}
</style>
</head>
<body>
<div class="loading-screen">
  <div style="text-align:center;">
    <div class="loading-spinner"></div>
    <div class="loading-text">Loading...</div>
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
<input id="url" placeholder="enter url (e.g. instagram.com)">
</div>
<br><br>
<button onclick="go()">GO</button>
<div class="quick-links">
  <span class="quick-link" onclick="fillUrl('instagram.com')">📷 Instagram</span>
  <span class="quick-link" onclick="fillUrl('tiktok.com')">🎵 TikTok</span>
  <span class="quick-link" onclick="fillUrl('reddit.com')">💬 Reddit</span>
  <span class="quick-link" onclick="fillUrl('coolmathgames.com')">🎮 Coolmath</span>
</div>
<div class="status">Ultra proxy active ✓</div>
<div class="warning">⚠️ Some sites may not work perfectly due to advanced security.</div>
<div class="secret">made by emma</div>
</div>
<script>
let lightMode = false;
function toggleMode() {
  lightMode = !lightMode;
  document.body.classList.toggle('light-mode', lightMode);
}

const canvas = document.getElementById('trail');
const ctx = canvas.getContext('2d');
const cursor = document.querySelector('.cursor');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let particles = [];
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let cursorX = mouseX;
let cursorY = mouseY;

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 4 + 2;
    this.speedX = (Math.random() - 0.5) * 2;
    this.speedY = (Math.random() - 0.5) * 2;
    this.life = 1;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= 0.015;
    if (this.size > 0.1) this.size -= 0.03;
  }
  draw() {
    const color = lightMode ? '0,0,0' : '255,255,255';
    ctx.fillStyle = \`rgba(\${color},\${this.life})\`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = \`rgba(\${color},\${this.life})\`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (particles.length < 100) {
    for (let i = 0; i < 3; i++) {
      particles.push(new Particle(mouseX, mouseY));
    }
  }
});

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  cursorX += (mouseX - cursorX) * 0.3;
  cursorY += (mouseY - cursorY) * 0.3;
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

function fillUrl(url) {
  document.getElementById('url').value = url;
}

function go() {
  let url = document.getElementById('url').value.trim();
  if (!url) return;
  url = url.replace(/^[\/\\\\]+/, '');
  if (!url.match(/^https?:\\/\\//)) url = 'https://' + url;
  document.querySelector('.loading-screen').classList.add('show');
  window.location.href = '/proxy?url=' + encodeURIComponent(url);
}

document.getElementById('url').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') go();
});
</script>
</body>
</html>`);
});

// Catch-all for malformed URLs
app.get('*', requireAuth, (req, res, next) => {
  if (req.path !== '/' && req.path !== '/login' && req.path !== '/logout') {
    return res.redirect('/?error=invalid-url');
  }
  next();
});

// Start server
app.listen(PORT, () => {
  console.log("🌈 Rainbow Proxy running on port " + PORT);
  console.log("🔒 Password: " + ACCESS_CODE);
  console.log("✨ UI by Emma • Engine by Sarry Khan Emann");
});
