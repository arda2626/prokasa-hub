/* final app.js — works on GitHub Pages (uses allorigins proxy to avoid CORS) */
const COIN_START = 3000;
let coin = COIN_START;
let collection = [];
let skins = [];
let isOpening = false;

const coinEl = () => document.getElementById('coin');
const animationEl = () => document.getElementById('animation');
const resultEl = () => document.getElementById('result');
const collEl = () => document.getElementById('collection');
const tooltip = document.getElementById('tooltip');
const soundOpen = document.getElementById('sound-open');
const soundWin = document.getElementById('sound-win');
const particlesCanvas = document.getElementById('particles');

coinEl().innerText = coin;

/* Helpful: map rarity text to class */
function rarityClass(name){
  if(!name) return 'rarity-common';
  // ByMykel uses names like "Common","Restricted","Classified","Covert","Exceedingly Rare" etc.
  if(/common/i.test(name)) return 'rarity-common';
  if(/restricted/i.test(name)) return 'rarity-Restricted';
  if(/classified/i.test(name)) return 'rarity-Classified';
  if(/covert/i.test(name)) return 'rarity-Covert';
  if(/legendary|exceedingly rare|extraordinary|remarkable/i.test(name)) return 'rarity-Legendary';
  return 'rarity-common';
}

/* load skins from ByMykel via allorigins proxy to avoid CORS on GitHub Pages */
async function loadSkins(){
  try{
    const rawUrl = encodeURIComponent('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json');
    const res = await fetch(`https://api.allorigins.win/raw?url=${rawUrl}`);
    const data = await res.json();
    // data is array of skin objects
    skins = Array.isArray(data) ? data : (data.items || []);
    if(!skins.length) console.warn('skins empty — fallback will be used');
  }catch(e){
    console.error('Failed to load skins', e);
  }
  // fallback minimal set if API blocked
  if(!skins || !skins.length){
    skins = [
      { id:'fallback-1', name:'AK-47 | Redline', image:'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/weapon_ak47_redline_light.png', rarity:{name:'Classified'}, weapon:{name:'AK-47'} },
      { id:'fallback-2', name:'AWP | Asiimov', image:'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/weapon_awp_asiimov_light.png', rarity:{name:'Covert'}, weapon:{name:'AWP'} },
      { id:'fallback-3', name:'M4A1-S | Hyper Beast', image:'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/weapon_m4a1_s_hyper_beast_light.png', rarity:{name:'Classified'}, weapon:{name:'M4A1-S'} }
    ];
  }
}

/* UI helpers */
function setButtons(enabled){
  document.querySelectorAll('.box').forEach(b=>{
    b.style.pointerEvents = enabled ? 'auto' : 'none';
    b.style.opacity = enabled ? '1' : '0.6';
  });
}

/* generate slot strip (random picks) */
function makeSlotStrip(count=20){
  const div = document.createElement('div');
  div.className = 'slot';
  for(let i=0;i<count;i++){
    const s = skins[Math.floor(Math.random()*skins.length)];
    if(!s || !s.image) continue;
    const img = document.createElement('img');
    img.src = s.image;
    img.alt = s.name;
    img.dataset.name = s.name;
    img.dataset.rarity = s.rarity ? s.rarity.name : 'Common';
    img.dataset.weapon = s.weapon ? s.weapon.name : '';
    div.appendChild(img);
  }
  return div;
}

/* particle system for win flash */
function spawnParticles(color='#ffd700', count=50){
  const c = particlesCanvas;
  const ctx = c.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  c.width = window.innerWidth * DPR;
  c.height = window.innerHeight * DPR;
  ctx.scale(DPR, DPR);
  const particles = [];
  for(let i=0;i<count;i++){
    particles.push({
      x: window.innerWidth/2 + (Math.random()-0.5)*200,
      y: window.innerHeight/2 + (Math.random()-0.5)*80,
      vx: (Math.random()-0.5)*6,
      vy: -Math.random()*8 - 2,
      r: Math.random()*4+2,
      alpha:1
    });
  }
  let t=0;
  const anim = setInterval(()=>{
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    particles.forEach(p=>{
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25;
      p.alpha -= 0.01;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,215,0,${p.alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    });
    t++;
    if(t>120){ clearInterval(anim); ctx.clearRect(0,0,window.innerWidth,window.innerHeight); }
  },16);
}

/* open box feel: disables buttons, plays sound, creates slot, animates scroll then stops on final skin */
async function openBox(type){
  if(isOpening) return;
  isOpening = true;
  setButtons(false);

  const cost = type==='silver' ? 100 : (type==='gold' ? 300 : 500);
  if(coin < cost){
    alert('Yeterli coin yok!');
    isOpening = false;
    setButtons(true);
    return;
  }
  coin -= cost;
  coinEl().innerText = coin;

  // play open sound
  try{ soundOpen.currentTime = 0; soundOpen.play(); } catch(e){}

  // prepare slot
  const anim = animationEl();
  anim.innerHTML = '';
  const slot = makeSlotStrip(32);
  anim.appendChild(slot);

  // animate: accelerate then decelerate
  let pos = 0;                 // translateX
  let speed = 30 + Math.random()*10;
  const decel = 0.97 + Math.random()*0.005;
  return new Promise(resolve=>{
    const tick = setInterval(()=>{
      pos -= speed;
      slot.style.transform = `translateX(${pos}px) rotateY(${pos/80}deg)`;
      speed *= decel;
      // visual focus (scale center)
      Array.from(slot.children).forEach(img=>{
        // highlight centered image (approx)
        const rect = img.getBoundingClientRect();
        const containerRect = anim.getBoundingClientRect();
        const center = containerRect.left + containerRect.width/2;
        const dist = Math.abs((rect.left + rect.width/2) - center);
        const s = Math.max(0.9, 1.2 - dist/400);
        img.style.transform = `scale(${s})`;
        img.style.boxShadow = (dist<80) ? `0 18px 40px rgba(0,0,0,.6)` : `0 6px 18px rgba(0,0,0,.4)`;
      });
      if(speed < 0.6){
        clearInterval(tick);
        // pick final skin with rarity weighting
        const finalSkin = weightedPick();
        // show big win panel
        showWin(finalSkin);
        // update collection
        collection.push(finalSkin);
        updateCollection();
        try{ soundWin.currentTime=0; soundWin.play(); }catch(e){}
        // spawn particles colored by rarity
        const color = rarityToColor(finalSkin.rarity ? finalSkin.rarity.name : '');
        spawnParticles(color, 60);
        isOpening = false;
        setButtons(true);
        resolve(finalSkin);
      }
    },16);
  });
}

/* Show big win panel */
function showWin(skin){
  const res = resultEl();
  res.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'win';
  const img = document.createElement('img');
  img.src = skin.image;
  img.alt = skin.name;
  const p = document.createElement('p');
  p.className = rarityClass(skin.rarity ? skin.rarity.name : '');
  p.innerText = `${skin.name} — ${skin.rarity ? skin.rarity.name : ''}`;
  box.appendChild(img);
  box.appendChild(p);
  res.appendChild(box);
}

/* rarity color used for particles (returns hex) */
function rarityToColor(name){
  if(!name) return '#ffd700';
  if(/common/i.test(name)) return '#9d9d9d';
  if(/restricted/i.test(name)) return '#ff8040';
  if(/classified/i.test(name)) return '#9933cc';
  if(/covert/i.test(name)) return '#cc3333';
  if(/legendary|exceedingly rare/i.test(name)) return '#ffd700';
  return '#ffd700';
}

/* weighted pick: prefer rarer less often — simple weighting based on rarity name */
function weightedPick(){
  if(!skins || !skins.length) return skins[0] || {};
  // create buckets
  const weights = skins.map(s=>{
    const r = (s.rarity && s.rarity.name) || 'Common';
    if(/legendary|exceedingly rare/i.test(r)) return 1;
    if(/covert/i.test(r)) return 3;
    if(/classified/i.test(r)) return 7;
    if(/restricted/i.test(r)) return 15;
    return 40; // common
  });
  const total = weights.reduce((a,b)=>a+b,0);
  let rnd = Math.random()*total;
  for(let i=0;i<skins.length;i++){
    rnd -= weights[i];
    if(rnd<=0) return skins[i];
  }
  return skins[skins.length-1];
}

/* update collection UI */
function updateCollection(){
  const div = collEl();
  div.innerHTML = '';
  collection.slice().reverse().forEach(skin=>{
    const img = document.createElement('img');
    img.src = skin.image;
    img.alt = skin.name;
    img.title = `${skin.name} — ${skin.rarity ? skin.rarity.name : ''}`;
    img.onmouseenter = (e)=>{
      tooltip.style.display='block';
      tooltip.innerText = img.title;
    };
    img.onmousemove = (e)=>{
      tooltip.style.left = (e.pageX + 12) + 'px';
      tooltip.style.top = (e.pageY + 12) + 'px';
    };
    img.onmouseleave = () => tooltip.style.display='none';
    div.appendChild(img);
  });
}

/* map crate type to price (already used above) */
function cratePrice(type){
  return type==='silver'?100: type==='gold'?300:500;
}

/* helper to attach click listeners to boxes */
function attachBoxListeners(){
  document.querySelectorAll('.box').forEach(b=>{
    b.addEventListener('click', async (e)=>{
      const type = b.dataset.type;
      await openBox(type);
    });
  });
}

/* On load: fetch skins, attach listeners */
(async function init(){
  setButtons(false);
  await loadSkins();
  attachBoxListeners();
  setButtons(true);
})();

/* small window resize handler for particles canvas */
window.addEventListener('resize', ()=>{
  const c = particlesCanvas;
  c.width = window.innerWidth; c.height = window.innerHeight;
});

/* expose openBox for debug in console */
window.openBox = openBox;
