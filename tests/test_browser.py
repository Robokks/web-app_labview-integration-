"""In-memory Chromium frontend tests. Browser HTTP/WebSocket integration NOT verified."""
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1] / "web"


@pytest.fixture
def page():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 1536, 'height': 960})
        html = (ROOT / 'index.html').read_text('utf-8')
        html = html.replace('<link rel="stylesheet" href="/styles.css">', '')
        html = html.replace('<script src="/app.js" defer></script>', '')
        page.set_content(html)
        page.add_style_tag(content=(ROOT / 'styles.css').read_text('utf-8'))
        page.evaluate('''() => {
          const store = new Map();
          Object.defineProperty(window, 'localStorage', { configurable: true, value: {
            getItem: k => store.has(k) ? store.get(k) : null,
            setItem: (k,v) => store.set(k,String(v)),
            removeItem: k => store.delete(k),
          }});
          window.WebSocket = class {
            constructor() { this.handlers={}; setTimeout(()=>{
              this.handlers.open?.();
              const now = new Date().toISOString();
              const rows=[
                ['motor.speed','Float64','rpm',1485.2],
                ['motor.torque','Float64','Nm',122.8],
                ['motor.power','Float64','kW',19.1],
                ['motor.current','Float64','A',22.5],
                ['motor.running','Boolean','',true],
                ['gear.actual','Enum','','3'],
                ['profile.step','String','','Ramp up'],
                ['profile.progress','Float64','%',35],
                ['test.result','Enum','','PASS'],
              ];
              this.handlers.message?.({data: JSON.stringify({
                type:'snapshot', schema_version:1, sequence:1,
                signals: rows.map(([id,data_type,unit,value])=>({
                  id,data_type,unit,value,quality:'Good',source_timestamp:now,gateway_timestamp:now,sequence:1
                }))})});
            },20); }
            addEventListener(k, fn) { this.handlers[k] = fn; }
            close() {}
          };
        }''')
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.add_script_tag(content=(ROOT / 'app.js').read_text('utf-8'))
        page.get_by_text('Mock live', exact=True).wait_for(timeout=2000)
        yield page, errors
        browser.close()


def test_render_mock_values(page):
    browser, errors = page
    assert browser.locator('.widget').count() == 8
    assert '1,485.2' in browser.locator('.widget-reading').first.inner_text()
    assert browser.get_by_text('not a verified G1800 pattern').count() == 1
    assert not errors


def test_add_delete_and_layout(page):
    browser, errors = page
    browser.get_by_role('button', name='Add Radial gauge').click()
    assert browser.locator('.widget').count() == 9
    browser.get_by_role('button', name='Free canvas').click()
    assert 'free-layout' in browser.locator('#canvas').get_attribute('class')
    browser.get_by_role('button', name='Delete').click()
    assert browser.locator('.widget').count() == 8
    browser.get_by_role('button', name='Smart grid').click()
    assert 'grid-layout' in browser.locator('#canvas').get_attribute('class')
    assert not errors


def test_save_preview_and_read_only(page):
    browser, errors = page
    browser.get_by_role('button', name='Preview').click()
    assert browser.get_by_role('button', name='Add Digital value').is_hidden()
    browser.get_by_role('button', name='Exit preview').click()
    browser.get_by_role('button', name='Save layout').click()
    saved = browser.evaluate('JSON.parse(localStorage.getItem("panelforge-layout-v1"))')
    assert saved['schema_version'] == 1
    assert len(saved['widgets']) == 8
    assert browser.locator('button').filter(has_text='Start motor').count() == 0
    assert not errors
