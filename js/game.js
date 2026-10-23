
/* THE SYSTEM — offline Solo Leveling-inspired personal progression prototype.
   No server, payments, external requests, analytics or dependencies. */
(() => {
  'use strict';
     const SAVE_KEY = 'the-system-v1';
   const Rules=window.SystemRules;
  const $ = (id) => document.getElementById(id);
  const canon = { pushups: 100, situps: 100, squats: 100, run: 10 };
  const questDefs = [
    { id: 'pushups', title: 'PUSH-UPS', icon: 'Ⅰ', unit: 'reps', step: 5 },
    { id: 'situps', title: 'SIT-UPS', icon: 'Ⅱ', unit: 'reps', step: 5 },
    { id: 'squats', title: 'SQUATS', icon: 'Ⅲ', unit: 'reps', step: 5 },
    { id: 'run', title: 'RUNNING', icon: 'Ⅳ', unit: 'km', step: 0.5 },
  ];
  const statDefs = [
    { id: 'strength', title: 'STRENGTH', detail: 'PHYSICAL POWER', icon: '◆' },
    { id: 'vitality', title: 'VITALITY', detail: 'HP & RESILIENCE', icon: '✚' },
    { id: 'agility', title: 'AGILITY', detail: 'SPEED & EVASION', icon: '»' },
    { id: 'sense', title: 'SENSE', detail: 'PERCEPTION', icon: '◉' },
    { id: 'intelligence', title: 'INTELLIGENCE', detail: 'MANA & SKILLS', icon: '✧' },
  ];
  const ITEMS = {
    potion: { name: 'HEALTH POTION', detail: 'Restores 100 HP', rarity: 'COMMON', icon: '✚', type: 'potion', heal: 100, price: 70 },
    greater_potion: { name: 'GREATER POTION', detail: 'Restores 350 HP', rarity: 'RARE', icon: '✚', type: 'potion', heal: 350, price: 210 },
    dagger: { name: 'IRON DAGGER', detail: '+6 Attack', rarity: 'COMMON', icon: '⚔', type: 'weapon', attack: 6, price: 180 },
    knight_blade: { name: 'KNIGHT BLADE', detail: '+20 Attack', rarity: 'RARE', icon: '⚔', type: 'weapon', attack: 20, price: 950 },
    armor: { name: 'HUNTER ARMOR', detail: '+60 Maximum HP', rarity: 'UNCOMMON', icon: '◈', type: 'armor', health: 60, price: 450 },
    shadow_coat: { name: 'SHADOW COAT', detail: '+220 Maximum HP', rarity: 'EPIC', icon: '◆', type: 'armor', health: 220, price: 2100 },
    essence: { name: 'MAGIC ESSENCE', detail: 'A mysterious quest reward', rarity: 'RARE', icon: '✧', type: 'material', price: 0 },
  };
  const GATES = [
    { id: 'abandoned', name: 'ABANDONED TUNNEL', rank: 'E', minLevel: 1, enemy: 'Cave Goblin', hp: 64, attack: 6, defense: 1, xp: 70, gold: 85, description: 'A low-level Gate inhabited by goblins. Suitable for newly awakened hunters.', loot: 'potion', chance: .38 },
    { id: 'ruins', name: 'RUINS OF THE FALLEN', rank: 'D', minLevel: 4, enemy: 'Fang Wolf', hp: 135, attack: 13, defense: 3, xp: 145, gold: 165, description: 'Dangerous beasts guard the lost halls. Recommended for prepared hunters.', loot: 'dagger', chance: .27 },
    { id: 'red', name: 'RED GATE', rank: 'C', minLevel: 10, enemy: 'Blood Knight', hp: 335, attack: 29, defense: 8, xp: 340, gold: 420, description: 'A high-risk environment with powerful enemies and rare loot.', loot: 'armor', chance: .28 },
    { id: 'tower', name: 'DEMON TOWER', rank: 'B', minLevel: 20, enemy: 'Demon Commander', hp: 740, attack: 57, defense: 17, xp: 780, gold: 1200, description: 'A deadly challenge for hunters with advanced combat skills.', loot: 'knight_blade', chance: .29 },
    { id: 'abyss', name: 'ABYSSAL CITADEL', rank: 'A', minLevel: 30, enemy: 'Abyss Warden', hp: 1100, attack: 74, defense: 23, xp: 1300, gold: 1800, description: 'An unstable fortress of living darkness. The air distorts around its guardian.', loot: 'shadow_coat', chance: .15 },
    { id: 'monarch', name: 'SHADOW TRIAL', rank: 'S', minLevel: 40, enemy: 'Ancient Monarch', hp: 1650, attack: 100, defense: 34, xp: 2250, gold: 3200, description: 'The final trial of an awakened ruler. Only the strongest survive.', loot: 'shadow_coat', chance: .3 },
  ];
  const today = () => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  };
  const safe = (input) => String(input == null ? '' : input).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n = (value, defaultValue = 0) => Number.isFinite(Number(value)) ? Number(value) : defaultValue;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const fmt = v => Math.floor(v).toLocaleString('en-US');
  const xpRequired = level => Math.round(100 + 65 * Math.pow(level - 1, 1.52));
  const rankFor = level => level >= 70 ? 'S' : level >= 50 ? 'A' : level >= 35 ? 'B' : level >= 20 ? 'C' : level >= 10 ? 'D' : 'E';
  function initialState() {return {
    version: 1, name: 'PLAYER', level: 1, xp: 0, gold: 150, points: 0, fatigue: 0,
    stats: { strength: 10, vitality: 10, agility: 10, sense: 10, intelligence: 10 },
    hp: 200, mp: 100, items: { potion: 2 }, equipped: { weapon: null, armor: null },
    daily: { date: today(), counts: { pushups: 0, situps: 0, squats: 0, run: 0 }, claimed: false },
         targets: { ...canon }, baseTargets: { ...canon }, streak: {days:0,lastClaimDate:''},
     shadows: Rules.sanitizeShadows({},Date.now()),
    logs: [{ message: 'You have been selected as a Player.', date: today() }], welcome: false,
  };}
  function validateState(candidate) {
    if (!candidate || typeof candidate !== 'object' || candidate.version !== 1 || !candidate.stats || !candidate.daily) throw Error('Invalid System save file.');
    const base = initialState();
    const state = { ...base, ...candidate };
    state.level = clamp(Math.floor(n(state.level, 1)), 1, 9999);
    state.xp = clamp(Math.floor(n(state.xp)), 0, xpRequired(state.level)-1);
    state.gold = clamp(Math.floor(n(state.gold)), 0, 1000000000);
    state.points = clamp(Math.floor(n(state.points)), 0, 1000000);
    state.fatigue = clamp(Math.floor(n(state.fatigue)), 0, 100);
    state.name = String(state.name || 'PLAYER').trim().slice(0, 24) || 'PLAYER';
    state.stats = Object.fromEntries(statDefs.map(s => [s.id, clamp(Math.floor(n(candidate.stats[s.id],10)), 1, 1000000)]));
    state.targets = Object.fromEntries(questDefs.map(q => [q.id, clamp(n((candidate.targets || canon)[q.id], canon[q.id]), q.id === 'run' ? .1 : 1, q.id === 'run' ? 100 : 10000)]));
    state.items = {};
    for (const id of Object.keys(ITEMS)) state.items[id] = clamp(Math.floor(n((candidate.items || {})[id])),0,100000);
    state.equipped = {
      weapon: candidate.equipped && ITEMS[candidate.equipped.weapon]?.type === 'weapon' && state.items[candidate.equipped.weapon] > 0 ? candidate.equipped.weapon : null,
      armor: candidate.equipped && ITEMS[candidate.equipped.armor]?.type === 'armor' && state.items[candidate.equipped.armor] > 0 ? candidate.equipped.armor : null,
    };
    const d = candidate.daily;
    state.daily = { date: typeof d.date === 'string' && /^\d{4}-\d\d-\d\d$/.test(d.date) ? d.date : today(), counts: {}, claimed: !!d.claimed };
    questDefs.forEach(q => { state.daily.counts[q.id] = clamp(n((d.counts || {})[q.id]), 0, state.targets[q.id]); });
    state.logs = Array.isArray(candidate.logs) ? candidate.logs.filter(x=>x && typeof x.message === 'string').slice(0,6).map(x=>({message:x.message.slice(0,150), date:String(x.date||today()).slice(0,10)})) : base.logs;
    state.hp = clamp(Math.floor(n(state.hp)), 0, maxHP(state));
    state.mp = clamp(Math.floor(n(state.mp)), 0, maxMP(state));
         state.welcome = !!state.welcome;
     state.baseTargets = Object.fromEntries(questDefs.map(q=>[q.id,clamp(
       n((candidate.baseTargets||candidate.targets||canon)[q.id],canon[q.id]),
       q.id==='run'?.1:1,q.id==='run'?100:10000)]));
     const rawStreak=candidate.streak||{};
     state.streak={days:clamp(Math.floor(n(rawStreak.days)),0,3650),lastClaimDate:typeof rawStreak.lastClaimDate==='string'?rawStreak.lastClaimDate.slice(0,10):''};
     state.shadows=Rules.sanitizeShadows(candidate.shadows,Date.now());
    return state;
  }
  let state;
  try { const raw=localStorage.getItem(SAVE_KEY); state=raw ? validateState(JSON.parse(raw)) : initialState(); }
  catch(e){ console.warn('Unable to load save',e); state=initialState(); }
  let battle = null;
  let activeView='status';
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e) { toast('Unable to save locally. Browser storage may be blocked.'); } }
  function maxHP(s=state) {return 100+s.stats.vitality*10 + (s.equipped.armor ? (ITEMS[s.equipped.armor]?.health || 0) : 0);}
  function maxMP(s=state) {return 50+s.stats.intelligence*5;}
  function hpSet(v){state.hp=clamp(Math.round(v),0,maxHP());}
  function mpSet(v){state.mp=clamp(Math.round(v),0,maxMP());}
  function log(message){state.logs.unshift({message,date:today()});state.logs=state.logs.slice(0,6);}
  function toast(message) {let el=document.createElement('div'); el.className='toast'; el.innerHTML='<b>[ SYSTEM NOTIFICATION ]</b>'+safe(message); $('toastWrap').append(el);setTimeout(()=>el.remove(),3900);}
  const modalQueue=[];
  function overlay(title,body,symbol='✧'){
   if(!$('overlay').hidden){modalQueue.push([title,body,symbol]);return}
   $('overlayTitle').textContent=title;$('overlayBody').textContent=body;$('overlaySymbol').textContent=symbol;$('overlay').hidden=false;$('overlayClose').focus(); }
  function rewardXp(amount) {
    state.xp+=Math.max(0,Math.round(amount));let gained=0;
    while(state.xp>=xpRequired(state.level) && gained<100) {
      state.xp-=xpRequired(state.level);state.level++;state.points+=5;gained++;
      statDefs.forEach(s=>state.stats[s.id]++);
    }
    if(gained){ hpSet(maxHP());mpSet(maxMP());state.fatigue=Math.max(0,state.fatigue-8*gained);log(`LEVEL UP! You reached level ${state.level}.`);overlay('LEVEL UP',`LEVEL ${state.level} — All attributes +${gained}. You received ${gained*5} free ability points.`,'✦');}
    return gained;
  }
  function refreshDay(){const now=today();if(state.daily.date!==now){if(!state.daily.claimed){log('Daily quest expired. A fictional Penalty Zone warning was issued.');state.fatigue=clamp(state.fatigue+5,0,100);}state.daily={date:now,counts:{pushups:0,situps:0,squats:0,run:0},claimed:false};state.targets=Rules.targets(state.baseTargets,state.streak.days);save();if(activeView==='quests')toast('A new Daily Quest has arrived.');}}
  function dailyCompletion(){ return questDefs.every(q=>n(state.daily.counts[q.id])>=n(state.targets[q.id])); }
  function dailyPercentage() {return Math.floor(100*questDefs.reduce((v,q)=>v+Math.min(1,n(state.daily.counts[q.id])/n(state.targets[q.id],1)),0)/questDefs.length);}
  function setView(view) {
    if(!['status','quests','inventory','gates','shop','settings'].includes(view))return;
    activeView=view;document.querySelectorAll('.view').forEach(e=>e.classList.toggle('active',e.id===`view-${view}`));
    document.querySelectorAll('.nav-item, .dock-item').forEach(e=>e.classList.toggle('active',e.dataset.view===view));
    $('breadcrumbSection').textContent=view.toUpperCase();document.querySelector('.sidebar').classList.remove('open');
    window.scrollTo({top:0,behavior:'smooth'});render();
  }
  function renderStatus() {
    $('playerName').textContent=state.name.toUpperCase();$('playerJob').textContent=state.level>=40?'JOB: SHADOW MONARCH':state.level>=20?'JOB: HUNTER':'JOB: NONE';
    $('playerTitle').textContent='TITLE: '+(state.level>=40?'THE SOVEREIGN':state.level>=15?'THE AWAKENED':state.level>=5?'GATE EXPLORER':'NONE');
    $('profileLevel').textContent=String(state.level).padStart(2,'0');$('xpText').textContent=`${fmt(state.xp)} / ${fmt(xpRequired(state.level))} XP`;
    $('xpFill').style.width=`${100*state.xp/xpRequired(state.level)}%`;$('nextLevel').textContent=`NEXT LEVEL // ${fmt(xpRequired(state.level)-state.xp)} XP REMAINING`;
    $('rank').textContent=rankFor(state.level);$('fatigue').textContent=state.fatigue;$('points').textContent=fmt(state.points);$('remainingPoints').textContent=fmt(state.points);
    $('hpValue').textContent=`${fmt(state.hp)} / ${fmt(maxHP())}`;$('hpFill').style.width=`${state.hp/maxHP()*100}%`;
    $('mpValue').textContent=`${fmt(state.mp)} / ${fmt(maxMP())}`;$('mpFill').style.width=`${state.mp/maxMP()*100}%`;
    $('statList').innerHTML=statDefs.map(s=>`<div class="stat-row"><span class="stat-mark">${s.icon}</span><div class="stat-names"><b>${s.title}</b><small>${s.detail}</small></div><strong class="stat-number">${fmt(state.stats[s.id])}</strong><button class="plus-button" data-stat="${s.id}" aria-label="Add point to ${s.title}" ${state.points<1?'disabled':''}>+</button></div>`).join('');
    $('statusDaily').innerHTML=`<div class="mini-quest-title">PREPARATION OF THE STRONG</div><div class="mini-quest-line"><span>Quest Progress</span><b>${dailyPercentage()}%</b></div><div class="bar"><div style="width:${dailyPercentage()}%"></div></div><button class="ghost-btn" data-go="quests">VIEW DAILY QUEST →</button>`;
    $('activity').innerHTML=(state.logs.length?state.logs:[{message:'No recent system messages.',date:today()}]).slice(0,3).map(x=>`<div class="activity-item"><span>✧</span><span>${safe(x.message)}</span><small>${safe(x.date)}</small></div>`).join('');
  }
  function renderQuests(){
    $('questDate').textContent=state.daily.date;$('questPercentage').textContent=dailyPercentage()+'%';$('questProgress').style.width=dailyPercentage()+'%';
    $('questTasks').innerHTML=questDefs.map(q=>{const cur=n(state.daily.counts[q.id]),target=n(state.targets[q.id]),complete=cur>=target,step=q.id==='run'?'0.1':'1';return `<div class="quest-row" data-quest-row="${q.id}" title="Swipe right to log completed activity"><div class="quest-check ${complete?'complete':''}">${complete?'✓':q.icon}</div><div class="quest-desc"><b>${q.title}</b><small>${cur} / ${target} ${q.unit}</small></div><div class="quest-control"><button type="button" class="quest-focus" data-focus="${q.id}">LOG</button><button data-add="${q.id}" data-step="${q.id==='run'?.5:5}" aria-label="Add progress to ${q.title}" ${state.daily.claimed?'disabled':''}>+</button><input data-progress="${q.id}" type="number" step="${step}" min="0" max="${target}" value="${cur}" aria-label="${q.title} progress" ${state.daily.claimed?'disabled':''}></div></div>`;}).join('');
    $('claimQuest').disabled=!dailyCompletion()||state.daily.claimed;$('claimQuest').textContent=state.daily.claimed?'QUEST COMPLETE — REWARD CLAIMED':dailyCompletion()?'CLAIM ALL REWARDS':'COMPLETE ALL OBJECTIVES FIRST';
    $('mainQuests').innerHTML=[{name:'FIRST AWAKENING',desc:'Reach level 5',level:5},{name:'THE TRUE HUNTER',desc:'Reach level 15',level:15},{name:'CHANGE OF CLASS',desc:'Reach level 40',level:40}].map(q=>`<div class="main-quest"><div><b>${q.name}</b><small>${q.desc}</small></div><span>${state.level>=q.level?'CLEARED':'LOCKED'}</span></div>`).join('');
  }
  function renderItems(){const ids=Object.keys(state.items).filter(id=>state.items[id]>0 && ITEMS[id]);$('inventoryCount').textContent=`${ids.reduce((x,id)=>x+state.items[id],0)} ITEMS`;
    $('inventoryList').innerHTML=ids.length?ids.map(id=>{const item=ITEMS[id];const equipped=state.equipped[item.type]===id;return `<div class="item-card"><span class="item-qty">×${state.items[id]}</span><div class="item-symbol">${item.icon}</div><b>${item.name}</b><div class="item-rarity">${item.rarity}</div><small>${item.detail}</small>${item.type==='material'?'<span class="small-muted">QUEST MATERIAL</span>':`<button class="ghost-btn" data-use="${id}" ${equipped?'disabled':''}>${equipped?'EQUIPPED':item.type==='potion'?'USE':'EQUIP'}</button>`}</div>`;}).join(''):'<div class="item-empty">INVENTORY EMPTY — ENTER A GATE OR VISIT THE SHOP</div>';
    $('equippedList').innerHTML=['weapon','armor'].map(type=>{const id=state.equipped[type],item=id?ITEMS[id]:null;return `<div class="equip-row"><div><strong>${type.toUpperCase()}</strong><small>${item?item.name:'NONE EQUIPPED'}</small></div>${item?`<button data-unequip="${type}" class="ghost-btn">REMOVE</button>`:'<span>—</span>'}</div>`;}).join('');
  }
  function renderGates(){
    $('gatesGrid').innerHTML=GATES.map(g=>{const locked=state.level<g.minLevel;return `<article class="gate-card gate-${g.rank.toLowerCase()} ${g.id==='red'?'gate-red':''}" data-rank="${g.rank}"><div class="gate-rank">${g.rank}-RANK GATE</div><h3>${g.name}</h3><p>${g.description}</p><div class="gate-rewards">REWARDS: ${g.xp} XP + ${g.gold} GOLD</div><button class="action-btn" data-gate="${g.id}" ${locked||!!battle?'disabled':''}>${locked?`UNLOCK AT LEVEL ${g.minLevel}`:'ENTER GATE →'}</button></article>`;}).join('');
    $('battlePanel').hidden=!battle;
    if(battle){ const g=GATES.find(g=>g.id===battle.id);$('battlePanel').innerHTML=`<div class="panel-label">[ ACTIVE GATE ] <span>${g.rank}-RANK ENCOUNTER</span></div><h3>⚔ ${g.enemy.toUpperCase()}</h3><p>ENEMY HP: ${Math.max(0,battle.hp)} / ${g.hp} | YOUR HP: ${state.hp} / ${maxHP()} | MP: ${state.mp} / ${maxMP()}</p><div class="bar hp"><div style="width:${Math.max(0,100*battle.hp/g.hp)}%"></div></div><p>${safe(battle.message)}</p><div class="button-row"><button class="action-btn" data-combat="attack">ATTACK</button><button class="ghost-btn" data-combat="skill" ${state.mp<15?'disabled':''}>MANA STRIKE (-15 MP)</button><button class="danger-btn" data-combat="escape">RETREAT</button></div>`;}
  }
  function renderShop(){
    $('goldValue').textContent=fmt(state.gold)+' G';
    $('shopGrid').innerHTML=Object.entries(ITEMS).filter(([,item])=>item.price>0).map(([id,item])=>`<div class="item-card"><div class="item-symbol">${item.icon}</div><b>${item.name}</b><div class="item-rarity">${item.rarity}</div><small>${item.detail}</small><button class="ghost-btn" data-buy="${id}" ${state.gold<item.price?'disabled':''}>BUY // ${fmt(item.price)} G</button></div>`).join('');
  }
  function renderSettings(){
    if(document.activeElement!==$('nameInput')) $('nameInput').value=state.name;
    $('targetInputs').innerHTML=questDefs.map(q=>`<label>${q.title} (${q.unit})<input type="number" data-target="${q.id}" min="${q.id==='run'?.1:1}" max="${q.id==='run'?100:10000}" step="${q.id==='run'?.1:1}" value="${state.baseTargets[q.id]}"></label>`).join('');
  }
     function renderShadows(){
     const target=$('shadowArmy');if(!target)return;
     const ss=state.shadows.soldiers;
     const rates=ss.reduce((acc,s)=>{const r=Rules.RATES[s.rank];if(r){acc.xp+=r.xp;acc.gold+=r.gold}return acc},{xp:0,gold:0});
     target.innerHTML='<div class="panel-label">SHADOW ARMY <span>'+ss.length+' / '+Rules.MAX_SOLDIERS+' EXTRACTED</span></div>'+
       '<div class="shadow-total"><strong>'+ss.length+'</strong><span>ACTIVE SOLDIERS<br><small>PASSIVE INCOME '+rates.xp.toFixed(2)+' XP/S &middot; '+rates.gold.toFixed(2)+' G/S</small></span></div>'+
       '<div class="shadow-squad">'+(ss.length?ss.map(s=>'<span class="shadow-chip" data-rank="'+s.rank+'">'+safe(s.rank)+' &middot; '+safe(s.name)+'</span>').join(''):'<p class="small-muted">Clear Gates for a chance to extract a Shadow. Offline rewards are capped at 8 hours.</p>')+'</div>';
   }
   function render(){refreshDay();renderStatus();renderQuests();renderItems();renderGates();renderShop();renderShadows();if(activeView==='settings')renderSettings();
     window.dispatchEvent(new Event('system:updated'));
   }
  function updateProgress(id,newValue){const q=questDefs.find(q=>q.id===id);if(!q||state.daily.claimed)return;state.daily.counts[id]=clamp(q.id==='run'?Math.round(n(newValue)*10)/10:Math.floor(n(newValue)),0,state.targets[id]);save();renderStatus();renderQuests();window.dispatchEvent(new Event('system:updated'));if(dailyCompletion())toast('All objectives completed! Your reward is ready.');}
     function claim(){if(!dailyCompletion()||state.daily.claimed)return;state.streak.days=Rules.nextStreak(state.streak.days,state.streak.lastClaimDate,today());state.streak.lastClaimDate=today();state.daily.claimed=true;state.points+=3;state.gold+=200;state.fatigue=Math.max(0,state.fatigue-10);log('Daily Quest completed. Rewards delivered.');const gained=rewardXp(120);save();render();overlay('QUEST COMPLETED','REWARDS OBTAINED: +3 ability points, +120 EXP and +200 gold.','✓');}
  function allocate(id){if(state.points<=0||!statDefs.some(s=>s.id===id))return;state.points--;state.stats[id]++;if(id==='vitality')hpSet(state.hp+10);if(id==='intelligence')mpSet(state.mp+5);log(`A point was assigned to ${id.toUpperCase()}.`);save();render();}
  function useItem(id){const item=ITEMS[id];if(!item||n(state.items[id])<=0)return;if(item.type==='potion'){if(state.hp>=maxHP()){toast('HP already at maximum.');return;}hpSet(state.hp+item.heal);state.items[id]--;toast(`${item.name} consumed. HP restored.`);}else if(item.type==='weapon'||item.type==='armor'){const oldMax=maxHP();const oldMp=maxMP();state.equipped[item.type]=id;hpSet(state.hp+(maxHP()-oldMax));mpSet(Math.min(state.mp,oldMp));toast(`${item.name} equipped.`);}else return;log(item.name+' used.');save();render();}
  function buyItem(id){const item=ITEMS[id];if(!item||item.price<=0||state.gold<item.price)return;state.gold-=item.price;state.items[id]=(state.items[id]||0)+1;log(`Purchased ${item.name}.`);save();render();toast(`${item.name} added to inventory.`);}
  function enterGate(id){if(battle)return;const g=GATES.find(x=>x.id===id);if(!g||state.level<g.minLevel)return;if(state.hp<=0){hpSet(Math.ceil(maxHP()*.4));toast('Emergency recovery activated.');}
    battle={id,hp:g.hp,message:`${g.enemy} approaches. Your turn.`};render();window.scrollTo({top:0,behavior:'smooth'});}
  function combat(type){if(!battle)return;const g=GATES.find(x=>x.id===battle.id);if(type==='escape'){battle=null;state.fatigue=clamp(state.fatigue+5,0,100);log('You retreated from a Gate.');save();render();toast('You escaped from the Gate.');return;}
    const weapon=state.equipped.weapon?ITEMS[state.equipped.weapon].attack:0;
    if(type==='skill'&&state.mp<15)return;
    const dmg=Math.max(1,Math.round((12+state.stats.strength*1.18+weapon+(type==='skill'?state.stats.intelligence*2.25+15:0))*(.83+Math.random()*.34)-g.defense));
    if(type==='skill')mpSet(state.mp-15);
    battle.hp-=dmg;let response=`You inflicted ${dmg} damage with ${type==='skill'?'Mana Strike':'your attack'}.`;
    if(battle.hp<=0){const lootChance=Math.random();state.gold+=g.gold;state.fatigue=clamp(state.fatigue+3,0,100);if(lootChance<g.chance){state.items[g.loot]=(state.items[g.loot]||0)+1;response+=` Loot obtained: ${ITEMS[g.loot].name}.`;}
             idleTick(true);
       const extracted=extractShadow(g);
       if(extracted)response+=' A new Shadow Soldier answered your call.';
       log('Gate cleared: '+g.name+'. Received '+g.xp+' EXP and '+g.gold+' gold.');battle=null;const gained=rewardXp(g.xp);save();render();toast(`GATE CLEARED — +${g.xp} EXP / +${g.gold} G`);overlay('GATE CLEARED',`Enemy defeated. ${response} Reward: ${g.xp} EXP and ${g.gold} gold.`,'✦');return;}
    const enemyDamage=Math.max(1,Math.round(g.attack*(.72+Math.random()*.56)-state.stats.vitality*.19-state.stats.agility*.08));hpSet(state.hp-enemyDamage);response+=` ${g.enemy} counterattacked for ${enemyDamage} damage.`;
    if(state.hp<=0){state.fatigue=clamp(state.fatigue+20,0,100);state.gold=Math.max(0,state.gold-Math.min(60,Math.floor(state.gold*.1)));hpSet(Math.max(1,Math.ceil(maxHP()*.3)));battle=null;log('You were defeated. Emergency recovery activated.');save();render();overlay('QUEST FAILED','You were defeated. The System restored 30% of your HP. Rest and prepare before entering again.','✕');return;}
    battle.message=response;save();render();}
     function extractShadow(g){
     if(!Rules.shadowDrop(g.rank,state.shadows.soldiers.length,Math.random()))return false;
     const id=g.id+'-'+Date.now().toString(36)+'-'+Math.floor(Math.random()*1e5);
     state.shadows.soldiers.push({id,name:g.enemy,rank:g.rank});
     log('SHADOW EXTRACTED: '+g.enemy);
     return true;
   }
   function idleTick(silent=false){
     const now=Date.now();
     if(now<state.shadows.lastTick){state.shadows.lastTick=now;save();return}
     const reward=Rules.idleRewards(state.shadows,now);
     state.shadows.lastTick=reward.lastTick;state.shadows.xpCarry=reward.xpCarry;state.shadows.goldCarry=reward.goldCarry;
     if(reward.gold)state.gold+=reward.gold;
     if(reward.xp)rewardXp(reward.xp);
     if(reward.xp||reward.gold){
       log('Shadow Army returned: +'+reward.xp+' XP / +'+reward.gold+' gold.');
       save();render();
       if(!silent)toast('SHADOW ARMY  +'+reward.xp+' XP / +'+reward.gold+' G');
     }else save();
   }
   function autoEquip(){
     const oldHPMax=maxHP();
     let changed=0;
     for(const [type,attr] of [['weapon','attack'],['armor','health']]){
       const candidates=Object.entries(ITEMS).filter(([id,item])=>item.type===type&&state.items[id]>0)
         .sort((a,b)=>n(b[1][attr])-n(a[1][attr]));
       const winner=candidates[0]?.[0],old=state.equipped[type],oldPower=old?n(ITEMS[old]?.[attr]):0;
       if(winner&&n(ITEMS[winner][attr])>oldPower){state.equipped[type]=winner;changed++;}
     }
     if(changed){hpSet(state.hp+Math.max(0,maxHP()-oldHPMax));save();render();toast('SYSTEM OPTIMIZATION: '+changed+' item(s) equipped.')}
     else toast('Your best available equipment is already equipped.');
   }
   function updateName(){const value=$('nameInput').value.trim().slice(0,24);if(!value){toast('Please enter a Player name.');return;}state.name=value;log('Player profile updated.');save();render();toast('Player profile saved.');}
  function updateTargets(){const out={};for(const q of questDefs){const el=document.querySelector(`[data-target="${q.id}"]`);const v=n(el.value,0);const low=q.id==='run'?.1:1,high=q.id==='run'?100:10000;if(v<low||v>high){toast(`Invalid goal for ${q.title}.`);return;}out[q.id]=q.id==='run'?Math.round(v*10)/10:Math.floor(v);}
         state.baseTargets=out;state.targets=Rules.targets(out,state.streak.days);for(const q of questDefs)state.daily.counts[q.id]=Math.min(state.daily.counts[q.id],out[q.id]);save();render();toast('Daily Quest targets updated.');}
  function exportSave(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='the-system-save-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Save file exported.');}
  async function importSave(input){const file=input.files?.[0];if(!file)return;try{if(file.size>1024*1024)throw Error('File is too large.');const candidate=JSON.parse(await file.text());const next=validateState(candidate);if(!confirm('Replace current progress with this save? This cannot be undone.'))return;state=next;battle=null;save();render();toast('Save imported successfully.');}catch(e){toast('Import failed: '+e.message);}finally{input.value='';}}
  document.addEventListener('click',e=>{
    const el=e.target.closest('button, [data-go]');if(!el)return;
    if(el.matches('[data-view]'))setView(el.dataset.view);
    if(el.matches('[data-go]'))setView(el.dataset.go);
    if(el.matches('[data-stat]'))allocate(el.dataset.stat);
    if(el.matches('[data-add]'))updateProgress(el.dataset.add,state.daily.counts[el.dataset.add]+n(el.dataset.step));
    if(el.matches('[data-use]'))useItem(el.dataset.use);
    if(el.matches('[data-unequip]')){state.equipped[el.dataset.unequip]=null;hpSet(state.hp);save();render();toast('Item removed.');}
    if(el.matches('[data-buy]'))buyItem(el.dataset.buy);
    if(el.matches('[data-gate]'))enterGate(el.dataset.gate);
    if(el.matches('[data-combat]'))combat(el.dataset.combat);
  });
  document.addEventListener('change',e=>{if(e.target.matches('[data-progress]'))updateProgress(e.target.dataset.progress,e.target.value);});
  document.addEventListener('keydown',e=>{if(e.target.matches('input, textarea')||!$('overlay').hidden)return;if(/^[1-6]$/.test(e.key))setView(['status','quests','inventory','gates','shop','settings'][Number(e.key)-1]);if(e.key==='Escape')document.querySelector('.sidebar').classList.remove('open');});
  $('mobileNav').addEventListener('click',()=>document.querySelector('.sidebar').classList.toggle('open'));
     $('claimQuest').addEventListener('click',claim);
   $('autoEquipBtn').addEventListener('click',autoEquip);
  $('saveName').addEventListener('click',updateName);
  $('saveTargets').addEventListener('click',updateTargets);
  $('canonTargets').addEventListener('click',()=>{if(!confirm('Restore the original anime training targets?'))return;state.baseTargets={...canon};state.targets=Rules.targets(canon,state.streak.days);save();render();toast('Anime targets restored.');});
  $('exportSave').addEventListener('click',exportSave);
  $('importFile').addEventListener('change',e=>importSave(e.target));
  $('resetSave').addEventListener('click',()=>{if(!confirm('PERMANENTLY reset all levels, gold, stats, items and quest history?'))return;state=initialState();state.welcome=true;battle=null;save();render();setView('status');overlay('SYSTEM RESET','A new Player has entered the System.','◇');});
  document.addEventListener('keydown',e=>{
      if(!$('overlay').hidden&&(e.key==='Escape'||e.key==='Enter')){e.preventDefault();$('overlayClose').click();}
    });
  $('overlayClose').addEventListener('click',()=>{
     $('overlay').hidden=true;
     const next=modalQueue.shift();
     if(next)requestAnimationFrame(()=>overlay(...next));
   });
  function updateClock(){const now=new Date();$('clock').textContent=now.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase()+'  '+now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});if(state.daily.date!==today())render();}
     window.SystemBridge=Object.freeze({
     snapshot:()=>JSON.parse(JSON.stringify(state)),healthCap:()=>maxHP(),
     progress:(id,delta)=>{const q=questDefs.find(q=>q.id===id);if(q)updateProgress(id,n(state.daily.counts[id])+n(delta))},
     complete:(id)=>{const q=questDefs.find(q=>q.id===id);if(q)updateProgress(id,state.targets[id])},
     usePotion:()=>{const id=state.items.potion>0?'potion':state.items.greater_potion>0?'greater_potion':null;
       if(id)useItem(id);else toast('No Health Potions available.')},
     autoEquip,claimAll:claim,setView,toast,idleTick:()=>idleTick(false)
   });
   idleTick(true);render();updateClock();setInterval(updateClock,30000);
   setInterval(()=>{if(!document.hidden)idleTick(false)},60000);
   document.addEventListener('visibilitychange',()=>{if(!document.hidden)idleTick(false)});
  if(!state.welcome){state.welcome=true;save();overlay('YOU HAVE BECOME A PLAYER','The System recognizes you as its sole Player. Your journey begins at Level 1. Complete quests and enter Gates to become stronger.','◇');}
  // Limited developer diagnostics for automated tests, no cheats or mutation API.
  window.SystemDebug=Object.freeze({inspect:()=>JSON.parse(JSON.stringify(state)),getView:()=>activeView,requiredXp:xpRequired});
})();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
}

