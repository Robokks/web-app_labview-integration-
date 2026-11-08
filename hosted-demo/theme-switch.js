/* UI appearance only. Theme control never writes to equipment. */
(() => {
  'use strict';
  const key='panelforge-display-theme-v1';
  const root=document.documentElement;
  let saved=null;
  try {saved=localStorage.getItem(key);} catch (_) {}
  root.dataset.theme=saved==='dark'?'dark':'light';
  function toggle() {
    const next=root.dataset.theme==='light'?'dark':'light';
    root.dataset.theme=next;
    try {localStorage.setItem(key,next);} catch (_) {}
    refresh();
    window.dispatchEvent(new Event('resize'));
  }
  const topbar=document.querySelector('.topactions');
  let btn;
  if (topbar) {
    btn=document.createElement('button');
    btn.id='theme-switch';btn.className='btn ghost';btn.type='button';
    btn.setAttribute('aria-label','Toggle light and dark appearance');
    btn.addEventListener('click',toggle);
    topbar.insertBefore(btn,topbar.firstChild);
  }
  const more=document.querySelector('.mobile-more-menu');
  let mobileBtn;
  if (more) {
    mobileBtn=document.createElement('button');mobileBtn.type='button';
    mobileBtn.setAttribute('aria-label','Toggle light and dark theme');
    mobileBtn.addEventListener('click',toggle);
    more.insertBefore(mobileBtn,more.firstChild);
  }
  function refresh(){
    const light=root.dataset.theme==='light';
    if(btn)btn.textContent=light?'☾  Dark':'☀  Light';
    if(mobileBtn)mobileBtn.textContent=light?'☾  Switch to dark appearance':'☀  Switch to light appearance';
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.content=light?'#173d63':'#0b1221';
  }
  refresh();
})();
