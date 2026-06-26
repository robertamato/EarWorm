  const newN=D.filter((_,i)=>isUnlocked(i)&&!(S.cards[i]&&S.cards[i].seen)).length;
  const mastN=D.filter((_,i)=>isMastered(i)).length;
  const frVal=frontier();
  // Engine strip — FRONTIER · DUE · ACTIVE (in-acquisition / cap). The numbers the
  // acquisition engine actually tracks; meta-game (XP/LV/STREAK) lives in PROFILE.
  let ACQ_STAGE=1; try{ ACQ_STAGE=ACQUIRED_STAGE; }catch(e){}  // let in TDZ at init — typeof would throw
  const inAcq=D.filter((_,k)=>{ const c=S.cards[k]; return c&&c.exp>0&&getAxisStage(k,'meaning')<ACQ_STAGE; }).length;
  let acap=6; try{ acap=Estimator.pools().cap; }catch(e){}
  if($('engFrontier')) $('engFrontier').textContent=frVal;
  if($('engDue')) $('engDue').textContent=dueN;
  if($('engNew')) $('engNew').textContent=newN;
  if($('engActive')) $('engActive').textContent=inAcq+'/'+acap;
  // HONEST CONTRAST (cold engine as a truth signal, NOT driving selection — ENGINE.md §7-bis,
  // [[project_reading_first]]): RECOGNIZED = live graduation (marks "known" on one recall);
  // IN CONTEXT = cold graduation (demonstrated via contextual discrimination + incidental use).
  // The gap surfaces over-graduation — recognition not yet turned into usable comprehension.
  try{
    if(typeof coldRecompute==='function') coldRecompute(null,true); // quiet refresh
    const _cold=(typeof S!=='undefined'&&S.coldState&&S.coldState.atoms)||{};
    let _recog=0,_ctx=0;
    for(let k=0;k<D.length;k++){ const c=S.cards[k]; if(!c||!c.seen) continue;
      if(typeof isGraduated==='function'?isGraduated(k):true) _recog++;
      const ca=_cold[k]&&_cold[k].meaning; if(ca&&ca.graduated) _ctx++; }
    if($('engKnown')) $('engKnown').textContent=_recog;
    if($('engInContext')) $('engInContext').textContent=_ctx;
  }catch(e){}
  const course=activeCourse&&activeCourse();
  if($('engDeck')) $('engDeck').textContent=activeDeckName().toUpperCase()+' ▸';
  if($('studyDue')) $('studyDue').textContent=(dueN>0)?(dueN+' due'):'';
  const ll=$('courseId');
  if(ll&&course){ ll.textContent=course.langName.toUpperCase()+'  ▾'; ll.style.cursor='pointer'; }

  // Yield Curve (replaces the daily-goal quota bar) — the diminishing-returns render
  try{ renderYieldCurve(fg); }catch(e){}
  const yw=$('yieldWrap'); if(yw){ yw.style.borderColor=fg; yw.style.color=fg; }

  // Capability milestone (replaces the raw word-count milestone): basis-tier progress.
  // A capability is a real, true claim — the tier's atoms have graduated. Honest LABEL
  // only; the production-gated badge + Title Defense (the game layer) come later.
  const capLbl=document.getElementById('milestoneCapLabel');
  let cap=null; try{ cap=Estimator.capability(); }catch(e){}
  if(cap){
    if(capLbl) capLbl.textContent = cap.current ? ('CAN '+cap.current.cap) : 'CAPABILITY';
    $('milestoneProgFill').style.width=(cap.next?cap.nextPct:100)+'%';
    $('milestoneProgFill').style.background=fg;
    $('milestoneProgLabel').textContent = cap.next ? ('NEXT: '+cap.next.cap) : '✓ ALL TIERS';
    // Prefer a concrete now-producible example (what you can actually say); else effort.
    if(cap.example){
      $('milestoneProgNote').textContent = 'e.g. '+cap.example.zh+(cap.example.en?' — '+cap.example.en:'');
    } else if(cap.next){
      $('milestoneProgNote').textContent = (cap.effort+' atom'+(cap.effort===1?'':'s')+' to go'+(cap.sigma!=null?' · σ'+cap.sigma:'')).toUpperCase();
    } else {
      $('milestoneProgNote').textContent = 'ALL TIERS CLOSED';
    }
  } else {
    // Coverage fallback for courses with no resolvable basis (no grammarRoles yet).
    if(capLbl) capLbl.textContent='COVERAGE';
    const pct=Math.min(100,Math.round(frVal/Math.max(1,D.length)*100));
    $('milestoneProgFill').style.width=pct+'%';
    $('milestoneProgFill').style.background=fg;
    $('milestoneProgLabel').textContent=frVal+' / '+D.length;
    $('milestoneProgNote').textContent=frVal+' ATOMS COVERED';
  }
  $('milestoneProgTrack').style.borderColor=fg;
  $('milestoneProgWrap').style.borderColor=fg; $('milestoneProgWrap').style.color=fg;
  $('muteBtn').textContent='SOUND: '+S.sound.toUpperCase();
  const toneDBtn=$('startTone');
  if(toneDBtn) toneDBtn.style.display=(course&&course.hasTone)?'':'none';
}

// ── ESTIMATOR — the single latent-state read-layer (THEORY.md §10) ──────────
// One object the home renders project from: per-atom posterior + the session's
// information gradient. Pure read-layer over existing scattered signals
// (_pCorrect, retrievability, axisStage, axisDue) — NO writes, NO scheduling
// effect, NO reward (reward≠measurement). The Yield Curve, capability badges and
// (later) Title Defense are renders of THIS object, not separate subsystems.
const Estimator = {
  G0_INTRO: 1.0,        // value of a first exposure (max)
  TAIL_VALUE: 0.08,     // premature-review yield past the productive window
  FATIGUE_FLOOR: 0.40,  // encoding quality floors here, never 0
  FATIGUE_SCALE: 45,    // cards-scale of fatigue decay
  INTRO_TURNOVER: 2.5,  // session intro budget ≈ cap × this (cascade as slots free)

  _fatigue(n){ return this.FATIGUE_FLOOR + (1-this.FATIGUE_FLOOR)*Math.exp(-(n-1)/this.FATIGUE_SCALE); },
  _P(i){ try{ return (typeof Scheduler!=='undefined'&&Scheduler._pCorrect)?Scheduler._pCorrect((S.cards&&S.cards[i])||{},'meaning'):0.5; }catch(e){ return 0.5; } },
  _R(i){ try{ return (typeof retrievability==='function')?retrievability(i,'meaning'):0; }catch(e){ return 0; } },

  // per-atom latent snapshot
  atom(i){
    const ci=(S.cards&&S.cards[i])||{};
    const seen=!!ci.seen;
    const due=seen&&typeof isCardDue==='function'&&isCardDue(i);
    const ripe=seen&&typeof isWallClockRipe==='function'&&isWallClockRipe(i);
    return { i, seen, P:this._P(i), R:this._R(i),
             stage:(typeof getAxisStage==='function')?getAxisStage(i,'meaning'):0,
             due:!!due, ripe:!!ripe };
  },

  // v(i): instantaneous learning value. Intro = max; due/ripe peak at mid-R
  // (P·(1−R) = landing prob × consolidation gain); idle = low premature-review floor.
  value(a){
    if(!a.seen) return this.G0_INTRO;
    if(a.due||a.ripe) return Math.max(0, a.P*(1-a.R));
    return this.TAIL_VALUE;
  },

  // The session's productive pool + today's predicted window W.
  pools(){
    // Iterate the active deck (not isUnlocked — that gates on already-introduced,
    // which would zero the introduceable supply for a fresh deck).
    let idxs;
    try{ idxs=(typeof activeDeckIndices==='function')?activeDeckIndices():null; }catch(e){ idxs=null; }
    if(!idxs||!idxs.length){ const N=(typeof D!=='undefined')?D.length:0; idxs=[]; for(let i=0;i<N;i++) idxs.push(i); }
    let introUnseen=0, due=0, ripe=0, idle=0; const dueVals=[];
    idxs.forEach(i=>{
      const ci=(S.cards&&S.cards[i])||{};
      if(!ci.seen){ introUnseen++; return; }
      const a=this.atom(i);
      if(a.due){ due++; dueVals.push(this.value(a)); }
      else if(a.ripe){ ripe++; dueVals.push(this.value(a)); }
      else idle++;
    });
    // intro budget cascades as slots free → ≈ cap × turnover, capped by supply
    let cap=6; try{ if(typeof Scheduler!=='undefined'&&Scheduler._effectiveCap) cap=Scheduler._effectiveCap({sessionAnswerRing:[]})||6; }catch(e){}
    const introBudget=Math.min(introUnseen, Math.round(cap*this.INTRO_TURNOVER));
    const window=introBudget+due+ripe;
    return { introUnseen, introBudget, due, ripe, idle, window, dueVals, cap };
  },

  // The Yield Curve: cumulative retained value V(n) over a session, knee at the
  // productive window. Sorted productive values × fatigue, cumulative — this is the
  // running integral of the scheduler's own value function depleting (THEORY.md §10.1).
  curve(maxN){
    const p=this.pools();
    maxN=maxN||Math.max(24, Math.round(p.window*1.5));
    const vals=[];
    for(let k=0;k<p.introBudget;k++) vals.push(this.G0_INTRO);
    p.dueVals.forEach(v=>vals.push(v));
    vals.sort((a,b)=>b-a);
    const points=[]; let V=0;
    for(let n=1;n<=maxN;n++){
      const v=(n<=vals.length)?vals[n-1]:this.TAIL_VALUE;
      const rho=this._fatigue(n)*v;
      V+=rho; points.push({ n, V:Math.round(V*1000)/1000, rho:Math.round(rho*1000)/1000 });
    }
    return { points, knee:p.window, window:p.window, pools:p, maxN };
  },

  // §12 production gate. OFF until a REAL production modality exists (LLM-graded free
  // production). While off, a capability is graduation-based (recognition-level). Flip
  // true once production evidence is trustworthy — then a tier needs both graduation AND
  // production. word-order/cloze are NOT wired here on purpose (they're trap-exposed, §4).
  PRODUCTION_GATE:false,
  _tierProduced(t){
    // Seam for Phase 2: per-tier production evidence. Nothing writes S.tierProduced yet,
    // so this is intentionally false — the gate is inert, not faked.
    try{ return !!(S.tierProduced && t && S.tierProduced[t.name]); }catch(e){ return false; }
  },

  // Capability render (THEORY.md §10.2): which basis tier the learner has CLOSED.
  // A tier is achieved when all its atoms have GRADUATED (filter-crossing, not seen) —
  // and, once PRODUCTION_GATE is on, also produced. effort-to-next = un-graduated atoms
  // of the next tier, σ-weighted where σ exists. null when no resolvable basis.
  capability(){
    let g; try{ g=computeGenerativeBasis(); }catch(e){ return null; }
    if(!g||!g.tiers||!g.tiers.length) return null;
    if(!g.tiers.some(t=>t.atoms&&t.atoms.length)) return null;  // no role-atoms resolved
    const grad=ch=>{ const i=D.findIndex(d=>d[0]===ch); if(i<0) return false; try{ return Scheduler._isGraduatedEff(S, i); }catch(e){ return false; } };  // EFF: cutover seam — capability reads the cold verdict when coldCutover is on, else live
    let current=null, next=null, ok=true;
    g.tiers.forEach(t=>{
      const atoms=(t.atoms||[]).map(a=>a.ch);
      const achieved=atoms.length>0 && atoms.every(grad) && (!this.PRODUCTION_GATE || this._tierProduced(t));
      if(ok && achieved) current=t;
      else { ok=false; if(!next) next=t; }
    });
    let effort=0, sigma=0, hasSigma=false; const nextAtoms=[];
    if(next){ (next.atoms||[]).forEach(a=>{ if(!grad(a.ch)){ effort++; nextAtoms.push(a.ch);
      try{ const s=(typeof substitution==='function')&&substitution(a.ch); if(s&&s.d!=null){ sigma+=s.d; hasSigma=true; } }catch(e){} } }); }
    const nextTotal=next?(next.atoms||[]).length:0;
    return { current, next, effort, nextAtoms, sigma:hasSigma?Math.round(sigma*10)/10:null,
             gated:this.PRODUCTION_GATE,
             example:this.capabilityExample(),
             nextPct: nextTotal?Math.round((nextTotal-effort)/nextTotal*100):100 };
  },

  // A concrete now-producible sentence: shortest example-bank sentence whose every
  // deck-atom has graduated. Honest — it's something the learner can actually assemble.
  capabilityExample(){
    let bank; try{ bank=(typeof EXAMPLE_SENTENCES!=='undefined')?EXAMPLE_SENTENCES:null; }catch(e){ bank=null; }
    if(!bank) return null;
    const gradSet=new Set();
    for(let i=0;i<D.length;i++){ try{ if(Scheduler._isGraduatedEff(S, i)) gradSet.add(D[i][0]); }catch(e){} }  // EFF: honest example uses the cutover verdict
    if(!gradSet.size) return null;
    let best=null;
    Object.keys(bank).forEach(k=>{
      (bank[k]||[]).forEach(s=>{
        const zh=s&&s[0]; if(!zh) return;
        let atoms=[]; try{ atoms=(typeof sentenceAtomsInOrder==='function')?sentenceAtomsInOrder(zh).map(a=>a.w):[]; }catch(e){ return; }
        if(atoms.length>=2 && atoms.every(w=>gradSet.has(w))){
          if(!best || zh.length<best.zh.length) best={ zh:zh, en:s[2]||s[1]||'' };
        }
      });
    });
    return best;
  }
};
try{ window.Estimator=Estimator; }catch(e){}

// Yield Curve render (replaces the daily-goal quota bar). Rising/cumulative; the
// FLATTENING past the knee is the honest "diminishing returns — come back tomorrow",
// never a goal to hit. Dose-test instrument (THEORY.md §9).
function renderYieldCurve(fg){
  const host=document.getElementById('yieldCurve'); if(!host) return;
  const c=Estimator.curve();
  const pts=c.points, maxN=c.maxN, knee=Math.max(1,Math.min(maxN,c.knee||1));
  const Vmax=pts[pts.length-1].V||1;
  const today=new Date().toDateString();
  const doneToday=(S.dailyDate===today)?(S.dailyCards||0):0;
  const W=320, H=54, padL=3, padR=3, padT=7, padB=8;
  const x=n=>padL+(maxN<=1?0:(n-1)/(maxN-1))*(W-padL-padR);
  const y=V=>padT+(1-V/Vmax)*(H-padT-padB);
  let d=''; pts.forEach((p,k)=>{ d+=(k===0?'M':'L')+x(p.n).toFixed(1)+' '+y(p.V).toFixed(1)+' '; });
  const kneeX=x(knee).toFixed(1);
  const dn=Math.max(1,Math.min(maxN,doneToday||1));
  const dotX=x(dn).toFixed(1), dotY=y(pts[dn-1].V).toFixed(1);
  const past=doneToday>=knee;
  const dim='rgba(125,255,192,0.30)';
  const plural=n=>'card'+(n===1?'':'s');
  const left=Math.max(0,knee-doneToday);
  const note = past ? (c.pools.idle>0 ? "today's high-value window spent — the rest is low-yield"
                                      : "today's window spent — rest and return tomorrow")
                    : (doneToday>0 ? left+' high-value '+plural(left)+' left today'
                                   : '~'+knee+' high-value '+plural(knee)+' today');
  host.innerHTML =
    '<div style="display:flex;justify-content:space-between;font-size:7px;letter-spacing:1.5px;opacity:.7;margin-bottom:3px;">'
      +'<span>YIELD</span><span>'+doneToday+' DONE · KNEE '+knee+'</span></div>'
    +'<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:'+H+'px;display:block;overflow:visible;">'
      +'<line x1="'+kneeX+'" y1="0" x2="'+kneeX+'" y2="'+H+'" stroke="'+dim+'" stroke-width="1" stroke-dasharray="2 3" vector-effect="non-scaling-stroke"/>'
      +'<path d="'+d.trim()+'" fill="none" stroke="'+fg+'" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke" opacity="0.92"/>'
      +'<circle cx="'+dotX+'" cy="'+dotY+'" r="3.5" fill="'+fg+'"/>'
    +'</svg>'
    +'<div style="font-size:7px;letter-spacing:1px;opacity:.55;margin-top:2px;">'+note.toUpperCase()+'</div>';
}

function show(view){
  $('home').style.display=view==='home'?'flex':'none';
  $('session').style.display=view==='session'?'flex':'none';
  $('mc').style.display=view==='mc'?'flex':'none';
  $('radDetail').style.display=view==='radDetail'?'flex':'none';
  $('charDetail').style.display=view==='charDetail'?'flex':'none';
  if($('atomCard')) $('atomCard').style.display=view==='atomCard'?'flex':'none';
  $('tone').style.display=view==='tone'?'flex':'none';
  $('deckMgr').style.display=view==='deckMgr'?'flex':'none';
  $('study').style.display=view==='study'?'flex':'none';
  if(view!=='study' && $('studyPOS')) $('studyPOS').style.display='none';
  $('summary').style.display=view==='summary'?'flex':'none';
  $('wordSearch').style.display=view==='wordSearch'?'flex':'none';
  if($('stats')) $('stats').style.display=view==='stats'?'flex':'none';
  try{ if(view!=='study' && typeof hideCardExplain==='function') hideCardExplain(); }catch(e){} // WHY-THIS-CARD caption only during study
}

function renderStats(){
  const body=document.getElementById('statsBody');
  if(!body) return;
  // Refresh the relocated meta-game + settings (moved here off the home command center)
  if($('xp')) $('xp').textContent=S.xp;
  if($('lvl')) $('lvl').textContent=Math.floor(S.xp/100)+1;
  if($('streak')) $('streak').textContent=S.streak;
  if($('multDisplay')) $('multDisplay').style.display='none';   // streak multiplier killed (XP reevaluation)
  if($('muteBtn')) $('muteBtn').textContent='SOUND: '+S.sound.toUpperCase();
  try{ if(typeof renderTTSStatus==='function') renderTTSStatus(); }catch(e){}
  const st=(S.stats&&typeof S.stats==='object')?S.stats:{days:{},totalAnswers:0,totalCorrect:0,byModality:{}};
  const totA=st.totalAnswers||0, totC=st.totalCorrect||0;
  const acc=totA?Math.round(totC/totA*100):0;

  // Daily aggregates
  const dayKeys=Object.keys(st.days||{}).sort(function(a,b){return new Date(a)-new Date(b);});
  const daysActive=dayKeys.length;
  let sumL=0,nL=0;
  dayKeys.forEach(function(k){var d=st.days[k]; sumL+=d.sumLatency||0; nL+=d.latencyN||0;});
  const avgLatMs=nL?sumL/nL:0;
  const avgL=nL?(avgLatMs/1000).toFixed(1)+'s':'—';

  // Frontier + velocity
  const fr=frontier();
  let running=0; const newByDay={};
  dayKeys.forEach(function(k){var f=st.days[k].frontier||running; newByDay[k]=Math.max(0,f-running); running=Math.max(running,f);});
  const weekAgo=Date.now()-7*86400000;
  let wkNew=0; dayKeys.forEach(function(k){if(new Date(k).getTime()>=weekAgo) wkNew+=newByDay[k];});
  const avgPerSession=daysActive?(fr/daysActive).toFixed(1):'—';
  const xpVel=daysActive?Math.round((S.xp||0)/daysActive):0;

  // Card sweep — mastery bands, lapse rate, flip time, axis stages, working batch
  var mBands=[0,0,0,0], totalLapses=0, totalReps=0, totalFlipMs=0, flipN=0;
  var axisStageSum={meaning:0,pos:0}, axisCardN=0;
  var axisDiff=0, axisDiffN=0;
  var workingBatch=0;
  var totalAxisStages=0, totalAxisReps=0;
  for(var i=0;i<D.length;i++){
    var ci=S.cards[i]; if(!ci) continue;
    var s=state(i);
    mBands[s]=(mBands[s]||0)+1;
    totalLapses+=(ci.lapses||0);
    totalReps+=(ci.reps||0)+(ci.lapses||0);
    if(ci.flipMs>0){totalFlipMs+=ci.flipMs; flipN++;}
    if(ci.seen&&s<3) workingBatch++;
    if(ci.axisStage){
      var ms=ci.axisStage.meaning||0, ps=ci.axisStage.pos||0;
      axisStageSum.meaning+=ms; axisStageSum.pos+=ps; axisCardN++;
      totalAxisStages+=ms+ps;
      if(ci.seen){axisDiff+=Math.abs(ms-ps); axisDiffN++;}
    }
    if(ci.axisReps){totalAxisReps+=(ci.axisReps.meaning||0)+(ci.axisReps.pos||0);}
  }
  const lapseRate=totalReps?Math.round(totalLapses/totalReps*100):0;
  const avgFlip=flipN?(totalFlipMs/flipN/1000).toFixed(1)+'s':'—';
  const avgMeaning=axisCardN?(axisStageSum.meaning/axisCardN).toFixed(1):'—';
  const avgPos=axisCardN?(axisStageSum.pos/axisCardN).toFixed(1):'—';
  const avgAxisGap=axisDiffN?(axisDiff/axisDiffN).toFixed(2):null;
  const adaptRatio=totalAxisReps?(totalAxisStages/totalAxisReps):null;

  // Per-mode breakdown (sorted by answer count)
  const modOrder=['flash','mc','tone','cloze','comprehension','word-order','pos','sentence','unknown'];
  const modRows=modOrder.map(function(mod){
    var mm=st.byModality&&st.byModality[mod]; if(!mm||!mm.answers) return null;
    var a=Math.round(mm.correct/mm.answers*100);
    var lat=(mm.latencyN&&mm.sumLatency)?(mm.sumLatency/mm.latencyN/1000).toFixed(1)+'s':'—';
    return {mod:mod,a:a,n:mm.answers,lat:lat};
  }).filter(Boolean);

  // LQ component scores
  const speedScore=avgLatMs>0?Math.min(100,Math.max(0,Math.round(150-avgLatMs/1000*25))):null;
  const accScore=totA>=10?acc:null;
  const adaptScore=adaptRatio!==null&&totalAxisReps>10?Math.min(100,Math.round(adaptRatio*250)):null;
  var lqParts=[], lqWeights=[];
  if(speedScore!==null){lqParts.push(speedScore*0.25); lqWeights.push(0.25);}
  if(accScore!==null){lqParts.push(accScore*0.50); lqWeights.push(0.50);}
  if(adaptScore!==null){lqParts.push(adaptScore*0.25); lqWeights.push(0.25);}
  var totalW=lqWeights.reduce(function(a,b){return a+b;},0);
  var lq=totalW>0?Math.round(lqParts.reduce(function(a,b){return a+b;},0)/totalW):null;

  // Callout copy
  var accComment=!totA?'no data yet':acc>=90?'suspicious. lower your wager.':acc>=75?'adequate.':acc>=60?'at least you\'re trying.':'consistent failure is still data.';
  var reactionComment=!nL?'—':avgLatMs<2000?'twitchy. let it marinate.':avgLatMs<4000?'decent.':avgLatMs<7000?'taking your time.':'are you asleep between cards?';
  var streakComment=(S.streak||0)>=14?'actually impressive.':(S.streak||0)>=7?'tolerable.':(S.streak||0)>=2?'don\'t stop now.':'open the app tomorrow.';
  var lqComment=lq===null?'study more first.':lq>=85?'above average. keep going.':lq>=65?'developing.':lq>=40?'early signal — come back.':'raw. that\'s fine.';
  var axisComment=!avgAxisGap?'—':parseFloat(avgAxisGap)>0.8?'you know what words mean. you\'re shaky on what they do. fix it.':parseFloat(avgAxisGap)>0.3?'minor structural gap. expected at this stage.':'axes tracking together.';

  // Render helpers
  var bar10=function(pct){var f=Math.round(Math.min(100,Math.max(0,pct))/10); return '█'.repeat(f)+'░'.repeat(10-f);};
  var tile=function(label,val,note){return '<div style="flex:1;border:2px solid currentColor;padding:10px 6px;text-align:center;"><div style="font-size:22px;line-height:1;font-weight:bold;">'+val+'</div><div style="font-size:7px;opacity:.6;margin-top:4px;letter-spacing:1px;">'+label+'</div>'+(note?'<div style="font-size:6px;opacity:.45;margin-top:3px;font-style:italic;">'+note+'</div>':'')+'</div>';};
  var row=function(l,v){return '<div style="display:flex;justify-content:space-between;font-size:9px;margin-top:5px;"><span style="opacity:.8;">'+l+'</span><span>'+v+'</span></div>';};
  var sect=function(title,content){return '<div style="border:2px solid currentColor;padding:10px;margin-top:10px;"><div style="font-size:7px;opacity:.55;letter-spacing:2px;margin-bottom:8px;">'+title+'</div>'+content+'</div>';};
  var brow=function(label,score){var s=score!==null?score:'—'; var b=score!==null?'<span style="letter-spacing:-2px;font-size:9px;">'+bar10(score)+'</span>':'<span style="opacity:.4;">no data</span>'; return '<div style="display:flex;align-items:center;gap:6px;margin-top:5px;font-size:9px;"><span style="width:90px;opacity:.8;">'+label+'</span>'+b+'<span style="width:24px;text-align:right;opacity:.9;">'+s+'</span></div>';};
  var fmt=function(k){var d=new Date(k); return (d.getMonth()+1)+'/'+d.getDate();};

  var html='';

  // Header
  html+='<div style="font-size:7px;opacity:.45;letter-spacing:3px;margin-bottom:8px;">'+((activeCourse()&&activeCourse().langName)||'MANDARIN').toUpperCase()+' · APTITUDE READOUT · n='+totA+'</div>';

  // Hero tiles
  html+='<div style="display:flex;gap:8px;">'+tile('ACCURACY',totA?acc+'%':'—',accComment)+tile('REACTION',avgL,reactionComment)+tile('STREAK',S.streak||0,streakComment)+'</div>';

  // Acquisition velocity
  html+=sect('ACQUISITION VELOCITY',
    row('FRONTIER', fr+' / '+D.length+' WORDS')+
    row('NEW THIS WEEK', wkNew)+
    row('AVG NEW / ACTIVE DAY', avgPerSession)+
    row('DAYS ACTIVE', daysActive)+
    row('TOTAL ANSWERS', totA)+
    row('XP VELOCITY', xpVel?xpVel+' XP / DAY':'—')
  );

  // Accuracy curve
  var last7=dayKeys.slice(-7);
  var curve='';
  if(!last7.length){
    curve='<div style="font-size:8px;opacity:.5;">no sessions yet.</div>';
  } else {
    last7.forEach(function(k){
      var d=st.days[k]; var a=d.answers?Math.round(d.correct/d.answers*100):0;
      curve+='<div style="display:flex;align-items:center;gap:6px;margin-top:4px;font-size:8px;"><span style="width:30px;opacity:.6;">'+fmt(k)+'</span><div style="flex:1;height:8px;border:1px solid currentColor;"><div style="height:100%;width:'+a+'%;background:currentColor;"></div></div><span style="width:52px;text-align:right;opacity:.8;">'+a+'%·'+d.answers+'</span></div>';
    });
  }
  html+=sect('ACCURACY — LAST '+last7.length+' ACTIVE DAYS', curve);

  // Response profile by mode
  if(modRows.length){
    var modeHtml='';
    modRows.forEach(function(r){
      modeHtml+='<div style="display:flex;align-items:center;gap:6px;margin-top:4px;font-size:8px;"><span style="width:66px;opacity:.8;">'+r.mod.toUpperCase()+'</span><span style="letter-spacing:-2px;font-size:9px;">'+bar10(r.a)+'</span><span style="opacity:.9;width:38px;text-align:right;">'+r.a+'%</span><span style="opacity:.5;width:32px;text-align:right;">'+r.lat+'</span></div>';
    });
    html+=sect('RESPONSE PROFILE — ACCURACY &amp; REACTION BY MODE', modeHtml);
  }

  // Axis profile
  html+=sect('AXIS PROFILE — STRUCTURAL PERCEPTION',
    row('MEANING AVG STAGE', avgMeaning+' / 3')+
    row('POS AVG STAGE', avgPos+' / 3')+
    row('AXIS GAP (meaning−pos)', avgAxisGap!==null?avgAxisGap:'—')+
    '<div style="font-size:7px;opacity:.5;margin-top:8px;font-style:italic;">'+axisComment+'</div>'
  );

  // Card health
  html+=sect('CARD HEALTH',
    row('UNSEEN', mBands[0])+
    row('LEARNING', mBands[1])+
    row('FAMILIAR', mBands[2])+
    row('MASTERED', mBands[3])+
    row('WORKING BATCH', workingBatch+' active')+
    row('LAPSE RATE', lapseRate+'%')+
    row('AVG FLASH TIME', avgFlip)
  );

  // Aptitude signals
  var aptiHtml=brow('SPEED',speedScore)+brow('ACCURACY',accScore)+brow('ADAPTATION',adaptScore);
  aptiHtml+='<div style="margin-top:10px;display:flex;justify-content:space-between;font-size:10px;font-weight:bold;"><span>COMPOSITE LQ</span><span>'+(lq!==null?lq:'—')+'</span></div>';
  aptiHtml+='<div style="font-size:7px;opacity:.45;margin-top:3px;font-style:italic;">'+lqComment+'</div>';
  aptiHtml+='<div style="font-size:6px;opacity:.3;margin-top:10px;">speed (25%) · accuracy (50%) · adaptation rate (25%) · minimum n=10 to score · this is not a clinical instrument</div>';
  html+=sect('APTITUDE SIGNALS — LINGUISTICS QUOTIENT', aptiHtml);

  body.innerHTML=html;
}

let cardShownAt=0, queueIdx=0;
const sessionSeen=new Map(); // idx -> times seen this session

function startSession(){
  queue=buildQueue();
  queueIdx=0;
  combo=0;
  sessionSeen.clear();
  show('session');
  advanceCard();
}

function buildFlashQueue(){
  // Flashcard queue: always infinite. Due/unseen cards first, then
  // shuffle all unlocked. Never empty — refills from full unlocked set.
  const now=Date.now();
  const due=[],seen_=[],fresh=[];
  activeDeckIndices().forEach(i=>{
    if(!isUnlocked(i)) return;
    const ci=S.cards[i];
    if(!ci||!ci.seen) fresh.push(i);
    else if(ci.due<=now) due.push(i);
    else seen_.push(i);
  });
  // Priority: due > fresh > previously seen (shuffled each time)
  const q=shuffle(due).concat(shuffle(fresh)).concat(shuffle(seen_));
  return q.length ? q : activeDeckIndices().filter(i=>isUnlocked(i));
}

function advanceCard(){
  if(queueIdx>=queue.length){
    queue=buildFlashQueue();
    queueIdx=0;
  }
  clearCardState();
  cur=queue[queueIdx++];
  flipped=false;
  cardShownAt=Date.now();
  if(!S.uniqueSeen.includes(cur)){ S.uniqueSeen.push(cur); save(); }
  sessionSeen.set(cur,(sessionSeen.get(cur)||0)+1);
  tickSessionCard(); rollBg(); renderCard();
  const _fc1=cur; if(S.sound==='auto') setTimeout(()=>{ if(cur===_fc1) speakFront(); },350);
}

function inferRating(){
  const ms=Date.now()-cardShownAt;
  if(ms<3000)  return 4; // easy
  if(ms<8000)  return 3; // good
  if(ms<15000) return 2; // hard
  return 1;              // again
}

const RLABEL={1:'AGAIN',2:'HARD',3:'GOOD',4:'EASY'};

function renderCard(){
  const [ch,,def,rads,pos]=D[cur];
  $('rank').textContent='#'+(cur+1)+' / 100'+(cur<10?'  ★BOSS':'');
  // Session rings: each revisit adds an inset ring in next golden-angle hue
  try{
    const seen=Math.max(0,(sessionSeen.get(cur)||1)-1);
    const rings=[];
    for(let r=1;r<=Math.min(seen,5);r++){
      const rHue=Math.floor((bgHue+GA*r)%360);
      rings.push('inset 0 0 0 '+(r*5)+'px hsl('+rHue+',80%,55%)');
    }
    $('card').style.boxShadow=rings.length?rings.join(','):'none';
  }catch(e){ $('card').style.boxShadow='none'; }
  const m=masteryScore(cur);

  // Wrap each character in a tappable span (CJK only — space-mode treats word as one unit)
  const chars=[...ch]; // spread handles multi-char words
  if(chars.length===1 || (typeof _segMode==='function'&&_segMode()==='space')){
    $('hanzi').textContent=ch;
    $('hanzi').style.fontFamily=charFont().split(':')[1].trim();
    $('hanzi').style.cursor='default';
    $('hanzi').onclick=null;
  } else {
    const CJKh="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
    $('hanzi').innerHTML=chars.map((hc,hi)=>
      `<span style="cursor:pointer;${CJKh}" data-chi="${hi}">${hc}</span>`
    ).join('');
    $('hanzi').onclick=(e)=>{
      const span=e.target.closest('[data-chi]');
      if(!span) return;
      e.stopPropagation();
      const idx=+span.dataset.chi;
      openCharDetail(ch, idx, cur);
    };
  }

  // Pinyin always visible on front
  const ink=getComputedStyle(document.body).color;
  const py=$('pinyin'); py.innerHTML='';
  D[cur][1].forEach(([syl,t])=>{
    const s=document.createElement('span');
    s.textContent=syl; s.style.color=toneColor(t,ink);
    py.appendChild(s);
  });

  $('card-back-zone').style.display=flipped?'flex':'none';
  if($('card-back-zone').style.display==='flex') $('card-back-zone').style.borderTopColor=getComputedStyle(document.body).color;
  $('flipHint').style.display=flipped?'none':'block';
  $('flipHint').textContent=flipped?'':'TAP TO FLIP';
  if(flipped){
    $('def').textContent=def.toUpperCase();
    const posEl=$('pos');
    if(pos){
      // Show POS label and definition appropriate to user's current axis stage for this word
      const axStg=getAxisStage(cur,'pos');
      const {correct:posLabel, def:posDefText}=posDataForStage(pos, Math.max(1,axStg));
      // Stage 1: show broad category + definition
      // Stage 2+: show standard name + brief def
      // Stage 3+: show compound type if applicable
      const dispLabel=axStg<=1?posLabel:
                      axStg===2?posLabel.toUpperCase():
                      pos.toUpperCase(); // full precision at stage 3+
      const dispDef=axStg<=2&&posDefText?posDefText:
                    axStg>=3&&POS_LOGICAL[pos]?POS_LOGICAL[pos].def:'';
      posEl.innerHTML=
        '<span style="cursor:pointer;" class="posLabelSpan">'+dispLabel.toUpperCase()+'</span>'+
        (dispDef?'<br><span style="font-size:10px;opacity:.8;letter-spacing:.5px;">'+dispDef+'</span>':'');
      posEl.style.cursor='default';
      posEl.style.textDecoration='none';
      const lbl=posEl.querySelector('.posLabelSpan');
      if(lbl) lbl.onclick=(e)=>{e.stopPropagation();showPOSExplain(pos,lbl);};
    } else {
      posEl.textContent='';
    }
    // Sort radicals by stroke count, deduplicate by char
    const seen=new Set();
    const sortedRads=[...rads].sort((a,b)=>a[1]-b[1]).filter(([ch])=>{
      if(seen.has(ch)) return false; seen.add(ch); return true;
    });
    const CJK="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
    const radEl=$('radical'); radEl.innerHTML='';
    sortedRads.forEach(([rch],idx)=>{
      const ri=RADINFO[rch];
      const row=document.createElement('div');
      // Check if this radical's parent character has been introduced
      const radIntroduced=hasBeenIntroduced(rch)||!D.some(([ch])=>ch===rch);
      row.style.cssText='display:flex;align-items:center;gap:8px;padding:4px 0;'+(radIntroduced?'cursor:pointer;':'opacity:.5;');
      if(!ri){
        row.innerHTML=`<span style="font-size:20px;${CJK}">${radIntroduced?rch:CHAR_MASK}</span>`;
      } else {
        const [py,en,canon,note]=ri;
        const canonNote=canon
          ? ` <span style="font-size:7px;opacity:.75;${CJK}">(${note} of ${canon})</span>`
          :'';
        row.innerHTML=`<span style="font-size:20px;${CJK}">${rch}</span><span style="font-size:8px;font-family:'Noto Sans','Arial Unicode MS','Helvetica Neue',Arial,sans-serif"> ${py} · ${en.toUpperCase()}${canonNote}</span>`;
      }
      const fg=getComputedStyle(document.body).color;
      row.style.borderBottom=idx<sortedRads.length-1?`1px solid ${fg}`:'none';
      row.onclick=(e)=>{ e.stopPropagation(); openRadDetail(rch); };
      radEl.appendChild(row);
    });
  }
  $('sxp').textContent='XP '+S.xp;
  $('combo').textContent=combo>1?'COMBO x'+combo:'';
  if(!flipped) $('rateLabel').textContent='';
}

function flip(){
  if(!flipped){
    // Tap 1: reveal back, speak English
    flipped=true; renderCard();
    const _fc2=cur; if(S.sound==='auto'||S.sound==='tap') setTimeout(()=>{ if(cur===_fc2) speakBack(); },200);
  } else {
    // Tap 2: advance to next card. No SRS write — flashcard is exposure only.
    combo++;
    S.xp+=Math.round((combo>=5?20:10)*fatigueXPMultiplier());
    const today=new Date().toDateString();
    if(S.lastDay!==today){
      const y=new Date(Date.now()-DAY).toDateString();
      S.streak=(S.lastDay===y)?S.streak+1:1;
      S.lastDay=today;
    }
    save();
    $('sxp').classList.remove('xppop'); void $('sxp').offsetWidth; $('sxp').classList.add('xppop');
    $('rateLabel').textContent='';
    $('streakbar').textContent=combo>=5?'!!! HOT STREAK — 2X XP !!!':'';
    advanceCard();
  }
}

function endSession(){
  goHome();
}


/* ============ MULTIPLE CHOICE ============ */
let mcQueue=[],mcIdx=0,mcCur=-1,mcCombo=0,mcLocked=false,mcReverse=false;
// ── SESSION HISTORY ─────────────────────────────────────────────
// Unified per-word, per-modality encounter tracking.
// Key format: "{deckIdx}:{modalityKey}"
// Modality keys: 'flash', 'mc-fwd', 'mc-rev', 'pos-s1', 'pos-s2', 'pos-s3', 'tone'
// Flash entries: {type:'flash'} — exposure only, no correct/wrong
// Challenge entries: {type:'challenge', ok:bool, ms:number}
// This is the single source of truth for ring rendering across all modalities.

const sessionHistory=new Map(); // "{idx}:{modality}" -> [{type,ok?,ms?}]
const sessionFlashCount=new Map(); // idx -> number of flips this session

const SESSION_RING_KEY='earworm-session-rings';

function saveSessionRings(){
  try{
    sessionStorage.setItem(SESSION_RING_KEY, JSON.stringify({
      history: [...sessionHistory.entries()],
      flash:   [...sessionFlashCount.entries()],
    }));
  }catch(e){}
}

function loadSessionRings(){
  try{
    const raw=sessionStorage.getItem(SESSION_RING_KEY);
    if(!raw) return;
    const {history,flash}=JSON.parse(raw);
    if(Array.isArray(history)) history.forEach(([k,v])=>sessionHistory.set(k,v));
    if(Array.isArray(flash))   flash.forEach(([k,v])=>sessionFlashCount.set(k,v));
  }catch(e){}
}

// Persist rings when page is hidden (tab switch, minimize, lock screen)
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden') saveSessionRings();
});

// ── SESSION HISTORY API ─────────────────────────────────────────

// Record a flashcard exposure (no correct/wrong signal)
function recordFlashExposure(idx){
  sessionFlashCount.set(idx,(sessionFlashCount.get(idx)||0)+1);
}

// Record a challenge result (MC, POS, tone, or any future modality)
function recordChallengeResult(idx, modalityKey, isCorrect, ms){
  const key=idx<0?'cat:'+modalityKey:idx+':'+modalityKey;
  const hist=sessionHistory.get(key)||[];
  hist.push({type:'challenge', ok:isCorrect, ms:ms||0});
  if(hist.length>8) hist.shift(); // keep last 8 per modality
  sessionHistory.set(key,hist);
}

// Get challenge history for a specific word+modality
function getChallengeHistory(idx, modalityKey){
  return sessionHistory.get(idx+':'+modalityKey)||[];
}
// Category-level history (idx=-1 means keyed by modality string alone)
function getCatHistory(modalityKey){
  return sessionHistory.get('cat:'+modalityKey)||[];
}

// ── RING RENDERERS ───────────────────────────────────────────────

// Render flash exposure rings onto an element
// Pure exposure count — golden-angle hues, neutral opacity, inset
function renderFlashRings(idx, el){
  const count=Math.min(sessionFlashCount.get(idx)||0, 6);
  if(!count){ el.style.boxShadow='none'; return; }
  const rings=[];
  for(let r=1;r<=count;r++){
    const hue=Math.floor((bgHue+GA*r)%360);
    rings.push('inset 0 0 0 '+(r*4)+'px hsla('+hue+',65%,55%,0.5)');
  }
  el.style.boxShadow=rings.join(',');
}

// Render challenge rings for a specific word+modality onto an element
// Correct → inset, golden-angle hue, vivid
// Wrong   → outset, same hue progression, dark/desaturated (never shifts content)
function renderChallengeRings(idx, modalityKey, el){
  // idx=-1 means category-level key (used for stage 1 grammar questions)
  const hist=idx<0?getCatHistory(modalityKey):getChallengeHistory(idx,modalityKey);
  if(!hist.length){ el.style.boxShadow='none'; return; }
  const inR=[],outR=[]; let ic=0,oc=0;
  hist.forEach((entry,i)=>{
    const hue=Math.floor((bgHue+GA*(i+1))%360);
    if(entry.ok){
      ic++;
      inR.push('inset 0 0 0 '+(ic*5)+'px hsla('+hue+',70%,55%,0.75)');
    } else {
      oc++;
      outR.push('0 0 0 '+(oc*6)+'px hsla('+hue+',25%,22%,0.7)');
    }
  });
  el.style.boxShadow=[...outR,...inR].join(',')||'none';
}

// Legacy mcHistory alias — keeps old code working during transition
const mcHistory={
  get:(k)=>{ const h=getChallengeHistory(k,'mc-fwd'); return h.map(e=>e.ok); },
  set:()=>{},
  clear:()=>{ sessionHistory.clear(); sessionFlashCount.clear(); try{ sessionStorage.removeItem(SESSION_RING_KEY); }catch(e){} },
};

function startMC(){
  mcQueue=buildQueue();
  mcIdx=0; mcCombo=0;
  mcReverse=false;
  mcHistory.clear();
  resetSessionFatigue();
  startSessionLog('mc');
  show('mc');
  nextMC();
}

function nextMC(){
  if(mcIdx>=mcQueue.length){
    // Rebuild queue — SRS may have new due cards; always keep session alive
    mcQueue=buildQueue();
    if(!mcQueue.length) mcQueue=activeDeckIndices().filter(i=>isUnlocked(i));
    mcIdx=0;
  }
  clearCardState();
  mcCur=mcQueue[mcIdx++];
  mcLocked=false;
  tickSessionCard(); rollBg();
  renderMC();
  // Only speak on show in forward mode (character is prompt)
  if(!mcReverse && S.sound==='auto') speak(D[mcCur][0],activeCourse().langCode);
}


/* ============ DISTRACTOR SELECTION ============ */
// Plausible distractors: prefer same part-of-speech and nearby frequency,
// then shared radical, then fill from remaining deck. Never duplicate the
// correct meaning. Tiered so the buttons are challenging but fair.
/* ============ DISTRACTOR ENGINE ============ */
// Scores candidates by: POS match, relative frequency proximity,
// shared radical. Filters to unlocked words only. Works for both
// forward (definition distractors) and reverse (character distractors).

function scoreCandidate(targetIdx, candidateIdx){
  const [,,, targetRads, targetPos] = D[targetIdx];
  const [,,, cRads, cPos] = D[candidateIdx];
  const targetRadSet = new Set((targetRads||[]).map(r=>r[0]));

  let score = 0;

  // POS match: most important signal
  if(cPos && cPos === targetPos) score += 3;

  // Relative frequency proximity: score falls off with distance
  // Use log scale so extremes (rank 1 vs rank 100) aren't penalised unfairly
  const dist = Math.abs(candidateIdx - targetIdx);
  const proxWindow = Math.max(10, Math.floor(D.length * 0.15)); // 15% of deck
  score += Math.max(0, 4 * (1 - dist / proxWindow));

  // Shared radical: semantic/visual confusion potential
  if((cRads||[]).some(r => targetRadSet.has(r[0]))) score += 2;

  // Random jitter for variety
  score += Math.random();

  return score;
}

function pickDistractors(targetIdx, n){
  const [,, correctDef] = D[targetIdx];
  const usedDefs = new Set([correctDef]);

  const scored = D.map((_,i) => {
    if(i === targetIdx) return null;
    if(!(S.cards[i]&&S.cards[i].seen)) return null;  // introduced (flashed) only — never-test-before-flash invariant
    const def = D[i][2];
    if(usedDefs.has(def)) return null;       // no synonym collision
    return { i, def, score: scoreCandidate(targetIdx, i) };
  }).filter(Boolean);

  scored.sort((a,b) => b.score - a.score);

  const poolSize = Math.min(scored.length, Math.max(n * 3, 12));
  const pool = scored.slice(0, poolSize);
  shuffle(pool);

  const out = [];
  for(const cand of pool){
    if(usedDefs.has(cand.def)) continue;
    out.push(cand.def);
    usedDefs.add(cand.def);
    if(out.length >= n) break;
  }

  // Fallback: fill from any unlocked word
  if(out.length < n){
    for(let i = 0; i < D.length && out.length < n; i++){
      if(!(S.cards[i]&&S.cards[i].seen)) continue;
      const def = D[i][2];
      if(!usedDefs.has(def)){ out.push(def); usedDefs.add(def); }
    }
  }
  return out;
}

function pickCharDistractors(targetIdx, n){
  // For reverse mode: character distractors scored same way
  const [correctCh,,, targetRads, targetPos] = D[targetIdx];
  const usedChars = new Set([correctCh]);

  // CONFUSION GRAPH first — contrastive distractors (the pairs the learner actually blurs)
  const confChars=[];
  confusionDistractorIdx(targetIdx,n).forEach(j=>{ const ch=D[j][0]; if(ch&&!usedChars.has(ch)){ confChars.push(ch); usedChars.add(ch); } });

  const scored = D.map((_,i) => {
    if(i === targetIdx) return null;
    if(!(S.cards[i]&&S.cards[i].seen)) return null;  // introduced (flashed) only — never-test-before-flash invariant
    const ch = D[i][0];
    if(usedChars.has(ch)) return null;
    return { i, ch, score: scoreCandidate(targetIdx, i) };
  }).filter(Boolean);

  scored.sort((a,b) => b.score - a.score);

  const poolSize = Math.min(scored.length, Math.max(n * 3, 12));
  const pool = scored.slice(0, poolSize);
  shuffle(pool);

  const out = confChars.slice(0, n);   // confusion distractors lead; pool fills the rest
  for(const cand of pool){
    if(usedChars.has(cand.ch)) continue;
    out.push(cand.ch);
    usedChars.add(cand.ch);
    if(out.length >= n) break;
  }

  // Fallback
  if(out.length < n){
    for(let i = 0; i < D.length && out.length < n; i++){
      if(!(S.cards[i]&&S.cards[i].seen)) continue;
      const ch = D[i][0];
      if(!usedChars.has(ch)){ out.push(ch); usedChars.add(ch); }
    }
  }
  return out;
}

function updateMCSubmode(){
  const fg=getComputedStyle(document.body).color;
  ['mc-fwd','mc-rev'].forEach(id=>{
    const b=$(id); if(!b) return;
    b.style.borderColor=fg; b.style.color=fg;
  });
  $('mc-fwd').classList.toggle('active',!mcReverse);
  $('mc-rev').classList.toggle('active',mcReverse);
}

function renderMC(){
  const [ch,syls,def,,] = D[mcCur];
  $('mc-rank').textContent='#'+(mcCur+1)+' / 100';
  // Show active modality on card
  const mcModeEl=document.getElementById('mc-modality');
  if(mcModeEl){ mcModeEl.textContent=mcReverse?'MEANING → CHARACTER':'CHARACTER → MEANING'; }
  updateMCSubmode();

  // Apply answer-history rings to mc-prompt
  const mcHist=mcHistory.get(mcCur)||[];
  const inRings=[],outRings=[];
  let inCount=0,outCount=0;
  mcHist.forEach(wasCorrect=>{
    if(wasCorrect){
      inCount++;
      const rHue=Math.floor((bgHue+GA*inCount)%360);
      inRings.push('inset 0 0 0 '+(inCount*5)+'px hsl('+rHue+',80%,55%)');
    } else {
      outCount++;
      outRings.push('0 0 0 '+(outCount*6)+'px rgba(0,0,0,0.35)');
    }
  });
  const mcBorderShadow=[...outRings,...inRings].join(',');
  $('mc-prompt').style.boxShadow=mcBorderShadow||'none';

  const ink=getComputedStyle(document.body).color;
  const CJKf="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  const fg=getComputedStyle(document.body).color;

  if(!mcReverse){
    // FORWARD: show character + pinyin, pick English definition
    $('mc-hanzi').textContent=ch;
    $('mc-hanzi').style.fontSize='56px';
    $('mc-hanzi').style.fontFamily=charFont().split(':')[1].trim();
    const pp=$('mc-pinyin'); pp.innerHTML='';
    if(!(typeof _readingRedundant==='function'&&_readingRedundant())) syls.forEach(([syl,t])=>{
      const s=document.createElement('span');
      s.textContent=syl; s.style.color=toneColor(t,ink);
      pp.appendChild(s);
    });

    const stage=meaningStage(masteryScore(mcCur));
    const [nChoices, mcGrid]=adaptiveChoiceCount(mcCur,'mc-fwd');
    const correct=def;
    const distractors=pickMeaningDistractors(mcCur,nChoices-1,stage);
    const choices=shuffle([correct,...distractors]);
    const box=$('mc-choices'); box.innerHTML='';
    box.style.gridTemplateColumns=mcGrid;
    mcConfidence=null;
    addConfidenceButtons(box.parentElement||box, v=>{ mcConfidence=v; }, fg);
    choices.forEach(choiceDef=>{
      const b=document.createElement('button');
      b.className='choice';
      b.textContent=choiceDef.toUpperCase();
      b.style.cssText='font-size:'+(stage===1?'10px':'9px')+';border-color:'+fg+';color:'+fg+';';
      b.onclick=()=>pickMC(b,choiceDef,correct);
      box.appendChild(b);
    });

  } else {
    // REVERSE: show English definition, pick correct character
    const [,,,, mcPos]=D[mcCur];
    const mcPosLabel=mcPos||'';
    const mcFr=frontier();
    let mcPosDisplay='';
    if(mcPosLabel){
      const mcZhPos=POS_ZH[mcPosLabel]||'';
      if(mcFr<200) mcPosDisplay=mcPosLabel.toUpperCase();
      else if(mcFr<500) mcPosDisplay=mcPosLabel.toUpperCase()+(mcZhPos?' · '+mcZhPos:'');
      else mcPosDisplay=mcZhPos||mcPosLabel.toUpperCase();
    }
    $('mc-hanzi').innerHTML=
      '<span style="font-size:18px;font-family:inherit">'+def.toUpperCase()+'</span>'+
      (mcPosDisplay?'<br><span style="font-size:9px;opacity:.65;letter-spacing:1px;">'+mcPosDisplay+'</span>':'');
    $('mc-pinyin').innerHTML='';

    // Reverse: adaptive choice count
    const correct=ch;
    const [nRevC, revGrid]=adaptiveChoiceCountReverse(mcCur);
    const distChars=pickCharDistractors(mcCur,nRevC-1);
    const choices=shuffle([correct,...distChars]);

    const box=$('mc-choices'); box.innerHTML='';
    box.style.gridTemplateColumns=revGrid;
    choices.forEach(choiceCh=>{
      const b=document.createElement('button');
      b.className='choice';
      b.style.cssText='font-size:28px;'+CJKf;
      b.style.borderColor=fg; b.style.color=fg;
      b.textContent=choiceCh;
      b.onclick=()=>pickMC(b,choiceCh,correct);
      box.appendChild(b);
    });
  }

  $('mc-xp').textContent='XP '+S.xp;
  $('mc-combo').textContent=mcCombo>1?'COMBO x'+mcCombo:'';
  $('mc-streak').textContent='';
  $('mc-explain').textContent='';
  const dnk=$('mc-dontknow');
  dnk.style.borderColor=getComputedStyle(document.body).color;
  dnk.style.color=getComputedStyle(document.body).color;
  dnk.disabled=false; dnk.style.opacity='.7';
}

function pickMC(btn,chosen,correct){
  if(mcLocked) return;
  mcLocked=true;
  const fg=getComputedStyle(document.body).color;
  const isCorrect=chosen===correct;

  // Highlight all tiles
  document.querySelectorAll('.choice').forEach(b=>{
    if(b.textContent===correct.toUpperCase()) b.classList.add('correct');
    else if(b===btn && !isCorrect) b.classList.add('wrong');
    b.style.pointerEvents='none';
  });

  const r=isCorrect?inferRating():1;
  rate(mcCur,r);
  // Record answer in history for ring display
  const hist=mcHistory.get(mcCur)||[];
  hist.push(isCorrect);
  mcHistory.set(mcCur,hist);
  logAnswer(mcCur,isCorrect,'mc',cardShownAt?Date.now()-cardShownAt:null);

  const stage=meaningStage(masteryScore(mcCur));
  const confident=mcConfidence==='sure';
  const unsure=mcConfidence==='unsure';

  if(isCorrect){
    mcCombo++;
    // Confidence weighting: sure+correct = full mastery gain, unsure+correct = half
    const masteryGain=confident?1.2:unsure?0.6:1.0;
    const xpGain=confident?12:unsure?8:10;
    S.xp+=Math.round(xpGain*(mcCombo>=5?2:1)*fatigueXPMultiplier());
    $('mc-explain').textContent=confident?'':'';
  } else {
    mcCombo=0;
    // Confident+wrong = bigger penalty (overconfidence)
    const masteryLoss=confident?-0.8:unsure?-0.2:-0.5;
    const CJKe="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
    const [correctCh,,correctDef]=D[mcCur];
    const isRev=mcReverse;
    // Stage-aware feedback: more instructive at low stages
    let msg='';
    if(!isRev){
      msg='✗ '+chosen.toUpperCase()+' → ✓ '+correctDef.toUpperCase();
    } else {
      msg='✗ '+chosen+' → ✓ '+correctCh;
    }
    $('mc-explain').textContent=msg;
    if(isRev) $('mc-explain').style.fontFamily=CJKe;
    else $('mc-explain').style.fontFamily='inherit';
  }
  const today=new Date().toDateString();
  if(S.lastDay!==today){
    const y=new Date(Date.now()-DAY).toDateString();
    S.streak=(S.lastDay===y)?S.streak+1:1;
    S.lastDay=today;
  }
  save();
  $('mc-xp').classList.remove('xppop'); void $('mc-xp').offsetWidth; $('mc-xp').classList.add('xppop');
  $('mc-combo').textContent=mcCombo>1?'COMBO x'+mcCombo:'';
  $('mc-streak').textContent=mcCombo>=5?'!!! HOT STREAK — 2X XP !!!':'';

  // Play the full Mandarin pronunciation, then advance once it finishes.
  // Minimum visual dwell so feedback registers even when audio is short/muted.
  const proceed=(correct)=>{
    armTapAdvance($('mc-prompt'),()=>nextMC(),correct?0:1200);
  };
  if(S.sound==='mute') proceed();
  else speak(D[mcCur][0],activeCourse().langCode,proceed);
}


/* ============ RADICAL DETAIL ============ */
let radDetailFrom=null; // 'session','mc','study'
let charDetailFrom=null;

function openRadDetail(rch){
  radDetailFrom = $('study').style.display==='flex' ? 'study' :
                   $('mc').style.display==='flex' ? 'mc' :
                   $('session').style.display==='flex' ? 'session' : 'study';
  const ri=RADINFO[rch]||[rch,'','',''];
  const [py,en,canon,note]=ri;
  const CJK="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";

  // Hero
  $('radDetail-char').style.cssText='font-size:72px;line-height:1;'+CJK;
  $('radDetail-char').textContent=rch;
  $('radDetail-info').textContent=py+' · '+en.toUpperCase();
  $('radDetail-info').style.fontFamily="'Noto Sans','Arial Unicode MS','Helvetica Neue',Arial,sans-serif";
  $('radDetail-canon').innerHTML=canon
    ? `<span style="${CJK}">` + rch + `</span> is the ` + note + ` of <span style="${CJK}">` + canon + `</span>`
    : '';
  $('radDetail-canon').style.fontFamily="'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  $('radDetail-title').textContent=rch;

  // Find all deck cards containing this radical
  const matches=D.reduce((acc,[ch,,, rads],i)=>{
    if(rads.some(([r])=>r===rch)) acc.push(i);
    return acc;
  },[]);

  const fg=getComputedStyle(document.body).color;
  const grid=$('radDetail-grid'); grid.innerHTML='';
  matches.forEach(i=>{
    const [ch,syls]=D[i];
    const cell=document.createElement('div');
    cell.className='rd-cell';
    cell.style.borderColor=fg; cell.style.color=fg;
    const pyStr=syls.map(([s])=>s).join(' ');
    cell.innerHTML=`<span class="rd-hanzi cjk" style="${CJK}">${ch}</span><span class="rd-py">${pyStr}</span>`;
    cell.onclick=()=>jumpToCard(i);
    grid.appendChild(cell);
  });

  $('radDetail-label').style.color=fg;
  $('radDetail-label').style.fontSize='8px';
  // topbar button styled via radDetail-back directly below
  $('radDetail-title').style.color=fg;

  // Style topbar button
  $('radDetail-back').style.borderColor=fg;
  $('radDetail-back').style.color=fg;

  show('radDetail');
}

function jumpToCard(i){
  // Go back to session mode at a specific card
  show('session');
  cur=i; flipped=false;
  cardShownAt=Date.now();
  rollBg(); renderCard();
  const _fc3=cur; if(S.sound==='auto') setTimeout(()=>{ if(cur===_fc3) speakFront(); },350);
}


/* ============ CHAR DETAIL ============ */


// ── THE UNIFIED ATOM ENTRY — the Pokédex card (course-general) ───────────────
// One renderer for the atom's "dictionary entry," opened from anywhere (fibroid hold,
// card tap, browser). Collectible-card frame: dex number (rank) · POS type badge (in the
// star's POS-palette color) · glyph + ALWAYS-ON romanization · silent LV/XP bar · a
// depth-gated lore box · footer. v1 = deterministic; LLM-composed examples drop into the
// same lore seams later. Gates are DEFAULTED here, tuned live. Transition = plain show()
// for now; the color-flood zoom (project_fibroid) slots into this seam.
// The card's "LV" is the HOUSE'S LINE — its wager on how deeply you know the atom, NOT XP
// you grind (reward≠measurement; [[negative space]] dealer). The rungs are the universal
// "what it means to know a word" ladder, each backed by a real signal. PRODUCED/FLUENT need
// the production bar (unbuilt) → they render LOCKED: honest that recognition ≠ capability,
// and a visible "further to climb." Thresholds are defaults, tuned live.
const ATOM_RUNGS=['SEEN','KNOWN','DISTINGUISHED','PLACED','PRODUCED','FLUENT'];
const ATOM_RUNG_LOCKED_FROM=5; // PRODUCED now lights from the production log; only FLUENT is unmeasured
// True if atom i was generated correctly + UNAIDED (capMet) in a production task — as itself or as a
// component of a capability-met sentence. The signal that lights the PRODUCED rung (S.productionLog).
function _atomProduced(i){
  try{ const log=S.productionLog||[], w=D[i]&&D[i][0];
    for(let k=0;k<log.length;k++){ const e=log[k]; if(!e.capMet) continue; if(e.idx===i) return true; if(w&&e.atoms&&e.atoms.indexOf(w)>=0) return true; }
  }catch(e){}
  return false;
}
function atomHouseLine(i){
  const ci=card(i);
  if(!ci.seen && !(ci.exp>0)) return {rung:-1, name:'UNDISCOVERED'};
  const ms=(ci.axisStage&&ci.axisStage.meaning)||0, ps=(ci.axisStage&&ci.axisStage.pos)||0;
  let rung=0;                 // SEEN — encountered
  if(ms>=1) rung=1;           // KNOWN — recalls meaning
  if(ms>=2) rung=2;           // DISTINGUISHED — survived contrastive tests (negative space)
  if(ps>=2 || ms>=4) rung=3;  // PLACED — used in the right grammatical role
  if(_atomProduced(i)) rung=Math.max(rung,4);  // PRODUCED — generated it correctly + unaided in play
  // FLUENT(5): sustained/fluent production — not measured yet → the house won't post a line that high.
  return {rung, name:ATOM_RUNGS[rung]};
}
try{ window._atomProduced=_atomProduced; }catch(e){}
// ── The color-flood ZOOM transition (project_fibroid hero animation) ─────────
// A radial of the atom's color flies OUT of the star to engulf the viewport, then
// recedes to reveal the card; reversed on back (recede back down to the star). The
// star's viewport position is captured by the constellation gesture into _atomFloodXY.
let _atomFloodXY=null, _atomFloodRGB=null;
function _atomFloodEl(){ let ov=document.getElementById('atomFlood'); if(!ov){ ov=document.createElement('div'); ov.id='atomFlood'; document.body.appendChild(ov); } return ov; }
function _floodR(x,y){ return Math.hypot(Math.max(x,window.innerWidth-x),Math.max(y,window.innerHeight-y))+50; }
function atomFloodOpen(x,y,rgb,onCovered){
  const ov=_atomFloodEl(), R=_floodR(x,y), c0='circle(0px at '+x+'px '+y+'px)', cR='circle('+R+'px at '+x+'px '+y+'px)';
  ov.style.cssText='position:fixed;inset:0;z-index:300;pointer-events:none;background:'+rgb+';opacity:1;display:block;clip-path:'+c0+';-webkit-clip-path:'+c0+';';
  ov.getBoundingClientRect(); // reflow so the transition fires
  ov.style.transition='clip-path 240ms ease-out,-webkit-clip-path 240ms ease-out';
  ov.style.clipPath=cR; ov.style.webkitClipPath=cR;
  setTimeout(function(){ if(onCovered) onCovered();
    ov.style.transition='opacity 260ms ease-in'; ov.style.opacity='0';
    setTimeout(function(){ ov.style.display='none'; ov.style.opacity='1'; },280);
  },250);
}
function atomFloodBack(x,y,rgb,onCovered){
  const ov=_atomFloodEl(), R=_floodR(x,y), cR='circle('+R+'px at '+x+'px '+y+'px)', c0='circle(0px at '+x+'px '+y+'px)';
  ov.style.cssText='position:fixed;inset:0;z-index:300;pointer-events:none;background:'+rgb+';opacity:1;display:block;clip-path:'+cR+';-webkit-clip-path:'+cR+';';
  ov.getBoundingClientRect();
  if(onCovered) onCovered(); // swap to the Sky underneath, while covered
  ov.style.transition='clip-path 280ms ease-in,-webkit-clip-path 280ms ease-in';
  ov.style.clipPath=c0; ov.style.webkitClipPath=c0;
  setTimeout(function(){ ov.style.display='none'; },300);
}
let atomCardFrom='home';
function openAtomDetail(i, origin){
  if(i==null||i<0||!D[i]) return;
  atomCardFrom = origin || 'home';
  const _esc=s=>String(s==null?'':s).replace(/[&<>]/g,c=>c==='&'?'&amp;':c==='<'?'&lt;':'&gt;');
  const ci=card(i), word=D[i][0], syls=D[i][1]||[], def=D[i][2]||'', posStr=D[i][4]||'';
  const fg='#e8efe9';
  const sector=(typeof macroPOS==='function')?macroPOS(posStr):'MISC';
  const col=(typeof posColor==='function')?posColor(sector):[160,180,170];
  let colRGB='rgb('+col[0]+','+col[1]+','+col[2]+')', colSoft='rgba('+col[0]+','+col[1]+','+col[2]+',0.16)';
  // Opened from the Sky: accent + flood = the star's CURRENT lens color, so the color that flew off
  // the star carries straight into its card. POS elsewhere (study/browser). (Card revamp TBD.)
  if(origin==='sky' && typeof _skyAtomRGB==='string' && _skyAtomRGB){ colRGB=_skyAtomRGB; colSoft=_skyAtomRGB.replace('rgb(','rgba(').replace(')',',0.16)'); }
  const m=masteryScore(i), st=state(i), stage=(ci.axisStage&&ci.axisStage.meaning)||0;
  const dexNum='#'+String(i+1).padStart(3,'0'), seenCount=ci.exp||0;
  const CJKf=(typeof charFont==='function')?charFont():"font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  const redundant=(typeof _readingRedundant==='function')&&_readingRedundant();
  // POS type LABEL is gated lay→formal (color is always shown); target metalanguage = later.
  const LAY={VERB:'action',NOUN:'thing',PRON:'pointer',ADJ:'describer',ADV:'modifier',PART:'particle',CONJ:'connector',MISC:'word'};
  const FORMAL={VERB:'verb',NOUN:'noun',PRON:'pronoun',ADJ:'adjective',ADV:'adverb',PART:'particle',CONJ:'conjunction',MISC:'word'};
  const typeLabel=(st>=2?FORMAL:LAY)[sector]||'word';
  // Romanization — ALWAYS on, unless the script already IS the romanization (VN).
  let romanHTML='';
  if(!redundant && syls.length){ romanHTML=syls.map(s=>'<span style="color:'+toneColor(s[1],fg)+'">'+_esc(s[0])+'</span>').join(' '); }
  // ── LORE (depth-gated) ──
  let lore='<div style="font-size:14px;opacity:.92;">'+_esc(def)+'</div>';
  if(st>=2){
    // ── IN THE WILD: the atom's PERSONAL concordance — only the sentences the learner has ACTUALLY
    // been exposed to in play (S.sentSeen via logSentenceSeen), filtered to this atom. Starts empty
    // and GROWS with use — the evidence log surfaced. NOT the corpus: "ready for you" is the
    // scheduler's job (queued by priority), not a card list. project_fibroid (personal-exposure rev).
    try{
      const met=(typeof getSeenSentences==='function')?(getSeenSentences(i)||[]):[];
      met.sort((a,b)=> (b[3]-a[3]) || (b[4]-a[4]) ); // most-met first, then most-recent
      const showEn=(st<3), w=_esc(word);
      const hi=zh=>{ const e=_esc(zh); return w?e.split(w).join('<span style="color:'+colRGB+';font-weight:600;">'+w+'</span>'):e; }; // the focus word lit in the wild
      let rows='';
      met.slice(0,5).forEach(x=>{ const n=x[3]||1;
        rows+='<div>'
            +'<div style="font-size:17px;'+CJKf+';display:flex;justify-content:space-between;align-items:baseline;gap:8px;"><span>'+hi(x[0])+'</span>'+(n>1?'<span style="font-size:10px;opacity:.4;font-family:ui-monospace,monospace;">'+n+'×</span>':'')+'</div>'
            +((showEn&&x[2])?'<div style="font-size:11px;opacity:.5;margin-top:2px;">'+_esc(x[2])+'</div>':'')+'</div>';
      });
      const flex=met.length?('you’ve met it in '+met.length+' sentence'+(met.length>1?'s':'')):'no sightings yet — you’ll meet it in play';
      lore+='<div style="border-top:0.5px solid rgba(255,255,255,0.1);padding-top:10px;display:flex;flex-direction:column;gap:8px;">'
          +'<div style="font-size:9px;letter-spacing:1.5px;opacity:.4;">IN THE WILD</div>'
          +'<div style="font-size:11px;color:'+colRGB+';opacity:'+(met.length?'.85':'.5')+';margin-top:-5px;">'+flex+'</div>'
          +rows+'</div>';
    }catch(e){}
    const rivals=(typeof confusionDistractorIdx==='function')?confusionDistractorIdx(i,1):[];
    if(rivals.length){ const r=rivals[0];
      lore+='<div style="font-size:13px;opacity:.85;">≠ <span class="atomLink" data-idx="'+r+'" style="border-bottom:1px solid rgba(255,255,255,0.35);cursor:pointer;'+CJKf+'">'+_esc(D[r][0])+'</span> <span style="opacity:.6;">'+_esc(D[r][2]||'')+'</span></div>';
    }
    // morphology: component characters (ideographic courses). Standalone-atom chars are
    // tappable → their own card; this is openCharDetail's territory, folded in as a layer.
    try{ if((typeof _segMode!=='function'||_segMode()!=='space') && [...word].length>1){
      const chips=[...word].map(function(c){ const ji=D.findIndex(function(d){return d[0]===c;});
        return ji>=0?'<span class="atomLink" data-idx="'+ji+'" style="border-bottom:1px solid rgba(255,255,255,0.3);cursor:pointer;'+CJKf+'">'+_esc(c)+'</span>':'<span style="opacity:.7;'+CJKf+'">'+_esc(c)+'</span>'; }).join('&nbsp;&nbsp;');
      lore+='<div style="font-size:15px;opacity:.9;display:flex;gap:9px;align-items:baseline;"><span style="opacity:.45;font-size:10px;letter-spacing:1px;">BUILT FROM</span> <span>'+chips+'</span></div>';
    } }catch(e){}
  }
  const hl=atomHouseLine(i);
  // "new lore unlocked" glow: if the house line rose SINCE YOU LAST OPENED this card, the
  // newly-earned rung(s) pulse. First view sets the baseline silently (no glow). Quiet beat.
  const _firstView=(ci._cardRung==null), _prevRung=_firstView?hl.rung:ci._cardRung;
  let ladder='';
  for(let s=0;s<6;s++){
    const locked=s>=ATOM_RUNG_LOCKED_FROM, filled=(hl.rung>=0 && s<=hl.rung);
    const isNew=(!locked && hl.rung>=0 && s>_prevRung && s<=hl.rung);
    const seg=(locked?'background:rgba(255,255,255,0.04);border:1px dashed rgba(255,255,255,0.18);':'background:'+(filled?colRGB:'rgba(255,255,255,0.12)')+';')+(isNew?'animation:rungGlow 1.1s ease-out 0.25s;':'');
    ladder+='<div title="'+ATOM_RUNGS[s]+(locked?' — sustained production, not yet measured':'')+'" style="flex:1;height:8px;border-radius:2px;'+seg+'"></div>';
  }
  if(ci._cardRung!==hl.rung){ ci._cardRung=hl.rung; try{ save(); }catch(e){} }
  const lvLabel=hl.rung<0?'—':('LV '+hl.rung+' · '+hl.name);
  const stLabel=['undiscovered','learning','familiar','mastered'][st]||'';
  const html=
    '<div style="background:#0a0d0b;border:1px solid rgba(255,255,255,0.2);border-radius:14px;overflow:hidden;max-width:420px;width:100%;margin:0 auto;">'
    +'<div style="height:3px;background:'+colRGB+';"></div>'
    +'<div style="padding:16px 18px;">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;">'
    +'<span style="font-family:ui-monospace,monospace;font-size:12px;opacity:.5;">'+dexNum+'</span>'
    +'<span style="font-size:11px;letter-spacing:1px;color:'+colRGB+';background:'+colSoft+';border:0.5px solid '+colRGB+';border-radius:20px;padding:2px 10px;">'+typeLabel+'</span>'
    +'</div>'
    +'<div style="display:flex;align-items:center;justify-content:center;gap:18px;margin:18px 0 8px;">'
    +'<span style="font-size:60px;line-height:1;'+CJKf+'">'+_esc(word)+'</span>'
    +'<span id="atomCardSpeak" style="font-size:22px;cursor:pointer;opacity:.85;">🔊</span>'
    +'</div>'
    +(romanHTML?'<div style="text-align:center;font-size:15px;letter-spacing:1px;margin-bottom:16px;">'+romanHTML+'</div>':'<div style="height:6px;"></div>')
    +'<div style="margin-bottom:16px;">'
    +'<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">'
    +'<span style="font-size:10px;letter-spacing:1px;opacity:.45;">HOUSE LINE</span>'
    +'<span style="font-size:11px;letter-spacing:1px;">'+lvLabel+'</span>'
    +'</div>'
    +'<div style="display:flex;gap:3px;">'+ladder+'</div>'
    +'</div>'
    +'<div style="background:rgba(255,255,255,0.04);border:0.5px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:12px;">'+lore+'</div>'
    +'<div style="font-size:11px;opacity:.45;margin-top:14px;letter-spacing:.5px;display:flex;gap:10px;flex-wrap:wrap;">'
    +'<span>seen '+seenCount+'×</span><span>·</span><span>'+stLabel+'</span><span>·</span><span id="atomFindSky" style="cursor:pointer;opacity:.8;">✦ find in sky</span>'
    +'</div></div></div>';
  const body=$('atomCardBody');
  if(body){ body.innerHTML=html; body.style.color=fg; }
  const sp=$('atomCardSpeak'); if(sp) sp.onclick=()=>{ if(S.sound!=='mute') speak(word,activeCourse().langCode); };
  const fs=$('atomFindSky'); if(fs) fs.onclick=()=>{ show('home'); try{ if(typeof _skyFlyTo==='function') _skyFlyTo(i); }catch(_){} }; // jump to the Sky and fly the camera onto this atom
  if(body) body.querySelectorAll('.atomLink').forEach(el=>{ el.onclick=()=>{ openAtomDetail(+el.getAttribute('data-idx'),'atomCard'); }; });
  if(S.sound!=='mute') speak(word,activeCourse().langCode); // the "cry"
  if(origin==='sky' && _atomFloodXY){ _atomFloodRGB=colRGB; const f=_atomFloodXY; atomFloodOpen(f.x,f.y,colRGB,function(){ show('atomCard'); }); }
  else { if(origin!=='sky'&&origin!=='atomCard') _atomFloodXY=null; show('atomCard'); }
}

function openCharDetail(word, charIdx, deckIdx){
  if(typeof _segMode==='function'&&_segMode()==='space') return; // no char detail for space-delimited courses
  // Gate: only open if word has been introduced via flashcard
  if(deckIdx>=0 && !hasBeenIntroducedIdx(deckIdx)){
    // Queue it and show a brief message
    if(!S.uniqueSeen.includes(deckIdx)){
      // Don't force-queue; just inform
    }
    // Show a brief overlay message instead of full detail
    const msg=document.createElement('div');
    msg.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.85);color:#fff;padding:20px 28px;font-family:inherit;font-size:9px;letter-spacing:2px;text-align:center;z-index:999;border-radius:2px;';
    msg.textContent='EXPLORE EARLIER WORDS FIRST';
    document.body.appendChild(msg);
    setTimeout(()=>msg.remove(),1200);
    return;
  }
  const studySubPanel=$('studyColl')&&$('studyColl').style.display==='flex'?'studyColl':$('studyPOS')&&$('studyPOS').style.display==='flex'?'studyGrammar':'study';
  charDetailFrom = $('study').style.display==='flex' ? studySubPanel :
                   $('mc').style.display==='flex' ? 'mc' :
                   $('session').style.display==='flex' ? 'session' : 'study';
  // Note: charDetailFrom is the panel string — do NOT overwrite with word data
  const ch = [...word][charIdx];
  const CJK = "font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  const fg = getComputedStyle(document.body).color;

  // Find this character as a standalone entry in D if it exists
  const standalone = D.findIndex(([w])=> w===ch);

  $('charDetail-hanzi').textContent=ch;
  $('charDetail-hanzi').style.fontFamily="'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  $('charDetail-title').textContent=ch;
  $('charDetail-title').style.fontFamily="'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";

  if(standalone>=0){
    // Full entry exists in deck
    const [,syls,def,rads]=D[standalone];
    const py=$('charDetail-pinyin'); py.innerHTML='';
    syls.forEach(([syl,t])=>{
      const s=document.createElement('span');
      s.textContent=syl; s.style.color=toneColor(t,fg);
      py.appendChild(s);
    });
    $('charDetail-def').textContent=def.toUpperCase();

    // Radicals
    const seen=new Set();
    const sortedRads=[...rads].sort((a,b)=>a[1]-b[1]).filter(([r])=>{
      if(seen.has(r)) return false; seen.add(r); return true;
    });
    const radEl=$('charDetail-rads'); radEl.innerHTML='';
    sortedRads.forEach(([rch])=>{
