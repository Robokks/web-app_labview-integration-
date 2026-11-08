/* Accessible template chooser. Layouts are local project data only, no equipment control. */
(() => {
  'use strict';
  const button=document.getElementById('template-picker');
  const templates=window.PanelForgeTemplates;
  const api=window.PanelForgeTemplateAPI;
  if(!button||!templates||!api)return;
  const overlay=document.createElement('div');overlay.className='template-overlay';overlay.hidden=true;
  overlay.innerHTML=`<section class="template-dialog" role="dialog" aria-modal="true" aria-labelledby="template-dialog-title" tabindex="-1">
    <header class="template-dialog-header"><div><div class="template-eyebrow">PROJECT TEMPLATES · MOCK DATA</div><h2 id="template-dialog-title">Choose a test rig layout</h2><p>Select a starting dashboard. Every widget remains editable and display-only.</p></div><button type="button" class="template-close" aria-label="Close templates">×</button></header>
    <div class="template-gallery" id="template-gallery"></div>
    <footer class="template-footer"><span>These are visual examples, not verified rig or TCU configurations.</span><button class="btn outline template-cancel" type="button">Cancel</button></footer>
  </section>`;
  document.body.append(overlay);
  const gallery=overlay.querySelector('#template-gallery');
  for(const t of templates){
    const card=document.createElement('button');card.type='button';card.className='template-card';card.dataset.template=t.id;
    const mark=document.createElement('span');mark.className='template-card-icon';mark.textContent=t.icon;mark.style.setProperty('--accent',t.accent);
    const body=document.createElement('span');body.className='template-card-content';
    const title=document.createElement('strong');title.textContent=t.title;
    const description=document.createElement('span');description.textContent=t.description;
    const features=document.createElement('small');features.textContent=t.summary;
    body.append(title,description,features);
    const end=document.createElement('span');end.className='template-card-arrow';end.textContent='→';
    card.append(mark,body,end);
    card.addEventListener('click',()=>{if(api.apply(t.id))close();});gallery.append(card);
  }
  let formerFocus=null;
  function open(){formerFocus=document.activeElement;overlay.hidden=false;document.body.classList.add('templates-open');setCurrent();overlay.querySelector('.template-close').focus();}
  function close(){overlay.hidden=true;document.body.classList.remove('templates-open');formerFocus?.focus?.();}
  function setCurrent(){gallery.querySelectorAll('.template-card').forEach(card=>{
    const active=card.dataset.template===api.current();card.classList.toggle('current',active);
    if(active)card.setAttribute('aria-current','true');else card.removeAttribute('aria-current');
  });}
  button.addEventListener('click',()=>{if(overlay.hidden)open();else close();});
  overlay.querySelector('.template-close').addEventListener('click',close);
  overlay.querySelector('.template-cancel').addEventListener('click',close);
  overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
  document.addEventListener('keydown',e=>{
    if(overlay.hidden)return;
    if(e.key==='Escape'){e.stopImmediatePropagation();e.preventDefault();close();return;}
    if(e.key==='Tab'){
      const focusable=[...overlay.querySelectorAll('button:not(:disabled)')];
      const first=focusable[0],last=focusable.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  },true);
})();
