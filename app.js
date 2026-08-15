let map,selected,userMarker=null,accuracyCircle=null,watchId=null,userPos=null;
function c(f){return f==='green'?'#22b66f':f==='yellow'?'#f3b933':'#e94f4a'}
function initMap(){
 map=new google.maps.Map(document.getElementById('map'),{center:{lat:42.65,lng:27.75},zoom:8,mapTypeControl:false,streetViewControl:false,fullscreenControl:false,gestureHandling:'greedy'});
 beaches.forEach(b=>{
  const m=new google.maps.Marker({position:{lat:b.lat,lng:b.lng},map,title:b.name,icon:{path:google.maps.SymbolPath.CIRCLE,scale:10,fillColor:c(b.flag),fillOpacity:1,strokeColor:'#fff',strokeWeight:3}});
  m.addListener('click',()=>selectBeach(b));
 });
}
function distanceKm(a,b){
 const R=6371,toRad=x=>x*Math.PI/180;
 const dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng);
 const x=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
 return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
function refreshSelectedDistance(){
 if(selected && userPos){
   document.getElementById('distance').textContent=distanceKm(userPos,{lat:selected.lat,lng:selected.lng}).toFixed(1)+' km';
 }else{
   document.getElementById('distance').textContent='—';
 }
}

function selectBeach(b){
 selected=b;bn.textContent=b.name;
 bs.textContent=b.flag==='green'?'🟢 Зелен флаг':b.flag==='yellow'?'🟡 Жълт флаг':'🔴 Червен флаг';
 score.textContent=b.score+'/100';waves.textContent=b.waves;water.textContent=b.water;wind.textContent=b.wind;
 sheet.classList.add('show');map.panTo({lat:b.lat,lng:b.lng});refreshSelectedDistance();
}
function updateUserLocation(p,center=false){
 userPos={lat:p.coords.latitude,lng:p.coords.longitude};
 if(!userMarker){
   userMarker=new google.maps.Marker({
     position:userPos,map,title:'Вие сте тук',
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
 }else{
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
 }else{
   accuracyCircle.setCenter(userPos);
   accuracyCircle.setRadius(p.coords.accuracy);
 }
 notice.textContent='📍 GPS активен · точност ~'+Math.round(p.coords.accuracy)+' m';
 refreshSelectedDistance();
 if(center){
   map.setCenter(userPos);
   map.setZoom(14);
 }
}
function locate(){
 if(!navigator.geolocation)return alert('GPS не се поддържа');
 if(userPos){
   map.setCenter(userPos);map.setZoom(14);
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
function navigate(){if(selected)window.open(`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}&travelmode=driving`,'_blank')}
function searchBeach(){const s=q.value.toLowerCase().trim();if(s.length<2)return;const b=beaches.find(x=>x.name.toLowerCase().includes(s));if(b){selectBeach(b);map.setZoom(13)}}
