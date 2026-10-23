
/* THE SYSTEM — cinematic UI effects. All playback is handled by user-imported exact-source audio. */
(()=>{'use strict';
const reduce=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const play=event=>window.SystemAuthenticAudio?.play(event);
let lastOverlayTitle='',lastClick=0;
function flash(type='blue'){if(reduce())return;const el=document.createElement('div');el.className='fx-screen-flash '+(type==='blue'?'':type);document.body.append(el);setTimeout(()=>el.remove(),650)}
function sparks(x,y,type='blue',count=11){if(reduce())return;for(let i=0;i<count;i++){const ang=Math.random()*Math.PI*2,r=20+Math.random()*110;const s=document.createElement('i');s.className='fx-spark '+(type==='blue'?'':type);s.style.cssText=`left:${x}px;top:${y}px;--dx:${Math.cos(ang)*r}px;--dy:${Math.sin(ang)*r}px;animation-duration:${.45+Math.random()*.48}s;`;document.body.append(s);setTimeout(()=>s.remove(),1200)}}
function center(el){let r=el?.getBoundingClientRect()||{left:innerWidth/2,top:innerHeight/2,width:0,height:0};return [r.left+r.width/2,r.top+r.height/2]}
function shake(element){if(reduce()||!element)return;element.classList.remove('fx-hit');void element.offsetWidth;element.classList.add('fx-hit');setTimeout(()=>element.classList.remove('fx-hit'),380)}
function createToggle(){const top=document.querySelector('.topbar-right');if(!top||document.getElementById('fxSoundToggle'))return;const b=document.createElement('button');b.id='fxSoundToggle';b.className='fx-sound-btn';b.type='button';b.setAttribute('aria-label','Toggle imported sound effects');top.insertBefore(b,top.firstChild);b.addEventListener('click',()=>window.SystemAuthenticAudio?.toggle());}
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
function init(){createToggle();document.addEventListener('click',clickActions);
 const ov=document.getElementById('overlay');if(ov){new MutationObserver(handleOverlay).observe(ov,{attributes:true,attributeFilter:['hidden'],subtree:true,childList:true,characterData:true});handleOverlay()}
 const tabs=document.querySelectorAll('.dock-item');tabs.forEach(el=>el.addEventListener('focus',()=>{}));
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&ctx?.state==='running')ctx.suspend().catch(()=>{})});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

