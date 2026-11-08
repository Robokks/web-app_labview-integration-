"""In-memory Playwright UI integration; direct HTTP test is restricted by runner policy."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT=Path(__file__).parent
CSS=('styles.css','demo-mobile.css','mobile-ui.css','theme-light.css','template-ui.css')
JS=('templates.js','demo-mock.js','app.js','mobile-ui.js','template-ui.js','theme-switch.js')

def setup(page):
    page.goto('about:blank')
    html=(ROOT/'index.html').read_text()
    for css in CSS:html=html.replace(f'<link rel="stylesheet" href="/{css}">','')
    for js in JS:html=html.replace(f'<script src="/{js}" defer></script>','')
    page.set_content(html, wait_until='domcontentloaded')
    # Opaque about:blank in this runner denies Storage; provide a test-only in-memory stub.
    page.evaluate("""() => {const values=new Map(); Object.defineProperty(window,'localStorage',{configurable:true, value:{getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k),clear:()=>values.clear()}});}""")
    for css in CSS: page.add_style_tag(content=(ROOT/css).read_text())
    for js in JS:
        src=(ROOT/js).read_text()
        if js=='demo-mock.js':src=src.replace("u.pathname !== '/ws' || u.host !== location.host", 'false')
        page.add_script_tag(content=src)
    page.wait_for_timeout(480)

def run():
    with sync_playwright() as p:
        executable='/usr/bin/chromium' if Path('/usr/bin/chromium').is_file() else None
        browser=p.chromium.launch(headless=True,executable_path=executable,args=['--no-sandbox'])
        for width,height,name in ((1440,900,'desktop'),(390,844,'phone'),(768,1024,'tablet')):
            page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1,accept_downloads=True)
            page.set_default_timeout(7000)
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            setup(page)
            assert page.locator('#canvas .widget').count()==8
            page.locator('#template-picker').click()
            assert page.get_by_role('dialog').is_visible()
            assert page.locator('.template-card').count()==5
            # First reject replace to check no changes.
            page.once('dialog',lambda dlg:dlg.dismiss())
            page.locator('.template-card[data-template="transmission"]').click()
            assert 'Motor Test Dashboard' in page.locator('#dashboard-title').text_content()
            assert page.get_by_role('dialog').is_visible()
            # Load transmission rig: gear and multiple shaft tags, no write actions.
            page.once('dialog',lambda dlg:dlg.accept())
            page.locator('.template-card[data-template="transmission"]').click()
            assert page.locator('#dashboard-title').text_content().strip().startswith('Transmission Test Rig')
            assert page.locator('.widget').count()>=16
            page.wait_for_timeout(450)
            assert page.locator('.widget').filter(has_text='RA LH · Speed').count()==1
            assert page.locator('.widget').filter(has_text='RA RH · Torque').count()==1
            assert page.locator('.widget .widget-reading').first.inner_text().strip()!='—'
            # Every shipping template has a unique layout and resolvable mock tags.
            assert len(page.evaluate('window.PanelForgeTemplates'))==5
            available=page.evaluate('''() => window.PanelForgeTemplates.map(t=>({id:t.id,count:t.widgets.length}))''')
            assert all(x['count']>=10 for x in available)
            # Editing the layout, saving it and changing templates.
            page.locator('#publish').click()
            saved=page.evaluate('JSON.parse(localStorage.getItem("panelforge-layout-v1"))')
            assert saved['templateId']=='transmission' and saved['pageTitle']=='Transmission Test Rig'
            assert all(w['type'] in ('numeric','gauge','led','trend','motor','gear','profile','result','xy','section','spectrum') for w in saved['widgets'])
            page.locator('#template-picker').click()
            page.once('dialog',lambda dlg:dlg.accept())
            page.locator('.template-card[data-template="steering"]').click()
            assert page.locator('.widget').filter(has_text='Steering angle').count()>=1
            assert 'Steering Gear Test Rig' in page.locator('#dashboard-title').text_content()
            page.wait_for_timeout(350)
            assert page.locator('.widget').filter(has_text='Hydraulic pressure').first.inner_text().find('bar')>=0
            assert page.locator('.widget').filter(has_text='Hydraulic ready').first.inner_text().find('READY')>=0
            for template_id in ('dynamometer','general','motor','steering'):
                page.locator('#template-picker').click()
                page.once('dialog',lambda dlg:dlg.accept())
                page.locator(f'.template-card[data-template="{template_id}"]').click()
                page.wait_for_timeout(280)
                assert page.locator('.widget').count()>=10
                assert page.locator('.widget .widget-reading').first.inner_text().strip()!='—'
            # Model cannot carry equipment control messages.
            rejection=page.evaluate('''() => new Promise(resolve => {const ws=new WebSocket('ws://mock.invalid/ws');ws.addEventListener('open',()=>ws.send(JSON.stringify({type:'command',action:'start_motor'})));ws.addEventListener('message',e=>{const f=JSON.parse(e.data);if(f.type==='error'){resolve(f.code);ws.close();}});setTimeout(()=>resolve('TIMEOUT'),1000);})''')
            assert rejection=='READ_ONLY',rejection
            page.screenshot(path=str(ROOT/f'templates-{name}.png'),full_page=(name!='desktop'))
            if name=='phone':
                page.get_by_role('button',name='Add',exact=True).click()
                assert page.locator('body').evaluate("x=>x.classList.contains('mobile-panel-library')")
                page.get_by_role('button',name='Close Add display widget').click()
            geometry=page.evaluate('''() => ({width: document.documentElement.scrollWidth,viewport:innerWidth,template:document.querySelector('#dashboard-title').textContent.trim(),widgetCount:document.querySelectorAll('#canvas .widget').length,signal:document.querySelector('#connection').textContent.trim(),modal:document.querySelector('.template-overlay').hidden})''')
            assert geometry['width']<=width+2,geometry
            assert not errors,errors
            assert geometry['signal']=='Mock live',geometry
            assert geometry['modal']
            print(name,json.dumps(geometry),errors)
            page.close()
        browser.close()

if __name__=='__main__':run()
