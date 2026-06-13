  const newN=D.filter((_,i)=>isUnlocked(i)&&!(S.cards[i]&&S.cards[i].seen)).length;
  const mastN=D.filter((_,i)=>isMastered(i)).length;
  const frVal=frontier();
  $('due').textContent=`DUE ${dueN}  NEW ${newN}`;
  $('frontierDisplay').textContent=frVal;
  const course=activeCourse&&activeCourse();
  $('frontierSub').textContent=(course?course.langName.toUpperCase():'MANDARIN CHINESE')+' · '+frVal+' / '+D.length+' WORDS';

  // Daily progress bar
  const today=new Date().toDateString();
  const dailyCount=(S.dailyDate===today)?S.dailyCards:0;
  const dailyPct=Math.min(100,Math.round(dailyCount/OPTIMAL_CARDS*100));
  $('dailyProgFill').style.width=dailyPct+'%';
  $('dailyProgFill').style.background=fg;
  $('dailyProgLabel').textContent=dailyCount+' / '+OPTIMAL_CARDS;
  $('dailyProgNote').textContent=dailyCount>=OPTIMAL_CARDS?'optimal window reached — rest and return tomorrow':'optimal window: '+OPTIMAL_CARDS+' cards';
  $('dailyProgTrack').style.borderColor=fg;
  $('dailyProgWrap').style.borderColor=fg; $('dailyProgWrap').style.color=fg;

  // Milestone progress bar
  const MILESTONES=[10,50,100,200,500,1000,2000,5000];
  const MLABELS={10:'first batch',50:'survival vocab',100:'core deck',200:'basic phrases',500:'conversational',1000:'functional literacy',2000:'near-fluent',5000:'advanced'};
  const nextM=MILESTONES.find(m=>m>frVal)||MILESTONES[MILESTONES.length-1];
  const prevM=MILESTONES[MILESTONES.indexOf(nextM)-1]||0;
  const mPct=Math.min(100,Math.round((frVal-prevM)/(nextM-prevM)*100));
  $('milestoneProgFill').style.width=mPct+'%';
  $('milestoneProgFill').style.background=fg;
  $('milestoneProgLabel').textContent=frVal+' / '+nextM;
  $('milestoneProgNote').textContent=(MLABELS[nextM]||'next milestone').toUpperCase();
  $('milestoneProgTrack').style.borderColor=fg;
  $('milestoneProgWrap').style.borderColor=fg; $('milestoneProgWrap').style.color=fg;
  $('muteBtn').textContent='SOUND: '+S.sound.toUpperCase();
  $('orderBtn').textContent='ORDER: '+(S.ordered?'FREQUENCY':'SHUFFLE');
  updateDeckSelector();
}

function show(view){
  $('home').style.display=view==='home'?'flex':'none';
  $('session').style.display=view==='session'?'flex':'none';
  $('mc').style.display=view==='mc'?'flex':'none';
  $('radDetail').style.display=view==='radDetail'?'flex':'none';
  $('charDetail').style.display=view==='charDetail'?'flex':'none';
  $('tone').style.display=view==='tone'?'flex':'none';
  $('deckMgr').style.display=view==='deckMgr'?'flex':'none';
  $('study').style.display=view==='study'?'flex':'none';
  if(view!=='study' && $('studyPOS')) $('studyPOS').style.display='none';
  $('summary').style.display=view==='summary'?'flex':'none';
  $('wordSearch').style.display=view==='wordSearch'?'flex':'none';
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
  if(S.sound==='auto') setTimeout(()=>speakFront(),350);
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

  // Wrap each character in a tappable span
  const chars=[...ch]; // spread handles multi-char words
  if(chars.length===1){
    $('hanzi').textContent=ch;
    $('hanzi').style.cursor='default';
    $('hanzi').onclick=null;
  } else {
    const CJKh="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
    $('hanzi').innerHTML=chars.map((hc,hi)=>
      `<span style="cursor:pointer;text-decoration-line:underline;text-decoration-style:dotted;${CJKh}" data-chi="${hi}">${hc}</span>`
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
        '<span style="cursor:pointer;text-decoration:underline dotted;" class="posLabelSpan">'+dispLabel.toUpperCase()+'</span>'+
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
    if(S.sound==='auto'||S.sound==='tap') setTimeout(()=>speakBack(),200);
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
    if(!isUnlocked(i)) return null;          // only unlocked words
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
      if(!isUnlocked(i)) continue;
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

  const scored = D.map((_,i) => {
    if(i === targetIdx) return null;
    if(!isUnlocked(i)) return null;
    const ch = D[i][0];
    if(usedChars.has(ch)) return null;
    return { i, ch, score: scoreCandidate(targetIdx, i) };
  }).filter(Boolean);

  scored.sort((a,b) => b.score - a.score);

  const poolSize = Math.min(scored.length, Math.max(n * 3, 12));
  const pool = scored.slice(0, poolSize);
  shuffle(pool);

  const out = [];
  for(const cand of pool){
    if(usedChars.has(cand.ch)) continue;
    out.push(cand.ch);
    usedChars.add(cand.ch);
    if(out.length >= n) break;
  }

  // Fallback
  if(out.length < n){
    for(let i = 0; i < D.length && out.length < n; i++){
      if(!isUnlocked(i)) continue;
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
    const pp=$('mc-pinyin'); pp.innerHTML='';
    syls.forEach(([syl,t])=>{
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
  logAnswer(mcCur,isCorrect);

  const stage=meaningStage(masteryScore(mcCur));
  const confident=mcConfidence==='sure';
  const unsure=mcConfidence==='unsure';

  if(isCorrect){
    mcCombo++;
    // Confidence weighting: sure+correct = full mastery gain, unsure+correct = half
    const masteryGain=confident?1.2:unsure?0.6:1.0;
    const xpGain=confident?12:unsure?8:10;
    S.xp+=Math.round(xpGain*(mcCombo>=5?2:1)*fatigueXPMultiplier());
    addMastery(mcCur,masteryGain);
    $('mc-explain').textContent=confident?'':'';
  } else {
    mcCombo=0;
    // Confident+wrong = bigger penalty (overconfidence)
    const masteryLoss=confident?-0.8:unsure?-0.2:-0.5;
    addMastery(mcCur,masteryLoss);
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
  if(S.sound==='auto') setTimeout(()=>speakFront(),350);
}


/* ============ CHAR DETAIL ============ */


function openCharDetail(word, charIdx, deckIdx){
  // Gate: only open if word has been introduced via flashcard
  if(deckIdx>=0 && !hasBeenIntroducedIdx(deckIdx)){
    // Queue it and show a brief message
    if(!S.uniqueSeen.includes(deckIdx)){
      // Don't force-queue; just inform
    }
    // Show a brief overlay message instead of full detail
    const msg=document.createElement('div');
    msg.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.85);color:#fff;padding:20px 28px;font-family:inherit;font-size:9px;letter-spacing:2px;text-align:center;z-index:999;border-radius:2px;';
    msg.textContent='STUDY THIS WORD FIRST';
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
