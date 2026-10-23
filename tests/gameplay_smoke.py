from playwright.sync_api import sync_playwright
import sys
URL='http://127.0.0.1:4186/'
result=[]
def check(name,valid):
 result.append(bool(valid));print(('PASS' if valid else 'FAIL')+' '+name)
with sync_playwright() as p:
 browser=p.chromium.launch(channel='chrome',headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1200,'height':850})
 context.add_init_script("""(()=>{Math.random=()=>0;if(!localStorage.getItem('the-system-v1'))localStorage.setItem('the-system-v1',JSON.stringify({
 version:1,name:'SHADOW HUNTER',level:1,xp:90,gold:150,points:0,fatigue:0,
 stats:{strength:150,vitality:10,agility:10,sense:10,intelligence:10},
 hp:200,mp:100,items:{potion:1},equipped:{weapon:null,armor:null},
 daily:{date:new Date().toLocaleDateString('sv-SE'),counts:{pushups:0,situps:0,squats:0,run:0},claimed:false},
 targets:{pushups:2,situps:2,squats:2,run:.2},logs:[],welcome:true
 }));})();""")
 page=context.new_page()
 exceptions=[];page.on('pageerror',lambda e:exceptions.append(str(e)))
 page.goto(URL,wait_until='load')
 page.locator('[data-view="gates"]').first.click()
 page.locator('[data-gate="abandoned"]').click()
 check('Battle starts',page.locator('#battlePanel').is_visible())
 page.locator('[data-combat="attack"]').click()
 st=page.evaluate('window.SystemDebug.inspect()')
 check('Combat grants experience and level',st['level']>=2)
 check('Shadow extraction spawns soldier',len(st['shadows']['soldiers'])==1)
 check('Level Up cinematic appears',page.locator('#overlayTitle').inner_text()=='LEVEL UP')
 page.locator('#overlayClose').click()
 page.wait_for_function("document.getElementById('overlayTitle').textContent==='GATE CLEARED'")
 check('Gate Clear modal queued after Level Up',page.locator('#overlayTitle').inner_text()=='GATE CLEARED')
 page.locator('#overlayClose').click()
 page.evaluate("window.SystemBridge.setView('quests')")
 for name in ['pushups','situps','squats','run']:page.evaluate("(id)=>window.SystemBridge.complete(id)",name)
 check('Claim all available',page.locator('#quickClaim').is_visible())
 page.locator('#quickClaim').click()
 st=page.evaluate('window.SystemDebug.inspect()')
 check('Daily quest claimed',st['daily']['claimed'])
 check('Streak increments',st['streak']['days']==1)
 check('Quest reward changes XP, Gold and points',st['gold']>=350 and st['points']>=3)
 page.evaluate("""() => {const s=window.SystemDebug.inspect();
   s.shadows.lastTick=Date.now()-3600*1000;
   localStorage.setItem('the-system-v1',JSON.stringify(s));}""")
 beforeGold=st['gold']
 page.reload(wait_until='load')
 new=page.evaluate('window.SystemDebug.inspect()')
 check('Offline Shadow rewards paid',new['gold']>beforeGold)
 check('No gameplay JS exceptions',not exceptions)
 context.close();browser.close()
print('TOTAL',sum(result),'/',len(result))
if not all(result):sys.exit(1)
