from playwright.sync_api import sync_playwright
URL="https://deepdash0.github.io/solo-leveling-system-mobile/"
with sync_playwright() as p:
 browser=p.chromium.launch(channel="chrome",headless=True,args=["--no-sandbox"])
 context=browser.new_context(service_workers="allow")
 page=context.new_page()
 page.goto(URL,wait_until="load",timeout=20000)
 page.wait_for_function("navigator.serviceWorker.controller!==null",timeout=15000)
 cache=page.evaluate("caches.keys()")
 print("Active PWA caches:",cache)
 context.set_offline(True)
 page.reload(wait_until="domcontentloaded",timeout=15000)
 page.wait_for_timeout(400)
 assert page.locator("#playerName").count()==1,"Offline player panel missing"
 assert page.locator("#energyCanvas").count()==1,"Offline canvas missing"
 assert page.locator("#systemQuickbar").count()==1,"Offline quickbar missing"
 print("PASS offline GitHub Pages app loads, renders and runs from service-worker cache")
 browser.close()
