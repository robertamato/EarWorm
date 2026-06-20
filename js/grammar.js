  'SHUFFLE':       ['随机',    'suí jī'],
  'FREQUENCY':     ['频率',    'pín lǜ'],
  'AUTO':          ['自动',    'zì dòng'],
  'CORRECT':       ['正确',    'zhèng què'],
  'WRONG':         ['错误',    'cuò wù'],
  'EXPOSURE':      ['接触',    'jiē chù'],
  'MASTERED':      ['掌握',    'zhǎng wò'],
  'FRONTIER':      ['前沿',    'qián yán'],
  'NEXT':          ['下一个',  'xià yī gè'],
  'FIND':          ['找到',    'zhǎo dào'],
  "DON'T KNOW":    ['不知道',  'bù zhī dào'],
  'SURE':          ['确定',    'què dìng'],
  'UNSURE':        ['不确定',  'bù què dìng'],
  'AGAIN':         ['再来',    'zài lái'],
  'COLLOQUIALISM': ['口语',    'kǒu yǔ'],
  'PART OF SPEECH':['词性',    'cí xìng'],
  'TAP TO FLIP':   ['点击翻转','diǎn jī fān zhuǎn'],
  'TAP TO REVEAL': ['点击显示','diǎn jī xiǎn shì'],
  'DAILY GOAL':    ['每日目标','měi rì mù biāo'],
  'MANDARIN':      ['普通话',  'pǔ tōng huà'],
  'STREAK':        ['连续',    'lián xù'],
  'LEVEL':         ['等级',    'děng jí'],
  'HOT STREAK':    ['连胜',    'lián shèng'],
  'PLEASE LISTEN': ['请听',    'qǐng tīng'],
  'LISTEN FOR THE TONE':['听声调','tīng shēng diào'],
};

// UI language stage based on frontier
function uiStage(){
  const f=frontier();
  if(f<50)  return 1; // English only
  if(f<200) return 2; // Bilingual, English primary
  if(f<500) return 3; // Bilingual, Mandarin primary
  return 4;           // Mandarin only
}

// Get UI string for current stage
function ui(key){
  const entry=UI[key];
  if(!entry) return key;
  const [zh, py]=entry;
  const stage=uiStage();
  if(stage===1) return key;
  if(stage===2) return key+'\n'+zh;
  if(stage===3) return zh+'\n'+key;
  return zh;
}

// For buttons: show both with styling
function uiBtn(key){
  const entry=UI[key];
  if(!entry) return key;
  const [zh]=entry;
  const stage=uiStage();
  if(stage===1) return key;
  if(stage===2) return key+'<br><span style="font-size:6px;opacity:.7">'+zh+'</span>';
  if(stage===3) return zh+'<br><span style="font-size:6px;opacity:.7">'+key+'</span>';
  return zh;
}

// Apply bilingual labels to all known UI elements
function applyBilingualUI(){
  const stage=uiStage();
  if(stage===1) return; // all English, nothing to change

  // Buttons
  const btnMap={
    'quit':        'BACK',
    'mc-quit':     'BACK',
    'study-quit':  'BACK',
    'tone-quit':   'BACK',
    'ws-quit':     'BACK',
    'radDetail-back': 'BACK',
    'charDetail-back':'BACK',
    'deckMgr-back':'BACK',
    'summary-home':'BACK',
    'finish':      'FINISH',
    'mc-finish':   'FINISH',
    'study-finish':'FINISH',
    'startStudy':  'STUDY',
    'startMC':     'MULTIPLE CHOICE',
    'startTone':   'TONE DRILL',
    'startWS':     'WORD SEARCH',
    'ws-next':     'NEXT',
    'mc-dontknow': "DON'T KNOW",
    'studyDontKnow':"DON'T KNOW",
  };

  Object.entries(btnMap).forEach(([id,key])=>{
    const el=$(id);
    if(!el) return;
    const entry=UI[key];
    if(!entry) return;
    const [zh]=entry;
    if(stage===2) el.innerHTML=key+'<br><span style="font-size:6px;opacity:.6">'+zh+'</span>';
    else if(stage===3) el.innerHTML=zh+'<br><span style="font-size:6px;opacity:.6">'+key+'</span>';
    else el.textContent=zh;
  });
}




/* ============ MULTIPLIER / WAGER SYSTEM ============ */
// XP multiplier builds through correct-answer streaks.
// Before each MC card user can adjust their wager multiplier up or down.
// Wrong answer: multiplier resets toward 1x. XP never decreases.
// The wager decision is a self-assessment signal recorded for calibration.

const MULT_STEPS=[1.0,1.5,2.0,3.0,5.0,10.0]; // available multiplier tiers
const MULT_BASE_XP=10;                          // base XP per correct answer

let currentMultIdx=0;   // index into MULT_STEPS — user's chosen wager
let studyDontKnowAction=null; // set by each modality on render
const lastModality=new Map(); // idx -> last modality shown this session
let defaultMultIdx=0;   // what the system would default to
let wagerTouched=false; // did user adjust wager this card?
let cardShownAtMC=0;    // when MC card was shown

function getMult(){ return S.mult||1.0; }
function getMultStreak(){ return S.multStreak||0; }

// Natural multiplier from streak — earns up automatically through correct answers
function naturalMultIdx(){
  const streak=getMultStreak();
  if(streak>=20) return 5;
  if(streak>=10) return 4;
  if(streak>=5)  return 3;
  if(streak>=3)  return 2;
  if(streak>=1)  return 1;
  return 0;
}

// ── HOUSE LINE (wager re-anchor) ──────────────────────────────────────────
// The wager is a calibration market. The house posts a LINE = the model's
// confidence P_algo that the user knows this card-axis (Scheduler._pCorrect).
// defaultMultIdx is anchored to this line — NOT the streak — so
// uplift = currentMultIdx - defaultMultIdx = Δ(P_user, P_algo), the quantity the
// meta-game measures. (Scheduler is concatenated after this file; these are only
// CALLED at runtime, by which point it exists — guarded regardless.)
function houseP(i, axis, modality){
  try{
    if(typeof Scheduler!=='undefined' && Scheduler._pCorrect)
      return Scheduler._pCorrect(card(i), axis||'meaning', modality);
  }catch(e){}
  return 0.5;
}
// P_algo → MULT_STEPS index. The default bet rises WITH the house's confidence
// (high P → high default), so betting ABOVE the line = "I'm surer than the house."
// A low line on a card you actually know is the edge to press. P≈0.5 sits mid-slider.
function houseLineIdx(i, axis, modality){
  const p=houseP(i, axis, modality);
  return p<0.35?0 : p<0.50?1 : p<0.65?2 : p<0.80?3 : p<0.90?4 : 5;
}
// Human-facing posted line: payout odds (~1/P) + a read on the house's stance.
function houseLineLabel(i, axis, modality){
  const p=houseP(i, axis, modality);
  const odds=Math.max(1, Math.round((1/Math.max(0.08,p))*10)/10);
  const read=p>=0.85?'KNOWS YOU KNOW':p>=0.65?'EXPECTS A HIT':p>=0.45?'TOSS-UP':p>=0.30?'DOUBTS YOU':'BETS YOU MISS';
  return {odds:odds, read:read, p:p};
}

function resetMult(){
  S.multStreak=0;
  S.mult=MULT_STEPS[0];
  save();
}

function advanceMult(){
  S.multStreak=(S.multStreak||0)+1;
  const natIdx=naturalMultIdx();
  // Only advance if wagered at or above natural level
  if(currentMultIdx>=natIdx){
    S.mult=MULT_STEPS[Math.min(MULT_STEPS.length-1,natIdx)];
  }
  save();
}

function computeXP(isCorrect, wagerIdx, responseMs, defIdx){
  const base=MULT_BASE_XP;
  if(!isCorrect) return 0;
  const mult=MULT_STEPS[wagerIdx];
  const speedBonus=responseMs<1500?1.3:responseMs<4000?1.0:0.8;
  // Proper-scoring-rule flavor: you're paid for INFORMATION — beating the house
  // line — not the raw stake. Two equal bets pay very differently if one defied a
  // low line. defIdx omitted (legacy callers) → no edge bonus, identical to before.
  const edge=(defIdx==null)?0:Math.max(0, wagerIdx-defIdx);
  const edgeBonus=1+edge*0.5;
  return Math.round(base*mult*edgeBonus*speedBonus);
}

// ── CHIP BANKROLL (losable stakes) ────────────────────────────────────────
// A wager you can't lose is hollow. Chips are a DAILY, forfeitable bankroll: win
// the edge-weighted payout on a correct call, forfeit the stake on a wrong one.
// Stake scales as you bet ABOVE the line, so pressing an edge risks more. Bust
// (chips→0) is a clean EVENT: the META-GAME pauses for the day — study is NEVER
// blocked (the dose/coupling tests forbid locking out learning) — and a fresh
// stack arrives tomorrow. Going negative (credit line) is a deferred top-tier opt-in.
const BANKROLL_BASE=200;   // fresh daily stack
const BET_UNIT=20;         // chips risked at the line; scales up as you bet above it
function ensureBankrollDay(){
  const today=new Date().toDateString();
  if(S.chipsDay!==today){ S.chipsDay=today; S.chips=BANKROLL_BASE; S.busted=false; save(); }
}
function wagerStake(){ return BET_UNIT*(1+Math.max(0,currentMultIdx-defaultMultIdx)); }
function isBusted(){ ensureBankrollDay(); return !!S.busted || (S.chips||0)<=0; }
// Pure settle (unit-testable): new chips + event given outcome and base payout.
function settleWager(chips, wagerIdx, lineIdx, isCorrect, payout){
  const stake=BET_UNIT*(1+Math.max(0,wagerIdx-lineIdx));
  if(isCorrect) return {chips:chips+payout, delta:payout, stake:stake, busted:false, won:true};
  const nc=Math.max(0,chips-stake);
  return {chips:nc, delta:-(chips-nc), stake:stake, busted:nc<=0, won:false};
}
// Study HUD: lifetime XP (never lost) + the daily chip bankroll (losable).
function studyHudText(){ return 'XP '+S.xp+'   ♦ '+(S.chips||0)+(S.busted?' · BUST':''); }

function recordWagerDecision(i, isCorrect, wagerIdx, defIdx, responseMs){
  const ci=card(i);
  if(!ci.wagerLog) ci.wagerLog=[];
  ci.wagerLog.push({
    w:wagerIdx, def:defIdx,
    ok:isCorrect?1:0,
    ms:Math.min(99999,Math.round(responseMs)),
    m:Math.round(masteryScore(i)*10)/10,
  });
  if(ci.wagerLog.length>30) ci.wagerLog.shift();
}

// Render wager control — compact, unobtrusive
function renderWagerControl(containerId, cardIdx){
  const el=document.getElementById(containerId);
  if(!el) return;
  const fg=getComputedStyle(document.body).color;

  const _line=(cardIdx!=null)?houseLineLabel(cardIdx,'meaning'):null;
  defaultMultIdx=(cardIdx!=null)?houseLineIdx(cardIdx,'meaning'):Math.max(0,naturalMultIdx());
  currentMultIdx=defaultMultIdx;
  wagerTouched=false;
  studyConfidence=null;

  el.innerHTML='';
  el.style.cssText='display:flex;align-items:center;gap:10px;padding:4px 0;';

  // Multiplier label
  const multLabel=document.createElement('span');
  multLabel.style.cssText='font-size:9px;min-width:32px;text-align:left;color:'+fg+';opacity:.8;flex-shrink:0;letter-spacing:1px;';

  // Slider
  const sliderWrap=document.createElement('div');
  sliderWrap.style.cssText='flex:1;position:relative;height:28px;display:flex;align-items:center;';

  const track=document.createElement('div');
  track.style.cssText='width:100%;height:4px;background:'+fg+';opacity:.25;border-radius:2px;position:absolute;';

  const fill=document.createElement('div');
  fill.style.cssText='height:4px;background:'+fg+';border-radius:2px;position:absolute;left:0;opacity:.7;';

  const thumb=document.createElement('div');
  thumb.style.cssText='width:22px;height:22px;border:2px solid '+fg+';background:transparent;border-radius:0;position:absolute;transform:translateX(-50%);cursor:pointer;top:50%;margin-top:-11px;box-sizing:border-box;';

  const n=MULT_STEPS.length-1;
  const updateSlider=()=>{
    const pct=(currentMultIdx/n)*100;
    fill.style.width=pct+'%';
    thumb.style.left=pct+'%';
    multLabel.textContent=MULT_STEPS[currentMultIdx]+'x'+(_line?'  · '+_line.read+' '+_line.odds+':1':'');
    const col=currentMultIdx>defaultMultIdx?'hsl(30,90%,60%)':
               currentMultIdx<defaultMultIdx?'hsl(200,70%,65%)':fg;
    multLabel.style.color=col;
    thumb.style.borderColor=col;
    fill.style.background=col;
  };
  updateSlider();

  const getIdx=(e)=>{
    const rect=sliderWrap.getBoundingClientRect();
    const cx=e.touches?e.touches[0].clientX:e.clientX;
    return Math.round(Math.max(0,Math.min(1,(cx-rect.left)/rect.width))*n);
  };
  let drag=false;
  const mv=(e)=>{ if(!drag) return; e.preventDefault(); e.stopPropagation(); const idx=getIdx(e); if(idx!==currentMultIdx){currentMultIdx=idx;wagerTouched=true;updateSlider();} };
  sliderWrap.addEventListener('mousedown',(e)=>{drag=true;e.stopPropagation();currentMultIdx=getIdx(e);wagerTouched=true;updateSlider();});
  sliderWrap.addEventListener('touchstart',(e)=>{drag=true;e.stopPropagation();currentMultIdx=getIdx(e);wagerTouched=true;updateSlider();},{passive:false});
  window.addEventListener('mousemove',mv);
  window.addEventListener('touchmove',mv,{passive:false});
  window.addEventListener('mouseup',()=>{drag=false;});
  window.addEventListener('touchend',()=>{drag=false;});

  sliderWrap.appendChild(track);
  sliderWrap.appendChild(fill);
  sliderWrap.appendChild(thumb);

  // Skip
  const skipBtn=document.createElement('button');
  skipBtn.style.cssText='font-family:inherit;font-size:8px;padding:6px 10px;border:2px solid '+fg+';background:transparent;color:'+fg+';cursor:pointer;opacity:.5;flex-shrink:0;letter-spacing:1px;';
  skipBtn.textContent='SKIP';
  skipBtn.onclick=(e)=>{ e.stopPropagation(); if(typeof studyDontKnowAction==='function') studyDontKnowAction(); };

  el.appendChild(multLabel);
  el.appendChild(sliderWrap);
  el.appendChild(skipBtn);
}


/* ============ AXIS STAGE SYSTEM ============ */
// Per-word, per-axis progression. Each axis unlocks through demonstrated competence.
//
// AXIS: POS
//   Stage 0: locked (exp===0, never seen flashcard back)
//   Stage 1: definition→category (broad 4-bucket, user learns what categories mean)
//   Stage 2: definition→category name (standard POS names shown)
//   Stage 3: character→POS name (character as prompt)
//   Gate: 2 consecutive correct answers at current stage to advance
//
// AXIS: MEANING
//   Stage 0: locked (pos axis stage < 2)
//   Stage 1: character+POS→definition, wide distractors (6 choices, easy)
//   Stage 2: character→definition, standard distractors
//   Stage 3: definition→character (reverse), standard distractors
//   Stage 4: character→definition, tight distractors
//   Stage 5: definition→character, tight distractors (alternating fwd/rev)

function getAxisStage(i, axis){
  const ci=card(i);
  if(!ci.axisStage||typeof ci.axisStage!=='object') ci.axisStage={pos:0,meaning:0};
  if(ci.axisStage[axis]===undefined) ci.axisStage[axis]=0;
  return ci.axisStage[axis];
}

function getAxisCorrect(i, axis){
  const ci=card(i);
  if(!ci.axisCorrect||typeof ci.axisCorrect!=='object') ci.axisCorrect={pos:0,meaning:0};
  if(ci.axisCorrect[axis]===undefined) ci.axisCorrect[axis]=0;
  return ci.axisCorrect[axis];
}

// Gate thresholds vary by axis and stage — harder concepts need more correct answers
const AXIS_GATE_POS=[0,3,3,2];     // pos: stage 0→1 needs 3, 1→2 needs 3, 2→3 needs 2
const AXIS_GATE_MEANING=[0,2,2,3,3,2]; // meaning: later stages need more correct answers
const AXIS_MAX={pos:4, meaning:5};

function axisGate(axis, currentStage){
  if(axis==='pos') return AXIS_GATE_POS[currentStage]||2;
  return AXIS_GATE_MEANING[currentStage]||2;
}

function recordAxisResult(i, axis, isCorrect){
  const ci=card(i);
  if(!ci.axisStage) ci.axisStage={pos:0,meaning:0};
  if(!ci.axisCorrect) ci.axisCorrect={pos:0,meaning:0};

  if(isCorrect){
    ci.axisCorrect[axis]=(ci.axisCorrect[axis]||0)+1;
    const baseGate=axisGate(axis, ci.axisStage[axis]||0);
    const _wBonus2=(typeof currentMultIdx!=='undefined'&&typeof defaultMultIdx!=='undefined')
      ?Math.min(2,Math.max(0,currentMultIdx-defaultMultIdx)):0;
    const gate=Math.max(1,baseGate-_wBonus2);
    if(ci.axisCorrect[axis]>=gate){
      const maxStage=AXIS_MAX[axis];
      if(ci.axisStage[axis]<maxStage){
        ci.axisStage[axis]++;
        ci.axisCorrect[axis]=0;
      }
    }
  } else {
    // Wrong answer resets consecutive streak but doesn't regress stage
    ci.axisCorrect[axis]=0;
  }
  save();
}

// Determine what modality to show based on axis stages


/* ============ ADAPTIVE CHOICE COUNT ============ */
// Returns [nChoices, gridCols] based on mastery and encounter count.
// Always symmetric: 2 (1×2), 4 (2×2), 6 (2×3).
// Starts easy (2 choices) and scales with evidence of knowledge.

function adaptiveChoiceCount(i, modality){
  const ci=card(i);
  const meanStg=getAxisStage(i,'meaning');
  const reps=(ci.axisReps&&ci.axisReps.meaning)||0;

  // First encounter (stage 0, reps 0-1): 2 choices — binary, unmistakable
  if(meanStg===0 && reps<=1) return [2, '1fr 1fr'];

  // Early familiarity (stage 0-1, reps 2-4): 4 choices
  if(meanStg<=1 && reps<=4) return [4, '1fr 1fr'];

  // Established (stage 1-2, reps 5+): 6 choices
  return [6, '1fr 1fr'];
}

// For reverse MC (EN→char): same scale but always uses CJK grid
function adaptiveChoiceCountReverse(i){
  const ci=card(i);
  const meanStg=getAxisStage(i,'meaning');
  const reps=(ci.axisReps&&ci.axisReps.meaning)||0;
  if(meanStg===0 && reps<=1) return [2, '1fr 1fr'];
  if(meanStg<=1 && reps<=4) return [4, '1fr 1fr 1fr'];
  return [6, '1fr 1fr 1fr'];
}

function convergenceUnlocked(i){
  // Requires both grammar and vocabulary tracks to have made progress
  // Grammar: category recognition stage >= 1
  // Vocabulary: meaning axis stage >= 1
  const pos=D[i]&&D[i][4];
  if(!pos) return false;
  const info=POS_LOGICAL[pos];
  if(!info) return false;
  const cat=info.cat;
  const gStg=typeof gStage==='function'?gStage(cat,'recognition'):0;
  const mStg=getAxisStage(i,'meaning');
  return gStg>=1 && mStg>=1;
}

function wordModalityFromAxes(i){
  // Legacy v1 modality decision — session overrides (studyFlashOnly / studyModalityFilter)
  // are now handled by resolveStudyModality in showStudyCard before we get here.
  // Under v2 policy the caller uses Scheduler.modality() instead.
  try {
  const exp=card(i).exp||0;
  // First-time exposure: always flash card, no exceptions.
  // exp is set to 1 inside showStudyFlash after the card is shown.
  // Subsequent encounters route to MC and other challenge modalities.
  if(exp===0) return 'flash';

  // Check if convergence question is ready (v1 flow)
  if(convergenceUnlocked(i)&&isCardDue(i)){
    const overdue=mostOverdueAxis(i);
    if(overdue==='pos') return 'convergence';
  }

  // Meaning axis modality — first MC fires regardless of due date
  // Subsequent MCs respect SRS schedule. (v1 progressive logic; v2 uses Scheduler.modality.)
  const meanStg=getAxisStage(i,'meaning');
  const meanDue=isCardDue(i)&&mostOverdueAxis(i)==='meaning';

  // Stage 0: always fire MC-forward — introduction sequence, not SRS
  if(meanStg===0) return 'mc-fwd';

  // Stage 1+: respect due date
  if(meanDue||meanStg>=1){
    if(meanStg===1) return 'mc-fwd';
    if(meanStg===2) return Math.random()<0.6?'mc-fwd':'mc-rev';
    if(meanStg===3){
      if(clozeUnlocked(i)) return Math.random()<0.4?'cloze':'mc-rev';
      return Math.random()<0.5?'mc-fwd':'mc-rev';
    }
    if(meanStg>=4){
      const r=Math.random();
      if(r<0.35&&clozeUnlocked(i)) return 'cloze';
      if(r<0.55&&wordOrderUnlocked(i)) return 'word-order';
      return Math.random()<0.5?'mc-fwd':'mc-rev';
    }
  }

  // Fallback: meaning MC
  return 'mc-fwd';
  } catch(e) { console.error('wordModalityFromAxes',i,e); return 'mc-fwd'; }
}

function pickMeaningOrPOS(i, posStg, meanStg){
  const r=Math.random();
  const m=masteryScore(i);

  // Modality weights — meaning MC dominates
  // Weights: meaning ~75%, POS 8%, tone 6%, flash remainder
  const flashWeight=Math.max(0.02, 0.10-m*0.02);
  const posWeight=posStg>=1?0.08:0;
  const toneWeight=meanStg>=2?0.06:0; // tone only after meaning established
  const meaningWeight=1-flashWeight-posWeight-toneWeight;

  const roll=Math.random();
  if(roll<flashWeight) return 'flash';
  if(roll<flashWeight+posWeight){
    const maxPosStg=meanStg>=4?3:meanStg>=2?2:1;
    const targetPosStg=Math.min(posStg||1,maxPosStg);
    return 'pos-s'+targetPosStg;
  }
  if(roll<flashWeight+posWeight+toneWeight) return 'tone';

  // Meaning MC — direction by stage
  if(meanStg<=2) return 'mc-fwd';
  if(meanStg===3) return Math.random()<0.7?'mc-fwd':'mc-rev';
  return Math.random()<0.5?'mc-fwd':'mc-rev';
}


function showStudyPOSStaged(i, axisStage){
  activeCardIdx=i;
  // axisStage 1: definition tiles → pick category name (user learns what categories mean)
  // axisStage 2: category name tiles → pick for character prompt
  // axisStage 3: character prompt → pick POS name (same as current showStudyPOS stage 3)
  const [ch,syls,,, pos]=D[i];
  if(!pos){ recordAxisResult(i,'pos',true); nextStudyCard(); return; }

  const fg=getComputedStyle(document.body).color;
  const CJKf="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  rollBg();

  const m=masteryScore(i);
  const axisToStage={1:1,2:2,3:3};
  const {correct:correctCat, allCats}=posDataForStage(pos, axisToStage[axisStage]||1);
  const nDist=axisStage===1?3:5;
  // Use confusion-aware distractors for stage 2+ to probe known weak spots
  const rawDist=axisStage===1
    ?shuffle(allCats.filter(p=>p!==correctCat))
    :confusionAwareDistractors(pos,allCats);
  // Deduplicate strictly — never show same option twice
  const seen=new Set([correctCat]);
  const distractors=rawDist.filter(p=>{ if(seen.has(p)) return false; seen.add(p); return true; }).slice(0,nDist);
  const choices=shuffle([correctCat,...distractors]);
  // Grid columns: adapt to actual choice count
  const nChoices=choices.length;

  // Prompt varies by axis stage
  if(axisStage===1){
    // Stage 1: GRAMMAR modality — category description as prompt
    // Use Mandarin-specific CAT_DEFS, not word-specific POS definition
    const posInfo=POS_LOGICAL[pos];
    const catName=posInfo?posInfo.cat:'LOGICAL GLUE';
    const catDef=CAT_DEFS[catName]||(posInfo&&posInfo.def)||'a grammatical function word';
    $('studyPOSChar').style.fontFamily='inherit';
    $('studyPOSChar').style.fontSize='12px';
    $('studyPOSChar').style.color=fg;
    $('studyPOSChar').textContent='"'+catDef.toUpperCase()+'"';
    $('studyPOSPinyin').innerHTML='<span style="font-size:7px;opacity:.6;letter-spacing:1px;">WHICH CATEGORY DOES THIS DESCRIBE?</span>';
  } else {
    // Stage 2+: VOCABULARY modality — character as prompt, pick POS name
    // Stage 2: standard POS names as choices
    // Stage 3: compound types available in choices
    $('studyPOSChar').textContent=ch;
    $('studyPOSChar').style.fontFamily=CJKf.split(':')[1].trim();
    $('studyPOSChar').style.fontSize='72px';
    $('studyPOSChar').style.color=fg;
    const py=$('studyPOSPinyin'); py.innerHTML='';
    syls.forEach(([s,t])=>{ const sp=document.createElement('span'); sp.textContent=s+' '; sp.style.color=toneColor(t,fg); py.appendChild(sp); });
  }

  const CJKf2="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  // Stage 1: pure grammar — no character, no rank (question is about the category, not a word)
  // Stage 2+: vocabulary — show character and rank as context
  if(axisStage===1){
    $('studyPOSRank').textContent='';
  } else {
    $('studyPOSRank').innerHTML=cardRankStr(i)+' <span style="'+CJKf2+';font-size:18px;opacity:.9;">'+ch+'</span>';
  }
  $('studyPOSPrompt').style.borderColor=fg;
  $('studyPOSPrompt').style.color=fg;
  $('studyMode').textContent='PART OF SPEECH · STAGE '+axisStage;
  renderChallengeRings(i,'pos-s'+axisStage,$('studyPOSPrompt'));
  cardShownAtMC=Date.now();
  studyDontKnowAction=()=>{
    if(posLocked) return; posLocked=true;
    studyPending.push({idx:i,mod:'pos-s'+axisStage});
    armTapAdvance($('studyPOS'),()=>nextStudyCard(),1200);
  };
  renderWagerControl('studyPOSWager',i);

  let posLocked=false;

  // Tap prompt area to repeat TTS before answering (stage 2+: character is the prompt)
  $('studyPOSPrompt').style.cursor=axisStage>=2?'pointer':'default';
  $('studyPOSPrompt').onclick=function(e){
    if(posLocked||S.sound==='mute'||axisStage<2) return;
    speak(ch,activeCourse().langCode);
    e.stopPropagation();
  };

  const box=$('studyPOSChoices'); box.innerHTML='';
  // Adapt grid to actual number of distinct choices
  box.style.gridTemplateColumns=nChoices<=4?'1fr 1fr':'1fr 1fr 1fr';

  choices.forEach(cat=>{
    const b=document.createElement('button');
    b.className='choice';
    // Stage 1: show definition text in buttons; stage 2+: show names
    let btnText=cat.toUpperCase();
    if(axisStage===1){
      const entry=Object.values(POS_LOGICAL).find(v=>v.cat===cat);
      btnText=entry?entry.def.toUpperCase():cat.toUpperCase();
    }
    b.style.cssText='font-size:'+(axisStage===1?'7px':'8px')+';border-color:'+fg+';color:'+fg+';padding:10px 6px;line-height:1.5;text-align:center;';
    // Stage 1: answer tiles = category NAMES (not definitions)
    b.textContent=axisStage===1?cat.toUpperCase():btnText;
    b.onclick=()=>{
      if(posLocked) return; posLocked=true;
      const isCorrect=cat===correctCat;
      document.querySelectorAll('#studyPOSChoices .choice').forEach(tb=>{
        const tbCat=choices[Array.from(box.children).indexOf(tb)];
        if(tbCat===correctCat) tb.classList.add('correct');
        else if(tb===b&&!isCorrect) tb.classList.add('wrong');
        tb.style.pointerEvents='none';
      });
      // Show category name confirmation after stage 1
      if(axisStage===1){
        // Write confirmation into reserved answer zone — never shifts prompt text
        const ansZone=document.getElementById('studyPOSAnswer');
        if(ansZone){
          ansZone.id='studyPOSAnswer';
          ansZone.innerHTML='<span id="posAnswerConf" style="font-size:12px;opacity:.9;color:'+fg+'">'+(isCorrect?'✓  ':'→  ')+correctCat.toUpperCase()+'</span>';
        }
      }
      const posRespMs=Date.now()-cardShownAtMC;
      recordWagerDecision(i,isCorrect,currentMultIdx,defaultMultIdx,posRespMs);
      const posRingKey2=axisStage===1?'cat-'+(POS_LOGICAL[pos]&&POS_LOGICAL[pos].cat||'unknown'):'pos-s'+axisStage;
      const posRecordIdx=axisStage===1?-1:i;
      recordChallengeResult(posRecordIdx,posRingKey2,isCorrect,posRespMs);
      recordAxisResultNew(i,'pos',isCorrect,posRespMs);
      recordAxisResult(i,'pos',isCorrect);
      recordGrammarAttempt(D[i][4],isCorrect);
      logAnswer(i,isCorrect,'pos',posRespMs);
      const posSpeedMult=posRespMs<1500?1.3:posRespMs<4000?1.0:posRespMs<8000?0.8:0.6;
      const posWagerMult=Math.max(0.5,Math.min(1.5,currentMultIdx/Math.max(1,defaultMultIdx)));
      if(isCorrect){ 
        advanceMult();
        S.xp+=Math.round(computeXP(true,currentMultIdx,posRespMs)*fatigueXPMultiplier());
      }
      else {
        resetMult();
        studyPending.push({idx:i,mod:'pos-s'+axisStage});
      }
      save();
      // Speak on answer for stage 2+ (character was prompt or is being revealed)
      // Stage 1 is definition-only — no audio
      if(axisStage>=2 && S.sound!=='mute') speak(ch,activeCourse().langCode);
      armTapAdvance($('studyPOS'),()=>nextStudyCard(),isCorrect?0:1200);
    };
    box.appendChild(b);
  });

  show('study');
  $('studySession').style.display='none';
  $('studyMC').style.display='none';
  $('studyTone').style.display='none';
  if($('studyPOS')) $('studyPOS').style.display='flex';
  if($('studyColl')) $('studyColl').style.display='none';
  // Speak whenever character is the prompt (stage 2+)
  if(axisStage>=2 && S.sound!=='mute') speak(ch,activeCourse().langCode);
}


/* ============ TAP TO ADVANCE ============ */
// After answering, card stays on screen. Tap anywhere on the card to advance.
// Skip button uses 150ms delay (intentional fast path).

// Map container element to its named tap hint slot id
function getTapHintSlot(containerEl){
  if(!containerEl) return null;
  const id=containerEl.id||'';
  if(id==='studyMC') return 'studyMCTapHint';
  if(id==='studyPOS') return 'studyPOSTapHint';
  if(id==='studyTone') return 'studyToneTapHint';
  return null;
}

function armTapAdvance(containerEl, advanceFn, delay){
  // delay=0 or undefined → arm immediately (correct answer)
  // delay>0 → arm after delay ms (wrong answer — mandatory review pause)
  clearTapAdvance(containerEl);

  const slotId=getTapHintSlot(containerEl);
  const slot=slotId?document.getElementById(slotId):null;

  const actualDelay=delay||0;
  const cardEl=containerEl.querySelector('[style*="border:5px"],[style*="border: 5px"]')||containerEl;

  const armIt=()=>{
    if(slot) slot.textContent='TAP TO CONTINUE';
    const handler=(e)=>{
      // Let clicks on interactive elements through — don't advance
      const tag=(e.target.tagName||'').toUpperCase();
      const hasFunc=tag==='BUTTON'||tag==='A'||
        e.target.classList.contains('choice')||
        e.target.classList.contains('cjk')||
        e.target.closest('.cjk')||
        e.target.closest('button')||
        e.target.closest('.choice')||
        e.target.id==='studyHanzi'||
        e.target.id==='studyMCPromptText'||
        e.target.closest('#studyHanzi')||
        e.target.closest('#studyMCPromptText');
      if(hasFunc) return; // let it propagate — open dictionary, etc.
      e.stopPropagation();
      cardEl.removeEventListener('click',handler);
      if(slot) slot.textContent='';
      advanceFn();
    };
    cardEl.addEventListener('click',handler);
  };

  if(actualDelay>0){
    // Wrong answer: show countdown hint, arm after delay
    if(slot) slot.textContent=''; // silent until armed
    setTimeout(armIt, actualDelay);
  } else {
    // Correct answer: arm immediately
    armIt();
  }
}

function clearTapAdvance(containerEl){
  const slotId=getTapHintSlot(containerEl);
  const slot=slotId?document.getElementById(slotId):null;
  if(slot) slot.textContent='';
  const old=document.getElementById('tapAdvanceHint');
  if(old) old.remove();
}

function clearTapAdvance(containerEl){
  const h=document.getElementById('tapAdvanceHint');
  if(h) h.remove();
}


/* ============ EXPOSURE GATE ============ */
// Nothing is visible to the user until introduced via flashcard.
// exp > 0 means the user has completed at least one full flashcard flip.

function hasBeenIntroduced(ch){
  // Check if this character exists in deck and has exp > 0
  const idx=D.findIndex(([c])=>c===ch);
  if(idx<0) return false;
  return (card(idx).exp||0)>0;
}

function hasBeenIntroducedIdx(i){
  return (card(i).exp||0)>0;
}

// Mask a character that hasn't been introduced yet
// Returns the character if introduced, otherwise a placeholder
const CHAR_MASK='░';
function maskedChar(ch){
  return hasBeenIntroduced(ch)?ch:CHAR_MASK;
}


/* ============ EXAMPLE SENTENCES ============ */
// Curated sentences using high-frequency words from the deck
// Each sentence: [characters, translation, [array of deck indices used]]
const SENTENCES=[
  ["我是你的朋友。","I am your friend.",[1,3,2,4]],
  ["他在哪里？","Where is he?",[6,20,29]],
  ["我们都很好。","We are all well.",[15,22,8,7]],
  ["这是什么？","What is this?",[10,3,25]],
  ["我不知道。","I don't know.",[1,7,39,40]],
  ["你好吗？","Are you well?",[2,7,46]],
  ["他是我的老师。","He is my teacher.",[6,3,1,4,97]],
  ["我们可以去吗？","Can we go?",[15,50,30,46]],
  ["这个人很好。","This person is very good.",[10,11,9,8,7]],
  ["你在做什么？","What are you doing?",[2,20,57,25]],
];

// Get sentences that are relevant to a given deck index
function getSentencesFor(deckIdx){
  return SENTENCES.filter(([,, idxs])=>idxs.includes(deckIdx));
}

// Render a sentence with unseen chars masked
function renderSentence(sentenceChars, translation, containerEl, fg){
  const CJKf="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  const wrap=document.createElement('div');
  wrap.style.cssText='padding:8px 0;border-top:1px solid '+fg+';opacity:.9;';

  const sentEl=document.createElement('div');
  sentEl.style.cssText=CJKf+';font-size:18px;line-height:1.6;letter-spacing:2px;';

  // Render each character — mask if not introduced
  [...sentenceChars].forEach(ch=>{
    const span=document.createElement('span');
    const idx=D.findIndex(([c])=>c===ch);
    const introduced=idx<0||hasBeenIntroducedIdx(idx);
    span.textContent=introduced?ch:CHAR_MASK;
    span.style.color=fg;
    if(introduced&&idx>=0){
      span.style.cssText+='cursor:pointer;';
      span.onclick=(e)=>{ e.stopPropagation(); openCharDetail(ch,0,idx); };
    }
    sentEl.appendChild(span);
  });

  const transEl=document.createElement('div');
  transEl.style.cssText='font-size:9px;opacity:.65;margin-top:4px;letter-spacing:.5px;';
  transEl.textContent=translation;

  wrap.appendChild(sentEl);
  wrap.appendChild(transEl);
  containerEl.appendChild(wrap);
}


/* ============ GRAMMAR CATEGORY MASTERY ============ */
// Track user performance per broad category (AGENT/THING etc.)
// Used to bias POS question selection toward weak categories
// and to select distractors that probe known confusions

function recordGrammarAttempt(pos, isCorrect){
  const info=POS_LOGICAL[pos];
  if(!info) return;
  const cat=info.cat;
  if(!S.grammarMastery) S.grammarMastery={};
  if(!S.grammarMastery[cat]) S.grammarMastery[cat]={attempts:0,correct:0,recentWindow:[]};
  const gm=S.grammarMastery[cat];
  gm.attempts++;
  if(isCorrect) gm.correct++;
  gm.recentWindow.push(isCorrect?1:0);
  if(gm.recentWindow.length>20) gm.recentWindow.shift();
  save();
}

function grammarCategoryAccuracy(cat){
  const gm=S.grammarMastery&&S.grammarMastery[cat];
  if(!gm||gm.attempts<3) return 0.5; // assume 50% if no data
  const recent=gm.recentWindow.slice(-10);
  return recent.reduce((s,v)=>s+v,0)/recent.length;
}

// Get weakest category — for biasing question selection
function weakestGrammarCategory(){
  const cats=Object.keys(CAT_DEFS);
  let worst=null; let worstAcc=1;
  cats.forEach(cat=>{
    const acc=grammarCategoryAccuracy(cat);
    if(acc<worstAcc){ worstAcc=acc; worst=cat; }
  });
  return worst;
}

// Should we target a specific category this question?
// Returns true if a weak category exists and random chance fires
function shouldTargetWeakCategory(){
  const cats=Object.keys(CAT_DEFS);
  return cats.some(cat=>grammarCategoryAccuracy(cat)<0.7);
}

// Pick distractors that probe known confusions
// If user confuses QUALITY/DEGREE and ACTION/STATE, put both in choices
function confusionAwareDistractors(pos, allCats){
  const info=POS_LOGICAL[pos];
  if(!info) return shuffle(allCats.filter(p=>p!==pos));
  const correctCat=info.cat;

  // Find categories the user struggles with most
  const catAccuracies=Object.keys(CAT_DEFS).map(cat=>({
    cat, acc:grammarCategoryAccuracy(cat)
  })).sort((a,b)=>a.acc-b.acc);

  // Bias distractor pool toward confusable categories
  const weakCats=catAccuracies.slice(0,2).map(x=>x.cat).filter(c=>c!==correctCat);

  // For stage 2+ (POS names), find distractors from weak categories first
  const weakDistractors=allCats.filter(p=>{
    const pi=POS_LOGICAL[p];
    return pi&&weakCats.includes(pi.cat)&&p!==pos;
  });
  const otherDistractors=allCats.filter(p=>!weakDistractors.includes(p)&&p!==pos);
  return [...shuffle(weakDistractors), ...shuffle(otherDistractors)];
}


/* ============ COURSE METADATA ============ */
// Encapsulates language/course identity.
// All display and scheduling functions reference this rather than hardcoded D/100.
// When a second course (Arabic, etc.) is added, swap ACTIVE_COURSE.

const COURSES={
  'mandarin':{
    langCode:'zh-CN',
    langName:'Mandarin Chinese',
    langNameNative:'普通话',
    script:'ltr',
    hasTone:true,
    hasColls:true,
    lexicon:D_MANDARIN,
    storageKey:'earworm-mandarin-v1',
    hasGrammar:true,
  },
  'arabic-levantine':{
    langCode:'ar-LB',
    langName:'Levantine Arabic',
    langNameNative:'عربي شامي',
    script:'rtl',
    segment:'space',   // space-delimited: atoms matched on word boundaries, not substrings
    hasTone:false,
    lexicon:D_AR,
    storageKey:'earworm-arabic-levantine-v1',
    hasGrammar:false,
    // Pre-rendered audio — speak() checks this before falling through to browser TTS.
    // Sources: Amazon Polly Neural (amazon-*) from reference deck; Google TTS (gtts-*) generated
    // for words not covered. All MSA-approximated; dialect distinction deferred.
    // Regenerate with higher-quality source when available — audioMap is the seam.
    audioMap:{
      // Amazon Polly Neural (reference deck) — higher quality
      'في':   'audio/ar/amazon-fe9c5823-bc898e46-70cba867-19d309e7-55b0c09e.mp3',
      'شو':   'audio/ar/amazon-93dc6942-2bc1546e-472c9c06-c778dd81-12815639.mp3',
      'شوي':  'audio/ar/amazon-68d4bcc4-f9c2f544-df903ba5-e57b13d7-e91e5b5b.mp3',
      'هيك':  'audio/ar/amazon-8a0cb071-e8f92c73-ba20c2d2-bece254f-6e371178.mp3',
      'بس':   'audio/ar/amazon-27c4c2ec-67435f4f-3199e1f8-a1efafe6-8c578f67.mp3',
      'يعني': 'audio/ar/amazon-28dc4e14-119d075e-7d05b038-46e5e10b-1ca62d7e.mp3',
      // Google TTS (gtts) — generated for remaining seed words
      'من':   'audio/ar/gtts-ar-min.mp3',
      'على':  'audio/ar/gtts-ar-ala.mp3',
      'مع':   'audio/ar/gtts-ar-maa.mp3',
      'ب':    'audio/ar/gtts-ar-bi.mp3',
      'أنا':  'audio/ar/gtts-ar-ana.mp3',
      'أنت':  'audio/ar/gtts-ar-inta.mp3',
      'هو':   'audio/ar/gtts-ar-huwwe.mp3',
      'هي':   'audio/ar/gtts-ar-hiyye.mp3',
      'إحنا': 'audio/ar/gtts-ar-ihna.mp3',
      'مين':  'audio/ar/gtts-ar-min2.mp3',
      'وين':  'audio/ar/gtts-ar-wen.mp3',
      'كيف':  'audio/ar/gtts-ar-kif.mp3',
      'كتير': 'audio/ar/gtts-ar-ktir.mp3',
      'هلق':  'audio/ar/gtts-ar-halla2.mp3',
      'لا':   'audio/ar/gtts-ar-la.mp3',
      'يلا':  'audio/ar/gtts-ar-yalla.mp3',
      // Batch 2
      'مش':   'audio/ar/gtts-ar-mish.mp3',
      'ما':   'audio/ar/gtts-ar-ma-neg.mp3',
      'بدّي': 'audio/ar/gtts-ar-biddi.mp3',
      'رح':   'audio/ar/gtts-ar-ra7.mp3',
      'لازم': 'audio/ar/gtts-ar-laazim.mp3',
      'هاد':  'audio/ar/gtts-ar-haad.mp3',
      'هاي':  'audio/ar/gtts-ar-haay.mp3',
      'شي':   'audio/ar/gtts-ar-shi.mp3',
      'ناس':  'audio/ar/gtts-ar-naas.mp3',
      'يوم':  'audio/ar/gtts-ar-yoom.mp3',
      'وقت':  'audio/ar/gtts-ar-wa2t.mp3',
      'أنتو': 'audio/ar/gtts-ar-into.mp3',
      'هنّي': 'audio/ar/gtts-ar-hun-ni.mp3',
      'حكى':  'audio/ar/gtts-ar-7aka.mp3',
      'شاف':  'audio/ar/gtts-ar-shaaf.mp3',
      'أجا':  'audio/ar/gtts-ar-2aja.mp3',
      'راح':  'audio/ar/gtts-ar-raa7.mp3',
      'بيت':  'audio/ar/gtts-ar-bayt.mp3',
    },
  },
  'japanese':{
    langCode:'ja-JP',
    langName:'Japanese',
    langNameNative:'日本語',
    script:'ltr',
    hasTone:false,
    lexicon:D_JA,
    storageKey:'earworm-japanese-v1',
    hasGrammar:false,
  },
  'vietnamese':{
    langCode:'vi-VN',
    langName:'Vietnamese',
    langNameNative:'Tiếng Việt',
    script:'ltr',
    segment:'space',     // FIRST space-delimited course with sentence content — exercises the tokenizer seam
    hasTone:false,       // tone is in the diacritic; tone-as-diacritic drilling deferred
    readingIsWord:true,  // Latin orthography already encodes pronunciation — no separate reading row
    lexicon:D_VI,
    storageKey:'earworm-vietnamese-v1',
    hasGrammar:false,
  },
};
const ACTIVE_COURSE_PREF='earworm-active-course';
let ACTIVE_COURSE_KEY='mandarin';
function activeCourse(){ return COURSES[ACTIVE_COURSE_KEY]; }
function activeLexicon(){ return COURSES[ACTIVE_COURSE_KEY].lexicon; }

// Point the global lexicon (D) and state key (KEY) at the given course.
// Does NOT touch S — caller decides whether to load/reset.
function applyCoursePointers(key){
  ACTIVE_COURSE_KEY=key;
  D=COURSES[key].lexicon;
  KEY=COURSES[key].storageKey;
  // Repoint the active sentence bank too (defined in drills.js, wired onto the
  // course object there). Mirrors the D/KEY repointing — keeps cloze/word-order
  // sourcing from the right language. Guarded: EXAMPLE_SENTENCES is a later global.
  try{ if(typeof EXAMPLE_SENTENCES!=='undefined') EXAMPLE_SENTENCES=COURSES[key].sentences||{}; }catch(e){}
}

// Called once at startup — restore the last-used course from localStorage.
function restoreActiveCourse(){
  let key='mandarin';
  try{ const s=localStorage.getItem(ACTIVE_COURSE_PREF); if(s&&COURSES[s]) key=s; }catch(e){}
  applyCoursePointers(key);
}

// User-facing course switch: persist current progress, repoint to the new
// course, load its saved progress (or start fresh), and re-render home.
function switchCourse(key){
  if(!COURSES[key]||key===ACTIVE_COURSE_KEY) return;
  save();                       // flush current course under its KEY
  applyCoursePointers(key);     // repoint D + KEY
  try{ localStorage.setItem(ACTIVE_COURSE_PREF,key); }catch(e){}
  S=defaultState();             // clear in-memory state
  load();                       // hydrate from the new course's KEY (no-op if none)
  S.activeDeck='core';          // deck indices are course-specific
  if(typeof resetSessionFatigue==='function') resetSessionFatigue();
  if(typeof rollBg==='function') rollBg();
  renderHome();
  if(typeof renderTTSStatus==='function') renderTTSStatus();
  show('home');
}

function showCoursePicker(){
  const existing=document.getElementById('coursePickerOverlay');
  if(existing){ existing.remove(); return; }
  const overlay=document.createElement('div');
  overlay.id='coursePickerOverlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.72);z-index:900;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';
  const sheet=document.createElement('div');
  sheet.style.cssText='font-family:inherit;min-width:260px;max-width:360px;width:100%;background:var(--bg);border:4px solid var(--fg);padding:16px;';
  const hdr=document.createElement('div');
  hdr.style.cssText='font-size:7px;letter-spacing:3px;opacity:.5;margin-bottom:14px;text-align:center;';
  hdr.textContent='SELECT COURSE';
  sheet.appendChild(hdr);
  Object.entries(COURSES).forEach(([key,course])=>{
    const isActive=key===ACTIVE_COURSE_KEY;
    let seen=0;
    try{
      if(isActive){
        seen=(S.uniqueSeen&&S.uniqueSeen.length)||0;
      } else {
        const raw=localStorage.getItem(course.storageKey);
        if(raw){ const st=JSON.parse(raw); seen=(st.uniqueSeen&&Array.isArray(st.uniqueSeen))?st.uniqueSeen.length:0; }
      }
    }catch(e){}
    const total=course.lexicon.length;
    const row=document.createElement('div');
    row.style.cssText='border:'+(isActive?'4px':'3px')+' solid;padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;'+(isActive?'':'cursor:pointer;');
    const left=document.createElement('div');
    left.style.cssText='flex:1;min-width:0;';
    const native=document.createElement('div');
    native.style.cssText='font-size:22px;font-family:"PingFang SC","Heiti SC","Noto Sans","Noto Sans Arabic","Arial Unicode MS",sans-serif;letter-spacing:1px;'+(course.script==='rtl'?'direction:rtl;':'');
    native.textContent=course.langNameNative;
    const sub=document.createElement('div');
    sub.style.cssText='font-size:7px;opacity:.55;margin-top:6px;letter-spacing:2px;';
    sub.textContent=course.langName.toUpperCase()+'  ·  '+seen+' / '+total+' WORDS';
    left.appendChild(native); left.appendChild(sub);
    const marker=document.createElement('div');
    marker.style.cssText='font-size:14px;margin-left:14px;flex-shrink:0;opacity:'+(isActive?'1':'.45')+';';
    marker.textContent=isActive?'★':'▶';
    row.appendChild(left); row.appendChild(marker);
    if(!isActive) row.onclick=()=>{ overlay.remove(); switchCourse(key); };
    sheet.appendChild(row);
  });
  overlay.appendChild(sheet);
  overlay.onclick=(e)=>{ if(e.target===overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

function cycleCourse(){ showCoursePicker(); }

// Rank of word i within the active deck's frequency ordering
// Returns 1-based position among words the user has been introduced to
function cardFreqRank(i){
  // Within active deck indices, how many introduced words come before i?
  const indices=activeDeckIndices();
  const introduced=indices.filter(idx=>idx<=i&&(S.cards[idx]&&S.cards[idx].exp>0));
  return introduced.length; // 1-based: if i is the 3rd introduced word, returns 3
}

// Total introduced words in active deck
function introducedCount(){
  return activeDeckIndices().filter(i=>(S.cards[i]&&S.cards[i].exp>0)).length;
}

// Session reveal tracking
const sessionRevealOrder=new Map(); // idx -> reveal position (1-based)
let sessionRevealCount=0;

// Card rank display string — session order N/N seen this session
function cardRankStr(i){
  if(!sessionRevealOrder.has(i)){
    sessionRevealOrder.set(i,++sessionRevealCount);
  }
  return sessionRevealOrder.get(i)+'/'+sessionRevealCount;
}



/* ============ GRAMMAR TRACK — MULTI-DIMENSIONAL ============ */
// Five independent sub-axes per grammatical category.
// Each sub-axis has its own SRS schedule, history, and stage.
// The category's overall stage = min of all sub-axes.

const GRAMMAR_CATS=['AGENT/THING','ACTION/STATE','QUALITY/DEGREE','LOGICAL GLUE'];

// Sub-axes — ordered by pedagogical sequence
const GRAMMAR_AXES=[
  'recognition',    // Can identify what category a definition describes
  'categorization', // Can assign a POS name to the category
  'discrimination', // Can distinguish confusable categories
  'application',    // Understands behavioral rules of the category
  'tl_integration', // Target language: terms, structure, Mandarin-specific behavior
];

// Max stages per axis — more stages = more granular progression
const AXIS_MAX_STAGES={
  recognition:    4, // 0=unseen → 1=basic → 2=reverse → 3=edge cases → 4=mastered
  categorization: 4, // 0=unseen → 1=broad → 2=standard names → 3=TL names → 4=compound
  discrimination: 3, // 0=unseen → 1=clear pairs → 2=adjacent → 3=TL overlaps
  application:    4, // 0=unseen → 1=English rules → 2=TL contrasts → 3=TL rules → 4=productive
  tl_integration: 4, // 0=unseen → 1=EN about TL → 2=bilingual → 3=TL meta → 4=TL instruction
};

// SRS intervals per axis stage (in hours — grammar advances faster than vocabulary)
const AXIS_INTERVALS={
  // Card-count intervals per stage: show again after N total cards seen
  recognition:    [5,  15,  50,  200],
  categorization: [5,  15,  50,  200],
  discrimination: [8,  25, 100      ],
  application:    [8,  25, 100, 400 ],
  tl_integration: [10, 40, 150, 600 ],
};

// Initialize grammar state — safe to call multiple times (idempotent)
function initGrammarState(){
  if(!S.grammar) S.grammar={};
  GRAMMAR_CATS.forEach(cat=>{
    if(!S.grammar[cat]||typeof S.grammar[cat]!=='object') S.grammar[cat]={};
    GRAMMAR_AXES.forEach(axis=>{
      if(!S.grammar[cat][axis]||typeof S.grammar[cat][axis]!=='object'){
        S.grammar[cat][axis]={
          stage:0,
          history:[],
          due:0,      // 0 = immediately due (unseen)
          reps:0,
        };
      }
    });
    // Migrate old flat format if present
    if(S.grammar[cat].stages!==undefined){
      const oldStage=S.grammar[cat].stages[cat]||0;
      GRAMMAR_AXES.forEach(axis=>{
        S.grammar[cat][axis].stage=Math.min(oldStage,AXIS_MAX_STAGES[axis]);
      });
      delete S.grammar[cat].stages;
      delete S.grammar[cat].due;
      delete S.grammar[cat].history;
      delete S.grammar[cat].reps;
    }
  });
}

// Getters
function gAxis(cat, axis){ 
  initGrammarState();
  return S.grammar[cat][axis]; 
}
function gStage(cat, axis){ return gAxis(cat,axis).stage||0; }
function gDue(cat, axis){ return gAxis(cat,axis).due||0; }
function gHistory(cat, axis){ return gAxis(cat,axis).history||[]; }
function isAxisDue(cat, axis){
  const v=gDue(cat,axis);
  if(v>1e9) return true; // migration: old ms timestamp → immediately due
  return v<=(S.totalSeen||0);
}

// Overall grammar stage for a category = minimum sub-axis stage
// Reflects genuine mastery only when all dimensions are solid
function grammarStage(cat){
  if(!S.grammar||!S.grammar[cat]) return 0;
  return Math.min(...GRAMMAR_AXES.map(ax=>gStage(cat,ax)));
}

// Accuracy for a specific sub-axis
function axisAccuracyG(cat, axis, window=5){
  const hist=gHistory(cat,axis);
  if(!hist.length) return 0.5;
  const recent=hist.slice(-window);
  return recent.reduce((s,v)=>s+v,0)/recent.length;
}

// Record result for a specific sub-axis
function recordAxisResultG(cat, axis, isCorrect, responseMs){
  const ax=gAxis(cat,axis);
  const seen=S.totalSeen||0;

  ax.history.push(isCorrect?1:0);
  if(ax.history.length>30) ax.history.shift();

  const stage=ax.stage||0;
  const maxStage=AXIS_MAX_STAGES[axis]||3;
  const intervals=AXIS_INTERVALS[axis]||[8,25,100];

  if(!isCorrect){
    ax.reps=0;
    const wrongCards=stage<=1?3:stage<=2?6:12;
    ax.due=seen+wrongCards;
  } else {
    ax.reps=(ax.reps||0)+1;
    // Accuracy window for advancement
    const wagerBonus=(currentMultIdx>defaultMultIdx)?1:0;
    const windowSize=Math.max(1,(stage===0?2:3)-wagerBonus);
    const recent=ax.history.slice(-windowSize);
    const acc=recent.reduce((s,v)=>s+v,0)/Math.max(1,recent.length);
    const threshold=stage===0?1.0:0.8;
    const shouldAdvance=recent.length>=windowSize&&acc>=threshold&&stage<maxStage;

    const speedMult=responseMs<1500?1.2:responseMs<4000?1.0:0.9;
    if(shouldAdvance){
      ax.stage=stage+1;
      ax.reps=0;
      ax.due=seen+Math.round((intervals[Math.min(stage+1,intervals.length-1)]||100)*speedMult);
    } else {
      ax.due=seen+Math.max(1,Math.round((intervals[Math.min(stage,intervals.length-1)]||8)*speedMult));
    }
  }
  save();
}

// Which sub-axis is most overdue for a category?
function mostOverdueAxis_G(cat){
  const seen=S.totalSeen||0;
  let worst=null; let worstOverdue=-Infinity;
  GRAMMAR_AXES.forEach(axis=>{
    if(!isAxisDue(cat,axis)) return; // not due yet
    const v=gDue(cat,axis);
    const overdue=seen-(v>1e9?0:v);
    if(overdue>worstOverdue){ worstOverdue=overdue; worst=axis; }
  });
  return worst;
}

// Is any axis of this category due?
function isCatDue(cat){
  return GRAMMAR_AXES.some(axis=>isAxisDue(cat,axis));
}

// Get due grammar drills sorted by priority

/* ============ GRAMMAR UNLOCK CONDITIONS ============ */
// Grammar drills only fire when the user has sufficient vocabulary evidence
// in the relevant category. Grammar instruction clarifies patterns the user
// has already partially internalized through vocabulary exposure.

// Vocabulary threshold per axis stage: how many words in the category
// must be at the required meaning stage before this axis unlocks
const GRAMMAR_UNLOCK_THRESHOLDS={
  // [wordsRequired, meaningStageRequired]
  recognition:    { 0:[2,1], 1:[3,1], 2:[4,2], 3:[6,2] },
  categorization: { 0:[3,2], 1:[5,2], 2:[6,3], 3:[8,3] },
  discrimination: { 0:[4,2], 1:[6,2], 2:[8,3], 3:[10,3] },
  application:    { 0:[4,2], 1:[6,2], 2:[8,3], 3:[10,3] },
  tl_integration: { 0:[5,3], 1:[6,3], 2:[8,3], 3:[10,4] },
};

// Count introduced words in a grammar category at a given meaning stage
function wordsInCatAtStage(cat, minMeaningStage){
  let count=0;
  D.forEach(function(d,i){
    if(!(S.cards[i]&&S.cards[i].exp>0)) return; // not introduced
    const pos=d[4];
    if(!pos||!POS_LOGICAL[pos]) return;
    if(POS_LOGICAL[pos].cat!==cat) return;
    if(getAxisStage(i,'meaning')<minMeaningStage) return;
    count++;
  });
  return count;
}

// Is a specific grammar axis unlocked for the user?
// Returns true if vocabulary evidence is sufficient for this type of instruction
function grammarAxisUnlocked(cat, axis){
  const stage=gStage(cat,axis);
  const thresholds=GRAMMAR_UNLOCK_THRESHOLDS[axis];
  if(!thresholds) return false;
  const t=thresholds[Math.min(stage,Object.keys(thresholds).length-1)];
  if(!t) return false;
  const [wordsRequired, meaningStageRequired]=t;
  const actual=wordsInCatAtStage(cat,meaningStageRequired);
  return actual>=wordsRequired;
}

// Overall: is any grammar for this category worth drilling right now?
function grammarCatUnlocked(cat){
  return GRAMMAR_AXES.some(function(axis){ return grammarAxisUnlocked(cat,axis); });
}

function dueGrammarDrills(){
  const seen=S.totalSeen||0;
  const drills=[];
  GRAMMAR_CATS.forEach(function(cat){
    GRAMMAR_AXES.forEach(function(axis){
      if(!isAxisDue(cat,axis)) return;
      if(sessionGrammarAnswered.has(cat+':'+axis)) return;
      // Only drill if vocabulary evidence is sufficient
      if(!grammarAxisUnlocked(cat,axis)) return;
      const v=gDue(cat,axis);
      drills.push({cat,axis,overdue:seen-(v>1e9?0:v)});
    });
  });
  return drills.sort(function(a,b){return b.overdue-a.overdue;});
}

// Compatibility shims — use sub-axis model
function grammarDue(cat){ 
  if(!S.grammar||!S.grammar[cat]) return 0;
  return Math.min(...GRAMMAR_AXES.map(ax=>gDue(cat,ax))); 
}
function isGrammarDue(cat){ return isCatDue(cat); }


/* ============ GRAMMAR STAGE CONTENT ============ */
// Per-category, per-stage content for grammar track progression.
// Stage 0-1: pre-linguistic, parent language only
// Stage 2:   standard POS names with definitions, parent language
// Stage 3:   Mandarin-specific nuances, still in English
// Stage 4:   bilingual — English + 中文
// Stage 5:   Mandarin-only grammar instruction (API-generated, vocabulary-filtered)

const GRAMMAR_CONTENT={
  'AGENT/THING':{
    // Stage 1: definition → category recognition
    s1:{
      def:'something that exists — a person, object, or idea you can point to',
      hint:'think: what is it? who is it? — if you can name it, it is in this category',
    },
    // Stage 2: category → standard POS names
    s2:{
      intro:'AGENT/THING words have specific names in grammar:',
      members:{
        'noun':     'names a specific person, place, thing, or idea',
        'pronoun':  'replaces a noun — I, you, he, she, it, they',
        'suffix':   'attaches to another word to form a noun',
      },
      question:'Which of these belongs to AGENT/THING?',
    },
    // Stage 3: Mandarin-specific nuance
    s3:{
      intro:'In Mandarin, AGENT/THING words have distinctive features:',
      notes:[
        'Nouns are bare — no articles (a, the), no plural markers',
        '书 means book, a book, the book, or books — context decides',
        'Pronouns add 们 for plural: 我→我们, 你→你们, 他→他们',
        'Measure words (量词) are required when counting nouns',
      ],
      question:'Which statement about Mandarin nouns is correct?',
      choices:[
        {text:'Nouns change form for plural',correct:false},
        {text:'The same word means book, a book, and the books',correct:true},
        {text:'Articles like 一个 are optional',correct:false},
        {text:'Pronouns never change form',correct:false},
      ],
    },
    // Stage 4: bilingual
    s4:{
      pairs:[
        {en:'NOUN',zh:'名词',py:'míngcí',ex:'书 (book), 人 (person), 中国 (China)'},
        {en:'PRONOUN',zh:'代词',py:'dàicí',ex:'我 (I/me), 你 (you), 他 (he/him)'},
        {en:'MEASURE WORD',zh:'量词',py:'liàngcí',ex:'一本书, 一个人, 一张纸'},
      ],
    },
    // Stage 5: Mandarin-only (API-generated, template shown)
    s5:{
      template:'名词是表示人、事物、地点或概念的词。在普通话里，名词没有复数形式。',
      apiPrompt:'Explain what nouns are in Mandarin, using only these words the student knows: {knownWords}. Write 2-3 sentences in Mandarin.',
    },
  },

  'ACTION/STATE':{
    s1:{
      def:'something that happens or is — what something does, or how something is',
      hint:'think: what is happening? what is the situation? — actions and states both live here',
    },
    s2:{
      intro:'ACTION/STATE words have specific names:',
      members:{
        'verb':       'expresses an action — to go, to eat, to say',
        'modal verb': 'expresses possibility or obligation — can, must, should',
        'adjective':  'expresses a state — good, big, fast (Mandarin adjectives ARE verbs)',
      },
      question:'Which belongs to ACTION/STATE?',
    },
    s3:{
      intro:'Mandarin ACTION/STATE words are fundamentally different from English:',
      notes:[
        'Verbs never conjugate — 去 means go, goes, went, will go',
        'Adjectives are stative verbs — 好 means "to be good", not just "good"',
        '他好 = he is good (no verb needed — 好 IS the verb)',
        '很 before adjectives is rhythmic, not emphatic: 他很好 = natural',
        'Aspect markers (了 着 过) show how action relates to time, not tense',
      ],
      question:'Which is true about Mandarin verbs?',
      choices:[
        {text:'Verbs conjugate for past tense',correct:false},
        {text:'Adjectives need 是 to mean "to be"',correct:false},
        {text:'他好 is a complete sentence meaning "he is good"',correct:true},
        {text:'了 indicates past tense',correct:false},
      ],
    },
    s4:{
      pairs:[
        {en:'VERB',zh:'动词',py:'dòngcí',ex:'是 (to be), 有 (to have), 去 (to go)'},
        {en:'ADJECTIVE',zh:'形容词',py:'xíngróngcí',ex:'好 (good), 大 (big), 多 (many)'},
        {en:'MODAL VERB',zh:'能愿动词',py:'néngyuàn dòngcí',ex:'能 (can), 要 (want/will), 可以 (may)'},
      ],
    },
    s5:{
      template:'动词是表示动作或状态的词。在普通话里，动词没有时态变化。形容词也是动词的一种。',
      apiPrompt:'Explain how verbs work in Mandarin (no conjugation, adjectives as stative verbs), using only these known words: {knownWords}. Write 2-3 sentences in Mandarin.',
    },
  },

  'QUALITY/DEGREE':{
    s1:{
      def:'something that describes — how big, how fast, how much, to what degree',
      hint:'think: what kind? how much? to what extent? — modifiers live here',
    },
    s2:{
      intro:'QUALITY/DEGREE words modify other words:',
      members:{
        'adjective': 'modifies a noun — red, big, beautiful',
        'adverb':    'modifies a verb or adjective — very, always, not',
      },
      question:'Which belongs to QUALITY/DEGREE?',
    },
    s3:{
      intro:'Mandarin QUALITY/DEGREE words have key features:',
      notes:[
        '很 (very) is required before adjectives in predicates, but loses emphasis',
        '都 (all/both) and 也 (also/too) are high-frequency degree adverbs',
        'Adverbs always precede what they modify — word order is strict',
        'Some degree words precede verbs: 都去 (all go), 也来 (also come)',
      ],
      question:'Where do Mandarin adverbs appear in a sentence?',
      choices:[
        {text:'After the verb they modify',correct:false},
        {text:'Before the verb or adjective they modify',correct:true},
        {text:'At the end of the sentence',correct:false},
        {text:'Position is flexible',correct:false},
      ],
    },
    s4:{
      pairs:[
        {en:'ADJECTIVE',zh:'形容词',py:'xíngróngcí',ex:'好 (good), 大 (big), 多 (many)'},
        {en:'ADVERB',zh:'副词',py:'fùcí',ex:'都 (all), 也 (also), 很 (very), 不 (not)'},
      ],
    },
    s5:{
      template:'副词修饰动词或形容词。在普通话里，副词必须放在它修饰的词前面。',
      apiPrompt:'Explain how adverbs work in Mandarin (position before verb/adjective), using only these known words: {knownWords}. Write 2-3 sentences.',
    },
  },

  'LOGICAL GLUE':{
    s1:{
      def:'something that connects or signals — shows how other words relate to each other',
      hint:'think: the invisible scaffolding — no content meaning, pure grammatical function',
    },
    s2:{
      intro:'LOGICAL GLUE words are the grammatical scaffolding:',
      members:{
        'particle':     'signals grammatical relationships — possession, aspect, mood',
        'conjunction':  'connects clauses or ideas',
        'measure word': 'required classifier when counting nouns',
      },
      question:'Which belongs to LOGICAL GLUE?',
    },
    s3:{
      intro:'Mandarin LOGICAL GLUE is the most distinctive category:',
      notes:[
        '的 marks possession and modification: 我的书 (my book), 好的人 (good person)',
        '了 marks completed aspect — not past tense, but completion: 我吃了 (I ate/have eaten)',
        '吗 turns a statement into a yes/no question — sentence-final',
        '呢 asks "what about...?" or softens: 你呢? (and you?)',
        'Measure words are mandatory: 一本书 (one book), NOT 一书',
      ],
      question:'What does 了 primarily signal?',
      choices:[
        {text:'Past tense',correct:false},
        {text:'Completed aspect — the action is done',correct:true},
        {text:'Future intent',correct:false},
        {text:'Polite register',correct:false},
      ],
    },
    s4:{
      pairs:[
        {en:'PARTICLE',zh:'助词',py:'zhùcí',ex:'的 (possessive), 了 (completion), 吗 (question)'},
        {en:'CONJUNCTION',zh:'连词',py:'liáncí',ex:'和 (and), 但是 (but), 因为 (because)'},
        {en:'MEASURE WORD',zh:'量词',py:'liàngcí',ex:'本 (books), 个 (people), 张 (flat things)'},
      ],
    },
    s5:{
      template:'助词是没有实际意义的词，用来表示语法关系。的、了、吗是普通话里最常用的助词。',
      apiPrompt:'Explain what particles are in Mandarin and how 的 and 了 work, using only these known words: {knownWords}. Write 2-3 sentences.',
    },
  },
};

// Get the known words list for API prompts (words user has been introduced to)
function knownWordsForAPI(){
  return D.filter((_,i)=>(S.cards[i]&&S.cards[i].exp>0))
          .map(([ch,,def])=>ch+'('+def+')')
          .join(', ');
}


/* ============ GRAMMAR STAGE 5 — API-GENERATED MANDARIN INSTRUCTION ============ */
// Grammar lesson delivered entirely in Mandarin, using only the user's known vocabulary.
// This is the convergence point: grammar instruction IS language immersion.

async function showGrammarStage5(cat, fg){
  const content=GRAMMAR_CONTENT[cat];
  const CJKf="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";

  // Show loading state
  $('studyPOSChar').style.cssText='font-size:13px;font-family:inherit;color:'+fg+';line-height:1.6;';
  $('studyPOSChar').textContent='...';
  if($('studyPOSPinyin')) $('studyPOSPinyin').innerHTML=
    '<span style="font-size:7px;opacity:.6;letter-spacing:1px;">GENERATING MANDARIN LESSON</span>';

  show('study');
  $('studySession').style.display='none';
  $('studyMC').style.display='none';
  $('studyTone').style.display='none';
  if($('studyPOS')) $('studyPOS').style.display='flex';
  if($('studyColl')) $('studyColl').style.display='none';

  // Build vocabulary-filtered prompt
  const known=knownWordsForAPI();
  const prompt=content.s5.apiPrompt.replace('{knownWords}',known);

  try{
    const resp=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-6',
        max_tokens:300,
        system:'You are a Mandarin grammar teacher. Write clear, simple grammar explanations in Mandarin. Use only common characters. Keep sentences short. Do not use characters outside the provided vocabulary list unless they are extremely common (的,是,在,有,我,你,他,不,了,和). Respond only with the explanation, no English.',
        messages:[{role:'user',content:prompt}]
      })
    });
    const data=await resp.json();
    const lesson=data.content&&data.content[0]&&data.content[0].text||content.s5.template;

    // Display the lesson
    $('studyPOSChar').style.cssText=CJKf+';font-size:14px;color:'+fg+';line-height:1.8;';
    $('studyPOSChar').textContent=lesson;
    if($('studyPOSPinyin')) $('studyPOSPinyin').innerHTML=
      '<span style="font-size:7px;opacity:.5;letter-spacing:1px;">'+cat+' — IN MANDARIN</span>';

    // Stage 5 is a reading comprehension exercise
    // User taps to continue after reading — no MC question, just exposure
    // Mark as correct automatically after a reading dwell time
    const box=$('studyPOSChoices'); box.innerHTML='';

    // Ask one comprehension question about the lesson
    const compQ=await generateComprehensionQuestion(cat, lesson, fg);
    if(compQ){
      renderComprehensionQuestion(compQ, cat, fg);
    } else {
      // Fallback: just mark as read
      recordGrammarResult(cat,true,5000);
      recordChallengeResult(-1,'grammar:'+cat,true,5000);
      logGrammarAnswer(cat,'comprehension',true,5000);
      save();
      armTapAdvance($('studyPOS'),()=>nextStudyCard(),0);
    }

  }catch(err){
    // API failed — fall back to template
    $('studyPOSChar').style.cssText=CJKf+';font-size:14px;color:'+fg+';line-height:1.8;';
    $('studyPOSChar').textContent=content.s5.template;
    recordGrammarResult(cat,true,3000);
    logGrammarAnswer(cat,'comprehension',true,3000);
    save();
    armTapAdvance($('studyPOS'),()=>nextStudyCard(),0);
  }
}

async function generateComprehensionQuestion(cat, lesson, fg){
  // Ask the API to generate a simple true/false question about the lesson
  try{
    const resp=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-6',
        max_tokens:200,
        system:'Generate a simple true/false comprehension question about the grammar lesson. Respond only with valid JSON: {"question":"...","answer":true/false,"distractor":"..."} where question is in English, answer is the correct boolean, distractor is a plausible wrong answer string.',
        messages:[{role:'user',content:'Grammar lesson about '+cat+': '+lesson+' Generate one true/false comprehension question.'}]

      })
    });
    const data=await resp.json();
    const text=data.content&&data.content[0]&&data.content[0].text||'';
    return JSON.parse(text.replace(/```json|```/g,'').trim());
  }catch(e){ return null; }
}

function renderComprehensionQuestion(q, cat, fg){
  const box=$('studyPOSChoices'); box.innerHTML='';
  box.style.gridTemplateColumns='1fr 1fr';
  if($('studyPOSPinyin')) $('studyPOSPinyin').innerHTML=
    '<span style="font-size:9px;opacity:.8;">'+q.question+'</span>';
  const choices=[
    {label:'TRUE', correct:q.answer===true},
    {label:'FALSE', correct:q.answer===false},
  ];
  let locked=false;
  choices.forEach(({label,correct})=>{
    const b=document.createElement('button');
    b.className='choice';
    b.style.cssText='font-size:10px;border-color:'+fg+';color:'+fg+';padding:12px;text-align:center;';
    b.textContent=label;
    b.onclick=()=>{
      if(locked) return; locked=true;
      document.querySelectorAll('#studyPOSChoices .choice').forEach(tb=>{
        if((tb.textContent==='TRUE'&&q.answer===true)||(tb.textContent==='FALSE'&&q.answer===false))
          tb.classList.add('correct');
        else if(tb===b&&!correct) tb.classList.add('wrong');
        tb.style.pointerEvents='none';
      });
      const respMs=Date.now()-cardShownAtMC;
      recordGrammarResult(cat,correct,respMs);
      recordChallengeResult(-1,'grammar:'+cat,correct,respMs);
      logGrammarAnswer(cat,'comprehension',correct,respMs);
      if(correct){ advanceMult(); S.xp+=Math.round(computeXP(true,currentMultIdx,respMs)*fatigueXPMultiplier()); }
      else resetMult();
      save();
      armTapAdvance($('studyPOS'),()=>nextStudyCard(),correct?0:1200);
    };
    box.appendChild(b);
  });
}


/* ============ QUEUE REBUILD SCHEDULING ============ */
let nextQueueRebuildAt=0;

// Find the earliest due date among cards not yet in active rotation
// Schedule queue rebuild for that moment
function scheduleNextQueueRebuild(){
  const now=Date.now();
  let earliest=Infinity;

  // Check vocabulary cards
  D.forEach((_,i)=>{
    if(!isUnlocked(i)) return;
    const ci=S.cards[i];
    if(!ci||!ci.exp) return;
    // Per-axis due dates
    ['meaning','pos'].forEach(axis=>{
      const due=getAxisDue(i,axis);
      if(due>now && due<earliest) earliest=due;
    });
    // Legacy due
    if(ci.due>now && ci.due<earliest) earliest=ci.due;
  });

  // Check grammar sub-axes
  if(S.grammar){
    GRAMMAR_CATS.forEach(cat=>{
      if(!S.grammar[cat]) return;
      GRAMMAR_AXES.forEach(axis=>{
        const ax=S.grammar[cat][axis];
        if(ax&&ax.due>now&&ax.due<earliest) earliest=ax.due;
      });
    });
  }

  nextQueueRebuildAt=earliest===Infinity?0:earliest;
}

function showGrammarDrill(cat, axis){
  if(!axis) axis=mostOverdueAxis_G(cat)||'recognition';
  S.totalSeen=(S.totalSeen||0)+1;
  activeCardIdx=-1;
  rollBg();
  const fg=getComputedStyle(document.body).color;
  const stage=gStage(cat,axis);
  const content=GRAMMAR_CONTENT[cat];
  if(!content){ recordAxisResultG(cat,axis,true,100); nextStudyCard(); return; }

  // Axes beyond the language-agnostic boundary contain Mandarin-specific content.
  // For non-Mandarin courses, auto-advance past them — they will never show.
  const _isMandarin=activeCourse()&&activeCourse().langCode==='zh-CN';
  if(!_isMandarin){
    if(axis==='application'||axis==='tl_integration'){
      recordAxisResultG(cat,axis,true,100); nextStudyCard(); return;
    }
    if(axis==='categorization'&&stage>=2){ recordAxisResultG(cat,axis,true,100); nextStudyCard(); return; }
    if(axis==='discrimination'&&stage>=3){ recordAxisResultG(cat,axis,true,100); nextStudyCard(); return; }
  }

  $('studyMode').textContent='GRAMMAR \u00b7 '+cat.replace('/',' / ');
  cardShownAtMC=Date.now();
  $('studyPOSRank').textContent='';
  $('studyPOSPrompt').style.borderColor=fg;
  $('studyPOSPrompt').style.color=fg;
  renderChallengeRings(-1,'grammar:'+cat+':'+axis,$('studyPOSPrompt'));

  const ansZone=document.getElementById('studyPOSAnswer');
  if(ansZone) ansZone.innerHTML='';
  const pyEl=$('studyPOSPinyin'); if(pyEl) pyEl.innerHTML='';

  let prompt='', choices=[], correctChoice='';

  if(axis==='recognition'){
    if(stage<=1){
      prompt='"'+content.s1.def.toUpperCase()+'"';
      correctChoice=cat;
      choices=shuffle([cat,...GRAMMAR_CATS.filter(function(c){return c!==cat;})]);
      if(pyEl) pyEl.innerHTML='<span style="font-size:7px;opacity:.6;letter-spacing:1px;">WHICH CATEGORY DOES THIS DESCRIBE?</span>';
    } else if(stage===2){
      prompt=cat.toUpperCase();
      var defs=GRAMMAR_CATS.map(function(c){ return GRAMMAR_CONTENT[c]&&GRAMMAR_CONTENT[c].s1&&GRAMMAR_CONTENT[c].s1.def?GRAMMAR_CONTENT[c].s1.def.toUpperCase().slice(0,45)+'...':c; });
      correctChoice=content.s1.def.toUpperCase().slice(0,45)+'...';
      choices=shuffle(defs).slice(0,4);
      if(choices.indexOf(correctChoice)<0) choices[0]=correctChoice;
      choices=shuffle(choices);
      if(pyEl) pyEl.innerHTML='<span style="font-size:7px;opacity:.6;letter-spacing:1px;">WHICH DEFINITION MATCHES?</span>';
    } else {
      var examples={'AGENT/THING':['freedom','justice','velocity','the economy'],'ACTION/STATE':['seems','belongs','is becoming','remains'],'QUALITY/DEGREE':['slightly','utterly','barely','almost'],'LOGICAL GLUE':['that (subordinator)','so (conjunction)','up (particle)','yet (connector)']};
      var exList=examples[cat]||[content.s1.def.split(' ').slice(0,3).join(' ')];
      var ex=exList[Math.floor(Math.random()*exList.length)];
      prompt='"'+ex.toUpperCase()+'"';
      correctChoice=cat;
      choices=shuffle([cat,...GRAMMAR_CATS.filter(function(c){return c!==cat;})]);
      if(pyEl) pyEl.innerHTML='<span style="font-size:7px;opacity:.6;letter-spacing:1px;">WHICH CATEGORY?</span>';
    }
  }

  else if(axis==='categorization'){
    if(stage<=1){
      var members=content.s2&&content.s2.members?Object.entries(content.s2.members):[];
      if(!members.length){ recordAxisResultG(cat,axis,true,100); nextStudyCard(); return; }
      var pair=members[Math.floor(Math.random()*members.length)];
      var targetPOS=pair[0], targetDef=pair[1];
      correctChoice=targetPOS.toUpperCase();
      prompt='"'+targetDef.toUpperCase()+'"';
      var others=POS_STAGE2.filter(function(p){ return !Object.keys(content.s2.members).includes(p); });
      choices=shuffle([targetPOS.toUpperCase(),...shuffle(others).slice(0,3).map(function(p){return p.toUpperCase();})]);
      if(pyEl) pyEl.innerHTML='<span style="font-size:7px;opacity:.6;letter-spacing:1px;">WHICH PART OF SPEECH?</span>';
    } else if(stage===2){
      var s4pairs=content.s4&&content.s4.pairs||[];
      if(!s4pairs.length){ recordAxisResultG(cat,axis,true,100); nextStudyCard(); return; }
      var p4=s4pairs[Math.floor(Math.random()*s4pairs.length)];
      prompt=p4.en.toUpperCase();
      correctChoice=p4.zh;
      var otherZH=s4pairs.filter(function(p){return p.zh!==p4.zh;}).map(function(p){return p.zh;});
      var extraZH=Object.values(POS_ZH).filter(function(z){return !s4pairs.map(function(p){return p.zh;}).includes(z);}).slice(0,2);
      choices=shuffle([p4.zh,...otherZH,...extraZH].filter(function(v,i,a){return a.indexOf(v)===i;})).slice(0,4);
      if(choices.indexOf(correctChoice)<0) choices[choices.length-1]=correctChoice;
      choices=shuffle(choices);
      if(pyEl) pyEl.innerHTML='<span style="font-size:7px;opacity:.6;letter-spacing:1px;">WHICH MANDARIN TERM?</span>';
    } else {
      var inCat=POS_STAGE3.filter(function(p){return p.includes('/')&&POS_LOGICAL[p]&&POS_LOGICAL[p].cat===cat;});
      if(!inCat.length){ recordAxisResultG(cat,axis,true,100); nextStudyCard(); return; }
      var tgt=inCat[Math.floor(Math.random()*inCat.length)];
      var info=POS_LOGICAL[tgt];
      prompt='"'+info.def.toUpperCase()+'"';
      correctChoice=tgt.toUpperCase();
      var cOthers=POS_STAGE3.filter(function(p){return p!==tgt;}).slice(0,3);
      choices=shuffle([tgt.toUpperCase(),...cOthers.map(function(p){return p.toUpperCase();})]);
      if(pyEl) pyEl.innerHTML='<span style="font-size:7px;opacity:.6;letter-spacing:1px;">WHICH TYPE?</span>';
    }
  }

  else if(axis==='discrimination'){
    var confusables={'AGENT/THING':['ACTION/STATE','QUALITY/DEGREE'],'ACTION/STATE':['QUALITY/DEGREE','AGENT/THING'],'QUALITY/DEGREE':['ACTION/STATE','LOGICAL GLUE'],'LOGICAL GLUE':['QUALITY/DEGREE','ACTION/STATE']};
    var confPair=confusables[cat]||[];
    if(stage<=1){
      var catEx={'AGENT/THING':['book','teacher','idea','country'],'ACTION/STATE':['runs','seems','is','becomes'],'QUALITY/DEGREE':['quickly','very','rarely','completely'],'LOGICAL GLUE':['the','and','of','that']};
      var correctEx=(catEx[cat]||[cat])[Math.floor(Math.random()*(catEx[cat]||[cat]).length)];
      var wrongCat=confPair[0]||GRAMMAR_CATS.find(function(c){return c!==cat;});
      var wrongEx=(catEx[wrongCat]||[wrongCat])[Math.floor(Math.random()*(catEx[wrongCat]||[wrongCat]).length)];
      prompt='WHICH IS AN EXAMPLE OF '+cat+'?';
      correctChoice='"'+correctEx.toUpperCase()+'"';
      choices=shuffle(['"'+correctEx.toUpperCase()+'"','"'+wrongEx.toUpperCase()+'"']);
      if(pyEl) pyEl.innerHTML='<span style="font-size:7px;opacity:.6;letter-spacing:1px;">SELECT THE '+cat+'</span>';
    } else if(stage===2){
      prompt='WHICH BEST DESCRIBES "'+cat+'"?';
      correctChoice=content.s1.def.toUpperCase();
      var wrongDefs=confPair.map(function(c){return GRAMMAR_CONTENT[c]&&GRAMMAR_CONTENT[c].s1?GRAMMAR_CONTENT[c].s1.def.toUpperCase():null;}).filter(Boolean);
      choices=shuffle([correctChoice,...wrongDefs]).slice(0,3);
      if(choices.indexOf(correctChoice)<0) choices[0]=correctChoice;
      choices=shuffle(choices);
      if(pyEl) pyEl.innerHTML='<span style="font-size:7px;opacity:.6;letter-spacing:1px;">WHICH DEFINITION IS CORRECT?</span>';
    } else {
      var s3q=content.s3;
      if(!s3q||!s3q.choices){ recordAxisResultG(cat,axis,true,100); nextStudyCard(); return; }
      prompt='"'+s3q.question.toUpperCase()+'"';
      correctChoice=s3q.choices.find(function(c){return c.correct;}).text.toUpperCase();
      choices=shuffle(s3q.choices.map(function(c){return c.text.toUpperCase();})).slice(0,4);
      if(choices.indexOf(correctChoice)<0) choices[choices.length-1]=correctChoice;
      choices=shuffle(choices);
      if(pyEl) pyEl.innerHTML='<span style="font-size:7px;opacity:.5;font-size:8px;">'+(s3q.notes&&s3q.notes[0]||'')+'</span>';
    }
  }

  else if(axis==='application'){
    if(stage<=1){
      var appRules={'AGENT/THING':{q:'NOUNS IN ENGLISH CAN:',correct:'TAKE ARTICLES (A, THE)',wrong:['CONJUGATE FOR TENSE','MODIFY VERBS','SHOW RELATIONSHIPS']},'ACTION/STATE':{q:'VERBS IN MANDARIN:',correct:'NEVER CONJUGATE FOR TENSE',wrong:['ALWAYS TAKE ARTICLES','REQUIRE MEASURE WORDS','MUST FOLLOW \u662f']},'QUALITY/DEGREE':{q:'ADVERBS IN MANDARIN:',correct:'ALWAYS PRECEDE WHAT THEY MODIFY',wrong:['ALWAYS FOLLOW THE VERB','CAN APPEAR ANYWHERE','REQUIRE \u7684 AFTER THEM']},'LOGICAL GLUE':{q:'MANDARIN PARTICLES LIKE \u7684 AND \u4e86:',correct:'HAVE NO DIRECT TRANSLATION',wrong:['ALWAYS MARK PAST TENSE','ALWAYS MARK POSSESSION','ALWAYS END SENTENCES']}};
      var rule=appRules[cat]; if(!rule){ recordAxisResultG(cat,axis,true,100); nextStudyCard(); return; }
      prompt=rule.q;
      correctChoice=rule.correct;
      choices=shuffle([rule.correct,...rule.wrong]).slice(0,4);
      if(choices.indexOf(correctChoice)<0) choices[choices.length-1]=correctChoice;
      choices=shuffle(choices);
      if(pyEl) pyEl.innerHTML='<span style="font-size:7px;opacity:.6;letter-spacing:1px;">SELECT THE CORRECT RULE</span>';
    } else if(stage===2){
      var appNotes=content.s3&&content.s3.notes||[];
      if(!appNotes.length){ recordAxisResultG(cat,axis,true,100); nextStudyCard(); return; }
      var note=appNotes[Math.floor(Math.random()*appNotes.length)];
      prompt='"'+note.toUpperCase()+'"';
      correctChoice='TRUE';
      choices=['TRUE','FALSE'];
      if(pyEl) pyEl.innerHTML='<span style="font-size:7px;opacity:.6;letter-spacing:1px;">TRUE IN MANDARIN?</span>';
    } else {
      var s3app=content.s3;
      if(!s3app||!s3app.choices){ recordAxisResultG(cat,axis,true,100); nextStudyCard(); return; }
      prompt='"'+s3app.question.toUpperCase()+'"';
      correctChoice=s3app.choices.find(function(c){return c.correct;}).text.toUpperCase();
      choices=shuffle(s3app.choices.map(function(c){return c.text.toUpperCase();})).slice(0,4);
      if(choices.indexOf(correctChoice)<0) choices[choices.length-1]=correctChoice;
      choices=shuffle(choices);
      if(pyEl) pyEl.innerHTML='<span style="font-size:7px;opacity:.5;">'+(s3app.notes&&s3app.notes.slice(0,2).join(' \u00b7 ')||'')+'</span>';
    }
  }

  else if(axis==='tl_integration'){
    var tlpairs=content.s4&&content.s4.pairs||[];
