let map,selected,userMarker=null,accuracyCircle=null,watchId=null,userPos=null;
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

function renderTopPanel(){
 document.getElementById('panelTitle').textContent='Топ плажове';
 document.getElementById('panelSubtitle').textContent='Тестова класация по B.E.A.C.H. Index';

 const sorted=[...beaches].sort((a,b)=>b.score-a.score);
 document.getElementById('panelContent').innerHTML=sorted.map((b,i)=>`
   <button class="top-card" onclick="openBeachFromPanel(${beaches.indexOf(b)})">
     <span class="rank">${i+1}</span>
     <span class="top-main">
       <b>${b.name}</b>
       <small>${b.flag==='green'?'🟢 Зелен':b.flag==='yellow'?'🟡 Жълт':'🔴 Червен'} · ${b.waves} · ${b.water}</small>
     </span>
     <strong>${b.score}</strong>
   </button>
 `).join('');
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
 document.getElementById('panelSubtitle').textContent='Community информация в реално време';

 document.getElementById('panelContent').innerHTML=`
   <div class="form-card">
     <label>Плаж</label>
     <select id="reportBeachSelect">
       ${beaches.map((b,i)=>`<option value="${i}">${b.name}</option>`).join('')}
     </select>

     <label>🚩 Флаг</label>
     <div class="choice-row" data-choice="flag">
       <button onclick="choose(this)">🟢 Зелен</button>
       <button onclick="choose(this)">🟡 Жълт</button>
       <button onclick="choose(this)">🔴 Червен</button>
     </div>

     <label>🪼 Медузи</label>
     <div class="choice-row" data-choice="jellyfish">
       <button onclick="choose(this)">Няма</button>
       <button onclick="choose(this)">Малко</button>
       <button onclick="choose(this)">Много</button>
     </div>

     <label>🌿 Водорасли</label>
     <div class="choice-row" data-choice="seaweed">
       <button onclick="choose(this)">Няма</button>
       <button onclick="choose(this)">Малко</button>
       <button onclick="choose(this)">Много</button>
     </div>

     <label>👥 Натовареност</label>
     <div class="choice-row" data-choice="crowd">
       <button onclick="choose(this)">Спокойно</button>
       <button onclick="choose(this)">Средно</button>
       <button onclick="choose(this)">Претъпкано</button>
     </div>

     <button class="submit-report" onclick="submitPrototypeReport()">Изпрати сигнал</button>
     <div id="reportMessage" class="report-message"></div>
   </div>
 `;
}

function choose(btn){
 const row=btn.closest('.choice-row');
 row.querySelectorAll('button').forEach(x=>x.classList.remove('chosen'));
 btn.classList.add('chosen');
}

function submitPrototypeReport(){
 const msg=document.getElementById('reportMessage');
 msg.textContent='✅ Сигналът е приет в прототипа. Следващата стъпка е да го свържем с база данни.';
}

function renderProfilePanel(){
 document.getElementById('panelTitle').textContent='Профил';
 document.getElementById('panelSubtitle').textContent='Тестов потребител';

 document.getElementById('panelContent').innerHTML=`
   <div class="profile-card">
     <div class="profile-avatar">👤</div>
     <h2>Beach Explorer</h2>
     <p>Community ниво: <b>Нов потребител</b></p>
     <div class="profile-stats">
       <div><b>0</b><span>Сигнали</span></div>
       <div><b>0</b><span>Потвърждения</span></div>
       <div><b>100%</b><span>Доверие</span></div>
     </div>
   </div>
   <div class="info-card">
     <b>Как ще работи профилът</b>
     <p>По-късно тук ще има история на сигналите, точки за достоверност, любими плажове и известия.</p>
   </div>
 `;
}
