      const ri=RADINFO[rch];
      const row=document.createElement('div');
      row.style.cssText=`display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer;${CJK}`;
      if(ri){
        const [py,en,canon,note]=ri;
        const canonNote=canon?` <span style="font-size:7px;opacity:.75">(${note} of ${canon})</span>`:'';
        row.innerHTML=`<span style="font-size:18px;${CJK}">${rch}</span><span style="font-size:8px;font-family:'Noto Sans','Arial Unicode MS','Helvetica Neue',Arial,sans-serif"> ${py} · ${en.toUpperCase()}${canonNote}</span>`;
      } else {
        row.innerHTML=`<span style="font-size:18px">${rch}</span>`;
      }
      row.style.color=fg; row.style.borderBottom=`1px solid ${fg}`;
      row.onclick=()=>openRadDetail(rch);
      radEl.appendChild(row);
    });
    $('charDetail-note').textContent='';
  } else {
    // Character not in deck as standalone
    $('charDetail-pinyin').textContent='';
    $('charDetail-def').textContent='(NOT IN DECK AS STANDALONE)';
    $('charDetail-rads').innerHTML='';
    $('charDetail-note').textContent='COMPONENT OF '+word.toUpperCase();
  }

  // Style elements
  [$('charDetail-back'),$('charDetail-card')].forEach(el=>{
    el.style.borderColor=fg; el.style.color=fg;
  });
  $('charDetail-back').style.color=fg;

  show('charDetail');
}

/* ============ GOLDEN ANGLE COLOR SYSTEM ============ */
const GA=137.508;
function hsl(h,s,l){return `hsl(${((h%360)+360)%360},${s}%,${l}%)`}
/* Tone colors: offset from bg hue, always dark for contrast */
function toneColor(t,dark){
  if(t===0) return dark;
  const offsets=[null,0,60,150,220]; // distinct hue offsets per tone
  return hsl(bgHue+offsets[t],90,12);
}
let bgHue=Math.random()*360;
function rollBg(){
  bgHue=(bgHue+GA)%360;
  const bg=hsl(bgHue,85,58);
  const fg=hsl(bgHue,70,8);
  document.documentElement.style.setProperty('--bg',bg);
  document.documentElement.style.setProperty('--fg',fg);
  document.body.style.backgroundColor=bg;
  document.body.style.color=fg;
  document.querySelectorAll('.panel,.btn,#card,#topbar button,.cell,.sw,#mc-prompt,#mc-topbar button,.choice,#mc-dontknow,#mc-submode button,#debugToggle')
    .forEach(e=>{e.style.borderColor=fg; e.style.color=fg;});
  return {fg};
}

/* ============ TONE DRILL ============ */
// Tone labels and descriptions
const TONE_LABEL=['-','1ST','2ND','3RD','4TH','NEUT'];

let toneQueue=[],toneIdx=0,toneCur=-1,toneCombo=0,toneLocked=false,toneAudioMode=false;

function startTone(){
  // Always shuffle for tone drill regardless of S.ordered
  const now=Date.now();
  const due=[],fresh=[];
  D.forEach((_,i)=>{ const ci=S.cards[i]; if(ci&&ci.seen){ if(ci.due<=now) due.push(i); } else fresh.push(i); });
  toneQueue=shuffle(due).concat(shuffle(fresh));
  toneIdx=0; toneCombo=0; toneAudioMode=false;
  show('tone');
  updateToneSubmode();
  nextTone();
}

function updateToneSubmode(){
  const fg=getComputedStyle(document.body).color;
  $('tone-visual').style.borderColor=fg; $('tone-visual').style.color=fg;
  $('tone-audio').style.borderColor=fg; $('tone-audio').style.color=fg;
  $('tone-visual').classList.toggle('active',!toneAudioMode);
  $('tone-audio').classList.toggle('active',toneAudioMode);
  $('tone-hint').textContent=toneAudioMode?'TAP TO HEAR AGAIN':'TAP TO HEAR';
  $('tone-hanzi').style.opacity=toneAudioMode?'0':'1';
  $('tone-py').style.opacity='0'; // always hidden until answer
}

function nextTone(){
  if(toneIdx>=toneQueue.length){ goHome(); return; }
  toneCur=toneQueue[toneIdx++];
  toneLocked=false;

  const [ch,syls]=D[toneCur];
  const CJK="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  $('tone-hanzi').style.fontFamily=CJK;
  $('tone-hanzi').textContent=ch;
  $('tone-py').textContent='';
  $('tone-py').style.opacity='0';

  rollBg();
  renderToneChoices();
  updateToneSubmode();

  $('tone-xp').textContent='XP '+S.xp;
  $('tone-combo').textContent=toneCombo>1?'COMBO x'+toneCombo:'';
  $('tone-streak').textContent='';

  if(S.sound!=='mute') speak(D[toneCur][0],activeCourse().langCode);
}

function renderToneChoices(){
  const [,syls]=D[toneCur];
  // Collect all tones in the word
  const correctTones=syls.map(([,t])=>t);

  const fg=getComputedStyle(document.body).color;
  const box=$('tone-choices'); box.innerHTML='';

  // Show one button per syllable's tone + neutral = 5 buttons total (tones 1-4 + neutral 0)
  [1,2,3,4,0].forEach(t=>{
    const btn=document.createElement('button');
    btn.className='tone-btn';
    btn.style.borderColor=fg; btn.style.color=fg;
    const tSymbols={1:'-',2:'/',3:'v',4:'\\',0:'.'};
    btn.innerHTML='<span style="font-size:22px">'+tSymbols[t]+'</span>';
    btn.onclick=()=>pickTone(btn,t,correctTones);
    box.appendChild(btn);
  });

  // Skip button — no penalty, advances without answer
  const oldSk=document.getElementById('toneStandaloneSkip');
  if(oldSk) oldSk.remove();
  const sk=document.createElement('button');
  sk.id='toneStandaloneSkip';
  sk.style.cssText='font-family:inherit;font-size:8px;padding:8px;border:2px solid '+fg+';background:transparent;color:'+fg+';cursor:pointer;width:100%;opacity:.45;margin-top:4px;';
  sk.textContent='✕ SKIP  (loud environment)';
  sk.onclick=()=>{ if(toneLocked) return; toneLocked=true; setTimeout(()=>nextTone(),150); };
  box.parentElement.appendChild(sk);
}

function pickTone(btn,chosen,correctTones){
  if(toneLocked) return;
  toneLocked=true;
  const fg=getComputedStyle(document.body).color;

  // For multi-syllable words, correct if chosen matches ANY syllable tone
  // (primary tone = first non-neutral syllable)
  const primaryTone=correctTones.find(t=>t!==0)||correctTones[0];
  const isCorrect=chosen===primaryTone;

  // Reveal all buttons
  document.querySelectorAll('.tone-btn').forEach(b=>{
    const btnTone=[1,2,3,4,0][Array.from(b.parentNode.children).indexOf(b)];
    if(btnTone===primaryTone) b.classList.add('correct');
    else if(b===btn && !isCorrect) b.classList.add('wrong');
    b.style.pointerEvents='none';
  });

  // Reveal pinyin
  const CJK="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  const [,syls]=D[toneCur];
  const py=$('tone-py'); py.innerHTML=''; py.style.opacity='1';
  syls.forEach(([syl,t])=>{
    const s=document.createElement('span');
    s.textContent=syl+' '; s.style.color=toneColor(t,fg);
    py.appendChild(s);
  });

  if(isCorrect){
    toneCombo++;
    S.xp+=10*(toneCombo>=5?2:1);
  } else {
    toneCombo=0;
  }

  const today=new Date().toDateString();
  if(S.lastDay!==today){
    const y=new Date(Date.now()-DAY).toDateString();
    S.streak=(S.lastDay===y)?S.streak+1:1;
    S.lastDay=today;
  }
  save();
  $('tone-xp').textContent='XP '+S.xp;
  $('tone-combo').textContent=toneCombo>1?'COMBO x'+toneCombo:'';
  $('tone-streak').textContent=toneCombo>=5?'!!! HOT STREAK — 2X XP !!!':'';

  if(S.sound!=='mute') speak(D[toneCur][0],activeCourse().langCode);

  armTapAdvance($('tone-prompt')||document.getElementById('tone-prompt')||document.body,()=>nextTone(),isCorrect?0:1200);
}


/* ============ DECK MANAGEMENT ============ */

// Built-in decks (non-deletable)
const BUILTIN_DECKS = {
  'core': { name:'CORE 100', indices: Array.from({length:100},(_,i)=>i) }
};

// Get merged deck list: builtins + user-created
function allDecks(){ return {...BUILTIN_DECKS, ...S.decks}; }

// Active deck index list
function activeDeckIndices(){
  const d = allDecks()[S.activeDeck];
  return d ? d.indices : BUILTIN_DECKS.core.indices;
}

function activeDeckName(){
  const d = allDecks()[S.activeDeck];
  return d ? d.name : 'CORE 100';
}

function createDeck(name){
  const id = 'deck_'+Date.now();
  S.decks[id] = { name: name.toUpperCase().trim(), indices: [] };
  save();
  return id;
}

function deleteDeck(id){
  if(BUILTIN_DECKS[id]) return; // can't delete builtins
  delete S.decks[id];
  if(S.activeDeck===id) S.activeDeck='core';
  save();
}

function setActiveDeck(id){
  if(!allDecks()[id]) return;
  S.activeDeck=id;
  save();
}

function removeFromDeck(deckId, idx){
  if(BUILTIN_DECKS[deckId]) return; // can't edit builtins
  const d=S.decks[deckId];
  if(!d) return;
  d.indices=d.indices.filter(i=>i!==idx);
  save();
}

function addToDeck(deckId, idx){
  if(BUILTIN_DECKS[deckId]) return;
  const d=S.decks[deckId];
  if(!d || d.indices.includes(idx)) return;
  d.indices.push(idx);
  d.indices.sort((a,b)=>a-b);
  save();
}

function renderDeckMgr(){
  const fg=getComputedStyle(document.body).color;
  const list=$('deckMgr-list'); list.innerHTML='';
  const decks=allDecks();

  Object.entries(decks).forEach(([id,deck])=>{
    const isActive=S.activeDeck===id;
    const isBuiltin=!!BUILTIN_DECKS[id];
    const mastN=deck.indices.filter(i=>isMastered(i)).length;

    const row=document.createElement('div');
    row.className='deck-row'+(isActive?' active-deck':'');
    row.style.borderColor=fg; row.style.color=fg;

    row.innerHTML=`
      <div class="deck-row-info">
        <div style="font-size:10px">${deck.name}</div>
        <div style="opacity:.7">${deck.indices.length} WORDS  ·  ${mastN} MASTERED</div>
        ${isActive?'<div style="font-size:7px;opacity:.9">▶ ACTIVE</div>':''}
      </div>
      <div class="deck-row-btns">
        ${!isActive?`<button class="select-btn" data-id="${id}">SELECT</button>`:''}
        ${!isBuiltin?`<button class="del-btn" data-id="${id}">DELETE</button>`:''}
      </div>
    `;
    list.appendChild(row);
  });

  // Style dynamic buttons
  list.querySelectorAll('.select-btn,.del-btn').forEach(b=>{
    b.style.borderColor=fg; b.style.color=fg;
    b.onclick=(e)=>{
      e.stopPropagation();
      if(b.classList.contains('select-btn')){
        setActiveDeck(b.dataset.id);
        renderDeckMgr();
        updateDeckSelector();
      } else {
        if(confirm('Delete deck "'+allDecks()[b.dataset.id]?.name+'"?')){
          deleteDeck(b.dataset.id);
          renderDeckMgr();
          updateDeckSelector();
        }
      }
    };
  });

  // Style input and create button
  const inp=$('deckMgr-input');
  const btn=$('deckMgr-create');
  inp.style.borderColor=fg; inp.style.color=fg;
  btn.style.borderColor=fg; btn.style.color=fg;
  $('deckMgr-back').style.borderColor=fg; $('deckMgr-back').style.color=fg;
}

function updateDeckSelector(){
  $('deckSelector').textContent='DECK: '+activeDeckName()+' ▸';
  const fg=getComputedStyle(document.body).color;
  $('deckSelector').style.borderColor=fg;
  $('deckSelector').style.color=fg;
}


/* ============ UNIFIED STUDY SESSION ============ */
// Word state drives modality:
//   unseen          -> flashcard (exposure)
//   seen < 3 times  -> MC forward
//   seen >= 3 times -> MC forward or reverse (alternating)
//   every 5th card  -> tone drill interjection
//   wrong answer    -> re-queue in 3-5 cards
//
// All encounters: audio plays immediately, character always visible.

let studyQueue=[], studyIdx=0, studyCardCount=0;
let studyPending=[]; // wrong-answer re-queue buffer
let studyActive=false;

// Per-word encounter count across this study session
const studyEncounters=new Map(); // idx -> count
const sessionRecentCards=[]; // ring buffer — last N vocab card indices shown
const sessionAnswerRing=[]; // ring buffer — last M answer booleans (true=correct)
const RECENCY_WINDOW=10;
const ANSWER_RING_SIZE=15;

function wordModality(i){
  // Not yet MC-eligible: always flashcard
  if(!isMCEligible(i)) return 'flash';

  // MC-eligible: mastery drives flashcard probability
  // flashProb = 1/(mastery+2): at m=0: 50%, m=1: 33%, m=2: 25%, m=4: 17%
  // Flashcard never disappears — always a chance of refresh
  const m=masteryScore(i);
  const flashProb=1/(m+2);
  if(Math.random()<flashProb) return 'flash';
  return Math.random()<0.5 ? 'mc-fwd' : 'mc-rev';
}

// Special marker for grammar pool entries
// Encode both category and axis: GRAMMAR_MARKER - (catIdx * 10 + axisIdx)
const GRAMMAR_MARKER=-100000;
function grammarQueueKey(cat,axis){
  const ci=GRAMMAR_CATS.indexOf(cat);
  const ai=GRAMMAR_AXES.indexOf(axis||'recognition');
  return GRAMMAR_MARKER-(ci*10+(ai>=0?ai:0));
}
function isGrammarKey(k){ return k<=GRAMMAR_MARKER; }
function grammarCatFromKey(k){
  const enc=GRAMMAR_MARKER-k;
  return GRAMMAR_CATS[Math.floor(enc/10)]||GRAMMAR_CATS[0];
}
function grammarAxisFromKey(k){
  const enc=GRAMMAR_MARKER-k;
  return GRAMMAR_AXES[enc%10]||'recognition';
}

function buildStudyQueue(){
  // THREE POOLS interleaved:
  // GRAMMAR: due category drills (language-agnostic) — negative keys
  // VOCABULARY: due word cards (language-specific) — D array indices
  // CONVERGENCE: handled inside showStudyCard when both tracks ready

  const grammarDuePool=[],vocabDue=[],vocabSeen=[];

  // Add due sub-axis drills sorted by most overdue
  const dueDrills=dueGrammarDrills(); // already filtered by sessionGrammarAnswered
  dueDrills.forEach(({cat,axis})=>{
    grammarDuePool.push(grammarQueueKey(cat,axis));
  });

  D.forEach((_,i)=>{
    if(!isUnlocked(i)) return;
    const ci=S.cards[i];
    if(!ci||!ci.exp) return;
    if(isCardDue(i)) vocabDue.push(i);
    else vocabSeen.push(i);
  });

  [vocabDue,vocabSeen].forEach(a=>a.sort((a,b)=>a-b));

  // Interleave: grammar is supplemental — ratio depends on frontier
  // Small frontier (< 10 words): grammar every 10 vocab cards
  // Growing frontier (10-30): grammar every 7
  // Established (30+): grammar every 5
  const fr=frontier();
  const grammarInterval=fr<10?10:fr<30?7:5;
  const queue=[];
  let gi=0,vi=0;
  const vAll=vocabDue.concat(vocabSeen);
  while(gi<grammarDuePool.length||vi<vAll.length){
    // Grammar fires at interval points, only when pool has entries
    if(gi<grammarDuePool.length&&queue.length>0&&queue.length%grammarInterval===0){
      queue.push(grammarDuePool[gi++]);
    } else if(vi<vAll.length){
      queue.push(vAll[vi++]);
    } else if(gi<grammarDuePool.length){
      queue.push(grammarDuePool[gi++]);
    } else break;
  }

  if(!queue.length){
    const first=D.findIndex((_,i)=>isUnlocked(i));
    if(first>=0) queue.push(first);
  }
  return queue;
}

// Introduce the next word — called by scheduler when conditions are met
// Returns the index of word introduced, or -1 if nothing to introduce
function introduceNextWord(){
  const next=nextWordToIntroduce();
  if(!next) return -1;
  if(next.type==='word'){
    // New individual word — will be shown as flashcard by showStudyCard
    return next.idx;
  }
  if(next.type==='coll'){
    // New compound — mark as seen and show as colloquialism
    if(!S.seenColls) S.seenColls=[];
    S.seenColls.push(next.idx);
    save();
    showStudyColl(next.idx);
    return -2; // handled
  }
  return -1;
}

let studyFlashOnly=false;
let studyModalityFilter=null; // null=all, 'flash','grammar','mc','tone','pos'
const sessionGrammarAnswered=new Set(); // cats answered correctly this session
function startStudy(flashOnly){
  studyFlashOnly=!!flashOnly;
  // Don't call load() here — state was loaded at page init
  // Calling load() again would overwrite in-memory state with stale localStorage
  nextQueueRebuildAt=0;
  // Reset session reveal counters
  sessionRevealOrder.clear();
  sessionRevealCount=0;
  try{
  // Initialize grammar state (idempotent)
  initGrammarState();
  // Grammar-only filter: queue only currently-due categories
  if(studyModalityFilter==='grammar'){
    initGrammarState();
    // Debug mode: bypass unlock conditions, force all axes due
    GRAMMAR_CATS.forEach(function(cat){
      GRAMMAR_AXES.forEach(function(axis){
        if(S.grammar[cat]&&S.grammar[cat][axis]) S.grammar[cat][axis].due=0;
      });
    });
    // Use raw drill list bypassing unlock gate
    const debugDrills=[];
    GRAMMAR_CATS.forEach(function(cat){
      GRAMMAR_AXES.forEach(function(axis){
        if(!sessionGrammarAnswered.has(cat+':'+axis))
          debugDrills.push({cat,axis,overdue:0});
      });
    });
    studyQueue=debugDrills.map(function(d){return grammarQueueKey(d.cat,d.axis);});
  } else {
    studyQueue=buildStudyQueue();
  }
  if(!studyQueue||!studyQueue.length) studyQueue=D.map((_,i)=>i).filter(i=>isUnlocked(i)).slice(0,10);
  studyIdx=0; studyCardCount=0;
  studyEncounters.clear();
  sessionRecentCards.length=0;
  sessionAnswerRing.length=0;
  studyPending=[];
  studyActive=true;
  sessionHistory.clear();
  sessionFlashCount.clear();
  try{ sessionStorage.removeItem(SESSION_RING_KEY); }catch(e){}
  sessionSeen.clear();
  sessionGrammarAnswered.clear();
  resetSessionFatigue();
  startSessionLog('study');
  show('study');
  nextStudyCard();
  }catch(e){ document.title='START:'+e.message.slice(0,60); console.error(e); goHome(); }
}

function getIntroEvery(){
  const n=sessionAnswerRing.length;
  if(n<5) return 4; // not enough data yet
  const correct=sessionAnswerRing.filter(Boolean).length;
  const acc=correct/n;
  if(acc>=0.80) return 2;  // performing well — introduce faster
  if(acc>=0.65) return 3;
  if(acc>=0.50) return 5;
  return 7;               // struggling — slow down introductions
}

function nextStudyCard(){
  // Check if we should introduce a new word
  // Skip when a modality filter is active — debug modes stay focused
  // Rebuild queue when next due card's timestamp is reached
  // More precise than count-based — triggers exactly when new cards become due
  if(!studyModalityFilter && nextQueueRebuildAt && Date.now()>=nextQueueRebuildAt){
    studyQueue=buildStudyQueue();
    studyIdx=0;
    scheduleNextQueueRebuild();
  }
  const forceIntro=studyCardCount===1;
  if(!studyModalityFilter&&(forceIntro||studyCardCount%getIntroEvery()===0) && shouldIntroduceNewWord()){
    const newIdx=introduceNextWord();
    if(newIdx>=0){
      // Rebuild queue to include the new word in rotation
      studyQueue=buildStudyQueue();
      studyIdx=0;
      showStudyCard(newIdx); // shows as flashcard since exp===0, sets exp=1
      return;
    }
    if(newIdx===-2) return; // compound shown, handled
  }

  // Inject pending re-queue cards every ~15 cards (was 4 — too soon)
  if(studyPending.length && studyCardCount%15===14){
    const pending=studyPending.shift();
    const reIdx=typeof pending==='object'?pending.idx:pending;
    const reMod=typeof pending==='object'?pending.mod:null;
    // Grammar re-queue — negative key means grammar drill
    if(typeof reIdx==='number'&&isGrammarKey(reIdx)){
      const reCat=grammarCatFromKey(reIdx);
      if(reCat) showGrammarDrill(reCat);
      return;
    }
    if(reMod&&reMod!=='flash'){
      lastModality.set(reIdx,reMod);
      if(reMod==='convergence'){
        showConvergenceQuestion(reIdx);
      } else if(reMod==='cloze'){
        showStudyCloze(reIdx);
      } else if(reMod==='word-order'){
        showWordOrderDrill(reIdx);
      } else if(reMod==='pos-s1'||reMod==='pos-s2'||reMod==='pos-s3'){
        const ps=reMod==='pos-s1'?1:reMod==='pos-s2'?2:3;
        showStudyPOSStaged(reIdx,ps);
      } else {
        showStudyMC(reIdx, reMod==='mc-rev');
      }
      return;
    }
    showStudyCard(reIdx);
    return;
  }
  if(studyIdx>=studyQueue.length){
    studyQueue=buildStudyQueue();
    studyIdx=0;
    // If rebuilt queue is empty, session is done
    if(!studyQueue.length){ goHome(); return; }
  }
  let i=studyQueue[studyIdx++];
  if(i===undefined||i===null){ goHome(); return; }
  // Recency filter: avoid repeating a vocab card within RECENCY_WINDOW cards.
  // Scan ahead for a non-recent alternative and swap it into the current slot.
  if(!isGrammarKey(i) && sessionRecentCards.includes(i)){
    const limit=Math.min(studyIdx+RECENCY_WINDOW, studyQueue.length);
    for(let s=studyIdx; s<limit; s++){
      const ni=studyQueue[s];
      if(isGrammarKey(ni) || !sessionRecentCards.includes(ni)){
        studyQueue[s]=i; // defer i to later
        i=ni;
        break;
      }
    }
  }
  // Route grammar pool cards to grammar drill
  if(isGrammarKey(i)){
    if(studyFlashOnly||(studyModalityFilter&&studyModalityFilter!=='grammar')){
      nextStudyCard(); return;
    }
    const cat=grammarCatFromKey(i);
    const axis=grammarAxisFromKey(i);
    if(sessionGrammarAnswered.has(cat+':'+axis)){
      nextStudyCard(); return;
    }
    showGrammarDrill(cat, axis);
    return;
  }
  showStudyCard(i);
}

function showStudyCard(i){
  if(i===undefined||i===null||isGrammarKey(i)||i<0||i>=D.length){ nextStudyCard(); return; }
  clearCardState();
  studyCardCount++;
  tickSessionCard();
  studyEncounters.set(i,(studyEncounters.get(i)||0)+1);
  sessionRecentCards.push(i);
  if(sessionRecentCards.length>RECENCY_WINDOW) sessionRecentCards.shift();

  // Colloquialism interjection: only show if unlocked, frequency-ranked
  // Fire every ~11 cards but only show the highest-priority unlocked coll
  if(studyCardCount%11===0){
    const unlockedColls=getUnlockedColls();
    if(unlockedColls.length>0){
      const collI=unlockedColls[Math.floor(studyCardCount/11)%unlockedColls.length];
      // Double-check: all components must be introduced
      if(collUnlocked(collI)){
        showStudyColl(collI);
        return;
      }
    }
    // No unlocked colls or gate failed — continue with normal card
  }
  // Tone interjection every 5th card, gated on having seen card back
  const hasSeenBack=(card(i).exp||0)>0;
  if(studyCardCount%5===0 && hasSeenBack && getAxisStage(i,'meaning')>=2){
    showStudyTone(i);
    return;
  }

  // Mastery-based modality — no session state, uses persistent mastery score
  // Axis-stage driven modality — each word progresses through defined stages
  let mod;
  try{ mod=wordModalityFromAxes(i); }catch(e){ document.title='MOD:'+e.message+' stk:'+e.stack.slice(0,80); console.error('wordModality error',e); mod='mc-fwd'; }
  lastModality.set(i,mod);
  if(mod==='flash'){
    showStudyFlash(i);
  } else if(mod==='convergence'){
    showConvergenceQuestion(i);
  } else if(mod==='cloze'){
    showStudyCloze(i);
  } else if(mod==='word-order'){
    showWordOrderDrill(i);
  } else if(mod==='pos-s1'||mod==='pos-s2'||mod==='pos-s3'){
    const posAxisStage=mod==='pos-s1'?1:mod==='pos-s2'?2:3;
    showStudyPOSStaged(i, posAxisStage);
  } else if(mod==='meaning-s1'){
    showStudyMC(i, false, true);
  } else if(mod==='tone'){
    showStudyTone(i);
  } else {
    showStudyMC(i, mod==='mc-rev');
  }
}

/* --- Study Flash Card --- */
function showStudyFlash(i){
  activeCardIdx=i;
  try{
  const [ch,syls,def,,pos]=D[i];
  if(S.sound!=='mute') speak(ch,activeCourse().langCode);
  const CJKf="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  const fg=getComputedStyle(document.body).color;
  let flipped=false;

  rollBg();
  $('studyMode').textContent='EXPOSURE';
  $('studyRank').textContent=cardRankStr(i);
  // Mark as introduced on first showing — don't require flip
  const ci0=card(i);
  if(!(ci0.exp>0)){
    ci0.exp=1;
    ci0.seen=true;
    // Set initial due date so MC can fire after short interval
    if(!ci0.axisDue) ci0.axisDue={};
    const introInterval=Math.round(0.012*DAY); // ~17 min
    ci0.axisDue['meaning']=Date.now()+introInterval;
    ci0.axisDue['pos']=Date.now()+introInterval*3;
    save();
  }

  // Rings
  const seen=(sessionSeen.get(i)||0);
  sessionSeen.set(i,seen+1);
  // Flash rings: exposure count only, golden-angle neutral inset
  renderFlashRings(i,$('studyCard'));
  $('studyCard').style.borderColor=fg; $('studyCard').style.color=fg;

  // Hanzi
  $('studyHanzi').textContent=ch;
  $('studyHanzi').style.fontFamily=CJKf.split(':')[1].trim();
  $('studyHanzi').style.color=fg;
  $('studyHanzi').style.textDecoration='none';

  // Pinyin
  const py=$('studyPinyin'); py.innerHTML='';
  syls.forEach(([s,t])=>{ const sp=document.createElement('span'); sp.textContent=s; sp.style.color=toneColor(t,fg); py.appendChild(sp); });

  $('studyBackZone').style.display='none';
  $('studyFlipHint').style.display='block';
  $('studyFlipHint').style.color=fg;

  const flashShownAt=Date.now();
  let flashFlippedAt=0;
  $('studyCard').onclick=function(){
    try{
    if(!flipped){
      flipped=true;
      flashFlippedAt=Date.now();
      $('studyDef').textContent=def.toUpperCase();
      $('studyDef').style.color=fg;
      const spEl=$('studyPos');
      if(pos){
        const axStg2=getAxisStage(i,'pos');
        const {correct:posLbl2, def:posDef2}=posDataForStage(pos, Math.max(1,axStg2));
        const dispLbl2=axStg2>=3?pos.toUpperCase():posLbl2.toUpperCase();
        const posEntry=POS_LOGICAL[pos]||{};
        const dispDef2=axStg2<=2&&posDef2?posDef2:axStg2>=3&&posEntry.def?posEntry.def:'';
        const mandNote=axStg2>=3&&posEntry.mandarin_note?posEntry.mandarin_note:'';
        spEl.innerHTML='<span style="cursor:pointer;" class="posLabelSpan">'+dispLbl2+'</span>'+
          (dispDef2?'<br><span style="font-size:10px;opacity:.8;letter-spacing:.5px;">'+dispDef2+'</span>':'')+
          (mandNote?'<br><span style="font-size:9px;opacity:.6;font-style:normal;">'+mandNote+'</span>':'');
        spEl.style.cursor='default';
        const lbl2=spEl.querySelector('.posLabelSpan');
        if(lbl2) lbl2.onclick=(e)=>{e.stopPropagation();showPOSExplain(pos,lbl2);};
      } else {
        spEl.textContent='';
      }
      spEl.style.color=fg;
      $('studyBackZone').style.display='flex';
      $('studyBackZone').style.borderTopColor=fg;
      $('studyFlipHint').style.display='none';
      if(S.sound==='auto'||S.sound==='tap') speak(def,'en-US');
    } else {
      const frontMs=flashFlippedAt-flashShownAt;
      const backMs=Date.now()-flashFlippedAt;
      recordFlashcardFlip(i, frontMs, backMs);
      S.xp+=Math.round(10*fatigueXPMultiplier()); save();
      $('studyXP').textContent='XP '+S.xp;
      $('studyCard').onclick=null;
      nextStudyCard();
    }
    }catch(e){ document.title='FLIP:'+e.message.slice(0,40); throw e; }
  };

  show('study');
  $('studySession').style.display='flex';
  $('studyMC').style.display='none';
  $('studyTone').style.display='none';
  if($('studyPOS')) $('studyPOS').style.display='none';
  if($('studyColl')) $('studyColl').style.display='none';
  }catch(e){ document.title='FLASH:'+e.message.slice(0,50); console.error('showStudyFlash',e); }
}

/* --- Study MC --- */
function showStudyMC(i, reverse, showPosHint){
  activeCardIdx=i; mcCur=i; mcLocked=false; mcReverse=reverse;
  rollBg();

  // Render into studyMC panel
  const [ch,syls,def,,pos]=D[i];
  // Fire TTS immediately — before DOM manipulation — so audio arrives with the visual
  if(S.sound!=='mute'){
    if(!reverse) speak(ch,activeCourse().langCode);
    else speak(def,'en-US');
  }
  const fg=getComputedStyle(document.body).color;
  const CJKf="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  const ink=fg;

  $('studyMode').textContent=reverse?'EN → CHAR':'CHAR → EN';

  // Rings
  // Challenge rings: per-modality correct/wrong history
  renderChallengeRings(i, reverse?'mc-rev':'mc-fwd', $('studyMCPrompt'));
  $('studyMCPrompt').style.borderColor=fg;

  if(!reverse){
    const posHintStr=showPosHint&&pos?'<br><span style="font-size:9px;opacity:.65;">'+pos.toUpperCase()+'</span>':'';
    $('studyMCPromptText').innerHTML='<span style="font-size:72px;line-height:1;text-decoration:none;'+CJKf+'">'+ch+'</span>'+posHintStr;
    const py=$('studyMCPinyin'); py.innerHTML='';
    syls.forEach(([s,t])=>{ const sp=document.createElement('span'); sp.textContent=s; sp.style.color=toneColor(t,ink); py.appendChild(sp); });
  } else {
    // Reverse mode: English prompt → progressively localized as meaning axis stage rises
    // Stage 0-1: English def + TTS speaks Mandarin answer (full scaffold)
    // Stage 2+:  English definition always shown; Chinese POS label added below
    const meaningStg=getAxisStage(i,'meaning');
    const displayDef=def.toUpperCase();
    const posLabel=pos||'';
    let posDisplay='';
    if(posLabel){
      const zhPos=POS_ZH[posLabel]||'';
      if(meaningStg<2) posDisplay=posLabel.toUpperCase();
      else if(meaningStg<4) posDisplay=posLabel.toUpperCase()+(zhPos?' · '+zhPos:'');
      else posDisplay=zhPos||posLabel.toUpperCase();
    }
    $('studyMCPromptText').innerHTML=
      '<span style="font-size:18px">'+displayDef+'</span>'+
      (posDisplay?'<br><span style="font-size:9px;opacity:.65;letter-spacing:1px;">'+posDisplay+'</span>':'');
    $('studyMCPinyin').innerHTML='';
  }

  // Choices — adaptive count based on mastery
  const mStage2=meaningStage(masteryScore(i));
  const [nC2, gridCols2]=reverse?adaptiveChoiceCountReverse(i):adaptiveChoiceCount(i,'mc-fwd');
  studyConfidence=null;
  const correct=reverse?ch:def;
  const choices=reverse
    ? shuffle([ch,...pickCharDistractors(i,nC2-1)])
    : shuffle([def,...pickMeaningDistractors(i,nC2-1,mStage2)]);

  const box=$('studyMCChoices'); box.innerHTML='';
  box.style.gridTemplateColumns=gridCols2;

  choices.forEach(choice=>{
    const b=document.createElement('button');
    b.className='choice';
    if(reverse){
      // Phi-unit: character above, pinyin below
      b.style.cssText='border-color:'+fg+';color:'+fg+
        ';display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:8px 6px;';
      const charSpan=document.createElement('span');
      charSpan.textContent=choice;
      charSpan.style.cssText='font-size:28px;line-height:1;'+CJKf;
      b.appendChild(charSpan);
      const mIdx=D.findIndex(d=>d[0]===choice);
      if(mIdx>=0&&D[mIdx][1].length){
        const pyWrap=document.createElement('span');
        pyWrap.style.cssText='font-size:9px;display:flex;gap:3px;font-family:\'Noto Sans\',Arial,sans-serif;';
        D[mIdx][1].forEach(([s,t])=>{
          const sEl=document.createElement('span'); sEl.textContent=s; sEl.style.color=toneColor(t,fg);
          pyWrap.appendChild(sEl);
        });
        b.appendChild(pyWrap);
      }
    } else {
      const fsize=nC2<=2?'12px':nC2<=4?'11px':'9px';
      b.style.cssText='font-size:'+fsize+';border-color:'+fg+';color:'+fg+';padding:8px 4px;';
      b.textContent=choice.toUpperCase();
    }
    b.onclick=()=>pickStudyMC(b,choice,correct,i);
    box.appendChild(b);
  });

  if($('studyMCExplain')) $('studyMCExplain').textContent='';
  ['studySure','studyUnsure','studyDontKnow'].forEach(id=>{
    const b=$(id); if(!b) return;
    b.style.borderColor=fg; b.style.color=fg;
    b.style.background='transparent'; b.style.opacity='.6';
  });
  if($('studyDontKnow')) $('studyDontKnow').disabled=false;
  $('studyMCRank').textContent=cardRankStr(i);
  cardShownAtMC=Date.now();
  // Wire inline wager controls
  currentMultIdx=Math.max(0,naturalMultIdx());
  defaultMultIdx=currentMultIdx;
  wagerTouched=false;
  const sml=document.getElementById('studyMultLabel');
  if(sml) sml.textContent=MULT_STEPS[currentMultIdx]+'x';
  const swd=document.getElementById('studyWagerDown');
  const swu=document.getElementById('studyWagerUp');
  if(swd){ swd.style.borderColor=fg; swd.style.color=fg;
    swd.onclick=(e)=>{ e.stopPropagation(); currentMultIdx=Math.max(0,currentMultIdx-1); wagerTouched=true; if(sml) sml.textContent=MULT_STEPS[currentMultIdx]+'x'; }; }
  if(swu){ swu.style.borderColor=fg; swu.style.color=fg;
    swu.onclick=(e)=>{ e.stopPropagation(); currentMultIdx=Math.min(MULT_STEPS.length-1,currentMultIdx+1); wagerTouched=true; if(sml) sml.textContent=MULT_STEPS[currentMultIdx]+'x'; }; }
  const sModeEl=document.getElementById('studyMCModality');
  if(sModeEl){ sModeEl.textContent=reverse?'MEANING → CHARACTER':'CHARACTER → MEANING'; }
  $('studyXP').textContent='XP '+S.xp;

  // Wager bar — always present on MC
  studyDontKnowAction=()=>{
    if(mcLocked) return; mcLocked=true;
    recordAxisResultNew(i,'meaning',false,Date.now()-cardShownAtMC);
    addMastery(i,-0.3);
    studyPending.push({idx:i,mod:reverse?'mc-rev':'mc-fwd'});
    armTapAdvance($('studyMC'),()=>nextStudyCard(),1200);
  };
  renderWagerControl('studyMCActions',i);

  // Tap prompt area to repeat TTS before answering
  $('studyMCPrompt').style.cursor='pointer';
  $('studyMCPrompt').onclick=function(e){
    if(mcLocked||S.sound==='mute') return;
    if(!reverse){
      speak(ch,activeCourse().langCode);
    } else {
      speak(def,'en-US');
    }
    e.stopPropagation();
  };

  show('study');
  $('studySession').style.display='none';
  $('studyMC').style.display='flex';
  $('studyTone').style.display='none';
  if($('studyPOS')) $('studyPOS').style.display='none';
  if($('studyColl')) $('studyColl').style.display='none';

}

function pickStudyMC(btn,chosen,correct,i){
  if(mcLocked) return; mcLocked=true;
  const isCorrect=chosen===correct;
  const hist=mcHistory.get(i)||[]; hist.push(isCorrect); mcHistory.set(i,hist);

  document.querySelectorAll('#studyMCChoices .choice').forEach(b=>{
    const match=mcReverse?(b.textContent===correct):(b.textContent===correct.toUpperCase());
    if(match) b.classList.add('correct');
    else if(b===btn&&!isCorrect) b.classList.add('wrong');
    b.style.pointerEvents='none';
  });

  logAnswer(i,isCorrect);
  if(!isCorrect){
    // Classify distractor error for targeted re-scheduling
    const errType=classifyDistractorError(i,chosen);
    const ci2=card(i);
    if(!ci2.lastErrorType) ci2.lastErrorType={};
    ci2.lastErrorType.meaning=errType;
    // Opposite errors = more urgent re-review (user has polarity inverted)
    if(errType==='opposite') { setAxisDue(i,'meaning',false,responseMs); }
  }
  const sMStage=meaningStage(masteryScore(i));
  // Confidence inferred from wager — no separate self-report
  const betRatio2=currentMultIdx/Math.max(1,defaultMultIdx);
  const sConfident=betRatio2>=1.5;  // wagered above default = confident
  const sUnsure=betRatio2<0.7;      // wagered below default = uncertain
  const responseMs=Date.now()-cardShownAtMC;
  recordWagerDecision(i, isCorrect, currentMultIdx, defaultMultIdx, responseMs);
  recordAxisResultNew(i,'meaning',isCorrect,responseMs);
  recordAxisResult(i,'meaning',isCorrect); // legacy stage gate
  const lastMod=lastModality.get(i)||'mc-fwd';
  // Response time signal: fast = confident, slow = uncertain
  // <1.5s: 1.3x, 1.5-4s: 1.0x, 4-8s: 0.8x, >8s: 0.6x
  const speedMult=responseMs<1500?1.3:responseMs<4000?1.0:responseMs<8000?0.8:0.6;

  // Wager calibration: consistent over-wagering with wrong answers penalizes more
  // consistent under-wagering with correct answers gives smaller gains (sandbagging)
  const betRatio=currentMultIdx/Math.max(1,defaultMultIdx);
  const wagerMult=isCorrect?(betRatio>1?1.2:betRatio<0.5?0.8:1.0):(betRatio>1?1.3:0.9);

  // Record challenge result in unified session history
  recordChallengeResult(i, mcReverse?'mc-rev':'mc-fwd', isCorrect, responseMs);
  if(isCorrect){
    mcCombo++;
    advanceMult();
    const mGain=(sConfident?1.2:sUnsure?0.6:1.0)*speedMult*(currentMultIdx>defaultMultIdx?1.1:1.0);
    const xpGained=computeXP(true, currentMultIdx, responseMs)*(mcCombo>=5?2:1);
    S.xp+=Math.round(xpGained*fatigueXPMultiplier());
    addMastery(i,Math.min(2.0,mGain)); rate(i,3);
    if($('studyMCExplain')) $('studyMCExplain').textContent='';
  } else {
    mcCombo=0;
    resetMult();
    // Overconfident wrong (high wager, fast) = bigger loss
    const mLoss2=(sConfident?-0.8:sUnsure?-0.2:-0.5)*wagerMult*(speedMult>1.0?1.2:1.0);
    addMastery(i,Math.max(-1.5,mLoss2)); rate(i,1); studyPending.push(i);
    // Regression: if mastery drops low, push back toward flashcard phase
    if(masteryScore(i)<0.5){
      const ci=card(i);
      ci.exp=Math.max(0,(ci.exp||0)-1);
      save();
    }
    const CJKe="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
    const [correctCh,,correctDef]=D[i];
    const el=$('studyMCExplain');
    if(el){
      if(!mcReverse){
        el.textContent='✗ '+chosen.toUpperCase()+' → ✓ '+correctDef.toUpperCase();
        el.style.fontFamily='inherit';
      } else {
        el.textContent='✗ '+chosen+' → ✓ '+correctCh;
        el.style.fontFamily=CJKe;
      }
    }
  }
  save();
  $('studyXP').textContent='XP '+S.xp;

  // Arm tap immediately — don't wait for TTS to finish
  armTapAdvance($('studyMC'),()=>nextStudyCard(),isCorrect?0:1200);
  // TTS plays in parallel
  if(S.sound!=='mute') speak(D[i][0],activeCourse().langCode);
  // Make character tappable post-answer to open dictionary
  const ptEl=$('studyMCPromptText');
  if(ptEl&&!mcReverse){
    ptEl.style.cursor='pointer';
    ptEl.onclick=(e)=>{ e.stopPropagation(); openCharDetail(D[i][0],0,i); };
  }
}

/* --- Study Tone Interjection --- */
function toneStage(mastery){
  if(mastery<1.0) return 1; // char+pinyin shown, audio plays — associate mark with sound
  if(mastery<2.0) return 2; // char only, audio plays — identify by ear
  if(mastery<3.0) return 3; // char only, NO audio until after answer — read the tone
  return 4;                  // no char in audio mode — pure listening
}

function showStudyTone(i){
  toneCur=i; toneLocked=false;
  rollBg();
  const [ch,syls]=D[i];
  const CJKf="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  const fg=getComputedStyle(document.body).color;
  const stage=toneStage(masteryScore(i));
  const primaryTone=syls.find(([,t])=>t!==0)?.[1]??syls[0][1];
  const tSym={1:'-',2:'/',3:'v',4:'\u005c',0:'.'};

  // Stage label tells user what kind of question this is
  const stageLabels={1:'TONE · LISTEN',2:'TONE · LISTEN',3:'TONE · READ',4:'TONE · LISTEN ONLY'};
  $('studyMode').textContent=stageLabels[stage];
  // Tap tone prompt to replay audio (before answer)
  $('studyTonePrompt').onclick=(e)=>{
    if(toneLocked) return;
    if(S.sound!=='mute') speak(D[i][0],activeCourse().langCode);
    e.stopPropagation();
  };
  // Rings and wager
  renderChallengeRings(i,'tone',$('studyTonePrompt'));
  cardShownAtMC=Date.now();
  studyDontKnowAction=()=>{ if(toneLocked) return; toneLocked=true; studyPending.push(i); armTapAdvance($('studyTone'),()=>nextStudyCard(),0); };
  renderWagerControl('studyToneWager',i);

  // Show/hide character based on stage
  if(stage===4){
    // Pure audio — hide character, show question mark
    // Stage 4: hide character, show Mandarin instruction instead
    $('studyToneChar').textContent='';
    $('studyToneChar').style.fontFamily='inherit';
    // Insert instruction text below char
    const s4inst=document.createElement('div');
    s4inst.id='toneStage4Inst';
    s4inst.style.cssText='font-size:14px;text-align:center;opacity:.8;font-family:\'PingFang SC\',\'Heiti SC\',sans-serif;line-height:2;';
    s4inst.innerHTML='听声调<br><span style="font-size:8px;font-family:\'Noto Sans\',Arial,sans-serif;opacity:.7;letter-spacing:1px;">tīng shēngdiào — listen for the tone</span>';
    s4inst.style.color=fg;
    $('studyToneChar').parentElement.insertBefore(s4inst, $('studyTonePy'));
  } else {
    $('studyToneChar').textContent=ch;
    $('studyToneChar').style.fontFamily=CJKf.split(':')[1];
  }
  $('studyToneChar').style.color=fg;
  $('studyToneChar').style.textDecoration='none';

  // Stage 1: show pinyin WITH tone marks visible before answer
  const py=$('studyTonePy'); py.innerHTML='';
  if(stage===1){
    py.style.opacity='1';
    syls.forEach(([s,t])=>{
      const sp=document.createElement('span');
      sp.textContent=s+' '; sp.style.color=toneColor(t,fg);
      py.appendChild(sp);
    });
  } else {
    py.style.opacity='0';
  }

  // Audio: stages 1,2,4 play immediately; stage 3 waits until after answer
  if(stage!==3 && S.sound!=='mute') speak(ch,activeCourse().langCode);

  // Build tone buttons
  const box=$('studyToneChoices'); box.innerHTML='';
  [1,2,3,4,0].forEach(t=>{
    const b=document.createElement('button');
    b.className='tone-btn';
    b.style.borderColor=fg; b.style.color=fg;
    const sym=t===4 ? '\u005C' : tSym[t];
    b.innerHTML='<span style="font-size:22px">'+sym+'</span>';
    b.onclick=()=>{
      try{
      if(toneLocked) return; toneLocked=true;
      const ok=t===primaryTone;

      document.querySelectorAll('#studyToneChoices .tone-btn').forEach(tb=>{
        const bt=[1,2,3,4,0][Array.from(tb.parentNode.children).indexOf(tb)];
        if(bt===primaryTone) tb.classList.add('correct');
        else if(tb===b&&!ok) tb.classList.add('wrong');
        tb.style.pointerEvents='none';
      });

      // Always reveal pinyin with tone colors after answer
      py.innerHTML=''; py.style.opacity='1';
      const ink=getComputedStyle(document.body).color;
      syls.forEach(([s,t])=>{
        const sp=document.createElement('span');
        sp.textContent=s+' '; sp.style.color=toneColor(t,ink);
        py.appendChild(sp);
      });

      // Stage 3: audio plays only after answer (reward/reveal)
      if(S.sound!=='mute') speak(ch,activeCourse().langCode);

      // Stage 4: reveal character after answer
      if(stage===4){
        $('studyToneChar').textContent=ch;
        $('studyToneChar').style.fontFamily=CJKf.split(':')[1];
        $('studyToneChar').style.textDecoration='none';
      }

      const toneMs=Date.now()-cardShownAtMC;
      recordChallengeResult(i,'tone',ok,toneMs);
      recordWagerDecision(i,ok,currentMultIdx,defaultMultIdx,toneMs);
      logAnswer(i,ok);
      const tSpeedM=toneMs<1500?1.3:toneMs<4000?1.0:0.8;
      if(ok){ advanceMult(); S.xp+=Math.round(computeXP(true,currentMultIdx,toneMs)*fatigueXPMultiplier()); addMastery(i,0.25*tSpeedM); }
      else { resetMult(); addMastery(i,-0.1); studyPending.push(i); }
      save();
      $('studyTonePrompt').onclick=null; // remove replay handler — tap now advances
      armTapAdvance($('studyTone'),()=>nextStudyCard(),ok?0:1200);
      }catch(e){ document.title='TONE:'+e.message.slice(0,40); throw e; }
    };
    box.appendChild(b);
  });

  // Skip button — no penalty, just advance
  const oldSkip=document.getElementById('toneSkipRow');
  if(oldSkip) oldSkip.remove();
  const skipRow=document.createElement('div');
  skipRow.id='toneSkipRow';
  const skipBtn=document.createElement('button');
  skipBtn.style.cssText='font-family:inherit;font-size:8px;padding:8px;border:2px solid '+fg+';background:transparent;color:'+fg+';cursor:pointer;width:100%;opacity:.45;';
  skipBtn.textContent='✕ SKIP  (loud environment)';
  skipBtn.onclick=(e)=>{ e.stopPropagation(); if(toneLocked) return; toneLocked=true; setTimeout(()=>nextStudyCard(),150); };
  skipRow.appendChild(skipBtn);
  $('studyTone').appendChild(skipRow);

  show('study');
  $('studySession').style.display='none';
  $('studyMC').style.display='none';
  $('studyTone').style.display='flex';
  if($('studyPOS')) $('studyPOS').style.display='none';
  if($('studyColl')) $('studyColl').style.display='none';
}


/* ============ SESSION SUMMARY ============ */
// Track session performance: {idx: {correct:n, wrong:n, masteryDelta:n, char, def}}
const sessionLog=new Map();
let sessionXPStart=0;
let summaryReturnView='home'; // which view CONTINUE goes back to

function logAnswer(i, isCorrect){
  const entry=sessionLog.get(i)||{correct:0,wrong:0,masteryBefore:masteryScore(i)};
  if(isCorrect) entry.correct++;
  else entry.wrong++;
  sessionLog.set(i,entry);
  sessionAnswerRing.push(!!isCorrect);
  if(sessionAnswerRing.length>ANSWER_RING_SIZE) sessionAnswerRing.shift();
}

function showSummary(returnView){
  summaryReturnView=returnView||'home';
  const fg=getComputedStyle(document.body).color;
  rollBg();

  let totalCorrect=0,totalWrong=0;
  const rows=[];

  sessionLog.forEach((entry,i)=>{
    totalCorrect+=entry.correct;
    totalWrong+=entry.wrong;
    const [ch,,def]=D[i];
    const mNow=masteryScore(i);
    const mDelta=mNow-(entry.masteryBefore||0);
    rows.push({i,ch,def,correct:entry.correct,wrong:entry.wrong,mDelta,mNow});
  });

  // Sort: wrong-heavy first, then by most encountered
  rows.sort((a,b)=>{
    const aWrongRate=a.wrong/(a.correct+a.wrong+0.001);
    const bWrongRate=b.wrong/(b.correct+b.wrong+0.001);
    return bWrongRate-aWrongRate || (b.correct+b.wrong)-(a.correct+a.wrong);
  });

  $('sum-correct').textContent=totalCorrect;
  $('sum-wrong').textContent=totalWrong;
  $('sum-xp').textContent='+'+(S.xp-sessionXPStart);

  // Attention words
  const needsWork=rows.filter(r=>r.wrong>r.correct);
  $('summary-attention').textContent=needsWork.length
    ? 'NEEDS ATTENTION: '+needsWork.map(r=>r.ch).join('  ')
    : needsWork.length===0&&rows.length>0?'ALL CORRECT THIS SESSION':'';

  // Word list
  const list=$('summary-list'); list.innerHTML='';
  rows.forEach(r=>{
    const row=document.createElement('div');
    const isWrong=r.wrong>r.correct;
    row.className='summary-row '+(isWrong?'s-wrong':'s-correct');
    row.style.borderColor=fg; row.style.color=fg;
    if(isWrong) row.style.borderLeftColor='hsl(0,70%,40%)';
    else row.style.borderLeftColor='hsl(120,60%,35%)';

    const mStr=(r.mDelta>=0?'+':'')+r.mDelta.toFixed(1);
    row.innerHTML=
      '<span class="s-char">'+r.ch+'</span>'+
      '<span style="font-size:8px;opacity:.8">'+r.def.toUpperCase()+'</span>'+
      '<span class="s-result">'+r.correct+'✓ '+r.wrong+'✗  M'+mStr+'</span>';
    row.onclick=()=>{ jumpToCard(r.i); };
    list.appendChild(row);
  });

  // Style static elements
  [$('summary-home'),$('summary-continue')].forEach(b=>{
    b.style.borderColor=fg; b.style.color=fg;
  });
  $('sum-correct').parentElement.style.borderColor=fg;
  $('sum-correct').parentElement.style.color=fg;

  show('summary');
}

function startSessionLog(returnView){
  sessionLog.clear();
  sessionXPStart=S.xp;
  summaryReturnView=returnView;
}


/* ============ STUDY POS INTERJECTION ============ */
// Four-stage grammar psyop:
// Stage 1 (mastery<1): options are DEFINITIONS of categories — user learns what a verb IS
// Stage 2 (mastery 1-2): category names with brief definition beneath — name becomes primary
// Stage 3 (mastery 2-3): category names only, no definitions
// Stage 4 (mastery 3+): full subcategory precision

// Stage 1: definitions as answer options
// Maps rawPos -> {label, definition} for the four broad logical categories
const POS_LOGICAL={
  // ── AGENT/THING ─────────────────────────────────────────────────
  // In Mandarin: no articles, no plural markers, no case endings.
  // Nouns are bare concepts. Context determines meaning.
  'noun':{cat:'AGENT/THING',
    def:'names a concept, person, place, or thing — used bare, without articles or plural markers',
    mandarin_note:'Mandarin nouns never change form. 书 means book, books, a book, the book.'},
  'pronoun':{cat:'AGENT/THING',
    def:'stands in place of a noun — the who or what in a sentence',
    mandarin_note:'我 你 他 她 — add 们 for plural. No case: 我 is both I and me.'},
  'suffix':{cat:'AGENT/THING',
    def:'attaches to another word to shift or extend its meaning',
    mandarin_note:'Often creates nouns from other words. 子 and 头 are common noun suffixes.'},

  // ── ACTION/STATE ─────────────────────────────────────────────────
  // In Mandarin: verbs do not conjugate. No tense in the verb itself.
  // Aspect markers (了 着 过) show how an action relates to time, not when.
  // Adjectives ARE stative verbs — 好 means both "good" and "to be good."
  'verb':{cat:'ACTION/STATE',
    def:'expresses an action or state — verbs never conjugate in Mandarin',
    mandarin_note:'No tense in the verb. 他去 = he goes / he went / he will go. Context decides.'},
  'modal verb':{cat:'ACTION/STATE',
    def:'expresses possibility, ability, willingness, or obligation before another verb',
    mandarin_note:'能 可以 会 要 得 — always precede the main verb. Cannot stand alone.'},
  'verb/modal':{cat:'ACTION/STATE',
    def:'functions as both a main verb and a modal marker depending on context',
    mandarin_note:'Some verbs double as modals. 要 means want (verb) or will/must (modal).'},
  'verb/prep':{cat:'ACTION/STATE',
    def:'functions as both a verb and a positional/relational marker',
    mandarin_note:'在 means to be at (verb) or at/in (preposition). Usage determines role.'},
  'noun/verb':{cat:'ACTION/STATE',
    def:'a word that can either name something or describe an action depending on position',
    mandarin_note:'工作 = work (noun) or to work (verb). Position in sentence determines function.'},

  // ── QUALITY/DEGREE ────────────────────────────────────────────────
  // In Mandarin: adjectives are stative verbs. They need no copula.
  // 他很好 = he [very] good. 很 is required not for meaning but for rhythm.
  'adjective':{cat:'QUALITY/DEGREE',
    def:'describes a quality — in Mandarin adjectives are also stative verbs needing no 是',
    mandarin_note:'他好 sounds abrupt. 他很好 is natural. 很 here is rhythmic, not emphatic.'},
  'adverb':{cat:'QUALITY/DEGREE',
    def:'modifies a verb or adjective — shows degree, frequency, or manner',
    mandarin_note:'Always precede what they modify. 都 很 也 还 just — position is strict.'},
  'noun/adj':{cat:'QUALITY/DEGREE',
    def:'functions as both a noun and a descriptive modifier depending on context',
    mandarin_note:'中 = middle (noun) or central (adj). 中国 = middle kingdom / China.'},
  'noun/adv':{cat:'QUALITY/DEGREE',
    def:'functions as both a noun and a degree/manner modifier',
    mandarin_note:'Some time/place words act as adverbs when placed before the verb.'},

  // ── LOGICAL GLUE ──────────────────────────────────────────────────
  // The most distinctively Mandarin category.
  // Particles are grammatical signals with no translatable content.
  // Measure words are mandatory — every count requires a classifier.
  'particle':{cat:'LOGICAL GLUE',
    def:'a grammatical signal with no content meaning — marks aspect, possession, or sentence mood',
    mandarin_note:'了 marks completion. 的 marks possession/modification. 吗 marks a question. None translate directly.'},
  'conjunction':{cat:'LOGICAL GLUE',
    def:'connects two clauses or ideas, often appearing in pairs',
    mandarin_note:'Mandarin often uses paired conjunctions: 虽然...但是 (although...but), 如果...就 (if...then).'},
  'measure word':{cat:'LOGICAL GLUE',
    def:'a mandatory classifier between a number and a noun — every count requires one',
    mandarin_note:'一本书 (one book), 一张纸 (one sheet). The measure word encodes the noun\u2019s nature.'},
  'interjection':{cat:'LOGICAL GLUE',
    def:'stands alone to express emotion, acknowledgment, or social function',
    mandarin_note:'Often sentence-final. 啊 哦 嗯 呢 — modify tone and social register.'},
  'noun/prep':{cat:'LOGICAL GLUE',
    def:'names a location or relationship and also marks positional structure in a sentence',
    mandarin_note:'里 上 下 前 后 — can be nouns (the inside) or positional markers (inside [of]).'},
};

// ── CATEGORY DESCRIPTIONS (stage 1 prompt text) ──────────────────
// These are the definitions shown in stage 1 POS questions.
// Mandarin-specific, not generic English grammar definitions.
const CAT_DEFS={
  'AGENT/THING':   'something that exists — a person, object, or idea you can point to',
  'ACTION/STATE':  'something that happens or is — what something does, or how something is',
  'QUALITY/DEGREE':'something that describes — how big, how fast, how much, to what degree',
  'LOGICAL GLUE':  'something that connects or signals — shows how other words relate to each other',
};
// ── AXIS STAGE 1: four pre-linguistic logical categories
const POS_STAGE1_CATS=['AGENT/THING','ACTION/STATE','QUALITY/DEGREE','LOGICAL GLUE'];

// ── AXIS STAGE 2: standard POS names (no compound types yet)
// Compound types collapse to their primary category
const POS_STAGE2_MAP={
  'verb/modal':'modal verb','verb/prep':'verb','noun/verb':'verb',
  'noun/adj':'adjective','noun/adv':'adverb','noun/prep':'noun',
  'suffix':'particle', // suffix → particle family at this stage
};
const POS_STAGE2=['noun','verb','adjective','adverb','pronoun',
                  'particle','conjunction','modal verb','measure word'];

// ── AXIS STAGE 3: Mandarin-specific compound types revealed
// User sees that some words straddle categories — this is Mandarin's feature not a bug
const POS_STAGE3=[
  'noun','verb','adjective','adverb','pronoun',
  'particle','conjunction','modal verb','measure word',
  'noun/verb',   // 工作 — work (n) / to work (v)
  'verb/prep',   // 在 — to be at (v) / at (prep)
  'verb/modal',  // 要 — to want (v) / will/must (modal)
  'noun/adj',    // 中 — middle (n) / central (adj)
  'noun/prep',   // 里 — inside (n) / in (prep)
];

// ── AXIS STAGE 4: full precision + Mandarin ZH labels
const POS_STAGE4=[
  'noun','verb','adjective','adverb','pronoun',
  'particle','conjunction','modal verb','measure word','interjection',
  'noun/verb','noun/adj','noun/prep','noun/adv','verb/prep','verb/modal','suffix'
];
const ALL_POS=POS_STAGE4;

// Stage mapping — what distractors are available at each axis stage
function posAllCatsForAxisStage(axisStage){
  if(axisStage<=1) return POS_STAGE1_CATS;
  if(axisStage===2) return POS_STAGE2;
  if(axisStage===3) return POS_STAGE3;
  return POS_STAGE4;
}
const POS_ZH={'noun':'名词','verb':'动词','adjective':'形容词','adverb':'副词','pronoun':'代词','particle':'助词','conjunction':'连词','modal verb':'能愿动词','measure word':'量词','interjection':'感叹词','noun/verb':'名词/动词','noun/adj':'名词/形容词','noun/prep':'名词/介词','verb/prep':'动词/介词','verb/modal':'能愿动词','suffix':'后缀','noun/adv':'名词/副词'};

function posStage(mastery){ 
  if(mastery<1.0) return 1;
  if(mastery<2.0) return 2;
  if(mastery<3.0) return 3;
  return 4;
}

function posDataForStage(rawPos, stage){
  const info=POS_LOGICAL[rawPos]||{cat:'LOGICAL GLUE',def:'a grammatical function word'};

  if(stage===1){
    // Broad logical category — definition as prompt, category name as answer
    return {correct:info.cat, allCats:POS_STAGE1_CATS, def:info.def};
  }

  if(stage===2){
    // Standard POS names — compound types collapse to primary
    const mapped=POS_STAGE2_MAP[rawPos]||(POS_STAGE2.includes(rawPos)?rawPos:rawPos.split('/')[0]);
    const validMapped=POS_STAGE2.includes(mapped)?mapped:(POS_STAGE2.includes(rawPos.split('/')[0])?rawPos.split('/')[0]:'noun');
    return {correct:validMapped, allCats:POS_STAGE2, def:POS_EXPLAIN[validMapped]||''};
  }

  if(stage===3){
    // Compound types now available — reveal Mandarin's dual-function words
    // If the word has a compound type and it's in stage 3 list, show it
    const inStage3=POS_STAGE3.includes(rawPos);
    const correct=inStage3?rawPos:(POS_STAGE2_MAP[rawPos]||rawPos.split('/')[0]);
    return {correct, allCats:POS_STAGE3, def:null};
  }

  // Stage 4: full precision + ZH labels available
  return {correct:rawPos, allCats:POS_STAGE4, def:null};
}

function showStudyPOS(i){
  const [ch,syls,,, pos]=D[i];
  if(!pos){ nextStudyCard(); return; } // no POS data, skip

  const fg=getComputedStyle(document.body).color;
  const CJKf="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";

  $('studyMode').textContent='PART OF SPEECH';
  $('studyPOSRank').textContent='';
  $('studyPOSChar').textContent=ch;
  $('studyPOSChar').style.fontFamily=CJKf.split(':')[1].trim();
  $('studyPOSChar').style.color=fg;
  $('studyPOSChar').style.textDecoration='none';

  // Pinyin
  const py=$('studyPOSPinyin'); py.innerHTML='';
  syls.forEach(([s,t])=>{ const sp=document.createElement('span'); sp.textContent=s+' '; sp.style.color=toneColor(t,fg); py.appendChild(sp); });

  const m=masteryScore(i);
  const stage=posStage(m);
  const {correct:correctCat, allCats, def:correctDef}=posDataForStage(pos,stage);
  const distractorCats=shuffle(allCats.filter(p=>p!==correctCat)).slice(0,5);
  const choiceCats=shuffle([correctCat,...distractorCats]);

  // Stage 1: show definitions as button labels; Stage 2: name + small def; Stage 3+: name only
  function labelForCat(cat){
    if(stage===1){
      // Definition IS the label
      const entry=Object.values(POS_LOGICAL).find(v=>v.cat===cat);
      return entry?entry.def.toUpperCase():'?';
    }
    return cat.toUpperCase();
  }
  function subLabelForCat(cat){
    if(stage===2) return POS_EXPLAIN[cat]?POS_EXPLAIN[cat].split('.')[0].toUpperCase():'';
    return '';
  }

  let posLocked=false;
  const box=$('studyPOSChoices'); box.innerHTML='';
  // Stage 1 uses 2-column grid (definitions are long); others use 3-column
  box.style.gridTemplateColumns=stage===1?'1fr 1fr':'1fr 1fr 1fr';

  choiceCats.forEach(cat=>{
    const b=document.createElement('button');
    b.className='choice';
    const sub=subLabelForCat(cat);
    b.style.cssText='font-size:'+(stage===1?'7px':'8px')+';border-color:'+fg+';color:'+fg+';padding:10px 6px;line-height:1.5;text-align:center;';
    b.innerHTML=labelForCat(cat)+(sub?'<br><span style="font-size:6px;opacity:.7">'+sub+'</span>':'');
    b.onclick=()=>{
      if(posLocked) return; posLocked=true;
      const isCorrect=cat===correctCat;

      // On wrong: reveal correct with category name always shown
      document.querySelectorAll('#studyPOSChoices .choice').forEach(tb=>{
        const tbCat=choiceCats[Array.from(box.children).indexOf(tb)];
        if(tbCat===correctCat) tb.classList.add('correct');
        else if(tb===b&&!isCorrect) tb.classList.add('wrong');
        tb.style.pointerEvents='none';
      });

      // Show category name confirmation below prompt
      const conf=document.createElement('div');
      conf.style.cssText='font-size:9px;text-align:center;padding-top:6px;opacity:.9;';
      conf.textContent=(isCorrect?'✓ ':'→ ')+correctCat.toUpperCase();
      if(stage===1) $('studyPOSPrompt').appendChild(conf);

      logAnswer(i,isCorrect);
      if(isCorrect){ S.xp+=Math.round(8*(mcCombo>=5?2:1)*fatigueXPMultiplier()); addMastery(i,0.5); }
      else { addMastery(i,-0.25); studyPending.push(i); }
      save();
      if(S.sound!=='mute') speak(ch,activeCourse().langCode);
      setTimeout(()=>{ conf.remove(); nextStudyCard(); }, isCorrect?600:1300);
    };
    box.appendChild(b);
  });

  // Style prompt
  $('studyPOSPrompt').style.borderColor=fg;
  $('studyPOSPrompt').style.color=fg;

  show('study');
  $('studySession').style.display='none';
  $('studyMC').style.display='none';
  $('studyTone').style.display='none';
  $('studyPOS').style.display='flex';

  if(S.sound!=='mute') speak(ch,activeCourse().langCode);
}


/* ============ SESSION FATIGUE ============ */
// Optimal window: 30 minutes / ~60 cards
// After that: diminishing returns, dull colors, funny messages
// The app wants you to sleep. Sleep is where learning actually happens.

const OPTIMAL_CARDS=60;    // cards before fatigue begins
const FATIGUE_CARDS=90;    // cards before full grass-touching mode
const FATIGUE_MESSAGES=[
  "hey. go outside.",
  "your hippocampus is full. it needs to defrag.",
  "sleep is literally when you learn this. just saying.",
  "still here? bold choice.",
  "the neurons are tired. they're not mad, just disappointed.",
  "you've been staring at flashcards for a while now...",
  "fun fact: more studying right now does approximately nothing.",
  "the optimal move is to touch grass.",
  "your brain has left the building.",
  "at this point you're just collecting XP dust.",
  "go drink some water. seriously.",
  "科学说：睡觉。 (science says: sleep.)",
];

let sessionCardCount=0; // total cards across all modalities this session
let fatigueMessageShown=new Set();

function sessionFatigueLevel(){
  if(sessionCardCount<OPTIMAL_CARDS) return 0;   // fresh
  if(sessionCardCount<FATIGUE_CARDS) return 1;   // tapering
  return 2;                                       // grass time
}

function fatigueXPMultiplier(){ // DISABLED — always 1.0
  return 1.0;
}

function applyFatiguePalette(){
  const f=sessionFatigueLevel();
  // Apply via overlay div rather than touching body colors
  // so rollBg always wins and home screen is never affected
  let overlay=document.getElementById('fatigueOverlay');
  if(f===0){
    if(overlay) overlay.style.opacity='0';
    return;
  }
  if(!overlay){
    overlay=document.createElement('div');
    overlay.id='fatigueOverlay';
    overlay.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:998;background:#000;transition:opacity 1s;';
    document.body.appendChild(overlay);
  }
  overlay.style.opacity=f===1?'0.25':'0.55';
}

function maybeFatigueMessage(){
  const f=sessionFatigueLevel();
  if(f===0) return;

  // Show a message every 10 cards in fatigue zone
  const slot=Math.floor(sessionCardCount/10);
  if(fatigueMessageShown.has(slot)) return;
  fatigueMessageShown.add(slot);

  const msg=FATIGUE_MESSAGES[slot%FATIGUE_MESSAGES.length];
  // Flash message in streakbar/studystreak area
  const el=$('streakbar')||$('studyStreakBar');
  if(el){ el.textContent=msg; setTimeout(()=>{ if(el.textContent===msg) el.textContent=''; },3000); }
}

function tickSessionCard(){ // DISABLED
  return; // fatigue mechanics disabled
  sessionCardCount++;
  // Track daily cards
  const today=new Date().toDateString();
  if(S.dailyDate!==today){ S.dailyCards=0; S.dailyDate=today; }
  S.dailyCards++;
  save();
  applyFatiguePalette();
  maybeFatigueMessage();
}

function resetSessionFatigue(){ // DISABLED — fatigue mechanics off
  sessionCardCount=0;
  fatigueMessageShown.clear();
  const overlay=document.getElementById('fatigueOverlay');
  if(overlay) overlay.remove();
}


/* ============ POS EXPLANATIONS ============ */
const POS_EXPLAIN={
  "noun":           "NAMES a person, place, thing, or idea. No plural forms in Mandarin — context determines number.",
  "verb":           "EXPRESSES action or state. No conjugation — same form for all persons and tenses.",
  "adjective":      "DESCRIBES a noun. In Mandarin, adjectives can act as predicates directly: 他好 = he is good.",
  "adverb":         "MODIFIES a verb or adjective. Always placed BEFORE what it modifies.",
  "pronoun":        "STANDS IN for a noun. 我你他她们 — personal pronouns. No case forms (no him/her distinction in speech).",
  "particle":       "GRAMMATICAL GLUE. Carries structural meaning rather than content meaning. 的了吗呢 — the hardest words to translate, the most important to recognize.",
  "conjunction":    "CONNECTS clauses or ideas. 和但是因为所以 — similar role to English conjunctions.",
  "modal verb":     "EXPRESSES ability, possibility, or obligation. Precedes the main verb. 会能可以 — can, may, able to.",
  "measure word":   "REQUIRED between a number and a noun. Every noun has its own classifier. 个 is the general one.",
  "interjection":   "STANDS ALONE as a complete utterance. Expresses emotion or social function.",
  "noun/verb":      "FUNCTIONS as both noun and verb depending on context. Very common in Mandarin.",
  "noun/adj":       "FUNCTIONS as both noun and adjective. Context determines role.",
  "noun/prep":      "FUNCTIONS as both noun and preposition. 里外前后 — inside, outside, front, back.",
  "noun/adv":       "FUNCTIONS as both noun and adverb. 现在 — 'now' as noun or adverb.",
  "verb/prep":      "FUNCTIONS as both verb and preposition. 在 — to be at / at.",
  "verb/modal":     "FUNCTIONS as both verb and modal. 要 — to want / will / must.",
  "suffix":         "ATTACHES to other words. 们 pluralizes pronouns and people nouns.",
};

function showPOSExplain(pos, anchorEl){
  // Remove any existing tooltip
  const existing=document.getElementById('posTooltip');
  if(existing){ existing.remove(); return; } // toggle off

  const tip=document.createElement('div');
  tip.id='posTooltip';
  const fg=getComputedStyle(document.body).color;
  const bg=document.body.style.backgroundColor;
  tip.style.cssText='position:fixed;bottom:80px;left:16px;right:16px;z-index:999;'+
    'border:3px solid '+fg+';background:'+bg+';color:'+fg+';'+
    'font-family:inherit;font-size:8px;line-height:1.8;padding:12px;'+
    'letter-spacing:.5px;cursor:pointer;';
  const exp=POS_EXPLAIN[pos]||('A '+pos+' — grammatical category.');
  tip.innerHTML='<span style="font-size:9px">'+pos.toUpperCase()+'</span><br>'+exp;
  tip.onclick=(e)=>{e.stopPropagation();tip.remove();};
  document.body.appendChild(tip);
  // Auto-dismiss after 6 seconds
  setTimeout(()=>{ if(document.getElementById('posTooltip')===tip) tip.remove(); },6000);
}


function clearCardState(){
  const s4=document.getElementById('toneStage4Inst');
  if(s4) s4.remove();
  const pc=document.getElementById('posAnswerConf');
  if(pc) pc.remove();
  const az=document.getElementById('studyPOSAnswer');
  if(az) az.innerHTML='';
  const th=document.getElementById('tapAdvanceHint'); if(th) th.remove();
  ['studyMCTapHint','studyPOSTapHint','studyToneTapHint'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=''; });
  // Dismiss any open tooltip
  const tip=document.getElementById('posTooltip');
  if(tip) tip.remove();
  // Hide back zones
  const cbz=$('card-back-zone');
  if(cbz) cbz.style.display='none';
  const sbz=$('studyBackZone');
  if(sbz) sbz.style.display='none';
  // Reset flip hint
  const fh=$('flipHint');
  if(fh){ fh.style.display='block'; fh.textContent='TAP TO FLIP'; }
  const sfh=$('studyFlipHint');
  if(sfh){ sfh.style.display='block'; sfh.textContent='TAP TO FLIP'; }
  // Clear rate label
  const rl=$('rateLabel');
  if(rl) rl.textContent='';
}


function goHome(){
  studyFlashOnly=false;
  studyModalityFilter=null;
  resetSessionFatigue();
  show('home'); rollBg(); renderHome(); applyBilingualUI();
}


/* ============ MEANING MC STAGING ============ */
function meaningStage(mastery){
  if(mastery<1.0) return 1; // 3 choices, wide distractors, confidence-building
  if(mastery<2.0) return 2; // 6 choices, standard distractors, forward only
  if(mastery<3.0) return 3; // 6 choices, same-POS distractors, fwd+rev equal
  return 4;                  // 6 choices, tightest distractors, near-synonyms
}

// Semantic field groupings for stage 4 cluster questions
const SEMANTIC_FIELDS={
  'people':    [0,1,2,6,7,8,27],        // 的我你他她们人
  'time':      [34,35,36,37,38,39],     // 知道时间年天今天明天昨天
  'food':      [40,41,42,43,44],        // 吃喝水饭茶
  'learning':  [45,46,47],              // 学学生老师
  'social':    [48,49,50],              // 朋友爱喜欢
  'work':      [51,52,53],              // 做工作钱
  'space':     [68,69,70,71,72,73],     // 里外前后左右
  'movement':  [74,75,76,77,78,79],     // 走跑开关门车
  'tech':      [86,87,88,89,90],        // 电话手机电脑书写
};

function getSemanticField(idx){
  for(const [field,indices] of Object.entries(SEMANTIC_FIELDS)){
    if(indices.includes(idx)) return {field, indices};
  }
  return null;
}

// Pick distractors for meaning stage
function pickMeaningDistractors(targetIdx, n, stage){
  const [ch,,correctDef,,targetPos]=D[targetIdx];

  // Get introduced characters for semantic lookup
  const introChs=D.filter((_,i)=>isUnlocked(i)).map(d=>d[0]);

  // Try semantic distractors first — always preferred over random
  const semantic=getSemanticDistractors(targetIdx, n, introChs);

  // Pad with fallback pool if semantic doesn't fill n slots
  if(semantic.length<n){
    const needed=n-semantic.length;
    const semSet=new Set(semantic);
    semSet.add(correctDef);

    // Fallback pool — scored by stage
    const pool=D.map((_,i)=>i).filter(i=>{
      if(i===targetIdx||!isUnlocked(i)) return false;
      if(D[i][2]===correctDef||semSet.has(D[i][2])) return false;
      return true;
    });

    const scored=pool.map(i=>{
      const [,,,, pos2]=D[i];
      let score=Math.random();
      if(stage<=1){
        // Early stage: prefer same category for productive confusion
        if(pos2&&POS_LOGICAL[pos2]&&POS_LOGICAL[targetPos]&&
           POS_LOGICAL[pos2].cat===POS_LOGICAL[targetPos].cat) score+=2;
        // Also prefer nearby frequency rank (common words confusable)
        score+=Math.max(0, 3-Math.abs(i-targetIdx)/5);
      } else if(stage>=3){
        // Later stage: same POS = harder discrimination
        if(pos2===targetPos) score+=3;
        score+=Math.max(0, 4-Math.abs(i-targetIdx)/3);
      } else {
        // Mid stage: same broad category
        if(pos2&&POS_LOGICAL[pos2]&&POS_LOGICAL[targetPos]&&
           POS_LOGICAL[pos2].cat===POS_LOGICAL[targetPos].cat) score+=2;
      }
      return {i,score};
    }).sort((a,b)=>b.score-a.score);

    const fallback=shuffle(scored.slice(0,needed*3)).slice(0,needed).map(s=>D[s.i][2]);
    return [...semantic,...fallback];
  }

  return semantic.slice(0,n);
}

// Confidence mechanic state
let mcConfidence=null; // null | 'sure' | 'unsure'
let studyConfidence=null;

function addConfidenceButtons(container, onSelect, fg){
  const row=document.createElement('div');
  row.style.cssText='display:flex;gap:8px;width:100%;margin-bottom:6px;';
  ['SURE','UNSURE'].forEach(label=>{
    const b=document.createElement('button');
    b.style.cssText='font-family:inherit;font-size:7px;padding:6px;border:2px solid '+fg+';background:transparent;color:'+fg+';cursor:pointer;flex:1;opacity:.6;';
    b.textContent=label;
    b.onclick=(e)=>{
      e.stopPropagation();
      row.querySelectorAll('button').forEach(x=>{ x.style.opacity='.4'; x.style.background='transparent'; });
      b.style.opacity='1';
      b.style.background='rgba(0,0,0,0.15)';
      onSelect(label==='SURE'?'sure':'unsure');
    };
    row.appendChild(b);
  });
  container.insertBefore(row, container.firstChild);
  return row;
}



/* ============ COLLOQUIALISMS ============ */
const COLL=[
  // Format: [expr, syls, meaning, register, components, freqRank, componentChars]
  // freqRank: approximate spoken corpus rank (lower = more frequent)
  // componentChars: flat array of individual characters that must be introduced first

  ["你好",     [["nǐ",3],["hǎo",3]],   "hello / hi",          "standard greeting",
   [["你","you","pronoun"],["好","good","adjective"]], 45, ["你","好"]],

  ["谢谢",     [["xiè",4],["xie",0]],  "thank you",           "universal",
   [["谢谢","thank (×2 = emphasis)","verb"]], 120, ["谢"]],

  ["不客气",   [["bù",4],["kè",4],["qi",0]], "you're welcome", "standard",
   [["不","not","adverb"],["客气","be formal / polite","verb"]], 280, ["不","客","气"]],

  ["没事",     [["méi",2],["shì",4]],  "it's fine / no worries", "casual",
   [["没","not have","verb"],["事","matter / thing","noun"]], 160, ["没","事"]],

  ["不好意思", [["bù",4],["hǎo",3],["yì",4],["si",0]], "excuse me / sorry / awkward", "versatile",
   [["不","not","adverb"],["好","good","adjective"],["意思","feeling / meaning","noun"]], 310, ["不","好","意","思"]],

  ["没关系",   [["méi",2],["guān",1],["xi",0]], "that's okay", "standard",
   [["没","not have","verb"],["关系","connection / relationship","noun"]], 290, ["没","关","系"]],

  ["什么情况", [["shén",2],["me",0],["qíng",2],["kuàng",4]], "what's going on", "casual",
   [["什么","what","pronoun"],["情况","situation / circumstances","noun"]], 420, ["什","么","情","况"]],

  ["随便",     [["suí",2],["biàn",4]], "whatever / up to you", "casual",
   [["随","go with / follow","verb"],["便","convenience","noun"]], 380, ["随","便"]],

  ["差不多",   [["chà",4],["bu",0],["duō",1]], "more or less", "casual",
   [["差","differ","verb"],["不","not","adverb"],["多","much / many","adjective"]], 340, ["差","不","多"]],

  ["马上",     [["mǎ",3],["shàng",4]], "right away", "casual",
   [["马","horse","noun"],["上","on / up","preposition"]], 260, ["马","上"]],

  ["算了",     [["suàn",4],["le",0]],  "forget it / let it go", "casual",
   [["算","consider / count","verb"],["了","completion marker","particle"]], 350, ["算","了"]],

  ["没办法",   [["méi",2],["bàn",4],["fǎ",3]], "nothing can be done", "casual",
   [["没","not have","verb"],["办","manage / handle","verb"],["法","method / way","noun"]], 400, ["没","办","法"]],

  ["加油",     [["jiā",1],["yóu",2]],  "come on / keep it up", "encouragement",
   [["加","add","verb"],["油","oil / fuel","noun"]], 320, ["加","油"]],

  ["辛苦了",   [["xīn",1],["kǔ",3],["le",0]], "thanks for your effort", "respectful",
   [["辛苦","hardship / toil","noun"],["了","completion marker","particle"]], 460, ["辛","苦","了"]],

  ["随缘",     [["suí",2],["yuán",2]], "go with the flow / let fate decide", "philosophical",
   [["随","follow","verb"],["缘","fate / connection","noun"]], 520, ["随","缘"]],
];

// Check if all component characters have been introduced for a colloquialism
function collUnlocked(collIdx){
  const entry=COLL[collIdx];
  if(!entry) return false;
  const componentChars=entry[6]||[];
  return componentChars.every(ch=>{
    const dIdx=D.findIndex(([c])=>c===ch);
    return dIdx<0||hasBeenIntroducedIdx(dIdx); // chars not in deck are fine
  });
}

// Get unlocked colls sorted by frequency rank (lower rank = show earlier)
function getUnlockedColls(){
  return COLL.map((_,i)=>i)
    .filter(i=>collUnlocked(i))
    .sort((a,b)=>(COLL[a][5]||999)-(COLL[b][5]||999));
}

/* ============ COLLOQUIALISM INTERJECTION ============ */
// Every 11th card in unified study, show a colloquialism
// No mastery gate — these should appear early and often
let collIdx=0; // cycles through COLL array


function renderCollBreakdown(components, fg){
  const CJKf="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  const box=$('studyCollBreakdown');
  if(!box) return;
  box.innerHTML='';
  box.style.color=fg;

  components.forEach(([chars, translation, posHint],idx)=>{
    // All components guaranteed introduced before coll is shown — no masking needed
    const allIntroduced=true;

    const row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;padding:10px 12px;gap:0;cursor:pointer;'+(idx>0?'border-top:1px solid '+fg+';':'');

    // Left: character(s) — large, CJK font, always tappable
    const left=document.createElement('div');
    left.style.cssText='min-width:80px;font-size:32px;'+CJKf+';color:'+fg+';flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:2px;';
    left.innerHTML='<span>'+chars+'</span>';

    // Add pinyin for left characters — pull from D array
    const pySpan=document.createElement('div');
    pySpan.style.cssText='font-size:10px;font-family:\'Noto Sans\',Arial,sans-serif;display:flex;gap:3px;';
    const PY_FONT="font-family:'Noto Sans','Arial Unicode MS',Arial,sans-serif";
    // Try each character individually against D array
    let foundPy=false;
    for(const singleChar of [...chars]){
      const dIdx=D.findIndex(([ch])=>ch===singleChar);
      if(dIdx>=0){
        const [,syls2]=D[dIdx];
        syls2.forEach(([s,t])=>{
          const sp=document.createElement('span');
          sp.textContent=s;
          sp.style.cssText=PY_FONT+';color:'+toneColor(t,fg)+';font-size:10px;';
          pySpan.appendChild(sp);
        });
        foundPy=true;
      }
    }
    // Also check multi-char compound in D
    if(!foundPy){
      const dIdx=D.findIndex(([ch])=>ch===chars);
      if(dIdx>=0){
        const [,syls2]=D[dIdx];
        syls2.forEach(([s,t])=>{
          const sp=document.createElement('span');
          sp.textContent=s;
          sp.style.cssText=PY_FONT+';color:'+toneColor(t,fg)+';font-size:10px;';
          pySpan.appendChild(sp);
        });
        foundPy=true;
      }
    }
    if(foundPy) left.appendChild(pySpan);

    // Right: translation + POS hint
    const right=document.createElement('div');
    right.style.cssText='flex:1;padding-left:14px;display:flex;flex-direction:column;gap:3px;';
    const transDiv=document.createElement('div');
    transDiv.style.cssText='font-size:13px;color:'+fg+';';
    transDiv.textContent=translation.toUpperCase();
    const posDiv=document.createElement('div');
    posDiv.style.cssText='font-size:8px;opacity:.6;color:'+fg+';letter-spacing:1px;';
    posDiv.textContent=posHint.toUpperCase();
    right.appendChild(transDiv);
    right.appendChild(posDiv);

    row.appendChild(left);
    row.appendChild(right);

    // Tap left character to open card/radical detail — only if introduced
    if(allIntroduced){
      left.onclick=(e)=>{
        e.stopPropagation();
        const deckIdx=D.findIndex(([ch])=>ch===chars);
        if(deckIdx>=0){
          openCharDetail(chars, 0, deckIdx);
        } else if([...chars].length===1){
          openRadDetail(chars);
        }
      };
      left.style.cursor='pointer';
    } else {
      // Show "not yet introduced" hint
      left.title='Study this word to unlock';
    }

    box.appendChild(row);
  });
}

function showStudyColl(cardI){
  // Pick a colloquialism — cycle through them
  const ci=collIdx%COLL.length;
  collIdx++;
  const [expr,syls,meaning,register,components,,]=COLL[ci];

  rollBg();
  const fg=getComputedStyle(document.body).color;
  const CJKf="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  let flipped=false;

  $('studyMode').textContent='COLLOQUIALISM';
  $('studyCollExpr').textContent=expr;
  $('studyCollExpr').style.color=fg;
  $('studyCollExpr').style.textDecoration='none';

  // Pinyin
  const py=$('studyCollPy'); py.innerHTML='';
  syls.forEach(([s,t])=>{
    const sp=document.createElement('span');
    sp.textContent=s; sp.style.color=toneColor(t,fg);
    py.appendChild(sp);
  });

  $('studyCollRegister').textContent=register.toUpperCase();
  $('studyCollRegister').style.color=fg;
  $('studyCollHint').style.display='block';
  $('studyCollHint').style.color=fg;
  $('studyCollBack').style.display='none';
  $('studyCollMeaning').textContent=meaning.toUpperCase();
  $('studyCollMeaning').style.color=fg;
  // Pre-render breakdown (hidden until flip)
  renderCollBreakdown(components, fg);

  $('studyCollCard').style.borderColor=fg;
  $('studyCollCard').style.color=fg;
  $('studyCollBack').style.borderTopColor=fg;

  $('studyCollCard').onclick=function(){
    if(!flipped){
      flipped=true;
      $('studyCollBack').style.display='flex';
      $('studyCollHint').style.display='none';
      if(S.sound!=='mute') speak(expr,activeCourse().langCode);
    } else {
      S.xp+=Math.round(15*fatigueXPMultiplier()); save();
      $('studyXP').textContent='XP '+S.xp;
      $('studyCollCard').onclick=null;
      nextStudyCard();
    }
  };

  show('study');
  $('studySession').style.display='none';
  $('studyMC').style.display='none';
  $('studyTone').style.display='none';
  if($('studyPOS')) $('studyPOS').style.display='none';
  $('studyColl').style.display='flex';

  if(S.sound!=='mute') speak(expr,activeCourse().langCode);
}


/* ============ WORD SEARCH TIER ============ */
// User scans real/AI-generated Mandarin text and taps every instance of a target word.
// Known words in active window appear in the text. Unknown characters are the noise.
// Tap correct instance: highlight green. Tap wrong: highlight red briefly.
// All instances must be found to advance.

// Pre-seeded passages — AI-generated, seeded with high-frequency vocabulary
// Each passage: [text, [target_words_in_passage]]
// Target words are drawn from D array. Unknown chars provide noise context.
const WS_PASSAGES=[
  {
    text:"我今天去学校。我的老师很好。你也去吗？他们都在学校里。",
    targets:["我","今天","去","学校","的","老师","很","好","你","也","他们","都","在","里"]
  },
  {
    text:"我想吃饭。你要喝水还是喝茶？我们家里有很多吃的东西。",
    targets:["我","想","吃","饭","你","要","喝","水","还","茶","我们","家","里","有","很","多","东西"]
  },
  {
    text:"他在工作。她喜欢音乐。我们都爱学习中文。时间不多了。",
    targets:["他","在","工作","她","喜欢","音乐","我们","都","爱","学习","中","文","时间","不","多","了"]
  },
  {
    text:"现在几点？我要去买东西。路上车很多。你有手机吗？",
    targets:["现在","要","去","买","路","上","车","很","多","你","有","手机","吗"]
  },
  {
    text:"昨天我朋友来了。我们说了很多话。今天他去了外国。明天他回来。",
    targets:["昨天","我","朋友","来","了","我们","说","很","多","今天","他","去","了","外","明天","回","来"]
  },
];

let wsPassage=null, wsTarget='', wsFound=0, wsTotal=0, wsHighlighted=new Set();

function startWordSearch(){
  show('wordSearch');
  loadWSPassage();
}

function loadWSPassage(){
  // Pick a passage and a target word from the user's active deck
  const passage=WS_PASSAGES[Math.floor(Math.random()*WS_PASSAGES.length)];
  wsPassage=passage;
  wsFound=0; wsHighlighted=new Set();

  // Pick target: a word from active deck that appears in this passage
  const deckWords=activeDeckIndices().filter(i=>isUnlocked(i)).map(i=>D[i][0]);
  const available=passage.targets.filter(t=>deckWords.includes(t));
  wsTarget=available.length?available[Math.floor(Math.random()*available.length)]:passage.targets[0];

  // Count occurrences of target in text
  const text=passage.text;
  let count=0, idx=0;
  while((idx=text.indexOf(wsTarget,idx))!==-1){ count++; idx+=wsTarget.length; }
  wsTotal=count;

  const fg=getComputedStyle(document.body).color;

  // Style elements
  $('ws-quit').style.borderColor=fg; $('ws-quit').style.color=fg;
  $('ws-next').style.borderColor=fg; $('ws-next').style.color=fg;
  $('ws-next').style.display='none';
  $('ws-result').textContent='';

  // Show target word to find
  const targetDeckIdx=D.findIndex(([ch])=>ch===wsTarget);
  const targetDef=targetDeckIdx>=0?D[targetDeckIdx][2]:'';
  $('ws-target').textContent=wsTarget;
  $('ws-target').style.color=fg;
  $('ws-target-def').textContent=targetDef?targetDef.toUpperCase():'';
  $('ws-target-def').style.color=fg;
  $('ws-instruction').style.color=fg;
  $('ws-card').style.borderColor=fg;
  $('ws-header').style.borderBottomColor=fg;
  $('ws-score').textContent='0/'+wsTotal;
  $('ws-score').style.color=fg;

  // Render passage with tappable characters
  renderWSPassage(fg);
}

function renderWSPassage(fg){
  const box=$('ws-passage');
  box.style.borderColor=fg; box.style.color=fg;
  box.innerHTML='';

  const text=wsPassage.text;
  const chars=[...text]; // handle multi-byte
  let pos=0;

  // Find all target positions
  const targetPositions=new Set();
  let searchIdx=0;
  const tLen=[...wsTarget].length;
  while(searchIdx<=chars.length-tLen){
    const slice=chars.slice(searchIdx,searchIdx+tLen).join('');
    if(slice===wsTarget){
      for(let k=0;k<tLen;k++) targetPositions.add(searchIdx+k);
      searchIdx+=tLen;
    } else searchIdx++;
  }

  // Render char by char — target chars get tap handlers
  let i=0;
  while(i<chars.length){
    const ch=chars[i];
    // Check if this starts a target sequence
    const slice=chars.slice(i,i+tLen).join('');
    if(slice===wsTarget){
      const span=document.createElement('span');
      span.textContent=wsTarget;
      span.dataset.wsPos=i;
      const alreadyFound=wsHighlighted.has(i);
      span.style.cssText='cursor:pointer;padding:2px;border-radius:2px;'+(alreadyFound?'background:rgba(0,180,0,0.4);':'');
      span.onclick=(e)=>{
        e.stopPropagation();
        const p=+span.dataset.wsPos;
        if(wsHighlighted.has(p)) return; // already found
        wsHighlighted.add(p);
        span.style.background='rgba(0,180,0,0.4)';
        wsFound++;
        $('ws-score').textContent=wsFound+'/'+wsTotal;
        if(wsFound>=wsTotal) wsComplete();
      };
      box.appendChild(span);
      i+=tLen;
    } else {
      // Non-target character — tapping gives brief red flash
      const span=document.createElement('span');
      span.textContent=ch;
      span.style.cursor='pointer';
      span.onclick=(e)=>{
        e.stopPropagation();
        span.style.color='hsl(0,70%,40%)';
        setTimeout(()=>{ span.style.color=fg; },400);
      };
      box.appendChild(span);
      i++;
    }
  }
}

function wsComplete(){
  const fg=getComputedStyle(document.body).color;
  $('ws-result').textContent='✓ ALL '+wsTotal+' FOUND – WELL DONE';
  $('ws-result').style.color=fg;
  $('ws-next').style.display='block';
  // Award XP and small mastery boost to target word
  const ti=D.findIndex(([ch])=>ch===wsTarget);
  if(ti>=0){ addMastery(ti,0.3); }
  S.xp+=Math.round(20*fatigueXPMultiplier()); save();
  if(S.sound!=='mute') speak(wsTarget,activeCourse().langCode);
}


/* ============ BILINGUAL UI ============ */
// UI strings keyed by semantic role
// [english, mandarin, pinyin]
const UI={
  'BACK':          ['返回',    'fǎn huí'],
  'FINISH':        ['完成',    'wán chéng'],
  'STUDY':         ['学习',    'xué xí'],
  'FLASHCARDS':    ['单词卡',  'dān cí kǎ'],
  'MULTIPLE CHOICE':['选择题', 'xuǎn zé tí'],
  'TONE DRILL':    ['声调练习','shēng diào liàn xí'],
  'WORD SEARCH':   ['词语搜索','cí yǔ sōu suǒ'],
  'SOUND':         ['声音',    'shēng yīn'],
  'ORDER':         ['顺序',    'shùn xù'],
