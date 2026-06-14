
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
  const load=()=>{ const v=speechSynthesis.getVoices(); if(v.length) _voices=v; };
  load();
  speechSynthesis.addEventListener('voiceschanged',load);
})();

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
