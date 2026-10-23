from pathlib import Path
import re,html
root=Path(__file__).resolve().parents[1]
page=root/'index.html'
s=page.read_text(encoding='utf-8')
def once(a,b):
 global s
 if a not in s: raise RuntimeError('Expected snippet missing: '+a[:80])
 s=s.replace(a,b,1)
# Keep existing preferred enabled state (do not reset player save or existing audio preference).
once("let enabled=true,ctx=null,lastOverlayTitle='',lastClick=0;","let enabled=true,ctx=null,lastOverlayTitle='',lastClick=0,volume=.78;")
once("try{let setting=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');enabled=setting.sound!==false}catch{}",
     "try{let setting=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');enabled=setting.sound!==false;volume=Number.isFinite(setting.volume)?Math.min(1,Math.max(0,setting.volume)):.78}catch{}")
once("const save=()=>{try{localStorage.setItem(SETTINGS_KEY,JSON.stringify({sound:enabled}))}catch{}};",
     "const save=()=>{try{localStorage.setItem(SETTINGS_KEY,JSON.stringify({sound:enabled,volume}))}catch{}};")
newplay=r"""const SOUND_NAMES=new Set(['click','nav','point','quest','level','gate','attack','skill','damage','victory','buy','close','error','welcome']);
const banks=new Map();
function play(kind){
 if(!enabled||volume<.001)return;
 const name=SOUND_NAMES.has(kind)?kind:'click';
 try{
  let pool=banks.get(name);
  if(!pool){pool=[];banks.set(name,pool)}
  let sound=pool.find(a=>a.paused||a.ended);
  if(!sound && pool.length<3){
    sound=new Audio('./sounds/'+name+'.wav?v=4');
    sound.preload='auto';pool.push(sound);
  }
  if(!sound)sound=pool[0];
  if(!sound.paused)sound.pause();
  try{sound.currentTime=0}catch{}
  const rel=name==='click'?.30:name==='nav'?.43:name==='close'?.57:name==='attack'?.78:.90;
  sound.volume=Math.max(0,Math.min(1,volume*rel));
  const task=sound.play();
  if(task && task.catch)task.catch(()=>{});
 }catch(err){console.warn('System SFX unavailable',err)}
}"""
s,n=re.subn(r"function play\(kind\)\{if\(!enabled\)return;switch\(kind\)\{.*?\n\}\}",newplay,s,count=1,flags=re.S)
if n!=1:raise RuntimeError('play() patch failed '+str(n))
once("const level=/LEVEL UP/i.test(title),victory=/CLEARED|COMPLETE/i.test(title),fail=/FAILED/i.test(title);",
     "const level=/LEVEL UP/i.test(title),victory=/CLEARED|COMPLETE/i.test(title),fail=/FAILED/i.test(title),welcome=/YOU HAVE BECOME|PLAYER ACCEPTED|SYSTEM RESET/i.test(title);")
once("else{play('gate');flash()}","else if(welcome){play('welcome');flash();sparks(innerWidth/2,innerHeight/2,'blue',22)}else{play('gate');flash()}")
once("if(!el||el.disabled||el.id==='fxSoundToggle')return;","if(!el||el.disabled||el.id==='fxSoundToggle'||el.closest('#systemSoundPanel'))return;")
# UI sound controls that don't interfere with other Settings form handlers.
newpanel=r"""function initSoundPanel(){
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
}"""
once("function init(){createToggle();document.addEventListener('click',clickActions);",
     newpanel+"\nfunction init(){createToggle();initSoundPanel();document.addEventListener('click',clickActions);")
css=r"""
<style id="system-audio-v4-css">
.audio-panel{margin:20px 0 25px;padding:24px;position:relative;overflow:hidden}
.audio-panel:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 88% 4%,rgba(67,181,255,.12),transparent 55%)}
.audio-title{position:relative;font-size:clamp(16px,3vw,23px);letter-spacing:.12em;color:#c2ebff;font-weight:650;margin:16px 0 7px}
.audio-desc{position:relative;font-size:13px;line-height:1.7;color:#8baac0;margin:0 0 23px}
.audio-controls label{display:flex;justify-content:space-between;gap:12px;color:#a7dfff;letter-spacing:.08em;font-size:12px;font-weight:700;margin-bottom:12px}
.audio-controls strong{color:#fff}
#systemVolume{width:100%;min-height:32px;accent-color:#60c8ff;cursor:pointer}
.audio-tests{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:19px 0}
.audio-tests button{color:#b6edff;background:rgba(13,49,76,.58);border:1px solid rgba(95,194,255,.36);min-height:42px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:.06em;transition:background .22s,border-color .22s,transform .22s,box-shadow .22s}
.audio-tests button:hover,.audio-tests button:focus-visible{background:rgba(38,98,147,.48);border-color:#86deff;box-shadow:0 0 14px rgba(64,183,255,.20)}
.audio-tests button:active{transform:scale(.96)}
.audio-footnote{font-size:11px;color:#668baa;line-height:1.6;margin:8px 0 0}
@media(max-width:600px){.audio-panel{padding:17px}.audio-tests{grid-template-columns:repeat(2,minmax(0,1fr))}.audio-tests button{font-size:10px}}
</style>
"""
once('</head>',css+'</head>')
page.write_text(s,encoding='utf-8')
service=root/'service-worker.js'
sw=service.read_text(encoding='utf-8')
sw=sw.replace("the-system-mobile-v3","the-system-mobile-v4").replace("the-system-mobile-v2","the-system-mobile-v4").replace("the-system-mobile-v1","the-system-mobile-v4")
if 'the-system-mobile-v4' not in sw: raise RuntimeError('service worker version not found')
service.write_text(sw,encoding='utf-8')
print('Soundpack wired; UI panel added; SW cache bumped to v4.')
