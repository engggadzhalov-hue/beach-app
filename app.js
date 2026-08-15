let map,selected,userMarker=null,accuracyCircle=null,watchId=null,userPos=null,lifeguardMarkers=[];
let currentPanel = 'map';

function c(f){return f==='green'?'#22b66f':f==='yellow'?'#f3b933':'#e94f4a'}

function initMap(){
  map=new google.maps.Map(document.getElementById('map'),{
    center:{lat:42.65,lng:27.75},
    zoom:8,
    mapTypeControl:false,
    streetViewControl:false,
    fullscreenControl:false,
    gestureHandling:'greedy'
  });

  beaches.forEach(b=>{
    const m=new google.maps.Marker({
      position:{lat:b.lat,lng:b.lng},
      map,
      title:b.name,
      icon:{
        path:google.maps.SymbolPath.CIRCLE,
        scale:10,
        fillColor:c(b.flag),
        fillOpacity:1,
        strokeColor:'#fff',
        strokeWeight:3
      }
    });
    m.addListener('click',()=>selectBeach(b));
  });

  map.addListener('click',closeBeachSheet);
  setupNavigation();
  injectPanels();
  injectSheetCloseButton();
  renderVerifiedLifeguardPosts();
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
        map,
        title:`Спасителен пост №${p.post} — ${p.beach}`,
        label:{text:'🛟',fontSize:'17px'},
        icon:{
          path:google.maps.SymbolPath.CIRCLE,
          scale:14,
          fillColor:'#ffffff',
          fillOpacity:1,
          strokeColor:'#168fe5',
          strokeWeight:2
        },
        zIndex:800
      });
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
      map,
      title:`Неохраняем плаж: ${z.name}`,
      label:{text:'!',color:'#7b4b00',fontWeight:'900',fontSize:'15px'},
      icon:{
        path:google.maps.SymbolPath.CIRCLE,
        scale:13,
        fillColor:'#ffd65a',
        fillOpacity:1,
        strokeColor:'#ffffff',
        strokeWeight:3
      },
      zIndex:650
    });
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

function selectBeach(b){
 selected=b;
 document.getElementById('bn').textContent=b.name;
 document.getElementById('bs').textContent=b.flag==='green'?'🟢 Зелен флаг':b.flag==='yellow'?'🟡 Жълт флаг':'🔴 Червен флаг';
 document.getElementById('score').textContent=b.score+'/100';
 document.getElementById('waves').textContent=b.waves;
 document.getElementById('water').textContent=b.water;
 document.getElementById('wind').textContent=b.wind;
 document.getElementById('sheet').classList.add('show');
 map.panTo({lat:b.lat,lng:b.lng});
 refreshSelectedDistance();
 renderLifeguardInfo(b);
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
     </select>
     <div id="reportTypeFields"></div>
     <button class="submit-report" onclick="submitPrototypeReport()">Изпрати сигнал</button>
     <div id="reportMessage" class="report-message"></div>
   </div>`;
 renderReportTypeFields();
}
function renderReportTypeFields(){
 const type=document.getElementById('reportType')?.value||'conditions';
 const box=document.getElementById('reportTypeFields');
 if(!box) return;
 if(type==='lifeguard'){
   box.innerHTML=`
     <label>Какво искаш да коригираш?</label>
     <div class="choice-row" data-choice="lifeguard">
       <button onclick="choose(this)">🛟 Тук има пост</button>
       <button onclick="choose(this)">❌ Отбелязаният пост липсва</button>
       <button onclick="choose(this)">↔️ Постът е преместен</button>
       <button onclick="choose(this)">⚠️ Това е неохраняема зона</button>
     </div>
     <div class="gps-evidence">📍 В реалната версия към сигнала ще записваме GPS позицията на подателя и по желание снимка.</div>`;
 }else{
   box.innerHTML=`
     <label>🚩 Флаг</label><div class="choice-row"><button onclick="choose(this)">🟢 Зелен</button><button onclick="choose(this)">🟡 Жълт</button><button onclick="choose(this)">🔴 Червен</button></div>
     <label>🪼 Медузи</label><div class="choice-row"><button onclick="choose(this)">Няма</button><button onclick="choose(this)">Малко</button><button onclick="choose(this)">Много</button></div>
     <label>🌿 Водорасли</label><div class="choice-row"><button onclick="choose(this)">Няма</button><button onclick="choose(this)">Малко</button><button onclick="choose(this)">Много</button></div>
     <label>👥 Натовареност</label><div class="choice-row"><button onclick="choose(this)">Спокойно</button><button onclick="choose(this)">Средно</button><button onclick="choose(this)">Претъпкано</button></div>`;
 }
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
   {name:'Нов наблюдател',icon:'🌱',min:0,trust:0,next:5},
   {name:'Плажен скаут',icon:'🔎',min:5,trust:60,next:20},
   {name:'Брегови наблюдател',icon:'🌊',min:20,trust:70,next:50},
   {name:'Местен експерт',icon:'⭐',min:50,trust:80,next:100},
   {name:'Доверен наблюдател',icon:'🛟',min:100,trust:90,next:null}
 ];
 let rank=ranks[0];
 ranks.forEach(r=>{if(confirmedReports>=r.min && trust>=r.trust) rank=r;});
 return rank;
}

function renderProfilePanel(){
 document.getElementById('panelTitle').textContent='Профил и ранг';
 document.getElementById('panelSubtitle').textContent='Рангът расте от потвърдени, не от просто изпратени сигнали';

 // Prototype user state; backend will replace this.
 const user={confirmedReports:0,submittedReports:0,confirmations:0,trust:100,points:0};
 const rank=getRank(user.confirmedReports,user.trust);
 const progress=rank.next?Math.min(100,(user.confirmedReports/rank.next)*100):100;

 document.getElementById('panelContent').innerHTML=`
   <div class="profile-card">
     <div class="profile-avatar">${rank.icon}</div>
     <h2>${rank.name}</h2>
     <p>Достоверност: <b>${user.trust}%</b></p>

     <div class="rank-progress">
       <div style="width:${progress}%"></div>
     </div>
     <small class="rank-next">${rank.next?`${user.confirmedReports} / ${rank.next} потвърдени сигнала до следващото ниво`:'Максимален community ранг'}</small>

     <div class="profile-stats">
       <div><b>${user.submittedReports}</b><span>Подадени</span></div>
       <div><b>${user.confirmedReports}</b><span>Потвърдени</span></div>
       <div><b>${user.points}</b><span>Точки</span></div>
     </div>
   </div>

   <div class="rank-card">
     <b>🏅 Рангове</b>
     <div class="rank-row"><span>🌱 Нов наблюдател</span><small>старт</small></div>
     <div class="rank-row"><span>🔎 Плажен скаут</span><small>5+ потвърдени · ≥60% доверие</small></div>
     <div class="rank-row"><span>🌊 Брегови наблюдател</span><small>20+ · ≥70%</small></div>
     <div class="rank-row"><span>⭐ Местен експерт</span><small>50+ · ≥80%</small></div>
     <div class="rank-row"><span>🛟 Доверен наблюдател</span><small>100+ · ≥90%</small></div>
   </div>

   <div class="info-card">
     <b>Как се печели доверие</b>
     <p>GPS сигнал от самия плаж, снимка, потвърждения от други хора и съвпадение с официални данни увеличават тежестта. Многократно опровергани сигнали я намаляват.</p>
   </div>

   <div class="info-card">
     <b>Важно</b>
     <p>Дори потребител с най-висок ранг няма сам да може да променя официален спасителен пост или официален неохраняем статус. Community корекцията ще се показва отделно, докато не бъде потвърдена.</p>
   </div>
 `;
}

