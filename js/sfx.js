
/* THE SYSTEM — optional synthesized SFX and responsive combat/UI effects. No audio files or tracking. */
(()=>{'use strict';
const SETTINGS_KEY='the-system-audiovisual-v3';
let enabled=true,ctx=null,lastOverlayTitle='',lastClick=0,volume=.78;
try{let setting=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');enabled=setting.sound!==false;volume=Number.isFinite(setting.volume)?Math.min(1,Math.max(0,setting.volume)):.78}catch{}
const reduce=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const save=()=>{try{localStorage.setItem(SETTINGS_KEY,JSON.stringify({sound:enabled,volume}))}catch{}};
function ensureAudio(){if(!enabled)return null;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;if(!ctx)ctx=new A();if(ctx.state==='suspended')ctx.resume().catch(()=>{});return ctx}catch{return null}}
function tone(freq,duration=0.12,delay=0,shape='sine',vol=.024,endFreq){const ac=ensureAudio();if(!ac)return;
  const now=ac.currentTime+delay,o=ac.createOscillator(),g=ac.createGain();o.type=shape;o.frequency.setValueAtTime(freq,now);if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(30,endFreq),now+duration);
  g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(vol,now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+duration);
  o.connect(g);g.connect(ac.destination);o.start(now);o.stop(now+duration+.02);
}
function noise(duration=.12,volume=.01,delay=0){const ac=ensureAudio();if(!ac)return;let frames=Math.round(ac.sampleRate*duration),buffer=ac.createBuffer(1,frames,ac.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<frames;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/frames,1.6);
 const src=ac.createBufferSource(),gain=ac.createGain(),filter=ac.createBiquadFilter();src.buffer=buffer;filter.type='highpass';filter.frequency.value=670;gain.gain.value=volume;src.connect(filter);filter.connect(gain);gain.connect(ac.destination);src.start(ac.currentTime+delay)}
const SOUND_NAMES=new Set(['click','nav','point','quest','level','gate','attack','skill','damage','victory','buy','close','error','welcome']);
/* Decoded WAV buffers share a single Web Audio graph with a soft compressor. */
const decoded=new Map();
const fallback=new Map();
let compressor=null;
function sample(name,ac){
 if(decoded.has(name))return decoded.get(name);
 const promise=fetch('./sounds/'+name+'.wav?v=5',{cache:'force-cache'})
   .then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.arrayBuffer()})
   .then(b=>ac.decodeAudioData(b));
 decoded.set(name,promise);return promise;
}
function webBus(ac){
 if(!compressor){
   compressor=ac.createDynamicsCompressor();
   compressor.threshold.value=-13;
   compressor.knee.value=14;
   compressor.ratio.value=3;
   compressor.attack.value=.009;
   compressor.release.value=.21;
   compressor.connect(ac.destination);
 }
 return compressor;
}
function fallbackAudio(name,rel){
 try{
  let audio=fallback.get(name);
  if(!audio){audio=new Audio('./sounds/'+name+'.wav?v=5');audio.preload='auto';fallback.set(name,audio)}
  audio.pause();audio.currentTime=0;audio.volume=Math.max(0,Math.min(1,volume*rel));
  const p=audio.play();if(p?.catch)p.catch(()=>{});
 }catch{}
}
function play(kind){
 if(!enabled||volume<.001)return;
 const name=SOUND_NAMES.has(kind)?kind:'click';
 const rel=name==='click'?.30:name==='nav'?.43:name==='close'?.57:name==='attack'?.78:.90;
 const ac=ensureAudio();
 if(!ac){fallbackAudio(name,rel);return}
 sample(name,ac).then(buffer=>{
  if(!enabled||document.hidden)return;
  try{
   const source=ac.createBufferSource();
   source.buffer=buffer;
   const gain=ac.createGain();
   gain.gain.value=Math.max(0,Math.min(1,volume*rel));
   source.connect(gain);gain.connect(webBus(ac));
   source.start();
   source.onended=()=>{source.disconnect();gain.disconnect()};
  }catch{fallbackAudio(name,rel)}
 }).catch(()=>fallbackAudio(name,rel));
}
function flash(type='blue'){if(reduce())return;const el=document.createElement('div');el.className='fx-screen-flash '+(type==='blue'?'':type);document.body.append(el);setTimeout(()=>el.remove(),650)}
function sparks(x,y,type='blue',count=11){if(reduce())return;for(let i=0;i<count;i++){const ang=Math.random()*Math.PI*2,r=20+Math.random()*110;const s=document.createElement('i');s.className='fx-spark '+(type==='blue'?'':type);s.style.cssText=`left:${x}px;top:${y}px;--dx:${Math.cos(ang)*r}px;--dy:${Math.sin(ang)*r}px;animation-duration:${.45+Math.random()*.48}s;`;document.body.append(s);setTimeout(()=>s.remove(),1200)}}
function center(el){let r=el?.getBoundingClientRect()||{left:innerWidth/2,top:innerHeight/2,width:0,height:0};return [r.left+r.width/2,r.top+r.height/2]}
function shake(element){if(reduce()||!element)return;element.classList.remove('fx-hit');void element.offsetWidth;element.classList.add('fx-hit');setTimeout(()=>element.classList.remove('fx-hit'),380)}
function updateToggle(){let b=document.getElementById('fxSoundToggle');if(!b)return;b.setAttribute('aria-pressed',String(enabled));b.title=enabled?'Sound effects on — tap to mute':'Sound effects off — tap to enable';b.innerHTML=`<span class="sound-icon" aria-hidden="true">${enabled?'♪':'♪̸'}</span><span>SFX ${enabled?'ON':'OFF'}</span>`}
function createToggle(){const top=document.querySelector('.topbar-right');if(!top||document.getElementById('fxSoundToggle'))return;const b=document.createElement('button');b.id='fxSoundToggle';b.className='fx-sound-btn';b.type='button';b.setAttribute('aria-label','Toggle sound effects');top.insertBefore(b,top.firstChild);b.addEventListener('click',()=>{enabled=!enabled;save();updateToggle();if(enabled)play('point')});updateToggle()}
function panelForCombat(){return document.getElementById('battlePanel')}
function currentOverlay(){const overlay=document.getElementById('overlay');if(overlay?.hidden)return '';return document.getElementById('overlayTitle')?.textContent||''}
function handleOverlay(){const title=currentOverlay();if(!title){lastOverlayTitle='';return}if(title===lastOverlayTitle)return;lastOverlayTitle=title;const level=/LEVEL UP/i.test(title),victory=/CLEARED|COMPLETE/i.test(title),fail=/FAILED/i.test(title),welcome=/YOU HAVE BECOME|PLAYER ACCEPTED|SYSTEM RESET/i.test(title);
if(level){play('level');flash('gold');sparks(innerWidth/2,innerHeight/2,'gold',33)}else if(victory){play('victory');flash('blue');sparks(innerWidth/2,innerHeight/2,'blue',24)}else if(fail){play('damage');flash('red')}else if(welcome){play('welcome');flash();sparks(innerWidth/2,innerHeight/2,'blue',22)}else{play('gate');flash()}
}
function clickActions(event){const el=event.target.closest('button,[data-go]');if(!el||el.disabled||el.id==='fxSoundToggle'||el.closest('#systemSoundPanel'))return;const t=Date.now();if(t-lastClick<55)return;lastClick=t;
 let type='click',burst=false,kind='blue';
 if(el.dataset.view||el.dataset.go)type='nav';
 else if(el.dataset.stat){type='point';burst=true}
 else if(el.dataset.add){type='point';burst=true}
 else if(el.dataset.gate){type='gate';flash()}
 else if(el.dataset.combat){type=el.dataset.combat==='skill'?'skill':el.dataset.combat==='attack'?'attack':'close';if(el.dataset.combat!=='escape'){shake(panelForCombat());burst=true;kind=el.dataset.combat==='skill'?'blue':'red'}}
 else if(el.dataset.buy){type='buy';burst=true;kind='gold'}
 else if(el.dataset.use){type='point';burst=true}
 else if(el.id==='claimQuest'){type='quest';burst=true;kind='gold';flash('gold')}
 else if(el.id==='overlayClose'){type='close'}
 else if(el.dataset.unequip){type='close'}
 else if(el.id==='resetSave'){type='error'}
 play(type);if(burst){const [x,y]=center(el);sparks(x,y,kind,kind==='gold'?17:9)}
 setTimeout(handleOverlay,60)
}
function initSoundPanel(){
 const section=document.getElementById('view-settings');if(!section||document.getElementById('systemSoundPanel'))return;
 const panel=document.createElement('section');panel.id='systemSoundPanel';panel.className='panel audio-panel hologram';
 panel.setAttribute('aria-label','System sound pack');
 panel.innerHTML='<div class="panel-label">SYSTEM AUDIO <span>ANIME-INSPIRED V4</span></div>'+
 '<h2 class="audio-title">THE SYSTEM · SOUND PACK</h2><p class="audio-desc">Original cinematic holographic notification sounds. Preview a sound or change the volume below.</p>'+
 '<div class="audio-controls"><label for="systemVolume">MASTER SFX VOLUME <strong id="systemVolumeLabel"></strong></label><input aria-label="Sound effects volume" id="systemVolume" type="range" min="0" max="100" step="5"></div>'+
 '<div class="audio-tests">'+
 '<button type="button" data-preview-sound="welcome">✦ AWAKENING</button>'+
 '<button type="button" data-preview-sound="quest">◈ QUEST</button>'+
 '<button type="button" data-preview-sound="level">↑ LEVEL UP</button>'+
 '<button type="button" data-preview-sound="gate">◇ GATE</button>'+
 '<button type="button" data-preview-sound="skill">⚔ SKILL</button>'+
 '<button type="button" data-preview-sound="victory">✧ VICTORY</button>'+
 '</div><p class="audio-footnote">Tap SFX ON/OFF in the header to mute. Sounds play after your first interaction on mobile.</p>';
 const head=section.querySelector('.page-head');
 if(head)head.insertAdjacentElement('afterend',panel);else section.prepend(panel);
 const slider=panel.querySelector('#systemVolume'),label=panel.querySelector('#systemVolumeLabel');
 const sync=()=>{slider.value=String(Math.round(volume*100));label.textContent=Math.round(volume*100)+'%'};
 slider.addEventListener('input',()=>{volume=Number(slider.value)/100;save();sync()});
 slider.addEventListener('change',()=>{if(enabled)play('point')});
 panel.querySelectorAll('[data-preview-sound]').forEach(button=>button.addEventListener('click',()=>play(button.dataset.previewSound)));
 sync();
}
function init(){createToggle();initSoundPanel();document.addEventListener('click',clickActions);
 const ov=document.getElementById('overlay');if(ov){new MutationObserver(handleOverlay).observe(ov,{attributes:true,attributeFilter:['hidden'],subtree:true,childList:true,characterData:true});handleOverlay()}
 const tabs=document.querySelectorAll('.dock-item');tabs.forEach(el=>el.addEventListener('focus',()=>{}));
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&ctx?.state==='running')ctx.suspend().catch(()=>{})});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

