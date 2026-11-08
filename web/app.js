/* PanelForge Phase 1: local read-only prototype. No equipment command transport. */
(() => {
  'use strict';
  const TYPES = Object.freeze({
    numeric: {label:'Digital value', icon:'123', signal:'motor.speed', w:4, h:2},
    gauge:   {label:'Radial gauge', icon:'◉', signal:'motor.current', w:4, h:2},
    led:     {label:'Status LED', icon:'●', signal:'motor.running', w:4, h:2},
    trend:   {label:'Trend chart', icon:'⌁', signal:'motor.speed', w:8, h:3},
    motor:   {label:'Motor monitor', icon:'⚙', signal:'motor.speed', w:4, h:3},
    gear:    {label:'Gear indicator', icon:'H', signal:'gear.actual', w:4, h:2},
    profile: {label:'Profile status', icon:'▥', signal:'profile.step', w:4, h:2},
    result:  {label:'Test result', icon:'✓', signal:'test.result', w:4, h:2},
    xy:      {label:'XY plot', icon:'⌗', signal:'motor.speed', w:8, h:3},
    spectrum:{label:'FFT spectrum', icon:'▥', signal:'', w:4, h:2},
  });
  const DEFAULT = [
    ['numeric','Motor speed','motor.speed',4,2,18,18],
    ['numeric','Output torque','motor.torque',4,2,338,18],
    ['numeric','Output power','motor.power',4,2,658,18],
    ['trend','Live speed trend','motor.speed',8,3,18,206],
    ['motor','Drive unit','motor.speed',4,3,658,206],
    ['gear','Gear position','gear.actual',4,2,18,490],
    ['profile','Sequence profile','profile.step',4,2,338,490],
    ['result','Test status','test.result',4,2,658,490],
  ];
  const byId = id => document.getElementById(id);
  const canvas = byId('canvas');
  const catalog = byId('catalog');
  const inspector = byId('inspector-content');
  const state = {layout:'grid', preview:false, selected:null, widgets:[], signals:new Map(), history:[], connected:false, dirty:false, nextId:1, seq:-1};
  const text = x => String(x === undefined || x === null ? '—' : x);
  const escape = x => text(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const get = key => state.signals.get(key);
  const val = key => get(key)?.value;
  const quality = key => state.connected ? (get(key)?.quality ?? 'Disconnected') : 'Disconnected';
  const fixed = (x, digits=1) => typeof x === 'number' && Number.isFinite(x) ? x.toLocaleString('en-US',{minimumFractionDigits:digits,maximumFractionDigits:digits}) : '—';
  const normalize = (raw, i) => {
    if (!raw || !Object.hasOwn(TYPES, raw.type)) return null;
    const base=TYPES[raw.type];
    return {id:typeof raw.id==='string'&&/^[\w-]{1,40}$/.test(raw.id)?raw.id:`widget-${i+1}`,type:raw.type,
      title:typeof raw.title==='string'?raw.title.slice(0,55):base.label,
      signal:typeof raw.signal==='string'&&raw.signal.length<90?raw.signal:base.signal,
      w:clamp(Number(raw.w)||base.w,2,12),h:clamp(Number(raw.h)||base.h,2,6),
      x:clamp(Number(raw.x)||0,0,900),y:clamp(Number(raw.y)||0,0,700)};
  };
  function defaults(){return DEFAULT.map((r,i)=>normalize({id:`widget-${i+1}`,type:r[0],title:r[1],signal:r[2],w:r[3],h:r[4],x:r[5],y:r[6]},i));}
  function load(){
    try {
      const v=JSON.parse(localStorage.getItem('panelforge-layout-v1')||'null');
      if(v?.schema_version===1 && ['grid','free'].includes(v.layout) && Array.isArray(v.widgets) && v.widgets.length<=100){
        const w=v.widgets.map(normalize).filter(Boolean);const ids=new Set(w.map(x=>x.id));
        if(w.length&&ids.size===w.length){state.layout=v.layout;state.widgets=w;return;}
      }
    }catch(_){/* corrupt settings safely fall back */}
    state.widgets=defaults();
  }
  function markDirty(){state.dirty=true;byId('saved-dot').classList.remove('saved');byId('save-text').textContent='Unsaved changes';}
  function markSaved(){state.dirty=false;byId('saved-dot').classList.add('saved');byId('save-text').textContent='Layout saved locally';}
  let toastTimer;
  function toast(s){byId('toast').textContent=s;byId('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>byId('toast').classList.remove('visible'),2600);}
  function save(){
    const data={schema_version:1,layout:state.layout,widgets:state.widgets};
    try{localStorage.setItem('panelforge-layout-v1',JSON.stringify(data));markSaved();toast('Layout saved in this browser');}
    catch(_){toast('Could not save: browser storage unavailable');}
  }
  function exportProject(){
    const body=JSON.stringify({schema_version:1,mode:'PHASE_1_READ_ONLY',layout:state.layout,widgets:state.widgets},null,2);
    const url=URL.createObjectURL(new Blob([body],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='motor-test-dashboard.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
    toast('Project JSON exported');
  }
  function newWidget(type,x=20,y=20){
    const p=TYPES[type];if(!p||state.preview)return;
    let id;do{id=`widget-${state.nextId++}`;}while(state.widgets.some(w=>w.id===id));
    const widget=normalize({id,type,title:p.label,signal:p.signal,w:p.w,h:p.h,x,y},state.widgets.length);
    state.widgets.push(widget);state.selected=id;markDirty();render();toast(`${p.label} added`);
  }
  function renderCatalog(){
    const query=byId('search').value.trim().toLowerCase();catalog.replaceChildren();
    for(const [id,p] of Object.entries(TYPES)){
      if(query&&!p.label.toLowerCase().includes(query))continue;
      const b=document.createElement('button');b.type='button';b.className='catalog-item';b.draggable=true;
      b.title='Click to add or drag to canvas';b.setAttribute('aria-label',`Add ${p.label}`);
      const symbol=document.createElement('span');symbol.className='catalog-symbol';symbol.textContent=p.icon;
      const name=document.createElement('span');name.textContent=p.label;b.append(symbol,name);
      b.addEventListener('click',()=>newWidget(id,30,30));
      b.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',`new:${id}`);e.dataTransfer.effectAllowed='copy';});
      catalog.append(b);
    }
  }
  function setLayout(layout){if(!['grid','free'].includes(layout)||state.layout===layout)return;state.layout=layout;markDirty();render();}
  function render(){
    canvas.replaceChildren();canvas.className=`canvas ${state.layout}-layout`;
    document.querySelectorAll('[data-layout]').forEach(b=>{const active=b.dataset.layout===state.layout;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    state.widgets.forEach(w=>{
      const el=document.createElement('article');el.className='widget';el.dataset.id=w.id;el.tabIndex=0;el.setAttribute('aria-label',`${w.title} widget`);
      if(w.id===state.selected)el.classList.add('selected');
      if(state.layout==='grid'){el.style.gridColumn=`span ${w.w}`;el.style.gridRow=`span ${w.h}`;el.draggable=!state.preview;}
      else{Object.assign(el.style,{position:'absolute',left:`${w.x}px`,top:`${w.y}px`,width:`${Math.max(120,w.w*76)}px`,height:`${w.h*92}px`});}
      const top=document.createElement('div');top.className='widget-top';
      const title=document.createElement('span');title.className='widget-title';title.textContent=w.title;
      const icon=document.createElement('span');icon.className='widget-icon';icon.textContent=TYPES[w.type].icon;
      top.append(title,icon);
      const main=document.createElement('div');main.className='widget-main';
      const foot=document.createElement('div');foot.className='widget-footer';
      const grip=document.createElement('span');grip.className='widget-grip';grip.setAttribute('aria-hidden','true');grip.textContent='◢';
      el.append(top,main,foot,grip);
      el.addEventListener('click',()=>selectWidget(w.id));
      el.addEventListener('keydown',e=>{if(e.key==='Enter')selectWidget(w.id);});
      el.addEventListener('dragstart',e=>{if(state.preview)return e.preventDefault();e.dataTransfer.setData('text/plain',`move:${w.id}`);e.dataTransfer.effectAllowed='move';});
      if(state.layout==='free')attachDrag(el,w);
      canvas.append(el);
      updateWidget(el,w);
    });
    byId('canvas-count').textContent=`${state.widgets.length} components`;
    renderInspector();
  }
  function selectWidget(id){if(state.preview)return;state.selected=id;document.querySelectorAll('.widget').forEach(el=>el.classList.toggle('selected',el.dataset.id===id));renderInspector();document.querySelector('.inspector')?.classList.add('open');}
  function attachDrag(el,w){
    let origin=null;
    el.addEventListener('pointerdown',e=>{
      if(state.preview||e.button!==0)return;
      origin={px:e.clientX,py:e.clientY,x:w.x,y:w.y};el.setPointerCapture(e.pointerId);selectWidget(w.id);
    });
    el.addEventListener('pointermove',e=>{
      if(!origin||state.preview)return;
      const dx=e.clientX-origin.px,dy=e.clientY-origin.py;
      w.x=clamp(Math.round((origin.x+dx)/10)*10,0,Math.max(0,canvas.clientWidth-el.offsetWidth-8));
      w.y=clamp(Math.round((origin.y+dy)/10)*10,0,Math.max(0,canvas.clientHeight-el.offsetHeight-8));
      el.style.left=`${w.x}px`;el.style.top=`${w.y}px`;
    });
    el.addEventListener('pointerup',()=>{if(origin){if(w.x!==origin.x||w.y!==origin.y){markDirty();renderInspector();}origin=null;}});
    el.addEventListener('pointercancel',()=>{origin=null;});
  }
  function readout(w){
    const s=get(w.signal),v=s?.value;
    const status=quality(w.signal);
    const unit=s?.unit||'';
    return {s,v,status,unit};
  }
  function updateWidget(el,w){
    const main=el.querySelector('.widget-main'),foot=el.querySelector('.widget-footer');if(!main||!foot)return;
    const r=readout(w);let html='';
    if(w.type==='numeric')html=`<div class="widget-reading">${escape(typeof r.v==='number'?fixed(r.v,w.signal==='motor.power'?2:1):r.v)}<span class="widget-unit">${escape(r.unit)}</span></div><div class="widget-detail">${escape(w.signal||'Unbound signal')}</div>`;
    if(w.type==='gauge'){
      const p=clamp((Number(r.v)||0)/50*100,0,100);
      html=`<div class="widget-gauge"><div class="gauge-ring" style="--gauge:${p*3.6}deg"><div class="gauge-inner">${escape(fixed(r.v,1))}<small>${escape(r.unit)}</small></div></div><div class="gauge-meta">LIVE READING<strong>${Math.round(p)}%</strong>Scale: 0 – 50</div></div>`;
    }
    if(w.type==='led'){
      const on=r.v===true;
      html=`<div class="led-display"><div class="led-circle${on?'':' off'}"></div><div><strong>${on?'RUNNING':'STOPPED'}</strong><small>${escape(w.signal)}</small></div></div>`;
    }
    if(w.type==='motor')html=`<div class="motor-display"><div class="motor-graphic"><div class="motor-body"><span class="rotor${r.v>10?' spinning':''}">✳</span></div><div class="shaft"></div></div><div class="motor-stats"><strong>${escape(fixed(r.v,0))} rpm</strong><small>${escape(fixed(val('motor.torque'),1))} Nm · simulated</small></div></div>`;
    if(w.type==='gear'){
      const chosen=text(r.v);
      html=`<div class="gear-indicator"><div class="gear-large">${escape(chosen)}</div><div class="gear-gate">${['1','3','5','2','4','6'].map(g=>`<i class="${chosen===g?'active':''}">${g}</i>`).join('')}</div></div><div class="demo-note">Example gate only · not a verified G1800 pattern</div>`;
    }
    if(w.type==='profile'){
      const progress=clamp(Number(val('profile.progress'))||0,0,100);
      html=`<div class="profile-label">${escape(r.v)}</div><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div><div class="profile-progress">${progress.toFixed(1)}% of simulated cycle</div>`;
    }
    if(w.type==='result')html=`<div class="test-result ${r.v==='WAIT'?'wait':''}">${escape(r.v)}</div><div class="widget-detail">Simulated test outcome · not certified</div>`;
    if(w.type==='trend'||w.type==='xy'){
      const isXY=w.type==='xy';
      html=`<div class="widget-graph-info"><strong>${escape(fixed(r.v,1))}</strong><small>${escape(isXY?'rpm × Nm':r.unit)}</small><span class="widget-graph-legend">${escape(isXY?'Speed vs torque':'Recent simulated samples')}</span></div><div class="widget-graph-container"><canvas class="widget-graph" role="img" aria-label="${escape(isXY?'XY plot of simulated motor speed versus torque':'Trend plot of simulated '+w.signal)}"></canvas></div>`;
    }
    if(w.type==='spectrum')html='<div class="spectrum-empty"><strong>NO FFT SOURCE</strong>Connect a waveform or validated FFT signal in a later milestone. No synthetic spectrum is presented as measured data.</div>';
    main.innerHTML=html;
    const status=w.type==='spectrum'?'Not configured':r.status;
    foot.replaceChildren();const dot=document.createElement('span');dot.className='dot';const label=document.createElement('span');label.textContent=status==='Good'?'LIVE · MOCK':status;foot.append(dot,label);
    el.classList.toggle('stale',status==='Stale');el.classList.toggle('disconnected',status==='Disconnected');
    if(w.type==='trend'||w.type==='xy')drawGraph(main.querySelector('canvas'),w);
  }
  function drawGraph(canvasEl,w){
    if(!canvasEl)return;const rect=canvasEl.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    const W=Math.max(100,Math.floor(rect.width)),H=Math.max(60,Math.floor(rect.height));canvasEl.width=W*dpr;canvasEl.height=H*dpr;
    const ctx=canvasEl.getContext('2d');ctx.scale(dpr,dpr);ctx.clearRect(0,0,W,H);
    ctx.strokeStyle='#30475f';ctx.lineWidth=1;
    for(let i=1;i<=3;i++){ctx.beginPath();ctx.moveTo(0,H*i/4);ctx.lineTo(W,H*i/4);ctx.stroke();}
    const data=state.history.slice(-72);if(data.length<2)return;
    const isXY=w.type==='xy';const keys=isXY?['motor.speed','motor.torque']:[w.signal];
    const values=data.map(s=>keys.map(k=>Number(s[k]))).filter(v=>v.every(Number.isFinite));if(values.length<2)return;
    const minX=isXY?Math.min(...values.map(v=>v[0])):0;
    const maxX=isXY?Math.max(...values.map(v=>v[0])):Math.max(values.length-1,1);
    const minY=Math.min(...values.map(v=>v[isXY?1:0]));const maxY=Math.max(...values.map(v=>v[isXY?1:0]));
    const spanY=Math.max(maxY-minY,1),spanX=Math.max(maxX-minX,1);
    ctx.beginPath();values.forEach((v,i)=>{
      const x=8+(W-16)*((isXY?v[0]-minX:i)/spanX);
      const y=H-10-(H-22)*(v[isXY?1:0]-minY)/spanY;
      if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    });ctx.strokeStyle='#64aeff';ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();
    if(isXY){const last=values[values.length-1];const x=8+(W-16)*(last[0]-minX)/spanX;const y=H-10-(H-22)*(last[1]-minY)/spanY;ctx.fillStyle='#7ad1e7';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();}
  }
  function compatible(type,s){if(!s)return false;if(type==='spectrum')return false;
    if(['numeric','gauge','trend','motor','xy'].includes(type))return ['Float64','Float32','Integer'].includes(s.data_type);
    if(type==='led')return s.data_type==='Boolean';if(['gear','result'].includes(type))return s.data_type==='Enum';if(type==='profile')return s.data_type==='String';return true;}
  function renderInspector(){
    const w=state.widgets.find(w=>w.id===state.selected);inspector.replaceChildren();
    byId('selection-caption').textContent=w?`${TYPES[w.type].label} · ${w.id}`:'Select a widget on the canvas to edit it.';
    if(!w){const p=document.createElement('div');p.className='empty-selection';p.innerHTML='<div>▧</div><strong>Nothing selected</strong><p>Choose a component to configure its appearance and signal binding.</p>';inspector.append(p);return;}
    const field=(label,value,handle,type='text')=>{
      const wrapper=document.createElement('label');wrapper.className='field';const title=document.createElement('span');title.textContent=label;
      const input=document.createElement('input');input.type=type;input.value=value;input.addEventListener('change',()=>handle(input.value));wrapper.append(title,input);return wrapper;
    };
    inspector.append(field('Display title',w.title,v=>{w.title=v.slice(0,55);markDirty();render();}));
    const bind=document.createElement('label');bind.className='field';const btitle=document.createElement('span');btitle.textContent='Data binding';const select=document.createElement('select');
    const option=(id,label)=>{const o=document.createElement('option');o.value=id;o.textContent=label;select.append(o);};
    option('','— No signal —');
    for(const [id,s] of state.signals)if(compatible(w.type,s))option(id,`${id} · ${s.data_type}`);
    if(w.signal&&!Array.from(select.options).some(o=>o.value===w.signal))option(w.signal,`${w.signal} · pending`);
    select.value=w.signal;select.addEventListener('change',()=>{w.signal=select.value;markDirty();render();});bind.append(btitle,select);inspector.append(bind);
    const note=document.createElement('p');note.className='field-hint';note.textContent='Bindings are read-only. The mock source is not connected to equipment.';inspector.append(note);
    const heading=document.createElement('div');heading.className='section-heading';heading.textContent='LAYOUT';inspector.append(heading);
    const row=document.createElement('div');row.className='field-row';
    row.append(field('Width (columns)',w.w,v=>{w.w=clamp(parseInt(v,10)||w.w,2,12);markDirty();render();},'number'),field('Height (rows)',w.h,v=>{w.h=clamp(parseInt(v,10)||w.h,2,6);markDirty();render();},'number'));inspector.append(row);
    if(state.layout==='free'){
      const pos=document.createElement('div');pos.className='field-row';pos.append(field('X position',w.x,v=>{w.x=clamp(parseInt(v,10)||0,0,900);markDirty();render();},'number'),field('Y position',w.y,v=>{w.y=clamp(parseInt(v,10)||0,0,700);markDirty();render();},'number'));inspector.append(pos);
    }
    const buttons=document.createElement('div');buttons.className='inspector-actions';
    const duplicate=document.createElement('button');duplicate.className='btn outline';duplicate.textContent='Duplicate';duplicate.addEventListener('click',()=>{newWidget(w.type,w.x+25,w.y+25);const newest=state.widgets.at(-1);newest.title=w.title;newest.signal=w.signal;render();});
    const remove=document.createElement('button');remove.className='btn ghost';remove.textContent='Delete';remove.addEventListener('click',()=>deleteSelected());
    buttons.append(duplicate,remove);inspector.append(buttons);
  }
  function deleteSelected(){if(state.preview||!state.selected)return;state.widgets=state.widgets.filter(w=>w.id!==state.selected);state.selected=null;markDirty();render();toast('Widget removed');}
  function handleFrame(frame){
    if(!frame||frame.type!=='snapshot'||frame.schema_version!==1||!Array.isArray(frame.signals)||!Number.isSafeInteger(frame.sequence)||frame.sequence<=state.seq)return;
    state.seq=frame.sequence;
    for(const s of frame.signals){
      if(!s||typeof s.id!=='string'||!['Good','Stale','Disconnected','Invalid'].includes(s.quality)||!['Boolean','Float64','Float32','Integer','Enum','String'].includes(s.data_type))continue;
      if(typeof s.value==='number'&&!Number.isFinite(s.value))continue;
      state.signals.set(s.id,s);
    }
    const values={};for(const [k,s] of state.signals)values[k]=s.value;state.history.push(values);if(state.history.length>200)state.history.shift();
    document.querySelectorAll('.widget').forEach(el=>{const w=state.widgets.find(x=>x.id===el.dataset.id);if(w)updateWidget(el,w);});
    if(state.seq===0)renderInspector();
  }
  function setConnection(ok){state.connected=ok;const el=byId('connection');el.classList.toggle('connected',ok);el.classList.toggle('disconnected',!ok);el.querySelector('span').textContent=ok?'Mock live':'Mock offline';
    if(!ok)document.querySelectorAll('.widget').forEach(el=>{const w=state.widgets.find(x=>x.id===el.dataset.id);if(w)updateWidget(el,w);});}
  let retry=1000;
  function connect(){
    const ws=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`);
    ws.addEventListener('open',()=>{retry=1000;setConnection(true);});
    ws.addEventListener('message',e=>{let data;try{data=JSON.parse(e.data);}catch(_){return;}handleFrame(data);});
    ws.addEventListener('close',()=>{setConnection(false);setTimeout(connect,retry);retry=Math.min(retry*2,10000);});
    ws.addEventListener('error',()=>ws.close());
  }
  function setup(){
    load();const ids=state.widgets.map(w=>Number(w.id.split('-')[1])).filter(Number.isFinite);state.nextId=Math.max(1,...ids)+1;
    renderCatalog();render();
    byId('search').addEventListener('input',renderCatalog);
    byId('search').addEventListener('keydown',e=>{if(e.key==='Escape')byId('search').blur();});
    document.querySelectorAll('[data-layout]').forEach(b=>b.addEventListener('click',()=>setLayout(b.dataset.layout)));
    byId('publish').addEventListener('click',save);byId('export').addEventListener('click',exportProject);
    byId('reset').addEventListener('click',()=>{state.widgets=defaults();state.selected=null;state.layout='grid';markDirty();render();toast('Default layout restored');});
    byId('preview').addEventListener('click',()=>{state.preview=!state.preview;document.body.classList.toggle('preview',state.preview);byId('preview').textContent=state.preview?'Exit preview':'Preview';state.selected=null;render();toast(state.preview?'Preview · no equipment controls':'Designer active');});
    canvas.addEventListener('dragover',e=>{if(state.preview)return;e.preventDefault();canvas.classList.add('drop-target');});
    canvas.addEventListener('dragleave',e=>{if(!canvas.contains(e.relatedTarget))canvas.classList.remove('drop-target');});
    canvas.addEventListener('drop',e=>{e.preventDefault();canvas.classList.remove('drop-target');if(state.preview)return;
      const raw=e.dataTransfer.getData('text/plain');if(raw.startsWith('new:')){const box=canvas.getBoundingClientRect();newWidget(raw.slice(4),Math.max(0,e.clientX-box.left-40),Math.max(0,e.clientY-box.top-25));}
      else if(raw.startsWith('move:')&&state.layout==='grid'){
        const id=raw.slice(5);const index=state.widgets.findIndex(w=>w.id===id);if(index<0)return;
        const [w]=state.widgets.splice(index,1);const target=e.target.closest('.widget');const at=state.widgets.findIndex(x=>x.id===target?.dataset.id);state.widgets.splice(at<0?state.widgets.length:at,0,w);markDirty();render();
      }
    });
    document.addEventListener('keydown',e=>{
      if((e.key==='Delete'||e.key==='Backspace')&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))deleteSelected();
      if(e.key==='Escape'){state.selected=null;render();document.querySelector('.inspector')?.classList.remove('open');}
      if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();byId('search').focus();}
    });
    connect();
  }
  setup();
})();
