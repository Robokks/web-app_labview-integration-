/* Phase 1 Rig Template Library: display-only example dashboards, no equipment commands. */
(() => {
  'use strict';
  const LAYOUT_KEY='panelforge-layout-v1';
  const CUSTOM_KEY='panelforge-custom-templates-v1';
  const ACTIVE_KEY='panelforge-active-template-v1';
  const maxCustom=12;
  const mk=(type,title,signal,w=4,h=2)=>({type,title,signal,w,h});
  const fixtures=[
    {id:'motor',name:'Motor Test Rig',description:'Motor performance, power, current, test status and live speed trends.',icon:'⚙',color:'#126ad2',category:'Drivetrain',layout:'grid', widgets:[
      mk('numeric','Motor Speed','motor.speed'),mk('numeric','Output Torque','motor.torque'),mk('numeric','Output Power','motor.power'),
      mk('gauge','Motor Current','motor.current'),mk('numeric','Winding Temperature','motor.temperature'),mk('led','Motor Running','motor.running'),
      mk('trend','Speed Trend','motor.speed',8,3),mk('profile','Test Profile','profile.step'),mk('result','Test Result','test.result')]},
    {id:'transmission',name:'Transmission Test Rig',description:'Input, LH and RH speed/torque, gear position and oil monitoring.',icon:'⇄',color:'#087c94',category:'Drivetrain',layout:'grid', widgets:[
      mk('numeric','Input Shaft Speed','transmission.input_speed'),mk('numeric','LH Shaft Speed','transmission.lh_speed'),mk('numeric','RH Shaft Speed','transmission.rh_speed'),
      mk('numeric','Input Torque','transmission.input_torque'),mk('numeric','LH Torque','transmission.lh_torque'),mk('numeric','RH Torque','transmission.rh_torque'),
      mk('gear','Gear Position (Demo)','gear.actual'),mk('numeric','Oil Pressure','transmission.oil_pressure'),mk('numeric','Oil Temperature','transmission.oil_temperature'),
      mk('trend','Input Speed Trend','transmission.input_speed',8,3),mk('result','Test Result','test.result')]},
    {id:'steering',name:'Steering Gear Test Rig',description:'Steering angle, load torque, hydraulic pressure and response trends.',icon:'◴',color:'#6d55b8',category:'Actuation',layout:'grid', widgets:[
      mk('numeric','Steering Angle','steering.angle'),mk('numeric','Steering Torque','steering.torque'),mk('numeric','Hydraulic Pressure','steering.pressure'),
      mk('numeric','Oil Temperature','steering.temperature'),mk('numeric','Steering Response','steering.response'),mk('profile','Test Step','profile.step'),
      mk('trend','Steering Angle Trend','steering.angle',8,3),mk('numeric','Motor Speed','motor.speed'),mk('result','Test Result','test.result')]},
    {id:'dynamometer',name:'Dynamometer Test Rig',description:'Speed and torque indicators, measured power, load and test curves.',icon:'◉',color:'#b65b13',category:'Powertrain',layout:'grid', widgets:[
      mk('numeric','Dyno Speed','dyno.speed'),mk('numeric','Dyno Torque','dyno.torque'),mk('numeric','Dyno Power','dyno.power'),
      mk('numeric','Applied Load','dyno.load'),mk('numeric','Dyno Temperature','dyno.temperature'),mk('led','Motor Running','motor.running'),
      mk('trend','Torque Trend','dyno.torque',8,3),mk('profile','Running Profile','profile.step'),mk('result','Test Result','test.result')]},
    {id:'general',name:'General Purpose HMI',description:'A flexible starter layout with measurements, status and a live graph.',icon:'▦',color:'#277c55',category:'Universal',layout:'grid', widgets:[
      mk('numeric','Speed','motor.speed'),mk('numeric','Temperature','motor.temperature'),mk('numeric','Pressure','transmission.oil_pressure'),
      mk('numeric','Power','motor.power'),mk('led','System Status','motor.running'),mk('result','Test Result','test.result'),
      mk('trend','Live Value Trend','motor.speed',8,3),mk('profile','Process Step','profile.step')]}
  ];
  const $=id=>document.getElementById(id);
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function readCustom(){try{const data=JSON.parse(localStorage.getItem(CUSTOM_KEY)||'[]');return Array.isArray(data)?data.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string'&&Array.isArray(x.widgets)&&x.widgets.length<=100).slice(0,maxCustom):[]}catch{return []}}
  function writeCustom(data){try{localStorage.setItem(CUSTOM_KEY,JSON.stringify(data));return true}catch{alert('Browser storage unavailable. Export the layout as JSON instead.');return false}}
  function readSaved(){try{const d=JSON.parse(localStorage.getItem(LAYOUT_KEY)||'null');return d&&d.schema_version===1&&Array.isArray(d.widgets)?d:null}catch{return null}}
  function normalizeWidgets(list){return list.map((w,i)=>({...w,id:'widget-'+(i+1),x:18+(i%3)*320,y:18+Math.floor(i/3)*210}));}
  function allTemplates(){return [...fixtures,...readCustom().map(x=>({...x,custom:true,icon:'◇',color:'#56657b',category:'My templates',description:'Your saved browser-local design.'}))];}
  function selectId(){let id=null;try{id=localStorage.getItem(ACTIVE_KEY)}catch{}return allTemplates().some(t=>t.id===id)?id:'motor'}
  let selected=selectId(),isOpen=false;
  const stage=document.querySelector('.stage-actions');
  const btn=document.createElement('button');btn.id='open-templates';btn.className='btn template-trigger';btn.type='button';btn.textContent='▦  Rig templates';
  btn.setAttribute('aria-label','Open test rig template library');stage?.prepend(btn);
  const mobileMore=document.querySelector('.mobile-more-menu');
  if(mobileMore){const moreBtn=document.createElement('button');moreBtn.type='button';moreBtn.textContent='▦  Choose test rig template';moreBtn.addEventListener('click',()=>{document.body.classList.remove('mobile-panel-more');openDialog()});mobileMore.prepend(moreBtn)}
  const dlg=document.createElement('dialog');dlg.id='rig-template-dialog';dlg.className='rig-template-dialog';dlg.setAttribute('aria-label','Test Rig Template Library');
  dlg.innerHTML=`
    <div class="tpl-head"><div><span class="tpl-eyebrow">PANELFORGE · TEMPLATE LIBRARY</span><h2>Choose a test rig layout</h2><p>Ready-to-edit dashboards based on industrial test-rig patterns. Mock signals only.</p></div><button class="tpl-close" type="button" aria-label="Close templates">×</button></div>
    <div class="tpl-body"><div class="tpl-browser"><div class="tpl-list-head"><strong>Starter templates</strong><span id="tpl-total"></span></div><div id="tpl-list" class="tpl-list"></div></div><section class="tpl-preview" aria-label="Selected template preview"><div id="tpl-info"></div><div id="tpl-mini" class="tpl-mini"></div><div id="tpl-fields" class="tpl-fields"></div></section></div>
    <footer class="tpl-footer"><div class="tpl-save"><label for="tpl-custom-name">Save current layout as template</label><div class="tpl-save-row"><input id="tpl-custom-name" type="text" maxlength="48" placeholder="My test rig layout"><button id="tpl-save-custom" type="button">Save a copy</button></div></div><button id="tpl-load" class="tpl-load" type="button">Load selected template</button></footer>
    <p class="tpl-caution">Read-only simulation · Loading replaces the current canvas. Save or export your existing layout first.</p>`;
  document.body.append(dlg);
  const palette=['#e6f3ff','#ecf7ee','#fff4e9','#f0effe'];
  function drawList(){
    const list=$('tpl-list');list.replaceChildren();const templates=allTemplates();$('tpl-total').textContent=`${fixtures.length} built-in · ${templates.length-fixtures.length} saved`;
    for(const t of templates){
      const card=document.createElement('button');card.type='button';card.className='tpl-card'+(selected===t.id?' is-active':'');card.dataset.templateId=t.id;
      card.setAttribute('aria-pressed',String(selected===t.id));
      const ico=document.createElement('span');ico.className='tpl-icon';ico.textContent=t.icon;ico.style.background=t.color;
      const info=document.createElement('span');info.className='tpl-card-content';
      info.innerHTML=`<strong>${esc(t.name)}</strong><small>${esc(t.category)} · ${t.widgets.length} widgets</small>`;
      const next=document.createElement('span');next.className='tpl-card-next';next.textContent='›';
      card.append(ico,info,next);card.addEventListener('click',()=>{selected=t.id;drawList();drawPreview()});list.append(card);
    }
  }
  function drawPreview(){
    const t=allTemplates().find(x=>x.id===selected)||fixtures[0];
    $('tpl-info').innerHTML=`<div class="tpl-preview-heading"><span class="tpl-preview-icon" style="background:${t.color}">${esc(t.icon)}</span><div><span class="tpl-eyebrow">${esc(t.custom?'MY SAVED LAYOUT':'BUILT-IN TEMPLATE')} · ${esc(t.category)}</span><h3>${esc(t.name)}</h3><p>${esc(t.description)}</p></div></div>`;
    const mini=$('tpl-mini');mini.replaceChildren();
    for(const [i,w] of t.widgets.slice(0,15).entries()){
      const cell=document.createElement('div');cell.className='tpl-mini-cell';cell.style.gridColumn='span '+Math.min(12,Math.max(2,w.w||4));
      cell.style.background=palette[i%palette.length];
      const sym=document.createElement('span');sym.textContent=w.type==='trend'?'⌁':w.type==='gear'?'H':w.type==='led'?'●':w.type==='profile'?'▰':w.type==='result'?'✓':'▤';
      const label=document.createElement('small');label.textContent=w.title;cell.append(sym,label);mini.append(cell);
    }
    const fields=$('tpl-fields');fields.replaceChildren();
    const title=document.createElement('strong');title.textContent=`Included indicators (${t.widgets.length})`;fields.append(title);
    const list=document.createElement('div');list.className='tpl-field-pills';
    for(const w of t.widgets){const span=document.createElement('span');span.textContent=w.title;list.append(span)}fields.append(list);
    let existing=$('tpl-delete-custom');if(existing)existing.remove();
    if(t.custom){const del=document.createElement('button');del.id='tpl-delete-custom';del.type='button';del.className='tpl-delete';del.textContent='Delete saved template';del.addEventListener('click',()=>{
      if(!confirm(`Delete your saved template "${t.name}"?`))return;
      const v=readCustom().filter(x=>x.id!==t.id);if(writeCustom(v)){selected='motor';drawList();drawPreview();}
    });fields.append(del)}
  }
  function openDialog(){selected=selectId();drawList();drawPreview();isOpen=true;dlg.showModal()}
  btn.addEventListener('click',openDialog);dlg.querySelector('.tpl-close').addEventListener('click',()=>dlg.close());
  dlg.addEventListener('close',()=>{isOpen=false});dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
  $('tpl-load').addEventListener('click',()=>{
    const t=allTemplates().find(x=>x.id===selected);if(!t)return;
    if(!confirm(`Load "${t.name}"? This replaces your current dashboard canvas. Save your current design as a custom template first if you want to keep it.`))return;
    const items=normalizeWidgets(t.widgets);
    const snapshot={schema_version:1,layout:t.layout==='free'?'free':'grid',widgets:items};
    try{localStorage.setItem(LAYOUT_KEY,JSON.stringify(snapshot));localStorage.setItem(ACTIVE_KEY,t.id)}catch{alert('Browser storage is unavailable. Cannot load the template.');return}
    location.reload();
  });
  $('tpl-save-custom').addEventListener('click',()=>{
    const name=$('tpl-custom-name').value.trim().replace(/\s+/g,' ');
    if(!name||name.length>48){alert('Enter a template name (1–48 characters).');$('tpl-custom-name').focus();return}
    const existing=readCustom();if(existing.length>=maxCustom){alert(`You can save up to ${maxCustom} custom templates. Delete one before saving another.`);return}
    // The editor's existing save path is the single source of truth for the current layout.
    $('publish')?.click();const saved=readSaved();if(!saved){alert('Save the current layout before creating a template.');return}
    const id='custom-'+Date.now()+'-'+Math.floor(Math.random()*100000);
    const item={id,name,description:'Your saved browser-local design.',layout:saved.layout,widgets:saved.widgets.map(({id:ignored,...rest})=>rest),createdAt:new Date().toISOString()};
    if(!writeCustom([...existing,item]))return;
    $('tpl-custom-name').value='';selected=id;drawList();drawPreview();
    $('tpl-total').textContent=`${fixtures.length} built-in · ${readCustom().length} saved`;
  });
  function syncTitle(){const active=selectId();const tpl=allTemplates().find(t=>t.id===active);if(!tpl)return;
    const heading=document.querySelector('.page-details h1');if(heading){heading.textContent=tpl.name;const dot=document.createElement('span');dot.className='subtle-dot';dot.textContent='●';heading.append(' ',dot)}
    const desc=document.querySelector('.page-details p');if(desc)desc.textContent=tpl.description;
    const bread=document.querySelector('.breadcrumb');if(bread)bread.textContent='Workspace / '+tpl.name+' / Main dashboard';
  }
  syncTitle();
})();
