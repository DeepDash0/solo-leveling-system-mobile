/* User-supplied original sound mode. No synthesized, bundled or substitute audio. */
(function(){
'use strict';
const DB='the-system-user-audio-v1',STORE='clips',PREF='the-system-audiovisual-v3';
const EVENTS=[['welcome','AWAKENING'],['quest','QUEST COMPLETE'],['level','LEVEL UP'],['gate','GATE ENTER'],
['victory','GATE CLEAR'],['nav','MENU NAVIGATION'],['click','SYSTEM CLICK'],['point','STAT POINT'],
['attack','ATTACK'],['skill','SKILL'],['damage','DAMAGE'],['buy','SHOP'],['close','DISMISS'],['error','WARNING']];
const VALID=new Set(EVENTS.map(x=>x[0]));
const clips=new Map(),players=new Map();let db=null,opening=null,enabled=true,volume=.78;
try{const p=JSON.parse(localStorage.getItem(PREF)||'{}');enabled=p.sound!==false;volume=Number.isFinite(p.volume)?Math.min(1,Math.max(0,p.volume)):.78;}catch{}
const htmlEscape=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function saveSettings(){try{localStorage.setItem(PREF,JSON.stringify({sound:enabled,volume}));}catch{}}
function openDB(){
 if(opening)return opening;
 opening=new Promise(resolve=>{
  if(!('indexedDB' in window)){resolve(null);return;}
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'});};
  req.onsuccess=()=>{db=req.result;resolve(db);};
  req.onerror=()=>resolve(null);req.onblocked=()=>resolve(null);
 });
 return opening;
}
async function rows(){
 const conn=await openDB();if(!conn)return [];
 return new Promise(resolve=>{
  const q=conn.transaction(STORE,'readonly').objectStore(STORE).getAll();
  q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>resolve([]);
 });
}
async function store(record){
 const conn=await openDB();if(!conn)throw Error('Local audio storage unavailable');
 return new Promise((resolve,reject)=>{
  const q=conn.transaction(STORE,'readwrite').objectStore(STORE).put(record);
  q.onsuccess=resolve;q.onerror=()=>reject(Error('Unable to store sound file'));
 });
}
async function forget(id){
 const conn=await openDB();if(!conn)return;
 return new Promise((resolve,reject)=>{
  const q=conn.transaction(STORE,'readwrite').objectStore(STORE).delete(id);
  q.onsuccess=resolve;q.onerror=()=>reject(Error('Unable to delete file'));
 });
}
function addRecord(record){
 const old=clips.get(record.id);if(old)URL.revokeObjectURL(old.url);
 if(players.has(record.id)){players.get(record.id).pause();players.delete(record.id);}
 clips.set(record.id,{name:record.name,url:URL.createObjectURL(record.blob),size:record.blob.size});
}
async function initialize(){for(const record of await rows()){
 if(VALID.has(record.id)&&record.blob instanceof Blob)addRecord(record);
}refresh();}
function play(id){
 if(!enabled||volume<.001||!clips.has(id))return false;
 try{
  if(players.has(id))players.get(id).pause();
  const a=new Audio(clips.get(id).url);
  a.volume=volume;a.playbackRate=1;players.set(id,a);
  const result=a.play();if(result?.catch)result.catch(()=>{});
  a.addEventListener('ended',()=>{if(players.get(id)===a)players.delete(id);},{once:true});
  return true;
 }catch{return false;}
}
function status(message,error){
 const el=document.getElementById('authAudioNotice');if(!el)return;
 el.textContent=message;el.style.color=error?'#ff8fa6':'#a9daec';
}
function refresh(){
 const toggle=document.getElementById('fxSoundToggle');
 if(toggle){toggle.textContent=clips.size?(enabled?'SFX ON':'SFX OFF'):'SFX EMPTY';toggle.title=clips.size+' manually imported clips';toggle.setAttribute('aria-pressed',String(enabled));}
 const count=document.getElementById('authAudioCount');if(count)count.textContent=clips.size+' / '+EVENTS.length+' configured';
 const level=document.getElementById('authVolumeLabel');if(level)level.textContent=Math.round(volume*100)+'%';
 document.querySelectorAll('[data-auth-state]').forEach(el=>{
  const rec=clips.get(el.dataset.authState);el.textContent=rec?'LOADED: '+rec.name:'NO FILE — SILENT';
  el.classList.toggle('audio-ready',!!rec);
 });
 document.querySelectorAll('[data-auth-test],[data-auth-remove]').forEach(el=>{
  el.disabled=!clips.has(el.dataset.authTest||el.dataset.authRemove);
 });
}
async function importFile(id,file){
 if(!VALID.has(id)||!file)return;
 if(file.size>8*1024*1024||file.size<200){status('Audio must be between 200 bytes and 8 MB.',true);return;}
 if(!/\.(wav|mp3|m4a|ogg|aac|flac|webm)$/i.test(file.name)){status('Unsupported audio file extension.',true);return;}
 const probe=new Audio(),url=URL.createObjectURL(file);
 try{
  await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(Error('Audio validation timed out')),5500);
   probe.addEventListener('loadedmetadata',()=>{clearTimeout(timeout);resolve();},{once:true});
   probe.addEventListener('error',()=>{clearTimeout(timeout);reject(Error('Audio is not playable in this browser'));},{once:true});
   probe.preload='metadata';probe.src=url;probe.load();
  });
  const rec={id,name:file.name.slice(0,100),blob:file,updatedAt:Date.now()};
  await store(rec);addRecord(rec);refresh();status('Imported local clip: '+file.name,false);
 }catch(e){status(e.message||'Import failed',true);}
 finally{probe.removeAttribute('src');probe.load();URL.revokeObjectURL(url);}
}
async function removeFile(id){
 await forget(id);
 if(players.has(id))players.get(id).pause();
 players.delete(id);
 if(clips.has(id))URL.revokeObjectURL(clips.get(id).url);
 clips.delete(id);refresh();status('Local sound removed.',false);
}
function createPanel(){
 const parent=document.getElementById('view-settings');if(!parent||document.getElementById('systemSoundPanel'))return;
 const panel=document.createElement('section');panel.className='panel audio-panel hologram';panel.id='systemSoundPanel';
 let rowsHtml='';
 for(const pair of EVENTS){
  const id=pair[0],title=pair[1];
  rowsHtml+='<div class="auth-audio-row"><div class="auth-audio-name"><strong>'+htmlEscape(title)+
    '</strong><small data-auth-state="'+id+'">NO FILE — SILENT</small></div>'+
    '<div class="auth-audio-buttons"><label class="auth-import">IMPORT <input type="file" accept="audio/*,.wav,.mp3,.ogg,.m4a,.flac" data-auth-input="'+id+'" hidden></label>'+
    '<button type="button" data-auth-test="'+id+'" disabled>▶</button>'+
    '<button type="button" data-auth-remove="'+id+'" disabled>×</button></div></div>';
 }
 panel.innerHTML='<div class="panel-label">SYSTEM AUDIO <span>STRICT ORIGINAL-ONLY</span></div>'+
   '<h2 class="audio-title">SOLO LEVELING SOUND LIBRARY</h2>'+
   '<p class="audio-desc">No synthesized, AI-generated or imitation audio will play. Import the actual clips you own or have permission to use. Uploaded sounds are kept byte-for-byte; this app cannot verify the authenticity or rights of a file.</p>'+
   '<div class="audio-controls"><label for="authVolume">VOLUME <strong id="authVolumeLabel"></strong></label><input type="range" id="authVolume" min="0" max="100" step="5" value="'+Math.round(volume*100)+'"></div>'+
   '<p id="authAudioCount" class="audio-footnote">No sounds loaded</p>'+
   '<div class="auth-audio-list">'+rowsHtml+'</div>'+
   '<p class="audio-footnote" id="authAudioNotice" role="status" aria-live="polite">Unassigned actions remain SILENT. Audio stays in this browser only.</p>'+
   '<p class="audio-footnote">For comparison: <a href="https://www.myinstants.com/en/instant/system-notifikason-solo-leveling-39262/" target="_blank" rel="noopener noreferrer">System Notification clip</a> · <a href="https://anime-soundboard.com/" target="_blank" rel="noopener noreferrer">Anime soundboard</a>. User uploads to those sites do not establish the original source or redistribution rights.</p>';
 const head=parent.querySelector('.page-head');
 if(head)head.insertAdjacentElement('afterend',panel);else parent.prepend(panel);
 panel.querySelector('#authVolume').addEventListener('input',e=>{volume=Number(e.target.value)/100;saveSettings();refresh();});
 panel.addEventListener('change',e=>{
  const input=e.target.closest('[data-auth-input]');if(!input)return;
  const file=input.files?.[0];if(file)importFile(input.dataset.authInput,file);
  input.value='';
 });
 panel.addEventListener('click',e=>{
  const test=e.target.closest('[data-auth-test]'),remove=e.target.closest('[data-auth-remove]');
  if(test)play(test.dataset.authTest);
  if(remove)removeFile(remove.dataset.authRemove).catch(err=>status(err.message,true));
 });
 refresh();
}
function init(){createPanel();initialize().catch(err=>console.warn('Authentic audio library failed',err));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.SystemAuthenticAudio=Object.freeze({
 play,has:id=>clips.has(id),count:()=>clips.size,
 toggle:()=>{enabled=!enabled;saveSettings();refresh();return enabled;},
 settings:()=>({enabled,volume}),ready:()=>initialize()
});
})();