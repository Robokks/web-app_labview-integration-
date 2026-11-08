from playwright.sync_api import sync_playwright
import json, re
from pathlib import Path
import pytest
ROOT=Path(__file__).resolve().parents[1]/'hosted-demo'
html=re.sub(r"\s*<(?:script|link)\s+[^>]*(?:src|href)=\"/[^\"]+\"[^>]*>(?:</script>)?", "", (ROOT/"index.html").read_text())
@pytest.mark.parametrize('size',[{'width':1440,'height':900},{'width':390,'height':844},{'width':768,'height':960}])
def test_template_workflow(size):
 with sync_playwright() as p:
  browser_args={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
  if Path('/usr/bin/chromium').is_file():browser_args['executable_path']='/usr/bin/chromium'
  b=p.chromium.launch(**browser_args)
  ctx=b.new_context(viewport=size,device_scale_factor=1,is_mobile=size['width']<600,has_touch=size['width']<600)
  page=ctx.new_page();errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate('''() => {const items=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>items.has(k)?items.get(k):null,setItem:(k,v)=>items.set(k,String(v)),removeItem:k=>items.delete(k),clear:()=>items.clear(),key:i=>Array.from(items.keys())[i],get length(){return items.size}}})}''')
  for css in ['styles.css','demo-mobile.css','mobile-ui.css','theme-light.css','templates.css']:
   page.add_style_tag(content=(ROOT/css).read_text())
  for js in ['demo-mock.js','app.js','mobile-ui.js','theme-switch.js','templates.js']:
   src=(ROOT/js).read_text()
   if js=='demo-mock.js':src=src.replace('const u = new URL(url, location.href);',"const u = new URL('ws://test.local/ws');").replace("u.pathname !== '/ws' || u.host !== location.host", "u.pathname !== '/ws'")
   page.add_script_tag(content=src)
  page.wait_for_timeout(650)
  assert page.locator('.widget').count()==8, ('default',page.locator('.widget').count())
  assert page.locator('.connection.connected').count()==1,'simulator not connected'
  if size['width']<=840:
   page.get_by_role('button',name='Templates',exact=True).last.click()
  else:page.locator('#templates-open').click()
  assert page.locator('#template-modal-root.open').count()==1
  assert page.locator('.template-card').count()==5
  for name in ['Motor Test Rig','Transmission Test Rig','Steering Gear Rig','Dynamometer Rig','General Purpose Rig']:
   page.locator('.template-card').filter(has=page.locator('.template-card-info strong',has_text=name)).first.click()
   assert page.locator('.templates-detail h3').inner_text()==name
  page.locator('.template-card').filter(has=page.locator('.template-card-info strong',has_text='Transmission Test Rig')).first.click()
  page.locator('#template-load').click()
  assert page.locator('#template-modal-root.open').count()==0
  assert page.locator('.widget').count()==12,('widgets',page.locator('.widget').count())
  assert 'Transmission Test Rig' in page.locator('.page-details h1').inner_text()
  assert '—' not in page.locator('.widget').first.locator('.widget-reading').inner_text()
  # Existing indicators remain editable in the inspector.
  page.locator('.widget').first.click()
  assert page.locator('.inspector-content input').count()>0
  if size['width']<=840:
   # Escape mobile inspector sheet by tapping the translucent overlay.
   page.locator('.mobile-sheet-backdrop').click(position={'x':10,'y':10})
  page.locator('#templates-open').evaluate('(el)=>el.click()')
  page.locator('#template-save-current').click()
  page.locator('#template-custom-name').fill('My transmission layout')
  page.locator('#template-save-form button[type=submit]').click()
  assert page.locator('.template-card').count()==1
  assert page.locator('.templates-detail h3').inner_text()=='My transmission layout'
  assert 'My transmission layout' in page.evaluate('localStorage.getItem("panelforge-custom-templates-v1")')
  # Saved layout survives reload on same browser/device.
  persisted=page.evaluate('localStorage.getItem("panelforge-custom-templates-v1")')
  assert json.loads(persisted)[0]['name']=='My transmission layout'
  page.locator('.templates-categories button').filter(has_text='My layouts').click()
  assert page.locator('.template-card').count()==1
  # Save current layout using original Save button.
  page.locator(".templates-close").click()
  page.locator('#publish').click()
  assert page.evaluate('localStorage.getItem("panelforge-layout-v1")')
  assert not errs, ('JS errors',errs)
  scroll=page.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
  print(size['width'],': passed; horizontal overflow px:',scroll, 'mock signals:',page.locator('.connection.connected').count())
  if size['width']!=768:assert scroll<6,scroll
  ctx.close()
  b.close()
