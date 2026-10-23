from playwright.sync_api import sync_playwright
import sys
checks = []
def assert_ok(name,value):
 checks.append(bool(value))
 print(('PASS' if value else 'FAIL') + ' ' + name)
with sync_playwright() as p:
 browser=p.chromium.launch(channel='chrome',headless=True,args=['--no-sandbox','--disable-gpu'])
 page=browser.new_page(viewport={'width':360,'height':780})
 issues=[]
 page.on('pageerror',lambda err: issues.append(str(err)))
 page.goto('http://127.0.0.1:4186/',wait_until='domcontentloaded')
 page.wait_for_timeout(300)
 if page.locator('#overlay').is_visible():
  page.locator('#overlayClose').click()
 assert_ok('6 named Gate ranks',page.locator('.gate-e,.gate-d,.gate-c,.gate-b,.gate-a,.gate-s').count()==6)
 assert_ok('SFX volume control',page.locator('#systemVolume').count()==1)
 assert_ok('reduced motion CSS',bool(page.evaluate('Array.from(document.styleSheets).some(s=>{try{return Array.from(s.cssRules).some(x=>x.conditionText?.includes("prefers-reduced-motion"))}catch{return false}})')))
 # 100 rapid manual log increments should not freeze the page or exceed goal.
 page.evaluate("window.SystemBridge.setView('settings')")
 page.evaluate("document.querySelector('[data-target=pushups]').value = 120")
 page.evaluate("document.querySelector('[data-target=situps]').value = 1")
 page.evaluate("document.querySelector('[data-target=squats]').value = 1")
 page.evaluate("document.querySelector('[data-target=run]').value = .1")
 page.locator('#saveTargets').click()
 start=page.evaluate("performance.now()")
 for i in range(100):
  page.evaluate("window.SystemBridge.progress('pushups',1)")
 elapsed=page.evaluate("performance.now()")-start
 count=page.evaluate('window.SystemDebug.inspect().daily.counts.pushups')
 assert_ok('100 quest updates persisted',count==100)
 print('100 updates via CDP:',round(elapsed),'ms; smooth rendering needs user-side device profiling.')
 assert_ok('no game JS exceptions',not issues)
 assert_ok('360px viewport no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
 browser.close()
print('PASS',sum(checks),'/',len(checks))
if not all(checks):sys.exit(1)
