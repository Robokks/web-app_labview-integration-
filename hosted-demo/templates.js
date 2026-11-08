/* Phase 1 read-only dashboard templates. Templates are layouts, never equipment commands. */
(() => {
  'use strict';
  const api = window.PanelForgeDesigner;
  const root = document.getElementById('template-modal-root');
  const opener = document.getElementById('templates-open');
  if (!api || !root || !opener) return;
  const key = 'panelforge-custom-templates-v1';
  const categories = ['All', 'Motor', 'Transmission', 'Steering', 'Dynamometer', 'General', 'My layouts'];
  const widget = (type, title, signal, w=4, h=2) => ({type, title, signal, w, h});
  const builtins = [
    {id:'motor-test', name:'Motor Test Rig', category:'Motor', icon:'◉', color:'blue',
      desc:'Speed, torque, power, current, motor health, operating profile and trends.',
      tags:['Motor condition','Performance','Trend'], layout:'grid', widgets:[
        widget('numeric','Motor speed','motor.speed',4),widget('numeric','Output torque','motor.torque',4),widget('numeric','Output power','motor.power',4),
        widget('trend','Speed profile','motor.speed',8,3),widget('motor','Motor condition','motor.speed',4,3),
        widget('gauge','Drive current','motor.current',4),widget('numeric','Motor temperature','motor.temperature',4),widget('led','Motor running','motor.running',4),
        widget('profile','Profile step','profile.step',8),widget('result','Test result','test.result',4)
      ]},
    {id:'transmission-test', name:'Transmission Test Rig', category:'Transmission', icon:'⚙', color:'teal',
      desc:'Input, LH, RH and PTO shaft monitoring with gear, sequence and test status.',
      tags:['4 shaft groups','Gear display','Multi-motor'],layout:'grid',widgets:[
        widget('numeric','Input shaft RPM','transmission.input.speed',3),widget('numeric','Input torque','transmission.input.torque',3),
        widget('numeric','LH shaft RPM','transmission.lh.speed',3),widget('numeric','LH torque','transmission.lh.torque',3),
        widget('numeric','RH shaft RPM','transmission.rh.speed',3),widget('numeric','RH torque','transmission.rh.torque',3),
        widget('numeric','PTO shaft RPM','transmission.pto.speed',3),widget('numeric','PTO torque','transmission.pto.torque',3),
        widget('trend','Input speed trend','transmission.input.speed',8,3),widget('gear','Gear position (demo)','gear.actual',4,3),
        widget('profile','Sequence profile','profile.step',8),widget('result','Rig test status','test.result',4)
      ]},
    {id:'steering-gear',name:'Steering Gear Rig',category:'Steering',icon:'⌁',color:'violet',
      desc:'Steering position, actuator load, pressure, speed, temperature and test traces.',
      tags:['Position','Hydraulics','Profile'],layout:'grid',widgets:[
        widget('numeric','Steering angle','steering.angle',4),widget('numeric','Actuator torque','steering.torque',4),widget('numeric','Hydraulic pressure','steering.pressure',4),
        widget('trend','Angle vs time','steering.angle',8,3),widget('numeric','Steering motor speed','steering.motor_speed',4,3),
        widget('numeric','Hydraulic oil flow','steering.oil_flow',4),widget('numeric','Oil temperature','steering.oil_temp',4),widget('numeric','Position error','steering.position_error',4),
        widget('profile','Running step','profile.step',8),widget('result','Rig health','test.result',4)
      ]},
    {id:'dynamometer',name:'Dynamometer Rig',category:'Dynamometer',icon:'◫',color:'orange',
      desc:'Dyno output, loading, load percentage, power, efficiency and operating trend.',
      tags:['Load','Performance','Efficiency'],layout:'grid',widgets:[
        widget('numeric','Dyno speed','dyno.speed',4),widget('numeric','Shaft torque','dyno.torque',4),widget('numeric','Output power','dyno.power',4),
        widget('trend','Torque trend','dyno.torque',8,3),widget('numeric','Applied load','dyno.load_percent',4,3),
        widget('numeric','Efficiency','dyno.efficiency',4),widget('numeric','Cooling temperature','dyno.cooling_temp',4),widget('led','Drive running','motor.running',4),
        widget('profile','Load sequence','profile.step',8),widget('result','Test evaluation','test.result',4)
      ]},
    {id:'general',name:'General Purpose Rig',category:'General',icon:'▦',color:'slate',
      desc:'Reusable read-only dashboard starter for custom rigs and LabVIEW signal bindings.',
      tags:['Editable','Standard widgets','Starter'],layout:'grid',widgets:[
        widget('numeric','Primary signal','motor.speed',4),widget('numeric','Secondary signal','motor.torque',4),widget('led','System status','motor.running',4),
        widget('trend','Signal trend','motor.speed',8,3),widget('numeric','Temperature','motor.temperature',4,3),
        widget('profile','Sequence information','profile.step',8),widget('result','Test status','test.result',4)
      ]}
  ];
  for (const t of builtins) t.widgets=t.widgets.map((w,i)=>({...w,id:`widget-${i+1}`,x:18+(i%3)*320,y:18+Math.floor(i/3)*188}));
  let saved=[];let filter='All';let selection=builtins[0].id;let returnFocus=null;
  const el=(tag,cls,content)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=content;return n;};
  function storageRead(){
    try{const raw=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(raw))return [];
      return raw.filter(x=>x&&typeof x.id==='string'&&/^custom-[a-z0-9-]{1,48}$/.test(x.id)
        &&typeof x.name==='string'&&x.name.length<=60&&['grid','free'].includes(x.layout)).slice(0,20)
        .filter(x=>Array.isArray(x.widgets)&&x.widgets.length>0&&x.widgets.length<=100&&Array.isArray(x.tags));
    }catch(_){return []}
  }
  function storageWrite(){localStorage.setItem(key,JSON.stringify(saved));}
  // Return only versioned layouts with data-only widget definitions. Normalize via the designer API when loading.
  saved=storageRead();
  root.innerHTML=`<div class="templates-backdrop" data-close></div>
    <section class="templates-panel" role="dialog" aria-modal="true" aria-labelledby="templates-title" tabindex="-1">
      <header class="templates-head"><div class="templates-head-icon" aria-hidden="true">▦</div><div class="templates-head-text"><span class="templates-kicker">PANELFORGE LIBRARY · PHASE 1 DISPLAY-ONLY</span><h2 id="templates-title">Test Rig Templates</h2><p>Start from a dashboard layout, then personalize every indicator and signal binding.</p></div>
      <button class="templates-close" type="button" aria-label="Close templates" data-close>×</button></header>
      <div class="templates-actions"><label class="templates-search"><span aria-hidden="true">⌕</span><input type="search" id="templates-search" placeholder="Search templates..." aria-label="Search test rig templates"></label>
      <button id="template-save-current" class="templates-save-button" type="button">＋ Save current as template</button></div>
      <div id="templates-categories" class="templates-categories" role="group" aria-label="Template categories"></div>
      <div class="templates-content"><div class="templates-collection" id="templates-collection" aria-label="Available templates"></div><aside class="templates-detail" id="templates-detail" aria-live="polite"></aside></div>
      <footer class="templates-footer"><span>All values are simulated · Templates cannot command test equipment</span><span id="templates-footer-count"></span></footer>
      <form id="template-save-form" class="template-save-form" hidden><div><label for="template-custom-name">Custom layout name</label><input id="template-custom-name" type="text" minlength="3" maxlength="60" required placeholder="e.g. My transmission dashboard"></div><p>Saved in this browser only. Export JSON separately for a portable copy.</p><div class="save-form-buttons"><button type="button" class="templates-cancel" id="template-cancel-save">Cancel</button><button type="submit" class="templates-save-button">Save layout</button></div><output id="template-form-message"></output></form>
    </section>`;
  const panel=root.querySelector('.templates-panel');
  const collection=root.querySelector('#templates-collection');
  const detail=root.querySelector('#templates-detail');
  const search=root.querySelector('#templates-search');
  const form=root.querySelector('#template-save-form');
  const message=root.querySelector('#template-form-message');
  function visibleTemplates(){const all=[...builtins,...saved.map(t=>({...t,custom:true,category:'My layouts',color:'teal',icon:'▤',desc:'Custom dashboard saved in this browser.',tags:['Saved locally','Editable']}))];
    const q=search.value.trim().toLowerCase();return all.filter(t=>(filter==='All'||filter===t.category)
     &&(!q||[t.name,t.category,t.desc,...t.tags].join(' ').toLowerCase().includes(q)));}
  function layoutMini(t,large=false){
    const box=el('div','template-mini'+(large?' large':''));box.setAttribute('aria-hidden','true');
    const header=el('div','mini-header');header.append(el('span'),el('span'),el('span'));box.append(header);
    const matrix=el('div','mini-matrix');
    const subset=t.widgets.slice(0,large?12:8);
    for(const w of subset){const cell=el('div','mini-tile '+(w.type==='trend'?'mini-wide ':'')+('mini-'+w.type));
      if(['trend','xy'].includes(w.type)){const line=el('div','mini-line');cell.append(line);}else if(w.type==='gear'){cell.textContent='H';}else if(w.type==='numeric'){cell.append(el('span','mini-bar'),el('span','mini-bar short'));}else if(w.type==='led'){cell.append(el('span','mini-led'));}else if(w.type==='motor'){cell.append(el('span','mini-motor'));}else{cell.append(el('span','mini-bar short'))};matrix.append(cell);
    }box.append(matrix);return box;
  }
  function renderCategories(){const holder=root.querySelector('#templates-categories');holder.replaceChildren();
    for(const c of categories){const b=el('button',c===filter?'is-current':'',c==='All'?'All rigs':c);b.type='button';b.setAttribute('aria-pressed',String(c===filter));b.addEventListener('click',()=>{filter=c;render();});holder.append(b);}}
  function render(){renderCategories();const templates=visibleTemplates();collection.replaceChildren();
    if(!templates.find(t=>t.id===selection))selection=templates[0]?.id??'';
    for(const t of templates){const card=el('button','template-card'+(selection===t.id?' selected':''));card.type='button';card.dataset.templateId=t.id;card.setAttribute('aria-pressed',String(selection===t.id));
      const thumb=el('div','template-thumb tone-'+t.color);thumb.append(layoutMini(t));
      const info=el('div','template-card-info');const cat=el('div','template-card-category',t.category);const title=el('strong','',t.name);const foot=el('span','',`${t.widgets.length} indicators · ${t.layout==='grid'?'Smart grid':'HMI canvas'}`);info.append(cat,title,foot);
      card.append(thumb,info);card.addEventListener('click',()=>{selection=t.id;render();if(matchMedia('(max-width:840px)').matches)detail.scrollIntoView({block:'nearest',behavior:'smooth'});});collection.append(card);}
    if(!templates.length){const empty=el('p','templates-empty','No matching templates. Try another category or search.');collection.append(empty);}
    root.querySelector('#templates-footer-count').textContent=`${templates.length} shown · ${saved.length} saved locally`;
    renderDetail(templates.find(t=>t.id===selection)||null);
  }
  function renderDetail(t){detail.replaceChildren();if(!t){detail.append(el('p','templates-empty','Choose a template to preview.'));return;}
    const over=el('div','template-detail-overline',t.custom?'MY SAVED LAYOUT':'STANDARD TEST RIG TEMPLATE');
    const title=el('h3','',t.name);const desc=el('p','template-description',t.desc);
    const preview=el('div','template-detail-preview tone-'+t.color);preview.append(layoutMini(t,true));
    const meta=el('div','template-detail-meta');for(const tag of t.tags)meta.append(el('span','',tag));
    const label=el('div','detail-heading','INCLUDED DISPLAY WIDGETS');const list=el('ul','templates-widget-list');
    for(const w of t.widgets){const li=el('li','',w.title);li.title=w.signal||'Not bound';list.append(li);}
    const bottom=el('div','templates-detail-actions');const load=el('button','template-load-button','Use this template');load.type='button';load.id='template-load';
    load.addEventListener('click',()=>{
      const current=api.getLayout();if(current.dirty&&!window.confirm('Replace the unsaved dashboard with this template? Save your layout first if needed.'))return;
      const loaded=api.loadLayout({layout:t.layout,title:t.name,widgets:t.widgets});
      if(!loaded){alertStatus('This template failed validation. No dashboard changes were made.');return;}
      close();
    });bottom.append(load);
    if(t.custom){const remove=el('button','template-delete-button','Delete saved layout');remove.type='button';remove.addEventListener('click',()=>{
      if(!window.confirm('Delete this locally saved template? This cannot be undone.'))return;
      saved=saved.filter(x=>x.id!==t.id);try{storageWrite();}catch(_){alertStatus('Browser storage unavailable. Could not delete.');return;}
      selection='';render();
    });bottom.append(remove)}
    const note=el('p','template-detail-note','Display-only. Signal values in the public demo are synthetic and not verified against a physical test rig.');
    detail.append(over,title,desc,preview,meta,label,list,bottom,note);
  }
  function alertStatus(value){message.textContent=value;message.classList.add('is-error');}
  function open(){returnFocus=document.activeElement;root.classList.add('open');document.body.classList.add('templates-modal-active');render();panel.focus();}
  function close(){root.classList.remove('open');document.body.classList.remove('templates-modal-active');form.hidden=true;message.textContent='';returnFocus?.focus?.();}
  opener.addEventListener('click',open);
  root.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(!root.classList.contains('open'))return;
    if(e.key==='Escape'){e.preventDefault();close();}
    if(e.key==='Tab'){
      const all=Array.from(root.querySelectorAll('button:not([disabled]),input:not([disabled])')).filter(x=>x.getClientRects().length);
      if(!all.length)return;const first=all[0],last=all[all.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  search.addEventListener('input',render);
  root.querySelector('#template-save-current').addEventListener('click',()=>{
    if(saved.length>=20){alertStatus('Maximum 20 custom layouts saved in this browser. Delete one to continue.');return;}
    form.hidden=false;message.textContent='';root.querySelector('#template-custom-name').value=api.getLayout().title.slice(0,60);
    root.querySelector('#template-custom-name').focus();
  });
  root.querySelector('#template-cancel-save').addEventListener('click',()=>{form.hidden=true;message.textContent='';});
  form.addEventListener('submit',e=>{
    e.preventDefault();const name=root.querySelector('#template-custom-name').value.trim();
    if(name.length<3||name.length>60){alertStatus('Enter a name between 3 and 60 characters.');return;}
    if(saved.length>=20){alertStatus('Maximum 20 saved layouts reached.');return;}
    const current=api.getLayout();const id='custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
    const record={id,name,category:'My layouts',layout:current.layout,widgets:current.widgets,
      title:name,desc:'Custom dashboard saved in this browser.',tags:['Saved locally','Editable']};
    saved.unshift(record);
    try{storageWrite()}catch(_){saved.shift();alertStatus('Browser storage is unavailable or full. Export your dashboard JSON instead.');return;}
    form.hidden=true;message.textContent='';filter='My layouts';search.value='';selection=id;render();
  });
  // For mobile navigation, the button is provided by the existing panel navigation layer.
  window.PanelForgeTemplateLibrary=Object.freeze({open,close,count:()=>builtins.length});
})();
