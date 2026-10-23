/* UI enhancement layer: event-driven DOM, no duplicate save state. */
(function(){
'use strict';
const api=window.SystemBridge;
if(!api)return;
const $=id=>document.getElementById(id);
const exercises={pushups:['PUSH-UPS','reps'],situps:['SIT-UPS','reps'],squats:['SQUATS','reps'],run:['RUNNING','km']};
let focusId=null,holdTimer=0,holdStart=0,holdMoved=false,overlaySeen='',lastFocus=null;
const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const vibration=pattern=>{if(navigator.vibrate&&!reduce())try{navigator.vibrate(pattern)}catch{}};
function maxHP(s){return 100+s.stats.vitality*10+(s.equipped.armor==='armor'?60:s.equipped.armor==='shadow_coat'?220:0)}
function makeQuickBar(){
 if($('systemQuickbar'))return;
 const bar=document.createElement('aside');
 bar.id='systemQuickbar';bar.className='quickbar';
 bar.setAttribute('aria-label','Quick actions');
 bar.innerHTML='<button type="button" id="quickHeal" class="quick-heal" aria-label="Use Health Potion"><span aria-hidden="true">✚</span><b>HEAL</b><small id="healCount"></small></button>'+
 '<button type="button" id="quickQuest" class="quick-quest">◈ <span>QUESTS</span></button>'+
 '<button type="button" id="quickClaim" class="quick-claim" hidden>✦ CLAIM ALL</button>';
 document.body.append(bar);
 $('quickHeal').addEventListener('click',()=>{api.usePotion();vibration(18)});
 $('quickQuest').addEventListener('click',()=>api.setView('quests'));
 $('quickClaim').addEventListener('click',()=>{api.claimAll();vibration([20,30,40])});
}
function updateQuickBar(){
 const s=api.snapshot();
 const remaining=(s.items.potion||0)+(s.items.greater_potion||0);
 $('healCount').textContent='×'+remaining;
 $('quickHeal').disabled=remaining===0||s.hp>=api.healthCap();
 const ready=!s.daily.claimed&&Object.keys(exercises).every(k=>(s.daily.counts[k]||0)>=(s.targets[k]||Infinity));
 $('quickClaim').hidden=!ready;
 const streak=$('systemStreak');if(streak)streak.textContent='STREAK '+s.streak.days+' DAYS';
 const streakQuests=$('questStreak');if(streakQuests)streakQuests.textContent='STREAK '+s.streak.days+' DAYS · ADAPTIVE TARGETS';
 if(focusId)updateCounter();
}
function addStreak(){
 const status=document.querySelector('#view-status .page-head');
 if(status&&!$('systemStreak'))status.insertAdjacentHTML('beforeend','<div class="system-streak" id="systemStreak">STREAK 0 DAYS</div>');
 const quests=document.querySelector('#view-quests .page-head');
 if(quests&&!$('questStreak'))quests.insertAdjacentHTML('beforeend','<div class="system-streak" id="questStreak">STREAK 0 DAYS · ADAPTIVE TARGETS</div>');
 const inv=document.querySelector('#view-inventory .page-head');
 if(inv&&!$('inventoryHint'))inv.insertAdjacentHTML('beforeend','<p class="smart-hint" id="inventoryHint">Use AUTO-EQUIP BEST to equip your strongest available gear instantly.</p>');
}
function makeCounter(){
 const sheet=document.createElement('div');
 sheet.id='exerciseSheet';sheet.className='exercise-sheet';sheet.hidden=true;
 sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-labelledby','exerciseName');
 sheet.innerHTML='<div class="exercise-card hologram"><button type="button" id="exerciseClose" class="exercise-close" aria-label="Close activity logger">✕</button>'+
 '<div class="panel-label">SYSTEM // ACTIVITY LOGGER</div><h2 id="exerciseName">PUSH-UPS</h2><p class="exercise-note">Manual activity log. Only record repetitions you have actually completed.</p>'+
 '<div class="exercise-progress"><strong id="exerciseCount">0</strong><span id="exerciseTarget">/ 0</span></div>'+
 '<div class="bar thick"><div id="exerciseBar"></div></div>'+
 '<button type="button" id="exerciseTap" class="exercise-tap"><span>＋</span><b>TAP TO LOG ONE</b><small>Large touch target</small></button>'+
 '<div class="exercise-actions"><button type="button" id="exerciseHold" class="action-btn">HOLD TO ADD</button>'+
 '<button type="button" id="exerciseComplete" class="ghost-btn">LOG GOAL COMPLETE</button></div>'+
 '<p class="small-muted">Hold = rapid manual logging, not automatic fitness tracking. You control what is recorded.</p></div>';
 document.body.append(sheet);
 const close=()=>{stopHold();sheet.hidden=true;focusId=null;lastFocus?.focus?.()};
 $('exerciseClose').addEventListener('click',close);
 sheet.addEventListener('pointerdown',e=>{if(e.target===sheet)close()});
 $('exerciseTap').addEventListener('click',()=>increment(1));
 $('exerciseComplete').addEventListener('click',()=>{if(!focusId)return;api.complete(focusId);vibration([20,30,20]);close()});
 const hold=$('exerciseHold');
 hold.addEventListener('pointerdown',e=>{
  if(!focusId||e.button>0)return;
  e.preventDefault();stopHold();hold.setPointerCapture?.(e.pointerId);
  increment(focusId==='run'?.1:1);holdTimer=setInterval(()=>increment(focusId==='run'?.1:1),150);
  vibration(12);
 });
 for(const event of ['pointerup','pointercancel','lostpointercapture','pointerleave'])hold.addEventListener(event,stopHold);
 document.addEventListener('keydown',e=>{if(!sheet.hidden&&e.key==='Escape'){e.preventDefault();close()}});
}
function stopHold(){if(holdTimer){clearInterval(holdTimer);holdTimer=0}}
function increment(amount){if(!focusId)return;const state=api.snapshot();if(state.daily.claimed){stopHold();return}
 api.progress(focusId,amount);
 const next=api.snapshot();if(next.daily.counts[focusId]>=next.targets[focusId]){stopHold();vibration([15,30,30])}}
function updateCounter(){
 const s=api.snapshot(),id=focusId;if(!id||!exercises[id])return;
 const count=s.daily.counts[id]||0,target=s.targets[id]||1,done=count>=target;
 $('exerciseName').textContent=exercises[id][0];
 $('exerciseCount').textContent=String(count);
 $('exerciseTarget').textContent='/ '+target+' '+exercises[id][1];
 $('exerciseBar').style.width=Math.min(100,100*count/target)+'%';
 $('exerciseTap').disabled=done||s.daily.claimed;
 $('exerciseHold').disabled=done||s.daily.claimed;
 $('exerciseComplete').disabled=done||s.daily.claimed;
}
function openCounter(id,focusFrom){
 if(!exercises[id])return;
 focusId=id;lastFocus=focusFrom||document.activeElement;
 $('exerciseSheet').hidden=false;updateCounter();$('exerciseTap').focus();vibration(12);
}
function wireFocus(){
 document.addEventListener('click',e=>{
  const target=e.target.closest('[data-focus]');
  if(target){e.preventDefault();openCounter(target.dataset.focus,target)}
 });
 // Swipe a row to the right to self-report that target is done.
 let touch=null;
 document.addEventListener('pointerdown',e=>{
  const row=e.target.closest('[data-quest-row]');
  if(!row||e.target.closest('button,input')||e.pointerType!=='touch')return;
  touch={id:row.dataset.questRow,x:e.clientX,y:e.clientY,pid:e.pointerId};
 },{passive:true});
 document.addEventListener('pointerup',e=>{
  if(!touch||e.pointerId!==touch.pid)return;
  const dx=e.clientX-touch.x,dy=e.clientY-touch.y,id=touch.id;
  touch=null;
  if(dx>95&&Math.abs(dy)<55){
   api.complete(id);vibration([12,25,20]);
   const row=document.querySelector('[data-quest-row="'+id+'"]');
   row?.classList.add('swipe-done');
  }
 },{passive:true});
 document.addEventListener('pointercancel',()=>{touch=null});
}
function cinematic(){
 const ov=$('overlay');if(!ov)return;
 ov.classList.add('cinematic-overlay');
 const obs=new MutationObserver(()=>{
  if(ov.hidden){overlaySeen='';ov.removeAttribute('data-cinema');return}
  const title=$('overlayTitle')?.textContent||'';
  if(title===overlaySeen)return;overlaySeen=title;
  let kind='notice',color='#56d7ff';
  if(/LEVEL UP/i.test(title)){kind='level';color='#f2cd85'}
  else if(/GATE CLEARED/i.test(title)){kind='gate';color='#a984ff'}
  else if(/QUEST COMPLETED/i.test(title)){kind='quest';color='#55edcf'}
  else if(/FAILED/i.test(title)){kind='fail';color='#ff526d'}
  ov.dataset.cinema=kind;
  window.SystemParticles?.burst(color,reduce()?0:72);
  vibration(kind==='level'?[35,35,55,40,90]:[20,35,40]);
 });
 obs.observe(ov,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
}
function keyboard(){
 document.addEventListener('keydown',e=>{
  if(e.target.closest('input,textarea,select')||!$('overlay').hidden||!$('exerciseSheet').hidden)return;
  if(e.key.toLowerCase()==='h'){api.usePotion();vibration(15)}
  if(e.key.toLowerCase()==='q')api.setView('quests');
 });
}
function init(){
 makeQuickBar();makeCounter();addStreak();wireFocus();cinematic();keyboard();updateQuickBar();
 window.addEventListener('system:updated',updateQuickBar);
 document.addEventListener('click',e=>{
  const t=e.target.closest('button');
  if(t&&!t.disabled&&t.id!=='exerciseHold'&&t.id!=='exerciseTap')vibration(8);
 },{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();