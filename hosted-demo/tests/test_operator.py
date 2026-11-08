"""In-memory Chromium checks for the public display-only operator screen."""
from pathlib import Path
import shutil

import pytest
from playwright.sync_api import sync_playwright

SITE = Path(__file__).resolve().parents[1]
if not (SITE / "operator.html").is_file():
    SITE = SITE / "site"


def inline_operator():
    html = (SITE / "operator.html").read_text(encoding="utf-8")
    html = html.replace('<link rel="stylesheet" href="/operator.css">', "<style>" + (SITE / "operator.css").read_text(encoding="utf-8") + "</style>")
    mock = (SITE / "demo-mock.js").read_text(encoding="utf-8").replace(" || u.host !== location.host", "")
    operator = (SITE / "operator.js").read_text(encoding="utf-8").replace("`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`", "'ws://preview.test/ws'")
    html = html.replace('<script src="/demo-mock.js" defer></script>', "").replace('<script src="/operator.js" defer></script>', "")
    return html.replace("</body>", "<script>" + mock + "</script><script>" + operator + "</script></body>")


@pytest.mark.parametrize('width,height', [(1440, 900), (768, 1000), (390, 844)])
def test_operator_is_display_only(width, height):
    with sync_playwright() as p:
        browser_path = shutil.which("chromium") or shutil.which("google-chrome")
        browser = p.chromium.launch(executable_path=browser_path, headless=True, args=["--no-sandbox"])
        try:
            page = browser.new_page(viewport={"width": width, "height": height})
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.set_content(inline_operator())
            page.wait_for_function("document.querySelector('#connection-text')?.textContent === 'MOCK LIVE'")
            page.wait_for_function("document.querySelector('.metric-value')?.textContent !== '—'")
            observed = page.evaluate("""() => ({
              title:document.querySelector('#rig-title')?.textContent,
              controls:document.querySelectorAll('button,input,select,textarea,[contenteditable=true]').length,
              editor:!!document.querySelector('.topbar,.library,.inspector,.mobile-nav,.templates-modal'),
              value:document.querySelector('.metric-value')?.textContent,
              actualWidth:document.body.scrollWidth,
              viewport:innerWidth,
              source:document.querySelector('#operator-status-message')?.textContent
            })""")
            assert 'DYNAMOMETER TEST RIG' in observed['title']
            assert observed['controls'] == 0 and not observed['editor']
            assert observed['value'] not in ('', '—')
            assert observed['actualWidth'] <= observed['viewport']
            assert 'mock signals' in observed['source'].lower()
            assert errors == []
        finally:
            browser.close()
