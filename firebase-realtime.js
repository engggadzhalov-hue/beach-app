
let beachFirebaseDb = null;
let beachFirebaseUser = null;
let beachReports = [];

function beachFirebaseId(b){
  return (b.name||'').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zа-я0-9]+/gi,'-')
    .replace(/^-+|-+$/g,'');
}

function beachFirebaseBadge(text, ok=true){
  let el=document.getElementById('firebaseStatusBadge');
  if(!el){
    el=document.createElement('div');
    el.id='firebaseStatusBadge';
    el.className='firebase-status-badge';
    document.querySelector('header')?.appendChild(el);
  }
  el.textContent=text;
  el.classList.toggle('offline',!ok);
}

async function initBeachFirebase(){
  try{
    if(!window.firebase || !window.BEACH_FIREBASE_CONFIG) throw new Error('Firebase missing');
    if(!firebase.apps.length) firebase.initializeApp(window.BEACH_FIREBASE_CONFIG);

    beachFirebaseDb=firebase.firestore();
    await firebase.auth().signInAnonymously();
    beachFirebaseUser=firebase.auth().currentUser;

    beachFirebaseBadge('🟢 Community LIVE',true);

    beachFirebaseDb.collection('reports')
      .orderBy('createdAt','desc')
      .limit(200)
      .onSnapshot(snap=>{
        beachReports=snap.docs.map(d=>({id:d.id,...d.data()}));
        applyRealtimeCommunityStatuses();
      },err=>{
        console.error(err);
        beachFirebaseBadge('🟠 Community read error',false);
      });

  }catch(e){
    console.error(e);
    beachFirebaseBadge('🟠 Community offline',false);
  }
}

function reportAgeMs(r){
  const d=r.createdAt?.toDate ? r.createdAt.toDate() : null;
  return d ? Date.now()-d.getTime() : Infinity;
}

function applyRealtimeCommunityStatuses(){
  if(typeof beaches==='undefined' || typeof demoCommunityStatus!=='function') return;

  const recent=beachReports.filter(r =>
    r.type==='conditions' &&
    r.flag &&
    reportAgeMs(r) <= 90*60*1000
  );

  beaches.forEach(b=>{
    const id=beachFirebaseId(b);
    const votes=recent.filter(r=>r.beachId===id);
    if(votes.length<3) return;

    const counts={green:0,yellow:0,red:0};
    votes.forEach(r=>{
      if(counts[r.flag]!==undefined) counts[r.flag] += 1;
    });

    const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const [flag,count]=sorted[0];
    const total=Object.values(counts).reduce((a,b)=>a+b,0);

    if(total>=3 && count/total>=0.60){
      demoCommunityStatus(b,flag,total);
    }
  });
}

function chosenReportData(){
  const buttons=[...document.querySelectorAll('#reportTypeFields .chosen')];
  const out={};

  buttons.forEach(btn=>{
    const t=btn.textContent.toLowerCase();
    if(t.includes('зелен')) out.flag='green';
    else if(t.includes('жълт')) out.flag='yellow';
    else if(t.includes('червен')) out.flag='red';
    else if(t.includes('спокойно')) out.crowd='quiet';
    else if(t.includes('средно')) out.crowd='medium';
    else if(t.includes('претъпкано')) out.crowd='packed';
  });

  return out;
}

window.submitPrototypeReport = async function(){
  const msg=document.getElementById('reportMessage');

  if(!beachFirebaseDb || !beachFirebaseUser){
    if(msg) msg.textContent='❌ Firebase още не е свързан.';
    return;
  }

  try{
    if(msg) msg.textContent='Изпращане…';

    const idx=Number(document.getElementById('reportBeachSelect')?.value);
    const b=beaches[idx];
    const type=document.getElementById('reportType')?.value || 'conditions';
    const data=chosenReportData();

    let lifeguardCorrection;
    if(type==='lifeguard'){
      lifeguardCorrection=document.querySelector('#reportTypeFields .choice-row .chosen')?.textContent.trim();
    }

    const doc={
      userId:beachFirebaseUser.uid,
      beachId:beachFirebaseId(b),
      beachName:b.name,
      type,
      createdAt:firebase.firestore.FieldValue.serverTimestamp(),
      latitude:(typeof userPos!=='undefined' && userPos?.lat) ? userPos.lat : b.lat,
      longitude:(typeof userPos!=='undefined' && userPos?.lng) ? userPos.lng : b.lng
    };

    if(data.flag) doc.flag=data.flag;
    if(data.crowd) doc.crowd=data.crowd;
    if(lifeguardCorrection) doc.lifeguardCorrection=lifeguardCorrection;

    await beachFirebaseDb.collection('reports').add(doc);

    if(msg) msg.textContent='✅ Сигналът е записан и се изпраща към другите устройства в реално време.';
  }catch(e){
    console.error(e);
    if(msg) msg.textContent='❌ Грешка при запис. Провери Firestore rules и Firebase конфигурацията.';
  }
};

window.addEventListener('load',()=>setTimeout(initBeachFirebase,500));
