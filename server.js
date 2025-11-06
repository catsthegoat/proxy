<!DOCTYPE html>
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
#trail{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;}
.container{text-align:center;padding:40px;position:relative;z-index:10;max-width:650px;}

h1{font-size:48px;margin-bottom:15px;background:linear-gradient(90deg,#fff 0%,#ff0066 25%,#00ff99 50%,#3399ff 75%,#fff 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:flow 4s linear infinite;}
body.light-mode h1{background:linear-gradient(90deg,#000 0%,#ff0066 25%,#00cc88 50%,#3366ff 75%,#000 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
@keyframes flow{to{background-position:200% center;}}

.subtitle{font-size:14px;color:rgba(255,255,255,0.5);margin-bottom:40px;letter-spacing:2px;text-transform:uppercase;}
body.light-mode .subtitle{color:rgba(0,0,0,0.5);}

.input-wrapper{position:relative;display:inline-block;width:100%;max-width:450px;}
.input-wrapper::before{content:"";position:absolute;top:0;left:0;right:0;bottom:0;border-radius:8px;border:1px solid rgba(255,255,255,0.4);background:rgba(255,255,255,0.03);backdrop-filter:blur(15px);box-shadow:0 0 20px rgba(255,255,255,0.3),inset 0 0 20px rgba(255,255,255,0.05);z-index:0;pointer-events:none;}
body.light-mode .input-wrapper::before{border:1px solid rgba(0,0,0,0.3);background:rgba(0,0,0,0.02);box-shadow:0 0 20px rgba(0,0,0,0.2),inset 0 0 20px rgba(0,0,0,0.05);}

.input-wrapper input{position:relative;width:100%;padding:12px 20px;margin:20px 0 30px 0;border-radius:8px;border:none;background:transparent;color:#fff;font-size:14px;text-align:center;z-index:1;outline:none;}
body.light-mode .input-wrapper input{color:#000;}
.input-wrapper input::placeholder{color:rgba(255,255,255,0.4);}
body.light-mode .input-wrapper input::placeholder{color:rgba(0,0,0,0.4);}

.methods{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:20px;}
.method-btn{padding:12px 30px;background:rgba(255,255,255,0.1);color:#fff;border:2px solid rgba(255,255,255,0.3);border-radius:10px;font-weight:700;cursor:pointer;font-size:13px;text-transform:uppercase;transition:0.3s;backdrop-filter:blur(10px);}
body.light-mode .method-btn{background:rgba(0,0,0,0.1);border-color:rgba(0,0,0,0.3);color:#000;}
.method-btn:hover{transform:translateY(-2px);background:rgba(255,255,255,0.2);box-shadow:0 5px 20px rgba(255,255,255,0.2);}
body.light-mode .method-btn:hover{background:rgba(0,0,0,0.2);box-shadow:0 5px 20px rgba(0,0,0,0.2);}
.method-btn.primary{background:#fff;color:#000;border-color:#fff;}
body.light-mode .method-btn.primary{background:#000;color:#fff;border-color:#000;}
.method-btn.download{background:linear-gradient(135deg,#00ff99,#3399ff);color:#000;border:none;}
body.light-mode .method-btn.download{background:linear-gradient(135deg,#00cc88,#3366ff);color:#fff;}

.info-box{margin-top:30px;padding:20px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);border-radius:12px;backdrop-filter:blur(10px);font-size:12px;line-height:1.8;text-align:left;}
body.light-mode .info-box{background:rgba(0,0,0,0.05);border-color:rgba(0,0,0,0.2);}
.info-title{color:#00ff99;font-weight:700;font-size:14px;margin-bottom:10px;text-align:center;}
body.light-mode .info-title{color:#00cc88;}
.step{margin:8px 0;padding-left:20px;}
.step::before{content:"→";margin-right:10px;color:#00ff99;}
body.light-mode .step::before{color:#00cc88;}

.status{margin-top:20px;font-size:14px;color:rgba(255,255,255,0.6);}
body.light-mode .status{color:rgba(0,0,0,0.6);}
.secret{margin-top:10px;font-size:12px;color:#000;background:#000;padding:5px 15px;border-radius:8px;transition:all 0.5s ease;cursor:pointer;display:inline-block;user-select:none;}
body.light-mode .secret{color:#fff;background:#fff;}
.secret:hover{color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.05);}
body.light-mode .secret:hover{color:rgba(0,0,0,0.4);background:rgba(0,0,0,0.05);}

.cursor{position:fixed;width:20px;height:20px;border:2px solid rgba(255,255,255,0.8);border-radius:50%;pointer-events:none;z-index:10000;transform:translate(-50%,-50%);}
body.light-mode .cursor{border-color:rgba(0,0,0,0.8);}

.mode-toggle{position:fixed;top:20px;right:20px;padding:10px 20px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:10px;font-size:12px;cursor:pointer;transition:0.3s;z-index:101;backdrop-filter:blur(10px);}
body.light-mode .mode-toggle{background:rgba(0,0,0,0.1);border:1px solid rgba(0,0,0,0.2);}
.mode-toggle:hover{background:rgba(255,255,255,0.2);transform:scale(1.05);}
body.light-mode .mode-toggle:hover{background:rgba(0,0,0,0.2);}

.notification{position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-100px);background:rgba(0,255,153,0.9);color:#000;padding:15px 30px;border-radius:10px;font-weight:700;font-size:13px;z-index:10001;opacity:0;transition:all 0.5s ease;backdrop-filter:blur(10px);}
.notification.show{transform:translateX(-50%) translateY(0);opacity:1;}
body.light-mode .notification{background:rgba(0,204,136,0.9);}

.quick-links{margin-top:25px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
.quick-link{padding:8px 16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);border-radius:8px;font-size:11px;cursor:pointer;transition:0.3s;}
body.light-mode .quick-link{background:rgba(0,0,0,0.05);border-color:rgba(0,0,0,0.2);}
.quick-link:hover{background:rgba(255,255,255,0.1);transform:scale(1.05);}
body.light-mode .quick-link:hover{background:rgba(0,0,0,0.1);}
</style>
</head>
<body>
<canvas id="trail"></canvas>
<div class="cursor"></div>
<div class="mode-toggle" onclick="toggleMode()">⚫ / ⚪</div>
<div class="notification" id="notification"></div>

<div class="container">
<h1>RAINBOW PROXY</h1>
<div class="subtitle">Edge Guest Mode Launcher</div>
<div class="input-wrapper">
<input id="url" placeholder="enter url (e.g. coolmathgames.com)">
</div>

<div class="methods">
<button class="method-btn download" onclick="downloadLauncher()">⬇️ DOWNLOAD LAUNCHER</button>
<button class="method-btn primary" onclick="tryOpenEdge()">🚀 TRY AUTO-OPEN</button>
<button class="method-btn" onclick="copyCommand()">📋 COPY COMMAND</button>
</div>

<div class="quick-links">
<div class="quick-link" onclick="quickLaunch('coolmathgames.com')">🎮 Cool Math Games</div>
<div class="quick-link" onclick="quickLaunch('youtube.com')">📺 YouTube</div>
<div class="quick-link" onclick="quickLaunch('discord.com')">💬 Discord</div>
<div class="quick-link" onclick="quickLaunch('reddit.com')">🔴 Reddit</div>
</div>

<div class="info-box">
<div class="info-title">How to Use:</div>
<div class="step">Enter any URL above</div>
<div class="step">Click DOWNLOAD LAUNCHER (best method)</div>
<div class="step">Double-click the downloaded file</div>
<div class="step">Edge opens in Guest Mode = No blocking extension!</div>
<br>
<div style="text-align:center;font-size:11px;opacity:0.7;">
Alternative: Copy command and paste in Windows Run (Win+R)
</div>
</div>

<div class="status">Extension bypass active ✓</div>
<div class="secret">made by emma</div>
</div>

<script>
let lightMode=false;
function toggleMode(){lightMode=!lightMode;document.body.classList.toggle('light-mode',lightMode);}

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

function getUrl(){
  let url=document.getElementById('url').value.trim();
  if(!url)return null;
  if(!url.match(/^https?:\/\//))url='https://'+url;
  return url;
}

function quickLaunch(site){
  document.getElementById('url').value=site;
  downloadLauncher();
}

function downloadLauncher(){
  const url=getUrl();
  if(!url){
    showNotification('⚠️ Please enter a URL first!');
    return;
  }
  
  const siteName=url.replace(/https?:\/\//,'').replace(/[^a-z0-9]/gi,'_').substring(0,20);
  const batchContent=`@echo off
title Rainbow Proxy - Opening ${siteName}
echo.
echo ═══════════════════════════════════════
echo    RAINBOW PROXY by Emma
echo ═══════════════════════════════════════
echo.
echo Opening: ${url}
echo In Edge Guest Mode (No Extensions!)
echo.
start msedge.exe --guest --new-window "${url}"
timeout /t 2 >nul
exit`;

  const blob=new Blob([batchContent],{type:'text/plain'});
  const link=document.createElement('a');
  link.href=URL.createObjectURL(blob);
  link.download='rainbow_'+siteName+'.bat';
  link.click();
  
  showNotification('✓ Launcher downloaded! Double-click to open');
}

function tryOpenEdge(){
  const url=getUrl();
  if(!url){
    showNotification('⚠️ Please enter a URL first!');
    return;
  }
  
  // Try multiple methods to open Edge in guest mode
  const methods=[
    'microsoft-edge:'+url+'?--guest',
    'microsoft-edge://'+url,
    'ms-edge:'+url
  ];
  
  methods.forEach(method=>{
    setTimeout(()=>{
      window.location.href=method;
    },100);
  });
  
  showNotification('🚀 Attempting to open Edge... If nothing happens, use DOWNLOAD LAUNCHER');
  
  // Fallback: open normally after delay
  setTimeout(()=>{
    window.open(url,'_blank');
  },2000);
}

function copyCommand(){
  const url=getUrl();
  if(!url){
    showNotification('⚠️ Please enter a URL first!');
    return;
  }
  
  const command='msedge.exe --guest --new-window "'+url+'"';
  
  navigator.clipboard.writeText(command).then(()=>{
    showNotification('✓ Copied! Press Win+R, paste, and hit Enter');
  }).catch(()=>{
    const textarea=document.createElement('textarea');
    textarea.value=command;
    textarea.style.position='fixed';
    textarea.style.opacity='0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showNotification('✓ Copied! Press Win+R, paste, and hit Enter');
  });
}

function showNotification(message){
  const notif=document.getElementById('notification');
  notif.textContent=message;
  notif.classList.add('show');
  setTimeout(()=>{
    notif.classList.remove('show');
  },4000);
}

document.getElementById('url').addEventListener('keypress',e=>{
  if(e.key==='Enter')downloadLauncher();
});
</script>
</body>
</html>
