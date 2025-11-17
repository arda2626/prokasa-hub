// Basit, lokal çalışan kasa simülatörü
// Rarity dağılımları örnek: Common 80%, Rare 15%, Epic 4%, Legendary 1%
const GAMES = {
  cs2: {
    name: "CS2",
    items: [
      {name:"AK-47 | Redline (Common)", rarity:"common"},
      {name:"M4A1-S | Chantico's Fire (Rare)", rarity:"rare"},
      {name:"AWP | Dragons Lore (Legendary)", rarity:"legendary"},
      {name:"Glock-18 | Weasel (Common)", rarity:"common"},
      {name:"Desert Eagle | Blaze (Epic)", rarity:"epic"}
    ]
  },
  valo: {
    name:"Valorant",
    items:[
      {name:"Classic | Standard Skin (Common)", rarity:"common"},
      {name:"Vandal | Elderflame (Legendary)", rarity:"legendary"},
      {name:"Phantom | Ion (Epic)", rarity:"epic"},
      {name:"Sheriff | Prism (Common)", rarity:"common"},
      {name:"Operator | Reaver (Rare)", rarity:"rare"}
    ]
  },
  wr: {
    name:"Wild Rift",
    items:[
      {name:"Champion Skin - Default (Common)", rarity:"common"},
      {name:"Champion Skin - Prestige (Legendary)", rarity:"legendary"},
      {name:"Emote - Laugh (Common)", rarity:"common"},
      {name:"Ward Skin - Neon (Rare)", rarity:"rare"},
      {name:"Icon Border - Golden (Epic)", rarity:"epic"}
    ]
  }
};

const rarityRates = [
  {rarity:"legendary", p:0.01},
  {rarity:"epic", p:0.04},
  {rarity:"rare", p:0.15},
  {rarity:"common", p:0.80}
];

function chooseRarity(){
  const r = Math.random();
  let acc = 0;
  for(let i=0;i<rarityRates.length;i++){
    acc += rarityRates[i].p;
    if(r <= acc) return rarityRates[i].rarity;
  }
  return "common";
}

function pickItem(gameKey){
  const game = GAMES[gameKey];
  const chosenR = chooseRarity();
  // filtrele ve rastgele seç
  const pool = game.items.filter(it => it.rarity === chosenR);
  if(pool.length === 0){
    // fallback: tüm öğelerden seç
    return game.items[Math.floor(Math.random()*game.items.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// DOM helpers
function $(s){return document.querySelector(s)}
function $all(s){return Array.from(document.querySelectorAll(s))}

function animateCrate(crateEl){
  crateEl.classList.add('open-anim');
  setTimeout(()=>crateEl.classList.remove('open-anim'), 1200);
}

// show result & save last
let lastResult = null;
function showResult(gameKey, item){
  const resultEl = $(`#result-${gameKey}`);
  resultEl.textContent = `Ödül: ${item.name} (${item.rarity.toUpperCase()})`;
  lastResult = {game:gameKey, item:item, time: Date.now()};
  // kayıt göster
  addToTempCollection(lastResult);
}

function addToTempCollection(entry){
  const colEl = $('#collection');
  let list = getCollection();
  list.push(entry);
  saveCollection(list);
  renderCollection();
}

function getCollection(){
  try{
    const raw = localStorage.getItem('prokasa_collection_v1');
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    return [];
  }
}

function saveCollection(list){
  localStorage.setItem('prokasa_collection_v1', JSON.stringify(list));
}

function renderCollection(){
  const col = getCollection();
  const el = $('#collection');
  if(col.length === 0){ el.innerHTML = 'Henüz bir şey yok.'; return; }
  el.innerHTML = col.slice().reverse().map(entry=>{
    const t = new Date(entry.time);
    return `<div class="col-item"><strong>${GAMES[entry.game].name}</strong> — ${entry.item.name} <span class="muted">(${entry.item.rarity})</span><div class="ts">${t.toLocaleString()}</div></div>`;
  }).join('');
}

// Setup event listeners
function setup(){
  // nav
  $all('.nav-btn').forEach(btn=>{
    btn.onclick = ()=> {
      $all('.nav-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.target;
      $all('.panel').forEach(p=>p.classList.remove('active'));
      $(`#${target}`).classList.add('active');
    };
  });

  // single opens
  ['cs2','valo','wr'].forEach(key=>{
    $(`#open-${key}`).onclick = ()=>{
      const item = pickItem(key);
      animateCrate($(`#crate-${key}`));
      setTimeout(()=>showResult(key,item), 650);
    };
    $(`#multi-${key}`).onclick = ()=>{
      // 10 açılım
      let results = [];
      for(let i=0;i<10;i++){
        results.push(pickItem(key));
      }
      animateCrate($(`#crate-${key}`));
      setTimeout(()=>{
        // göster sadece sonuncusu + ekle hepsini
        showResult(key, results[results.length-1]);
        results.forEach(r=> addToTempCollection({game:key,item:r,time:Date.now()}));
      }, 900);
    };
  });

  $('#clear-collection').onclick = ()=>{
    localStorage.removeItem('prokasa_collection_v1');
    renderCollection();
  };

  // share
  $('#share-btn').onclick = async ()=>{
    if(!lastResult){ alert('Önce bir kasa aç'); return; }
    const text = `ProKasa'da ${GAMES[lastResult.game].name} kasasından ${lastResult.item.name} kazandım!`;
    if(navigator.share){
      try{ await navigator.share({title:'ProKasa Hub', text}); }catch(e){}
    } else {
      prompt('Kopyala ve paylaş:', text);
    }
  };

  renderCollection();
}

// başlat
document.addEventListener('DOMContentLoaded', setup);