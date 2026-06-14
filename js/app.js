
/* ── Console suppression (dev build) ─────────────────────────── */
// Roadmap: re-enable with debug flag for development builds
const _noop = () => {};
const console = { log:_noop, warn:_noop, error:_noop, debug:_noop, info:_noop, dir:_noop, group:_noop, groupEnd:_noop, time:_noop, timeEnd:_noop };

/* ================================================================
   EARWORM v2 — Layered Architecture
   ================================================================
   Layer 1: Legacy UI  — original working code (preserved intact)
   Layer 2: Data       — clean static data module (overrides L1 data)
   Layer 3: Scheduler  — pure scheduling engine (no DOM/side effects)
   Layer 4: State      — centralised dispatch state manager
   Layer 5: Bridge     — wires State/Scheduler into legacy code
   ================================================================
   Migration strategy: legacy code continues to work unchanged.
   New features use State.dispatch() and Scheduler methods.
   Legacy code migrated function-by-function as time permits.
   ================================================================ */

// ═══════════════════════════════════════════════════════════════
// LAYER 1 — Legacy UI (original, preserved intact)
// ═══════════════════════════════════════════════════════════════

/* ============ DATA: 100 most common Mandarin lemmas ============ */
/* [char, [[syllable,tone],...], definition, [[radical,strokes],...], pos]
   Frequency rank = array index. Corpus policy: spoken/subtitle frequency
   (SUBTLEX-CH ordering) is authoritative for all expansion beyond 100. */
const D=[
["的",[["de",0]],"possessive particle",[["勺", 3], ["白", 5]],"particle"],
["我",[["wǒ",3]],"I, me",[["手",4],["戈",4]],"pronoun"],
["你",[["nǐ",3]],"you",[["亻",2],["尔",5]],"pronoun"],
["是",[["shì",4]],"to be",[["日",4],["疋",5]],"verb"],
["了",[["le",0]],"completed action",[["乙",1]],"particle"],
["不",[["bù",4]],"no, not",[["一",1],["丕",5]],"adverb"],
["他",[["tā",1]],"he, him",[["亻",2],["也",3]],"pronoun"],
["她",[["tā",1]],"she, her",[["女",3],["也",3]],"pronoun"],
["们",[["men",0]],"plural marker",[["亻",2],["门",3]],"suffix"],
["吗",[["ma",0]],"question particle",[["口",3],["马",10]],"particle"],
["在",[["zài",4]],"at, in, exist",[["土",3],["才",3]],"verb/prep"],
["有",[["yǒu",3]],"to have",[["又", 2], ["月", 4]],"verb"],
["这",[["zhè",4]],"this",[["辶",3],["文",4]],"pronoun"],
["那",[["nà",4]],"that",[["阝",2],["冄",4]],"pronoun"],
["个",[["gè",4]],"general measure word",[["丨", 1], ["人", 2]],"measure word"],
["好",[["hǎo",3]],"good, well",[["女",3],["子",3]],"adjective"],
["来",[["lái",2]],"to come",[["木",4],["米",6]],"verb"],
["去",[["qù",4]],"to go",[["厶",2],["土",3]],"verb"],
["说",[["shuō",1]],"to speak, say",[["讠",2],["兑",7]],"verb"],
["什么",[["shén",2],["me",0]],"what",[["亻",2],["十",2],["厶",2]],"pronoun"],
["要",[["yào",4]],"to want, need",[["女", 3], ["西", 6]],"verb/modal"],
["就",[["jiù",4]],"then, just, right away",[["尤",4],["京",8]],"adverb"],
["会",[["huì",4]],"can, will, meeting",[["人",2],["云",4]],"modal verb"],
["能",[["néng",2]],"can, be able to",[["匕", 2], ["匕", 2], ["月", 4]],"modal verb"],
["上",[["shàng",4]],"up, above, on",[["一",1],["丨",1]],"noun/verb"],
["下",[["xià",4]],"down, below, under",[["一",1],["卜",2]],"noun/verb"],
["大",[["dà",4]],"big, large",[["大",3]],"adjective"],
["小",[["xiǎo",3]],"small, little",[["小",3]],"adjective"],
["人",[["rén",2]],"person, people",[["人",2]],"noun"],
["中",[["zhōng",1]],"middle, center",[["丨",1],["囗",3]],"noun/adj"],
["国",[["guó",2]],"country, nation",[["囗",3],["玉",5]],"noun"],
["家",[["jiā",1]],"home, family",[["宀",3],["豕",7]],"noun"],
["看",[["kàn",4]],"to look, watch, read",[["手",4],["目",5]],"verb"],
["想",[["xiǎng",3]],"to think, want, miss",[["心",4],["相",9]],"verb"],
["知道",[["zhī",1],["dào",4]],"to know",[["口", 3], ["辶", 3], ["矢", 5], ["首", 9]],"verb"],
["时间",[["shí",2],["jiān",1]],"time",[["寸", 3], ["门", 3], ["日", 4], ["日", 4]],"noun"],
["年",[["nián",2]],"year",[["丿", 1], ["干", 3]],"noun"],
["天",[["tiān",1]],"day, sky, heaven",[["一", 1], ["大", 3]],"noun"],
["今天",[["jīn",1],["tiān",1]],"today",[["一", 1], ["人", 2], ["大", 3]],"noun"],
["明天",[["míng",2],["tiān",1]],"tomorrow",[["一", 1], ["大", 3], ["日", 4], ["月", 4]],"noun"],
["昨天",[["zuó",2],["tiān",1]],"yesterday",[["一", 1], ["大", 3], ["日", 4], ["乍", 5]],"noun"],
["吃",[["chī",1]],"to eat",[["口",3],["乞",3]],"verb"],
["喝",[["hē",1]],"to drink",[["口",3],["曷",9]],"verb"],
["水",[["shuǐ",3]],"water",[["水",4]],"noun"],
["饭",[["fàn",4]],"cooked rice, meal",[["饣",3],["反",4]],"noun"],
["茶",[["chá",2]],"tea",[["人", 2], ["艹", 3], ["木", 4]],"noun"],
["学",[["xué",2]],"to study, learn",[["冖", 2], ["子", 3], ["爻", 6]],"verb"],
["学生",[["xué",2],["sheng",0]],"student",[["冖", 2], ["子", 3], ["生", 5], ["爻", 6]],"noun"],
["老师",[["lǎo",3],["shī",1]],"teacher",[["丿", 1], ["匕", 2], ["巾", 3], ["耂", 4]],"noun"],
["朋友",[["péng",2],["you",0]],"friend",[["又", 2], ["月", 4]],"noun"],
["爱",[["ài",4]],"to love",[["爫",4],["心",4],["友",4]],"verb"],
["喜欢",[["xǐ",3],["huan",0]],"to like",[["口", 3], ["欠", 4], ["壴", 12]],"verb"],
["做",[["zuò",4]],"to do, to make",[["亻",2],["攴",4],["古",5]],"verb"],
["工作",[["gōng",1],["zuò",4]],"work, job",[["亻", 2], ["工", 3], ["乍", 5]],"noun/verb"],
["钱",[["qián",2]],"money",[["钅",5],["戋",5]],"noun"],
["买",[["mǎi",3]],"to buy",[["乛",1],["头",5]],"verb"],
["卖",[["mài",4]],"to sell",[["十",2],["买",6]],"verb"],
["多",[["duō",1]],"many, much",[["夕",3],["夕",3]],"adjective"],
["少",[["shǎo",3]],"few, little",[["丿", 1], ["小", 3]],"adjective"],
["很",[["hěn",3]],"very",[["彳",3],["艮",6]],"adverb"],
["太",[["tài",4]],"too (excessively)",[["丶", 1], ["大", 3]],"adverb"],
["都",[["dōu",1]],"all, both",[["阝", 2], ["者", 8]],"adverb"],
["也",[["yě",3]],"also, too",[["乙",1],["也",3]],"adverb"],
["和",[["hé",2]],"and, with, harmony",[["口",3],["禾",5]],"conjunction"],
["但是",[["dàn",4],["shì",4]],"but, however",[["亻", 2], ["日", 4], ["旦", 5], ["疋", 5]],"conjunction"],
["因为",[["yīn",1],["wèi",4]],"because",[["囗",3],["大",3],["爪",4],["田",5]],"conjunction"],
["所以",[["suǒ",3],["yǐ",3]],"therefore, so",[["乙", 1], ["人", 2], ["户", 4], ["斤", 4]],"conjunction"],
["可以",[["kě",3],["yǐ",3]],"may, can, okay",[["乙", 1], ["丁", 2], ["人", 2], ["口", 3]],"modal verb"],
["没有",[["méi",2],["yǒu",3]],"to not have, there isn't",[["又", 2], ["氵", 3], ["殳", 4], ["月", 4]],"verb"],
["现在",[["xiàn",4],["zài",4]],"now",[["土", 3], ["才", 3], ["王", 4], ["见", 4]],"noun/adv"],
["里",[["lǐ",3]],"inside, in",[["土", 3], ["田", 5], ["里", 7]],"noun/prep"],
["外",[["wài",4]],"outside",[["卜", 2], ["夕", 3]],"noun/prep"],
["前",[["qián",2]],"front, before",[["刂",2],["止",4],["月",4]],"noun/prep"],
["后",[["hòu",4]],"back, behind, after",[["口",3],["幺",3],["工",3]],"noun/prep"],
["左",[["zuǒ",3]],"left",[["丿", 1], ["工", 3]],"noun/adj"],
["右",[["yòu",4]],"right",[["又", 2], ["口", 3]],"noun/adj"],
["走",[["zǒu",3]],"to walk, to leave",[["土",3],["止",4],["走",7]],"verb"],
["跑",[["pǎo",3]],"to run",[["包",5],["足",7]],"verb"],
["开",[["kāi",1]],"to open, start, drive",[["一", 1], ["廾", 3]],"verb"],
["关",[["guān",1]],"to close, shut",[["丷",2],["天",4]],"verb"],
["门",[["mén",2]],"door, gate",[["门",3]],"noun"],
["车",[["chē",1]],"car, vehicle",[["车",4]],"noun"],
["路",[["lù",4]],"road, path, route",[["各",6],["足",7]],"noun"],
["飞机",[["fēi",1],["jī",1]],"airplane",[["几", 2], ["飞", 3], ["木", 4]],"noun"],
["火车",[["huǒ",3],["chē",1]],"train",[["火",4],["车",4]],"noun"],
["电话",[["diàn",4],["huà",4]],"telephone",[["讠", 2], ["电", 5], ["舌", 6]],"noun"],
["手机",[["shǒu",3],["jī",1]],"mobile phone",[["几", 2], ["手", 4], ["木", 4]],"noun"],
["电脑",[["diàn",4],["nǎo",3]],"computer",[["月", 4], ["电", 5], ["囟", 6]],"noun"],
["书",[["shū",1]],"book",[["乛",1],["曰",4]],"noun"],
["写",[["xiě",3]],"to write",[["冖",2],["与",3]],"verb"],
["读",[["dú",2]],"to read",[["讠",2],["卖",8]],"verb"],
["听",[["tīng",1]],"to listen",[["口",3],["斤",4]],"verb"],
["音乐",[["yīn",1],["yuè",4]],"music",[["木", 4], ["白", 5], ["音", 9]],"noun"],
["名字",[["míng",2],["zi",0]],"name",[["口",3],["夕",3],["子",3],["宀",3]],"noun"],
["谁",[["shéi",2]],"who",[["讠",2],["隹",8]],"pronoun"],
["哪里",[["nǎ",3],["lǐ",3]],"where",[["阝", 2], ["口", 3], ["土", 3], ["田", 5]],"pronoun"],
["怎么",[["zěn",3],["me",0]],"how",[["厶", 2], ["心", 4], ["乍", 5]],"pronoun"],
["为什么",[["wèi",4],["shén",2],["me",0]],"why",[["丶",1],["亻",2],["十",2],["厶",2]],"pronoun"],
["对",[["duì",4]],"correct, right; toward",[["又", 2], ["寸", 3]],"adjective"],
["错",[["cuò",4]],"wrong, mistake",[["钅",5],["昔",8]],"adjective"],
["再见",[["zài",4],["jiàn",4]],"goodbye",[["冂",2],["土",3],["见",4],["目",5]],"interjection"]
];


/* ============ STATE ============ */
const KEY='earworm-mandarin-v1';
let S={cards:{},xp:0,lastDay:null,streak:0,sound:'auto',ordered:false,decks:{},activeDeck:'core',dailyCards:0,dailyDate:'',uniqueSeen:[],mult:1.0,multStreak:0,seenColls:[],grammarMastery:{},
  // Independent grammar track — multi-dimensional, per-category
  // Each category has 5 independent sub-axes with their own SRS schedules
  grammar:{}
}; // sound: auto|tap|mute
let mem=true;
function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){
      const saved=JSON.parse(raw);
      S=Object.assign({},S,saved);
      S.ordered=false;
      // Ensure all fields have correct types
      if(!Array.isArray(S.uniqueSeen)) S.uniqueSeen=[];
      if(!Array.isArray(S.seenColls)) S.seenColls=[];
      if(typeof S.mult!=='number') S.mult=1.0;
      if(typeof S.multStreak!=='number') S.multStreak=0;
      if(typeof S.xp!=='number') S.xp=0;
      if(typeof S.streak!=='number') S.streak=0;
      if(!S.cards||typeof S.cards!=='object') S.cards={};
      if(!S.grammarMastery||typeof S.grammarMastery!=='object') S.grammarMastery={};
      // Ensure grammar track exists with all categories
      if(!S.grammar||typeof S.grammar!=='object') S.grammar={};
      if(!S.decks||typeof S.decks!=='object') S.decks={};
    }
  }catch(e){ console.warn('Load failed, fresh start',e); }
}
function save(){
  try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){}
}
function card(i){
  if(!S.cards[i]) S.cards[i]={reps:0,lapses:0,iv:0,due:0,seen:false,m:0,exp:0,flipMs:0,axisStage:{pos:0,meaning:0},axisCorrect:{pos:0,meaning:0}};
  return S.cards[i];
}
function state(i){
  const m=masteryScore(i);
  if(m>=MASTERY_MAX) return 3; // mastered
  if(m>=2) return 2;           // familiar
  if(m>0) return 1;            // learning
  return 0;                    // unseen
}


/* ============ EXPOSURE & GRADUATION ============ */
const FLIP_FAST=2000;  // ms — user is bored/familiar
const FLIP_SLOW=6000;  // ms — user is working hard
const EXP_BASE=3;      // base exposures before MC eligible
const EXP_MIN=1;       // absolute minimum
const EXP_MAX=7;       // absolute maximum

function expThreshold(i){
  const ci=card(i);
  const avg=ci.flipMs||0;
  if(avg===0) return EXP_BASE; // no data yet
  if(avg<FLIP_FAST) return Math.max(EXP_MIN, EXP_BASE-Math.floor((FLIP_FAST-avg)/500));
  if(avg>FLIP_SLOW) return Math.min(EXP_MAX, EXP_BASE+Math.floor((avg-FLIP_SLOW)/1000));
  return EXP_BASE;
}

function isMCEligible(i){
  const ci=card(i);
  return (ci.exp||0) >= expThreshold(i);
}

function recordFlashcardFlip(i, frontMs, backMs){
  recordFlashExposure(i);
  const ci=card(i);
  const totalMs=frontMs+backMs;
  // Exponential moving average — recent flips weighted more
  const alpha=0.4;
  ci.flipMs = ci.flipMs ? Math.round(ci.flipMs*(1-alpha)+totalMs*alpha) : totalMs;
  ci.exp = (ci.exp||0)+1;
  ci.seen=true;
  save();
}

/* ============ MASTERY ============ */
const MASTERY_MAX=4;
function masteryScore(i){ return Math.min(MASTERY_MAX, Math.max(0, card(i).m||0)); }
function isMastered(i){ return masteryScore(i)>=MASTERY_MAX; }

// ── FRONTIER MODEL ──────────────────────────────────────────────
// Words enter one at a time in strict frequency order.
// A word is INTRODUCED when it has been shown as a flashcard (exp > 0).
// A word GRADUATES when meaning axis stage >= 2 AND pos axis stage >= 1.
// The frontier is the index of the next word to be introduced.
// New words are introduced by the scheduler, not unlocked in batches.

// Graduation: has this word established enough for a new word to enter?
function isGraduated(i){
  // Graduated = word has been tested in at least one MC question
  // NOT just introduced via flash — requires an actual answer
  const ci=S.cards[i];
  if(!ci||!ci.exp) return false;
  // New axisReps counter (primary)
  if(ci.axisReps&&(ci.axisReps.meaning||0)>=1) return true;
  // Legacy reps counter fallback
  if((ci.reps||0)+(ci.lapses||0)>0) return true;
  return false;
}

// Frontier: highest index that has been introduced (exp > 0) + 1
// This is the position on the frequency spine — how deep into the language the user is
function frontier(){
  let f=0;
  for(let i=0;i<D.length;i++){
    if((S.cards[i]&&S.cards[i].exp>0)) f=i+1;
  }
  return f;
}

// A word is active (in working rotation) if it has been introduced
function isUnlocked(i){
  if(S.activeDeck && S.activeDeck!=='core' && S.decks[S.activeDeck]
     && S.decks[S.activeDeck].indices.includes(i)) return true;
  return (S.cards[i]&&S.cards[i].exp>0)||false;
}

// Returns true only if every D[] entry (single or multi-char) that appears
// in the sentence has already been introduced as a flashcard.
function sentenceAllIntroduced(zh){
  for(let j=0;j<D.length;j++){
    if(S.cards[j]&&S.cards[j].exp) continue;
    if(zh.includes(D[j][0])) return false;
  }
  return true;
}

// Returns [syllable, tone] for a single CJK character by scanning D[].
// First tries an exact single-char entry; falls back to character's position
// inside any multi-char entry (e.g. "吃" inside "吃饭"). Returns null if unknown.
function charSyl(char){
  const exact=D.findIndex(function(d){return d[0]===char;});
  if(exact>=0&&D[exact][1].length) return D[exact][1][0];
  for(let j=0;j<D.length;j++){
    const pos=D[j][0].indexOf(char);
    if(pos>=0&&D[j][1].length>pos) return D[j][1][pos];
  }
  return null;
}

// Next word to introduce: next on frequency spine not yet introduced
// Or next unlocked compound if its rank < next spine word's rank
function nextWordToIntroduce(){
  // Next individual word
  let nextSpine=-1;
  for(let i=0;i<D.length;i++){
    if(!S.cards[i]||!S.cards[i].exp){
      nextSpine=i; break;
    }
  }

  // Front-load component characters before a multi-character compound.
  // If "你好" is next but "好" hasn't been introduced yet, introduce "好" first
  // so the learner can always open its dictionary entry.
  if(nextSpine>=0&&D[nextSpine][0].length>1){
    const chars=[...D[nextSpine][0]];
    const missing=[];
    chars.forEach(function(c){
      const ci=D.findIndex(function(d){return d[0]===c;});
      if(ci>=0&&(!S.cards[ci]||!S.cards[ci].exp)) missing.push(ci);
    });
    if(missing.length>0){
      missing.sort(function(a,b){return a-b;});
      return {type:'word',idx:missing[0]};
    }
  }

  // Next unlocked compound (all components introduced, compound itself not yet shown)
  let nextColl=-1;
  let nextCollRank=Infinity;
  COLL.forEach((entry,ci)=>{
    if(S.seenColls&&S.seenColls.includes(ci)) return; // already introduced
    if(!collUnlocked(ci)) return;
    const rank=entry[5]||999;
    if(rank<nextCollRank){ nextCollRank=rank; nextColl=ci; }
  });

  // Rule: individual spine words ALWAYS take priority over compounds.
  // A compound is never introduced before all its components AND before
  // the next spine word. Compounds only fill slots when no new spine word
  // is pending — i.e. all introduced words are graduated.
  if(nextSpine>=0) return {type:'word', idx:nextSpine};
  // Only offer a compound if no new individual word is waiting
  if(nextColl>=0) return {type:'coll', idx:nextColl};
  return null;
}

// Should we introduce a new word this session?
// Conservative: introduce when N words in rotation have graduated
// and session is fresh (not fatigued)
const NEW_WORD_GRAD_THRESHOLD=1; // introduce new word after 1 graduation
// ROADMAP: fatigue mechanics disabled — re-enable when ready
// fatigueLevel, fatigueXPMultiplier, tickSessionCard all stubbed to neutral
function fatigueLevel(){  // DISABLED
  return 0; // always no fatigue
  // 0 = fresh, 1 = optimal, 2 = fatigued
  if(sessionCardCount<30) return 0;
  if(sessionCardCount<60) return 1;
  return 2;
}

function shouldIntroduceNewWord(){
  // brandNew: introduced (exp>0) but never answered in any axis
  // Uses axisReps (primary); falls back to legacy reps+lapses
  const brandNew=D.filter((_,i)=>{
    const ci=S.cards[i];
    if(!ci||!ci.exp) return false;
    const hasAxisAnswer=ci.axisReps&&
      ((ci.axisReps.meaning||0)+(ci.axisReps.pos||0)+(ci.axisReps.tone||0))>0;
    const hasLegacyAnswer=(ci.reps||0)+(ci.lapses||0)>0;
    return !hasAxisAnswer&&!hasLegacyAnswer;
  }).length;
  if(brandNew>=8) return false; // allow up to 8 words pending first answer
  // Active rotation cap: introduced but not yet mastered (mastery is the real "done")
  const inRotation=D.filter((_,i)=>isUnlocked(i)&&!isMastered(i)).length;
  return inRotation<30;
}

function addMastery(i, delta){
  const c=card(i);
  c.m=Math.min(MASTERY_MAX, Math.max(0, (c.m||0)+delta));
  save();
}

/* ============ SCHEDULER ============ */
// Per-axis SRS intervals. Each axis has its own due date.
// A card is due if ANY axis is due. The most-overdue axis determines modality.
// Intervals are calibrated to actual forgetting curve research:
//   First correct: 1 day
//   Second correct: 3 days
//   Third correct: 7 days
//   Then multiply by stability factor per axis

const DAY=86400000;

// Axis-specific stability multipliers
// POS axis: conceptual — longer intervals once learned
// Meaning axis: higher frequency repetition early, then extends
const AXIS_STABILITY={
  // Stage 0: same-session, Stage 1: hours, Stage 2+: days
  meaning: [0.002, 0.04, 0.5, 2, 7, 21], // 0.002d=3min, 0.04d=58min, 0.5d=12hr
  pos:     [0.01, 0.2, 2, 7],
  tone:    [0.01, 0.1, 1, 5],
};

function getAxisDue(i, axis){
  const ci=card(i);
  if(!ci.axisDue) ci.axisDue={};
  return ci.axisDue[axis]||0;
}

function setAxisDue(i, axis, isCorrect, responseMs){
  const ci=card(i);
  if(!ci.axisDue) ci.axisDue={};
  if(!ci.axisReps) ci.axisReps={meaning:0,pos:0,tone:0};
  const now=Date.now();

  if(!isCorrect){
    // Wrong: short interval — review within same session or shortly after
    ci.axisReps[axis]=0;
    const stage=getAxisStage(i,axis);
    // Stage 0-1: 5 min, Stage 2: 20 min, Stage 3+: 1 hour
    const wrongMs=stage<=1?5*60000:stage===2?20*60000:60*60000;
    ci.axisDue[axis]=now+wrongMs;
  } else {
    ci.axisReps[axis]=(ci.axisReps[axis]||0)+1;
    const stage=getAxisStage(i,axis);
    const stability=AXIS_STABILITY[axis]||[1,3,7,14];
    const reps=ci.axisReps[axis];
    // Interval grows with reps, modulated by response speed
    const speedFactor=responseMs<2000?1.2:responseMs<5000?1.0:0.8;
    const baseDays=stability[Math.min(reps-1,stability.length-1)]||30;
    const intervalMs=Math.max(60000, Math.round(baseDays*speedFactor*DAY)); // min 1 minute
    ci.axisDue[axis]=now+intervalMs;
  }
  save();
}

// Is any axis of this card due?
function isCardDue(i){
  const now=Date.now();
  return ['meaning','pos'].some(axis=>getAxisDue(i,axis)<=now);
}

// Which axis is most overdue? Used to select modality for due cards
function mostOverdueAxis(i){
  const now=Date.now();
  let worst=null; let worstOverdue=-Infinity;
  ['meaning','pos'].forEach(axis=>{
    const overdue=now-getAxisDue(i,axis);
    if(overdue>worstOverdue){ worstOverdue=overdue; worst=axis; }
  });
  return worst;
}

// Accuracy window: what fraction correct over last N attempts on this axis?
function axisAccuracy(i, axis, window=5){
  const ci=card(i);
  if(!ci.axisHistory) ci.axisHistory={meaning:[],pos:[],tone:[]};
  const hist=ci.axisHistory[axis]||[];
  if(hist.length===0) return null; // no data
  const recent=hist.slice(-window);
  return recent.filter(Boolean).length/recent.length;
}

// Record result in accuracy history
function recordAxisHistory(i, axis, isCorrect){
  const ci=card(i);
  if(!ci.axisHistory) ci.axisHistory={meaning:[],pos:[],tone:[]};
  if(!ci.axisHistory[axis]) ci.axisHistory[axis]=[];
  ci.axisHistory[axis].push(isCorrect?1:0);
  if(ci.axisHistory[axis].length>20) ci.axisHistory[axis].shift();
}

// Axis stage gate: use accuracy window instead of consecutive-correct
// Advance stage when accuracy >= threshold over last N attempts
const AXIS_ADVANCE_ACCURACY=0.80; // 80% accuracy over window
const AXIS_ADVANCE_WINDOW={
  pos:  [0,5,5,4],    // attempts needed before evaluating each stage gate
  meaning:[0,4,4,5,5,4],
};

function recordAxisResultNew(i, axis, isCorrect, responseMs){
  recordAxisHistory(i, axis, isCorrect);
  setAxisDue(i, axis, isCorrect, responseMs||3000);

  const ci=card(i);
  if(!ci.axisStage) ci.axisStage={pos:0,meaning:0};
  const currentStage=ci.axisStage[axis]||0;
  const maxStage=AXIS_MAX[axis]||3;
  if(currentStage>=maxStage) return;

  // Check if accuracy window threshold met for stage advancement
  const hist=ci.axisHistory[axis]||[];
  const windowSize=AXIS_ADVANCE_WINDOW[axis]?.[currentStage]||5;
  if(hist.length>=windowSize){
    const acc=axisAccuracy(i,axis,windowSize);
    if(acc>=AXIS_ADVANCE_ACCURACY){
      ci.axisStage[axis]=(currentStage+1);
      // Reset history for new stage
      ci.axisHistory[axis]=[];
    }
  }
  save();
}

// Confidence calibration: adjust scheduling frequency based on wager history
// Overconfident words (high wager + wrong) scheduled more aggressively
function confidenceAdjustedInterval(i, baseInterval){
  const ci=card(i);
  if(!ci.wagerLog||ci.wagerLog.length<3) return baseInterval;
  const recent=ci.wagerLog.slice(-10);
  const avgBetRatio=recent.reduce((s,r)=>s+r.betRatio,0)/recent.length;
  const accuracy=recent.filter(r=>r.ok).length/recent.length;
  // Overconfident: bet high, wrong often → shorter interval
  // Underconfident: bet low, right often → longer interval (they know it)
  const calibration=accuracy/Math.max(0.1,avgBetRatio);
  // calibration < 1 = overconfident → shorten; > 1 = underconfident → lengthen
  return Math.round(baseInterval*Math.min(2.0,Math.max(0.4,calibration)));
}

// Legacy rate() — kept for backward compat, wraps new per-axis system
function rate(i,r){
  const ci=card(i); const now=Date.now();
  ci.seen=true;
  if(r===1){
    ci.reps=0; ci.lapses++; ci.iv=0; ci.due=now+DAY;
    addMastery(i,-0.5);
  } else {
    ci.reps++;
    const mult=r===2?1.2:r===3?2.5:3.5;
    ci.iv=ci.iv===0?(r===4?3:1):Math.min(Math.round(ci.iv*mult),365);
    const adjustedIv=confidenceAdjustedInterval(i,ci.iv);
    ci.due=now+adjustedIv*DAY;
    const mDelta={2:0.25,3:0.5,4:0.75}[r]||0.5;
    addMastery(i,mDelta);
  }
  save();
}

/* ============ PROGRESSIVE LOCALIZATION ============ */
// English terms → Mandarin equivalents for staged prompt substitution in MC reverse mode.
// Multi-word phrases are sorted longest-first so they match before any of their substrings.
const TERM_ZH={
  'measure word':'量词','aspect marker':'体貌助词','question particle':'疑问助词',
  'possessive':'所有格','particle':'助词','marker':'标记词','complement':'补语',
  'classifier':'量词','modal':'情态','auxiliary':'助动词',
  'negation':'否定','negative':'否定','question':'疑问','interrogative':'疑问',
  'conjunction':'连词','preposition':'介词','pronoun':'代词',
  'adverb':'副词','verb':'动词','noun':'名词','adjective':'形容词',
  'numeral':'数词','exclamation':'感叹','interjection':'感叹词','plural':'复数',
  'perfective':'完成体','progressive':'进行体','durative':'持续体',
  'resultative':'结果补语','directional':'趋向补语',
};
const _termEntries=Object.entries(TERM_ZH).sort((a,b)=>b[0].length-a[0].length);

function substituteDefTerms(def){
  let s=def.toLowerCase();
  for(const[en,zh]of _termEntries) s=s.replace(new RegExp('\\b'+en+'\\b','g'),zh);
  // English portions uppercase; Chinese characters have no case — they pass through unchanged
  return s.toUpperCase();
}

/* ============ TTS ============ */
// Pre-cache voices at startup so speak() never stalls waiting for getVoices()
let _voices=[];
(function warmVoices(){
  const load=()=>{ const v=speechSynthesis.getVoices(); if(v.length){ _voices=v; renderTTSStatus(); } };
  load();
  speechSynthesis.addEventListener('voiceschanged',load);
})();

function renderTTSStatus(){
  const el=document.getElementById('ttsStatus');
  if(!el) return;
  const lang=(typeof activeCourse==='function'&&activeCourse())?activeCourse().langCode:'zh-CN';
  const prefix=lang.split('-')[0];
  const pool=_voices.length?_voices:speechSynthesis.getVoices();
  const matching=pool.filter(v=>v.lang.startsWith(prefix));
  if(!matching.length){
    el.textContent='⚠ TTS: NO VOICE INSTALLED';
    el.style.cssText='font-size:7px;text-align:center;letter-spacing:2px;padding:2px 0;color:hsl(0,70%,55%);cursor:pointer;opacity:1;';
    el.onclick=()=>alert('No Mandarin TTS voice found.\n\nFix: Windows Settings → Time & Language → Speech → Add voices → Chinese (Simplified, China)\n\nCheck "Text-to-speech" during installation.');
    return;
  }
  const offline=matching.find(v=>!v.name.includes('Online'));
  if(offline){
    const short=offline.name.replace(/Microsoft\s*/i,'').split(/\s/)[0].toUpperCase();
    el.textContent='TTS · LOCAL · '+short;
    el.style.cssText='font-size:7px;text-align:center;letter-spacing:2px;padding:2px 0;opacity:.4;cursor:default;';
    el.onclick=null;
  } else {
    el.textContent='⚠ TTS: ONLINE ONLY';
    el.style.cssText='font-size:7px;text-align:center;letter-spacing:2px;padding:2px 0;color:hsl(40,90%,55%);cursor:pointer;opacity:1;';
    el.onclick=()=>alert('Only cloud-based voices found — TTS will fail when opening the app as a local file.\n\nFix: Windows Settings → Time & Language → Speech → Add voices → Chinese (Simplified, China)\n\nInstall an offline voice pack for reliable local use.');
  }
}

// Singleton AudioContext — avoids per-call creation latency and browser instance limits.
let _audioCtx=null;
function getAudioCtx(){
  try{
    if(!_audioCtx||_audioCtx.state==='closed')
      _audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    if(_audioCtx.state==='suspended') _audioCtx.resume();
    return _audioCtx;
  }catch(e){ return null; }
}

// Called on study-button click (user gesture). Warms AudioContext and TTS voice.
// Uses a real character at near-zero volume so the engine actually loads the voice —
// a zero-width space may be optimised away without triggering voice initialisation.
function primeSpeechEngine(lang){
  if(!lang) return;
  try{ getAudioCtx(); }catch(e){}
  try{
    const pool=_voices.length?_voices:speechSynthesis.getVoices();
    const v=pool.find(x=>x.lang.startsWith(lang.split('-')[0]));
    if(!v) return;
    const u=new SpeechSynthesisUtterance('​');
    u.lang=lang; u.volume=0; u.rate=1; u.voice=v;
    speechSynthesis.speak(u);
  }catch(e){}
}

// Global generation counter — incremented on every speak() call.
// finish() and speakWithBlank callbacks check gen===_ttsGen before acting,
// so stale callbacks from superseded cards/sequences are silent no-ops.
let _ttsGen=0;

function speak(text,lang,onDone){
  if(!lang) lang=activeCourse?activeCourse().langCode:'zh-CN';
  if(S.sound==='mute'){ if(onDone) onDone(); return; }
  try{
    const gen=++_ttsGen;
    // Only cancel when something is actually queued — unconditional cancel
    // corrupts the Windows SAPI engine state even when the queue is empty.
    if(speechSynthesis.speaking||speechSynthesis.pending) speechSynthesis.cancel();
    // If the engine was left paused by a previous cancel(), un-pause it before
    // queueing the new utterance, otherwise the utterance plays in silence.
    if(speechSynthesis.paused) try{ speechSynthesis.resume(); }catch(e){}
    const u=new SpeechSynthesisUtterance(text);
    u.lang=lang; u.rate=.85;
    const pool=_voices.length?_voices:speechSynthesis.getVoices();
    const v=pool.find(w=>w.lang.startsWith(lang.split('-')[0]));
    if(v) u.voice=v;
    let fired=false;
    const finish=(cancelled)=>{
      if(fired||gen!==_ttsGen) return;
      fired=true;
      if(!cancelled&&onDone) onDone();
    };
    u.onend=()=>finish(false);
    u.onerror=()=>finish(true); // cancel/interrupt: do NOT advance chain
    if(onDone) setTimeout(()=>finish(false),5000); // safety net if onend never fires on Windows
    speechSynthesis.speak(u);
  }catch(e){ if(onDone) onDone(); }
}

// Pleasant two-tone bleep — perfect fifth A4+E5, sine waves, soft exponential decay.
// onDone fires at 300 ms (beep faded to near-silence) for tight before/after sequencing.
function beepBlank(onDone){
  if(S.sound==='mute'){ if(onDone) onDone(); return; }
  try{
    const ctx=getAudioCtx();
    if(!ctx){ if(onDone) setTimeout(onDone,300); return; }
    const t=ctx.currentTime;
    const g=ctx.createGain();
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(0.18,t+0.012);
    g.gain.exponentialRampToValueAtTime(0.001,t+0.38);
    [440,659].forEach(function(f){
      const o=ctx.createOscillator();
      o.type='sine'; o.frequency.value=f;
      o.connect(g); o.start(t); o.stop(t+0.38);
    });
    if(onDone) setTimeout(onDone,300);
  }catch(e){ if(onDone) onDone(); }
}
function speakFront(){ speak(D[cur][0],activeCourse().langCode); }
function speakBack(){ speak(D[cur][2],'en-US'); }

/* ============ QUEUE ============ */
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function buildQueue(){
  const now=Date.now();
  const due=[],fresh=[];
  const indices=activeDeckIndices();
  indices.forEach(i=>{
    if(!isUnlocked(i)) return; // batch not yet unlocked
    const c=S.cards[i];
    if(c&&c.seen){ if(c.due<=now) due.push(i); }
    else fresh.push(i);
  });
  if(S.ordered) return due.concat(fresh); // frequency order, no shuffle
  return shuffle(due).concat(shuffle(fresh));
}


/* ============ RADICAL INFO ============ */
const RADINFO={
  "白": ["bái", "white"],
  "戈": ["gē", "spear/halberd"],
  "亻": ["rén", "person", "人", "left-side form"],
  "日": ["rì", "sun/day"],
  "乙": ["yǐ", "second/bend"],
  "一": ["yī", "one/horizontal"],
  "女": ["nǚ", "woman"],
  "月": ["yuè", "moon/flesh"],
  "辶": ["chuò", "walk/movement", "辵", "enclosing form"],
  "阝": ["fù", "mound/city", "阜", "right-side form"],
  "人": ["rén", "person"],
  "木": ["mù", "tree/wood"],
  "厶": ["sī", "private/self"],
  "讠": ["yán", "speech/words", "言", "left-side form"],
  "西": ["xī", "west"],
  "尤": ["yóu", "especially"],
  "土": ["tǔ", "earth/soil"],
  "大": ["dà", "big/large"],
  "小": ["xiǎo", "small"],
  "丨": ["gǔn", "vertical stroke"],
  "囗": ["wéi", "enclosure"],
  "宀": ["mián", "roof/house"],
  "目": ["mù", "eye"],
  "心": ["xīn", "heart/mind"],
  "矢": ["shǐ", "arrow"],
  "干": ["gān", "dry/stem"],
  "口": ["kǒu", "mouth"],
  "水": ["shuǐ", "water"],
  "饣": ["shí", "food/eat", "食", "left-side form"],
  "艹": ["cǎo", "grass/plant", "艸", "top form"],
  "子": ["zǐ", "child/son"],
  "耂": ["lǎo", "old/elder", "老", "top form"],
  "爫": ["zhǎo", "claw/hand", "爪", "top form"],
  "工": ["gōng", "work/labor"],
  "钅": ["jīn", "metal", "金", "left-side form"],
  "乛": ["yǐ", "second/hook"],
  "十": ["shí", "ten/cross"],
  "夕": ["xī", "evening/dusk"],
  "彳": ["chì", "step/walk"],
  "氵": ["shuǐ", "water", "水", "left-side form"],
  "王": ["wáng", "king/jade"],
  "里": ["lǐ", "village/mile"],
  "刂": ["dāo", "knife/blade", "刀", "right-side form"],
  "走": ["zǒu", "walk/run"],
  "足": ["zú", "foot/enough"],
  "廾": ["gǒng", "two hands", "収", "bottom form"],
  "丷": ["bā", "eight/divide"],
  "门": ["mén", "gate/door"],
  "车": ["chē", "vehicle/cart"],
  "飞": ["fēi", "fly"],
  "火": ["huǒ", "fire"],
  "电": ["diàn", "electricity"],
  "手": ["shǒu", "hand"],
  "音": ["yīn", "sound/music"],
  "见": ["jiàn", "see/meet"],
  "户": ["hù", "household/door"],
  "冖": ["mì", "cover/cloth"],
  "丶": ["zhǔ", "dot/drop"],
  "寸": ["cùn", "inch/small"],
  "丁": ["dīng", "nail/4th heavenly stem"],
  "与": ["yǔ", "give/and"],
  "丕": ["pī", "great/large"],
  "丿": ["piě", "left-falling stroke"],
  "乍": ["zhà", "suddenly/first time"],
  "乞": ["qǐ", "beg/request"],
  "也": ["yě", "also/particle"],
  "买": ["mǎi", "buy"],
  "云": ["yún", "cloud/say"],
  "京": ["jīng", "capital city"],
  "兑": ["duì", "exchange/pleased"],
  "冂": ["jiōng", "down box/wide"],
  "冄": ["rǎn", "whiskers/fringe"],
  "几": ["jǐ", "how many/small table"],
  "勺": ["sháo", "spoon/ladle"],
  "包": ["bāo", "wrap/package"],
  "匕": ["bǐ", "spoon/dagger"],
  "卖": ["mài", "sell"],
  "卜": ["bǔ", "divination/predict"],
  "又": ["yòu", "again/right hand"],
  "友": ["yǒu", "friend"],
  "反": ["fǎn", "oppose/return"],
  "古": ["gǔ", "ancient/old"],
  "各": ["gè", "each/every"],
  "囟": ["xìn", "fontanelle/skull top"],
  "壴": ["zhù", "drum on stand"],
  "天": ["tiān", "sky/heaven/day"],
  "头": ["tóu", "head/top"],
  "尔": ["ěr", "you/thus"],
  "巾": ["jīn", "cloth/kerchief"],
  "幺": ["yāo", "tiny/one"],
  "戋": ["jiān", "small/narrow"],
  "才": ["cái", "talent/just now"],
  "攴": ["pū", "tap/rap lightly"],
  "文": ["wén", "writing/culture/pattern"],
  "斤": ["jīn", "axe/catty (weight)"],
  "旦": ["dàn", "dawn/day"],
  "昔": ["xī", "formerly/past"],
  "曰": ["yuē", "say/speak"],
  "曷": ["hé", "why/when"],
  "欠": ["qiàn", "owe/yawn"],
  "止": ["zhǐ", "stop/foot"],
  "殳": ["shū", "weapon/lance"],
  "爪": ["zhǎo", "claw/talon"],
  "爻": ["yáo", "line in trigram"],
  "玉": ["yù", "jade"],
  "生": ["shēng", "life/birth/grow"],
  "田": ["tián", "field/farm"],
  "疋": ["pǐ", "bolt of cloth/foot"],
  "相": ["xiāng", "mutual/appearance"],
  "禾": ["hé", "grain/rice plant"],
  "米": ["mǐ", "rice/meter"],
  "者": ["zhě", "one who/person"],
  "舌": ["shé", "tongue"],
  "艮": ["gèn", "stubborn/one of 8 trigrams"],
  "豕": ["shǐ", "pig/boar"],
  "隹": ["zhuī", "short-tailed bird"],
  "首": ["shǒu", "head/first/neck"],
};
/* ============ UI ============ */
const $=id=>document.getElementById(id);
let queue=[],cur=-1,flipped=false,combo=0;
let activeCardIdx=-1; // always tracks current card regardless of modality

function renderHome(){
  applyBilingualUI();
  // Always destroy fatigue overlay on home screen
  const overlay=document.getElementById('fatigueOverlay');
  if(overlay) overlay.remove();
  const g=$('grid'); g.innerHTML='';
  const fg=hsl(bgHue+GA,80,24);
  const stCol=[ 'transparent', hsl(bgHue,60,30), hsl(bgHue,60,20), hsl(bgHue,60,12) ];
  const fr=frontier();
  for(let i=0;i<100;i++){
    const c=document.createElement('div');
    c.className='cell';
    const locked=i>=fr;
    c.style.borderColor=locked?'transparent':fg;
    c.style.backgroundColor=locked?'rgba(0,0,0,0.15)':stCol[state(i)];
    c.style.opacity=locked?'0.3':'1';
    g.appendChild(c);
  }
  ['sw0','sw1','sw2','sw3'].forEach((id,k)=>{$(id).style.backgroundColor=stCol[k];});
  const lvl=Math.floor(S.xp/100)+1;
  $('lvl').textContent=lvl; $('xp').textContent=S.xp;
  $('streak').textContent=S.streak;
  const mDisp=document.getElementById('multDisplay');
  if(mDisp) mDisp.textContent=getMult()+'x ⚡'+(getMultStreak()||'');
  // Unique cards counter
  const uniq=(S.uniqueSeen||[]).length;
  const uniqEl=document.getElementById('uniqueCount');
  if(uniqEl) uniqEl.textContent=uniq;

  // Mastery breakdown: count words at each mastery band
  const mBands=[0,0,0,0]; // unseen, learning(0-1), familiar(1-3), mastered(3+)
  D.forEach((_,i)=>{
    const m=masteryScore(i);
    const seen=(S.cards[i]&&S.cards[i].seen);
    if(!seen) mBands[0]++;
    else if(m<1) mBands[1]++;
    else if(m<3) mBands[2]++;
    else mBands[3]++;
  });
  const mbEl=document.getElementById('masteryBreakdown');
  if(mbEl) mbEl.textContent=mBands[0]+'·'+mBands[1]+'·'+mBands[2]+'·'+mBands[3];
  // Add tooltip hint to mastery breakdown
  if(mbEl) mbEl.title='UNSEEN · LEARNING · FAMILIAR · MASTERED';
  const dueN=buildQueue().filter(i=>{const c=S.cards[i];return c&&c.seen;}).length;
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

function computeXP(isCorrect, wagerIdx, responseMs){
  const base=MULT_BASE_XP;
  if(!isCorrect) return 0;
  const mult=MULT_STEPS[wagerIdx];
  const speedBonus=responseMs<1500?1.3:responseMs<4000?1.0:0.8;
  return Math.round(base*mult*speedBonus);
}

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

  defaultMultIdx=Math.max(0,naturalMultIdx());
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
    multLabel.textContent=MULT_STEPS[currentMultIdx]+'x';
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
    // Advance stage if gate met
    if(ci.axisCorrect[axis]>=axisGate(axis, ci.axisStage[axis]||0)){
      const maxStage=AXIS_MAX[axis];
      if(ci.axisStage[axis]<maxStage){
        ci.axisStage[axis]++;
        ci.axisCorrect[axis]=0; // reset streak for next stage
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
  try {
  if(studyFlashOnly) return 'flash';
  if(studyModalityFilter==='mc'){
    const mstg=getAxisStage(i,'meaning');
    if(mstg>=3&&clozeUnlocked(i)) return Math.random()<0.5?'cloze':'mc-rev';
    return (card(i).exp||0)>0?'mc-fwd':'flash';
  }
  if(studyModalityFilter==='tone') return (card(i).exp||0)>0?'tone':'flash';
  if(studyModalityFilter==='pos'){
    const ps=Math.max(1,getAxisStage(i,'pos'));
    return 'pos-s'+Math.min(ps,3);
  }
  const exp=card(i).exp||0;
  // First-time exposure: always flash card, no exceptions.
  // exp is set to 1 inside showStudyFlash after the card is shown.
  // Subsequent encounters route to MC and other challenge modalities.
  if(exp===0) return 'flash';

  // Check if convergence question is ready
  if(convergenceUnlocked(i)&&isCardDue(i)){
    const overdue=mostOverdueAxis(i);
    if(overdue==='pos') return 'convergence';
  }

  // Meaning axis modality — first MC fires regardless of due date
  // Subsequent MCs respect SRS schedule
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
    const catDef=CAT_DEFS[catName]||posInfo?.def||'a grammatical function word';
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
    addMastery(i,-0.1);
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
      logAnswer(i,isCorrect);
      const posSpeedMult=posRespMs<1500?1.3:posRespMs<4000?1.0:posRespMs<8000?0.8:0.6;
      const posWagerMult=Math.max(0.5,Math.min(1.5,currentMultIdx/Math.max(1,defaultMultIdx)));
      if(isCorrect){ 
        advanceMult();
        S.xp+=Math.round(computeXP(true,currentMultIdx,posRespMs)*fatigueXPMultiplier());
        addMastery(i,0.4*posSpeedMult);
      }
      else {
        resetMult();
        addMastery(i,-0.2*posWagerMult);
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
    script:'CJK',
    lexicon:null, // set to D after D is defined
    storageKey:'earworm-mandarin-v1',
  }
};
let ACTIVE_COURSE_KEY='mandarin';
function activeCourse(){ return COURSES[ACTIVE_COURSE_KEY]; }
function activeLexicon(){ return D; } // D is always the active lexicon for now

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
  recognition:    [0,    4,   12,  48,  168],  // hours
  categorization: [0,    4,   12,  48,  168],
  discrimination: [0,    8,   24,  96       ],
  application:    [0,    8,   24,  96,  336 ],
  tl_integration: [0,    12,  48,  168, 504 ],
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
function isAxisDue(cat, axis){ return gDue(cat,axis)<=Date.now(); }

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
  const now=Date.now();
  const HOUR=3600000;

  ax.history.push(isCorrect?1:0);
  if(ax.history.length>30) ax.history.shift();

  const stage=ax.stage||0;
  const maxStage=AXIS_MAX_STAGES[axis]||3;
  const intervals=AXIS_INTERVALS[axis]||[0,8,24,96,168];

  if(!isCorrect){
    ax.reps=0;
    ax.due=now+Math.max(intervals[0]||4,1)*HOUR*0.5;
  } else {
    ax.reps=(ax.reps||0)+1;
    // Accuracy window for advancement
    const wagerBonus=(currentMultIdx>defaultMultIdx)?1:0;
    const windowSize=Math.max(1,(stage===0?2:3)-wagerBonus);
    const recent=ax.history.slice(-windowSize);
    const acc=recent.reduce((s,v)=>s+v,0)/Math.max(1,recent.length);
    const threshold=stage===0?1.0:0.8;
    const shouldAdvance=recent.length>=windowSize&&acc>=threshold&&stage<maxStage;

    const speedMult=responseMs<1500?1.3:responseMs<4000?1.0:0.8;
    if(shouldAdvance){
      ax.stage=stage+1;
      ax.reps=0;
      ax.due=now+(intervals[Math.min(stage+1,intervals.length-1)]||48)*HOUR;
    } else {
      ax.due=now+Math.round((intervals[Math.min(stage,intervals.length-1)]||8)*HOUR*speedMult);
    }
  }
  save();
}

// Which sub-axis is most overdue for a category?
function mostOverdueAxis_G(cat){
  const now=Date.now();
  let worst=null; let worstOverdue=-Infinity;
  GRAMMAR_AXES.forEach(axis=>{
    if(!isAxisDue(cat,axis)) return; // not due yet
    const overdue=now-gDue(cat,axis);
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
  const now=Date.now();
  const drills=[];
  GRAMMAR_CATS.forEach(function(cat){
    GRAMMAR_AXES.forEach(function(axis){
      if(!isAxisDue(cat,axis)) return;
      if(sessionGrammarAnswered.has(cat+':'+axis)) return;
      // Only drill if vocabulary evidence is sufficient
      if(!grammarAxisUnlocked(cat,axis)) return;
      drills.push({cat,axis,overdue:now-gDue(cat,axis)});
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
      save();
      armTapAdvance($('studyPOS'),()=>nextStudyCard(),0);
    }

  }catch(err){
    // API failed — fall back to template
    $('studyPOSChar').style.cssText=CJKf+';font-size:14px;color:'+fg+';line-height:1.8;';
    $('studyPOSChar').textContent=content.s5.template;
    recordGrammarResult(cat,true,3000);
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
  activeCardIdx=-1;
  rollBg();
  const fg=getComputedStyle(document.body).color;
  const stage=gStage(cat,axis);
  const content=GRAMMAR_CONTENT[cat];
  if(!content){ recordAxisResultG(cat,axis,true,100); nextStudyCard(); return; }

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
    if(!tlpairs.length){ recordAxisResultG(cat,axis,true,100); nextStudyCard(); return; }
    if(stage<=1){
      var tlp=tlpairs[Math.floor(Math.random()*tlpairs.length)];
      var CJKf3="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
      prompt=tlp.zh;
      correctChoice=tlp.en.toUpperCase();
      var tlOthers=tlpairs.filter(function(p){return p.zh!==tlp.zh;}).map(function(p){return p.en.toUpperCase();});
      var choicePool=[tlp.en.toUpperCase(),...tlOthers].filter(function(v,i,a){return a.indexOf(v)===i;});
      // Pad to 4 with cross-category EN terms so choice count is always even
      if(choicePool.length<4){
        GRAMMAR_CATS.forEach(function(c){
          var cPairs=(GRAMMAR_CONTENT[c]&&GRAMMAR_CONTENT[c].s4&&GRAMMAR_CONTENT[c].s4.pairs)||[];
          cPairs.forEach(function(p){
            if(choicePool.length>=4) return;
            var en=p.en.toUpperCase();
            if(!choicePool.includes(en)) choicePool.push(en);
          });
        });
      }
      choices=shuffle(choicePool.slice(0,4));
      if(choices.indexOf(correctChoice)<0) choices[choices.length-1]=correctChoice;
      choices=shuffle(choices);
      $('studyPOSChar').style.cssText=CJKf3+';font-size:28px;color:'+fg+';text-align:center;';
      $('studyPOSChar').textContent=prompt;
      if(pyEl) pyEl.innerHTML='<span style="font-size:9px;opacity:.7;letter-spacing:1px;font-family:inherit;">'+tlp.py+'</span><br><span style="font-size:7px;opacity:.5;letter-spacing:1px;">WHICH ENGLISH TERM MATCHES?</span>';
      prompt='__CJK_HANDLED__';
    } else if(stage===2){
      var tlp2=tlpairs[Math.floor(Math.random()*tlpairs.length)];
      prompt=tlp2.en.toUpperCase()+' \u2014 '+tlp2.ex;
      correctChoice=tlp2.zh;
      var tlOthers2=tlpairs.filter(function(p){return p.zh!==tlp2.zh;}).map(function(p){return p.zh;});
      var tlExtra=Object.values(POS_ZH).filter(function(z){return !tlpairs.map(function(p){return p.zh;}).includes(z);}).slice(0,2);
      choices=shuffle([tlp2.zh,...tlOthers2,...tlExtra].filter(function(v,i,a){return a.indexOf(v)===i;})).slice(0,4);
      if(choices.indexOf(correctChoice)<0) choices[choices.length-1]=correctChoice;
      choices=shuffle(choices);
      if(pyEl) pyEl.innerHTML='<span style="font-size:7px;opacity:.6;letter-spacing:1px;">WHICH MANDARIN TERM?</span>';
    } else {
      showGrammarStage5(cat, fg);
      return;
    }
  }

  if(!correctChoice){ recordAxisResultG(cat,axis,true,100); nextStudyCard(); return; }

  if(prompt!=='__CJK_HANDLED__'){
    $('studyPOSChar').style.cssText='font-size:11px;font-family:inherit;color:'+fg+';line-height:1.5;text-align:left;';
    $('studyPOSChar').textContent=prompt;
  }

  var box=$('studyPOSChoices'); box.innerHTML='';
  var choiceFont=(axis==='tl_integration'&&stage<=1)?"font-family:'PingFang SC','Heiti SC',sans-serif;font-size:18px;":"font-size:8px;";
  box.style.gridTemplateColumns=choices.length<=4?'1fr 1fr':'1fr 1fr 1fr';
  var locked=false;

  choices.forEach(function(ch){
    var b=document.createElement('button');
    b.className='choice';
    b.style.cssText=choiceFont+'border-color:'+fg+';color:'+fg+';padding:10px 6px;line-height:1.5;text-align:center;';
    b.textContent=ch;
    b.onclick=function(){
      if(locked) return; locked=true;
      var isCorrect=ch===correctChoice;
      var respMs=Date.now()-cardShownAtMC;
      document.querySelectorAll('#studyPOSChoices .choice').forEach(function(tb){
        if(tb.textContent===correctChoice) tb.classList.add('correct');
        else if(tb===b&&!isCorrect) tb.classList.add('wrong');
        tb.style.pointerEvents='none';
      });
      recordChallengeResult(-1,'grammar:'+cat+':'+axis,isCorrect,respMs);
      recordAxisResultG(cat,axis,isCorrect,respMs);
      recordGrammarAttempt(cat.toLowerCase(),isCorrect);
      if(isCorrect){
        advanceMult();
        S.xp+=Math.round(computeXP(true,currentMultIdx,respMs)*fatigueXPMultiplier());
        sessionGrammarAnswered.add(cat+':'+axis);
      } else {
        resetMult();
      }
      save();
      armTapAdvance($('studyPOS'),function(){nextStudyCard();},isCorrect?0:1200);
    };
    box.appendChild(b);
  });

  studyDontKnowAction=function(){
    recordAxisResultG(cat,axis,false,Date.now()-cardShownAtMC);
    armTapAdvance($('studyPOS'),function(){nextStudyCard();},1200);
  };
  renderWagerControl('studyPOSWager',-1);

  show('study');
  $('studySession').style.display='none';
  $('studyMC').style.display='none';
  $('studyTone').style.display='none';
  if($('studyPOS')) $('studyPOS').style.display='flex';
  if($('studyColl')) $('studyColl').style.display='none';
}



/* ============ EXAMPLE SENTENCES ============ */
// Keyed by character. Each sentence: [mandarin, pinyin, english_gloss]
// Used for cloze questions and word order drills.
// Sentences use high-frequency vocabulary where possible.
const EXAMPLE_SENTENCES={
  "的":[["我的书在哪里？","wǒ de shū zài nǎlǐ?","Where is my book?"],["这是我的。","zhè shì wǒ de.","This is mine."],["好的人很多。","hǎo de rén hěn duō.","There are many good people."]],
  "我":[["我是学生。","wǒ shì xuésheng.","I am a student."],["我不知道。","wǒ bù zhīdào.","I don't know."],["我很好。","wǒ hěn hǎo.","I am fine."]],
  "你":[["你好！","nǐ hǎo!","Hello!"],["你是谁？","nǐ shì shéi?","Who are you?"],["你去哪里？","nǐ qù nǎlǐ?","Where are you going?"]],
  "是":[["他是老师。","tā shì lǎoshī.","He is a teacher."],["这是什么？","zhè shì shénme?","What is this?"],["我是中国人。","wǒ shì zhōngguórén.","I am Chinese."]],
  "了":[["我吃了。","wǒ chī le.","I ate."],["他走了。","tā zǒu le.","He left."],["她来了。","tā lái le.","She came."]],
  "不":[["我不去。","wǒ bù qù.","I'm not going."],["他不是学生。","tā bù shì xuésheng.","He is not a student."],["不好。","bù hǎo.","Not good."]],
  "他":[["他很好。","tā hěn hǎo.","He is very good."],["他走了。","tā zǒu le.","He left."],["他是我的朋友。","tā shì wǒ de péngyou.","He is my friend."]],
  "她":[["她很好。","tā hěn hǎo.","She is very good."],["她不来。","tā bù lái.","She is not coming."],["她不来了。","tā bù lái le.","She's not coming anymore."]],
  "们":[["我们去吃饭。","wǒmen qù chīfàn.","Let's go eat."],["他们是朋友。","tāmen shì péngyou.","They are friends."],["你们好！","nǐmen hǎo!","Hello everyone!"]],
  "在":[["他在家。","tā zài jiā.","He is at home."],["书在这里。","shū zài zhèlǐ.","The book is here."],["我在看书。","wǒ zài kàn shū.","I am reading."]],
  "有":[["我有书。","wǒ yǒu shū.","I have a book."],["这里有很多人。","zhèlǐ yǒu hěn duō rén.","There are many people here."],["他有钱。","tā yǒu qián.","He has money."]],
  "这":[["这是什么？","zhè shì shénme?","What is this?"],["这个很好。","zhège hěn hǎo.","This one is good."],["我要这个。","wǒ yào zhège.","I want this one."]],
  "一":[["一个人。","yīgè rén.","One person."],["一起去。","yīqǐ qù.","Go together."],["一点儿。","yīdiǎnr.","A little bit."]],
  "说":[["他说了。","tā shuō le.","He spoke."],["你说什么？","nǐ shuō shénme?","What did you say?"],["她说很多。","tā shuō hěn duō.","She says a lot."]],
  "没":[["我没有钱。","wǒ méiyǒu qián.","I have no money."],["他没来。","tā méi lái.","He didn't come."],["没问题。","méi wèntí.","No problem."]],
  "那":[["那是什么？","nà shì shénme?","What is that?"],["那个人是谁？","nàgè rén shì shéi?","Who is that person?"],["那很好。","nà hěn hǎo.","That is good."]],
  "来":[["他来了。","tā lái le.","He came."],["你来这里。","nǐ lái zhèlǐ.","Come here."],["我来看你。","wǒ lái kàn nǐ.","I'll come see you."]],
  "好":[["你好！","nǐ hǎo!","Hello!"],["很好。","hěn hǎo.","Very good."],["好的。","hǎo de.","Okay."]],
  "到":[["他到了。","tā dào le.","He arrived."],["我到家了。","wǒ dào jiā le.","I arrived home."],["到哪里去？","dào nǎlǐ qù?","Where are you going?"]],
  "要":[["我要水。","wǒ yào shuǐ.","I want water."],["你要什么？","nǐ yào shénme?","What do you want?"],["我要去。","wǒ yào qù.","I want to go."]],
  "都":[["我们都去。","wǒmen dōu qù.","We are all going."],["他们都是学生。","tāmen dōu shì xuésheng.","They are all students."],["都好。","dōu hǎo.","All good."]],
  "和":[["我和你。","wǒ hé nǐ.","You and I."],["茶和水。","chá hé shuǐ.","Tea and water."],["他和她是朋友。","tā hé tā shì péngyou.","He and she are friends."]],
  "也":[["我也去。","wǒ yě qù.","I'm going too."],["他也是学生。","tā yě shì xuésheng.","He is also a student."],["也好。","yě hǎo.","That works too."]],
  "人":[["这个人是谁？","zhège rén shì shéi?","Who is this person?"],["很多人来了。","hěn duō rén lái le.","Many people came."],["中国人。","zhōngguórén.","Chinese person."]],
  "什么":[["这是什么？","zhè shì shénme?","What is this?"],["你要什么？","nǐ yào shénme?","What do you want?"],["他说什么？","tā shuō shénme?","What did he say?"]],
  "会":[["我会说。","wǒ huì shuō.","I can speak."],["他不会来。","tā bù huì lái.","He won't come."],["你会吗？","nǐ huì ma?","Can you?"]],
  "去":[["我去了。","wǒ qù le.","I went."],["他去看书了。","tā qù kàn shū le.","He went to read."],["你去哪里？","nǐ qù nǎlǐ?","Where are you going?"]],
  "可以":[["我可以来。","wǒ kěyǐ lái.","I can come."],["可以吗？","kěyǐ ma?","Is it okay?"],["不可以。","bù kěyǐ.","Not allowed."]],
  "很":[["他很好。","tā hěn hǎo.","He is very good."],["很多人。","hěn duō rén.","Many people."],["很多书。","hěn duō shū.","Many books."]],
  "知道":[["我知道。","wǒ zhīdào.","I know."],["你知道吗？","nǐ zhīdào ma?","Do you know?"],["我不知道。","wǒ bù zhīdào.","I don't know."]],
  "吗":[["你好吗？","nǐ hǎo ma?","How are you?"],["他来吗？","tā lái ma?","Is he coming?"],["是吗？","shì ma?","Really?"]],
  "上":[["他走上来了。","tā zǒu shàng lái le.","He came up."],["他上来了。","tā shàng lái le.","He came up."]],
  "时候":[["什么时候？","shénme shíhou?","When?"],["那时候。","nà shíhou.","At that time."]],
  "能":[["我能来。","wǒ néng lái.","I can come."],["你能来吗？","nǐ néng lái ma?","Can you come?"],["他不能来。","tā bù néng lái.","He cannot come."]],
  "就":[["我就来。","wǒ jiù lái.","I'll be right there."],["就是这个。","jiù shì zhège.","It is exactly this."]],
  "对":[["对。","duì.","Correct."],["你说对了。","nǐ shuō duì le.","You said it right."],["对了。","duì le.","That's right."]],
  "自己":[["我自己来。","wǒ zìjǐ lái.","I'll come myself."],["他自己知道。","tā zìjǐ zhīdào.","He knows himself."]],
  "里":[["家里。","jiā lǐ.","Inside the home."],["这里有什么？","zhèlǐ yǒu shénme?","What is here?"],["他在这里。","tā zài zhèlǐ.","He is here."]],
  "就":[["他就是老师。","tā jiù shì lǎoshī.","He is indeed a teacher."]],
  "后":[["以后。","yǐhòu.","Afterwards / in the future."],["他后来来了。","tā hòulái lái le.","He came later."]],
  "还":[["还好。","hái hǎo.","Still okay."],["他还在。","tā hái zài.","He is still here."],["还有。","hái yǒu.","There is more."]],
  "只":[["只有我。","zhǐ yǒu wǒ.","Only me."],["只是。","zhǐ shì.","It's just that."]],
  "大":[["大学。","dàxué.","University."],["很大。","hěn dà.","Very big."],["大家好！","dàjiā hǎo!","Hello everyone!"]],
};


/* ============ CLOZE MODALITY ============ */
// Fill-in-the-blank: sentence shown with target word removed.
// User selects from 4 choices. Tests meaning in grammatical context.
// Harder than MC forward — context dependency means choices can be similar words.
// Unlocks at meaning axis stage >= 2.

function clozeUnlocked(i){
  return getAxisStage(i,'meaning')>=2 && (EXAMPLE_SENTENCES[D[i][0]]||[]).length>0;
}

function speakWithBlank(zh,ch,langCode){
  const idx=zh.indexOf(ch);
  if(idx<0){ speak(zh,langCode); return; }
  const before=zh.slice(0,idx);
  const after=zh.slice(idx+ch.length);
  if(!before&&!after){ speak(zh,langCode); return; }

  if(!before){
    // Blank at start: cancel stale speech, bump gen so any deferred speak() aborts,
    // then beep → speak suffix.
    try{ speechSynthesis.cancel(); }catch(e){}
    ++_ttsGen;
    const myGen=_ttsGen;
    beepBlank(function(){ if(_ttsGen===myGen) speak(after,langCode); });
    return;
  }
  if(!after){
    // Blank at end: speak prefix → beep (no further chain).
    speak(before,langCode,function(){ beepBlank(); });
    return;
  }
  // Blank in middle: speak prefix → beep → speak suffix.
  // expectedGen is the gen that speak(before) is about to claim (++_ttsGen).
  // fireBeep is guarded by both the beeped flag (prevents double-fire) and the
  // gen check (prevents firing if a newer card has taken over).
  // Backstop timer fires if onend is unreliable on Windows for short syllables.
  const expectedGen=_ttsGen+1;
  const cjk=(before.match(/[一-鿿㐀-䶿]/g)||[]).length;
  let beeped=false;
  const fireBeep=function(){
    if(beeped||_ttsGen!==expectedGen) return;
    beeped=true;
    beepBlank(function(){ if(_ttsGen===expectedGen) speak(after,langCode); });
  };
  speak(before,langCode,fireBeep);
  setTimeout(fireBeep,400+cjk*500);
}

function showStudyCloze(i){
  const [ch,syls,def,,pos]=D[i];
  const sents=EXAMPLE_SENTENCES[ch]||[];
  if(!sents.length){ nextStudyCard(); return; }

  activeCardIdx=i;
  rollBg();
  const fg=getComputedStyle(document.body).color;
  const CJKf="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";

  // Pick a sentence — only use sentences where every multi-char D[] word is already introduced
  const validSents=sents.filter(function(s){ return sentenceAllIntroduced(s[0]); });
  if(!validSents.length){ nextStudyCard(); return; }
  const sent=validSents[Math.floor(Math.random()*validSents.length)];
  const [zh,py,en]=sent;

  // Fire TTS before DOM build so audio arrives with the visual
  if(S.sound!=='mute'){
    const stg=getAxisStage(i,'meaning');
    if(stg<3){ speak(zh,activeCourse().langCode); }
    else { speakWithBlank(zh,ch,activeCourse().langCode); }
  }

  // Create cloze: replace target word with blank
  const blank='___';
  const clozeZH=zh.replace(ch,blank);

  $('studyMode').textContent='CLOZE · FILL THE BLANK';
  cardShownAtMC=Date.now();

  // Stage-based target: 2 choices at stage 2, 4 at stage 3+
  const clozeStg=getAxisStage(i,'meaning');
  const targetChoices=clozeStg>=3?4:2;
  // Pick distractors ranked by utility (POS match, frequency proximity, shared radical)
  let distractors=pickCharDistractors(i,targetChoices-1);
  // Enforce even total: distractors count must be odd (1→total 2, 3→total 4)
  if(distractors.length%2===0) distractors=distractors.slice(0,distractors.length-1);
  if(!distractors.length){ nextStudyCard(); return; }
  const choices=shuffle([ch,...distractors]);

  // Render into study panel — reuse MC panel
  show('study');
  $('studySession').style.display='none';
  $('studyMC').style.display='flex';
  $('studyTone').style.display='none';
  if($('studyPOS')) $('studyPOS').style.display='none';
  if($('studyColl')) $('studyColl').style.display='none';

  // Rank
  $('studyMCRank').textContent=cardRankStr(i);
  $('studyMCModality').textContent='CLOZE \u00b7 FILL THE BLANK';

  // Sentence with blank — phi-units (char above, pinyin below) per character
  const promptEl=$('studyMCPromptText');
  promptEl.innerHTML='';

  const sentRow=document.createElement('div');
  sentRow.style.cssText='display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;gap:4px;margin-bottom:8px;';

  const blankStart=zh.indexOf(ch);
  const isCJKChar=function(c){return /[一-鿿㐀-䶿]/.test(c);};
  let ci=0;
  while(ci<zh.length){
    const c=zh[ci];
    if(blankStart>=0&&ci===blankStart){
      const bUnit=document.createElement('div');
      bUnit.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;';
      const bChar=document.createElement('span');
      bChar.innerHTML='&nbsp;';
      bChar.style.cssText='font-size:28px;line-height:1;display:inline-block;min-width:'+(ch.length*1.1)+'em;border-bottom:3px solid '+fg+';text-align:center;';
      bUnit.appendChild(bChar);
      const bPy=document.createElement('span');
      bPy.style.cssText='font-size:9px;height:12px;display:block;';
      bUnit.appendChild(bPy);
      sentRow.appendChild(bUnit);
      ci+=ch.length;
      continue;
    }
    if(isCJKChar(c)){
      const syl=charSyl(c);
      const unit=document.createElement('div');
      unit.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;';
      const cSpan=document.createElement('span');
      cSpan.textContent=c;
      cSpan.style.cssText='font-size:28px;line-height:1;'+CJKf;
      unit.appendChild(cSpan);
      if(syl){
        const pSpan=document.createElement('span');
        pSpan.textContent=syl[0];
        pSpan.style.cssText='font-size:9px;font-family:\'Noto Sans\',Arial,sans-serif;';
        pSpan.style.color=toneColor(syl[1],fg);
        unit.appendChild(pSpan);
      }
      sentRow.appendChild(unit);
    } else {
      const plain=document.createElement('span');
      plain.textContent=c;
      plain.style.cssText='font-size:28px;line-height:1;align-self:flex-start;opacity:.5;';
      sentRow.appendChild(plain);
    }
    ci++;
  }
  promptEl.appendChild(sentRow);
  const glossDiv=document.createElement('div');
  glossDiv.style.cssText='font-size:10px;opacity:.6;text-align:center;font-style:italic;';
  glossDiv.textContent=en;
  promptEl.appendChild(glossDiv);

  $('studyMCPinyin').innerHTML='';

  // Choices — CJK characters
  const box=$('studyMCChoices');
  box.innerHTML='';
  box.style.gridTemplateColumns='1fr 1fr';
  let locked=false;

  // Tap prompt area to repeat TTS before answering
  $('studyMCPrompt').style.cursor='pointer';
  $('studyMCPrompt').onclick=function(e){
    if(locked||S.sound==='mute') return;
    const stg=getAxisStage(i,'meaning');
    if(stg<3){ speak(zh,activeCourse().langCode); }
    else { speakWithBlank(zh,ch,activeCourse().langCode); }
    e.stopPropagation();
  };

  choices.forEach(function(opt){
    const b=document.createElement('button');
    b.className='choice';
    // Phi-unit: character above, pinyin below
    b.style.cssText='border-color:'+fg+';color:'+fg+
      ';display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:10px 6px;';
    const charSpan=document.createElement('span');
    charSpan.textContent=opt;
    charSpan.style.cssText='font-size:36px;line-height:1;'+CJKf;
    b.appendChild(charSpan);
    const optIdx=D.findIndex(function(d){return d[0]===opt;});
    if(optIdx>=0&&D[optIdx][1].length){
      const pyWrap=document.createElement('span');
      pyWrap.style.cssText='font-size:9px;display:flex;gap:2px;font-family:\'Noto Sans\',Arial,sans-serif;';
      D[optIdx][1].forEach(function([s,t]){
        const sEl=document.createElement('span'); sEl.textContent=s; sEl.style.color=toneColor(t,fg);
        pyWrap.appendChild(sEl);
      });
      b.appendChild(pyWrap);
    }
    b.onclick=function(){
      if(locked) return; locked=true;
      const isCorrect=opt===ch;
      const respMs=Date.now()-cardShownAtMC;
      document.querySelectorAll('#studyMCChoices .choice').forEach(function(tb){
        if(tb.textContent===ch) tb.classList.add('correct');
        else if(tb===b&&!isCorrect) tb.classList.add('wrong');
        tb.style.pointerEvents='none';
      });
      recordChallengeResult(i,'cloze',isCorrect,respMs);
      recordAxisResultNew(i,'meaning',isCorrect,respMs);
      recordWagerDecision(i,isCorrect,currentMultIdx,defaultMultIdx,respMs);
      logAnswer(i,isCorrect);
      const speedM=respMs<1500?1.3:respMs<4000?1.0:0.8;
      if(isCorrect){
        advanceMult();
        S.xp+=Math.round(computeXP(true,currentMultIdx,respMs)*fatigueXPMultiplier());
        addMastery(i,0.5*speedM); // cloze is harder — more mastery gain
      } else {
        resetMult();
        addMastery(i,-0.3);
        studyPending.push({idx:i,mod:'cloze'});
      }
      save();
      if(S.sound!=='mute') speak(zh,activeCourse().langCode);
      // Make char tappable to open dictionary
      promptEl.style.cursor='pointer';
      promptEl.onclick=function(e){ e.stopPropagation(); openCharDetail(ch,0,i); };
      armTapAdvance($('studyMC'),function(){nextStudyCard();},isCorrect?0:1200);
    };
    box.appendChild(b);
  });

  renderChallengeRings(i,'cloze',$('studyMCPrompt'));
  studyDontKnowAction=function(){
    if(locked) return; locked=true;
    recordAxisResultNew(i,'meaning',false,Date.now()-cardShownAtMC);
    addMastery(i,-0.3);
    studyPending.push({idx:i,mod:'cloze'});
    armTapAdvance($('studyMC'),function(){nextStudyCard();},1200);
  };
  renderWagerControl('studyMCActions',i);
}

/* ============ WORD ORDER MODALITY ============ */
// Given 3-4 shuffled words, tap them in correct Mandarin order.
// Bridges from receptive to productive — requires applying grammar knowledge.
// Unlocks when: meaning stage >= 2, grammar categorization stage >= 1 for all words.

function wordOrderUnlocked(i){
  if(getAxisStage(i,'meaning')<2) return false;
  // Need at least 2 other introduced words for a meaningful arrangement
  const introduced=D.filter(function(_,idx){return S.cards[idx]&&S.cards[idx].exp>0;});
  return introduced.length>=4;
}

function showWordOrderDrill(i){
  const [ch,syls,def,,pos]=D[i];
  // Find a sentence containing this word
  const sents=EXAMPLE_SENTENCES[ch]||[];
  if(!sents.length){ nextStudyCard(); return; }
  // Only use sentences where every multi-char D[] word is already introduced
  const validSentsWO=sents.filter(function(s){ return sentenceAllIntroduced(s[0]); });
  if(!validSentsWO.length){ nextStudyCard(); return; }
  const sent=validSentsWO[Math.floor(Math.random()*validSentsWO.length)];
  const [zh,py,en]=sent;

  // Extract words — split on common boundaries
  // Simple tokenizer: split on punctuation, keep CJK chars grouped by known words
  const introduced=D.filter(function(_,idx){return S.cards[idx]&&S.cards[idx].exp>0;}).map(function(d){return d[0];});
  // Find 3-4 known words that appear in this sentence
  const wordsInSent=introduced.filter(function(w){return zh.includes(w)&&w.length>0;});
  if(wordsInSent.length<3){ nextStudyCard(); return; }
  // Take up to 4 words, ensure target word is included
  let drillWords=[ch,...wordsInSent.filter(function(w){return w!==ch;}).slice(0,3)];
  if(drillWords.length<3){ nextStudyCard(); return; }
  drillWords=drillWords.slice(0,4);

  // Correct order: words as they appear in zh
  const correctOrder=drillWords.slice().sort(function(a,b){
    return zh.indexOf(a)-zh.indexOf(b);
  });
  const shuffledWords=shuffle(drillWords.slice());

  activeCardIdx=i;
  rollBg();
  const fg=getComputedStyle(document.body).color;
  const CJKf="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";

  $('studyMode').textContent='WORD ORDER';
  cardShownAtMC=Date.now();

  show('study');
  $('studySession').style.display='none';
  $('studyMC').style.display='flex';
  $('studyTone').style.display='none';
  if($('studyPOS')) $('studyPOS').style.display='none';

  $('studyMCRank').textContent=cardRankStr(i);
  $('studyMCModality').textContent='WORD ORDER \u00b7 ARRANGE';

  // Show English prompt
  const promptEl=$('studyMCPromptText');
  promptEl.innerHTML='<div style="font-size:12px;opacity:.8;text-align:center;line-height:1.5;margin-bottom:8px;">'+
    en.toUpperCase()+'</div>'+
    '<div style="font-size:8px;opacity:.5;letter-spacing:1px;">ARRANGE THESE WORDS IN MANDARIN ORDER</div>';
  $('studyMCPinyin').innerHTML='';

  // Answer slots — user taps words into slots
  const selected=[];
  const box=$('studyMCChoices');
  box.innerHTML='';
  box.style.gridTemplateColumns='repeat('+drillWords.length+',1fr)';

  // Slot display
  const slotRow=document.createElement('div');
  slotRow.style.cssText='display:flex;gap:6px;justify-content:center;margin-bottom:12px;padding:8px 0;border-bottom:1px solid '+fg+';opacity:.3;';
  slotRow.id='wordOrderSlots';
  drillWords.forEach(function(_,si){
    const slot=document.createElement('div');
    slot.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;'+
      'min-width:2.5em;border-bottom:3px solid '+fg+';padding:4px 2px;';
    slot.id='slot'+si;
    slot.innerHTML='<span style="font-size:28px;line-height:1;">\u00a0</span>';
    slotRow.appendChild(slot);
  });
  promptEl.appendChild(slotRow);

  let locked=false;
  // Word buttons
  shuffledWords.forEach(function(w){
    const b=document.createElement('button');
    b.className='choice';
    b.style.cssText='border-color:'+fg+';color:'+fg+
      ';display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:10px 6px;';
    b.dataset.word=w;
    const wCharSpan=document.createElement('span');
    wCharSpan.textContent=w; wCharSpan.style.cssText='font-size:32px;line-height:1;'+CJKf;
    b.appendChild(wCharSpan);
    const wIdx=D.findIndex(function(d){return d[0]===w;});
    if(wIdx>=0&&D[wIdx][1].length){
      const wPy=document.createElement('span');
      wPy.style.cssText='font-size:9px;display:flex;gap:2px;font-family:\'Noto Sans\',Arial,sans-serif;';
      D[wIdx][1].forEach(function([s,t]){
        const se=document.createElement('span'); se.textContent=s; se.style.color=toneColor(t,fg);
        wPy.appendChild(se);
      });
      b.appendChild(wPy);
    }
    b.onclick=function(){
      if(locked||b.dataset.used) return;
      selected.push(w);
      b.dataset.used='1';
      b.style.opacity='.3';
      // Fill next slot as phi-unit
      const slot=document.getElementById('slot'+(selected.length-1));
      if(slot){
        const sIdx=D.findIndex(function(d){return d[0]===w;});
        const sSyls=sIdx>=0?D[sIdx][1]:[];
        let pyHTML='';
        if(sSyls.length){
          pyHTML='<span style="font-size:9px;display:flex;gap:2px;font-family:\'Noto Sans\',Arial,sans-serif;">';
          sSyls.forEach(function([s,t]){ pyHTML+='<span style="color:'+toneColor(t,fg)+'">'+s+'</span>'; });
          pyHTML+='</span>';
        }
        slot.innerHTML='<span style="font-size:28px;line-height:1;font-family:\'PingFang SC\',\'Heiti SC\',\'Noto Sans CJK SC\',sans-serif;">'+w+'</span>'+pyHTML;
        slot.style.opacity='1';
      }
      // Check if all words placed
      if(selected.length===drillWords.length){
        locked=true;
        const isCorrect=selected.join('')===correctOrder.join('');
        const respMs=Date.now()-cardShownAtMC;
        // Show correct order
        const slotsEl=document.getElementById('wordOrderSlots');
        if(slotsEl){
          slotsEl.style.opacity='1';
          correctOrder.forEach(function(cw,ci){
            const s=document.getElementById('slot'+ci);
            if(s){
              const col=selected[ci]===cw?'hsl(120,70%,50%)':'hsl(0,70%,50%)';
              s.querySelectorAll('span').forEach(function(el){el.style.color=col;});
            }
          });
        }
        recordChallengeResult(i,'word-order',isCorrect,respMs);
        recordAxisResultNew(i,'meaning',isCorrect,respMs);
        logAnswer(i,isCorrect);
        if(isCorrect){
          advanceMult();
          S.xp+=Math.round(computeXP(true,currentMultIdx,respMs)*fatigueXPMultiplier());
          addMastery(i,0.6); // highest mastery gain — hardest receptive modality
          if(S.sound!=='mute') speak(zh,activeCourse().langCode);
        } else {
          resetMult();
          addMastery(i,-0.2);
          studyPending.push({idx:i,mod:'word-order'});
        }
        save();
        armTapAdvance($('studyMC'),function(){nextStudyCard();},isCorrect?0:1500);
      }
    };
    box.appendChild(b);
  });

  if(S.sound!=='mute') setTimeout(function(){ speak(en,'en-US'); },0);

  // Tap prompt area to repeat English TTS before answering
  $('studyMCPrompt').style.cursor='pointer';
  $('studyMCPrompt').onclick=function(e){
    if(locked||S.sound==='mute') return;
    speak(en,'en-US');
    e.stopPropagation();
  };

  renderChallengeRings(i,'word-order',$('studyMCPrompt'));
  studyDontKnowAction=function(){
    if(locked) return; locked=true;
    addMastery(i,-0.2);
    studyPending.push({idx:i,mod:'word-order'});
    armTapAdvance($('studyMC'),function(){nextStudyCard();},1200);
  };
  renderWagerControl('studyMCActions',i);
}


/* ============ DEBUG: PROGRESS CONTROLS ============ */

function debugResetProgress(){
  showDebugModal(
    '⚠ RESET ALL PROGRESS',
    'Wipe all cards, XP, grammar progress, and history. Cannot be undone.',
    [
      {label:'RESET', danger:true, action:()=>{
        localStorage.removeItem(KEY);
        S={cards:{},xp:0,lastDay:null,streak:0,sound:S.sound||'auto',ordered:false,
           decks:{},activeDeck:'core',dailyCards:0,dailyDate:'',uniqueSeen:[],
           mult:1.0,multStreak:0,seenColls:[],grammarMastery:{},grammar:{}};
        initGrammarState();
        save();
        rollBg(); renderHome(); show('home');
      }},
      {label:'CANCEL', action:null}
    ]
  );
}

function debugSetProficiency(){
  showDebugModal(
    '◈ SET PROFICIENCY',
    'Simulate user at this progress level:',
    [
      {label:'0% — NEW USER',   action:()=>applyProficiency(0)},
      {label:'25% — BEGINNER',  action:()=>applyProficiency(25)},
      {label:'50% — MIDWAY',    action:()=>applyProficiency(50)},
      {label:'75% — ADVANCED',  action:()=>applyProficiency(75)},
      {label:'100% — MASTERED', action:()=>applyProficiency(100)},
      {label:'CANCEL', action:null}
    ]
  );
}

function applyProficiency(level2){

  // Reset first
  S.cards={}; S.xp=0; S.streak=0; S.uniqueSeen=[]; S.seenColls=[];
  S.grammar={}; S.grammarMastery={};
  initGrammarState();

  // Calculate how many words to introduce
  const wordCount=Math.round((level2/100)*D.length);
  const axisStageTarget=Math.round((level2/100)*5); // 0-5
  const grammarStageTarget=Math.round((level2/100)*4); // 0-4

  // Introduce words up to wordCount with appropriate mastery
  D.forEach((_,i)=>{
    if(i>=wordCount) return;
    const ci=card(i);
    ci.exp=Math.max(1, Math.round((level2/100)*5));
    ci.seen=true;
    ci.m=Math.round((level2/100)*4*10)/10;
    if(!ci.axisStage) ci.axisStage={pos:0,meaning:0};
    ci.axisStage.meaning=Math.min(5,axisStageTarget);
    ci.axisStage.pos=Math.min(4,Math.floor(axisStageTarget/2));
    if(!ci.axisReps) ci.axisReps={meaning:0,pos:0,tone:0};
    ci.axisReps.meaning=Math.round((level2/100)*20);
    if(!ci.axisDue) ci.axisDue={};
    // Cards are due now for review
    ci.axisDue.meaning=Date.now()-1000;
    ci.axisDue.pos=Date.now()-1000;
    if(!ci.axisHistory) ci.axisHistory={meaning:[],pos:[],tone:[]};
    // Simulate successful history
    const histLen=Math.round((level2/100)*15);
    ci.axisHistory.meaning=Array(histLen).fill(1);
    S.uniqueSeen.push(i);
  });

  // Set grammar stages
  GRAMMAR_CATS.forEach(cat=>{
    GRAMMAR_AXES.forEach(axis=>{
      if(S.grammar[cat]&&S.grammar[cat][axis]){
        S.grammar[cat][axis].stage=Math.min(AXIS_MAX_STAGES[axis]||4, grammarStageTarget);
        S.grammar[cat][axis].reps=Math.round((level2/100)*10);
        // Not due — already learned
        S.grammar[cat][axis].due=level>=50?Date.now()+7*DAY:Date.now()-1000;
        const histLen=Math.round((level2/100)*10);
        S.grammar[cat][axis].history=Array(histLen).fill(1);
      }
    });
  });

  S.xp=Math.round((level2/100)*50000);
  S.streak=Math.round((level2/100)*30);

  save();
  rollBg(); renderHome(); show('home');
}


function showDebugModal(title, body, buttons){
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  const box=document.createElement('div');
  const fg=getComputedStyle(document.body).color;
  const bg=getComputedStyle(document.body).backgroundColor;
  box.style.cssText='background:'+bg+';color:'+fg+';border:4px solid '+fg+';padding:20px;width:100%;max-width:340px;display:flex;flex-direction:column;gap:12px;font-family:inherit;';
  const t=document.createElement('div');
  t.style.cssText='font-size:10px;letter-spacing:2px;font-weight:bold;';
  t.textContent=title;
  const b=document.createElement('div');
  b.style.cssText='font-size:9px;opacity:.7;line-height:1.6;';
  b.textContent=body;
  box.appendChild(t);
  box.appendChild(b);
  buttons.forEach(btn=>{
    const el=document.createElement('button');
    el.style.cssText='font-family:inherit;font-size:9px;padding:12px;border:3px solid '+(btn.danger?'hsl(0,70%,55%)':fg)+';color:'+(btn.danger?'hsl(0,70%,55%)':fg)+';background:transparent;cursor:pointer;letter-spacing:1px;';
    el.textContent=btn.label;
    el.onclick=()=>{ overlay.remove(); if(btn.action) btn.action(); };
    box.appendChild(el);
  });
  overlay.appendChild(box);
  overlay.onclick=(e)=>{ if(e.target===overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}


/* ============ SEMANTIC RELATIONS DATABASE ============ */
// Handcrafted for the 100-word Mandarin frequency spine.
// Priority for distractor selection:
//   1. opposites  — ontological opposites, highest learning signal
//   2. neighbors  — semantic field neighbors
//   3. functional — functional analogs (same grammatical role)
//
// Only characters that appear in D[] are useful distractors.

const SR={
  // ── PRONOUNS ──────────────────────────────────────────────────
  '我':{ op:['你','他','她'],    nb:['我们'],           fn:[] },
  '你':{ op:['我','他','她'],    nb:['你们'],           fn:[] },
  '他':{ op:['她','我','你'],    nb:['他们'],           fn:[] },
  '她':{ op:['他','我','你'],    nb:['她们'],           fn:[] },
  '们':{ op:[],                   nb:['我','你','他'],    fn:[] },
  '它':{ op:['我','你'],          nb:['他','她'],         fn:[] },

  // ── CORE VERBS ────────────────────────────────────────────────
  '是':{ op:['不','没'],          nb:['有','在'],         fn:['了','的'] },
  '有':{ op:['没','没有'],        nb:['是','在'],         fn:[] },
  '在':{ op:['没','不在'],        nb:['有','是'],         fn:['上','里','下'] },
  '来':{ op:['去','走'],          nb:['到','回'],         fn:['进','出'] },
  '去':{ op:['来','回'],          nb:['到','走'],         fn:['进','出'] },
  '说':{ op:[],                   nb:['讲','问','答'],    fn:['叫','喊'] },
  '知道':{ op:['不知道'],         nb:['明白','懂'],       fn:[] },
  '到':{ op:[],                   nb:['来','去','回'],    fn:['进','出'] },
  '要':{ op:['不要','不'],        nb:['想','会','能'],    fn:['该','得'] },
  '会':{ op:['不会'],             nb:['能','可以'],       fn:['该','要'] },
  '能':{ op:['不能'],             nb:['会','可以'],       fn:['该','要'] },
  '可以':{ op:['不可以','不能'],  nb:['能','会'],         fn:['该','要'] },
  '做':{ op:[],                   nb:['干','用','给'],    fn:['说','写'] },
  '看':{ op:[],                   nb:['见','听','想'],    fn:['读','写'] },
  '想':{ op:['不想'],             nb:['要','希望','觉得'],fn:['看','以为'] },
  '给':{ op:['要','拿'],          nb:['送','帮','让'],    fn:['用','拿'] },
  '让':{ op:[],                   nb:['给','帮','叫'],    fn:['要','说'] },
  '叫':{ op:[],                   nb:['说','让','请'],    fn:['问','告诉'] },
  '走':{ op:['来','停'],          nb:['去','跑','回'],    fn:['进','出'] },
  '回':{ op:['去','来'],          nb:['走','到'],         fn:['进','出'] },
  '打':{ op:[],                   nb:['用','拿','放'],    fn:['做','干'] },
  '开':{ op:['关'],               nb:['进','出','走'],    fn:['用','做'] },
  '关':{ op:['开'],               nb:['停','走'],         fn:['关','回'] },

  // ── STATIVE VERBS / ADJECTIVES ────────────────────────────────
  '好':{ op:['坏','不好'],        nb:['对','行'],         fn:['大','多'] },
  '大':{ op:['小'],               nb:['多','长','高'],    fn:['好','坏'] },
  '小':{ op:['大'],               nb:['少','短','低'],    fn:['好','坏'] },
  '多':{ op:['少'],               nb:['大','很'],         fn:[] },
  '少':{ op:['多'],               nb:['小','没'],         fn:[] },
  '对':{ op:['错','不对'],        nb:['好','行'],         fn:[] },
  '错':{ op:['对','没错'],        nb:['坏','不好'],       fn:[] },
  '新':{ op:['旧','老'],          nb:['好','年轻'],       fn:[] },
  '长':{ op:['短'],               nb:['大','高','多'],    fn:[] },

  // ── ADVERBS ───────────────────────────────────────────────────
  '不':{ op:['很','也','都'],     nb:['没','别'],         fn:['不','没'] },
  '没':{ op:['有','都'],          nb:['不','别'],         fn:['不'] },
  '也':{ op:[],                   nb:['都','还','又'],    fn:['不','很'] },
  '都':{ op:[],                   nb:['也','还','又'],    fn:['不','很'] },
  '很':{ op:['不','没'],          nb:['真','太','最'],    fn:['也','都'] },
  '还':{ op:[],                   nb:['也','都','又'],    fn:['不','很'] },
  '只':{ op:['都','全'],          nb:['就','才'],         fn:['不','没'] },
  '就':{ op:[],                   nb:['才','只','还'],    fn:['都','也'] },
  '才':{ op:['就'],               nb:['只','刚','又'],    fn:['都','也'] },
  '再':{ op:[],                   nb:['又','还','也'],    fn:['不','没'] },
  '又':{ op:[],                   nb:['再','还','也'],    fn:['都','也'] },
  '太':{ op:[],                   nb:['很','真','最'],    fn:['不','没'] },

  // ── PARTICLES ─────────────────────────────────────────────────
  '的':{ op:[],                   nb:['地','得'],         fn:['了','吗','呢','啊'] },
  '了':{ op:[],                   nb:['过','着'],         fn:['的','吗','呢'] },
  '吗':{ op:[],                   nb:['呢','啊','吧'],    fn:['的','了'] },
  '呢':{ op:[],                   nb:['吗','啊','吧'],    fn:['的','了'] },
  '吧':{ op:[],                   nb:['吗','呢','啊'],    fn:['的','了'] },

  // ── DEMONSTRATIVES ───────────────────────────────────────────
  '这':{ op:['那'],               nb:['这里','这个'],     fn:['什么','哪'] },
  '那':{ op:['这'],               nb:['那里','那个'],     fn:['什么','哪'] },

  // ── QUESTION WORDS ───────────────────────────────────────────
  '什么':{ op:[],                 nb:['哪','谁','怎么'],  fn:['这','那'] },

  // ── CONJUNCTIONS / CONNECTORS ─────────────────────────────────
  '和':{ op:[],                   nb:['跟','与','或'],    fn:['也','都'] },
  '但':{ op:['和','所以'],        nb:['可是','虽然'],     fn:['就','才'] },
  '所以':{ op:['但','虽然'],      nb:['因为','就'],       fn:['才','还'] },
  '因为':{ op:['所以'],           nb:['由于'],            fn:['就','才'] },
  '如果':{ op:[],                 nb:['要是','假如'],     fn:['就','才'] },
  '虽然':{ op:['所以'],           nb:['但是','可是'],     fn:['就','才'] },

  // ── POSITIONAL ───────────────────────────────────────────────
  '上':{ op:['下','里'],          nb:['中','前','后'],    fn:['在','到'] },
  '下':{ op:['上'],               nb:['里','中','后'],    fn:['在','到'] },
  '里':{ op:['外','上'],          nb:['中','内'],         fn:['在','到'] },
  '前':{ op:['后'],               nb:['上','左'],         fn:['到','来'] },
  '后':{ op:['前'],               nb:['下','右'],         fn:['到','来'] },

  // ── TIME ─────────────────────────────────────────────────────
  '时候':{ op:[],                 nb:['时间','以后','以前'],fn:[] },
  '现在':{ op:['以前','过去'],    nb:['时候','今天'],     fn:[] },

  // ── NUMBERS / QUANTIFIERS ────────────────────────────────────
  '一':{ op:['多','全'],          nb:['个','些'],         fn:['都','也'] },
  '个':{ op:[],                   nb:['些','种','次'],    fn:['的','了'] },

  // ── PEOPLE / THINGS ──────────────────────────────────────────
  '人':{ op:[],                   nb:['们','大家'],       fn:[] },
  '事':{ op:[],                   nb:['问题','情况'],     fn:[] },
  '自己':{ op:['别人','他人'],    nb:['我','本人'],       fn:[] },
};

// Get semantic distractors for a target word, prioritized by type
function getSemanticDistractors(targetIdx, nWanted, introducedChars){
  const ch=D[targetIdx][0];
  const rel=SR[ch]||{op:[],nb:[],fn:[]};
  const inSet=new Set(introducedChars);
  const used=new Set([ch]);

  const result=[];

  const addIfAvailable=(chars, maxCount)=>{
    let added=0;
    for(const c of chars){
      if(added>=maxCount) break;
      if(used.has(c)) continue;
      // Find index of this char in D
      const idx=D.findIndex(d=>d[0]===c);
      if(idx<0||!inSet.has(c)) continue; // must be introduced
      result.push(D[idx][2]); // add the DEFINITION as distractor
      used.add(c);
      added++;
    }
    return added;
  };

  // Priority 1: ontological opposites (all of them if available)
  addIfAvailable(rel.op, rel.op.length);

  // Priority 2: semantic neighbors (up to nWanted-1)
  addIfAvailable(shuffle([...rel.nb]), nWanted-1);

  // Priority 3: functional analogs
  addIfAvailable(shuffle([...rel.fn]), nWanted-2);

  return result;
}


// Classify what kind of error the user made
// Returns 'opposite' | 'neighbor' | 'functional' | 'random'
function classifyDistractorError(targetIdx, chosenDef){
  const ch=D[targetIdx][0];
  const rel=SR[ch]||{op:[],nb:[],fn:[]};

  // Find which character the user chose
  const chosenIdx=D.findIndex(d=>d[2]===chosenDef);
  if(chosenIdx<0) return 'random';
  const chosenCh=D[chosenIdx][0];

  if(rel.op.includes(chosenCh)) return 'opposite';
  if(rel.nb.includes(chosenCh)) return 'neighbor';
  if(rel.fn.includes(chosenCh)) return 'functional';
  return 'random';
}

/* ============ EVENTS ============ */
$('start').onclick=()=>{ primeSpeechEngine(activeCourse().langCode); startStudy(true); };
$('quit').onclick=endSession;

$('finish').onclick=()=>{ showSummary('session'); };
$('mc-finish').onclick=()=>{ showSummary('mc'); };
$('study-finish').onclick=()=>{ showSummary('study'); };
$('summary-home').onclick=()=>{ goHome(); };
if($('summary-continue')) $('summary-continue').onclick=()=>{
  startSessionLog(summaryReturnView);
  if(summaryReturnView==='study') show('study');
  else if(summaryReturnView==='mc') show('mc');
  else { show('session'); }
  rollBg();
};

$('startMC').onclick=()=>{ startMC(); };
$('mc-quit').onclick=()=>{ goHome(); };
if($('mc-fwd')) $('mc-fwd').onclick=()=>{ mcReverse=false; renderMC(); };
if($('mc-rev')) $('mc-rev').onclick=()=>{ mcReverse=true; renderMC(); };
$('radDetail-back').onclick=()=>{ rollBg(); if(radDetailFrom==='mc') show('mc'); else if(radDetailFrom==='study'){ showStudyCard(activeCardIdx>=0?activeCardIdx:0); } else { show('session'); renderCard(); } };
$('charDetail-back').onclick=()=>{
  rollBg();
  if(charDetailFrom==='mc'){
    show('mc');
  } else if(charDetailFrom==='study'||charDetailFrom==='studyColl'||charDetailFrom==='studyGrammar'){
    show('study');
    try{
      if(activeCardIdx>=0 && activeCardIdx<D.length){
        showStudyCard(activeCardIdx);
      } else {
        // Was on coll or grammar card — advance to next
        nextStudyCard();
      }
    }catch(e){ nextStudyCard(); }
  } else {
    show('session'); renderCard();
  }
};
$('startTone').onclick=()=>{ primeSpeechEngine(activeCourse().langCode); startTone(); };
$('startStudy').onclick=()=>{ primeSpeechEngine(activeCourse().langCode); startStudy(); };
$('study-quit').onclick=()=>{ studyActive=false; goHome(); };
$('startWS').onclick=()=>{ startWordSearch(); };
if($('startGrammar')) $('startGrammar').onclick=()=>{ startGrammarOnlySession(); };
if($('debugReset')) $('debugReset').onclick=()=>{ debugResetProgress(); };
if($('debugSetProficiency')) $('debugSetProficiency').onclick=()=>{ debugSetProficiency(); };
$('debugToggle').onclick=()=>{
  const dm=$('debugModes');
  const open=dm.style.display==='flex';
  dm.style.display=open?'none':'flex';
  $('debugToggle').textContent=open?'▸ DEBUG MODES':'▾ DEBUG MODES';
};
$('ws-quit').onclick=()=>{ goHome(); };
$('ws-next').onclick=()=>{ loadWSPassage(); };
// studyDontKnow removed — handled by unified wager bar
$('tone-quit').onclick=()=>{ goHome(); };
$('tone-prompt').onclick=()=>{ if(S.sound!=='mute') speak(D[toneCur][0],activeCourse().langCode); };
$('tone-visual').onclick=()=>{ toneAudioMode=false; updateToneSubmode(); };
$('tone-audio').onclick=()=>{ toneAudioMode=true; updateToneSubmode(); if(S.sound!=='mute') speak(D[toneCur][0],activeCourse().langCode); };
$('mc-dontknow').onclick=()=>{
  if(mcLocked) return;
  const dkCorrect=mcReverse?D[mcCur][0]:D[mcCur][2];
  document.querySelectorAll('.choice').forEach(b=>{
    if(b.textContent===(mcReverse?dkCorrect:dkCorrect.toUpperCase())) b.classList.add('correct');
    b.style.pointerEvents='none';
  });
  $('mc-dontknow').disabled=true;
  mcLocked=true;
  const hist=mcHistory.get(mcCur)||[];
  hist.push(false);
  mcHistory.set(mcCur,hist);
  rate(mcCur,1);
  addMastery(mcCur,-0.5);
  mcCombo=0;
  if(S.sound!=='mute') speak(D[mcCur][0],activeCourse().langCode);
  save();
  $('mc-combo').textContent='';
  armTapAdvance($('mc-prompt'),()=>nextMC());
};
if($('card')) $('card').onclick=flip;
$('muteBtn').onclick=()=>{
  S.sound=S.sound==='auto'?'tap':S.sound==='tap'?'mute':'auto';
  save(); renderHome();
};
$('orderBtn').onclick=()=>{
  S.ordered=!S.ordered;
  save(); renderHome();
};
$('deckSelector').onclick=()=>{ rollBg(); renderDeckMgr(); show('deckMgr'); };
$('deckMgr-back').onclick=()=>{ goHome(); };
if($('deckMgr-create')) $('deckMgr-create').onclick=()=>{
  const inp=$('deckMgr-input');
  const name=inp.value.trim();
  if(!name) return;
  createDeck(name);
  inp.value='';
  renderDeckMgr();
  updateDeckSelector();
};


/* ============ INIT ============ */
(()=>{
  // Destroy any lingering fatigue overlay from previous session
  const lo=document.getElementById('fatigueOverlay');
  if(lo) lo.remove();
  load();
  loadSessionRings(); // restore ring state if page was minimized mid-session
  initGrammarState(); // ensure grammar sub-axis structure exists
  speechSynthesis.getVoices();
  resetSessionFatigue(); rollBg(); renderHome(); show('home');
  renderTTSStatus();
})();


// ═══════════════════════════════════════════════════════════════
// LAYER 2 — Static Data (clean module, overrides L1 declarations)
// ═══════════════════════════════════════════════════════════════
// Note: data constants are already declared in L1 with same values.
// New course data (future: Arabic, etc.) added here only.
// ACTIVE_COURSE_KEY and activeCourse() now canonical here:
// ACTIVE_COURSE_KEY already declared in L1 — using assignment
ACTIVE_COURSE_KEY = 'mandarin';
// activeCourse and activeLexicon already defined in L1

// ═══════════════════════════════════════════════════════════════
// LAYER 3 — Pure Scheduler Engine
// ═══════════════════════════════════════════════════════════════
// earworm — engine/scheduler.js
// Pure scheduling engine. No DOM. No side effects except through dispatch().
// Input: state snapshot. Output: {type, idx, axis, modality, reason}
// Every scheduling decision is traceable and testable.

const Scheduler = {

  // ─── Primary entry point ─────────────────────────────────────────────────
  // Returns the next card spec given current state.
  // {type:'vocab'|'grammar'|'introduce', idx, modality, axis?, reason}

  next(S, D, sessionState) {
    const {
      studyCardCount, studyFlashOnly, studyModalityFilter,
      studyPending, sessionGrammarAnswered, nextQueueRebuildAt
    } = sessionState;

    // 1. Flash-only override
    if (studyFlashOnly) {
      return this._nextVocab(S, D, sessionState, 'flash');
    }

    // 2. Grammar-only override
    if (studyModalityFilter === 'grammar') {
      return this._nextGrammarDrill(S, D, sessionState);
    }

    // 3. Pending re-queue (wrong answers)
    if (studyPending.length && studyCardCount % 8 === 7) {
      const pending = studyPending[0];
      return { type: 'pending', pending, reason: 're-queue' };
    }

    // 4. New word introduction
    if (this._shouldIntroduce(S, D, studyCardCount, studyModalityFilter)) {
      const idx = this._nextWordToIntroduce(S, D);
      if (idx >= 0) return { type: 'introduce', idx, modality: 'flash', reason: 'new-word' };
    }

    // 5. Due grammar drills (vocabulary-gated)
    const grammarDrills = this._dueGrammarDrills(S, D, sessionGrammarAnswered);
    const vocabDue = this._dueVocab(S, D);
    const vocabSeen = this._seenVocab(S, D);

    // 6. Build interleaved queue
    return this._pickFromPools(grammarDrills, vocabDue, vocabSeen, S, D);
  },

  // ─── Modality selection ──────────────────────────────────────────────────
  // Pure function: given word state, return the correct modality string

  modality(S, D, i) {
    try {
      const ci = S.cards[i] || {};
      const exp = ci.exp || 0;

      // First-time exposure: always flash
      if (exp === 0) return 'flash';

      const meanStg = this._getAxisStage(ci, 'meaning');

      // Stage 0: always MC-forward (first MC after flash)
      if (meanStg === 0) return 'mc-fwd';

      // Convergence: grammar + vocab both ready
      if (this._convergenceUnlocked(S, D, i) && this._isCardDue(ci)) {
        if (this._mostOverdueAxis(ci) === 'pos') return 'convergence';
      }

      // Meaning axis scheduling
      const meanDue = this._isAxisDue(ci, 'meaning');
      if (meanDue || meanStg >= 1) {
        if (meanStg === 1) return 'mc-fwd';
        if (meanStg === 2) return Math.random() < 0.6 ? 'mc-fwd' : 'mc-rev';
        if (meanStg === 3) {
          const hasSentences = (EXAMPLE_SENTENCES[D[i][0]] || []).length > 0;
          if (hasSentences) return Math.random() < 0.4 ? 'cloze' : 'mc-rev';
          return Math.random() < 0.5 ? 'mc-fwd' : 'mc-rev';
        }
        if (meanStg >= 4) {
          const r = Math.random();
          const hasSentences = (EXAMPLE_SENTENCES[D[i][0]] || []).length > 0;
          if (r < 0.35 && hasSentences) return 'cloze';
          if (r < 0.55) return 'word-order';
          return Math.random() < 0.5 ? 'mc-fwd' : 'mc-rev';
        }
      }

      return 'mc-fwd';
    } catch(e) {
      console.error('Scheduler.modality', i, e);
      return 'mc-fwd';
    }
  },

  // ─── Adaptive choice count ───────────────────────────────────────────────

  choiceCount(S, i, reverse) {
    const ci = S.cards[i] || {};
    const meanStg = this._getAxisStage(ci, 'meaning');
    const reps = (ci.axisReps && ci.axisReps.meaning) || 0;
    if (meanStg === 0 && reps <= 1) return { n: 2, grid: '1fr 1fr' };
    if (meanStg <= 1 && reps <= 4) return { n: 4, grid: reverse ? '1fr 1fr 1fr' : '1fr 1fr' };
    return { n: 6, grid: reverse ? '1fr 1fr 1fr' : '1fr 1fr' };
  },

  // ─── SRS: record answer ──────────────────────────────────────────────────

  recordAnswer(S, i, axis, isCorrect, responseMs) {
    if (!S.cards[i]) S.cards[i] = this._freshCard();
    const ci = S.cards[i];
    const now = Date.now();

    // History
    if (!ci.axisHistory) ci.axisHistory = {};
    if (!ci.axisHistory[axis]) ci.axisHistory[axis] = [];
    ci.axisHistory[axis].push(isCorrect ? 1 : 0);
    if (ci.axisHistory[axis].length > 30) ci.axisHistory[axis].shift();

    // Reps
    if (!ci.axisReps) ci.axisReps = {};
    if (!ci.axisDue) ci.axisDue = {};
    if (!ci.axisStage) ci.axisStage = { meaning: 0, pos: 0 };

    const stage = ci.axisStage[axis] || 0;
    const stability = AXIS_STABILITY[axis] || [0.002, 0.04, 0.5, 2, 7, 21];
    const maxStage = AXIS_MAX[axis] || 5;

    if (!isCorrect) {
      ci.axisReps[axis] = 0;
      const wrongMs = stage <= 1 ? 5 * 60000 : stage === 2 ? 20 * 60000 : 60 * 60000;
      ci.axisDue[axis] = now + wrongMs;
    } else {
      ci.axisReps[axis] = (ci.axisReps[axis] || 0) + 1;
      const speedFactor = responseMs < 2000 ? 1.2 : responseMs < 5000 ? 1.0 : 0.8;
      const baseDays = stability[Math.min((ci.axisReps[axis] || 1) - 1, stability.length - 1)] || 0.002;
      const intervalMs = Math.max(60000, Math.round(baseDays * speedFactor * DAY));
      ci.axisDue[axis] = now + intervalMs;

      // Stage advancement
      const windowSize = (AXIS_ADVANCE_WINDOW[axis] && AXIS_ADVANCE_WINDOW[axis][stage]) || 5;
      const hist = ci.axisHistory[axis] || [];
      if (hist.length >= windowSize && stage < maxStage) {
        const acc = hist.slice(-windowSize).reduce((s,v) => s+v, 0) / windowSize;
        if (acc >= (stage === 0 ? 1.0 : 0.75)) {
          ci.axisStage[axis] = stage + 1;
          ci.axisReps[axis] = 0;
        }
      }
    }

    return ci;
  },

  // ─── Grammar: record result ──────────────────────────────────────────────

  recordGrammarAnswer(S, cat, axis, isCorrect, responseMs, currentMultIdx, defaultMultIdx) {
    if (!S.grammar) S.grammar = {};
    if (!S.grammar[cat]) S.grammar[cat] = {};
    if (!S.grammar[cat][axis]) S.grammar[cat][axis] = { stage: 0, history: [], due: 0, reps: 0 };

    const ax = S.grammar[cat][axis];
    const now = Date.now();
    const HOUR = 3600000;
    const intervals = AXIS_INTERVALS[axis] || [0, 4, 12, 48, 168];

    ax.history.push(isCorrect ? 1 : 0);
    if (ax.history.length > 30) ax.history.shift();

    const stage = ax.stage || 0;
    const maxStage = AXIS_MAX_STAGES[axis] || 4;

    if (!isCorrect) {
      ax.reps = 0;
      ax.due = now + (intervals[0] || 4) * HOUR * 0.5;
    } else {
      ax.reps = (ax.reps || 0) + 1;
      const wagerBonus = currentMultIdx > defaultMultIdx ? 1 : 0;
      const windowSize = Math.max(1, (stage === 0 ? 2 : 3) - wagerBonus);
      const recent = ax.history.slice(-windowSize);
      const acc = recent.reduce((s,v) => s+v, 0) / Math.max(1, recent.length);
      const threshold = stage === 0 ? 1.0 : 0.8;
      const shouldAdvance = recent.length >= windowSize && acc >= threshold && stage < maxStage;
      const speedMult = responseMs < 1500 ? 1.3 : responseMs < 4000 ? 1.0 : 0.8;

      if (shouldAdvance) {
        ax.stage = stage + 1;
        ax.reps = 0;
        ax.due = now + (intervals[Math.min(stage + 1, intervals.length - 1)] || 48) * HOUR;
      } else {
        ax.due = now + Math.round((intervals[Math.min(stage, intervals.length - 1)] || 8) * HOUR * speedMult);
      }
    }

    return S.grammar[cat][axis];
  },

  // ─── Distractor selection ────────────────────────────────────────────────

  pickMeaningDistractors(S, D, targetIdx, n, stage) {
    const [ch,,correctDef,,targetPos] = D[targetIdx];
    const introChs = D.filter((_, i) => S.cards[i] && S.cards[i].exp > 0).map(d => d[0]);

    // Semantic distractors first
    const semantic = this._semanticDistractors(D, targetIdx, n, introChs);

    if (semantic.length >= n) return semantic.slice(0, n);

    // Fallback: scored pool
    const semSet = new Set(semantic);
    semSet.add(correctDef);
    const pool = D.map((_, i) => i).filter(i => {
      if (i === targetIdx || !(S.cards[i] && S.cards[i].exp > 0)) return false;
      if (D[i][2] === correctDef || semSet.has(D[i][2])) return false;
      return true;
    });

    const scored = pool.map(i => {
      const pos2 = D[i][4];
      let score = Math.random();
      if (POS_LOGICAL[pos2] && POS_LOGICAL[targetPos] &&
          POS_LOGICAL[pos2].cat === POS_LOGICAL[targetPos].cat) score += 2;
      score += Math.max(0, 3 - Math.abs(i - targetIdx) / 5);
      return { i, score };
    }).sort((a, b) => b.score - a.score);

    const fallback = scored.slice(0, (n - semantic.length) * 2)
      .sort(() => Math.random() - 0.5)
      .slice(0, n - semantic.length)
      .map(s => D[s.i][2]);

    return [...semantic, ...fallback];
  },

  // ─── Internal helpers ────────────────────────────────────────────────────

  _freshCard() {
    return {
      exp: 0, seen: false, m: 0, flipMs: 0,
      reps: 0, lapses: 0,
      axisStage: { meaning: 0, pos: 0 },
      axisReps: { meaning: 0, pos: 0, tone: 0 },
      axisDue: {},
      axisHistory: { meaning: [], pos: [], tone: [] },
      lastErrorType: {}
    };
  },

  _getAxisStage(ci, axis) {
    if (!ci || !ci.axisStage) return 0;
    return ci.axisStage[axis] || 0;
  },

  _isAxisDue(ci, axis) {
    if (!ci || !ci.axisDue) return true;
    return (ci.axisDue[axis] || 0) <= Date.now();
  },

  _isCardDue(ci) {
    return this._isAxisDue(ci, 'meaning') || this._isAxisDue(ci, 'pos');
  },

  _mostOverdueAxis(ci) {
    const now = Date.now();
    const mOverdue = now - (ci.axisDue && ci.axisDue.meaning || 0);
    const pOverdue = now - (ci.axisDue && ci.axisDue.pos || 0);
    return mOverdue >= pOverdue ? 'meaning' : 'pos';
  },

  _isGraduated(ci) {
    if (!ci || !ci.exp) return false;
    if (ci.axisReps && (ci.axisReps.meaning || 0) >= 1) return true;
    if ((ci.reps || 0) + (ci.lapses || 0) > 0) return true;
    return false;
  },

  _isUnlocked(S, i) {
    return !!(S.cards[i] && S.cards[i].exp > 0);
  },

  _shouldIntroduce(S, D, studyCardCount, modalityFilter) {
    if (modalityFilter) return false;
    const isFirst = studyCardCount === 1;
    if (!isFirst && studyCardCount % 6 !== 0) return false;
    const brandNew = D.filter((_, i) => {
      const ci = S.cards[i];
      if (!ci || !ci.exp) return false;
      return !this._isGraduated(ci);
    }).length;
    if (brandNew >= 3) return false;
    const inRotation = D.filter((_, i) => this._isUnlocked(S, i) && !this._isGraduated(S.cards[i])).length;
    return inRotation < 12;
  },

  _nextWordToIntroduce(S, D) {
    for (let i = 0; i < D.length; i++) {
      if (!this._isUnlocked(S, i)) return i;
    }
    return -1;
  },

  _dueVocab(S, D) {
    const now = Date.now();
    return D.map((_, i) => i).filter(i => {
      if (!this._isUnlocked(S, i)) return false;
      const ci = S.cards[i];
      return ci && ci.exp && this._isCardDue(ci);
    }).sort((a, b) => a - b);
  },

  _seenVocab(S, D) {
    return D.map((_, i) => i).filter(i => {
      if (!this._isUnlocked(S, i)) return false;
      const ci = S.cards[i];
      return ci && ci.exp && !this._isCardDue(ci);
    }).sort((a, b) => a - b);
  },

  _dueGrammarDrills(S, D, sessionGrammarAnswered) {
    if (!S.grammar) return [];
    const now = Date.now();
    const drills = [];
    GRAMMAR_CATS.forEach(cat => {
      GRAMMAR_AXES.forEach(axis => {
        const ax = S.grammar[cat] && S.grammar[cat][axis];
        if (!ax || ax.due > now) return;
        if (sessionGrammarAnswered && sessionGrammarAnswered.has(cat + ':' + axis)) return;
        if (!this._grammarAxisUnlocked(S, D, cat, axis)) return;
        drills.push({ cat, axis, overdue: now - ax.due });
      });
    });
    return drills.sort((a, b) => b.overdue - a.overdue);
  },

  _grammarAxisUnlocked(S, D, cat, axis) {
    const t = GRAMMAR_UNLOCK_THRESHOLDS[axis];
    if (!t) return false;
    const stage = (S.grammar && S.grammar[cat] && S.grammar[cat][axis] && S.grammar[cat][axis].stage) || 0;
    const threshold = t[Math.min(stage, Object.keys(t).length - 1)];
    if (!threshold) return false;
    const [wordsRequired, meaningStageRequired] = threshold;
    let count = 0;
    D.forEach((d, i) => {
      if (!this._isUnlocked(S, i)) return;
      if (!d[4] || !POS_LOGICAL[d[4]] || POS_LOGICAL[d[4]].cat !== cat) return;
      if (this._getAxisStage(S.cards[i] || {}, 'meaning') >= meaningStageRequired) count++;
    });
    return count >= wordsRequired;
  },

  _convergenceUnlocked(S, D, i) {
    const pos = D[i] && D[i][4];
    if (!pos || !POS_LOGICAL[pos]) return false;
    const cat = POS_LOGICAL[pos].cat;
    const gStg = S.grammar && S.grammar[cat] && S.grammar[cat].recognition
      ? S.grammar[cat].recognition.stage : 0;
    const mStg = this._getAxisStage(S.cards[i] || {}, 'meaning');
    return gStg >= 1 && mStg >= 1;
  },

  _pickFromPools(grammarDrills, vocabDue, vocabSeen, S, D) {
    const fr = D.filter((_, i) => this._isUnlocked(S, i)).length;
    const grammarInterval = fr < 10 ? 10 : fr < 30 ? 7 : 5;

    // Build ordered list
    const items = [];
    let gi = 0, vi = 0;
    const vAll = [...vocabDue, ...vocabSeen];

    while (gi < grammarDrills.length || vi < vAll.length) {
      if (gi < grammarDrills.length && items.length > 0 && items.length % grammarInterval === 0) {
        items.push({ type: 'grammar', ...grammarDrills[gi++] });
      } else if (vi < vAll.length) {
        items.push({ type: 'vocab', idx: vAll[vi++] });
      } else if (gi < grammarDrills.length) {
        items.push({ type: 'grammar', ...grammarDrills[gi++] });
      } else break;
    }

    if (!items.length) {
      // Fallback: seen cards
      if (vocabSeen.length) return { type: 'vocab', idx: vocabSeen[0] };
      return null;
    }

    const first = items[0];
    if (first.type === 'grammar') return first;
    return { type: 'vocab', idx: first.idx };
  },

  _semanticDistractors(D, targetIdx, nWanted, introChs) {
    const ch = D[targetIdx][0];
    const rel = SR[ch] || { op: [], nb: [], fn: [] };
    const inSet = new Set(introChs);
    const used = new Set([ch]);
    const result = [];

    const addIfAvail = (chars, max) => {
      let added = 0;
      for (const c of chars) {
        if (added >= max) break;
        if (used.has(c)) continue;
        const idx = D.findIndex(d => d[0] === c);
        if (idx < 0 || !inSet.has(c)) continue;
        result.push(D[idx][2]);
        used.add(c);
        added++;
      }
    };

    addIfAvail(rel.op, rel.op.length);
    addIfAvail([...rel.nb].sort(() => Math.random() - 0.5), nWanted - 1);
    addIfAvail([...rel.fn].sort(() => Math.random() - 0.5), nWanted - 2);

    return result;
  },

  _nextVocab(S, D, sessionState, forcedModality) {
    const vocabDue = this._dueVocab(S, D);
    const vocabSeen = this._seenVocab(S, D);
    const all = [...vocabDue, ...vocabSeen];
    if (!all.length) return null;
    return { type: 'vocab', idx: all[0], modality: forcedModality };
  },

  _nextGrammarDrill(S, D, sessionState) {
    const drills = [];
    GRAMMAR_CATS.forEach(cat => {
      GRAMMAR_AXES.forEach(axis => {
        if (sessionState.sessionGrammarAnswered && sessionState.sessionGrammarAnswered.has(cat + ':' + axis)) return;
        drills.push({ cat, axis, overdue: 0 });
      });
    });
    if (!drills.length) return null;
    return { type: 'grammar', ...drills[0] };
  },
};


// ═══════════════════════════════════════════════════════════════
// LAYER 4 — State Management
// ═══════════════════════════════════════════════════════════════
// earworm — engine/state.js
// Centralised state. All mutations through State.dispatch().
// No DOM access. Emits events that UI layer subscribes to.

// KEY and DAY already declared in legacy Layer 1
const DAY_MS = DAY; // alias

const DEFAULT_STATE = () => ({
  cards: {},
  xp: 0, streak: 0, lastDay: null,
  sound: 'auto', // 'auto'|'tap'|'mute'
  mult: 1.0, multStreak: 0,
  activeDeck: 'core', decks: {},
  dailyCards: 0, dailyDate: '',
  uniqueSeen: [],
  seenColls: [],
  grammarMastery: {},
  grammar: {},
  // Session (not persisted)
  _session: null,
});

const State = {
  _s: DEFAULT_STATE(),
  _listeners: [],

  // ── Persistence ─────────────────────────────────────────────────────────

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        this._s = Object.assign(DEFAULT_STATE(), saved);
        this._s.ordered = false;
        // Type guards
        if (!Array.isArray(this._s.uniqueSeen)) this._s.uniqueSeen = [];
        if (!Array.isArray(this._s.seenColls)) this._s.seenColls = [];
        if (typeof this._s.mult !== 'number') this._s.mult = 1.0;
        if (typeof this._s.xp !== 'number') this._s.xp = 0;
        if (!this._s.cards || typeof this._s.cards !== 'object') this._s.cards = {};
        if (!this._s.grammar || typeof this._s.grammar !== 'object') this._s.grammar = {};
      }
    } catch(e) { console.warn('State.load failed', e); }
    this._initGrammar();
    return this._s;
  },

  save() {
    try {
      const toSave = Object.assign({}, this._s);
      delete toSave._session;
      localStorage.setItem(KEY, JSON.stringify(toSave));
    } catch(e) {}
  },

  get() { return this._s; },

  // ── Dispatch ─────────────────────────────────────────────────────────────
  // Single entry point for all state mutations.

  dispatch(action, payload = {}) {
    const prev = this._s;
    switch(action) {

      case 'ANSWER_VOCAB': {
        const { idx, axis, isCorrect, responseMs } = payload;
        const ci = Scheduler.recordAnswer(this._s, idx, axis, isCorrect, responseMs);
        this._s.cards[idx] = ci;
        if (isCorrect) {
          this._s.xp += this._computeXP(payload);
          this._s.multStreak++;
          this._advanceMult();
        } else {
          this._s.multStreak = 0;
          this._resetMult();
        }
        break;
      }

      case 'ANSWER_GRAMMAR': {
        const { cat, axis, isCorrect, responseMs, currentMultIdx, defaultMultIdx } = payload;
        Scheduler.recordGrammarAnswer(this._s, cat, axis, isCorrect, responseMs, currentMultIdx, defaultMultIdx);
        if (isCorrect) this._s.xp += Math.round(10 * this._xpMult(payload));
        break;
      }

      case 'FLASH_SHOWN': {
        const { idx } = payload;
        if (!this._s.cards[idx]) this._s.cards[idx] = Scheduler._freshCard();
        const ci = this._s.cards[idx];
        if (!ci.exp) {
          ci.exp = 1;
          ci.seen = true;
          if (!ci.axisDue) ci.axisDue = {};
          ci.axisDue.meaning = Date.now() + Math.round(0.002 * DAY_MS);
          ci.axisDue.pos = Date.now() + Math.round(0.006 * DAY_MS);
        }
        break;
      }

      case 'FLASH_FLIPPED': {
        const { idx, frontMs, backMs } = payload;
        const ci = this._s.cards[idx] || Scheduler._freshCard();
        const totalMs = frontMs + backMs;
        ci.flipMs = ci.flipMs ? Math.round(ci.flipMs * 0.6 + totalMs * 0.4) : totalMs;
        ci.exp = (ci.exp || 0) + 1;
        this._s.cards[idx] = ci;
        break;
      }

      case 'MASTERY_ADD': {
        const { idx, delta } = payload;
        const ci = this._s.cards[idx] || Scheduler._freshCard();
        ci.m = Math.min(4, Math.max(0, (ci.m || 0) + delta));
        this._s.cards[idx] = ci;
        break;
      }

      case 'START_SESSION': {
        this._s._session = {
          cardCount: 0,
          history: new Map(),
          flashCount: new Map(),
          pending: [],
          grammarAnswered: new Set(),
          encounters: new Map(),
        };
        break;
      }

      case 'SESSION_CARD_SHOWN': {
        if (this._s._session) this._s._session.cardCount++;
        break;
      }

      case 'RESET': {
        const sound = this._s.sound;
        this._s = DEFAULT_STATE();
        this._s.sound = sound;
        this._initGrammar();
        localStorage.removeItem(KEY);
        break;
      }

      case 'SET_PROFICIENCY': {
        this._applyProficiency(payload.level);
        break;
      }

      case 'SET_SOUND': {
        this._s.sound = payload.mode;
        break;
      }

      case 'WAGER_CHANGE': {
        // No state change — wager lives in session UI state
        break;
      }

      case 'GRAMMAR_SESSION_ANSWERED': {
        if (this._s._session) {
          this._s._session.grammarAnswered.add(payload.cat + ':' + payload.axis);
        }
        break;
      }

      default:
        console.warn('State.dispatch: unknown action', action);
        return;
    }

    this.save();
    this._emit(action, payload);
  },

  // ── Subscriptions ────────────────────────────────────────────────────────

  on(action, fn) {
    this._listeners.push({ action, fn });
    return () => { this._listeners = this._listeners.filter(l => l.fn !== fn); };
  },

  _emit(action, payload) {
    this._listeners.forEach(l => {
      if (l.action === '*' || l.action === action) l.fn(payload, this._s);
    });
  },

  // ── Internal helpers ─────────────────────────────────────────────────────

  _initGrammar() {
    if (!this._s.grammar) this._s.grammar = {};
    GRAMMAR_CATS.forEach(cat => {
      if (!this._s.grammar[cat]) this._s.grammar[cat] = {};
      GRAMMAR_AXES.forEach(axis => {
        if (!this._s.grammar[cat][axis]) {
          this._s.grammar[cat][axis] = { stage: 0, history: [], due: 0, reps: 0 };
        }
      });
    });
  },

  _computeXP({ isCorrect, currentMultIdx, responseMs }) {
    if (!isCorrect) return 0;
    const mult = MULT_STEPS[currentMultIdx || 0] || 1;
    const speed = responseMs < 1500 ? 1.3 : responseMs < 4000 ? 1.0 : 0.8;
    return Math.round(10 * mult * speed);
  },

  _xpMult({ currentMultIdx }) {
    return MULT_STEPS[currentMultIdx || 0] || 1;
  },

  _advanceMult() {
    const natural = Math.floor(Math.log2(Math.max(1, this._s.multStreak / 3)));
    // Handled by UI layer wager control
  },

  _resetMult() {
    this._s.multStreak = 0;
  },

  _applyProficiency(level) {
    const wordCount = Math.round((level / 100) * D.length);
    const axisStageTarget = Math.round((level / 100) * 5);
    const grammarStageTarget = Math.round((level / 100) * 4);

    this._s.cards = {};
    this._s.grammar = {};
    this._initGrammar();

    D.forEach((_, i) => {
      if (i >= wordCount) return;
      const ci = Scheduler._freshCard();
      ci.exp = Math.max(1, Math.round((level / 100) * 5));
      ci.seen = true;
      ci.m = Math.round((level / 100) * 4 * 10) / 10;
      ci.axisStage = { meaning: Math.min(5, axisStageTarget), pos: Math.min(4, Math.floor(axisStageTarget / 2)) };
      ci.axisReps = { meaning: Math.round((level / 100) * 20), pos: 0, tone: 0 };
      ci.axisDue = { meaning: Date.now() - 1000, pos: Date.now() - 1000 };
      ci.axisHistory = { meaning: Array(Math.round((level / 100) * 15)).fill(1), pos: [], tone: [] };
      this._s.cards[i] = ci;
    });

    GRAMMAR_CATS.forEach(cat => {
      GRAMMAR_AXES.forEach(axis => {
        this._s.grammar[cat][axis] = {
          stage: Math.min(AXIS_MAX_STAGES[axis] || 4, grammarStageTarget),
          reps: Math.round((level / 100) * 10),
          due: level >= 50 ? Date.now() + 7 * DAY_MS : Date.now() - 1000,
          history: Array(Math.round((level / 100) * 10)).fill(1),
        };
      });
    });

    this._s.xp = Math.round((level / 100) * 50000);
    this._s.streak = Math.round((level / 100) * 30);
  },
};


// ═══════════════════════════════════════════════════════════════
// LAYER 5 — Bridge: legacy ↔ new architecture
// ═══════════════════════════════════════════════════════════════
// Connects State module to legacy S object.
// Ensures State.dispatch() and legacy mutations stay in sync.
// Gradually replace direct S mutations with State.dispatch() calls.

(function wireStateBridge() {
  // Ensure grammar state is initialized
  State.load();

  // Keep S in sync with State._s on load
  const loaded = State._s;
  if (loaded.xp) S.xp = loaded.xp;
  if (loaded.cards && Object.keys(loaded.cards).length) {
    Object.assign(S.cards, loaded.cards);
  }
  if (loaded.grammar && Object.keys(loaded.grammar).length) {
    S.grammar = loaded.grammar;
  }

  // Proxy save() to also update State._s
  const _origSave = window.save;
  window.save = function() {
    _origSave && _origSave();
    Object.assign(State._s, S);
  };

  // Wire State.dispatch for new code paths
  window.dispatchStudyAction = function(action, payload) {
    // Update legacy S from State after dispatch
    State.dispatch(action, payload);
    Object.assign(S, State._s);
  };

  console.log('[Earworm v2] Architecture layers loaded. Scheduler and State available.');
})();
