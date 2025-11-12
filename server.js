const express = require('express');
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
<title>Coinbase</title>
<link rel="icon" href="https://images.ctfassets.net/q5ulk4bp65r7/3TBS4oVkD1ghowTqVQJlqj/2dfd4ea3b623a7c0d8deb2ff445dee9e/Consumer_Wordmark.svg">
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
<div class="subtitle">Your Protected Access Point - Now with FULL Social Media Access!</div>

<div class="quick-access">
  <div class="quick-title">⚡ Quick Access - Type Any Website</div>
  <input type="text" id="quickUrl" class="quick-input" placeholder="Enter website (e.g., tiktok.com, youtube.com, discord.com)" />
  <button class="quick-btn" onclick="quickGo()">GO 🚀</button>
</div>

<div class="proxy-grid">
  <a href="https://scramjet-proxy.onrender.com" target="_blank" class="proxy-card">
    <div class="proxy-icon">🚀</div>
    <div class="proxy-name">Launch Proxy</div>
    <div class="proxy-desc">Click here to open the proxy. Then type any website you want to visit!</div>
    <span class="proxy-tag">FULL ACCESS</span>
  </a>

  <a href="https://scramjet-proxy.onrender.com/service/hvtrs8%2F-wuw%2Ctiktok%2Ccmm" target="_blank" class="proxy-card">
    <div class="proxy-icon">🎵</div>
    <div class="proxy-name">TikTok</div>
    <div class="proxy-desc">Watch and create videos. Full login support. Posting works!</div>
    <span class="proxy-tag">WORKING</span>
  </a>

  <a href="https://scramjet-proxy.onrender.com/service/hvtrs8%2F-wuw%2Csnapchat%2Ccmm" target="_blank" class="proxy-card">
    <div class="proxy-icon">👻</div>
    <div class="proxy-name">Snapchat</div>
    <div class="proxy-desc">Send snaps and chat with friends. Login works perfectly!</div>
    <span class="proxy-tag">WORKING</span>
  </a>

  <a href="https://scramjet-proxy.onrender.com/service/hvtrs8%2F-wuw%2Cinstagram%2Ccmm" target="_blank" class="proxy-card">
    <div class="proxy-icon">📸</div>
    <div class="proxy-name">Instagram</div>
    <div class="proxy-desc">Browse feed, post stories, and DM. Full login support!</div>
    <span class="proxy-tag">WORKING</span>
  </a>

  <a href="https://scramjet-proxy.onrender.com/service/hvtrs8%2F-wuw%2Cyoutube%2Ccmm" target="_blank" class="proxy-card">
    <div class="proxy-icon">▶️</div>
    <div class="proxy-name">YouTube</div>
    <div class="proxy-desc">Watch videos, subscribe to channels. Login works!</div>
    <span class="proxy-tag">WORKING</span>
  </a>

  <a href="https://scramjet-proxy.onrender.com/service/hvtrs8%2F-discord%2Ccmm" target="_blank" class="proxy-card">
    <div class="proxy-icon">💬</div>
    <div class="proxy-name">Discord</div>
    <div class="proxy-desc">Chat with friends and join servers. Full access!</div>
    <span class="proxy-tag">WORKING</span>
  </a>

  <a href="https://scramjet-proxy.onrender.com/service/hvtrs8%2F-wuw%2Creddit%2Ccmm" target="_blank" class="proxy-card">
    <div class="proxy-icon">🤖</div>
    <div class="proxy-name">Reddit</div>
    <div class="proxy-desc">Browse and comment on all subreddits. Login works!</div>
    <span class="proxy-tag">WORKING</span>
  </a>

  <a href="https://scramjet-proxy.onrender.com/service/hvtrs8%2F-twitter%2Ccmm" target="_blank" class="proxy-card">
    <div class="proxy-icon">🐦</div>
    <div class="proxy-name">Twitter / X</div>
    <div class="proxy-desc">Tweet, retweet, and follow. Full access with login!</div>
    <span class="proxy-tag">WORKING</span>
  </a>
</div>

<div class="note">
  <strong>💡 How to use:</strong><br>
  1. Click "Launch Proxy" to access the proxy search page<br>
  2. OR click any specific site card to go directly there<br>
  3. OR use Quick Access above to type any website<br>
  4. Login with your real accounts - they work!<br>
  <br>
  <strong>🎭 Tab Disguise:</strong> Shows "Coinbase" so teachers think you're checking crypto prices<br>
  <strong>🔒 Privacy:</strong> Your school only sees you visiting Rainbow Gateway, not the actual sites!<br>
  <br>
  <strong>⚡ Pro Tip:</strong> First load is slow (15-20 seconds), but then it's fast. This is normal for free hosting!
</div>
</div>

<script>
let disguised = true;

function toggleDisguise() {
  disguised = !disguised;
  const btn = document.querySelector('.disguise-btn');
  
  if (disguised) {
    document.title = 'Coinbase';
    document.querySelector('link[rel="icon"]').href = 'https://images.ctfassets.net/q5ulk4bp65r7/3TBS4oVkD1ghowTqVQJlqj/2dfd4ea3b623a7c0d8deb2ff445dee9e/Consumer_Wordmark.svg';
    btn.textContent = '🎭 Disguise: ON';
    btn.style.background = 'rgba(0,255,153,0.3)';
    btn.style.color = '#00ff99';
  } else {
    document.title = 'Rainbow Gateway';
    document.querySelector('link[rel="icon"]').href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌈</text></svg>';
    btn.textContent = '🎭 Disguise: OFF';
    btn.style.background = 'rgba(255,0,0,0.3)';
    btn.style.color = '#ff6666';
  }
}

function quickGo() {
  let url = document.getElementById('quickUrl').value.trim();
  if (!url) return;
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  openScramjetSite(url);
}

function openScramjetSite(url) {
  const win = window.open('https://scramjet-proxy.onrender.com', '_blank');
  
  navigator.clipboard.writeText(url).then(() => {
    alert('🚀 SCRAMJET OPENED!\\n\\n📋 "' + url + '" copied to clipboard!\\n\\n✅ PASTE IT in the Scramjet search bar and press Enter!');
  }).catch(() => {
    alert('🚀 SCRAMJET OPENED!\\n\\n✍️ Type "' + url + '" in the search bar and press Enter!');
  });
}

function openProxy(event, targetUrl) {
  event.preventDefault();
  openScramjetSite(targetUrl);
}

document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    disguised = true;
    document.title = 'Coinbase';
    document.querySelector('link[rel="icon"]').href = 'https://images.ctfassets.net/q5ulk4bp65r7/3TBS4oVkD1ghowTqVQJlqj/2dfd4ea3b623a7c0d8deb2ff445dee9e/Consumer_Wordmark.svg';
  }
});

document.getElementById('quickUrl').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') quickGo();
});
</script>
</body>
</html>`);
});

// Fixed: Removed '0.0.0.0' - let the platform handle binding
app.listen(PORT, () => {
  console.log(`🌈 Rainbow Gateway running on port ${PORT}`);
  console.log(`🔒 Password: ${ACCESS_CODE}`);
  console.log(`🚀 Proxy: https://scramjet-proxy.onrender.com`);
});
