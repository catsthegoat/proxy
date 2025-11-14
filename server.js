.quick-access{margin-top:30px;padding:25px;background:rgba(0,150,255,0.1);border:1px solid rgba(0,150,255,0.3);border-radius:12px;}
.quick-title{font-size:18px;font-weight:700;color:#0096ff;margin-bottom:15px;}
.quick-input{width:100%;padding:15px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#fff;font-size:14px;margin-bottom:10px;}
.quick-input::placeholder{color:rgba(255,255,255,0.4);}
.quick-btn{padding:12px 30px;background:#00ff99;color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;}
.quick-btn:hover{opacity:0.9;}const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const app = express();

const PORT = process.env.PORT || 3000;
const ACCESS_CODE = process.env.PROXY_PASSWORD || 'rainbow123';
// UPDATE THIS URL after deploying NautilusOS as a Static Site on Render
const NAUTILUS_URL = process.env.NAUTILUS_URL || 'https://nautilusos-8uzw.onrender.com';

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
.enter-proxy-btn{
  display:inline-block;
  padding:25px 60px;
  background:linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 100%);
  border:2px solid rgba(255,255,255,0.4);
  border-radius:16px;
  color:#fff;
  font-size:24px;
  font-weight:700;
  text-decoration:none;
  letter-spacing:2px;
  margin-top:50px;
  transition:all 0.5s ease;
  box-shadow:0 0 30px rgba(255,255,255,0.1);
  backdrop-filter:blur(10px);
  animation:fadeIn 2s ease-in-out;
}
.enter-proxy-btn:hover{
  background:linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.5) 100%);
  border-color:rgba(255,255,255,0.8);
  box-shadow:0 0 50px rgba(255,255,255,0.3);
  transform:translateY(-5px);
}
@keyframes fadeIn{
  0%{opacity:0;transform:translateY(20px);}
  100%{opacity:1;transform:translateY(0);}
}
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
<div class="subtitle">Your Protected Access Point - Powered by NautilusOS!</div>

<a href="${NAUTILUS_URL}" target="_blank" class="enter-proxy-btn">
  ENTER PROXY
</a>

<div class="note">
  <strong>💡 How to use:</strong><br>
  1. Click any site button (e.g., TikTok, YouTube) to open it directly<br>
  2. Or click "Launch NautilusOS" for the full web OS experience<br>
  3. NautilusOS includes: Browser, Games, Apps, File Manager & more!<br>
  4. Login with your real accounts - everything works!<br>
  <br>
  <strong>🎭 Tab Disguise:</strong> Shows "Clever | Portal" so teachers think you're on Clever<br>
  <strong>🔒 Privacy:</strong> Your school only sees you visiting Rainbow Gateway!<br>
  <br>
  <strong>⚡ Pro Tip:</strong> First load may take a moment, but then it's super fast!
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
    document.querySelector('link[rel="icon"]').href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌈</text></svg>';
    btn.textContent = '🎭 Disguise: OFF';
    btn.style.background = 'rgba(255,0,0,0.3)';
    btn.style.color = '#ff6666';
  }
}

document.addEventListener('visibilitychange', function() {
  if (document.hidden && !disguised) {
    disguised = true;
    document.title = 'Clever | Portal';
    document.querySelector('link[rel="icon"]').href = 'https://clever.com/favicon.ico';
    const btn = document.querySelector('.disguise-btn');
    btn.textContent = '🎭 Disguise: ON';
    btn.style.background = 'rgba(0,255,153,0.3)';
    btn.style.color = '#00ff99';
  }
});
</script>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`🌈 Rainbow Gateway running on port ${PORT}`);
  console.log(`🔒 Password: ${ACCESS_CODE}`);
  console.log(`🚀 NautilusOS: ${NAUTILUS_URL}`);
});
