
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
// D is the ACTIVE lexicon pointer — reassigned by switchCourse(). The Mandarin
// data below is the default; D_MANDARIN captures it so the pointer can return.
let D=[
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
// Capture the Mandarin array so switchCourse() can repoint D back to it.
const D_MANDARIN=D;

/* ============ JAPANESE — 50 core words ============ */
// Subtitle/spoken-frequency ordering (OpenSubtitles-JP / SUBTLEX-JP basis).
// Schema: [word(native script), [[mora,...]], "english def", [], "pos"]
// No tone/pitch modeled; slot 3 (radicals) intentionally empty.
// Particles are regular cards. Hiragana/katakana treated identically.
let D_JA=[
["の",[["no"]],"possessive particle",[],"particle"],
["は",[["wa"]],"topic marker",[],"particle"],
["に",[["ni"]],"to, at, in",[],"particle"],
["を",[["o"]],"object marker",[],"particle"],
["が",[["ga"]],"subject marker",[],"particle"],
["で",[["de"]],"at, by, with",[],"particle"],
["と",[["to"]],"and, with",[],"particle"],
["も",[["mo"]],"also, too",[],"particle"],
["です",[["de"],["su"]],"to be (polite)",[],"verb"],
["する",[["su"],["ru"]],"to do",[],"verb"],
["いる",[["i"],["ru"]],"to exist (animate)",[],"verb"],
["ある",[["a"],["ru"]],"to exist (thing)",[],"verb"],
["これ",[["ko"],["re"]],"this one",[],"pronoun"],
["それ",[["so"],["re"]],"that one",[],"pronoun"],
["あれ",[["a"],["re"]],"that over there",[],"pronoun"],
["私",[["wa"],["ta"],["shi"]],"I, me",[],"pronoun"],
["あなた",[["a"],["na"],["ta"]],"you",[],"pronoun"],
["何",[["na"],["ni"]],"what",[],"pronoun"],
["誰",[["da"],["re"]],"who",[],"pronoun"],
["どこ",[["do"],["ko"]],"where",[],"pronoun"],
["今",[["i"],["ma"]],"now",[],"noun"],
["人",[["hi"],["to"]],"person",[],"noun"],
["事",[["ko"],["to"]],"thing, matter",[],"noun"],
["物",[["mo"],["no"]],"thing (object)",[],"noun"],
["時",[["to"],["ki"]],"time, when",[],"noun"],
["日",[["hi"]],"day, sun",[],"noun"],
["行く",[["i"],["ku"]],"to go",[],"verb"],
["来る",[["ku"],["ru"]],"to come",[],"verb"],
["見る",[["mi"],["ru"]],"to see, watch",[],"verb"],
["言う",[["i"],["u"]],"to say",[],"verb"],
["思う",[["o"],["mo"],["u"]],"to think",[],"verb"],
["知る",[["shi"],["ru"]],"to know",[],"verb"],
["分かる",[["wa"],["ka"],["ru"]],"to understand",[],"verb"],
["食べる",[["ta"],["be"],["ru"]],"to eat",[],"verb"],
["飲む",[["no"],["mu"]],"to drink",[],"verb"],
["なる",[["na"],["ru"]],"to become",[],"verb"],
["いい",[["i"],["i"]],"good",[],"adjective"],
["悪い",[["wa"],["ru"],["i"]],"bad",[],"adjective"],
["大きい",[["o"],["o"],["ki"],["i"]],"big",[],"adjective"],
["小さい",[["chi"],["i"],["sa"],["i"]],"small",[],"adjective"],
["とても",[["to"],["te"],["mo"]],"very",[],"adverb"],
["もう",[["mo"],["u"]],"already",[],"adverb"],
["まだ",[["ma"],["da"]],"still, not yet",[],"adverb"],
["はい",[["ha"],["i"]],"yes",[],"interjection"],
["いいえ",[["i"],["i"],["e"]],"no",[],"interjection"],
["ありがとう",[["a"],["ri"],["ga"],["to"],["u"]],"thank you",[],"interjection"],
["すみません",[["su"],["mi"],["ma"],["se"],["n"]],"excuse me, sorry",[],"interjection"],
["家",[["i"],["e"]],"house, home",[],"noun"],
["水",[["mi"],["zu"]],"water",[],"noun"],
["から",[["ka"],["ra"]],"from, because",[],"particle"]
];

/* ============ ARABIC-LEVANTINE — core vocabulary stub ============ */
// Levantine (Shami): Syrian / Lebanese / Jordanian / Palestinian spoken Arabic.
// Schema matches D_MANDARIN. Slot 1 tone = 0 (Arabic is stress-timed, not lexically tonal).
// Slot 3 (radicals) left empty — trilateral root graph to be co-designed with owner as teacher.
// Romanization is a working placeholder; owner to revise freely as course is built.
let D_AR=[
  ["في",[["fi",0]],"in, at",[],"preposition"],
  ["من",[["min",0]],"from, of",[],"preposition"],
  ["على",[["3la",0]],"on, upon",[],"preposition"],
  ["مع",[["ma3",0]],"with, together",[],"preposition"],
  ["ب",[["bi",0]],"in, with, by",[],"preposition"],
  ["أنا",[["a",0],["na",0]],"I, me",[],"pronoun"],
  ["أنت",[["in",0],["ta",0]],"you (m.sg.)",[],"pronoun"],
  ["هو",[["huw",0],["we",0]],"he",[],"pronoun"],
  ["هي",[["hiy",0],["ye",0]],"she",[],"pronoun"],
  ["إحنا",[["ih",0],["na",0]],"we",[],"pronoun"],
  ["شو",[["shu",0]],"what",[],"pronoun"],
  ["مين",[["min",0]],"who",[],"pronoun"],
  ["وين",[["wen",0]],"where",[],"pronoun"],
  ["كيف",[["kif",0]],"how",[],"adverb"],
  ["كتير",[["ktir",0]],"very, a lot",[],"adverb"],
  ["شوي",[["shwey",0]],"a little, a bit",[],"adverb"],
  ["هلق",[["hal",0],["la2",0]],"now",[],"adverb"],
  ["هيك",[["hek",0]],"like this, thus",[],"adverb"],
  ["لا",[["la",0]],"no",[],"adverb"],
  ["بس",[["bas",0]],"only, but, enough",[],"particle"],
  ["يلا",[["ya",0],["la",0]],"let's go, come on",[],"interjection"],
  ["يعني",[["ya3",0],["ni",0]],"means, like, you know",[],"particle"],
  // Batch 2 — negation · modals · demonstratives · pronouns · verbs · nouns
  ["مش",[["mish",0]],"not, isn't",[],"particle"],
  ["ما",[["ma",0]],"not, didn't (negation)",[],"particle"],
  ["بدّي",[["bid",0],["di",0]],"I want",[],"modal"],
  ["رح",[["ra7",0]],"going to (future)",[],"particle"],
  ["لازم",[["laa",0],["zim",0]],"must, have to",[],"modal"],
  ["هاد",[["haad",0]],"this (m.)",[],"pronoun"],
  ["هاي",[["haay",0]],"this (f.)",[],"pronoun"],
  ["شي",[["shi",0]],"thing, something",[],"noun"],
  ["ناس",[["naas",0]],"people",[],"noun"],
  ["يوم",[["yoom",0]],"day",[],"noun"],
  ["وقت",[["wa2t",0]],"time",[],"noun"],
  ["أنتو",[["in",0],["to",0]],"you (pl.)",[],"pronoun"],
  ["هنّي",[["hun",0],["ni",0]],"they",[],"pronoun"],
  ["حكى",[["7a",0],["ka",0]],"spoke, talked",[],"verb"],
  ["شاف",[["shaaf",0]],"saw",[],"verb"],
  ["أجا",[["2a",0],["ja",0]],"came",[],"verb"],
  ["راح",[["raa7",0]],"went",[],"verb"],
  ["بيت",[["bayt",0]],"house, home",[],"noun"],
];


/* ============ STATE ============ */
// KEY is the ACTIVE course's localStorage key — reassigned by switchCourse().
let KEY='earworm-mandarin-v1';
function defaultState(){
  return {cards:{},xp:0,lastDay:null,streak:0,sound:'auto',decks:{},activeDeck:'core',dailyCards:0,dailyDate:'',uniqueSeen:[],mult:1.0,multStreak:0,seenColls:[],grammarMastery:{},
    // Independent grammar track — multi-dimensional, per-category
    // Each category has 5 independent sub-axes with their own SRS schedules
    grammar:{},
    // Durable learning stats (per course) — fed by applyAnswer(), read by
    // renderStats(). days keyed by toDateString(); frontier is end-of-day snapshot.
    stats:{days:{},totalAnswers:0,totalCorrect:0,byModality:{}}
  }; // sound: auto|tap|mute
}
let S=defaultState();
let mem=true;
function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){
      const saved=JSON.parse(raw);
      S=Object.assign({},S,saved);
      // Ensure all fields have correct types
      if(!Array.isArray(S.uniqueSeen)) S.uniqueSeen=[];
      if(!Array.isArray(S.seenColls)) S.seenColls=[];
      if(typeof S.mult!=='number') S.mult=1.0;
      if(typeof S.multStreak!=='number') S.multStreak=0;
      if(typeof S.xp!=='number') S.xp=0;
      if(typeof S.streak!=='number') S.streak=0;
      if(!S.cards||typeof S.cards!=='object') S.cards={};
      if(!S.grammarMastery||typeof S.grammarMastery!=='object') S.grammarMastery={};
      if(!S.stats||typeof S.stats!=='object') S.stats={days:{},totalAnswers:0,totalCorrect:0,byModality:{}};
      if(!S.stats.days||typeof S.stats.days!=='object') S.stats.days={};
      if(!S.stats.byModality||typeof S.stats.byModality!=='object') S.stats.byModality={};
      // Ensure grammar track exists with all categories
      if(!S.grammar||typeof S.grammar!=='object') S.grammar={};
      if(!S.decks||typeof S.decks!=='object') S.decks={};
    }
  }catch(e){ console.warn('Load failed, fresh start',e); }
}
function save(){
  try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){}
}

// Single funnel for every graded answer. Accumulates durable per-course stats
// (S.stats) for the "your learning" view and emits a telemetry event onto the
// observability bus. logAnswer() routes through here, so every modality lands
// in one place. modality/latencyMs are optional (graceful: 'unknown'/skip).
function applyAnswer(i, isCorrect, modality, latencyMs){
  try{
    modality = modality || 'unknown';
    if(!S.stats||typeof S.stats!=='object') S.stats={days:{},totalAnswers:0,totalCorrect:0,byModality:{}};
    const st=S.stats;
    const day=new Date().toDateString();
    let d=st.days[day];
    if(!d){ d={answers:0,correct:0,sumLatency:0,latencyN:0,frontier:0}; st.days[day]=d; }
    d.answers++; if(isCorrect) d.correct++;
    if(typeof latencyMs==='number' && latencyMs>0 && latencyMs<120000){ d.sumLatency+=latencyMs; d.latencyN++; }
    d.frontier=frontier(); // end-of-day acquisition snapshot (monotonic)
    st.totalAnswers++; if(isCorrect) st.totalCorrect++;
    const m=st.byModality[modality]||{answers:0,correct:0};
    m.answers++; if(isCorrect) m.correct++;
    if(typeof latencyMs==='number' && latencyMs>0 && latencyMs<120000){ m.sumLatency=(m.sumLatency||0)+latencyMs; m.latencyN=(m.latencyN||0)+1; }
    st.byModality[modality]=m;
    const pol = newSchedulerPolicy();
    if(window.EW&&EW.obs) EW.obs.logEvent('answer',{
      item:i,modality:modality,correct:!!isCorrect,
      latencyMs:(typeof latencyMs==='number'?latencyMs:null),
      course:(typeof ACTIVE_COURSE_KEY!=='undefined'?ACTIVE_COURSE_KEY:null),
      policy:pol?'v2':'v1',
      frontier:frontier(),
      stage:(i>=0?(getAxisStage(i,'meaning')||0):null)
    });
    if(pol && i>=0 && window.dispatchStudyAction){
      try{ window.dispatchStudyAction('ANSWER_VOCAB',{idx:i,axis:'meaning',isCorrect:!!isCorrect,responseMs:(typeof latencyMs==='number'?latencyMs:null)}); }catch(e){}
    }
    save();
  }catch(e){ try{ if(window.EW&&EW.obs) EW.obs.captureError(e,{phase:'applyAnswer'}); }catch(_){} }
}
// ── CARD STATE SIGNALS — AUTHORITATIVE USES ─────────────────────────────────
// Each field on a card object has one authoritative purpose. Use the right one.
//
//  .seen      {boolean}  Set true in showStudyFlash when the flashcard is displayed.
//                        THE gate for "has this word been introduced?". Never use .exp
//                        for this purpose — .exp can be >0 from migration artifacts.
//
//  .exp       {number}   Flashcard showing count (incremented each time, starts at 0→1
//                        in showStudyFlash). Used for isMCEligible and expThreshold only.
//                        NOT a reliable "introduced" gate — use .seen instead.
//
//  .m         {number}   Mastery score, 0–MASTERY_MAX(4). Accumulates from drill results.
//                        Drives: state() display tier, toneStage(), modality difficulty.
//                        NOT the primary review-spacing signal — axisDue handles that.
//
//  .axisDue   {object}   Per-axis SRS due timestamps {meaning, pos, tone}.
//                        Primary signal for WHEN to show a card (forgetting curve).
//
//  .axisStage {object}   Per-axis progression level {meaning:0-3, pos:0-3}.
//                        Drives which variant of a modality to use (e.g. MC difficulty).
//
//  .axisCorrect {object} Consecutive correct answers per axis. Used for stage promotion.
//
//  .flipMs    {number}   EMA of time spent on flashcard (front+back). Used to calibrate
//                        SRS intervals (fast flips → learner is confident → longer interval).
//
//  .reps/.lapses/.iv/.due — Legacy SM-2 fields. Still written by rate() for backward
//                        compat but the per-axis system (axisDue) is now authoritative
//                        for scheduling. Do not use .iv or .due for new scheduler logic.
// ─────────────────────────────────────────────────────────────────────────────
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
  // === LEGACY v1 eligibility check — under policy, modality via resolveStudyModality + Scheduler.modality
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
// A word is INTRODUCED when it has been shown as a flashcard (seen:true).
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
// in the sentence has been properly introduced (seen as a flashcard).
// Uses .seen (set in showStudyFlash) rather than .exp, which can be >0 from
// migration artifacts without the user having actually seen the flashcard.
function sentenceAllIntroduced(zh){
  for(let j=0;j<D.length;j++){
    if(S.cards[j]&&S.cards[j].seen) continue;
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
// Scheduler policy flag. v2 = breadth-first-to-context pivot (demand-pull
// introduction, recognition-level context unlock, context-forward modality).
// Default off; toggle via localStorage 'earworm_policy'='v2' or ?earworm_policy=v2
// or the POLICY button in the debug panel. Gates every pivot branch so v1 and
// v2 coexist and revert instantly.
function newSchedulerPolicy(){
  try{ return localStorage.getItem('earworm_policy')==='v2' || /[?&]earworm_policy=v2/.test(location.search); }catch(e){ return false; }
}

// Would introducing word w make sentence `zh` fully covered? (Every other
// D-word in the sentence already introduced; w treated as introduced.)
function sentenceCoverableIfAdded(zh, w){
  for(let j=0;j<D.length;j++){
    if(j===w) continue;
    if(S.cards[j]&&S.cards[j].exp) continue;
    if(zh.includes(D[j][0])) return false;
  }
  return true;
}

// v2 demand-pull: among the next few unseen words (bounded Zipf horizon so we
// never stray far from frequency order), pick the one that newly completes the
// most example sentences — i.e. the word whose introduction pulls context into
// reach. Returns -1 when nothing is unlocked (caller falls back to Zipf order).
function demandPullNextWord(nextSpine){
  if(nextSpine<0) return -1;
  const HORIZON=12;
  const hi=Math.min(D.length, nextSpine+HORIZON);
  let best=-1, bestGain=0;
  for(let w=nextSpine; w<hi; w++){
    if(S.cards[w]&&S.cards[w].exp) continue;
    let gain=0;
    const sents=(typeof getPuzzleSentences==='function')?getPuzzleSentences(w):[];
    for(let k=0;k<sents.length;k++){ if(sentenceCoverableIfAdded(sents[k][0], w)) gain++; }
    if(gain>bestGain){ bestGain=gain; best=w; }
  }
  return bestGain>0?best:-1;
}

function nextWordToIntroduce(){
  // Next individual word
  let nextSpine=-1;
  for(let i=0;i<D.length;i++){
    if(!S.cards[i]||!S.cards[i].exp){
      nextSpine=i; break;
    }
  }
  // Demand-pull (v1 path only — v2 uses Scheduler.next for introduce decisions).
  if(!newSchedulerPolicy() && nextSpine>=0){
    const dp=demandPullNextWord(nextSpine);
    if(dp>=0) nextSpine=dp;
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
  if(activeCourse&&activeCourse().hasColls){
    COLL.forEach((entry,ci)=>{
      if(S.seenColls&&S.seenColls.includes(ci)) return; // already introduced
      if(!collUnlocked(ci)) return;
      const rank=entry[5]||999;
      if(rank<nextCollRank){ nextCollRank=rank; nextColl=ci; }
    });
  }

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
function fatigueLevel(){  // DISABLED — v1 only; under policy, cadence via Scheduler.next
  return 0; // always no fatigue
  // 0 = fresh, 1 = optimal, 2 = fatigued
  if(sessionCardCount<30) return 0;
  if(sessionCardCount<60) return 1;
  return 2;
}

function shouldIntroduceNewWord(){
  // === LEGACY v1 — under policy, Scheduler.next decides introduces
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

// ── MASTERY SCORING — PER-MODALITY GAIN/LOSS TABLE ─────────────────────────
// MASTERY_MAX=4. A word reaches "mastered" state at 4. Gains/losses per event:
//
//  Flashcard (showStudyFlash)     no direct gain — but sets seen:true and unlocks tests
//
//  MC forward/reverse             +0.5–2.0 correct (base ~1.0, modulated by wager
//                                 confidence, response speed, and combo multiplier)
//                                 -0.2–1.5 wrong  (base ~-0.5, higher penalty for
//                                 overconfident wrong answers)
//                                 -0.3 don't-know
//
//  Tone drill (force-correct)     +0.25 * tSpeedM  first-try correct
//                                 -0.1             wrong tap (dim button, stay on card)
//  Intentionally conservative: tone is a distinct skill requiring many reps.
//  Expected ~16 first-try correct answers to go 0→4 (more with wrong taps).
//
//  Cloze                          +0.5 * speedM    correct
//                                 -0.3             wrong / don't-know
//
//  Word-order                     +0.6             correct (highest fixed gain — hardest
//                                 -0.2             wrong / don't-know    receptive modality)
//
//  POS drill                      +0.4 * speedMult correct
//                                 -0.2 * wagerMult wrong
//
//  Convergence                    +0.3 for target item
//
// Design note: MC gains are variable (wager * speed) because MC is the primary
// modality and the wager system is calibrated there. Other modalities use fixed
// or lightly adjusted gains. MC correct (~+1.0 typical) is higher than word-order
// (+0.6) despite word-order being harder — this is intentional because MC fires
// far more frequently early in the learning arc. Word-order unlocks later and its
// gain is applied from a higher mastery baseline (typically 2+).
//
// DO NOT change gain values without playtesting — the tone drill stage gates and
// the active-rotation cap (max 30 words in rotation) are calibrated to these rates.
// ─────────────────────────────────────────────────────────────────────────────
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
  const windowSize=(AXIS_ADVANCE_WINDOW[axis]&&AXIS_ADVANCE_WINDOW[axis][currentStage])||5;
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
  if(typeof speechSynthesis==='undefined') return;
  // renderTTSStatus() reaches activeCourse()→COURSES, a const defined later in the
  // concatenated bundle (grammar.js). Safari returns getVoices() synchronously, so a
  // direct call here runs during script eval — before COURSES is initialized — and
  // throws "Cannot access uninitialized variable" (TDZ), aborting the whole script.
  // Defer the initial render to a macrotask so the full bundle has finished evaluating.
  const load=()=>{ try{ const v=speechSynthesis.getVoices(); if(v&&v.length){ _voices=v; renderTTSStatus(); } }catch(e){} };
  setTimeout(load,0);
  speechSynthesis.addEventListener('voiceschanged',load);
})();

// Experimental / preview voice variants that Edge registers in getVoices() but that
// frequently never synthesize through the Web Speech API (no onstart, no audio — they
// just hang pending). Confirmed culprit: "Microsoft Xiaoxiao Dragon HD Flash Latest
// Online (Natural)" — registered but silent. Deprioritize these so a stable neural
// voice is chosen instead; fall back to them only if nothing else exists.
const TTS_EXPERIMENTAL=/\b(dragon|hd|flash|latest|turbo|preview|multilingual)\b/i;

// Returns the best available voice for a language. Order of preference:
//   1. user-pinned voice (set via the TTS debug panel, persisted per lang prefix)
//   2. local (offline) voice — most reliable
//   3. stable online voice (experimental variants filtered out)
//   4. any remaining candidate (so we never return null when voices exist)
// Explicit voice selection is more reliable than lang-only on Windows (Edge/Chrome
// may not auto-select the installed pack without u.voice set).
function getBestVoice(lang){
  if(typeof speechSynthesis==='undefined') return null;
  const pool=_voices.length?_voices:speechSynthesis.getVoices();
  const prefix=(lang||'zh-CN').split('-')[0];
  const candidates=pool.filter(v=>v&&v.lang&&v.lang.startsWith(prefix));
  if(!candidates.length) return null;
  // 1. User-pinned voice wins if still present for this language
  try{
    const pinned=localStorage.getItem('earworm_voice_'+prefix);
    if(pinned){ const hit=candidates.find(v=>v.name===pinned); if(hit) return hit; }
  }catch(e){}
  // 2. Local voices are the most reliable
  const locals=candidates.filter(v=>v.localService===true);
  if(locals.length) return locals.find(v=>v.default)||locals[0];
  // 3. Among online voices, drop experimental variants (Dragon HD / Flash / etc.)
  const stable=candidates.filter(v=>v.name&&!TTS_EXPERIMENTAL.test(v.name));
  const pickFrom=stable.length?stable:candidates;
  const nonOnline=pickFrom.find(v=>v.name&&!v.name.includes('Online'));
  if(nonOnline) return nonOnline;
  return pickFrom.find(v=>v.default)||pickFrom[0];
}

function renderTTSStatus(){
  const el=document.getElementById('ttsStatus');
  if(!el) return;
  if(typeof speechSynthesis==='undefined'){
    el.textContent='TTS: UNSUPPORTED';
    el.style.cssText='font-size:7px;text-align:center;letter-spacing:2px;padding:2px 0;opacity:.4;';
    return;
  }
  const lang=(typeof activeCourse==='function'&&activeCourse())?activeCourse().langCode:'zh-CN';
  const pool=_voices.length?_voices:speechSynthesis.getVoices();
  const matching=pool.filter(v=>v&&v.lang&&v.lang.startsWith((lang||'zh-CN').split('-')[0]));
  if(!matching.length){
    el.textContent='⚠ TTS: NO VOICE INSTALLED';
    el.style.cssText='font-size:7px;text-align:center;letter-spacing:2px;padding:2px 0;color:hsl(0,70%,55%);cursor:pointer;opacity:1;';
    el.onclick=()=>showTTSDebug();
    return;
  }
  const best=getBestVoice(lang);
  const displayVoice=best||matching[0];
  const shortName=displayVoice&&displayVoice.name?displayVoice.name.replace(/Microsoft\s*/i,'').replace(/\s*Online.*/i,'').trim().split(/\s/)[0].toUpperCase():'VOICE';
  // Microsoft Neural packs report localService=false even when locally installed — don't use
  // that property to decide status. If voices exist for the lang, consider TTS ready.
  // Only warn when no voice is found at all (handled above).
  // Tap the status line to open the TTS debug panel (essential on iPhone — no console).
  el.textContent='TTS · '+shortName;
  el.style.cssText='font-size:7px;text-align:center;letter-spacing:2px;padding:2px 0;opacity:.4;cursor:pointer;';
  el.onclick=()=>showTTSDebug();
}

// Diagnostic alert — lists voices for the current language and fires a single test speak.
// Only reachable from the ONLINE ONLY / NO VOICE branches (LOCAL badge stays inert).
function showTTSVoiceDetails(lang){
  const freshLang=lang||(typeof activeCourse==='function'&&activeCourse()?activeCourse().langCode:'zh-CN');
  const pool=_voices.length?_voices:speechSynthesis.getVoices();
  const freshMatching=pool.filter(v=>v&&v.lang&&v.lang.startsWith(freshLang.split('-')[0]));
  const _testPhrase=freshLang.startsWith('ja')?'こんにちは':freshLang.startsWith('zh')?'你好':freshLang.startsWith('ar')?(activeCourse&&activeCourse().audioMap&&Object.keys(activeCourse().audioMap)[0])||'مرحبا':'hello';
  try{ speak(_testPhrase, freshLang); }catch(e){}
  let msg='Available voices for '+freshLang+':\n\n';
  if(!freshMatching.length){
    msg+='(none installed)\n\n';
  } else {
    freshMatching.forEach((v,idx)=>{
      msg+=(idx+1)+'. "'+v.name+'"\n   lang:'+v.lang+'  local:'+v.localService+'  default:'+v.default+'\n\n';
    });
  }
  const hasLocal=freshMatching.some(v=>v.localService===true);
  msg+=(hasLocal?'Local voice detected — TTS uses it directly.\n':'No local voice — speak() uses lang-only (browser picks your installed pack default).\n');
  msg+='If TTS is silent: Windows Settings → Time & Language → Speech → Add voices.';
  alert(msg);
}

// ── TTS DEBUG PANEL ─────────────────────────────────────────────────────────
// On-screen diagnostic overlay (works on iPhone where there's no console).
// Centerpiece is ttsProbe(): speaks a sentence with a raw utterance and logs every
// onstart/onboundary/onend/onerror event with a timestamp relative to speak() —
// this reveals whether a voice fires word boundaries, when, and at what charIndex.
// The single biggest TTS-reliability question is whether onboundary timing tracks
// actual audio playback (local voices) or the synthesis timeline (neural/Online
// voices, which can fire all boundaries before audio is audible).
let _ttsDbgPoll=null;
function ttsDbgLog(msg,color){
  const box=document.getElementById('ttsDbgLog');
  if(!box) return;
  const line=document.createElement('div');
  line.textContent=msg;
  if(color) line.style.color=color;
  box.insertBefore(line,box.firstChild);
}
function ttsProbe(text,lang){
  if(typeof speechSynthesis==='undefined'){ ttsDbgLog('NO speechSynthesis','#f55'); return; }
  try{ speechSynthesis.cancel(); }catch(e){}
  const t0=(window.performance&&performance.now)?performance.now():Date.now();
  const ts=()=>'+'+Math.round(((window.performance&&performance.now)?performance.now():Date.now())-t0)+'ms';
  const v=getBestVoice(lang);
  ttsDbgLog('── PROBE "'+text+'" ['+lang+'] → '+(v?v.name:'(lang-only)'),'#ff5');
  let nb=0;
  const u=new SpeechSynthesisUtterance(text);
  u.lang=lang; u.rate=.85; if(v) u.voice=v;
  u.onstart=()=>ttsDbgLog(ts()+' onstart','#7f7');
  u.onboundary=(e)=>{ nb++; ttsDbgLog(ts()+' boundary #'+nb+' name='+e.name+' charIndex='+e.charIndex+' len='+(e.charLength||'?'),'#7cf'); };
  u.onend=()=>ttsDbgLog(ts()+' onend ('+nb+' boundaries)','#7f7');
  u.onerror=(e)=>ttsDbgLog(ts()+' ERROR '+(e&&e.error),'#f55');
  u.onpause=()=>ttsDbgLog(ts()+' onpause','#fa3');
  u.onresume=()=>ttsDbgLog(ts()+' onresume','#fa3');
  try{
    speechSynthesis.speak(u);
    if(speechSynthesis.paused) try{ speechSynthesis.resume(); }catch(e){}
  }catch(e){ ttsDbgLog('speak() threw: '+e,'#f55'); }
}
function showTTSDebug(){
  const old=document.getElementById('ttsDbgOverlay');
  if(old) old.remove();
  if(_ttsDbgPoll){ clearInterval(_ttsDbgPoll); _ttsDbgPoll=null; }

  const lang=(typeof activeCourse==='function'&&activeCourse())?activeCourse().langCode:'zh-CN';
  const zhSample='这是我的书';   // zhè shì wǒ de shū — target 我 at index 2
  const jaSample='これは本です'; // kore wa hon desu — target 本 at index 3
  const isJa=lang.startsWith('ja');
  const clozeSample=isJa?jaSample:zhSample;
  const clozeTarget=isJa?'本':'我';

  const ov=document.createElement('div');
  ov.id='ttsDbgOverlay';
  ov.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(8,8,12,.97);color:#cfc;font-family:monospace;font-size:11px;line-height:1.5;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px;padding-top:calc(14px + env(safe-area-inset-top));padding-bottom:calc(14px + env(safe-area-inset-bottom));';

  const supported=typeof speechSynthesis!=='undefined';
  const pool=supported?(_voices.length?_voices:speechSynthesis.getVoices()):[];
  const zhV=pool.filter(v=>v&&v.lang&&v.lang.startsWith('zh'));
  const jaV=pool.filter(v=>v&&v.lang&&v.lang.startsWith('ja'));
  const audioState=(function(){ try{ return _audioCtx?_audioCtx.state:'(none)'; }catch(e){ return '(err)'; } })();

  ov.innerHTML=
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'+
      '<b style="color:#ff5;letter-spacing:1px;">TTS DEBUG</b>'+
      '<button id="ttsDbgClose" style="background:#400;color:#fcc;border:1px solid #c66;padding:8px 14px;font-family:monospace;font-size:12px;">✕ CLOSE</button>'+
    '</div>'+
    '<div style="opacity:.85;margin-bottom:6px;">'+
      'supported='+supported+' · audioCtx='+audioState+' · activeLang='+lang+'<br>'+
      'state: <span id="ttsDbgState">—</span>'+
    '</div>'+
    '<div style="color:#ff5;margin-top:8px;">ZH VOICES — tap to test + pin (best ★ → <span id="ttsDbgBestZh"></span>)</div>'+
    '<div id="ttsDbgZh" style="max-height:22vh;overflow-y:auto;-webkit-overflow-scrolling:touch;border:1px solid #1a1a1a;"></div>'+
    '<div style="color:#ff5;margin-top:8px;">JA VOICES — tap to test + pin (best ★ → <span id="ttsDbgBestJa"></span>)</div>'+
    '<div id="ttsDbgJa" style="max-height:22vh;overflow-y:auto;-webkit-overflow-scrolling:touch;border:1px solid #1a1a1a;"></div>'+
    '<div id="ttsDbgBtns" style="display:flex;flex-wrap:wrap;gap:6px;margin:12px 0;"></div>'+
    '<div style="color:#ff5;">EVENT LOG (newest first)</div>'+
    '<div id="ttsDbgLog" style="background:#000;border:1px solid #2a2;padding:8px;height:30vh;overflow-y:auto;-webkit-overflow-scrolling:touch;white-space:pre-wrap;word-break:break-all;"></div>';

  document.body.appendChild(ov);

  // Render a tappable voice list. Tapping a row pins that voice (persisted per lang
  // prefix) and auditions it via ttsProbe — the event log then shows whether it
  // actually fires onstart/onboundary or hangs silently (the Dragon HD failure mode).
  function renderVoiceList(containerId,list,prefix,sample){
    const c=document.getElementById(containerId);
    if(!c) return;
    c.innerHTML='';
    if(!list.length){ c.innerHTML='<div style="opacity:.6;padding:6px;">(none installed)</div>'; return; }
    let pinned=''; try{ pinned=localStorage.getItem('earworm_voice_'+prefix)||''; }catch(e){}
    const best=getBestVoice(prefix==='zh'?'zh-CN':'ja-JP');
    list.forEach(v=>{
      const row=document.createElement('div');
      const isPinned=v.name===pinned, isBest=best&&v.name===best.name;
      const exp=TTS_EXPERIMENTAL.test(v.name);
      row.style.cssText='padding:7px 6px;border-bottom:1px solid #161616;cursor:pointer;'+(exp?'opacity:.45;':'')+(isPinned?'background:#013;':'');
      row.textContent=(isPinned?'📌 ':isBest?'★ ':'  ')+v.name+'  ['+v.lang+(v.localService?' ·local':'')+(exp?' ·exp':'')+']';
      row.onclick=()=>{
        try{ localStorage.setItem('earworm_voice_'+prefix,v.name); }catch(e){}
        ttsDbgLog('PIN '+prefix+' → '+v.name,'#fa3');
        ttsProbe(sample,prefix==='zh'?'zh-CN':'ja-JP');
        refreshVoiceUI();
      };
      c.appendChild(row);
    });
  }
  function refreshVoiceUI(){
    const bz=getBestVoice('zh-CN'), bj=getBestVoice('ja-JP');
    const ez=ov.querySelector('#ttsDbgBestZh'), ej=ov.querySelector('#ttsDbgBestJa');
    if(ez) ez.textContent=bz?bz.name:'NONE';
    if(ej) ej.textContent=bj?bj.name:'NONE';
    renderVoiceList('ttsDbgZh',zhV,'zh',zhSample);
    renderVoiceList('ttsDbgJa',jaV,'ja',jaSample);
  }
  refreshVoiceUI();

  const mkBtn=(label,fn)=>{
    const b=document.createElement('button');
    b.textContent=label;
    b.style.cssText='background:#022;color:#9f9;border:1px solid #4a4;padding:9px 11px;font-family:monospace;font-size:11px;flex:1 1 auto;min-width:42%;';
    b.onclick=fn;
    return b;
  };
  const btns=ov.querySelector('#ttsDbgBtns');
  btns.appendChild(mkBtn('PROBE ZH ('+zhSample+')',()=>ttsProbe(zhSample,'zh-CN')));
  btns.appendChild(mkBtn('PROBE JA ('+jaSample+')',()=>ttsProbe(jaSample,'ja-JP')));
  btns.appendChild(mkBtn('speak() ZH 你好',()=>{ ttsDbgLog('→ speak("你好","zh-CN")','#fa3'); speak('你好','zh-CN'); }));
  btns.appendChild(mkBtn('speak() JA こんにちは',()=>{ ttsDbgLog('→ speak("こんにちは","ja-JP")','#fa3'); speak('こんにちは','ja-JP'); }));
  btns.appendChild(mkBtn('CLOZE '+clozeTarget+' in '+clozeSample,()=>{ ttsDbgLog('→ speakWithBlank("'+clozeSample+'","'+clozeTarget+'")','#fa3'); speakWithBlank(clozeSample,clozeTarget,isJa?'ja-JP':'zh-CN'); }));
  btns.appendChild(mkBtn('cancel()',()=>{ try{ speechSynthesis.cancel(); ttsDbgLog('cancel() called','#fa3'); }catch(e){} }));
  btns.appendChild(mkBtn('resume()',()=>{ try{ speechSynthesis.resume(); ttsDbgLog('resume() called','#fa3'); }catch(e){} }));
  btns.appendChild(mkBtn('reload voices',()=>{ try{ const v=speechSynthesis.getVoices(); if(v&&v.length) _voices=v; ttsDbgLog('reloaded: '+_voices.length+' voices','#fa3'); refreshVoiceUI(); }catch(e){} }));
  btns.appendChild(mkBtn('CLEAR PINS',()=>{ try{ localStorage.removeItem('earworm_voice_zh'); localStorage.removeItem('earworm_voice_ja'); }catch(e){} ttsDbgLog('pins cleared','#fa3'); refreshVoiceUI(); }));
  btns.appendChild(mkBtn('clear log',()=>{ const l=document.getElementById('ttsDbgLog'); if(l) l.innerHTML=''; }));

  ov.querySelector('#ttsDbgClose').onclick=()=>{
    if(_ttsDbgPoll){ clearInterval(_ttsDbgPoll); _ttsDbgPoll=null; }
    try{ speechSynthesis.cancel(); }catch(e){}
    ov.remove();
  };

  const stateEl=ov.querySelector('#ttsDbgState');
  _ttsDbgPoll=setInterval(()=>{
    if(!document.getElementById('ttsDbgOverlay')){ clearInterval(_ttsDbgPoll); _ttsDbgPoll=null; return; }
    if(!supported){ stateEl.textContent='unsupported'; return; }
    stateEl.textContent='speaking='+speechSynthesis.speaking+' pending='+speechSynthesis.pending+' paused='+speechSynthesis.paused+' gen='+_ttsGen;
  },200);

  ttsDbgLog('panel opened · '+pool.length+' voices loaded','#999');
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
// Calls onReady once the engine has settled — either when the warm-up utterance
// ends/errors, or after a 500ms backstop (whichever comes first). This guarantees
// startStudy/startTone runs only AFTER the engine is in a stable idle state, so
// the first real card's speak() never has to cancel a still-pending prime and risk
// the interrupted → synthesis-failed cascade that hits iOS.
function primeSpeechEngine(lang, onReady){
  if(!lang){ if(onReady) onReady(); return; }
  try{ getAudioCtx(); }catch(e){}
  let fired=false;
  const done=()=>{ if(!fired){ fired=true; if(onReady) onReady(); } };
  if(typeof speechSynthesis==='undefined'){ done(); return; }
  try{
    const v=getBestVoice(lang);
    const sample=lang.startsWith('ja')?'の':'的';
    const u=new SpeechSynthesisUtterance(sample);
    u.lang=lang; u.volume=0; u.rate=1;
    if(v) u.voice=v;
    u.onend=()=>setTimeout(done,50); // brief gap — SAPI can be in a transient state right at onend on Windows
    u.onerror=done; // any error (synthesis-failed, interrupted): proceed anyway
    speechSynthesis.speak(u);
    if(speechSynthesis.paused) try{ speechSynthesis.resume(); }catch(e){}
    if(window.EW&&EW.obs) EW.obs.logEvent('tts:prime',{lang:lang,sample:sample});
  }catch(e){ done(); return; }
  setTimeout(done, 500); // backstop: never block start for more than 500ms
}

// Global generation counter — incremented on every speak() call.
// finish() and speakWithBlank callbacks check gen===_ttsGen before acting,
// so stale callbacks from superseded cards/sequences are silent no-ops.
let _ttsGen=0;

// --- TTS pause/resume recovery -----------------------------------------------
// Tracks the last text/lang passed to speak() so we can replay on tab-return.
// iOS/Android kills synthesis when the page is backgrounded; resume() silently
// fails, so we cancel the dead utterance and re-speak from scratch.
let _lastSpokenText=null, _lastSpokenLang=null;

// --- Silent pre-warm queue ---------------------------------------------------
// After real TTS ends, speak upcoming cards at volume=0 to warm the SAPI
// engine so the next real card fires immediately without the first-request lag.
// Only works for local (SAPI) voices; online/neural voices ignore volume=0.
let _prewarmQueue=[], _prewarmActive=false;

function scheduleTTSPrewarm(items){
  _prewarmQueue=items?[...items].filter(Boolean):[];
}

function _doPrewarm(){
  if(_prewarmActive||!_prewarmQueue.length) return;
  if(typeof speechSynthesis==='undefined'||speechSynthesis.speaking||speechSynthesis.pending) return;
  const item=_prewarmQueue.shift();
  if(!item||!item.text) return;
  _prewarmActive=true;
  try{
    const u=new SpeechSynthesisUtterance(item.text);
    u.lang=item.lang||'zh-CN'; u.volume=0; u.rate=1;
    const v=getBestVoice(item.lang||'zh-CN');
    // volume=0 is only respected by local SAPI voices — online/neural voices
    // ignore it and play audibly. Skip pre-warm if no confirmed local voice.
    if(!v||!v.localService){ _prewarmActive=false; return; }
    u.voice=v;
    const done=()=>{ _prewarmActive=false; if(_prewarmQueue.length) setTimeout(_doPrewarm,80); };
    u.onend=done; u.onerror=done;
    speechSynthesis.speak(u);
  }catch(e){ _prewarmActive=false; }
}

if(typeof document!=='undefined'){
  document.addEventListener('visibilitychange',function(){
    if(document.hidden) return;
    if(typeof speechSynthesis==='undefined') return;
    if(speechSynthesis.paused||(speechSynthesis.speaking&&_lastSpokenText)){
      try{ speechSynthesis.cancel(); }catch(e){}
      _prewarmActive=false;
      if(_lastSpokenText){
        const t=_lastSpokenText, l=_lastSpokenLang;
        setTimeout(function(){
          try{ if(typeof S!=='undefined'&&S.sound==='mute') return; }catch(e){}
          speak(t,l);
        },350);
      }
    }
  });
}

// Play a pre-recorded static audio file. Returns true if playback was started.
// Falls back to TTS (returns false) on any error.
function _playStaticAudio(src, onDone){
  try{
    const a=new Audio(src);
    a.onended=()=>{ if(onDone) onDone(); };
    a.onerror=()=>{ if(onDone) onDone(); }; // caller decides whether to fall back
    a.play().catch(()=>{ if(onDone) onDone(); });
    if(window.EW&&EW.obs) EW.obs.logEvent('tts:request',{text:src.split('/').pop(),lang:'static',modality:'static-audio'});
    return true;
  }catch(e){ return false; }
}

function charFont(){
  const c=activeCourse?activeCourse():null;
  if(c&&c.script==='rtl') return "font-family:'Noto Naskh Arabic','Arabic Typesetting','Arial Unicode MS',sans-serif";
  return "font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
}

function speak(text,lang,onDone){
  if(!lang) lang=activeCourse?activeCourse().langCode:'zh-CN';
  if(S.sound==='mute'){ if(onDone) onDone(); return; }
  // Static pre-recorded audio takes priority over synthesis (better quality, dialect-accurate)
  try{
    const course=activeCourse?activeCourse():null;
    if(course&&course.audioMap&&course.audioMap[text]){
      _playStaticAudio(course.audioMap[text],onDone);
      return;
    }
  }catch(e){}
  try{
    const gen=++_ttsGen;
    _lastSpokenText=text; _lastSpokenLang=lang;
    // Real speech starting — any pending prewarm is now stale; cancel before SAPI sees it
    _prewarmQueue=[]; _prewarmActive=false;
    // Refresh voice list under gesture if not yet loaded (voiceschanged can be racy on first gesture)
    if(!_voices.length){ try{ const v=speechSynthesis.getVoices(); if(v&&v.length) _voices=v; }catch(e){} }
    // Resume before cancel — cancel on a paused engine can deepen the pause on some SAPI versions
    if(speechSynthesis.paused) try{ speechSynthesis.resume(); }catch(e){}
    // Track whether we cancel so we know to delay queuing — SAPI needs ~30ms to settle after cancel
    // before the next utterance; without the delay, the new utterance often gets synthesis-failed
    const wasSpeaking=speechSynthesis.speaking||speechSynthesis.pending;
    if(wasSpeaking) speechSynthesis.cancel();
    if(speechSynthesis.paused) try{ speechSynthesis.resume(); }catch(e){}
    const cardCtx=(typeof activeCardIdx==='number'&&activeCardIdx>=0)?activeCardIdx:null;
    const u=new SpeechSynthesisUtterance(text);
    u.lang=lang; u.rate=.85;
    const v=getBestVoice(lang);
    if(v) u.voice=v;
    if(v&&window.EW&&EW.obs) EW.obs.logEvent('tts:voice',{card:cardCtx,name:(v&&v.name)||null,local:!!(v&&v.localService),lang:lang});
    if(window.EW&&EW.obs) EW.obs.logEvent('tts:request',{text:text&&text.slice(0,16),lang:lang,card:cardCtx,gen:gen});
    let fired=false;
    const finish=(cancelled)=>{
      if(fired||gen!==_ttsGen) return;
      fired=true;
      if(!cancelled&&onDone) onDone();
      if(window.EW&&EW.obs) EW.obs.logEvent('tts:end',{card:cardCtx,gen:gen});
      // Kick off silent pre-warm for upcoming cards (noop if nothing queued)
      if(!cancelled) setTimeout(_doPrewarm,150);
    };
    u.onend=()=>finish(false);
    u.onerror=(ev)=>{
      if(window.console&&console.error) console.error('TTS error:',ev&&ev.error,'text:',text,'lang:',lang);
      if(window.EW&&EW.obs) EW.obs.logEvent('tts:fail',{card:cardCtx,error:(ev&&ev.error)||'unknown',gen:gen});
      finish(true);
      if(ev&&ev.error==='synthesis-failed'){
        const recoveryGen=gen;
        if(window.EW&&EW.obs) EW.obs.logEvent('tts:recovery',{card:cardCtx,reason:'synthesis-failed',gen:recoveryGen});
        setTimeout(()=>{
          if(recoveryGen!==_ttsGen) return;
          try{
            if(speechSynthesis.speaking||speechSynthesis.pending) speechSynthesis.cancel();
            if(speechSynthesis.paused) speechSynthesis.resume();
            const recoveryU=new SpeechSynthesisUtterance(text);
            recoveryU.lang=lang; recoveryU.rate=1.0;
            const rv2=getBestVoice(lang);
            if(rv2) recoveryU.voice=rv2;
            if(rv2&&window.EW&&EW.obs) EW.obs.logEvent('tts:voice',{card:cardCtx,name:(rv2&&rv2.name)||null,local:!!(rv2&&rv2.localService),lang:lang,recovered:true});
            if(window.EW&&EW.obs) EW.obs.logEvent('tts:request',{text:text&&text.slice(0,16),lang:lang,card:cardCtx,gen:recoveryGen,recovered:true});
            recoveryU.onend=()=>{
              if(recoveryGen===_ttsGen&&onDone) onDone();
              if(window.EW&&EW.obs) EW.obs.logEvent('tts:end',{card:cardCtx,gen:recoveryGen,recovered:true});
            };
            speechSynthesis.speak(recoveryU);
            if(window.console&&console.log) console.log('TTS recovery attempt after synthesis-failed');
          }catch(e){}
        },180);
      }
    };
    if(onDone) setTimeout(()=>finish(false),5000);
    // Delay queuing when we just cancelled — SAPI on Windows Edge needs a brief idle before
    // the next speak() or it fires synthesis-failed on the new utterance
    if(wasSpeaking){
      const queueGen=gen;
      setTimeout(()=>{
        if(queueGen!==_ttsGen) return;
        if(speechSynthesis.paused) try{ speechSynthesis.resume(); }catch(e){}
        speechSynthesis.speak(u);
      },30);
    }else{
      speechSynthesis.speak(u);
    }
  }catch(e){ if(onDone) onDone(); }
}

// "doo do" error tone — descending tritone (≈E4 → B♭3) played as two sequential
// triangle-wave notes. Each note carries a paired oscillator detuned by +3 Hz,
// creating a ~3 Hz beat that adds a gentle "wah" tremolo. A small downward pitch
// glide on each note (≈13 Hz) approximates a muted-trombone formant shift.
// Contrast with beepBlank: lower register, sequential not simultaneous, descending,
// dissonant (tritone vs. fifth) — clearly "not correct" without being punishing.
// onDone fires at 520 ms.
function beepError(onDone){
  if(S.sound==='mute'){ if(onDone) onDone(); return; }
  try{
    const ctx=getAudioCtx();
    if(!ctx){ if(onDone) setTimeout(onDone,520); return; }
    const t=ctx.currentTime;
    // "doo" — near E4, glides 336→323 Hz over 270 ms
    const g1=ctx.createGain(); g1.connect(ctx.destination);
    g1.gain.setValueAtTime(0,t);
    g1.gain.linearRampToValueAtTime(0.13,t+0.018);
    g1.gain.exponentialRampToValueAtTime(0.001,t+0.27);
    const o1a=ctx.createOscillator(); o1a.type='triangle';
    o1a.frequency.setValueAtTime(336,t); o1a.frequency.linearRampToValueAtTime(323,t+0.27);
    o1a.connect(g1); o1a.start(t); o1a.stop(t+0.27);
    const g1b=ctx.createGain(); g1b.connect(ctx.destination);
    g1b.gain.setValueAtTime(0,t);
    g1b.gain.linearRampToValueAtTime(0.038,t+0.018);
    g1b.gain.exponentialRampToValueAtTime(0.001,t+0.27);
    const o1b=ctx.createOscillator(); o1b.type='triangle';
    o1b.frequency.setValueAtTime(339,t); o1b.frequency.linearRampToValueAtTime(326,t+0.27);
    o1b.connect(g1b); o1b.start(t); o1b.stop(t+0.27);
    // "do" — near B♭3, glides 239→228 Hz over 210 ms, starts after 55 ms gap
    const t2=t+0.325;
    const g2=ctx.createGain(); g2.connect(ctx.destination);
    g2.gain.setValueAtTime(0,t2);
    g2.gain.linearRampToValueAtTime(0.10,t2+0.012);
    g2.gain.exponentialRampToValueAtTime(0.001,t2+0.21);
    const o2a=ctx.createOscillator(); o2a.type='triangle';
    o2a.frequency.setValueAtTime(239,t2); o2a.frequency.linearRampToValueAtTime(228,t2+0.21);
    o2a.connect(g2); o2a.start(t2); o2a.stop(t2+0.21);
    const g2b=ctx.createGain(); g2b.connect(ctx.destination);
    g2b.gain.setValueAtTime(0,t2);
    g2b.gain.linearRampToValueAtTime(0.028,t2+0.012);
    g2b.gain.exponentialRampToValueAtTime(0.001,t2+0.21);
    const o2b=ctx.createOscillator(); o2b.type='triangle';
    o2b.frequency.setValueAtTime(242,t2); o2b.frequency.linearRampToValueAtTime(231,t2+0.21);
    o2b.connect(g2b); o2b.start(t2); o2b.stop(t2+0.21);
    if(onDone) setTimeout(onDone,520);
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
