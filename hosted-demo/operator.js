/* PanelForge Operator Display: read-only industrial dashboard. No equipment commands or designer UI. */
(() => {
  'use strict';
  const keys = Object.freeze({layout:'panelforge-layout-v1', active:'panelforge-active-template-v1', custom:'panelforge-custom-templates-v1'});
  const byId = id => document.getElementById(id);
  const colors = Object.freeze(['#126be3','#f04c35','#19a769','#8963d7']);
  const state = {signals:new Map(),history:[],connected:false,lastSeq:-1,chartKeys:[],widgets:[],rigId:'dynamometer',kind:'demo',socket:null};
  const titles = Object.freeze({motor:'MOTOR TEST RIG',transmission:'TRANSMISSION TEST RIG',steering:'STEERING GEAR TEST RIG',dynamometer:'DYNAMOMETER TEST RIG',general:'GENERAL PURPOSE TEST RIG'});
  const mk = (type,title,signal) => ({type,title,signal});
  const presets = Object.freeze({
    dynamometer:[mk('numeric','Speed','dyno.speed'),mk('numeric','Torque','dyno.torque'),mk('numeric','Power','dyno.power'),mk('numeric','Applied Load','dyno.load'),mk('numeric','Temperature','dyno.temperature'),mk('numeric','Drive Current','motor.current'),mk('numeric','Motor Temp','motor.temperature'),mk('gear','Gear Position','gear.actual'),mk('trend','Torque Trend','dyno.torque'),mk('led','Motor Status','motor.running'),mk('profile','Running Profile','profile.step'),mk('result','Test Status','test.result')],
    motor:[mk('numeric','Motor Speed','motor.speed'),mk('numeric','Output Torque','motor.torque'),mk('numeric','Output Power','motor.power'),mk('numeric','Motor Current','motor.current'),mk('numeric','Winding Temp','motor.temperature'),mk('led','Motor Running','motor.running'),mk('trend','Speed Trend','motor.speed'),mk('profile','Running Profile','profile.step'),mk('result','Test Status','test.result')],
    transmission:[mk('numeric','Input Speed','transmission.input_speed'),mk('numeric','LH Speed','transmission.lh_speed'),mk('numeric','RH Speed','transmission.rh_speed'),mk('numeric','Input Torque','transmission.input_torque'),mk('numeric','LH Torque','transmission.lh_torque'),mk('numeric','RH Torque','transmission.rh_torque'),mk('numeric','Oil Pressure','transmission.oil_pressure'),mk('numeric','Oil Temp','transmission.oil_temperature'),mk('gear','Current Gear','gear.actual'),mk('trend','Input Speed Trend','transmission.input_speed'),mk('result','Test Status','test.result')],
    steering:[mk('numeric','Steering Angle','steering.angle'),mk('numeric','Actuator Torque','steering.torque'),mk('numeric','Pressure','steering.pressure'),mk('numeric','Oil Temp','steering.temperature'),mk('numeric','Response Time','steering.response'),mk('trend','Angle Trend','steering.angle'),mk('profile','Running Profile','profile.step'),mk('result','Test Status','test.result')],
    general:[mk('numeric','Speed','motor.speed'),mk('numeric','Torque','motor.torque'),mk('numeric','Current','motor.current'),mk('numeric','Temperature','motor.temperature'),mk('trend','Speed Trend','motor.speed'),mk('led','Running','motor.running'),mk('result','Test Status','test.result')]
  });
  function safeStore(key){try{return localStorage.getItem(key);}catch{return null;}}
  function validSignal(s){return typeof s==='string' && /^[A-Za-z][\w.\-]{0,79}$/.test(s);}
  function safeTitle(s){return typeof s==='string'?s.slice(0,56):'';}
  function readLayout(){
    const active=safeStore(keys.active);
    const param=(new URLSearchParams(location.search)).get('rig');
    const explicitRig=Object.hasOwn(presets,param)?param:null;const rig=explicitRig||(Object.hasOwn(presets,active)?active:'dynamometer');
    state.rigId=rig;
    let customName=null;
    if(active && active.startsWith('custom-')){
      try{const items=JSON.parse(safeStore(keys.custom)||'[]');if(Array.isArray(items)){const item=items.find(t=>t.id===active);if(item?.name)customName=safeTitle(item.name);}}catch{}
    }
    if(explicitRig)customName=null;
    if(customName)byId('rig-title').textContent=customName.toUpperCase()+' — MAIN PANEL';
    else byId('rig-title').textContent=(titles[rig]||titles.dynamometer)+' — MAIN PANEL';
    let saved=null;
    try{saved=JSON.parse(safeStore(keys.layout)||'null');}catch{}
    // Explicit rig URL always uses that preset. Otherwise the operator mirrors saved designer layouts.
    if(!param && saved?.schema_version===1 && Array.isArray(saved.widgets) && saved.widgets.length>0 && saved.widgets.length<=100){
      const selected=saved.widgets.filter(w=>w && ['numeric','gauge','led','trend','motor','gear','profile','result','xy','spectrum'].includes(w.type) && validSignal(w.signal||'') || w && w.type==='spectrum');
      const clean=selected.map(w=>({type:w.type,title:safeTitle(w.title),signal:validSignal(w.signal)?w.signal:''}));
      if(clean.length){state.widgets=clean;state.kind='saved';}
    }
    if(!state.widgets.length)state.widgets=presets[rig].map(w=>({...w}));
    byId('rig-description').textContent=(customName?'Custom rig':'Read-only monitoring')+' · browser-generated simulated signals';
  }
  const node=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
  function addRow(container,name,signal,unit,cls){const row=node('div','detail-row');row.append(node('span','name',name));const value=node('span','reading'+(cls?' '+cls:''),'—');value.dataset.signal=signal||'';if(unit)value.dataset.unit=unit;row.append(value);container.append(row);return row;}
  function displayName(signal){return signal.split('.').pop().replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}
  function makePanel(title,kind='rail-panel'){
    const panel=node('section','instrument-panel '+kind);const head=node('div','panel-heading');head.append(node('span','heading-mark','▤'),node('h2','',title));const content=node('div','detail-rows');panel.append(head,content);return {panel,content};
  }
  function createMetric(w){const c=node('article','metric-card');c.dataset.tag=w.signal;c.append(node('div','metric-label',w.title||displayName(w.signal)));
    const reading=node('div','metric-reading');const value=node('span','metric-value','—');value.dataset.signal=w.signal;const unit=node('span','metric-unit','');unit.dataset.unitFor=w.signal;
    reading.append(value,unit);c.append(reading,node('div','metric-signal',w.signal||'Unbound'));return c;
  }
  function createDetails(){const rail=byId('detail-rail');const actual=state.widgets.filter(w=>!['numeric','trend','xy','spectrum'].includes(w.type));const first=makePanel('DRIVE / SHAFT MONITOR');const second=makePanel('TEST / SIGNAL STATUS');
    const rowsA=[],rowsB=[];
    for(const w of actual){if(['motor','gauge','led','gear'].includes(w.type))rowsA.push(w);else rowsB.push(w);}
    if(!rowsA.length)rowsA.push(mk('led','Motor Running','motor.running'),mk('gauge','Drive Current','motor.current'));
    if(!rowsB.length)rowsB.push(mk('profile','Current Profile Step','profile.step'),mk('result','Test Result','test.result'));
    for(const w of rowsA.slice(0,6))addRow(first.content,w.title||displayName(w.signal),w.signal);
    for(const w of rowsB.slice(0,6))addRow(second.content,w.title||displayName(w.signal),w.signal);
    rail.append(first.panel,second.panel);
  }
  function createBottom(){const wrap=byId('dashboard-bottom');const charts=state.widgets.filter(w=>['trend','xy','spectrum'].includes(w.type));
    const spectrum=charts.find(w=>w.type==='spectrum');
    const first=makePanel(spectrum?'VIBRATION / FFT SOURCE':'MEASUREMENT SUMMARY','compact-panel');
    if(spectrum){first.content.append(node('p','note-line','FFT source not configured. No simulated vibration spectrum is shown as real measurement data.'));}
    else{const list=state.widgets.filter(w=>w.type==='numeric').slice(0,5);for(const w of list)addRow(first.content,w.title,w.signal);}
    const second=makePanel('OPERATING PROFILE','compact-panel');for(const [name,signal] of [['Current step','profile.step'],['Step progress','profile.progress'],['Current gear','gear.actual'],['Test evaluation','test.result']])addRow(second.content,name,signal);
    const third=makePanel('DATA QUALITY / SYSTEM STATUS','compact-panel');
    for(const [name,id] of [['Signal source','__source'],['Last sample','__last'],['Received channels','__count'],['Good quality','__good'],['Telemetry state','__state']])addRow(third.content,name,id);
    wrap.append(first.panel,second.panel,third.panel);
  }
  function setupUI(){
    const metrics=state.widgets.filter(w=>w.type==='numeric'||w.type==='gauge');
    if(!metrics.length)metrics.push(mk('numeric','Rig speed',state.rigId==='dynamometer'?'dyno.speed':'motor.speed'));
    const grid=byId('metric-grid');for(const w of metrics.slice(0,24))grid.append(createMetric(w));
    byId('measurement-count').textContent=`${metrics.length} indicators · mock telemetry`;
    const trend=state.widgets.find(w=>w.type==='trend');const speed=state.widgets.find(w=>w.signal?.includes('speed') && w.type==='numeric');const torque=state.widgets.find(w=>w.signal?.includes('torque') && w.type==='numeric');const power=state.widgets.find(w=>w.signal?.includes('power') && w.type==='numeric');
    const wanted=[trend?.signal,speed?.signal,torque?.signal,power?.signal].filter(Boolean);
    state.chartKeys=[...new Set(wanted)].slice(0,3);if(!state.chartKeys.length)state.chartKeys=[metrics[0].signal];
    byId('primary-chart-title').textContent=state.chartKeys.map(displayName).join(' / ').toUpperCase()+' — TIME TREND';
    const legend=byId('trend-legend');state.chartKeys.forEach((key,i)=>{const entry=node('div','legend-entry');const swatch=node('span','legend-swatch');swatch.style.backgroundColor=colors[i];entry.append(swatch,node('span','',displayName(key)));legend.append(entry)});
    createDetails();createBottom();
  }
  function present(value,unit){if(typeof value==='number'&&Number.isFinite(value)){
      const d=Math.abs(value)>=100?1:Math.abs(value)>=10?1:2;
      return {value:value.toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:1}),unit:unit||''};
    }
    if(typeof value==='boolean')return {value:value?'RUNNING':'STOPPED',unit:''};
    if(value==null)return {value:'—',unit:''};
    return {value:String(value).slice(0,28),unit:unit||''};
  }
  function setConnected(ok){state.connected=ok;byId('data-dot').classList.toggle('good',ok);byId('connection-text').textContent=ok?'MOCK LIVE':'MOCK OFFLINE';}
  function renderValues(){
    document.querySelectorAll('.metric-value[data-signal], .reading[data-signal]').forEach(el=>{
      const key=el.dataset.signal;
      if(key.startsWith('__')){const values={__source:'BROWSER SIMULATION',__last:byId('data-clock').textContent,__count:String(state.signals.size),__good:String([...state.signals.values()].filter(s=>s.quality==='Good').length),__state:state.connected?'STREAMING':'DISCONNECTED'};el.textContent=values[key]??'—';return;}
      const s=state.signals.get(key),p=present(s?.value,s?.unit);el.textContent=p.value+(el.classList.contains('reading')&&p.unit?' '+p.unit:'');
      el.classList.toggle('warning',s?.quality==='Stale');
      if(el.classList.contains('metric-value')){const c=el.closest('.metric-card');c?.classList.toggle('stale',s?.quality==='Stale');c?.classList.toggle('offline',!state.connected);}
    });
    document.querySelectorAll('[data-unit-for]').forEach(el=>{const s=state.signals.get(el.dataset.unitFor);el.textContent=s?.unit||'';});
  }
  function handleFrame(f){if(!f||f.type!=='snapshot'||f.schema_version!==1||!Array.isArray(f.signals)||!Number.isSafeInteger(f.sequence)||f.sequence<=state.lastSeq)return;
    state.lastSeq=f.sequence;
    for(const s of f.signals){if(s&&validSignal(s.id)&&['Good','Stale','Invalid','Disconnected'].includes(s.quality))state.signals.set(s.id,s)}
    const sample={};for(const key of state.chartKeys)sample[key]=Number(state.signals.get(key)?.value);
    state.history.push(sample);if(state.history.length>180)state.history.shift();
    const ts=new Date();byId('data-clock').textContent=ts.toLocaleTimeString('en-GB',{hour12:false});
    renderValues();drawTrend();
  }
  function drawTrend(){const canvas=byId('primary-chart');if(!canvas)return;const rect=canvas.getBoundingClientRect();
    const W=Math.max(200,Math.round(rect.width)),H=Math.max(180,Math.round(rect.height));const dpr=Math.min(2,window.devicePixelRatio||1);
    if(canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(H*dpr)){canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr)}
    const c=canvas.getContext('2d');if(!c)return;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
    const l=43,r=12,t=10,b=28,cw=W-l-r,ch=H-t-b;
    c.fillStyle='#fafcff';c.fillRect(l,t,cw,ch);c.strokeStyle='#dce7ef';c.lineWidth=1;c.font='10px Segoe UI,Arial';c.textAlign='right';c.fillStyle='#64829a';
    for(let i=0;i<=5;i++){const y=t+i*ch/5;c.beginPath();c.moveTo(l,y);c.lineTo(l+cw,y);c.stroke();c.fillText(String(Math.round((1-i/5)*100))+'%',l-6,y+3)}
    for(let i=0;i<=6;i++){const x=l+i*cw/6;c.beginPath();c.moveTo(x,t);c.lineTo(x,t+ch);c.stroke();c.textAlign='center';const seconds=(state.history.length-1)*.25*i/6;c.fillText(seconds.toFixed(seconds<10?1:0)+'s',x,t+ch+17)}
    if(state.history.length<2)return;
    for(const [i,key] of state.chartKeys.entries()){
      const values=state.history.map(item=>item[key]).filter(Number.isFinite);if(values.length<2)continue;
      let min=Math.min(...values),max=Math.max(...values);if(max-min<1){min-=1;max+=1}const pad=(max-min)*.12;min-=pad;max+=pad;
      c.beginPath();values.forEach((v,index)=>{const x=l+cw*index/Math.max(1,values.length-1);const y=t+ch*(1-(v-min)/(max-min));if(index===0)c.moveTo(x,y);else c.lineTo(x,y)});c.strokeStyle=colors[i];c.lineWidth=2.2;c.lineJoin='round';c.stroke();
    }
    byId('trend-footer').textContent=`Last ${Math.round(state.history.length*.25)} s · ${state.chartKeys.length} simulated channels · display only`;
  }
  function connect(){let socket;try{socket=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`);}catch{setConnected(false);return;}
    state.socket=socket;socket.addEventListener('open',()=>{state.lastSeq=-1;state.history=[];state.signals.clear();setConnected(true)});
    socket.addEventListener('message',ev=>{try{handleFrame(JSON.parse(ev.data));}catch{}});
    socket.addEventListener('close',()=>{setConnected(false);renderValues()});socket.addEventListener('error',()=>setConnected(false));
  }
  // Operator view provides no editing, equipment commands or right-click plugin actions.
  document.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('storage',e=>{if([keys.layout,keys.active,keys.custom].includes(e.key))location.reload()});
  window.addEventListener('resize',()=>drawTrend());
  readLayout();setupUI();renderValues();connect();
})();
