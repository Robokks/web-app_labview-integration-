/* Phone navigation for a read-only browser-generated mock dashboard. */
(() => {
  'use strict';
  const root=document.body;
  const library=document.querySelector('.library');
  const inspector=document.querySelector('.inspector');
  const canvas=document.getElementById('canvas');
  const catalog=document.getElementById('catalog');
  if(!root||!library||!inspector||!canvas||!catalog)return;
  const isMobile=()=>matchMedia('(max-width:840px)').matches;
  const classes=['mobile-panel-library','mobile-panel-properties','mobile-panel-more'];
  const nav=document.createElement('nav');nav.className='mobile-nav';nav.setAttribute('aria-label','Mobile workspace navigation');
  const actions=[['dashboard','▦','Dashboard'],['library','＋','Add'],['properties','⚙','Edit'],['preview','◉','Preview'],['more','⋯','More']];
  const buttons=new Map();
  for(const [id,glyph,label] of actions){const b=document.createElement('button');b.type='button';b.dataset.mobileNav=id;b.setAttribute('aria-label',label);b.setAttribute('aria-expanded','false');const icon=document.createElement('span');icon.className='nav-icon';icon.setAttribute('aria-hidden','true');icon.textContent=glyph;const title=document.createElement('span');title.textContent=label;b.append(icon,title);nav.append(b);buttons.set(id,b);}
  root.append(nav);
  const backdrop=document.createElement('button');backdrop.type='button';backdrop.className='mobile-sheet-backdrop';backdrop.setAttribute('aria-label','Close panel');root.append(backdrop);
  const closeHead=(el,title)=>{const h=document.createElement('div');h.className='mobile-sheet-head';const s=document.createElement('span');s.textContent=title;const close=document.createElement('button');close.type='button';close.setAttribute('aria-label','Close '+title);close.textContent='×';close.addEventListener('click',()=>show(null));h.append(s,close);el.prepend(h);};
  closeHead(library,'Add display widget');closeHead(inspector,'Widget properties');
  const more=document.createElement('div');more.className='mobile-more-menu';more.setAttribute('role','group');more.setAttribute('aria-label','More dashboard actions');
  const menuButton=(label,source)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{show(null);document.getElementById(source)?.click();});more.append(b);};
  menuButton('Export layout as JSON','export');menuButton('Reset to default dashboard','reset');
  const note=document.createElement('p');note.textContent='Public mock demo · No LabVIEW equipment connection · No device controls.';more.append(note);root.append(more);
  function show(panel){
    for(const c of classes)root.classList.remove(c);
    if(panel&&['library','properties','more'].includes(panel))root.classList.add('mobile-panel-'+panel);
    for(const [id,b] of buttons){const active=id===panel;b.classList.toggle('active',active);b.setAttribute('aria-expanded',String(active));}
    backdrop.setAttribute('aria-hidden',String(!panel));
  }
  for(const [id,b] of buttons)b.addEventListener('click',()=>{
    if(!isMobile())return;
    if(id==='preview'){show(null);document.getElementById('preview')?.click();const active=root.classList.contains('preview');b.lastElementChild.textContent=active?'Design':'Preview';b.classList.toggle('active',active);return;}
    if(id==='dashboard'){show(null);window.scrollTo({top:0,behavior:'smooth'});return;}
    const chosen=root.classList.contains('mobile-panel-'+id)?null:id;show(chosen);
    if(chosen==='library')document.getElementById('search')?.focus({preventScroll:true});
  });
  backdrop.addEventListener('click',()=>show(null));
  catalog.addEventListener('click',e=>{if(isMobile()&&e.target.closest('.catalog-item'))show('properties');});
  canvas.addEventListener('click',e=>{if(isMobile()&&!root.classList.contains('preview')&&e.target.closest('.widget'))show('properties');});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')show(null);});
  document.querySelectorAll('[data-layout]').forEach(b=>b.addEventListener('click',()=>{show(null);const hint=document.querySelector('.canvas-hint');if(hint&&isMobile())hint.textContent=b.dataset.layout==='free'?'Swipe sideways to navigate the HMI canvas. Select a widget to change X/Y in Edit.':'Tap a widget to edit it. Tap Add to insert another indicator.';}));
  const closeOnResize=()=>{if(!isMobile())show(null)};
  window.addEventListener('resize',closeOnResize);
  if(isMobile()){const hint=document.querySelector('.canvas-hint');if(hint)hint.textContent='Tap a widget to edit it. Use Add to insert indicators. All values are simulated.';}
})();
