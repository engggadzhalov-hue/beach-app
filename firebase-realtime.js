
let beachFirebaseDb = null;
let beachFirebaseUser = null;
let beachReports = [];
let beachConfirmations = [];
let confirmationsUnsubscribe = null;

function beachFirebaseId(b){
  return (b.name||'').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zа-я0-9]+/gi,'-')
    .replace(/^-+|-+$/g,'');
}

function safeIdPart(s){
  return String(s||'')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zа-я0-9]+/gi,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,80);
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
      .limit(300)
      .onSnapshot(snap=>{
        beachReports=snap.docs.map(d=>({id:d.id,...d.data()}));
        applyRealtimeCommunityStatuses();
      },err=>{
        console.error(err);
        beachFirebaseBadge('🟠 Community read error',false);
      });

    if(confirmationsUnsubscribe) confirmationsUnsubscribe();
    confirmationsUnsubscribe = beachFirebaseDb.collection('confirmations')
      .orderBy('createdAt','desc')
      .limit(500)
      .onSnapshot(snap=>{
        beachConfirmations=snap.docs.map(d=>({id:d.id,...d.data()}));
        applyRealtimeCommunityStatuses();
        if(typeof selected!=='undefined' && selected) renderBeachCommunityReports(selected);
      },err=>console.error('confirmations listener',err));

  }catch(e){
    console.error(e);
    beachFirebaseBadge('🟠 Community offline',false);
  }
}

function reportAgeMs(r){
  const d=r.createdAt?.toDate ? r.createdAt.toDate() : null;
  return d ? Date.now()-d.getTime() : Infinity;
}


function confirmationCounts(reportId){
  const items=beachConfirmations.filter(c=>c.reportId===reportId);
  return {
    confirm:items.filter(c=>c.value==='confirm').length,
    outdated:items.filter(c=>c.value==='outdated').length,
    total:items.length
  };
}

function reportWeightFromConfirmations(report){
  const c=confirmationCounts(report.id);
  // Base vote = 1. Confirmations increase weight modestly.
  // "Outdated" confirmations reduce influence but do not create negative votes.
  return Math.max(0, 1 + c.confirm*0.35 - c.outdated*0.5);
}

function myConfirmationFor(reportId){
  if(!beachFirebaseUser) return null;
  return beachConfirmations.find(c=>c.reportId===reportId && c.userId===beachFirebaseUser.uid) || null;
}

function confirmationDocId(reportId){
  return `${safeIdPart(beachFirebaseUser.uid)}__${safeIdPart(reportId)}`;
}

async function voteOnReport(reportId,value){
  if(!beachFirebaseDb || !beachFirebaseUser) return;
  const report=beachReports.find(r=>r.id===reportId);
  if(!report) return;

  if(report.userId===beachFirebaseUser.uid){
    alert('Не можеш да потвърждаваш собствения си сигнал.');
    return;
  }

  const id=confirmationDocId(reportId);
  await beachFirebaseDb.collection('confirmations').doc(id).set({
    userId:beachFirebaseUser.uid,
    reportId,
    createdAt:firebase.firestore.FieldValue.serverTimestamp(),
    value
  },{merge:true});
}

function formatReportAge(r){
  const d=r.createdAt?.toDate ? r.createdAt.toDate() : null;
  if(!d) return 'сега';
  const min=Math.max(0,Math.round((Date.now()-d.getTime())/60000));
  if(min<1) return 'сега';
  if(min<60) return `преди ${min} мин`;
  return `преди ${Math.round(min/60)} ч`;
}

function reportSummary(r){
  const parts=[];
  if(r.flag) parts.push(r.flag==='green'?'🟢 Зелен':r.flag==='yellow'?'🟡 Жълт':'🔴 Червен');
  if(r.jellyfish) parts.push(`🪼 ${r.jellyfish==='none'?'няма':r.jellyfish==='low'?'малко':'много'}`);
  if(r.seaweed) parts.push(`🌿 ${r.seaweed==='none'?'няма':r.seaweed==='low'?'малко':'много'}`);
  if(r.crowd) parts.push(`👥 ${r.crowd==='quiet'?'спокойно':r.crowd==='medium'?'средно':'претъпкано'}`);
  if(r.lifeguardCorrection) parts.push(`🛟 ${r.lifeguardCorrection}`);
  return parts.join(' · ') || r.type;
}

function renderBeachCommunityReports(b){
  const sheet=document.getElementById('sheet');
  if(!sheet) return;

  let box=document.getElementById('communityReportsBox');
  if(!box){
    box=document.createElement('div');
    box.id='communityReportsBox';
    box.className='community-reports-box';
    const actions=sheet.querySelector('.actions');
    sheet.insertBefore(box,actions||null);
  }

  const id=beachFirebaseId(b);
  const items=beachReports
    .filter(r=>r.beachId===id && r.type!=='newBeach' && reportAgeMs(r)<=6*60*60*1000)
    .slice(0,6);

  if(!items.length){
    box.innerHTML='<div class="community-box-title">👥 Community сигнали</div><div class="community-empty">Няма пресни сигнали за този плаж.</div>';
    return;
  }

  box.innerHTML=`
    <div class="community-box-title">👥 Community сигнали</div>
    ${items.map(r=>{
      const c=confirmationCounts(r.id);
      const mine=myConfirmationFor(r.id);
      const own=beachFirebaseUser && r.userId===beachFirebaseUser.uid;
      return `<div class="community-report">
        <div class="community-report-main">
          <b>${reportSummary(r)}</b>
          <small>${formatReportAge(r)} · ✅ ${c.confirm} · ⏱ ${c.outdated}</small>
        </div>
        <div class="community-vote-row">
          <button ${own?'disabled':''} class="${mine?.value==='confirm'?'selected':''}"
            onclick="voteOnReport('${r.id}','confirm')">✅ Потвърждавам</button>
          <button ${own?'disabled':''} class="${mine?.value==='outdated'?'selected':''}"
            onclick="voteOnReport('${r.id}','outdated')">⏱ Не е актуално</button>
        </div>
      </div>`;
    }).join('')}
  `;
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

    // One document per user/beach/type means each UID has exactly one current vote.
    const votes=recent.filter(r=>r.beachId===id);
    if(votes.length<3) return;

    const counts={green:0,yellow:0,red:0};
    votes.forEach(r=>{
      if(counts[r.flag]!==undefined) counts[r.flag] += reportWeightFromConfirmations(r);
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
  const out={};

  document.querySelectorAll('#reportTypeFields .choice-row').forEach(row=>{
    const chosen=row.querySelector('.chosen');
    if(!chosen) return;

    const field=row.dataset.field;
    const text=chosen.textContent.toLowerCase();

    if(field==='flag'){
      if(text.includes('зелен')) out.flag='green';
      if(text.includes('жълт')) out.flag='yellow';
      if(text.includes('червен')) out.flag='red';
    }

    if(field==='jellyfish'){
      if(text.includes('няма')) out.jellyfish='none';
      if(text.includes('малко')) out.jellyfish='low';
      if(text.includes('много')) out.jellyfish='high';
    }

    if(field==='seaweed'){
      if(text.includes('няма')) out.seaweed='none';
      if(text.includes('малко')) out.seaweed='low';
      if(text.includes('много')) out.seaweed='high';
    }

    if(field==='crowd'){
      if(text.includes('спокойно')) out.crowd='quiet';
      if(text.includes('средно')) out.crowd='medium';
      if(text.includes('претъпкано')) out.crowd='packed';
    }
  });

  return out;
}

function activeReportDocId(userId, beachId, type){
  // Important anti-spam rule:
  // One user has ONE current report document for each beach + report type.
  // A new submission updates the old document instead of adding another vote.
  return `${safeIdPart(userId)}__${safeIdPart(beachId)}__${safeIdPart(type)}`;
}

function roundedLocationKey(lat,lng){
  // ~100m-ish grid. Same user proposing the same place again updates the proposal.
  return `${Number(lat).toFixed(3)}_${Number(lng).toFixed(3)}`.replace(/\./g,'p').replace(/-/g,'m');
}

async function submitNewBeachProposal(msg){
  const name=(document.getElementById('newBeachName')?.value||'').trim();
  const comment=(document.getElementById('newBeachComment')?.value||'').trim();

  if(name.length<3){
    throw new Error('Въведи име на плажа.');
  }
  if(typeof userPos==='undefined' || !userPos?.lat || !userPos?.lng){
    throw new Error('За нов плаж е необходим GPS. Върни се на картата и натисни 📍.');
  }

  const proposalBeachId=`proposal-${roundedLocationKey(userPos.lat,userPos.lng)}`;
  const docId=activeReportDocId(beachFirebaseUser.uid,proposalBeachId,'newBeach');

  const doc={
    userId:beachFirebaseUser.uid,
    beachId:proposalBeachId,
    beachName:name,
    type:'newBeach',
    createdAt:firebase.firestore.FieldValue.serverTimestamp(),
    latitude:userPos.lat,
    longitude:userPos.lng
  };

  if(comment) doc.comment=comment;

  await beachFirebaseDb.collection('reports').doc(docId).set(doc,{merge:true});

  if(msg){
    msg.textContent='✅ Предложението е записано. То няма да стане официален маркер автоматично — ще чака потвърждение/проверка.';
  }
}

window.submitPrototypeReport = async function(){
  const msg=document.getElementById('reportMessage');

  if(!beachFirebaseDb || !beachFirebaseUser){
    if(msg) msg.textContent='❌ Firebase още не е свързан.';
    return;
  }

  try{
    if(msg) msg.textContent='Изпращане…';

    const type=document.getElementById('reportType')?.value || 'conditions';

    if(type==='newBeach'){
      await submitNewBeachProposal(msg);
      return;
    }

    const idx=Number(document.getElementById('reportBeachSelect')?.value);
    const b=beaches[idx];
    if(!b) throw new Error('Няма избран плаж.');

    const data=chosenReportData();
    let lifeguardCorrection;

    if(type==='lifeguard'){
      lifeguardCorrection=document.querySelector('#reportTypeFields .choice-row .chosen')?.textContent.trim();
    }

    const beachId=beachFirebaseId(b);
    const docId=activeReportDocId(beachFirebaseUser.uid,beachId,type);

    const doc={
      userId:beachFirebaseUser.uid,
      beachId,
      beachName:b.name,
      type,
      createdAt:firebase.firestore.FieldValue.serverTimestamp(),
      latitude:(typeof userPos!=='undefined' && userPos?.lat) ? userPos.lat : b.lat,
      longitude:(typeof userPos!=='undefined' && userPos?.lng) ? userPos.lng : b.lng
    };

    if(data.flag) doc.flag=data.flag;
    if(data.jellyfish) doc.jellyfish=data.jellyfish;
    if(data.seaweed) doc.seaweed=data.seaweed;
    if(data.crowd) doc.crowd=data.crowd;
    if(lifeguardCorrection) doc.lifeguardCorrection=lifeguardCorrection;

    // SET, not ADD:
    // repeated submissions by the same user update the same document.
    await beachFirebaseDb.collection('reports').doc(docId).set(doc,{merge:true});

    if(msg){
      msg.textContent='✅ Сигналът е записан. Ако подадеш нов сигнал за същия плаж и тип, ще актуализира този — няма да се броиш два пъти.';
    }

  }catch(e){
    console.error(e);
    if(msg) msg.textContent=`❌ ${e.message || 'Грешка при запис.'}`;
  }
};

window.addEventListener('load',()=>setTimeout(initBeachFirebase,500));

window.voteOnReport = voteOnReport;
window.renderBeachCommunityReports = renderBeachCommunityReports;
