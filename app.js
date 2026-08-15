let map,selected,userMarker=null,accuracyCircle=null,watchId=null,userPos=null,lifeguardMarkers=[],beachMarkers=[],beachGroupMarkers=[],liveConditions=new Map(),dynamicStatuses=new Map(),forecastRefreshTimer=null;
let currentPanel = 'map';

function c(f){return f==='green'?'#22b66f':f==='yellow'?'#f3b933':'#e94f4a'}

function flagRank(flag){return flag==='red'?3:flag==='yellow'?2:1}
function worstFlag(items){
  return [...items].sort((a,b)=>flagRank(b.flag)-flagRank(a.flag))[0]?.flag||'green';
}


function localHour(){
  return new Date().getHours();
}

function predictionFlagFromLive(d){
  // Conservative prototype thresholds. These are NOT official bathing rules.
  const wave = Number.isFinite(d?.wave) ? d.wave : 0;
  const wind = Number.isFinite(d?.wind) ? d.wind : 0;
  const gust = Number.isFinite(d?.gust) ? d.gust : 0;

  if(wave >= 1.4 || wind >= 35 || gust >= 50) return 'red';
  if(wave >= 0.7 || wind >= 22 || gust >= 35) return 'yellow';
  return 'green';
}

function sourcePriority(source){
  return {
    lifeguard: 100,
    camera: 80,
    community: 60,
    forecast: 20,
    fallback: 10
  }[source] || 0;
}


function sourceTtlMs(source){
  return {
    lifeguard: 6*60*60*1000,   // 6 часа
    camera: 2*60*60*1000,      // 2 часа
    community: 90*60*1000,     // 90 минути
    forecast: 45*60*1000,      // 45 минути
    fallback: 10*60*1000
  }[source] || 60*60*1000;
}

function isStatusExpired(status){
  if(!status?.updatedAt) return status?.source !== 'fallback';
  return (Date.now()-status.updatedAt) > sourceTtlMs(status.source);
}


function sourceIcon(source){
  return {
    lifeguard:'🛟',
    camera:'📷',
    community:'👥',
    forecast:'~',
    fallback:'?'
  }[source] || '?';
}

function sourceLabel(source){
  return {
    lifeguard:'Спасител',
    camera:'Камера',
    community:'Community',
    forecast:'Прогноза',
    fallback:'Непотвърден'
  }[source] || 'Непотвърден';
}

function getBeachDynamicStatus(b){
  const key=beachKey(b);
  const saved=dynamicStatuses.get(key);

  if(saved && !isStatusExpired(saved)) return saved;

  if(saved && isStatusExpired(saved)){
    dynamicStatuses.delete(key);
  }

  return {
    flag:b.flag || 'green',
    source:'fallback',
    confidence:20,
    updatedAt:null,
    reason:'Няма актуален потвърден източник.'
  };
}

function setBeachDynamicStatus(b,status){
  const key=beachKey(b);
  const current=getBeachDynamicStatus(b);

  const currentExpired=isStatusExpired(current);
  const incomingPriority=sourcePriority(status.source);
  const currentPriority=currentExpired?0:sourcePriority(current.source);

  if(
    incomingPriority > currentPriority ||
    status.source === current.source ||
    current.source === 'fallback'
  ){
    dynamicStatuses.set(key,{
      ...status,
      updatedAt:status.updatedAt || Date.now()
    });
    updateOneBeachMarker(b);
    refreshGroupMarkers();
    if(selected===b) renderStatusInfo(b);
  }
}

function useForecastAsStatus(b,d){
  const current=getBeachDynamicStatus(b);

  // Forecast is the automatic fallback at any time of day.
  // It never replaces a fresh stronger source.
  if(!['fallback','forecast'].includes(current.source)) return;

  const flag=predictionFlagFromLive(d);
  const hour=localHour();

  // Slightly higher confidence early in the day when the app explicitly
  // relies on the forecast before on-site confirmation appears.
  const confidence=hour<9 ? 70 : 58;

  setBeachDynamicStatus(b,{
    flag,
    source:'forecast',
    confidence,
    reason:`Автоматично от вълни ${fmt(d.wave,' m')}, вятър ${fmt(d.wind,' km/h')} и пориви ${fmt(d.gust,' km/h')}.`
  });
}

function demoOfficialStatus(b,flag){
  setBeachDynamicStatus(b,{
    flag,
    source:'lifeguard',
    confidence:100,
    reason:'Потвърдено от спасител.'
  });
}

function demoCameraStatus(b,flag,confidence=85){
  setBeachDynamicStatus(b,{
    flag,
    source:'camera',
    confidence,
    reason:'Разпознато от проверена камера.'
  });
}

function demoCommunityStatus(b,flag,count=5){
  const confidence=Math.min(90,55+count*3);
  setBeachDynamicStatus(b,{
    flag,
    source:'community',
    confidence,
    reason:`${count} съвпадащи сигнала от потребители.`
  });
}

function markerVisualForStatus(status){
  const flag=status.flag;
  const letter=flag==='green'?'З':flag==='yellow'?'Ж':'Ч';
  const src=sourceIcon(status.source);
  return {flag,letter,src};
}

function updateOneBeachMarker(b){
  const entry=beachMarkers.find(x=>x.beach===b);
  if(!entry) return;

  const status=getBeachDynamicStatus(b);
  const visual=markerVisualForStatus(status);

  entry.marker.setIcon({
    path:google.maps.SymbolPath.CIRCLE,
    scale:9,
    fillColor:c(visual.flag),
    fillOpacity:1,
    strokeColor:'#ffffff',
    strokeWeight:2
  });

  entry.marker.setLabel({
    text:visual.letter,
    color:'#ffffff',
    fontSize:'9px',
    fontWeight:'900'
  });

  entry.marker.setTitle(
    `${b.name} · ${visual.flag==='green'?'Зелен':visual.flag==='yellow'?'Жълт':'Червен'} · ${sourceLabel(status.source)}`
  );
}

function refreshGroupMarkers(){
  beachGroupMarkers.forEach(({group,items,marker})=>{
    const statuses=items.map(getBeachDynamicStatus);
    const worst=[...statuses].sort((a,b)=>flagRank(b.flag)-flagRank(a.flag))[0] || {flag:'green'};
    marker.setIcon({
      path:google.maps.SymbolPath.CIRCLE,
      scale:12,
      fillColor:c(worst.flag),
      fillOpacity:1,
      strokeColor:'#ffffff',
      strokeWeight:2.5
    });
  });
}

function renderStatusInfo(b){
  const sheet=document.getElementById('sheet');
  if(!sheet)return;

  let box=document.getElementById('statusInfo');
  if(!box){
    box=document.createElement('div');
    box.id='statusInfo';
    box.className='status-info';
    const live=document.getElementById('liveConditions');
    sheet.insertBefore(box,live || sheet.querySelector('.actions'));
  }

  const s=getBeachDynamicStatus(b);
  const flagText=s.flag==='green'?'ЗЕЛЕН':s.flag==='yellow'?'ЖЪЛТ':'ЧЕРВЕН';
  const updated=s.updatedAt ? ` · обновено ${new Date(s.updatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}` : '';
  const validUntil=s.updatedAt ? new Date(s.updatedAt+sourceTtlMs(s.source)).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : null;

  box.innerHTML=`
    <div class="status-info-title">
      <span class="status-dot" style="background:${c(s.flag)}"></span>
      <b>${flagText}</b>
      <span class="status-source">${sourceIcon(s.source)} ${sourceLabel(s.source)}</span>
    </div>
    <div class="status-confidence">Достоверност: <b>${s.confidence}%</b>${updated}${validUntil?` · валиден до ${validUntil}`:''}</div>
    <div class="status-reason">${s.reason || ''}</div>
    ${s.source==='forecast'
      ? '<div class="forecast-warning">Прогнозен статус — не е официален спасителен флаг.</div>'
      : ''}
  `;
}


async function refreshAllBeachForecastStatuses(){
  const unique=[];
  const seen=new Set();

  beaches.forEach(b=>{
    const k=beachKey(b);
    if(!seen.has(k)){
      seen.add(k);
      unique.push(b);
    }
  });

  const concurrency=6;
  let cursor=0;

  async function worker(){
    while(cursor<unique.length){
      const b=unique[cursor++];
      try{
        const d=await fetchLiveConditions(b);
        useForecastAsStatus(b,d);
      }catch(e){
        // Keep the existing status if one request fails.
      }
      // Tiny pause so mobile browsers are not flooded with requests.
      await new Promise(r=>setTimeout(r,80));
    }
  }

  await Promise.all(Array.from({length:Math.min(concurrency,unique.length)},worker));
  refreshGroupMarkers();
}

function scheduleForecastRefresh(){
  if(forecastRefreshTimer) clearInterval(forecastRefreshTimer);

  // First automatic pass shortly after the map is ready.
  setTimeout(()=>refreshAllBeachForecastStatuses(),900);

  // Then refresh every 30 minutes.
  forecastRefreshTimer=setInterval(()=>{
    refreshAllBeachForecastStatuses();
    cleanupExpiredStatuses();
  },30*60*1000);
}

function cleanupExpiredStatuses(){
  let changed=false;
  dynamicStatuses.forEach((status,key)=>{
    if(isStatusExpired(status)){
      dynamicStatuses.delete(key);
      changed=true;
    }
  });

  if(changed){
    beaches.forEach(updateOneBeachMarker);
    refreshGroupMarkers();
    if(selected){
      renderStatusInfo(selected);
      fetchLiveConditions(selected).then(d=>useForecastAsStatus(selected,d)).catch(()=>{});
    }
  }
}

function renderBeachMarkers(){
  beachMarkers.forEach(x=>x.marker.setMap(null));
  beachGroupMarkers.forEach(x=>x.marker.setMap(null));
  beachMarkers=[];
  beachGroupMarkers=[];

  beaches.forEach(b=>{
    const initialStatus=getBeachDynamicStatus(b);
    const visual=markerVisualForStatus(initialStatus);
    const m=new google.maps.Marker({
      position:{lat:b.lat,lng:b.lng},
      map,
      title:`${b.name} · ${sourceLabel(initialStatus.source)}`,
      label:{text:visual.letter,color:'#ffffff',fontSize:'9px',fontWeight:'900'},
      icon:{path:google.maps.SymbolPath.CIRCLE,scale:9,fillColor:c(visual.flag),fillOpacity:1,strokeColor:'#ffffff',strokeWeight:2},
      zIndex:500
    });
    m.addListener('click',()=>selectBeach(b));
    beachMarkers.push({beach:b,marker:m});
  });

  const groups={};
  beaches.filter(b=>b.group).forEach(b=>(groups[b.group]??=[]).push(b));

  Object.entries(groups).forEach(([group,items])=>{
    if(items.length<2)return;
    const lat=items.reduce((s,x)=>s+x.lat,0)/items.length;
    const lng=items.reduce((s,x)=>s+x.lng,0)/items.length;
    const statuses=items.map(getBeachDynamicStatus);
    const flag=[...statuses].sort((a,b)=>flagRank(b.flag)-flagRank(a.flag))[0]?.flag||'green';
    const m=new google.maps.Marker({
      position:{lat,lng},
      map:null,
      title:`${group} · ${items.length} участъка`,
      label:{text:String(items.length),color:'#ffffff',fontSize:'9px',fontWeight:'900'},
      icon:{path:google.maps.SymbolPath.CIRCLE,scale:12,fillColor:c(flag),fillOpacity:1,strokeColor:'#ffffff',strokeWeight:2.5},
      zIndex:540
    });
    m.addListener('click',()=>{
      map.setCenter({lat,lng});
      map.setZoom(Math.max(12,map.getZoom()+2));
    });
    beachGroupMarkers.push({group,items,marker:m});
  });

  updateBeachMarkerVisibility();
  map.addListener('zoom_changed',updateBeachMarkerVisibility);
}

function updateBeachMarkerVisibility(){
  const zoom=map?.getZoom()||0;
  const groupedNames=new Set(beachGroupMarkers.flatMap(g=>g.items.map(x=>x.name)));

  beachMarkers.forEach(({beach,marker})=>{
    const isGrouped=groupedNames.has(beach.name);
    marker.setVisible(zoom>=7 && (!isGrouped || zoom>=11));
  });
  beachGroupMarkers.forEach(({marker})=>marker.setMap(zoom>=7 && zoom<11?map:null));
}

function initMap(){
  map=new google.maps.Map(document.getElementById('map'),{
    center:{lat:42.65,lng:27.75},
    zoom:8,
    mapTypeControl:false,
    streetViewControl:false,
    fullscreenControl:false,
    gestureHandling:'greedy'
  });

  renderBeachMarkers();

  map.addListener('click',closeBeachSheet);
  setupNavigation();
  injectPanels();
  injectSheetCloseButton();
  renderVerifiedLifeguardPosts();
  scheduleForecastRefresh();
}


function renderVerifiedLifeguardPosts(){
  lifeguardMarkers.forEach(m=>m.setMap(null));
  lifeguardMarkers=[];

  const info=new google.maps.InfoWindow();

  officialLifeguardPosts
    .filter(p=>p.verified)
    .forEach(p=>{
      const m=new google.maps.Marker({
        position:{lat:p.lat,lng:p.lng},
        map:null,
        title:`Спасителен пост №${p.post} — ${p.beach}`,
        label:{text:'🛟',fontSize:'11px'},
        icon:{
          path:google.maps.SymbolPath.CIRCLE,
          scale:9,
          fillColor:'#ffffff',
          fillOpacity:1,
          strokeColor:'#168fe5',
          strokeWeight:1.5
        },
        zIndex:800
      });
      m.markerType='lifeguard';
      m.addListener('click',()=>{
        info.setContent(`
          <div style="max-width:230px">
            <b>🛟 Спасителен пост №${p.post}</b><br>
            ${p.beach}<br>
            <small>Позиция по официална схема · ${p.sourceYear}</small><br>
            <button style="margin-top:8px;border:0;border-radius:8px;padding:7px 9px;background:#e8f3fb;font-weight:700"
              onclick="startOfficialPostCorrection('${p.beach.replace(/'/g,"\'")}',${p.post})">
              Сигнал за корекция
            </button>
          </div>`);
        info.open(map,m);
      });
      lifeguardMarkers.push(m);
    });

  officialUnguardedAnchors.forEach(z=>{
    const m=new google.maps.Marker({
      position:{lat:z.lat,lng:z.lng},
      map:null,
      title:`Неохраняем плаж: ${z.name}`,
      label:{text:'!',color:'#7b4b00',fontWeight:'900',fontSize:'10px'},
      icon:{
        path:google.maps.SymbolPath.CIRCLE,
        scale:8,
        fillColor:'#ffd65a',
        fillOpacity:1,
        strokeColor:'#ffffff',
        strokeWeight:2
      },
      zIndex:650
    });
    m.markerType='unguarded';
    m.addListener('click',()=>{
      info.setContent(`
        <div style="max-width:240px">
          <b>⚠️ Официално неохраняем плаж — 2026</b><br>
          ${z.name}<br>
          <small>${z.partialCoverage?'Има данни за частично сезонно водноспасително обезпечаване.':'Няма нанесена потвърдена постоянна спасителна позиция за сезон 2026.'}</small><br>
          <button style="margin-top:8px;border:0;border-radius:8px;padding:7px 9px;background:#fff2c7;font-weight:700"
            onclick="startCatalogCorrection('${z.name.replace(/'/g,"\'")}')">
            Сигнал за корекция
          </button>
        </div>`);
      info.open(map,m);
    });
    lifeguardMarkers.push(m);
  });

  updateDetailMarkerVisibility();
  map.addListener('zoom_changed',updateDetailMarkerVisibility);
}

function updateDetailMarkerVisibility(){
  if(!map) return;
  const zoom=map.getZoom()||0;

  lifeguardMarkers.forEach(m=>{
    // Hide detailed rescue information until the user zooms in.
    const minZoom=m.markerType==='lifeguard'?14:13;
    m.setMap(zoom>=minZoom?map:null);
  });

  // Beach flag dots stay visible at all normal map zooms.
  updateBeachMarkerVisibility();
}

function startOfficialPostCorrection(beachName,postNo){
  showPanel('report');
  setTimeout(()=>{
    const type=document.getElementById('reportType');
    if(type){type.value='lifeguard';renderReportTypeFields();}
    const msg=document.getElementById('reportMessage');
    if(msg) msg.textContent=`Корекция за ${beachName}, спасителен пост №${postNo}`;
  },30);
}

function injectSheetCloseButton(){
  const sheet = document.getElementById('sheet');
  if(!sheet || document.getElementById('sheetClose')) return;
  const btn = document.createElement('button');
  btn.id='sheetClose';
  btn.className='sheet-close';
  btn.innerHTML='✕';
  btn.setAttribute('aria-label','Затвори');
  btn.onclick=closeBeachSheet;
  sheet.prepend(btn);
  if(!document.getElementById('lifeguardInfo')){
    const box=document.createElement('div');
    box.id='lifeguardInfo';
    box.className='lifeguard-info';
    const actions=sheet.querySelector('.actions');
    sheet.insertBefore(box,actions);
  }
}

function closeBeachSheet(){
  const sheet=document.getElementById('sheet');
  if(sheet) sheet.classList.remove('show');
  selected=null;
}

function distanceKm(a,b){
 const R=6371,toRad=x=>x*Math.PI/180;
 const dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng);
 const x=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
 return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

function refreshSelectedDistance(){
 const el=document.getElementById('distance');
 if(!el) return;
 if(selected && userPos){
   el.textContent=distanceKm(userPos,{lat:selected.lat,lng:selected.lng}).toFixed(1)+' km';
 }else{
   el.textContent='—';
 }
}


function nearestHourlyIndex(times){
  if(!times?.length)return 0;
  const now=Date.now();
  let best=0,dist=Infinity;
  times.forEach((t,i)=>{
    const d=Math.abs(new Date(t).getTime()-now);
    if(d<dist){dist=d;best=i}
  });
  return best;
}

function beachKey(b){return `${b.lat.toFixed(4)},${b.lng.toFixed(4)}`}

async function fetchLiveConditions(b){
  const key=beachKey(b);
  const cached=liveConditions.get(key);
  if(cached && Date.now()-cached.fetchedAt<30*60*1000)return cached;

  const lat=b.lat, lon=b.lng;
  const weatherUrl=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,uv_index,precipitation&forecast_days=2&timezone=auto`;
  const marineUrl=`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature&forecast_days=2&timezone=auto`;

  const [wr,mr]=await Promise.all([fetch(weatherUrl),fetch(marineUrl)]);
  if(!wr.ok||!mr.ok)throw new Error('live data unavailable');
  const [w,m]=await Promise.all([wr.json(),mr.json()]);
  const wi=nearestHourlyIndex(w.hourly?.time);
  const mi=nearestHourlyIndex(m.hourly?.time);

  const data={
    air:w.hourly?.temperature_2m?.[wi],
    wind:w.hourly?.wind_speed_10m?.[wi],
    gust:w.hourly?.wind_gusts_10m?.[wi],
    uv:w.hourly?.uv_index?.[wi],
    rain:w.hourly?.precipitation?.[wi],
    wave:m.hourly?.wave_height?.[mi],
    waveDirection:m.hourly?.wave_direction?.[mi],
    wavePeriod:m.hourly?.wave_period?.[mi],
    water:m.hourly?.sea_surface_temperature?.[mi],
    fetchedAt:Date.now(),
    source:'Open-Meteo'
  };
  liveConditions.set(key,data);
  return data;
}

function beachScoreFromLive(d){
  let score=100;
  if(Number.isFinite(d.wave)) score-=Math.max(0,d.wave-.25)*22;
  if(Number.isFinite(d.wind)) score-=Math.max(0,d.wind-12)*0.75;
  if(Number.isFinite(d.gust)) score-=Math.max(0,d.gust-22)*0.35;
  if(Number.isFinite(d.uv) && d.uv>=8) score-=6;
  if(Number.isFinite(d.rain)) score-=Math.min(15,d.rain*4);
  if(Number.isFinite(d.water) && d.water<20) score-=8;
  return Math.max(0,Math.min(100,Math.round(score)));
}

function fmt(v,suffix=''){return Number.isFinite(v)?`${Math.round(v*10)/10}${suffix}`:'—'}

async function renderLiveConditions(b){
  const box=document.getElementById('liveConditions');
  if(!box)return;
  box.innerHTML='<b>🌊 Условия сега</b><p>Зареждане на актуални морски и метеорологични данни…</p>';
  try{
    const d=await fetchLiveConditions(b);
    if(selected!==b)return;
    const score=beachScoreFromLive(d);
    useForecastAsStatus(b,d);
    box.innerHTML=`
      <div class="live-title"><b>🌊 Условия сега</b><span class="live-badge">LIVE</span></div>
      <div class="live-grid">
        <div><b>${fmt(d.wave,' m')}</b><span>Вълни</span></div>
        <div><b>${fmt(d.wavePeriod,' s')}</b><span>Период</span></div>
        <div><b>${fmt(d.wind,' km/h')}</b><span>Вятър</span></div>
        <div><b>${fmt(d.gust,' km/h')}</b><span>Пориви</span></div>
        <div><b>${fmt(d.water,'°C')}</b><span>Вода</span></div>
        <div><b>${fmt(d.air,'°C')}</b><span>Въздух</span></div>
        <div><b>${fmt(d.uv)}</b><span>UV</span></div>
        <div><b>${score}/100</b><span>Условия</span></div>
      </div>
      <small>Автоматични моделни данни · Open-Meteo · обновяване до 30 мин.</small>
      <div class="safety-note">🚩 Цветният флаг на картата НЕ се променя автоматично от прогнозата. Флагът трябва да идва от спасител/проверен източник/community потвърждение.</div>`;
  }catch(e){
    box.innerHTML='<b>🌊 Условия сега</b><p>В момента не успяхме да заредим live данните. Показанията за флаг остават отделни.</p>';
  }
}

function selectBeach(b){
 selected=b;
 document.getElementById('bn').textContent=b.name;
 document.getElementById('bs').textContent=b.flag==='green'?'🟢 Зелен флаг':b.flag==='yellow'?'🟡 Жълт флаг':'🔴 Червен флаг';
 document.getElementById('score').textContent=b.score+'/100';
 document.getElementById('waves').textContent=b.waves;
 document.getElementById('water').textContent=b.water;
 document.getElementById('wind').textContent=b.wind;
 const sheetEl=document.getElementById('sheet');
 sheetEl.classList.add('show');
 sheetEl.scrollTop=0;
 map.panTo({lat:b.lat,lng:b.lng});
 refreshSelectedDistance();
 renderLifeguardInfo(b);
 renderCoordinateInfo(b);
 renderStatusInfo(b);
 let live=document.getElementById('liveConditions');
 if(!live){
   live=document.createElement('div');
   live.id='liveConditions';
   live.className='live-conditions';
   const sheet=document.getElementById('sheet');
   const actions=sheet?.querySelector('.actions');
   if(sheet) sheet.insertBefore(live,actions||null);
 }
 renderLiveConditions(b);
 if(typeof renderBeachCommunityReports==='function') renderBeachCommunityReports(b);
}


function renderLifeguardInfo(b){
 const box=document.getElementById('lifeguardInfo');
 if(!box) return;
 const lg=b.lifeguard||{status:'unknown',posts:[]};
 let headline='🛟 Спасителни постове: непотвърдени';
 let detail=lg.note||'Все още събираме надеждна информация за този плаж.';
 if(lg.status==='unguarded'){headline='⚠️ Неохраняем плаж';}
 if(lg.status==='guarded'){headline=`🛟 Охраняем плаж · ${lg.posts.length||'?' } поста`;}
 const verified=(lg.posts||[]).filter(p=>p.verified).length;
 if(verified>0) detail=`${verified} поста са с потвърдена GPS позиция.`;
 box.innerHTML=`
   <div class="lifeguard-head">${headline}</div>
   <div class="lifeguard-note">${detail}</div>
   <button class="lifeguard-report-btn" onclick="openLifeguardCorrection()">✏️ Коригирай спасителна информация</button>
 `;
}
function openLifeguardCorrection(){
 const beachName=selected?.name||'избрания плаж';
 showPanel('report');
 setTimeout(()=>{
   const sel=document.getElementById('reportBeachSelect');
   if(sel && selected){
     const idx=beaches.indexOf(selected);
     if(idx>=0) sel.value=String(idx);
   }
   const type=document.getElementById('reportType');
   if(type){type.value='lifeguard'; renderReportTypeFields();}
   const msg=document.getElementById('reportMessage');
   if(msg) msg.textContent=`Корекция за: ${beachName}`;
 },30);
}


function renderCoordinateInfo(b){
 const sheet=document.getElementById('sheet');
 if(!sheet)return;
 let box=document.getElementById('coordinateInfo');
 if(!box){
   box=document.createElement('div');
   box.id='coordinateInfo';
   box.className='coordinate-info';
   const lg=document.getElementById('lifeguardInfo');
   sheet.insertBefore(box,lg||sheet.querySelector('.actions'));
 }
 const label=b.coordinateStatus==='official'?'Официална точка':b.coordinateStatus==='verified'?'Проверена точка':'За допълнителна проверка';
 box.innerHTML=`📌 ${label}${b.coordinateSource?` · ${b.coordinateSource}`:''}${b.segment?` · участък: ${b.segment}`:''}`;
}

function updateUserLocation(p,center=false){
 userPos={lat:p.coords.latitude,lng:p.coords.longitude};

 if(!userMarker){
   userMarker=new google.maps.Marker({
     position:userPos,
     map,
     title:'Вие сте тук',
     icon:{
       path:google.maps.SymbolPath.CIRCLE,
       scale:8,
       fillColor:'#168fe5',
       fillOpacity:1,
       strokeColor:'#ffffff',
       strokeWeight:3
     },
     zIndex:9999
   });
 } else {
   userMarker.setPosition(userPos);
 }

 if(!accuracyCircle){
   accuracyCircle=new google.maps.Circle({
     map,
     center:userPos,
     radius:p.coords.accuracy,
     strokeColor:'#168fe5',
     strokeOpacity:0.35,
     strokeWeight:1,
     fillColor:'#168fe5',
     fillOpacity:0.10
   });
 } else {
   accuracyCircle.setCenter(userPos);
   accuracyCircle.setRadius(p.coords.accuracy);
 }

 document.getElementById('notice').textContent='📍 GPS активен · точност ~'+Math.round(p.coords.accuracy)+' m';
 refreshSelectedDistance();

 if(center){
   map.setCenter(userPos);
   map.setZoom(14);
 }
}

function locate(){
 if(!navigator.geolocation) return alert('GPS не се поддържа');

 if(userPos){
   map.setCenter(userPos);
   map.setZoom(14);
   showPanel('map');
   return;
 }

 navigator.geolocation.getCurrentPosition(
   p=>updateUserLocation(p,true),
   ()=>alert('Разреши Location за този сайт в Chrome.'),
   {enableHighAccuracy:true,timeout:12000,maximumAge:5000}
 );

 if(watchId===null){
   watchId=navigator.geolocation.watchPosition(
     p=>updateUserLocation(p,false),
     ()=>{},
     {enableHighAccuracy:true,maximumAge:3000,timeout:20000}
   );
 }
}

function navigate(){
 if(selected){
   window.open(`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}&travelmode=driving`,'_blank');
 }
}

function searchBeach(){
 const input=document.getElementById('q');
 const s=input.value.toLowerCase().trim();
 if(s.length<2) return;
 const b=beaches.find(x=>x.name.toLowerCase().includes(s));
 if(b){
   showPanel('map');
   selectBeach(b);
   map.setZoom(13);
 }
}

function setupNavigation(){
 const navButtons=[...document.querySelectorAll('nav button')];
 if(navButtons.length<4) return;

 navButtons[0].onclick=()=>showPanel('map');
 navButtons[1].onclick=()=>showPanel('top');
 navButtons[2].onclick=()=>showPanel('report');
 navButtons[3].onclick=()=>showPanel('profile');

 navButtons.forEach((b,i)=>b.dataset.nav=['map','top','report','profile'][i]);
 updateNavState();
}

function updateNavState(){
 document.querySelectorAll('nav button').forEach(btn=>{
   btn.classList.toggle('active-nav',btn.dataset.nav===currentPanel);
 });
}

function injectPanels(){
 if(document.getElementById('appPanel')) return;
 const panel=document.createElement('section');
 panel.id='appPanel';
 panel.className='app-panel';
 panel.innerHTML=`
   <div class="panel-header">
     <button class="panel-back" onclick="showPanel('map')">←</button>
     <div>
       <div class="panel-title" id="panelTitle">Топ плажове</div>
       <div class="panel-subtitle" id="panelSubtitle"></div>
     </div>
   </div>
   <div class="panel-content" id="panelContent"></div>
 `;
 document.querySelector('.app').appendChild(panel);
}

function showPanel(name){
 currentPanel=name;
 updateNavState();

 const panel=document.getElementById('appPanel');
 const mapEl=document.getElementById('map');
 const search=document.querySelector('.search');
 const gps=document.querySelector('.gps');
 const notice=document.getElementById('notice');
 const sheet=document.getElementById('sheet');

 if(name==='map'){
   panel.classList.remove('show');
   mapEl.style.display='';
   search.style.display='';
   gps.style.display='';
   notice.style.display='';
   closeBeachSheet();
   setTimeout(()=>google.maps.event.trigger(map,'resize'),50);
   return;
 }

 sheet.classList.remove('show');
 mapEl.style.display='none';
 search.style.display='none';
 gps.style.display='none';
 notice.style.display='none';
 panel.classList.add('show');

 if(name==='top') renderTopPanel();
 if(name==='report') renderReportPanel();
 if(name==='profile') renderProfilePanel();
}

function renderTopPanel(mode='ranking'){
 document.getElementById('panelTitle').textContent='Плажове';
 document.getElementById('panelSubtitle').textContent='Класация и официални неохраняеми плажове';
 const content=document.getElementById('panelContent');
 const tabs=`
   <div class="catalog-tabs">
     <button class="${mode==='ranking'?'tab-active':''}" onclick="renderTopPanel('ranking')">🏆 Топ</button>
     <button class="${mode==='unguarded'?'tab-active':''}" onclick="renderTopPanel('unguarded')">⚠️ Неохраняеми 2026</button>
   </div>`;
 if(mode==='ranking'){
   const sorted=[...beaches].sort((a,b)=>b.score-a.score);
   content.innerHTML=tabs+sorted.map((b,i)=>`
     <button class="top-card" onclick="openBeachFromPanel(${beaches.indexOf(b)})">
       <span class="rank">${i+1}</span>
       <span class="top-main"><b>${b.name}</b><small>${b.flag==='green'?'🟢 Зелен':b.flag==='yellow'?'🟡 Жълт':'🔴 Червен'} · ${b.waves} · ${b.water}</small></span>
       <strong>${b.score}</strong>
     </button>`).join('');
 }else{
   const grouped={};
   officialUnguarded2026.forEach(x=>{
     const key=`${x.region} · ${x.municipality}`;
     (grouped[key]??=[]).push(x);
   });
   content.innerHTML=tabs+`
     <div class="official-note">Официален списък за летен сезон 2026. Плаж може да е неохраняем като статут, но за някои обекти държавата осигурява частично сезонно водно спасяване.</div>
     ${Object.entries(grouped).map(([k,items])=>`
       <div class="unguarded-group"><h3>${k}</h3>
       ${items.map(x=>{
          const partial=partialLifeguardCoverage2026[x.name];
          return `<div class="unguarded-row"><div><b>${x.name}</b>${partial?`<small>🛟 Частично покритие: юли ${partial.jul}, август ${partial.aug}, септември ${partial.sep} пост(а)</small>`:'<small>⚠️ В официалния списък на неохраняемите</small>'}</div>
          <button onclick="startCatalogCorrection('${x.name.replace(/'/g,"\\'")}')">Корекция</button></div>`;
       }).join('')}</div>`).join('')}
   `;
 }
}
function startCatalogCorrection(name){
 showPanel('report');
 setTimeout(()=>{
   const type=document.getElementById('reportType');
   if(type){type.value='lifeguard';renderReportTypeFields();}
   const msg=document.getElementById('reportMessage');
   if(msg) msg.textContent=`Сигнал за официалния каталог: ${name}`;
 },30);
}

function openBeachFromPanel(index){
 showPanel('map');
 setTimeout(()=>{
   const b=beaches[index];
   selectBeach(b);
   map.setZoom(13);
 },80);
}

function renderReportPanel(){
 document.getElementById('panelTitle').textContent='Подай сигнал';
 document.getElementById('panelSubtitle').textContent='Community информация и корекции';
 document.getElementById('panelContent').innerHTML=`
   <div class="form-card">
     <label>Плаж</label>
     <select id="reportBeachSelect">${beaches.map((b,i)=>`<option value="${i}">${b.name}</option>`).join('')}</select>
     <label>Тип сигнал</label>
     <select id="reportType" onchange="renderReportTypeFields()">
       <option value="conditions">🌊 Условия на плажа</option>
       <option value="lifeguard">🛟 Спасителен пост / неохраняема зона</option>
       <option value="newBeach">🏖️ Предложи нов плаж</option>
     </select>
     <div id="reportTypeFields"></div>
     <button class="submit-report" onclick="submitPrototypeReport()">Изпрати сигнал</button>
     <div id="reportMessage" class="report-message"></div>
   </div>`;
 renderReportTypeFields();
}

function applyPrototypeStatusSource(){
  const beachIndex=Number(document.getElementById('reportBeachSelect')?.value);
  const b=beaches[beachIndex];
  if(!b)return;

  const src=document.getElementById('prototypeSource')?.value;
  const flag=document.getElementById('prototypeFlag')?.value;
  if(!src || !flag)return;

  if(src==='lifeguard') demoOfficialStatus(b,flag);
  if(src==='camera') demoCameraStatus(b,flag,88);
  if(src==='community') demoCommunityStatus(b,flag,7);

  const msg=document.getElementById('reportMessage');
  if(msg)msg.textContent=`✅ Тестов статус: ${sourceLabel(src)} → ${flag}. Кръгчето на картата е обновено.`;
}

function renderReportTypeFields(){
 const type=document.getElementById('reportType')?.value||'conditions';
 const box=document.getElementById('reportTypeFields');
 if(!box) return;

 if(type==='newBeach'){
   box.innerHTML=`
     <div class="new-beach-card">
       <label>Име на плажа</label>
       <input id="newBeachName" class="text-input" placeholder="Напр. Малък плаж до..." maxlength="80">

       <label>Локация</label>
       <div class="gps-evidence" id="newBeachGpsStatus">
         ${userPos
           ? `📍 Ще използваме текущия GPS: ${userPos.lat.toFixed(5)}, ${userPos.lng.toFixed(5)}`
           : '📍 Първо натисни GPS бутона на картата, за да запишем реалната ти позиция.'}
       </div>

       <label>Допълнителна информация</label>
       <textarea id="newBeachComment" class="text-area" placeholder="Как се стига, ориентир, дали е пясъчен/каменист и т.н." maxlength="300"></textarea>

       <div class="proposal-note">
         Предложението няма да се появи веднага като официален плаж. Ще чака потвърждения от други потребители и/или проверка.
       </div>
     </div>`;
   return;
 }

 if(type==='lifeguard'){
   box.innerHTML=`
     <label>Какво искаш да коригираш?</label>
     <div class="choice-row" data-choice="lifeguard">
       <button onclick="choose(this)">🛟 Тук има пост</button>
       <button onclick="choose(this)">❌ Отбелязаният пост липсва</button>
       <button onclick="choose(this)">↔️ Постът е преместен</button>
       <button onclick="choose(this)">⚠️ Това е неохраняема зона</button>
     </div>
     <div class="gps-evidence">📍 Към корекцията се използва GPS позицията на подателя, когато е налична.</div>`;
   return;
 }

 box.innerHTML=`
   <label>🚩 Флаг</label>
   <div class="choice-row" data-field="flag">
     <button onclick="choose(this)">🟢 Зелен</button>
     <button onclick="choose(this)">🟡 Жълт</button>
     <button onclick="choose(this)">🔴 Червен</button>
   </div>

   <label>🪼 Медузи</label>
   <div class="choice-row" data-field="jellyfish">
     <button onclick="choose(this)">Няма</button>
     <button onclick="choose(this)">Малко</button>
     <button onclick="choose(this)">Много</button>
   </div>

   <label>🌿 Водорасли</label>
   <div class="choice-row" data-field="seaweed">
     <button onclick="choose(this)">Няма</button>
     <button onclick="choose(this)">Малко</button>
     <button onclick="choose(this)">Много</button>
   </div>

   <label>👥 Натовареност</label>
   <div class="choice-row" data-field="crowd">
     <button onclick="choose(this)">Спокойно</button>
     <button onclick="choose(this)">Средно</button>
     <button onclick="choose(this)">Претъпкано</button>
   </div>`;
}

function choose(btn){
 const row=btn.closest('.choice-row');
 row.querySelectorAll('button').forEach(x=>x.classList.remove('chosen'));
 btn.classList.add('chosen');
}

function submitPrototypeReport(){
 const msg=document.getElementById('reportMessage');
 const type=document.getElementById('reportType')?.value; msg.textContent=type==='lifeguard'?'✅ Корекцията е приета. В реалната версия ще чака потвърждения преди да промени картата.':'✅ Сигналът е приет в прототипа. Следващата стъпка е да го свържем с база данни.';
}

function getRank(confirmedReports,trust){
 const ranks=[
   {name:'Пясъчен новобранец',icon:'🐣',min:0,trust:0,next:5,tag:'Първи стъпки по брега'},
   {name:'Морски вълк',icon:'🐺',min:5,trust:60,next:20,tag:'Започва да познава брега'},
   {name:'Бесен гларус',icon:'🦅',min:20,trust:70,next:50,tag:'Нищо по брега не му убягва'},
   {name:'Батка',icon:'💪',min:50,trust:80,next:100,tag:'Тежка дума на плажа'},
   {name:'Мич Бюканън',icon:'🏆',min:100,trust:90,next:null,tag:'Легенда на брега'}
 ];
 let rank=ranks[0];
 ranks.forEach(r=>{if(confirmedReports>=r.min && trust>=r.trust) rank=r;});
 return rank;
}

function renderProfilePanel(){
 document.getElementById('panelTitle').textContent='Профил и ранг';
 document.getElementById('panelSubtitle').textContent='Рангът расте от потвърдени и точни сигнали';

 const user={confirmedReports:0,submittedReports:0,confirmations:0,trust:100,points:0};
 const rank=getRank(user.confirmedReports,user.trust);
 const progress=rank.next?Math.min(100,(user.confirmedReports/rank.next)*100):100;

 document.getElementById('panelContent').innerHTML=`
   <div class="profile-card">
     <div class="profile-avatar">${rank.icon}</div>
     <h2>${rank.name}</h2>
     <div class="rank-tagline">${rank.tag}</div>
     <p>Достоверност: <b>${user.trust}%</b></p>

     <div class="rank-progress"><div style="width:${progress}%"></div></div>
     <small class="rank-next">${rank.next?`${user.confirmedReports} / ${rank.next} потвърдени сигнала до следващото ниво`:'Максимален community ранг'}</small>

     <div class="profile-stats">
       <div><b>${user.submittedReports}</b><span>Подадени</span></div>
       <div><b>${user.confirmedReports}</b><span>Потвърдени</span></div>
       <div><b>${user.points}</b><span>Точки</span></div>
     </div>
   </div>

   <div class="rank-card">
     <b>🏅 Морски рангове</b>
     <div class="rank-row"><span>🐣 Пясъчен новобранец</span><small>старт</small></div>
     <div class="rank-row"><span>🐺 Морски вълк</span><small>5+ потвърдени · ≥60% доверие</small></div>
     <div class="rank-row"><span>🦅 Бесен гларус</span><small>20+ · ≥70%</small></div>
     <div class="rank-row"><span>💪 Батка</span><small>50+ · ≥80%</small></div>
     <div class="rank-row"><span>🏆 Мич Бюканън</span><small>100+ · ≥90%</small></div>
   </div>

   <div class="info-card">
     <b>Как се печели доверие</b>
     <p>GPS сигнал от самия плаж, снимка, потвърждения от други хора и съвпадение с официални данни увеличават тежестта. Многократно опровергани сигнали я намаляват.</p>
   </div>

   <div class="info-card">
     <b>Официалните данни остават отделни</b>
     <p>Дори най-високият community ранг не променя сам официален спасителен пост или официален неохраняем статус. Първо се събират корекции и потвърждения.</p>
   </div>
 `;
}

