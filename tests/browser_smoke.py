from playwright.sync_api import sync_playwright
import json,sys
URL='http://127.0.0.1:4186/'
checks=[]
def check(name,ok,detail=''):
 checks.append((name,bool(ok),detail))
 print(('PASS' if ok else 'FAIL'),name,detail)
with sync_playwright() as p:
 browser=p.chromium.launch(channel='chrome',headless=True,args=['--disable-gpu','--no-sandbox'])
 for device in ('desktop','mobile'):
  context=browser.new_context(viewport={'width':390 if device=='mobile' else 1440,'height':844 if device=='mobile' else 900},is_mobile=(device=='mobile'),has_touch=(device=='mobile'),device_scale_factor=1)
  context.add_init_script("""(()=>{ localStorage.setItem('the-system-v1',JSON.stringify({
    version:1,name:'RETURNING HUNTER',level:7,xp:44,gold:1480,points:3,fatigue:4,
    stats:{strength:17,vitality:16,agility:15,sense:13,intelligence:14},
    hp:109,mp:120,items:{potion:2,dagger:1,armor:1},equipped:{weapon:null,armor:null},
    daily:{date:new Date().toLocaleDateString('sv-SE'),counts:{pushups:0,situps:0,squats:0,run:0},claimed:false},
    targets:{pushups:6,situps:6,squats:6,run:.5},
    logs:[],welcome:true}));})();""")
  page=context.new_page()
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  bad=[];page.on('response',lambda r:bad.append(str(r.status)+' '+r.url) if r.status>=400 else None)
  page.goto(URL,wait_until='domcontentloaded')
  page.wait_for_timeout(500)
  check(device+' app rendered',page.locator('#playerName').inner_text()=='RETURNING HUNTER')
  check(device+' quest logger exists',page.locator('#exerciseSheet').count()==1)
  check(device+' particles canvas',page.locator('#energyCanvas').count()==1)
  check(device+' quick potion',page.locator('#quickHeal').count()==1)
  check(device+' shadows panel',page.locator('#shadowArmy').count()==1)
  check(device+' ranked Gate',page.locator('.gate-red').count()==1 and page.locator('.gate-s').count()==1)
  check(device+' returning save preserved',page.evaluate("window.SystemDebug.inspect().level") ==7)
  page.evaluate("window.SystemBridge.setView('quests')")
  page.locator('[data-focus="pushups"]').first.click()
  check(device+' exercise overlay open',not page.locator('#exerciseSheet').is_hidden())
  page.locator('#exerciseTap').click()
  check(device+' counter increments',page.evaluate("window.SystemDebug.inspect().daily.counts.pushups")==1)
  page.locator('#exerciseComplete').click()
  check(device+' log goal',page.evaluate("window.SystemDebug.inspect().daily.counts.pushups")==6)
  hp=page.evaluate("window.SystemDebug.inspect().hp")
  page.locator('#quickHeal').click()
  check(device+' quick potion works',page.evaluate("window.SystemDebug.inspect().hp")>hp)
  page.evaluate("window.SystemBridge.setView('inventory')")
  page.locator('#autoEquipBtn').click()
  check(device+' best auto equipped',page.evaluate("window.SystemDebug.inspect().equipped.weapon")=='dagger' and page.evaluate("window.SystemDebug.inspect().equipped.armor")=='armor')
  check(device+' no JS exceptions',len(errors)==0,str(errors[:2]))
  check(device+' no failed assets',len(bad)==0,str(bad[:3]))
  check(device+' no horizontal overflow',page.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2"),str(page.evaluate("({sw:document.documentElement.scrollWidth,w:innerWidth})")))
  page.screenshot(path='test-'+device+'.png',full_page=True)
  context.close()
 browser.close()
print('TOTAL',len(checks),'PASS',sum(x[1] for x in checks))
if not all(x[1] for x in checks):sys.exit(1)

