
/* ================================================================
   EARWORM v2 — Layered Architecture
   ================================================================
   Layer 1: UI / handlers — DOM, study loop, drill rendering
   Layer 2: Data          — vocabulary D[], speak(), SRS primitives, load()/save()
   Layer 3: Scheduler     — pure scheduling engine (no DOM/side effects)
   ================================================================
   State: the single global S (this file) is the source of truth, persisted by
   load()/save() with .bak backup + migration. The old Layer-4 `State` dispatch
   object kept a parallel State._s copy that drifted (frontier-freeze bugs) — it is
   removed; recordAxisResultNew is the sole vocab engine, grammar dispatches onto S.
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
["一",[["yī",1]],"one; a(n)",[["一",1]],"numeral"],
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
["没",[["méi",2]],"not, have not (negator)",[["氵",3],["殳",4]],"adverb"],
["去",[["qù",4]],"to go",[["厶",2],["土",3]],"verb"],
["说",[["shuō",1]],"to speak, say",[["讠",2],["兑",7]],"verb"],
["到",[["dào",4]],"to arrive; to, until",[["至",6],["刂",2]],"verb/prep"],
["什么",[["shén",2],["me",0]],"what",[["亻",2],["十",2],["厶",2]],"pronoun"],
["要",[["yào",4]],"to want, need",[["女", 3], ["西", 6]],"verb/modal"],
["就",[["jiù",4]],"then, just, right away",[["尤",4],["京",8]],"adverb"],
["会",[["huì",4]],"can, will, meeting",[["人",2],["云",4]],"modal verb"],
["能",[["néng",2]],"can, be able to",[["匕", 2], ["匕", 2], ["月", 4]],"modal verb"],
["还",[["hái",2]],"still, yet, also",[["辶",3],["不",4]],"adverb"],
["上",[["shàng",4]],"up, above, on",[["一",1],["丨",1]],"noun/verb"],
["下",[["xià",4]],"down, below, under",[["一",1],["卜",2]],"noun/verb"],
["只",[["zhǐ",3]],"only, just",[["口",3],["八",2]],"adverb"],
["大",[["dà",4]],"big, large",[["大",3]],"adjective"],
["小",[["xiǎo",3]],"small, little",[["小",3]],"adjective"],
["人",[["rén",2]],"person, people",[["人",2]],"noun"],
["中",[["zhōng",1]],"middle, center",[["丨",1],["囗",3]],"noun/adj"],
["国",[["guó",2]],"country, nation",[["囗",3],["玉",5]],"noun"],
["家",[["jiā",1]],"home, family",[["宀",3],["豕",7]],"noun"],
["自己",[["zì",4],["jǐ",3]],"oneself, self",[["自",6],["己",3]],"pronoun"],
["起",[["qǐ",3]],"to rise, start; (一起: together)",[["走",7],["己",3]],"verb"],
["看",[["kàn",4]],"to look, watch, read",[["手",4],["目",5]],"verb"],
["想",[["xiǎng",3]],"to think, want, miss",[["心",4],["相",9]],"verb"],
["知道",[["zhī",1],["dào",4]],"to know",[["口", 3], ["辶", 3], ["矢", 5], ["首", 9]],"verb"],
["时间",[["shí",2],["jiān",1]],"time",[["寸", 3], ["门", 3], ["日", 4], ["日", 4]],"noun"],
["时候",[["shí",2],["hou",0]],"time, moment; when",[["日",4],["寸",3],["亻",2]],"noun"],
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
["点",[["diǎn",3]],"a bit, point; (一点: a little)",[["占",5],["灬",4]],"noun/adverb"],
["儿",[["er",0]],"erhua suffix; (一点儿: a little bit)",[["儿",2]],"suffix"],
["少",[["shǎo",3]],"few, little",[["丿", 1], ["小", 3]],"adjective"],
["很",[["hěn",3]],"very",[["彳",3],["艮",6]],"adverb"],
["太",[["tài",4]],"too (excessively)",[["丶", 1], ["大", 3]],"adverb"],
["都",[["dōu",1]],"all, both",[["阝", 2], ["者", 8]],"adverb"],
["问",[["wèn",4]],"to ask",[["门",3],["口",3]],"verb"],
["题",[["tí",2]],"topic, problem; (问题: problem)",[["是",9],["页",6]],"noun"],
["也",[["yě",3]],"also, too",[["乙",1],["也",3]],"adverb"],
["和",[["hé",2]],"and, with, harmony",[["口",3],["禾",5]],"conjunction"],
["但是",[["dàn",4],["shì",4]],"but, however",[["亻", 2], ["日", 4], ["旦", 5], ["疋", 5]],"conjunction"],
["因为",[["yīn",1],["wèi",4]],"because",[["囗",3],["大",3],["爪",4],["田",5]],"conjunction"],
["所以",[["suǒ",3],["yǐ",3]],"therefore, so",[["乙", 1], ["人", 2], ["户", 4], ["斤", 4]],"conjunction"],
["可以",[["kě",3],["yǐ",3]],"may, can, okay",[["乙", 1], ["丁", 2], ["人", 2], ["口", 3]],"modal verb"],
["以",[["yǐ",3]],"by means of; in order to",[["以",4]],"particle"],
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
// Load persisted user-added words into the active deck at startup.
(function(){
  try{
    var uw=JSON.parse(localStorage.getItem('earworm-user-words-v1'))||[];
    uw.forEach(function(e){ D.push(e); });
  }catch(e){}
})();

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
  ["من",[["mn",0]],"from, of",[],"preposition"],
  ["على",[["3la",0]],"on, upon",[],"preposition"],
  ["مع",[["m3",0]],"with, together",[],"preposition"],
  ["ب",[["b",0]],"in, with, by",[],"preposition"],
  ["أنا",[["a",0],["na",0]],"I",[],"pronoun"],
  ["أنت",[["int",0]],"you (m.sg.)",[],"pronoun"],
  ["هو",[["hu",0]],"he",[],"pronoun"],
  ["هي",[["hi",0]],"she",[],"pronoun"],
  ["إحنا",[["i7",0],["na",0]],"we",[],"pronoun"],
  ["شو",[["shu",0]],"what",[],"pronoun"],
  ["مين",[["miin",0]],"who",[],"pronoun"],
  ["وين",[["wiin",0]],"where",[],"pronoun"],
  ["كيف",[["kif",0]],"how",[],"adverb"],
  ["كتير",[["ktir",0]],"very, a lot",[],"adverb"],
  ["شوي",[["shwi",0]],"a little, a bit",[],"adverb"],
  ["هلق",[["hal",0],["la2",0]],"now",[],"adverb"],
  ["هيك",[["hek",0]],"like this, thus",[],"adverb"],
  ["لا",[["la",0]],"no",[],"adverb"],
  ["بس",[["bs",0]],"only, but, enough",[],"particle"],
  ["يلا",[["ya",0],["la",0]],"let's go, come on",[],"interjection"],
  ["يعني",[["y3",0],["ni",0]],"means, like, you know",[],"particle"],
  // Batch 2 — negation · modals · demonstratives · pronouns · verbs · nouns
  ["مش",[["msh",0]],"not, isn't",[],"particle"],
  ["ما",[["ma",0]],"not, didn't (negation)",[],"particle"],
  ["بدّي",[["bid",0],["di",0]],"I want",[],"modal"],
  ["رح",[["r7",0]],"going to (future)",[],"particle"],
  ["لازم",[["laa",0],["zm",0]],"must, have to",[],"modal"],
  ["هاد",[["haad",0]],"this (m.)",[],"pronoun"],
  ["هاي",[["haay",0]],"this (f.)",[],"pronoun"],
  ["شي",[["shi",0]],"thing, something",[],"noun"],
  ["ناس",[["naas",0]],"people",[],"noun"],
  ["يوم",[["yoom",0]],"day",[],"noun"],
  ["وقت",[["w2t",0]],"time",[],"noun"],
  ["أنتو",[["in",0],["to",0]],"you (pl.)",[],"pronoun"],
  ["هنّي",[["hun",0],["ni",0]],"they",[],"pronoun"],
  ["حكى",[["7k",0],["a",0]],"spoke, talked",[],"verb"],
  ["شاف",[["shaaf",0]],"saw",[],"verb"],
  ["أجا",[["a",0],["ja",0]],"came",[],"verb"],
  ["راح",[["raa7",0]],"went",[],"verb"],
  ["بيت",[["bayt",0]],"house, home",[],"noun"],
  // Batch 3 — verbs, adjectives, location, nouns, connectives
  ["كان",[["kaan",0]],"was, were",[],"verb"],
  ["قال",[["2aal",0]],"said",[],"verb"],
  ["عمل",[["3ml",0]],"made, did",[],"verb"],
  ["أكل",[["akl",0]],"ate",[],"verb"],
  ["شرب",[["shrb",0]],"drank",[],"verb"],
  ["صار",[["Saar",0]],"became, happened",[],"verb"],
  ["رجع",[["rj3",0]],"returned",[],"verb"],
  ["بيحب",[["bi",0],["7b",0]],"loves, likes",[],"verb"],
  ["بيعرف",[["bi",0],["3rf",0]],"knows",[],"verb"],
  ["عندي",[["3nd",0],["i",0]],"I have",[],"verb"],
  ["كبير",[["kbiir",0]],"big, old",[],"adjective"],
  ["صغير",[["S8iir",0]],"small, young",[],"adjective"],
  ["جديد",[["jdiid",0]],"new",[],"adjective"],
  ["حلو",[["7lu",0]],"nice, pretty, sweet",[],"adjective"],
  ["كويس",[["kwis",0]],"good, fine",[],"adjective"],
  ["صح",[["S7",0]],"right, correct",[],"adjective"],
  ["غلط",[["8lT",0]],"wrong, mistake",[],"adjective"],
  ["هون",[["hoon",0]],"here",[],"adverb"],
  ["هناك",[["hn",0],["aak",0]],"there",[],"adverb"],
  ["فوق",[["foo2",0]],"above, up",[],"adverb"],
  ["تحت",[["t7t",0]],"under, below",[],"adverb"],
  ["جنب",[["jnb",0]],"next to, beside",[],"preposition"],
  ["ولد",[["wld",0]],"boy, kid",[],"noun"],
  ["بنت",[["bnt",0]],"girl",[],"noun"],
  ["اسم",[["ism",0]],"name",[],"noun"],
  ["شغل",[["sh8l",0]],"work, job",[],"noun"],
  ["أهل",[["ahl",0]],"family",[],"noun"],
  ["و",[["w",0]],"and",[],"conjunction"],
  ["أو",[["aw",0]],"or",[],"conjunction"],
  ["إذا",[["i",0],["dhaa",0]],"if",[],"particle"],
];

/* ============ VIETNAMESE — the generative SEED (16 atoms) ============ */
// First space-delimited course to actually run sentences (Arabic has no sentence
// content yet) — i.e. the first real exercise of the segmentation seam. Schema
// matches D_MANDARIN. Slot 1 holds the syllabic form with tone=0 (Vietnamese tone
// is carried IN the orthography by diacritic — hasTone:false for now; tone-as-
// diacritic drilling is a deferred refinement, see MIGRATION lessons). Slot 3
// (radicals) empty — no ideographic decomposition. ORDER = introduction order:
// chosen so early atoms compose into sentences (tôi/đi/là before the particles).
// This IS the seed measured by computeSeedDelta() — see SEED_VI / THEORY.md §2.1.
// ⚠ single-author, unvalidated Vietnamese.
let D_VI=[
  ["tôi",   [["tôi",0]],            "I, me",                       [],"pronoun"],
  ["đi",    [["đi",0]],             "to go",                       [],"verb"],
  ["là",    [["là",0]],             "to be (copula)",              [],"verb"],
  ["người", [["người",0]],          "person, people",              [],"noun"],
  ["tốt",   [["tốt",0]],            "good",                        [],"adjective"],
  ["rất",   [["rất",0]],            "very",                        [],"adverb"],
  ["không", [["không",0]],          "not; (yes/no question)",      [],"adverb"],
  ["một",   [["một",0]],            "one; a",                      [],"numeral"],
  ["cái",   [["cái",0]],            "general classifier",          [],"measure word"],
  ["của",   [["của",0]],            "of, 's (possessive)",         [],"particle"],
  ["và",    [["và",0]],             "and",                         [],"conjunction"],
  ["cũng",  [["cũng",0]],           "also, too",                   [],"adverb"],
  ["ở",     [["ở",0]],              "to be at, in",                [],"verb/prep"],
  ["rồi",   [["rồi",0]],            "already (perfective)",        [],"particle"],
  ["chưa",  [["chưa",0]],           "not yet",                     [],"adverb"],
  ["à",     [["à",0]],              "(yes/no question particle)",  [],"particle"],
];


/* ============ STATE ============ */
// KEY is the ACTIVE course's localStorage key — reassigned by switchCourse().
let KEY='earworm-mandarin-v1';
const SCHEMA_VERSION=2;
function defaultState(){
  return {cards:{},xp:0,lastDay:null,streak:0,sound:'auto',decks:{},activeDeck:'core',dailyCards:0,dailyDate:'',uniqueSeen:[],mult:1.0,multStreak:0,seenColls:[],grammarMastery:{},totalSeen:0,
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
function migrateState(obj){
  if(!obj._v||obj._v<2){ obj._v=2; } // v1 (no _v) → v2: stamp only, no structural change
  return obj;
}
function load(){
  function _tryParse(key){
    try{ const r=localStorage.getItem(key); return r?JSON.parse(r):null; }catch(e){ return null; }
  }
  try{
    const saved=migrateState(_tryParse(KEY)||_tryParse(KEY+'.bak')||{});
    S=Object.assign({},defaultState(),saved);
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
    if(!S.grammar||typeof S.grammar!=='object') S.grammar={};
    if(!S.decks||typeof S.decks!=='object') S.decks={};
    if(typeof S.totalSeen!=='number') S.totalSeen=0;
  }catch(e){ console.warn('Load failed, fresh start',e); }
}
function save(){
  try{
    const prev=localStorage.getItem(KEY);
    if(prev) try{ localStorage.setItem(KEY+'.bak',prev); }catch(e){}
    S._v=SCHEMA_VERSION;
    localStorage.setItem(KEY,JSON.stringify(S));
  }catch(e){}
}
function exportState(){
  try{
    const payload=JSON.stringify({_export:{version:SCHEMA_VERSION,course:KEY,exportedAt:Date.now()},state:S},null,2);
    const blob=new Blob([payload],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download='earworm-state-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }catch(e){ console.error('exportState failed',e); }
}
function importState(json){
  try{
    const parsed=JSON.parse(json);
    let obj=parsed.state||parsed;
    obj=migrateState(obj);
    S=Object.assign({},defaultState(),obj);
    save();
    location.reload();
    return {ok:true};
  }catch(e){ console.error('importState failed',e); return {ok:false,error:String(e)}; }
}
try{ window.exportState=exportState; window.importState=importState; }catch(e){}

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
    // ENGINE-2 RETIRED (hardening 2026-06-19): the ANSWER_VOCAB dispatch ran a SECOND
    // recording engine (Scheduler.recordAnswer → State._s) whose card/xp writes were
    // already overwritten by recordAxisResultNew (engine 1) and the answer handler via
    // call ordering — pure redundancy plus the fragile early Object.assign(S, State._s)
    // on the vocab path (the dual-state drift that caused the frontier-freeze class of
    // bugs). recordAxisResultNew on live S is now the SOLE vocab engine. Grammar still
    // uses dispatch (ANSWER_GRAMMAR) — it has no engine-1 equivalent.
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
//  .lastReviewAt {object} Wall-clock ms (Date.now()) of the last review per axis
//                        {meaning, pos, tone}. DURABLE real-time substrate — NOT read by
//                        the count-based scheduler (axisDue is authoritative for spacing).
//                        Captured for the future time-between-session scheduler.
//
//  .reviewLog {object}   Per-axis capped history of [ts, correct(1|0), latencyMs] triples
//                        {meaning, pos, tone}, newest last, ≤REVIEW_LOG_MAX per axis.
//                        DURABLE measurement substrate for forgetting-curve / ability
//                        fitting. Write-only today — nothing consumes it yet, but review
//                        timing/outcome cannot be retrofitted, so it is logged now.
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
// masteryScore is now DERIVED from axisStage.meaning — the single authoritative
// competence signal. The old independent .m accumulator is retired (addMastery is a
// no-op below). This maps progression stage 0..5 → 0..4 for the display tiers
// (state) and the difficulty stages (meaningStage/toneStage). A seen stage-0 card
// reads as "learning" (>0, not "unseen"); stage ≥4 reads "mastered". Per-modality
// difficulty texture now lives in MODALITY_PROFILE, not in this scalar — that
// separation is what let competence collapse onto one signal.
const MASTERY_FROM_STAGE=[0.6, 1.5, 2.3, 3.0, 4.0, 4.0];
function masteryScore(i){
  const ci=card(i);
  if(!ci.seen && !(ci.exp>0)) return 0;
  const st=(ci.axisStage&&ci.axisStage.meaning)||0;
  return Math.min(MASTERY_MAX, MASTERY_FROM_STAGE[Math.min(st, MASTERY_FROM_STAGE.length-1)]);
}
function isMastered(i){ return masteryScore(i)>=MASTERY_MAX; }

// ── FORMAL PER-MODALITY DIFFICULTY MODEL ──────────────────────────────────
// One declared source of truth, replacing the ~20 hand-tuned addMastery nudges
// scattered across modalities. Each test modality is an evidence channel
// (acquisition model: recall < discrimination < incidental) at a distinct strength.
//   diff ∈ [0,1): how much harder than baseline recognition to be correct. Lowers
//     the wager line P_algo (_pCorrect) so a correct on a harder ask earns a bigger
//     edge — the line tells the truth about what's being asked.
//   ev: evidence weight — how much a correct advances progression. Declared here so
//     the whole difficulty model lives in one place; wired into graduation in Phase 3
//     (demonstrating a word on a harder channel graduates it faster).
const MODALITY_PROFILE = {
  'flash':        { diff: 0.00, ev: 0.0 },  // exposure only — no test, no evidence
  'mc-fwd':       { diff: 0.00, ev: 1.0 },  // baseline recognition (char→meaning)
  'mc':           { diff: 0.00, ev: 1.0 },
  'pos':          { diff: 0.10, ev: 1.0 },
  'tone':         { diff: 0.15, ev: 1.0 },  // phonological discrimination
  'mc-rev':       { diff: 0.18, ev: 1.3 },  // meaning→char, production-leaning
  'cloze':        { diff: 0.25, ev: 1.5 },  // contextual recall
  'comprehension':{ diff: 0.30, ev: 1.6 },
  'word-order':   { diff: 0.35, ev: 1.8 },  // syntactic production (hardest)
};
function modalityDiff(mod){ const p=MODALITY_PROFILE[mod]; return p?p.diff:0; }
function modalityEv(mod){ const p=MODALITY_PROFILE[mod]; return p?p.ev:1; }

// ── GENERATIVE BASIS (min set-cover to PRODUCE sentences) ──────────────────
// CORE PROBLEM of the project: the FREQUENCY basis (Zipf — what to learn for
// comprehension) and the GENERATIVE basis (the minimum atoms that close the
// grammar's clause templates — what you need to PRODUCE sentences) are different
// optimizations over the same atoms, and their DISSONANCE drives curriculum design.
// Pure Zipf can leave you "knowing" N words yet unable to form a clause (no copula,
// negator, classifier...). This computes the generative basis per construction tier
// and quantifies the dissonance against frequency order.
//
// The set-cover ALGORITHM is language-general; GRAMMAR_SPEC is the per-language
// module (deck-gen Phase 0). Roles are filled by the LOWEST-frequency-rank atom that
// matches — a specific function word (char) or a POS class (token-exact on '/').
// Tie-breaking covers toward high-Zipf fillers is where the two bases reconcile.
// The spec is now LANGUAGE-AGNOSTIC: tiers × roles is the universal clause-template
// skeleton (referent, copula, negator, classifier, aspect…), plus a capability label
// per tier. What's language-specific — WHICH atom fills each function-word role — lives
// on the course object as `grammarRoles` (role→atom), the same per-course-flag pattern
// as segment/readingIsWord/hasTone. POS-class roles (`pos:`) were already agnostic.
// `cap`/`desc` describe the CAPABILITY a tier closes (also universal). Example sentence
// is per-course (built from the tier's atoms / the course's example bank).
const GRAMMAR_SPEC = {
  tiers: [
    { name:'T1 predication',      cap:'PREDICATE',     desc:'say what something is, is like, or does',
      roles:[ {role:'referent',pos:'pronoun'}, {role:'lexical-verb',pos:'verb'}, {role:'copula'}, {role:'nominal',pos:'noun'}, {role:'adjective',pos:'adjective'}, {role:'degree'} ] },
    { name:'T2 transitive/neg/Q', cap:'NEGATE & ASK',  desc:'deny and ask yes/no questions',
      roles:[ {role:'negator'}, {role:'negator-perf'}, {role:'q-particle'} ] },
    { name:'T3 modify/quantify',  cap:'MODIFY & COUNT', desc:'possess, modify, and quantify',
      roles:[ {role:'modifier'}, {role:'numeral',pos:'numeral'}, {role:'classifier'} ] },
    { name:'T4 adjunct/aspect',   cap:'PLACE & ASPECT', desc:'locate and mark completion',
      roles:[ {role:'coverb'}, {role:'aspect'} ] },
    { name:'T5 complex',          cap:'CONNECT',        desc:'join clauses',
      roles:[ {role:'conjunction',pos:'conjunction'}, {role:'additive-adv'} ] }
  ]
};
function computeGenerativeBasis(deck, spec){
  deck=deck||(typeof D!=='undefined'?D:[]); spec=spec||GRAMMAR_SPEC;
  // per-course role→atom map; function-word fillers are auto-reserved from generic POS picks
  let roleMap={}; try{ const c=(typeof activeCourse==='function')&&activeCourse(); roleMap=(c&&c.grammarRoles)||{}; }catch(e){}
  const reserved=new Set([...(spec.reserved||[]), ...Object.values(roleMap)]);
  const charIdx=c=>deck.findIndex(d=>d[0]===c);
  const toks=i=>(deck[i][4]||'').split('/');
  const lowestPOS=tok=>{ for(let i=0;i<deck.length;i++){ if(toks(i).indexOf(tok)>=0 && !reserved.has(deck[i][0])) return i; } return -1; };
  const fill=r=>{
    if(r.pos!=null) return lowestPOS(r.pos);
    if(r.char!=null) return charIdx(r.char);                 // legacy/explicit filler
    if(r.role!=null && roleMap[r.role]!=null) return charIdx(roleMap[r.role]); // agnostic resolve
    return -1;
  };
  const cum=new Map(); const tiers=[];
  spec.tiers.forEach(t=>{
    const before=new Set(cum.keys());
    t.roles.forEach(r=>{ const idx=fill(r); if(idx>=0){ const ch=deck[idx][0]; if(!cum.has(ch)) cum.set(ch,{role:r.role,idx:idx}); } });
    const atoms=[...cum.values()].sort((a,b)=>a.idx-b.idx);
    const m=atoms.length, deep=atoms.length?Math.max.apply(null,atoms.map(a=>a.idx)):0;
    const deferred=atoms.filter(a=>a.idx>=m);   // generatively required but beyond a same-size pure-Zipf deck
    const newAtoms=[...cum.entries()].filter(e=>!before.has(e[0])).map(e=>({ch:e[0], rank:e[1].idx, role:e[1].role}));
    tiers.push({ name:t.name, cap:t.cap, desc:t.desc, basisSize:m, deepestRank:deep, reachRatio:m?Math.round(deep/m*100)/100:0,
      deferredCount:deferred.length, deferred:deferred.map(a=>deck[a.idx][0]+'#'+a.idx), atoms:newAtoms });
  });
  const basis=[...cum.values()].sort((a,b)=>a.idx-b.idx).map(a=>({ch:deck[a.idx][0], rank:a.idx, role:a.role}));
  return { tiers:tiers, basis:basis, basisSize:basis.length };
}
try{ window.computeGenerativeBasis=computeGenerativeBasis; window.GRAMMAR_SPEC=GRAMMAR_SPEC; window.GRAMMAR_SPEC_ZH=GRAMMAR_SPEC; }catch(e){}

// ── SUBSTITUTION DISTANCE — the THIRD cost axis (the L1→L2 diff) ───────────
// Acquisition isn't learning L2 from zero; the learner owns a generative engine
// (L1). The real cost of an atom is its SUBSTITUTION DISTANCE from L1, not its
// frequency or grammatical role. This is the (L1,L2)-PAIR language module —
// authored for English→Mandarin over the FULL 114-atom deck, governed by the
// CLASSIFICATION RUBRIC in THEORY.md §3.1 (so EN→VN is derived identically and the
// σ-delta is comparable). Single-author pass; independent validation still pending.
//   c: 'transparent'  — L1 has same concept AND category; relabel (positive transfer)
//      'divergent'    — L2 category/distinction L1 LACKS; learn new (no wrong instinct)
//      'false-friend' — salient L1 atom that MISFIRES (negative transfer; un-learn)
//   d ∈ [0,1] ≈ learning cost WITHIN class. σ EXCLUDES phonology, orthography, and
//     template word-order (those are other axes) — so it stays L2-comparable.
const SUBSTITUTION_EN_ZH = {
  '的':{c:'divergent',   d:0.80, n:'possessive + relativizer + modifier marker — no single English analog'},
  '我':{c:'transparent', d:0.15, n:'I/me — same pronoun role (no case form)'},
  '你':{c:'transparent', d:0.15, n:'you'},
  '是':{c:'false-friend',d:0.85, n:'copula, but NOT before predicate adjectives (我很好 not 我是好); no tense'},
  '了':{c:'divergent',   d:0.90, n:'perfective / change-of-state aspect particle — English has tense, not aspect'},
  '一':{c:'transparent', d:0.20, n:'one/a — numeral (obligatory classifier after, tone sandhi)'},
  '不':{c:'transparent', d:0.30, n:'not (concept transfers; the 不/没 split itself is divergent)'},
  '他':{c:'transparent', d:0.15, n:'he/him'},
  '她':{c:'transparent', d:0.20, n:'she/her (homophone tā with 他 — written distinction only)'},
  '们':{c:'divergent',   d:0.70, n:'plural marker — pronouns/human nouns only, never after numbers'},
  '吗':{c:'divergent',   d:0.85, n:'yes/no question particle — English uses inversion/intonation'},
  '在':{c:'divergent',   d:0.70, n:'coverb/locative + progressive aspect + existential — no clean analog'},
  '有':{c:'transparent', d:0.35, n:'have (possession transparent; existential "there is" diverges)'},
  '这':{c:'transparent', d:0.35, n:'this (demonstrative; needs a classifier; used where Eng says "the/it")'},
  '那':{c:'transparent', d:0.35, n:'that (same caveats as 这)'},
  '个':{c:'divergent',   d:0.90, n:'general classifier — English has no obligatory measure word'},
  '好':{c:'transparent', d:0.20, n:'good/well — adjective (predicative needs 很)'},
  '来':{c:'transparent', d:0.30, n:'come (deictic motion; directional-complement use diverges)'},
  '没':{c:'divergent',   d:0.75, n:'negator for 有 / past — the 不/没 aspectual split English lacks'},
  '去':{c:'transparent', d:0.30, n:'go (directional-complement use diverges)'},
  '说':{c:'transparent', d:0.25, n:'speak/say'},
  '到':{c:'transparent', d:0.45, n:'arrive (transparent); as resultative complement 看到 diverges'},
  '什么':{c:'transparent',d:0.40, n:'what — interrogative pronoun EXISTS in Eng; only in-situ placement diverges (construction, not σ)'},
  '要':{c:'false-friend',d:0.70, n:'want + need-to + future "will" + "be going to" — polysemous modal'},
  '就':{c:'false-friend',d:0.90, n:'focus/emphasis adverb (then/just/precisely) — no clean English analog, instinct misfires'},
  '会':{c:'false-friend',d:0.80, n:'modal: learned ability "can" + future likelihood "will"; overlaps 能/可以'},
  '能':{c:'false-friend',d:0.75, n:'modal "can" (ability/possibility) — overlaps 会/可以, distribution differs'},
  '还':{c:'false-friend',d:0.85, n:'polysemous adverb still/yet/also/even — English instinct misfires'},
  '上':{c:'divergent',   d:0.65, n:'localizer/POSTposition (在桌子上 = at-table-up); also directional complement'},
  '下':{c:'divergent',   d:0.65, n:'localizer/postposition (under/below); directional complement'},
  '只':{c:'transparent', d:0.45, n:'only/just (adverb; homograph with classifier zhī; pre-verbal)'},
  '大':{c:'transparent', d:0.25, n:'big (predicative adj needs 很)'},
  '小':{c:'transparent', d:0.25, n:'small'},
  '人':{c:'transparent', d:0.20, n:'person/people (no plural inflection)'},
  '中':{c:'transparent', d:0.35, n:'middle/center (localizer use 中 diverges)'},
  '国':{c:'transparent', d:0.30, n:'country'},
  '家':{c:'transparent', d:0.35, n:'home/family (also a classifier + "-ist" suffix)'},
  '自己':{c:'transparent',d:0.40,n:'oneself/self (no person/number agreement unlike myself/yourself)'},
  '起':{c:'divergent',   d:0.60, n:'rise/start — mostly bound directional complement (起来/一起), rarely standalone'},
  '看':{c:'transparent', d:0.35, n:'look/watch/read/visit — polysemous'},
  '想':{c:'false-friend',d:0.60, n:'think + want + miss(long for) — English instinct splits the senses'},
  '知道':{c:'transparent',d:0.45,n:'know-a-fact (the 知道/认识 know-fact vs know-person split is the divergence)'},
  '时间':{c:'transparent',d:0.30,n:'time (duration)'},
  '时候':{c:'transparent',d:0.45, n:'moment/time (noun maps); the 的时候 "when"-clause is a construction, not σ'},
  '年':{c:'transparent', d:0.30, n:'year (acts as its own measure word — 一年)'},
  '天':{c:'transparent', d:0.35, n:'day/sky/heaven (own measure word)'},
  '今天':{c:'transparent',d:0.20,n:'today'},
  '明天':{c:'transparent',d:0.20,n:'tomorrow'},
  '昨天':{c:'transparent',d:0.20,n:'yesterday'},
  '吃':{c:'transparent', d:0.20, n:'eat'},
  '喝':{c:'transparent', d:0.20, n:'drink'},
  '水':{c:'transparent', d:0.15, n:'water'},
  '饭':{c:'transparent', d:0.30, n:'cooked rice / meal (吃饭 = eat-rice = have a meal)'},
  '茶':{c:'transparent', d:0.20, n:'tea'},
  '学':{c:'transparent', d:0.25, n:'study/learn'},
  '学生':{c:'transparent',d:0.20,n:'student'},
  '老师':{c:'transparent',d:0.30,n:'teacher (老 prefix is bleached honorific, not "old")'},
  '朋友':{c:'transparent',d:0.20,n:'friend'},
  '爱':{c:'transparent', d:0.25, n:'love'},
  '喜欢':{c:'transparent',d:0.25,n:'like'},
  '做':{c:'transparent', d:0.30, n:'do/make (one verb covers Eng do + make)'},
  '工作':{c:'transparent',d:0.25,n:'work/job (noun + verb)'},
  '钱':{c:'transparent', d:0.20, n:'money'},
  '买':{c:'transparent', d:0.20, n:'buy (mǎi/mài tone pair with 卖 is phonological, not substitution)'},
  '卖':{c:'transparent', d:0.25, n:'sell'},
  '多':{c:'transparent', d:0.40, n:'many/much (predicative + question 多少 use diverges)'},
  '点':{c:'divergent',   d:0.55, n:'o\'clock measure + "a bit" (一点) + dot/point — polysemous, partly classifier'},
  '儿':{c:'divergent',   d:0.60, n:'erhua diminutive suffix — no English category (its phonological difficulty is EXCLUDED from σ)'},
  '少':{c:'transparent', d:0.35, n:'few/little'},
  '很':{c:'false-friend',d:0.70, n:'looks like "very" but OBLIGATORY + bleached before predicate adjectives'},
  '太':{c:'transparent', d:0.45, n:'too/excessively (太…了 frame)'},
  '都':{c:'divergent',   d:0.55, n:'all — but obligatorily PRE-verbal, quantifies the subject leftward; a distribution Eng "all" lacks'},
  '问':{c:'transparent', d:0.25, n:'ask'},
  '题':{c:'transparent', d:0.40, n:'topic/question (bound: 问题)'},
  '也':{c:'transparent', d:0.40, n:'also/too — fixed PRE-verbal position (我也去)'},
  '和':{c:'false-friend',d:0.55, n:'and/with — conjoins NOUNS only, not clauses/verbs'},
  '但是':{c:'transparent',d:0.30,n:'but/however (clause conjunction)'},
  '因为':{c:'transparent',d:0.45,n:'because (often paired 因为…所以…, unlike single English "because")'},
  '所以':{c:'transparent',d:0.45,n:'therefore/so (paired with 因为)'},
  '可以':{c:'false-friend',d:0.70,n:'may/can (permission) — overlaps 会/能'},
  '以':{c:'divergent',   d:0.80, n:'literary bound morpheme (以后/可以/以为) — not standalone in modern usage'},
  '没有':{c:'divergent', d:0.60, n:'not have / there isn\'t — negated existence (the 不/没 system again)'},
  '现在':{c:'transparent',d:0.25,n:'now'},
  '里':{c:'divergent',   d:0.65, n:'localizer/postposition (在…里) — English preposition precedes'},
  '外':{c:'divergent',   d:0.60, n:'outside — localizer/postposition'},
  '前':{c:'divergent',   d:0.55, n:'front/before — localizer (spatial + temporal)'},
  '后':{c:'divergent',   d:0.55, n:'back/after — localizer (以后 temporal)'},
  '左':{c:'transparent', d:0.35, n:'left (used as localizer 左边)'},
  '右':{c:'transparent', d:0.35, n:'right'},
  '走':{c:'transparent', d:0.35, n:'walk / leave-depart (polysemy)'},
  '跑':{c:'transparent', d:0.25, n:'run'},
  '开':{c:'false-friend',d:0.55, n:'open + turn-on + drive + start — very polysemous, instinct picks "open"'},
  '关':{c:'transparent', d:0.40, n:'close/shut + turn-off (polysemy)'},
  '门':{c:'transparent', d:0.20, n:'door/gate'},
  '车':{c:'transparent', d:0.20, n:'car/vehicle'},
  '路':{c:'transparent', d:0.20, n:'road/path/route'},
  '飞机':{c:'transparent',d:0.20,n:'airplane'},
  '火车':{c:'transparent',d:0.25,n:'train (fire-car compound, meaning transparent)'},
  '电话':{c:'transparent',d:0.25,n:'telephone (electric-speech)'},
  '手机':{c:'transparent',d:0.25,n:'mobile phone (hand-machine)'},
  '电脑':{c:'transparent',d:0.25,n:'computer (electric-brain)'},
  '书':{c:'transparent', d:0.20, n:'book'},
  '写':{c:'transparent', d:0.20, n:'write'},
  '读':{c:'transparent', d:0.30, n:'read (overlaps 看 for reading)'},
  '听':{c:'transparent', d:0.20, n:'listen'},
  '音乐':{c:'transparent',d:0.20,n:'music'},
  '名字':{c:'transparent',d:0.20,n:'name'},
  '谁':{c:'transparent', d:0.40, n:'who — interrogative pronoun exists; in-situ placement is construction-level'},
  '哪里':{c:'transparent',d:0.45, n:'where — interrogative exists; in-situ; 里 component is morphology (excluded)'},
  '怎么':{c:'transparent',d:0.45, n:'how — interrogative manner adverb exists; polysemous how/why-so; in-situ'},
  '为什么':{c:'transparent',d:0.45,n:'why (为+什么 = for-what; wh-in-situ)'},
  '对':{c:'false-friend',d:0.55, n:'correct + coverb "toward/to" (对我说) + agreement — polysemous'},
  '错':{c:'transparent', d:0.30, n:'wrong/mistake (adjective)'},
  '再见':{c:'transparent',d:0.25,n:'goodbye (again-see — set phrase)'}
};
function substitution(ch){ return SUBSTITUTION_EN_ZH[ch] || null; }
function substitutionDist(ch){ const s=SUBSTITUTION_EN_ZH[ch]; return s?s.d:null; }

// Fold all three axes over the generative basis: frequency rank × generative role
// × substitution class → the REAL learning load (transparent atoms are ~free
// relabels; divergent + false-friend carry it).
function computeThreeAxisBasis(){
  const g=computeGenerativeBasis();
  const atoms=g.basis.map(a=>{ const s=substitution(a.ch); return { ch:a.ch, freqRank:a.rank, role:a.role, subClass:s?s.c:'unclassified', dist:s?s.d:null, note:s?s.n:'' }; });
  const byClass={transparent:0, divergent:0, 'false-friend':0, unclassified:0};
  let load=0;
  atoms.forEach(a=>{ byClass[a.subClass]=(byClass[a.subClass]||0)+1; if(a.dist!=null) load+=a.dist; });
  return { basisSize:g.basisSize, byClass:byClass,
    effectiveLoad:Math.round(load*100)/100,                       // sum of substitution distance
    nominalMax:g.basisSize,                                       // if every atom were brand-new
    realLoadCount:(byClass.divergent + byClass['false-friend']),  // atoms with no crutch
    transparentSharePct:Math.round((byClass.transparent/g.basisSize)*100),
    atoms:atoms };
}
try{ window.SUBSTITUTION_EN_ZH=SUBSTITUTION_EN_ZH; window.computeThreeAxisBasis=computeThreeAxisBasis; }catch(e){}

// ── THE SEED — the canonical minimal generative deck (THEORY.md §2.1) ───────
// seed(L) = a tie-broken minimum set-cover over the UNIVERSAL role set: one filler
// per obligatory role across the construction tiers. The role set is universal and
// the size is canonical (~16 for complex sentences); MEMBERSHIP is not unique — the
// tie-break is the three-axis negotiation (φ most-frequent filler, σ cheapest-to-learn).
//
// SEED_VI is the Vietnamese (L2) seed for an ENGLISH (L1) learner — the first
// non-Mandarin instantiation, authored to MIRROR the Mandarin tier structure so the
// two are σ-comparable. It carries its OWN substitution module inline (the EN→VN map):
// the σ-classes are derived by the SAME rubric (THEORY.md §3.1) as EN→ZH, which is what
// makes computeSeedDelta() a legitimate measurement rather than a relabeling.
//
// ⚠ SINGLE-AUTHOR, UNVALIDATED. My Vietnamese is best-effort; freq ranks are ordinal
// estimates, the σ-classes/d-scalars are one judged pass. This is the MEASUREMENT
// ARTIFACT for the EN→VN vs EN→ZH experiment, not a playable course (which additionally
// needs tokenization generalization, tone-as-diacritic, TTS — see roadmap).
//   role : the universal generative role this atom fills (parallel to GRAMMAR_SPEC_ZH)
//   zh   : the Mandarin atom that fills the SAME role (the typological twin pairing)
//   c/d/n: substitution class / within-class cost / note (same schema as EN→ZH)
const SEED_VI = [
  // T1 predication
  {w:'tôi',   role:'referent',    tier:'T1', zh:'我', c:'transparent', d:0.15, n:'I/me — same pronoun role (VN has rich pronoun-by-relation system, but tôi is the neutral default)'},
  {w:'đi',    role:'lexical-verb',tier:'T1', zh:'去', c:'transparent', d:0.30, n:'go (deictic motion; also a hortative/imperative particle — that use diverges)'},
  {w:'là',    role:'copula',      tier:'T1', zh:'是', c:'false-friend',d:0.80, n:'copula, but NOT before predicate adjectives (tôi tốt, not tôi là tốt) — the SAME false-friend trap as 是'},
  {w:'người', role:'nominal',     tier:'T1', zh:'人', c:'transparent', d:0.20, n:'person/people (no plural inflection; also a classifier for humans)'},
  {w:'tốt',   role:'adjective',   tier:'T1', zh:'好', c:'transparent', d:0.30, n:'good — predicative adjective stands ALONE (no obligatory degree word — unlike 好/很)'},
  {w:'rất',   role:'degree',      tier:'T1', zh:'很', c:'transparent', d:0.30, n:'very — but OPTIONAL and truly intensifying (English "very" instinct WORKS), unlike obligatory bleached 很. KEY EN→VN vs EN→ZH difference'},
  // T2 negation / question
  {w:'không', role:'negator',     tier:'T2', zh:'不', c:'transparent', d:0.35, n:'not (pre-verbal negator; same morpheme doubles as the yes/no Q-frame — see below)'},
  {w:'chưa',  role:'negator-perf',tier:'T2', zh:'没', c:'divergent',   d:0.60, n:'not-yet / not-done — the aspectual negation split (chưa vs không) English lacks, mirrors 没/不'},
  {w:'à',     role:'Q-particle',  tier:'T2', zh:'吗', c:'divergent',   d:0.70, n:'sentence-final yes/no question particle (also the …không…? frame) — English uses inversion/intonation, like 吗'},
  // T3 modify / quantify
  {w:'của',   role:'modifier',    tier:'T3', zh:'的', c:'divergent',   d:0.60, n:'possessive marker — HEAD-INITIAL (sách của tôi = book of me), narrower than the do-everything prenominal 的'},
  {w:'một',   role:'numeral',     tier:'T3', zh:'一', c:'transparent', d:0.20, n:'one/a — numeral; obligatory classifier after, like 一'},
  {w:'cái',   role:'classifier',  tier:'T3', zh:'个', c:'divergent',   d:0.85, n:'general classifier — English has no obligatory measure word; the SAME divergence as 个'},
  // T4 adjunct / aspect
  {w:'ở',     role:'coverb',      tier:'T4', zh:'在', c:'divergent',   d:0.65, n:'locative coverb/verb "be at" — coverb construction English lacks, mirrors 在'},
  {w:'rồi',   role:'aspect',      tier:'T4', zh:'了', c:'divergent',   d:0.80, n:'sentence-final perfective/change-of-state "already" — aspect-not-tense, mirrors 了'},
  // T5 complex
  {w:'và',    role:'conjunction', tier:'T5', zh:'和', c:'transparent', d:0.35, n:'and — but conjoins CLAUSES and verbs too (broader than nouns-only 和); English "and" instinct works AND over-covers → no misfire. KEY EN→VN vs EN→ZH difference'},
  {w:'cũng',  role:'additive-adv',tier:'T5', zh:'也', c:'transparent', d:0.40, n:'also/too — fixed PRE-verbal position (tôi cũng đi), like 也'}
];
// Compare the EN→VN seed against the live EN→ZH generative basis: same role set,
// same σ rubric → the class distribution and effective-load DELTA is the experiment's
// readout (does the L1 crutch transfer MORE for the typological twin pair?).
function computeSeedDelta(){
  const cls={transparent:0,divergent:0,'false-friend':0};
  let load=0; SEED_VI.forEach(a=>{ cls[a.c]=(cls[a.c]||0)+1; load+=a.d; });
  const vi={ size:SEED_VI.length, byClass:cls, effectiveLoad:Math.round(load*100)/100,
    realLoadCount:cls.divergent+cls['false-friend'],
    transparentSharePct:Math.round((cls.transparent/SEED_VI.length)*100),
    crutchRemovesPct:Math.round((1-load/SEED_VI.length)*100) };
  let zh=null; try{ const z=computeThreeAxisBasis();
    zh={ size:z.basisSize, byClass:z.byClass, effectiveLoad:z.effectiveLoad,
      realLoadCount:z.realLoadCount, transparentSharePct:z.transparentSharePct,
      crutchRemovesPct:Math.round((1-z.effectiveLoad/z.basisSize)*100) }; }catch(e){}
  const delta=zh?{ effectiveLoad:Math.round((vi.effectiveLoad-zh.effectiveLoad)*100)/100,
    falseFriends:vi.byClass['false-friend']-zh.byClass['false-friend'],
    transparentSharePct:vi.transparentSharePct-zh.transparentSharePct,
    verdict:(vi.effectiveLoad<zh.effectiveLoad?'EN→VN lighter (twin crutch transfers more)':'EN→VN heavier') }:null;
  return { vi:vi, zh:zh, delta:delta };
}
try{ window.SEED_VI=SEED_VI; window.computeSeedDelta=computeSeedDelta; }catch(e){}

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

// Append a user-proposed word to D[], persist it, and queue it for immediate introduction.
// entry format: [char, [[syllable,tone],...], meaning, [[radical,strokes],...], pos]
function addUserWord(entry){
  return addUserWords([entry]);
}

// Batch version — one localStorage read/write for N entries.
function addUserWords(entries){
  if(!entries||!entries.length) return -1;
  var firstIdx=D.length;
  if(!S.userWordQueue) S.userWordQueue=[];
  entries.forEach(function(entry){
    var idx=D.length;
    D.push(entry);
    S.userWordQueue.push(idx);
  });
  try{
    var uw=JSON.parse(localStorage.getItem('earworm-user-words-v1'))||[];
    entries.forEach(function(e){ uw.push(e); });
    localStorage.setItem('earworm-user-words-v1',JSON.stringify(uw));
  }catch(e){}
  save();
  return firstIdx;
}

// Returns true only if every D[] entry (single or multi-char) that appears
// in the sentence has been properly introduced (seen as a flashcard).
// Uses .seen (set in showStudyFlash) rather than .exp, which can be >0 from
// migration artifacts without the user having actually seen the flashcard.
function sentenceAllIntroduced(zh){
  // Same two conditions in BOTH segmentation modes — only "what is a unit" differs:
  //  (1) No UNSEEN deck atom appears in the sentence.
  //  (2) Every unit of the sentence is covered by a SEEN deck atom (no untaught
  //      context — the core invariant must never expose an atom not yet taught).
  if(_segMode()==='space'){
    // space-mode: tokenize on word boundaries; every word must map to a seen atom.
    const toks=_tokenizeSpace(_spaceWords(zh));
    for(const t of toks){
      if(t.idx<0) return false;                                   // (2) uncovered word
      if(!(S.cards[t.idx]&&S.cards[t.idx].seen)) return false;    // (1) unseen atom present
    }
    return true;
  }
  // cjk-mode (unchanged): substring presence + per-CJK-char coverage.
  // Non-CJK (punctuation/latin) is ignored. Literal CJK range is the house style
  // (matches hasPhoneticContent); safe because the build is bash `cat`, never
  // PowerShell (see CLAUDE.md build rule).
  const CJK=/[一-鿿㐀-䶿]/; // CJK Unified Ideographs + Ext A
  const covered=new Set();
  for(let j=0;j<D.length;j++){
    const w=D[j][0];
    if(zh.indexOf(w)<0) continue;
    if(!(S.cards[j]&&S.cards[j].seen)) return false; // (1) unseen atom present
    for(const c of w) covered.add(c);                // accumulate seen coverage
  }
  for(const ch of zh){                               // (2) every CJK char covered
    if(CJK.test(ch)&&!covered.has(ch)) return false;
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
  return true;
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

// ── Generativity-biased introduction (escape the scaffold valley) ──────────
// Strict-rank introduction front-loads function words (Zipf's top is dominated
// by particles/pronouns that are useless in isolation) and defers the first
// self-standing predicate, so the learner accumulates atoms that unlock NO
// comprehensible context (measured: at frontier 14, 2 of 121 bank sentences are
// legal). This biases the next introduction toward the atom — within a bounded
// rank window, so it stays Zipf-honest — that makes the MOST currently-blocked
// bank sentences comprehensible. It's the §8-ter cheap-unlock / set-cover greedy:
// language-agnostic (sentence-bank driven), and it naturally pulls a predicate
// forward to cross M1. Returns an atom index, or -1 to fall back to pure rank.
var INTRO_WINDOW=24;  // stay within this many ranks of the frontier
function introUnlockBias(S, D){
  try{
    // GATED OFF by default — Mandarin emphasizes pure Zipf. It is isolating, so
    // its scaffold valley is ~2 ranks deep and Zipf crosses it on its own; the
    // deviation isn't worth breaking the rank invariant. The generativity bias is
    // only justified where the valley is DEEP (agglutinative/polysynthetic, or via
    // frequency fragmentation). A course opts in with `introBias:true`. Re-evaluate
    // per language — measure valley depth first — before enabling (ENGINE
    // §8-ter). No active course sets the flag today.
    if(!(typeof activeCourse==='function' && activeCourse() && activeCourse().introBias)) return -1;
    function intro(i){ return !!(S.cards[i] && S.cards[i].exp>0); }
    var cand=[]; for(var i=0;i<D.length && cand.length<INTRO_WINDOW;i++){ if(!intro(i)) cand.push(i); }
    if(cand.length<=1) return -1;
    var bank=[], bseen={};
    if(typeof EXAMPLE_SENTENCES!=='undefined') for(var k in EXAMPLE_SENTENCES){ (EXAMPLE_SENTENCES[k]||[]).forEach(function(s){ if(s&&s[0]) bank.push(s[0]); }); }
    if(typeof _sentenceCache!=='undefined') for(var k2 in _sentenceCache){ (_sentenceCache[k2]||[]).forEach(function(s){ if(s&&s[0]) bank.push(s[0]); }); }
    var CJK=/[一-鿿]/, marg={}, mass={};
    bank.forEach(function(zh){
      if(bseen[zh]) return; bseen[zh]=1;
      var present=[], coveredChars={};
      for(var j=0;j<D.length;j++){ var w=D[j][0]; if(zh.indexOf(w)>=0){ present.push(j); for(var c=0;c<w.length;c++) coveredChars[w[c]]=1; } }
      for(var p=0;p<zh.length;p++){ var ch=zh[p]; if(CJK.test(ch)&&!coveredChars[ch]) return; } // unreachable (untaught content) — skip
      var gaps=present.filter(function(j){ return !intro(j); });
      if(!gaps.length) return;                                   // already legal
      gaps.forEach(function(g){ mass[g]=(mass[g]||0)+1; });
      if(gaps.length===1) marg[gaps[0]]=(marg[gaps[0]]||0)+1;     // sole gap → introducing it makes the sentence legal NOW
    });
    var best=-1, bestScore=0;
    cand.forEach(function(i){ var sc=(marg[i]||0)*100+(mass[i]||0); if(sc>bestScore){ bestScore=sc; best=i; } });
    return bestScore>0 ? best : -1;
  }catch(e){ return -1; }
}
try{ window.introUnlockBias=introUnlockBias; }catch(e){}

function nextWordToIntroduce(){
  // User-added words take immediate priority over the core frontier.
  if(S.userWordQueue&&S.userWordQueue.length){
    var pending=S.userWordQueue.filter(function(wi){ return D[wi]&&(!S.cards[wi]||!S.cards[wi].exp); });
    if(pending.length!==S.userWordQueue.length){ S.userWordQueue=pending; save(); }
    if(pending.length) return {type:'word',idx:pending[0]};
  }
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

// ── INTRODUCTION GATE — acquisition literature basis ───────────────────────
//   • Krashen, comprehensible input / i+1 — keep the learner at a frontier
//     that is mostly known with one new thing; "recognition-stable, not
//     mastered" maximizes how much usable vocabulary sits at that frontier.
//   • Zipf's law — introductions advance along the frequency spine (the
//     breadth axis; see frontier()/demand-pull).
//   • Bjork, desirable difficulties — words consolidate THROUGH spaced
//     retrieval in context, not by isolated over-drilling (the prior bug).
// retentionHealth() is a first proxy for the per-learner capacity that should
// eventually come from IRT/CAT-style ability estimation (product_vision_aptitude).
//
// Recognition-stable = the learner has shown provisional recognition on the
// meaning axis (advanced past stage 0). This is the breadth-first "good enough
// to carry in context" bar — deliberately FAR below mastery. A word that clears
// it stops blocking new introductions but keeps consolidating via spaced review.
function isRecognitionStable(i){
  return (getAxisStage(i,'meaning')||0)>=1;
}

// Retention health: mean recent recall accuracy across the active (introduced)
// set, 0..1. Drives how wide a frontier of still-unrecognized words we allow in
// flight. Neutral default until there's enough data to be meaningful.
function retentionHealth(){
  let sum=0,n=0;
  for(let i=0;i<D.length;i++){
    if(!isUnlocked(i)) continue;
    const ci=S.cards[i];
    if(!ci||!ci.seen) continue;
    if(ci.lastReviewAt&&ci.lastReviewAt.meaning){
      sum+=retrievability(i,'meaning'); n++; // wall-clock signal
    } else {
      const acc=axisAccuracy(i,'meaning',6);
      if(acc===null) continue;
      sum+=acc; n++; // accuracy proxy until wall-clock data exists
    }
  }
  return n<3?0.6:sum/n;
}

// In-flight cap on words still BELOW recognition (the comprehensibility floor:
// too many un-recognized words at once turns context into noise), flexed by
// retention health between MIN (struggling → throttle) and MAX (holding → widen).
const ACQUIRING_CAP_MIN=6;
const ACQUIRING_CAP_MAX=14;

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
  // Breadth-first pivot: REPLACES the old "<30 below mastery" cap, which held a
  // small batch and ground each word to mastery — the overdrill anti-pattern.
  // A word leaves the blocking count once recognition-stable (not mastered); it
  // then keeps consolidating via spaced review/context without blocking intros.
  // We cap only the words still below recognition, flexed by retention health.
  const acquiring=D.filter((_,i)=>isUnlocked(i)&&!isRecognitionStable(i)).length;
  const cap=Math.round(ACQUIRING_CAP_MIN+(ACQUIRING_CAP_MAX-ACQUIRING_CAP_MIN)*retentionHealth());
  return acquiring<cap;
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
// the breadth-first introduction cap (retention-flexed, counts words below
// recognition; see shouldIntroduceNewWord) interact with these rates.
// ─────────────────────────────────────────────────────────────────────────────
// (The .m mastery accumulator and its addMastery() nudges are retired — competence
// is now derived from axisStage; see masteryScore. All call sites removed.)

/* ============ SCHEDULER ============ */
// Per-axis SRS intervals. Each axis has its own due date.
// A card is due if ANY axis is due. The most-overdue axis determines modality.
// Intervals are calibrated to actual forgetting curve research:
//   First correct: 1 day
//   Second correct: 3 days
//   Third correct: 7 days
//   Then multiply by stability factor per axis

const DAY=86400000;

// ── SRS SPACING — literature basis ─────────────────────────────────────────
// The spacing model draws on the spaced-repetition lineage (NOT the corporate
// gamification/XP playbook):
//   • Ebbinghaus (1885) forgetting curve; the spacing effect & lag effect
//     (expanding intervals) — why intervals grow per successful rep below.
//   • SM-2 (Wozniak/SuperMemo) — the heuristic ease/interval ancestor this
//     tiered per-axis scheduler most resembles today.
//   • HLR (Half-Life Regression, Settles & Meeder 2016 / Duolingo) —
//     memory half-life as p = 2^(-Δ/h); the target model for the future
//     time-between-session scheduler fit from .reviewLog.
//   • FSRS / DSR model (Difficulty, Stability, Retrievability; open-spaced-
//     repetition) — stability convergence and difficulty mean-reversion
//     ("ease hell"); the direction axisDue should evolve toward.
//   • Bjork, desirable difficulties / "edge of forgetting" — schedule review
//     near ~85–90% retrievability; retrieval when R is low yields the largest
//     stability gain (motivates scheduling at the edge, not over-drilling).
// NOTE: this is count-based (S.totalSeen ordinal) WITHIN a session by design;
// real wall-clock retrievability is a BETWEEN-session/rebuild concern. See
// project_context_pivot (two-timescale model). Wager calibration layered on top.
//
// Axis-specific stability multipliers
// POS axis: conceptual — longer intervals once learned
// Meaning axis: higher frequency repetition early, then extends
const AXIS_STABILITY={
  // Card-count intervals: show this axis again after N total cards seen
  meaning: [3, 10, 30, 100, 300, 1000],
  pos:     [5, 20, 60, 200],
  tone:    [4, 15, 50, 150],
};

function getAxisDue(i, axis){
  const ci=card(i);
  if(!ci.axisDue) ci.axisDue={};
  const v=ci.axisDue[axis]||0;
  return v>1e9?0:v; // migration: old ms timestamps → immediately due
}

function setAxisDue(i, axis, isCorrect, responseMs){
  const ci=card(i);
  if(!ci.axisDue) ci.axisDue={};
  if(!ci.axisReps) ci.axisReps={meaning:0,pos:0,tone:0};
  const seen=S.totalSeen||0;

  // Wager tier jump: steps above default → stability tier bonus (0–3)
  const wagerUplift=(typeof currentMultIdx!=='undefined'&&typeof defaultMultIdx!=='undefined')
    ?Math.max(0,currentMultIdx-defaultMultIdx):0;
  const tierBonus=Math.floor(wagerUplift*0.75);

  if(!isCorrect){
    ci.axisReps[axis]=0;
    const stage=getAxisStage(i,axis);
    const wrongCards=stage<=1?3:stage===2?8:20;
    // High wager wrong: review sooner — overclaiming deserves urgency
    const wagerWrongFactor=wagerUplift>0?Math.max(0.25,1-wagerUplift*0.15):1;
    ci.axisDue[axis]=seen+Math.max(1,Math.round(wrongCards*wagerWrongFactor));
  } else {
    ci.axisReps[axis]=(ci.axisReps[axis]||0)+1;
    const stability=AXIS_STABILITY[axis]||[3,10,30,100];
    const reps=ci.axisReps[axis];
    const speedFactor=responseMs<2000?1.2:responseMs<5000?1.0:0.8;
    // Tier jump: high wager correct selects a higher stability tier
    const effectiveReps=Math.min(reps+tierBonus,stability.length);
    const baseCards=stability[Math.min(effectiveReps-1,stability.length-1)]||100;
    const intervalCards=Math.max(1,Math.round(baseCards*speedFactor));
    // Calibration: adjust based on historical wager accuracy for this card
    ci.axisDue[axis]=seen+confidenceAdjustedInterval(i,intervalCards);
  }
  save();
}

// Is any axis of this card due?
function isCardDue(i){
  const seen=S.totalSeen||0;
  return ['meaning','pos'].some(axis=>getAxisDue(i,axis)<=seen);
}

// Which axis is most overdue? Used to select modality for due cards
function mostOverdueAxis(i){
  const seen=S.totalSeen||0;
  let worst=null; let worstOverdue=-Infinity;
  ['meaning','pos'].forEach(axis=>{
    const overdue=seen-getAxisDue(i,axis);
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

// Durable real-time review instrumentation. ADDITIVE measurement substrate: the
// count-based scheduler (axisDue) does NOT read these fields, so this changes no
// behavior. We log wall-clock timing + outcome + latency now because that data
// cannot be retrofitted — it is the substrate for the future time-between-session
// scheduler and forgetting-curve / latent-ability fitting. Persistence is handled
// by the caller (recordAxisResultNew → setAxisDue calls save() on every path).
// Literature: HLR (Settles & Meeder 2016) and FSRS/DSR fit memory half-life /
// stability from exactly this (interval, outcome) history; latency is a retrieval-
// fluency signal. Aggregated over users this is the IRT/CAT measurement channel
// (product_vision_aptitude) — none of which can be fit from untimestamped data.
const REVIEW_LOG_MAX=30; // per-axis cap on .reviewLog (bounds localStorage growth)
function logAxisReview(i, axis, isCorrect, responseMs){
  const ci=card(i);
  const now=Date.now();
  if(!ci.lastReviewAt) ci.lastReviewAt={};
  ci.lastReviewAt[axis]=now;
  if(!ci.reviewLog) ci.reviewLog={};
  if(!ci.reviewLog[axis]) ci.reviewLog[axis]=[];
  const ms=(typeof responseMs==='number'&&responseMs>0&&responseMs<120000)?Math.round(responseMs):null;
  ci.reviewLog[axis].push([now, isCorrect?1:0, ms]);
  if(ci.reviewLog[axis].length>REVIEW_LOG_MAX) ci.reviewLog[axis].shift();
}

// ── BETWEEN-SESSION RETRIEVABILITY ────────────────────────────────────────
// Ebbinghaus/HLR model: R = 2^(-Δt/h), R ∈ (0,1].
// Half-life defaults calibrated to SM-2 / Ebbinghaus replication; these will
// be replaced by per-card MLE fits as reviewLog (interval, outcome) pairs
// accumulate. Stage-indexed: early stages = short half-life (fragile trace);
// late stages = longer (stable, only review when deeply decayed).
const HALF_LIFE_DAYS={
  meaning:[1,3,10,30],   // stages 0–3: 1 day → 30 days
  pos:    [2,5,15,45],
  tone:   [1,4,12,36],
};
const RIPE_THRESHOLD=0.85; // review when R drops below this (Bjork edge-of-forgetting)

function retrievability(i, axis){
  const ci=card(i);
  if(!ci.lastReviewAt||!ci.lastReviewAt[axis]) return 0;
  const deltaDays=(Date.now()-ci.lastReviewAt[axis])/86400000;
  const stage=getAxisStage(i,axis)||0;
  const h=(HALF_LIFE_DAYS[axis]||HALF_LIFE_DAYS.meaning)[Math.min(stage,3)];
  return Math.pow(2,-deltaDays/h); // R = 2^(-Δt/h)
}

function isWallClockRipe(i){
  const ci=card(i);
  if(!ci||!ci.seen||!ci.lastReviewAt) return false;
  return ['meaning','pos'].some(function(axis){
    if(!ci.lastReviewAt[axis]) return false;
    return retrievability(i,axis)<RIPE_THRESHOLD;
  });
}
try{ window.retrievability=retrievability; }catch(e){}

// ── OBSERVATION LOG — ENGINE.md §4a ─────────────────────────────
// Append-only ring of OBSERVED interaction records: the non-retrofittable
// substrate the cold inference engine (Slice 2) will read. This is hot-path,
// pure-observable capture only — NO inference, NO channel/necessity attribution
// (I5). Channel typing, background-axis, and necessity are derived cold (§4b).
// Scheduling tier (§9-bis): a bounded local ring. The fitting tier (full history
// for MLE/IRT) is gated on the deferred durable backend.
var OBS_LOG_MAX=500;     // scheduling-tier ring cap
var _ewAudioEndAt=null;  // ms the last TTS clip finished — for latency decontam (§5)

// Decompose a sentence into the D[] atom indices it contains (compounds atomic).
// Mirrors the constituent scan in sentenceAllIntroduced.
// ── SEGMENTATION SEAM — the one Mandarin-specific assumption ────────────────
// The engine originally conflated "atom" with "CJK character": sentences were
// decomposed by SUBSTRING search (zh.indexOf(headword)). That is correct only for
// scripts with no word delimiters — every substring that equals a deck headword IS
// present, and sub-atoms (吃 inside 吃饭) legitimately count as present too. For a
// space-delimited Latin script (Vietnamese, Arabic) it is catastrophic: the
// Q-particle "à" is a substring of "nhà"/"cà", "đi" sits inside "điện". So the
// segmentation strategy is a per-course property: course.segment, default 'cjk'.
//   'cjk'   — no word boundaries; an atom is present iff it appears as a substring.
//   'space' — whitespace-delimited; an atom (which may span multiple syllables) is
//             present iff it appears as a whole-word run. Tokenization is GREEDY
//             longest-match so multi-syllable atoms win over their parts.
function _segMode(){ try{ const c=(typeof activeCourse==='function')&&activeCourse(); return (c&&c.segment)||'cjk'; }catch(e){ return 'cjk'; } }
// Split a space-delimited sentence into normalized word tokens: strip edge
// punctuation (keep letters + combining diacritics), lowercase for matching.
function _spaceWords(s){
  if(!s) return [];
  return String(s).split(/\s+/)
    .map(w=>w.replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,'').toLowerCase())
    .filter(Boolean);
}
// Greedy longest-match tokenizer over the active lexicon for space-mode.
// Returns [{idx, surface, len}]; idx<0 = a word covered by no deck atom.
function _tokenizeSpace(words){
  const out=[]; let maxLen=1;
  for(let j=0;j<D.length;j++){ const l=String(D[j][0]).trim().split(/\s+/).length; if(l>maxLen) maxLen=l; }
  let i=0;
  while(i<words.length){
    let matched=false;
    for(let k=Math.min(maxLen, words.length-i); k>=1; k--){
      const cand=words.slice(i,i+k).join(' ');
      let idx=-1;
      for(let j=0;j<D.length;j++){ if(String(D[j][0]).toLowerCase()===cand){ idx=j; break; } }
      if(idx>=0){ out.push({idx, surface:cand, len:k}); i+=k; matched=true; break; }
    }
    if(!matched){ out.push({idx:-1, surface:words[i], len:1}); i++; }
  }
  return out;
}

function decomposeSentence(zh){
  if(_segMode()==='space') return _tokenizeSpace(_spaceWords(zh)).filter(t=>t.idx>=0).map(t=>t.idx);
  var out=[];
  if(!zh) return out;
  for(var j=0;j<D.length;j++){
    if(zh.indexOf(D[j][0])>=0) out.push(j);
  }
  return out;
}

// The central membership predicate: does this exact atom occur in the sentence?
// EVERY drill's "sentence contains word" test must go through here, never a raw
// indexOf — that is the bug that put an 'à' tile into 'và'. cjk: substring (no word
// boundaries exist). space: the atom (possibly multi-syllable) appears as a whole-
// word run.
function sentenceContainsAtom(zh, headword){
  if(!zh||!headword) return false;
  if(_segMode()!=='space') return String(zh).indexOf(headword)>=0;
  const words=_spaceWords(zh), hw=_spaceWords(headword);
  if(!hw.length) return false;
  for(let i=0;i+hw.length<=words.length;i++){
    let m=true; for(let k=0;k<hw.length;k++){ if(words[i+k]!==hw[k]){ m=false; break; } }
    if(m) return true;
  }
  return false;
}
// Deck-backed atoms of a sentence in LEFT-TO-RIGHT order (for word-order tiles +
// ordering). space: tokenizer order. cjk: known headwords by first occurrence
// (preserves the legacy Mandarin tile behavior — substring + indexOf sort).
function sentenceAtomsInOrder(zh){
  if(_segMode()==='space') return _tokenizeSpace(_spaceWords(zh)).filter(t=>t.idx>=0).map(t=>({idx:t.idx,w:D[t.idx][0]}));
  const out=[];
  for(let j=0;j<D.length;j++){ const w=D[j][0]; const at=String(zh).indexOf(w); if(at>=0) out.push({idx:j,w:w,at:at}); }
  out.sort((a,b)=>a.at-b.at);
  return out.map(o=>({idx:o.idx,w:o.w}));
}
// Replace the atom occurrence with `blank`, word-boundary aware so blanking 'à'
// never eats the à inside 'là'. cjk: first substring (unchanged). space: first
// whole-word run.
function blankAtom(zh, headword, blank){
  if(_segMode()!=='space') return String(zh).replace(headword, blank);
  const esc=String(headword).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  try{
    const re=new RegExp('(^|\\s)'+esc+'(?=$|\\s|[^\\p{L}\\p{M}])','u');
    if(re.test(zh)) return String(zh).replace(re,'$1'+blank);
  }catch(e){}
  // No whole-word match → the atom is not present AS A WORD. Return unchanged;
  // never fall back to a substring replace (that is the bug that ate à inside là).
  return String(zh);
}
try{ window.sentenceContainsAtom=sentenceContainsAtom; window.sentenceAtomsInOrder=sentenceAtomsInOrder; window.blankAtom=blankAtom; }catch(e){}

// Snapshot per-atom mastery-at-time (§4a mu). MUST run before the answer mutates
// state. Compact: { atomIdx: [meaningStage, posStage, toneStage] }. Retrievability-
// at-time is intentionally omitted — the specified inference (necessity, graduation)
// reads stages + decontaminated latency, not historical R.
function snapshotMu(indices){
  var mu={};
  indices.forEach(function(j){
    mu[j]=[getAxisStage(j,'meaning')||0, getAxisStage(j,'pos')||0, getAxisStage(j,'tone')||0];
  });
  return mu;
}

// Record one observed interaction (§4a). Pure observable capture.
// opts: { mod, comp, fg, fax, ok, opt }. Call BEFORE recordAxisResultNew so mu is
// the pre-answer snapshot. Persistence rides on the caller's existing save().
function recordObservation(opts){
  try{
    var fg=(typeof opts.fg==='number')?opts.fg:-1;
    var comp=opts.comp||null;
    var dec=comp?decomposeSentence(comp):(fg>=0?[fg]:[]);
    if(comp && fg>=0 && dec.indexOf(fg)<0) dec.push(fg); // foreground always present
    var o={
      t:Date.now(),
      mod:opts.mod||'unknown',
      course:(typeof ACTIVE_COURSE_KEY!=='undefined'?ACTIVE_COURSE_KEY:null),
      comp:comp,
      dec:dec,
      fg:fg,
      fax:opts.fax||'meaning',
      ok:opts.ok?1:0,
      tae:(typeof _ewAudioEndAt==='number'?_ewAudioEndAt:null),
      opt:(opts.opt!==undefined?opts.opt:null),
      mu:snapshotMu(dec)
    };
    if(!S.obsLog) S.obsLog=[];
    S.obsLog.push(o);
    if(S.obsLog.length>OBS_LOG_MAX) S.obsLog.shift();
    if(window.EW&&EW.obs) EW.obs.logEvent('observation',{mod:o.mod,fg:o.fg,fax:o.fax,ok:o.ok,nDec:dec.length,hasComp:!!comp});
  }catch(e){ try{ if(window.EW&&EW.obs) EW.obs.captureError(e,{phase:'recordObservation'}); }catch(_){} }
}
try{ window.recordObservation=recordObservation; window.dumpObsLog=function(){return (typeof S!=='undefined'&&S.obsLog)||[];}; }catch(e){}

// ── COLD INFERENCE ENGINE — ENGINE.md §7-bis ────────────────────
// Pure function of (obsLog, now). Attributes channels/background/necessity (§4b),
// aggregates measurement σ (§5), evaluates graduation (§7). Equal to a full replay
// of the log (purity-as-invariant). SHADOW MODE: writes S.coldState only — it does
// NOT yet drive the live scheduler. That cutover (and removing the hot-path engines)
// is Slice 2b. Run at the strategic interval (session end, goHome).
var COLD_FLUENT_LATENCY_MS=2500; // decontaminated (t - tae) below this = fluent parse
var COLD_ADJ_DIST=1;             // chars between fg/bg to count as structurally linked
var COLD_DISCRIM_GATE=3;         // direct discrimination evidence needed to graduate
var COLD_INCID_GATE=2;           // incidental (weighted) evidence needed to graduate

// Necessity proxy (§5): the background atom is syntactically near the probed slot.
function _coldStructuralLink(comp, fgChar, bgChar){
  if(!comp||!fgChar||!bgChar) return false;
  var fi=comp.indexOf(fgChar), bi=comp.indexOf(bgChar);
  if(fi<0||bi<0) return false;
  return Math.abs(fi-bi)<=(fgChar.length+COLD_ADJ_DIST);
}

function coldRecompute(now){
  now=now||Date.now();
  var log=(typeof S!=='undefined'&&S.obsLog)||[];
  var ev={}; // ev[idx][axis] = {recall,discrim,incid,correct,total,last}
  function bucket(idx,axis){
    if(!ev[idx]) ev[idx]={};
    if(!ev[idx][axis]) ev[idx][axis]={recall:0,discrim:0,incid:0,correct:0,total:0,last:0};
    return ev[idx][axis];
  }
  log.forEach(function(o){
    var fax=o.fax||'meaning';
    // Direct foreground evidence. Isolated probe → recall; composite (chose right
    // among distractors) → discrimination (§6). Approximate until δ is logged.
    var fb=bucket(o.fg,fax);
    fb.total++; if(o.ok){ fb.correct++; if(o.comp) fb.discrim++; else fb.recall++; }
    if(o.t>fb.last) fb.last=o.t;
    // Incidental → background atoms, composite + correct only (positive-only, I3).
    if(o.comp && o.ok){
      var fgChar=(D[o.fg]&&D[o.fg][0])||'';
      var latency=(typeof o.tae==='number'&&o.tae<=o.t)?(o.t-o.tae):null;
      var fluent=(latency!==null&&latency<COLD_FLUENT_LATENCY_MS);
      (o.dec||[]).forEach(function(bgIdx){
        if(bgIdx===o.fg) return;
        var bgChar=(D[bgIdx]&&D[bgIdx][0])||'';
        // Necessity gate (§5, REQUIRED): fluent parse OR structural link.
        if(!(fluent||_coldStructuralLink(o.comp,fgChar,bgChar))) return;
        // Mastery-gap weight (§5): credit only when scaffold ≥ probe (it was background).
        var mBg=(o.mu&&o.mu[bgIdx]&&o.mu[bgIdx][0])||0;
        var mFg=(o.mu&&o.mu[o.fg]&&o.mu[o.fg][0])||0;
        var w=Math.max(0,mBg-mFg);
        if(w<=0) return;
        var bb=bucket(bgIdx,'meaning'); // incidental → meaning fiber (§5 minimal)
        bb.incid+=w; if(o.t>bb.last) bb.last=o.t;
      });
    }
  });
  // Graduation (§7): direct discrimination + incidental, NOT recall volume. Requiring
  // discrim>=GATE means graduation always includes recent DIRECT evidence (honors the
  // §7 cap against incidental-only graduation).
  var cold={ computedAt:now, atoms:{} };
  Object.keys(ev).forEach(function(idx){
    cold.atoms[idx]={};
    Object.keys(ev[idx]).forEach(function(axis){
      var e=ev[idx][axis];
      var graduated=(e.discrim>=COLD_DISCRIM_GATE && e.incid>=COLD_INCID_GATE);
      cold.atoms[idx][axis]={
        n:e.total, acc:e.total?Math.round(e.correct/e.total*100)/100:0,
        recall:e.recall, discrim:e.discrim, incid:Math.round(e.incid*100)/100,
        graduated:graduated, regime:graduated?'maintenance':'acquisition', lastAt:e.last
      };
    });
  });
  if(typeof S!=='undefined') S.coldState=cold;
  if(window.EW&&EW.obs) EW.obs.logEvent('cold:recompute',{nRecords:log.length,nAtoms:Object.keys(cold.atoms).length});
  return cold;
}
try{ window.coldRecompute=coldRecompute; window.dumpColdState=function(){return (typeof S!=='undefined'&&S.coldState)||null;}; }catch(e){}

// ── Cutover validation instrument (shadow-mode, read-only) ──────────────
// Compare the cold engine's verdict against the live engine's, per atom, so
// the cutover (coldState → selection) can be a TRUSTED, deliberate flip and
// not a flag-flip. The expected, healthy signal is "cold-stricter": the live
// engine over-graduates on recall volume (isGraduated = 1 correct answer),
// while the cold engine withholds graduation until the upper channels
// (discrimination + incidental) show real contextual evidence. A cold-stricter
// atom is one to eyeball during play: can the learner actually USE it in
// context, or did the live engine graduate it on a single isolated recall?
function coldVsLive(){
  var cold=(typeof S!=='undefined'&&S.coldState&&S.coldState.atoms)||{};
  var rows=[], agree=0, coldStricter=0, coldLooser=0, n=0;
  for(var i=0;i<D.length;i++){
    var ci=S.cards[i], seen=ci&&ci.seen, ca=cold[i]&&cold[i].meaning;
    if(!seen && !ca) continue;
    var liveGrad=(typeof isGraduated==='function')?isGraduated(i):false;
    var liveM=(typeof masteryScore==='function')?masteryScore(i):((ci&&ci.m)||0);
    var liveStage=(ci&&ci.axisStage&&ci.axisStage.meaning)||0;
    var coldGrad=ca?!!ca.graduated:false;
    var rel=(liveGrad===coldGrad)?'agree':(coldGrad?'cold-looser':'cold-stricter');
    if(rel==='agree') agree++; else if(rel==='cold-stricter') coldStricter++; else coldLooser++;
    n++;
    rows.push({ i:i, ch:D[i][0], rel:rel,
      live:{ grad:liveGrad, m:Math.round(liveM*10)/10, stage:liveStage },
      cold: ca?{ n:ca.n, recall:ca.recall, discrim:ca.discrim, incid:ca.incid, grad:coldGrad, regime:ca.regime }
              :{ n:0, recall:0, discrim:0, incid:0, grad:false, regime:'no-data' } });
  }
  var ord={ 'cold-stricter':0, 'cold-looser':1, 'agree':2 };
  rows.sort(function(a,b){ return ord[a.rel]!==ord[b.rel] ? ord[a.rel]-ord[b.rel] : a.i-b.i; });
  return { rows:rows, summary:{ compared:n, agree:agree, coldStricter:coldStricter, coldLooser:coldLooser,
    agreePct:n?Math.round(agree/n*100):0, computedAt:(S.coldState&&S.coldState.computedAt)||0,
    obsRecords:(typeof S!=='undefined'&&S.obsLog&&S.obsLog.length)||0 } };
}
try{ window.coldVsLive=coldVsLive; }catch(e){}

// ── Cutover policy — the one switch (default OFF) ──────────────────────────
// When ON, GRADUATION (and therefore frontier advancement / working-set pacing)
// is read from the cold engine's conservative verdict instead of the live
// engine's eager one. Selection-only: the live engine still WRITES axis state;
// the cutover only flips the READ. Persisted on S, flipped from the COLD CUTOVER
// debug toggle once COLD vs LIVE shows the cold engine is fed and trustworthy.
// CAUTION: with cold driving, an atom stays "not graduated" until it shows real
// contextual evidence (discrim≥3 ∧ incid≥2) — so if context isn't flowing, the
// working set fills and introduction stalls. That stall IS the signal to flip back.
function coldDrivesSelection(){ return !!(typeof S!=='undefined' && S.coldCutover); }
function coldGraduated(i){
  var a=(typeof S!=='undefined' && S.coldState && S.coldState.atoms && S.coldState.atoms[i] && S.coldState.atoms[i].meaning);
  return !!(a && a.graduated);
}
try{ window.coldDrivesSelection=coldDrivesSelection; window.coldGraduated=coldGraduated; }catch(e){}

// Axis stage gate: use accuracy window instead of consecutive-correct
// Advance stage when accuracy >= threshold over last N attempts
const AXIS_ADVANCE_ACCURACY=0.80; // 80% accuracy over window
// attempts needed before evaluating each stage gate. NOTE: a legit value of 0
// here used to be silently coerced to 5 by `x || 5` (0 is falsy) — that bug made
// the stage 0→1 gate (the one that frees an acquisition-cap slot, ACQUIRED_STAGE=1)
// require ~5 reps even at 100% accuracy, which is why pace felt slow. The stage 0→1
// bar is now an explicit low gate (2 clean corrects; a winning wager compresses it
// to 1 via windowSize=max(1,baseWindow-wBonus)). Coalescing fixed below.
const AXIS_ADVANCE_WINDOW={
  pos:  [2,5,5,4],
  meaning:[2,4,4,5,5,4],
};

// SUBSTITUTION GATING (the first LIVE wiring of the σ axis): effort follows
// substitution distance. A transparent atom is a relabel of a concept the learner
// already owns → graduate FAST (fewer reps). A divergent / false-friend atom is
// genuinely new (or actively misleading) → needs MORE consolidation. This modulates
// the meaning-axis stage-advance window by the atom's substitution class, so the
// learner blows through 水/书/吃 and dwells on 了/个/是 — exactly where effort belongs.
// Flag-gated so it can be A/B'd against pure frequency. Surfaced in the WHY caption.
let SUBST_GATING = true;
try{ window.setSubstGating=function(on){ SUBST_GATING=!!on; return SUBST_GATING; }; }catch(e){}
// window delta by class: transparent graduates a rep sooner, divergent/false-friend a rep later.
function substWindowDelta(ch){
  if(!SUBST_GATING || typeof substitution!=='function') return 0;
  const s=substitution(ch);
  if(!s) return 0;
  return s.c==='transparent' ? -1 : (s.c==='divergent'||s.c==='false-friend') ? +1 : 0;
}

function recordAxisResultNew(i, axis, isCorrect, responseMs){
  logAxisReview(i, axis, isCorrect, responseMs);
  recordAxisHistory(i, axis, isCorrect);
  setAxisDue(i, axis, isCorrect, responseMs||3000);

  const ci=card(i);
  if(!ci.axisStage) ci.axisStage={pos:0,meaning:0};
  const currentStage=ci.axisStage[axis]||0;
  const maxStage=AXIS_MAX[axis]||3;

  // High-wager wrong: regress stage proportional to uplift
  if(!isCorrect){
    const wagerUplift=(typeof currentMultIdx!=='undefined'&&typeof defaultMultIdx!=='undefined')
      ?Math.max(0,currentMultIdx-defaultMultIdx):0;
    if(wagerUplift>=3&&currentStage>0){
      const regression=Math.min(currentStage,Math.floor(wagerUplift/2));
      ci.axisStage[axis]=Math.max(0,currentStage-regression);
      ci.axisHistory[axis]=[];
      save();
    }
    return;
  }

  if(currentStage>=maxStage) return;

  // Stage advancement: accuracy window threshold
  const hist=ci.axisHistory[axis]||[];
  const _w=AXIS_ADVANCE_WINDOW[axis]&&AXIS_ADVANCE_WINDOW[axis][currentStage];
  let baseWindow=(_w==null)?5:_w;   // explicit null-check: a legit window of 0/low must NOT coerce to 5
  if(axis==='meaning') baseWindow=Math.max(1, baseWindow + substWindowDelta(D[i]&&D[i][0]));  // σ gating: transparent grad faster, divergent/false-friend slower
  // Wager above default compresses the stage gate (max -3 from window)
  const _wBonus=(typeof currentMultIdx!=='undefined'&&typeof defaultMultIdx!=='undefined')
    ?Math.min(3,Math.max(0,currentMultIdx-defaultMultIdx)):0;
  const windowSize=Math.max(1,baseWindow-_wBonus);
  if(hist.length>=windowSize){
    const acc=axisAccuracy(i,axis,windowSize);
    if(acc>=AXIS_ADVANCE_ACCURACY){
      ci.axisStage[axis]=(currentStage+1);
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
  // r.w = wagerIdx, r.def = defaultMultIdx at time of answer
  const avgBetRatio=recent.reduce((s,r)=>s+r.w/Math.max(1,r.def),0)/recent.length;
  const accuracy=recent.filter(r=>r.ok).length/recent.length;
  // Overconfident: bet high, wrong often → shorter interval
  // Underconfident: bet low, right often → longer interval (they know it)
  const calibration=accuracy/Math.max(0.1,avgBetRatio);
  return Math.round(baseInterval*Math.min(2.0,Math.max(0.4,calibration)));
}

// Legacy rate() — kept for backward compat, wraps new per-axis system
function rate(i,r){
  const ci=card(i); const now=Date.now();
  ci.seen=true;
  if(r===1){
    ci.reps=0; ci.lapses++; ci.iv=0; ci.due=now+DAY;
  } else {
    ci.reps++;
    const mult=r===2?1.2:r===3?2.5:3.5;
    ci.iv=ci.iv===0?(r===4?3:1):Math.min(Math.round(ci.iv*mult),365);
    const adjustedIv=confidenceAdjustedInterval(i,ci.iv);
    ci.due=now+adjustedIv*DAY;
    const mDelta={2:0.25,3:0.5,4:0.75}[r]||0.5;
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
    return true;
  }catch(e){ return false; }
}

// True when the course's reading slot just duplicates the displayed word — i.e. the
// orthography already encodes pronunciation (Vietnamese). Distinct from segment mode:
// Arabic is also space-delimited but its romanization IS useful, so it stays false.
function _readingRedundant(){ try{ const c=(typeof activeCourse==='function')&&activeCourse(); return !!(c&&c.readingIsWord); }catch(e){ return false; } }
function renderSyls(el, syls, fg){
  if(_readingRedundant()) return;   // the word already IS its reading — don't print it twice
  const rtl=activeCourse&&activeCourse().script==='rtl';
  if(rtl){
    const sp=document.createElement('span');
    sp.textContent=syls.map(([s])=>s).join('-');
    sp.style.color=fg;
    el.appendChild(sp);
  } else {
    syls.forEach(([s,t])=>{ const sp=document.createElement('span'); sp.textContent=s; sp.style.color=toneColor(t,fg); el.appendChild(sp); });
  }
}

function charFont(){
  const c=activeCourse?activeCourse():null;
  if(c&&c.script==='rtl') return "font-family:'Aref Ruqaa','Noto Naskh Arabic','Arabic Typesetting','Arial Unicode MS',sans-serif;font-weight:700";
  if(typeof _segMode==='function'&&_segMode()==='space') return "font-family:inherit";
  return "font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
}

function speak(text,lang,onDone,opts){
  if(!lang) lang=activeCourse?activeCourse().langCode:'zh-CN';
  if(S.sound==='mute'){ if(onDone) onDone(); return; }
  // Static pre-recorded audio takes priority over synthesis (better quality, dialect-accurate)
  try{
    const course=activeCourse?activeCourse():null;
    if(course&&course.audioMap&&course.audioMap[text]){
      const gen=++_ttsGen;
      _lastSpokenText=text; _lastSpokenLang=lang;
      _prewarmQueue=[]; _prewarmActive=false;
      if(typeof speechSynthesis!=='undefined'&&(speechSynthesis.speaking||speechSynthesis.pending)) try{ speechSynthesis.cancel(); }catch(e){}
      const cardCtx=(typeof activeCardIdx==='number'&&activeCardIdx>=0)?activeCardIdx:null;
      if(window.EW&&EW.obs) EW.obs.logEvent('tts:request',{text:text&&text.slice(0,16),lang:lang,card:cardCtx,gen:gen,modality:'static'});
      if(window.WaveViz&&!/^en/i.test(lang)&&!(activeCourse&&activeCourse().hasTone)) try{ WaveViz.startHeartbeat(); }catch(e){}
      const ok=_playStaticAudio(course.audioMap[text],function(){
        if(gen!==_ttsGen) return;
        if(onDone) onDone();
        if(window.EW&&EW.obs) EW.obs.logEvent('tts:end',{card:cardCtx,gen:gen,modality:'static'});
        if(window.WaveViz) setTimeout(WaveViz.clear,400);
        setTimeout(_doPrewarm,150);
      });
      if(ok) return;
      // Audio() failed to start — fall through to synthesis
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
    if(window.WaveViz&&!/^en/i.test(lang)&&!(activeCourse&&activeCourse().hasTone)) try{ WaveViz.startHeartbeat(); }catch(e){}
    let fired=false;
    const finish=(cancelled)=>{
      if(fired||gen!==_ttsGen) return;
      fired=true;
      if(!cancelled) _ewAudioEndAt=Date.now(); // observation-log latency decontam (§5)
      if(!cancelled&&onDone) onDone();
      if(window.EW&&EW.obs) EW.obs.logEvent('tts:end',{card:cardCtx,gen:gen});
      if(!cancelled&&window.WaveViz) setTimeout(WaveViz.clear,400);
      // Kick off silent pre-warm for upcoming cards (noop if nothing queued)
      if(!cancelled) setTimeout(_doPrewarm,150);
    };
    u.onend=()=>finish(false);
    if(opts&&opts.onBoundary) u.onboundary=opts.onBoundary;
    u.onerror=(ev)=>{
      // Expected cancellation from intentional boundary-cut (speakWithBlank) — suppress noise
      if(opts&&opts.suppressInterrupted&&ev&&ev.error==='interrupted'){ finish(true); return; }
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

// ── CONSTELLATION HOME MAP (3D orbit) ───────────────────────────
// Replaces the frequency grid. Object-space layout: ANGLE = part-of-
// speech sector (wedge width ∝ member count), RADIUS = Zipf rank (sqrt
// for even density), Z = depth-for-space + gentle mastery-forward bias
// (un-committed; promote to a real variable later with no layout move).
// BRIGHTNESS = mastery (state). The frontier is a glowing radius.
// FIBERS = sentence co-occurrence (the morphism graph from
// ENGINE.md). Camera: turntable orbit (yaw) about the
// vertical axis ⟂ the disc, viewed from a fixed elevation — no pan, no
// roll. The lift dimension is genuinely vertical (terrain, not toward-
// camera). Glyphless + audible: tap a star to hear
// it. Rendered to canvas; the animation loop is generation-guarded so
// re-renders never stack, and pauses when home is not visible.
const POS_SECTORS=['NOUN','VERB','PRON','ADV','ADJ','PART','CONJ','MISC'];
const POS_COLOR={NOUN:[255,184,77],VERB:[77,255,160],PRON:[77,216,255],ADV:[255,111,181],ADJ:[198,255,82],PART:[185,160,255],CONJ:[111,140,255],MISC:[255,122,77]};
function posRGB(s){const c=POS_COLOR[s]||[160,180,170]; return 'rgb('+c[0]+','+c[1]+','+c[2]+')';}
function macroPOS(p){
  p=(p||'').toLowerCase();
  if(p.indexOf('pronoun')>=0) return 'PRON';
  if(p.indexOf('adverb')>=0) return 'ADV';
  if(p.indexOf('verb')>=0||p.indexOf('modal')>=0) return 'VERB';
  if(p.indexOf('noun')>=0) return 'NOUN';
  if(p.indexOf('particle')>=0||p.indexOf('suffix')>=0) return 'PART';
  if(p.indexOf('adjective')>=0) return 'ADJ';
  if(p.indexOf('conjunction')>=0) return 'CONJ';
  return 'MISC';
}
// Co-occurrence edges, derived once from EXAMPLE_SENTENCES. Two atoms
// share a fiber if they appear together in any example sentence.
let _fiberCache=null,_fiberCacheD=null;
function constellationFibers(){
  if(_fiberCache&&_fiberCacheD===D) return _fiberCache;   // cache keyed on the active deck (course-safe)
  const sents=(typeof EXAMPLE_SENTENCES!=='undefined')?EXAMPLE_SENTENCES:{};
  const seen={},pairs=[];
  for(const key in sents){
    (sents[key]||[]).forEach(function(s){
      const text=(s&&s[0])||'';
      // decomposeSentence is segmentation-aware (substring for CJK, word-boundary
      // for space-delimited) — never re-implement the substring match here.
      const present=(typeof decomposeSentence==='function')?decomposeSentence(text):[];
      for(let a=0;a<present.length;a++)for(let b=a+1;b<present.length;b++){
        const pk=present[a]+'-'+present[b];
        if(!seen[pk]){seen[pk]=1;pairs.push([present[a],present[b]]);}
      }
    });
  }
  _fiberCache=pairs;_fiberCacheD=D;return pairs;
}
let _cnGen=0;
function renderConstellation(){
  const host=$('map'); if(!host) return;
  _cnGen++; const gen=_cnGen;                 // invalidate any prior animation loop
  host.innerHTML='';
  host.style.display='block';
  host.style.position='relative';
  host.style.padding='0';
  host.style.border='none';
  host.style.background='transparent';            // bleed with the dark home field
  const N=D.length; if(!N) return;
  // canvas sized to the hero region (responsive, full-bleed)
  const cv=document.createElement('canvas');
  cv.style.cssText='display:block;width:100%;height:46vh;max-height:540px;min-height:300px;cursor:grab;touch-action:none;';
  host.appendChild(cv);
  const ctx=cv.getContext('2d');
  const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
  const Wc=Math.max(280,cv.clientWidth||host.clientWidth||window.innerWidth||360);
  const Hc=Math.max(280,cv.clientHeight||360);
  cv.width=Wc*dpr; cv.height=Hc*dpr; ctx.scale(dpr,dpr);
  const CX=Wc/2,CY=Hc/2,Rmax=Math.min(Wc,Hc)*0.46,Rmin=Rmax*0.18,FOC=Rmax*2.6,CAM=Rmax*2.6,EL=0.60;
  // sectors
  const counts={}; POS_SECTORS.forEach(s=>counts[s]=0);
  const posOf=new Array(N);
  for(let i=0;i<N;i++){ const s=macroPOS(D[i][4]); posOf[i]=s; counts[s]++; }
  const active=POS_SECTORS.filter(s=>counts[s]>0);
  let ang=-Math.PI/2; const wedge={};
  active.forEach(s=>{ const w=(counts[s]/N)*2*Math.PI; wedge[s]=[ang,ang+w]; ang+=w; });
  // node geometry in object-space, centered at origin
  const seenK={},node=new Array(N);
  function hash(n){const x=Math.sin(n*99.13)*43758.5453; return x-Math.floor(x);}
  for(let i=0;i<N;i++){
    const s=posOf[i],wd=wedge[s],k=(seenK[s]=(seenK[s]||0)); seenK[s]++;
    const frac=(k*0.6180339)%1, a=wd[0]+0.10*(wd[1]-wd[0])+frac*0.80*(wd[1]-wd[0]);
    const r=(k===0)?Rmin:Rmin+(Rmax-Rmin)*Math.sqrt(i/N);
    const seen=S.cards[i]&&S.cards[i].seen, st=state(i);
    const fwd=!seen?-Rmax*0.30:(st-1)*Rmax*0.19, z=fwd+(hash(i+1)-0.5)*Rmax*0.62;
    node[i]={i:i,pos:s,seen:seen,st:st,x:r*Math.cos(a),y:r*Math.sin(a),z:z,_sx:null,_sy:null};
  }
  // fibers between introduced atoms
  const fibers=constellationFibers(),edges=[];
  for(let f=0;f<fibers.length;f++){const a=fibers[f][0],b=fibers[f][1]; if(node[a].seen&&node[b].seen) edges.push([node[a],node[b]]);}
  const frR=Rmin+(Rmax-Rmin)*Math.sqrt(Math.min(frontier(),N)/N);
  let yaw=0,zoom=1,dragging=false,lastX=0,moved=0,tapFx=null;
  const pts=new Map(); let pinchD0=0,zoom0=1;
  const CJK="'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  function proj(o){
    // disc lies on the ground plane (o.x,o.y); o.z is vertical lift.
    // Turntable: spin about the vertical axis (yaw), then view from a
    // fixed elevation. Yaw axis ⟂ disc → constant ellipse, no sliver.
    const gx=o.x,gz=o.y,gy=o.z;
    const cf=Math.cos(yaw),sf=Math.sin(yaw);
    const x1=gx*cf+gz*sf, z1=-gx*sf+gz*cf;
    const ca=Math.cos(EL),sa=Math.sin(EL);
    const y2=gy*ca+z1*sa, z2=-gy*sa+z1*ca;
    const sc=FOC/(FOC+CAM+z2)*zoom;
    return {sx:CX+x1*sc,sy:CY-y2*sc,sc:sc,depth:z2};
  }
  function draw(){
    const now=performance.now();
    ctx.clearRect(0,0,Wc,Hc);
    ctx.strokeStyle='rgba(77,255,160,0.22)'; ctx.setLineDash([2,7]); ctx.lineWidth=1; ctx.beginPath();
    for(let t=0;t<=64;t++){const aa=t/64*2*Math.PI,p=proj({x:frR*Math.cos(aa),y:frR*Math.sin(aa),z:0}); if(t===0)ctx.moveTo(p.sx,p.sy); else ctx.lineTo(p.sx,p.sy);} ctx.stroke(); ctx.setLineDash([]);
    for(let e=0;e<edges.length;e++){const a=proj(edges[e][0]),b=proj(edges[e][1]); ctx.strokeStyle='rgba(125,255,192,0.15)'; ctx.lineWidth=0.7; ctx.beginPath(); ctx.moveTo(a.sx,a.sy); ctx.lineTo(b.sx,b.sy); ctx.stroke();}
    const ps=node.map(o=>{const p=proj(o); p.o=o; o._sx=null; return p;}).sort((a,b)=>b.depth-a.depth);
    const labels=[];
    for(let q=0;q<ps.length;q++){
      const p=ps[q],o=p.o,c=POS_COLOR[o.pos];
      if(!o.seen){ ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+',0.12)'; ctx.beginPath(); ctx.arc(p.sx,p.sy,1.5*p.sc,0,7); ctx.fill(); continue; }
      const halo=(o.st>=3?13:o.st>=2?10:8)*p.sc, ha=(o.st>=3?0.34:o.st>=2?0.22:0.15);
      const g=ctx.createRadialGradient(p.sx,p.sy,0,p.sx,p.sy,halo);
      g.addColorStop(0,'rgba('+c[0]+','+c[1]+','+c[2]+','+ha+')'); g.addColorStop(1,'rgba('+c[0]+','+c[1]+','+c[2]+',0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.sx,p.sy,halo,0,7); ctx.fill();
      const core=(o.st>=3?4:o.st>=2?3.2:2.6)*p.sc;
      ctx.fillStyle=o.st>=3?'#ffffff':'rgb('+c[0]+','+c[1]+','+c[2]+')';
      ctx.beginPath(); ctx.arc(p.sx,p.sy,core,0,7); ctx.fill();
      if(o.st>=3){ ctx.strokeStyle='rgb('+c[0]+','+c[1]+','+c[2]+')'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(p.sx,p.sy,core+2,0,7); ctx.stroke(); }
      o._sx=p.sx; o._sy=p.sy;
      // detail-on-demand: once zoomed in, on-screen seen stars earn a label
      if(zoom>=2.0 && p.sx>-30&&p.sx<Wc+30&&p.sy>-30&&p.sy<Hc+50) labels.push({p:p,o:o,c:c,core:core});
    }
    // label pass on top: glyph (target language), then gloss (parent) when closer
    for(let l=0;l<labels.length;l++){
      const L=labels[l],p=L.p,o=L.o,c=L.c, gs=Math.max(12,Math.min(40,8+L.core*1.6));
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.font='600 '+gs+'px '+CJK;
      ctx.fillStyle='rgba(255,255,255,0.94)';
      ctx.fillText(D[o.i][0], p.sx, p.sy+L.core+3);
      if(zoom>=3.4){
        const ds=Math.max(9,gs*0.4);
        ctx.font=ds+'px ui-monospace,monospace';
        ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+',0.9)';
        ctx.fillText(D[o.i][2], p.sx, p.sy+L.core+3+gs+2);
      }
    }
    if(tapFx){
      const dt=now-tapFx.t0;
      if(dt>520) tapFx=null;
      else{ const o=node[tapFx.i]; if(o&&o._sx!=null){ const k=dt/520; ctx.strokeStyle='rgba(255,255,255,'+(0.6*(1-k))+')'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(o._sx,o._sy,5+k*28,0,7); ctx.stroke(); } }
    }
  }
  function visible(){ return !document.hidden && $('home') && $('home').style.display!=='none'; }
  function loop(){
    if(gen!==_cnGen) return;                  // a newer render replaced us — stop
    if(visible()){ draw(); }
    requestAnimationFrame(loop);
  }
  function px(e){const r=cv.getBoundingClientRect(); return (e.clientX-r.left)/r.width*Wc;}
  function py(e){const r=cv.getBoundingClientRect(); return (e.clientY-r.top)/r.height*Hc;}
  function clampZoom(z){return Math.max(0.7,Math.min(8,z));}
  function hideHint(){const h=document.getElementById('mapHint'); if(h) h.style.opacity='0';}
  function handleTap(e){
    const mx=px(e),my=py(e); let best=null,bd=1e9;
    for(let i=0;i<N;i++){const o=node[i]; if(!o.seen||o._sx==null)continue; const d=(o._sx-mx)*(o._sx-mx)+(o._sy-my)*(o._sy-my); if(d<bd){bd=d;best=o;}}
    if(best&&bd<420){ if(S.sound!=='mute') speak(D[best.i][0],activeCourse().langCode); tapFx={i:best.i,t0:performance.now()}; }
  }
  cv.addEventListener('pointerdown',e=>{
    try{cv.setPointerCapture(e.pointerId);}catch(_){}
    pts.set(e.pointerId,{x:px(e),y:py(e)}); hideHint();
    if(pts.size===1){ dragging=true; moved=0; lastX=px(e); cv.style.cursor='grabbing'; }
    else if(pts.size===2){ dragging=false; const a=[...pts.values()]; pinchD0=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1; zoom0=zoom; }
  });
  cv.addEventListener('pointermove',e=>{
    if(!pts.has(e.pointerId)) return;
    pts.set(e.pointerId,{x:px(e),y:py(e)});
    if(pts.size>=2){ const a=[...pts.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y); zoom=clampZoom(zoom0*(d/(pinchD0||1))); }
    else if(dragging){ const x=px(e),dx=x-lastX; lastX=x; moved+=Math.abs(dx); yaw+=dx*0.006; }
  });
  function endPtr(e){
    const wasTap=(pts.size===1 && dragging && moved<6);
    pts.delete(e.pointerId);
    if(pts.size===0){ cv.style.cursor='grab'; if(wasTap) handleTap(e); dragging=false; }
    else if(pts.size===1){ const a=[...pts.values()][0]; dragging=true; lastX=a.x; moved=99; }  // resume orbit after pinch (suppress tap)
  }
  cv.addEventListener('pointerup',endPtr);
  cv.addEventListener('pointercancel',endPtr);
  cv.addEventListener('wheel',e=>{ e.preventDefault(); hideHint(); zoom=clampZoom(zoom*(1-e.deltaY*0.0030)); },{passive:false});
  // POS legend
  const leg=document.createElement('div');
  leg.style.cssText='position:absolute;top:6px;left:8px;display:flex;flex-wrap:wrap;gap:2px 8px;font-size:8px;letter-spacing:1px;max-width:62%;';
  active.forEach(function(s){
    const sp=document.createElement('span'); sp.style.color='#9ab';
    sp.innerHTML='<span style="color:'+posRGB(s)+'">●</span>'+s.toLowerCase();
    leg.appendChild(sp);
  });
  host.appendChild(leg);
  // faint control hint (fades on first interaction); word detail now lives on the stars
  const hint=document.createElement('div'); hint.id='mapHint';
  hint.style.cssText='position:absolute;left:8px;bottom:6px;font-size:9px;letter-spacing:1px;color:#9fd;opacity:.4;transition:opacity .5s;pointer-events:none;';
  hint.textContent='drag · pinch or scroll to zoom · tap to hear';
  host.appendChild(hint);
  loop();
}
function renderHome(){
  applyBilingualUI();
  // Always destroy fatigue overlay on home screen
  const overlay=document.getElementById('fatigueOverlay');
  if(overlay) overlay.remove();
  // Dark map-mode home: set the field dark and the ink light once. Buttons,
  // borders and labels inherit it through the cascade (currentColor) — no
  // per-element stamping, so new chrome is legible here by default.
  const fg=hsl(bgHue+GA,75,65);
  const homeEl=$('home'); if(homeEl){ homeEl.style.background='#070b08'; homeEl.style.color=hsl(bgHue,55,82); }
  renderConstellation();
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
  const course=activeCourse&&activeCourse();
  $('mapLabel').textContent='FRONTIER '+frVal+'  ·  '+activeDeckName().toUpperCase()+' ▸';
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
    if(capLbl) capLbl.textContent='CAPABILITY';
    $('milestoneProgFill').style.width=(cap.next?cap.nextPct:100)+'%';
    $('milestoneProgFill').style.background=fg;
    $('milestoneProgLabel').textContent = cap.next ? cap.nextPct+'%' : '✓ ALL';
    const youCan = cap.current ? ('CAN '+cap.current.cap) : 'NO CAPABILITY YET';
    const eff = cap.next ? (' · NEXT '+cap.next.cap+' ('+cap.effort+(cap.sigma!=null?' · σ'+cap.sigma:'')+')') : ' · ALL TIERS CLOSED';
    $('milestoneProgNote').textContent=(youCan+eff).toUpperCase();
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

  // Capability render (THEORY.md §10.2): which basis tier the learner has CLOSED.
  // A tier is achieved when all its atoms have GRADUATED (filter-crossing, not seen).
  // effort-to-next = un-graduated atoms of the next tier, σ-weighted where σ exists.
  // Returns null when the course has no resolvable basis (→ caller shows coverage).
  capability(){
    let g; try{ g=computeGenerativeBasis(); }catch(e){ return null; }
    if(!g||!g.tiers||!g.tiers.length) return null;
    if(!g.tiers.some(t=>t.atoms&&t.atoms.length)) return null;  // no role-atoms resolved
    const grad=ch=>{ const i=D.findIndex(d=>d[0]===ch); if(i<0) return false; try{ return Scheduler._isGraduated((S.cards&&S.cards[i])||{}); }catch(e){ return false; } };
    let current=null, next=null, ok=true;
    g.tiers.forEach(t=>{
      const atoms=(t.atoms||[]).map(a=>a.ch);
      const allGrad=atoms.length>0 && atoms.every(grad);
      if(ok && allGrad) current=t;
      else { ok=false; if(!next) next=t; }
    });
    let effort=0, sigma=0, hasSigma=false; const nextAtoms=[];
    if(next){ (next.atoms||[]).forEach(a=>{ if(!grad(a.ch)){ effort++; nextAtoms.push(a.ch);
      try{ const s=(typeof substitution==='function')&&substitution(a.ch); if(s&&s.d!=null){ sigma+=s.d; hasSigma=true; } }catch(e){} } }); }
    const nextTotal=next?(next.atoms||[]).length:0;
    return { current, next, effort, nextAtoms, sigma:hasSigma?Math.round(sigma*10)/10:null,
             nextPct: nextTotal?Math.round((nextTotal-effort)/nextTotal*100):100 };
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
  // Theme flows through the cascade: --bg/--fg on :root + body, components use
  // currentColor for borders and inherit color. No per-element stamping here.
  return {fg};
}

/* ============ TONE DRILL ============ */
// Tone labels and descriptions
const TONE_LABEL=['-','1ST','2ND','3RD','4TH','NEUT'];

let toneQueue=[],toneIdx=0,toneCur=-1,toneCombo=0,toneLocked=false,toneAudioMode=false;

function startTone(){
  if(!(activeCourse&&activeCourse()&&activeCourse().hasTone)){ goHome(); return; }
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
// Core deck has no fixed indices/name — see coreIndices()/activeDeckName(),
// which derive from the active lexicon (D) so they track the active course.
const BUILTIN_DECKS = {
  'core': { name:'CORE' }
};

// Get merged deck list: builtins + user-created
function allDecks(){ return {...BUILTIN_DECKS, ...S.decks}; }

// Active deck index list
// The core deck spans every index in the active lexicon. Computed from
// D.length so it tracks the active course's size (Mandarin 100, Japanese 50…).
function coreIndices(){ return Array.from({length:D.length},(_,i)=>i); }

function activeDeckIndices(){
  if(S.activeDeck==='core'||!S.activeDeck) return coreIndices();
  const d = allDecks()[S.activeDeck];
  return d ? d.indices : coreIndices();
}

function activeDeckName(){
  if(S.activeDeck==='core'||!S.activeDeck) return 'CORE '+D.length;
  const d = allDecks()[S.activeDeck];
  return d ? d.name : 'CORE '+D.length;
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
      } else {
        if(confirm('Delete deck "'+(allDecks()[b.dataset.id]&&allDecks()[b.dataset.id].name||'')+'"?')){
          deleteDeck(b.dataset.id);
          renderDeckMgr();
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
let sessionRecentCards=[]; // ring buffer — last N vocab card indices shown
let sessionAnswerRing=[]; // ring buffer — last M answer booleans (true=correct)
const RECENCY_WINDOW=10;
const ANSWER_RING_SIZE=15;

function wordModality(i){
  // === DEPRECATED LEGACY (pre-FromAxes, pre-Scheduler) — no direct callers in primary paths
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

// Single explicit session-state bag for Scheduler.next and Scheduler.modality.
// The live module session globals (studyPending, sessionRecentCards, …) are the SINGLE
// source of truth — pushed/cleared directly by startStudy / showStudyCard / the drill
// handlers. Read module-only (no dual-state mirror): keeps the recency window live
// across answers and the grammarAnswered Set always iterable.
function buildSessionState(){
  return {
    studyCardCount,
    studyFlashOnly,
    studyModalityFilter,
    studyPending: [...studyPending],
    sessionGrammarAnswered: new Set(sessionGrammarAnswered),
    studyEncounters: new Map(studyEncounters),
    sessionRecentCards: [...sessionRecentCards],
    sessionAnswerRing: [...sessionAnswerRing],
    nextQueueRebuildAt
  };
}

function buildStudyQueue(){
  // === LEGACY v1 (only used in !policy paths or for compatibility in some v2 fallbacks) ===
  // THREE POOLS interleaved:
  // GRAMMAR: due category drills (language-agnostic) — negative keys
  // VOCABULARY: due word cards (language-specific) — D array indices
  // CONVERGENCE: handled inside showStudyCard when both tracks ready

  const grammarDuePool=[],vocabDue=[],vocabSeen=[];

  // Grammar metalanguage drills (名词/动词…, the tl_integration axis) are NO
  // LONGER auto-interleaved into normal study. They test untaught Chinese
  // metavocabulary and are incomprehensible mid-acquisition — the opposite of
  // comprehensible input. They remain reachable via the explicit GRAMMAR DRILL
  // debug button, which builds its own queue in startStudy and does not use this
  // pool. Re-enable here only once a progressive-localization design teaches the
  // terms first (each Chinese grammar term introduced as a flashcard before use).
  const dueDrills=[];
  dueDrills.forEach(({cat,axis})=>{
    grammarDuePool.push(grammarQueueKey(cat,axis));
  });

  D.forEach((_,i)=>{
    if(!isUnlocked(i)) return;
    const ci=S.cards[i];
    if(!ci||!ci.exp) return;
    if(isCardDue(i)||isWallClockRipe(i)) vocabDue.push(i);
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
  if(window.EW&&EW.obs) EW.obs.logEvent('session:start',{flashOnly:!!flashOnly,policy:newSchedulerPolicy()});
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
  // === LEGACY v1 (adaptive intro cadence) — under policy, Scheduler.next handles introduces
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

  // CLEAN MIGRATION: when policy is on, delegate to pure Scheduler.next (L3).
  // Returns early after showing the card; v1 path below is preserved for rollback.
  if(newSchedulerPolicy()){
    try{
      const schedState=S; // S is the authoritative live card state (the old drifting State._s shadow is removed)
      const sessionState=buildSessionState();
      const decision=Scheduler.next(schedState,D,sessionState);
      if(window.EW&&EW.obs) EW.obs.logEvent('study:next',{type:decision&&decision.type,reason:decision&&decision.reason,idx:decision&&decision.idx,source:'v2-scheduler'});
      if(decision){
        if((decision.type==='pending'||decision.pending)&&decision.pending){
          const pending=decision.pending;
          const reIdx=typeof pending==='object'?pending.idx:pending;
          const reMod=typeof pending==='object'?pending.mod:null;
          // Hard invariant: never show same card twice in a row.
          const _v2LastShown=sessionRecentCards[sessionRecentCards.length-1];
          if(typeof reIdx==='number'&&!isGrammarKey(reIdx)&&reIdx===_v2LastShown){
            studyCardCount++; // break modulo so pending re-queue skips next call
            nextStudyCard(); return;
          } else {
            if(typeof reIdx==='number'&&isGrammarKey(reIdx)){
              const reCat=grammarCatFromKey(reIdx);
              if(reCat){ showGrammarDrill(reCat); return; }
            }
            if(reMod&&reMod!=='flash'){
              lastModality.set(reIdx,reMod);
              if(reMod==='convergence'){ showConvergenceQuestion(reIdx); return; }
              if(reMod==='cloze'){ showStudyCloze(reIdx); return; }
              if(reMod==='comprehension'){ showStudyComprehension(reIdx); return; }
              if(reMod==='word-order'){ showWordOrderDrill(reIdx); return; }
              if(reMod==='pos-s1'||reMod==='pos-s2'||reMod==='pos-s3'){
                const ps=reMod==='pos-s1'?1:reMod==='pos-s2'?2:3;
                showStudyPOSStaged(reIdx,ps); return;
              }
              showStudyMC(reIdx,reMod==='mc-rev'); return;
            }
            showStudyCard(reIdx); return;
          }
        }
        if(decision.type==='introduce'&&decision.idx>=0){
          showStudyCard(decision.idx); return;
        }
        if(decision.idx>=0){
          if(isGrammarKey(decision.idx)){
            const cat=grammarCatFromKey(decision.idx);
            const axis=grammarAxisFromKey(decision.idx);
            if(cat&&!sessionGrammarAnswered.has(cat+':'+axis)){
              showGrammarDrill(cat,axis); return;
            }
          }
          showStudyCard(decision.idx); return;
        }
      }
      goHome(); return;
    }catch(e){
      console.error('Scheduler.next error',e);
      if(window.EW&&EW.obs) EW.obs.captureError(e,{phase:'study-loop-v2'});
      goHome(); return;
    }
  }
  goHome();
}

// Single place for session-level modality overrides (studyFlashOnly and studyModalityFilter).
// Returns a concrete mod string if an override applies, otherwise null
// (caller then chooses v2 Scheduler.modality or v1 wordModalityFromAxes).
// Populate the TTS pre-warm queue with the next 2-3 upcoming vocab cards.
// scheduleTTSPrewarm() is defined in data.js; _doPrewarm() fires it after real TTS ends.
// Only effective for local (SAPI) voices — best-effort, never blocks study flow.
// Note: under v2 scheduler policy studyQueue may be stale; pre-warm degrades gracefully.
function schedulePrewarmFromQueue(){
  if(typeof scheduleTTSPrewarm!=='function') return;
  try{
    const lang=activeCourse().langCode;
    const items=[];
    for(let s=studyIdx; s<Math.min(studyIdx+3,studyQueue.length); s++){
      const qi=studyQueue[s];
      if(qi==null||isGrammarKey(qi)||qi<0||qi>=D.length) continue;
      items.push({text:D[qi][0], lang});
    }
    scheduleTTSPrewarm(items);
  }catch(e){}
}

function resolveStudyModality(i){
  if(studyFlashOnly) return 'flash';
  if(studyModalityFilter==='mc'){
    const mstg=getAxisStage(i,'meaning');
    if(mstg>=3&&clozeUnlocked(i)) return Math.random()<0.5?'cloze':'mc-rev';
    return (card(i).exp||0)>0?'mc-fwd':'flash';
  }
  if(studyModalityFilter==='tone') return (activeCourse().hasTone&&(card(i).exp||0)>0)?'tone':'flash';
  if(studyModalityFilter==='pos'){
    const ps=Math.max(1,getAxisStage(i,'pos'));
    return 'pos-s'+Math.min(ps,3);
  }
  return null;
}

function showStudyCard(i){
  if(i===undefined||i===null||isGrammarKey(i)||i<0||i>=D.length){ nextStudyCard(); return; }
  clearCardState();
  studyCardCount++;
  S.totalSeen=(S.totalSeen||0)+1; save();
  try{ card(i)._lastSeenAt=S.totalSeen; }catch(e){}  // fair-rotation stamp (see _pickFromPools)
  tickSessionCard();
  studyEncounters.set(i,(studyEncounters.get(i)||0)+1);
  if(studyCardCount===1&&window.EW&&EW.obs) EW.obs.logEvent('session:firstFlash',{idx:i});
  sessionRecentCards.push(i);
  if(sessionRecentCards.length>RECENCY_WINDOW) sessionRecentCards.shift();
  schedulePrewarmFromQueue();

  // Colloquialism interjection: only show if unlocked, frequency-ranked
  // Fire every ~11 cards but only show the highest-priority unlocked coll
  if(studyCardCount%11===0&&activeCourse&&activeCourse().hasColls){
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
  if(studyCardCount%5===0 && hasSeenBack && getAxisStage(i,'meaning')>=2 && activeCourse&&activeCourse().hasTone){
    showStudyTone(i);
    return;
  }

  // Modality: session overrides first, then v2 Scheduler or v1 wordModalityFromAxes
  let mod=resolveStudyModality(i);
  if(mod===null){
    if(newSchedulerPolicy()){
      try{
        const schedState=S; // S is the authoritative live card state (the old drifting State._s shadow is removed)
        mod=Scheduler.modality(schedState,D,i);
        if(window.EW&&EW.obs) EW.obs.logEvent('study:modality',{item:i,mod:mod,source:'v2-scheduler'});
      }catch(e){
        console.error('Scheduler.modality fallback',e);
        try{ mod=wordModalityFromAxes(i); }catch(_){ mod='mc-fwd'; }
      }
    }
  }
  // HARD INVARIANT: a word is NEVER presented in a test modality before it has
  // been shown as a flashcard. First contact is always recognition. If anything
  // resolves a non-flash modality for an unseen word, force the flashcard and
  // log a violation. Checks both exp===0 AND !seen — exp can be >0 from migration
  // artifacts without the word ever being properly shown as a flashcard.
  if(mod!=='flash' && ((card(i).exp||0)===0 || !card(i).seen)){
    try{ if(window.EW&&EW.obs) EW.obs.logEvent('violation',{type:'unseen-in-test',item:i,modality:mod,char:(D[i]&&D[i][0]),exp:(card(i).exp||0),seen:!!card(i).seen}); }catch(e){}
    mod='flash';
  }
  lastModality.set(i,mod);
  try{ if(window.EXPLAIN_MODE && window.renderCardExplain) window.renderCardExplain(i, mod); }catch(e){}  // WHY THIS CARD live caption
  if(mod==='flash'){
    showStudyFlash(i);
  } else if(mod==='convergence'){
    showConvergenceQuestion(i);
  } else if(mod==='cloze'){
    showStudyCloze(i);
  } else if(mod==='comprehension'){
    showStudyComprehension(i);
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
  const CJKf=charFont();
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
    ci0.axisDue['meaning']=(S.totalSeen||0)+AXIS_STABILITY.meaning[0]; // 3 cards
    ci0.axisDue['pos']=(S.totalSeen||0)+AXIS_STABILITY.pos[0]; // 5 cards
    save();
    // Pull a frontier-legal example sentence for this newly-introduced atom in
    // the background (non-blocking, rate-limited, no-op without an API key) so
    // context is ready when it later needs a cloze/word-order modality.
    try{ if(typeof requestSentenceFor==='function') requestSentenceFor(i,function(){}); }catch(e){}
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
  renderSyls(py,syls,fg);
  if(window.WaveViz){const _wvc=activeCourse?activeCourse():null;WaveViz.setWord(syls,!!(_wvc&&_wvc.hasTone));}

  // Fire TTS after hanzi+pinyin are in the DOM. 30ms lets SAPI settle after prime/cancel.
  // Guard with activeCardIdx: if the user advances before the timeout fires, skip stale speak.
  if(S.sound!=='mute'){
    const isFirst=((studyEncounters.get(i)||0)===1);
    if(window.EW&&EW.obs) EW.obs.logEvent('tts:request',{card:i,lang:activeCourse().langCode,firstInSession:isFirst});
    const _flashTTSCard=i;
    setTimeout(()=>{ if(activeCardIdx===_flashTTSCard) speak(ch,activeCourse().langCode); },30);
  }

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
      $('studyXP').textContent=studyHudText();
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
// Force-advance the frontier: show the next un-introduced word (user-queued first,
// then Zipf order) as a flashcard, growing the seen-distractor pool. Used when a
// test modality can't assemble an even choice grid. Returns true if it showed one.
function introduceForDistractor(){
  if(S.userWordQueue&&S.userWordQueue.length){
    for(var q=0;q<S.userWordQueue.length;q++){
      var wi=S.userWordQueue[q];
      if(D[wi]&&!(S.cards[wi]&&S.cards[wi].seen)){ showStudyFlash(wi); return true; }
    }
  }
  for(var j=0;j<D.length;j++){
    if(!(S.cards[j]&&S.cards[j].seen)){ showStudyFlash(j); return true; }
  }
  return false;
}

function showStudyMC(i, reverse, showPosHint){
  activeCardIdx=i; mcCur=i; mcLocked=false; mcReverse=reverse;
  rollBg();

  // Render into studyMC panel
  const [ch,syls,def,,pos]=D[i];
  // Target-lang TTS deferred 30ms to let SAPI settle after prime/cancel.
  // English is immediate (en-US voice doesn't need settle time).
  if(S.sound!=='mute'){
    if(!reverse){
      const isFirst=((studyEncounters.get(i)||0)===1);
      if(window.EW&&EW.obs) EW.obs.logEvent('tts:request',{card:i,lang:activeCourse().langCode,firstInSession:isFirst});
      const _mcTTSCard=i;
      setTimeout(()=>{ if(activeCardIdx===_mcTTSCard) speak(ch,activeCourse().langCode); },30);
    } else {
      speak(def,'en-US');
    }
  }
  const fg=getComputedStyle(document.body).color;
  const CJKf=charFont();
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
    renderSyls(py,syls,ink);
    if(window.WaveViz){const _wvc=activeCourse?activeCourse():null;WaveViz.setWord(syls,!!(_wvc&&_wvc.hasTone));}
  } else {
    // Reverse mode: English prompt → progressively localized as meaning axis stage rises
    // Stage 0-1: English def + TTS speaks Mandarin answer (full scaffold)
    // Stage 2+:  English definition always shown; Chinese POS label added below
    const meaningStg=getAxisStage(i,'meaning');
    const displayDef=def.toUpperCase();
    const posLabel=pos||'';
    let posDisplay='';
    if(posLabel){
      const zhPos=(activeCourse&&activeCourse().langCode==='zh-CN')?(POS_ZH[posLabel]||''):'';
      if(meaningStg<2) posDisplay=posLabel.toUpperCase();
      else if(meaningStg<4) posDisplay=posLabel.toUpperCase()+(zhPos?' · '+zhPos:'');
      else posDisplay=zhPos||posLabel.toUpperCase();
    }
    $('studyMCPromptText').innerHTML=
      '<span style="font-size:18px">'+displayDef+'</span>'+
      (posDisplay?'<br><span style="font-size:9px;opacity:.65;letter-spacing:1px;">'+posDisplay+'</span>':'');
    $('studyMCPinyin').innerHTML='';
    if(window.WaveViz) WaveViz.setWord([],false);
  }

  // Choices — adaptive count based on mastery
  const mStage2=meaningStage(masteryScore(i));
  const [nC2, gridCols2]=reverse?adaptiveChoiceCountReverse(i):adaptiveChoiceCount(i,'mc-fwd');
  studyConfidence=null;
  const correct=reverse?ch:def;
  // Pull distractors, then FORCE an even total (odd # of distractors) so the grid is
  // never odd. If we can't form even a 2-choice grid, advance the frontier to grow the
  // seen-distractor pool (introduce next Zipf / user-queued word) per the even-grid rule.
  let _dists=reverse?pickCharDistractors(i,nC2-1):pickMeaningDistractors(i,nC2-1,mStage2);
  if(_dists.length%2===0) _dists=_dists.slice(0,_dists.length-1);
  if(_dists.length<1){ if(introduceForDistractor()) return; showStudyFlash(i); return; }
  const choices=shuffle([correct,..._dists]);
  const _total=choices.length; // even by construction

  const box=$('studyMCChoices'); box.innerHTML='';
  box.style.gridTemplateColumns=_total<=4?'1fr 1fr':'1fr 1fr 1fr';

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
      if(mIdx>=0&&D[mIdx][1].length&&!(typeof _readingRedundant==='function'&&_readingRedundant())){
        const pyWrap=document.createElement('span');
        pyWrap.style.cssText='font-size:9px;display:flex;gap:3px;font-family:\'Noto Sans\',Arial,sans-serif;';
        D[mIdx][1].forEach(([s,t])=>{
          const sEl=document.createElement('span'); sEl.textContent=s; sEl.style.color=toneColor(t,fg);
          pyWrap.appendChild(sEl);
        });
        b.appendChild(pyWrap);
      }
    } else {
      const fsize=_total<=2?'12px':_total<=4?'11px':'9px';
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
  // Wire inline wager controls — anchored to the HOUSE LINE (model P_algo via
  // Scheduler._pCorrect), NOT the streak. uplift = bet - line = Δ(P_user, P_algo).
  ensureBankrollDay();
  const _wmod=reverse?'mc-rev':'mc-fwd';
  const _line=houseLineLabel(i,'meaning',_wmod);
  defaultMultIdx=houseLineIdx(i,'meaning',_wmod);
  currentMultIdx=defaultMultIdx;
  wagerTouched=false;
  const sml=document.getElementById('studyMultLabel');
  const fmtWager=()=>{ const d=currentMultIdx-defaultMultIdx; const tag=d>0?' ▲':d<0?' ▼':''; return MULT_STEPS[currentMultIdx]+'x'+tag+'  ·  HOUSE '+_line.read+' '+_line.odds+':1'; };
  if(sml) sml.textContent=fmtWager();
  const swd=document.getElementById('studyWagerDown');
  const swu=document.getElementById('studyWagerUp');
  if(swd){ swd.style.borderColor=fg; swd.style.color=fg;
    swd.onclick=(e)=>{ e.stopPropagation(); currentMultIdx=Math.max(0,currentMultIdx-1); wagerTouched=true; if(sml) sml.textContent=fmtWager(); }; }
  if(swu){ swu.style.borderColor=fg; swu.style.color=fg;
    swu.onclick=(e)=>{ e.stopPropagation(); currentMultIdx=Math.min(MULT_STEPS.length-1,currentMultIdx+1); wagerTouched=true; if(sml) sml.textContent=fmtWager(); }; }
  const sModeEl=document.getElementById('studyMCModality');
  if(sModeEl){ sModeEl.textContent=reverse?'MEANING → CHARACTER':'CHARACTER → MEANING'; }
  $('studyXP').textContent=studyHudText();

  // Wager bar — always present on MC
  studyDontKnowAction=()=>{
    if(mcLocked) return; mcLocked=true;
    recordObservation({mod:reverse?'mc-rev':'mc-fwd',comp:null,fg:i,fax:'meaning',ok:false,opt:null});
    recordAxisResultNew(i,'meaning',false,Date.now()-cardShownAtMC);
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

  const responseMs=Date.now()-cardShownAtMC;
  logAnswer(i,isCorrect, mcReverse?'mc-rev':'mc-fwd', responseMs);
  if(!isCorrect){
    if(typeof beepError==='function') beepError();
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
  recordWagerDecision(i, isCorrect, currentMultIdx, defaultMultIdx, responseMs);
  recordObservation({mod:mcReverse?'mc-rev':'mc-fwd',comp:null,fg:i,fax:'meaning',ok:isCorrect,opt:chosen});
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
    const xpGained=computeXP(true, currentMultIdx, responseMs, defaultMultIdx)*(mcCombo>=5?2:1);
    const _won=Math.round(xpGained*fatigueXPMultiplier());
    S.xp+=_won;
    if(!isBusted()){ S.chips=settleWager(S.chips||0,currentMultIdx,defaultMultIdx,true,_won).chips; }
    rate(i,3);
    if($('studyMCExplain')) $('studyMCExplain').textContent='';
  } else {
    mcCombo=0;
    resetMult();
    if(!isBusted()){ S.chips=settleWager(S.chips||0,currentMultIdx,defaultMultIdx,false,0).chips; if((S.chips||0)<=0) S.busted=true; }
    // Overconfident wrong (high wager, fast) = bigger loss
    const mLoss2=(sConfident?-0.8:sUnsure?-0.2:-0.5)*wagerMult*(speedMult>1.0?1.2:1.0);
    rate(i,1); studyPending.push(i);
    const CJKe="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
    const [correctCh,,correctDef]=D[i];
    const el=$('studyMCExplain');
    if(el){
      if(!mcReverse){
        el.textContent='✗ '+chosen.toUpperCase()+' → ✓ '+correctDef.toUpperCase();
        el.style.fontFamily='inherit';
      } else {
        el.textContent='✗ '+chosen+' → ✓ '+correctCh;
        el.style.fontFamily=charFont().split(':')[1].trim();
      }
    }
  }
  save();
  $('studyXP').textContent=studyHudText();

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

// Stage 4 (no character, pure listening) is an advanced modality that presupposes
// both a critical vocabulary mass and grammar engagement sufficient to have
// internalized how tone works as a linguistic concept.
// Until both conditions are met, the learner benefits more from character-visible
// stages (1–3) that pair the written form with its tone — i.e., familiarization.
function toneAdvancedUnlocked(){
  // Vocabulary gate: 150 introduced words means enough target-language exposure
  // that explicit character/tone pairing is no longer the primary learning need.
  const vocabCount=typeof introducedCount==='function'?introducedCount():0;
  if(vocabCount<150) return false;
  // Grammar engagement gate: meaningful practice across categories shows the learner
  // has developed a working model of the language — the cognitive foundation for
  // audio-only tone recognition without visual anchors.
  const gm=S.grammarMastery;
  if(!gm) return false;
  let totalAttempts=0, engagedCats=0;
  Object.keys(gm).forEach(cat=>{
    const g=gm[cat];
    if(!g) return;
    totalAttempts+=(g.attempts||0);
    if((g.attempts||0)>=10) engagedCats++;
  });
  return totalAttempts>=40&&engagedCats>=3;
}

function toneStage(mastery){
  if(mastery<1.0) return 1; // char+pinyin shown, audio plays — associate mark with sound
  if(mastery<2.0) return 2; // char only, audio plays — identify by ear
  // Stage 4 (no character) only unlocks after sufficient vocabulary and grammar engagement.
  // Until then, stay in stage 3 regardless of per-word mastery.
  if(mastery<3.0||!toneAdvancedUnlocked()) return 3; // char visible, no audio until answer
  return 4;                  // no char, pure listening — advanced; requires vocab+grammar maturity
}

function showStudyTone(i){
  toneCur=i; toneLocked=false;
  activeCardIdx=i;
  rollBg();
  const [ch,syls]=D[i];
  const CJKf=charFont();
  const fg=getComputedStyle(document.body).color;
  const stage=toneStage(masteryScore(i));
  const _toneMatch=syls.find(([,t])=>t!==0); const primaryTone=_toneMatch?_toneMatch[1]:syls[0][1];
  const tSym={1:'-',2:'/',3:'v',4:'\u005c',0:'.'};

  // Stage label tells user what kind of question this is
  const stageLabels={1:'TONE · LISTEN',2:'TONE · LISTEN',3:'TONE · READ',4:'TONE · LISTEN ONLY'};
  $('studyMode').textContent=stageLabels[stage];
  // Single managed replay timer -- cancelled on correct tap, skip, don't-know, or manual replay.
  // Prevents multiple wrong taps stacking competing speak() calls that cause SAPI errors.
  let replayTimer=null;
  function cancelReplay(){ if(replayTimer){ clearTimeout(replayTimer); replayTimer=null; } }
  function scheduleReplay(){
    cancelReplay();
    if(S.sound==='mute') return;
    const _toneCard=activeCardIdx;
    replayTimer=setTimeout(()=>{ replayTimer=null; if(!toneLocked&&activeCardIdx===_toneCard) speak(ch,activeCourse().langCode); },650);
  }

  // Tap tone prompt to replay audio (before answer)
  $('studyTonePrompt').onclick=(e)=>{
    if(toneLocked) return;
    cancelReplay(); // prevent timer from double-speaking after manual replay
    if(S.sound!=='mute') speak(D[i][0],activeCourse().langCode);
    e.stopPropagation();
  };
  // Rings and wager
  renderChallengeRings(i,'tone',$('studyTonePrompt'));
  cardShownAtMC=Date.now();
  studyDontKnowAction=()=>{ if(toneLocked) return; cancelReplay(); toneLocked=true; studyPending.push(i); armTapAdvance($('studyTone'),()=>nextStudyCard(),0); };
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

  // Tone drills autoplay the target word across the learning range: it is a listening
  // task — you can't identify a tone you haven't heard. Stage 3 used to stay silent
  // until the answer, but stage 3 is reached at mid mastery (the tone drill only
  // appears once meaning-axis stage >= 2, by which point .m has usually crossed 2.0),
  // so the silent variant surfaced as "tone drill has no audio" at low mastery. Stage 4
  // (pure listen) plays too. A correct tap replays below to reinforce.
  if(S.sound!=='mute') speak(ch,activeCourse().langCode);

  // Build tone buttons -- force-correct paradigm:
  // wrong tap -> error sound + dim button + audio replay; card stays live until correct tone found.
  // Scored on first-try result: finding the right tone eventually doesn't erase the initial miss.
  const box=$('studyToneChoices'); box.innerHTML='';
  let wrongTaps=0; // wrong attempts before correct tone found this card
  [1,2,3,4,0].forEach(t=>{
    const b=document.createElement('button');
    b.className='tone-btn';
    b.style.borderColor=fg; b.style.color=fg;
    const sym=t===4 ? '\u005C' : tSym[t];
    b.innerHTML='<span style="font-size:22px">'+sym+'</span>';
    b.onclick=()=>{
      try{
      if(toneLocked) return;
      const ok=t===primaryTone;

      if(!ok){
        // Wrong tap: signal the error, dim this button, replay audio scaffold, stay on card
        wrongTaps++;
        b.style.opacity='0.2';
        b.style.pointerEvents='none';
        if(typeof beepError==='function') beepError();
        scheduleReplay(); // single managed timer -- no stacking across multiple wrong taps
        return; // do NOT lock -- remaining buttons stay active
      }

      // Correct tap -- cancel any pending replay, then close the loop
      cancelReplay();
      toneLocked=true;
      const firstTry=wrongTaps===0;

      document.querySelectorAll('#studyToneChoices .tone-btn').forEach(tb=>{
        const bt=[1,2,3,4,0][Array.from(tb.parentNode.children).indexOf(tb)];
        if(bt===primaryTone) tb.classList.add('correct');
        tb.style.pointerEvents='none';
      });

      // Reveal pinyin with tone colors
      py.innerHTML=''; py.style.opacity='1';
      const ink=getComputedStyle(document.body).color;
      syls.forEach(([s,st])=>{
        const sp=document.createElement('span');
        sp.textContent=s+' '; sp.style.color=toneColor(st,ink);
        py.appendChild(sp);
      });

      // Audio reveal on correct tap (covers stage 3 -- this IS the "after answer" moment)
      if(S.sound!=='mute') speak(ch,activeCourse().langCode);

      // Stage 4: reveal character
      if(stage===4){
        $('studyToneChar').textContent=ch;
        $('studyToneChar').style.fontFamily=CJKf.split(':')[1];
        $('studyToneChar').style.textDecoration='none';
      }

      // Score on first-try correctness -- finding the right tone eventually doesn't erase the miss
      const toneMs=Date.now()-cardShownAtMC;
      recordChallengeResult(i,'tone',firstTry,toneMs);
      recordWagerDecision(i,firstTry,currentMultIdx,defaultMultIdx,toneMs);
      logAnswer(i,firstTry,'tone',toneMs);
      const tSpeedM=toneMs<1500?1.3:toneMs<4000?1.0:0.8;
      if(firstTry){ advanceMult(); S.xp+=Math.round(computeXP(true,currentMultIdx,toneMs)*fatigueXPMultiplier()); }
      else { resetMult(); studyPending.push(i); }
      save();
      $('studyTonePrompt').onclick=null;
      armTapAdvance($('studyTone'),()=>nextStudyCard(),0); // no hold -- they did the work finding the tone
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
  skipBtn.onclick=(e)=>{ e.stopPropagation(); if(toneLocked) return; cancelReplay(); toneLocked=true; setTimeout(()=>nextStudyCard(),150); };
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

function logAnswer(i, isCorrect, modality, latencyMs){
  const entry=sessionLog.get(i)||{correct:0,wrong:0,masteryBefore:masteryScore(i)};
  if(isCorrect) entry.correct++;
  else entry.wrong++;
  sessionLog.set(i,entry);
  sessionAnswerRing.push(!!isCorrect);
  if(sessionAnswerRing.length>ANSWER_RING_SIZE) sessionAnswerRing.shift();
  applyAnswer(i, isCorrect, modality, latencyMs); // funnel: durable stats + telemetry
}

function logGrammarAnswer(cat, axis, isCorrect, latencyMs){
  try{
    const mod='grammar:'+(cat||'unknown')+(axis?':'+axis:'');
    applyAnswer(-1, isCorrect, mod, latencyMs);
    const pol=newSchedulerPolicy();
    if(pol&&window.dispatchStudyAction){
      try{
        window.dispatchStudyAction('ANSWER_GRAMMAR',{
          cat:cat,
          axis:axis||'recognition',
          isCorrect:!!isCorrect,
          responseMs:(typeof latencyMs==='number'?latencyMs:null)
        });
      }catch(e){}
    }
  }catch(e){ try{ if(window.EW&&EW.obs) EW.obs.captureError(e,{phase:'logGrammarAnswer'}); }catch(_){} }
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
  'preposition':{cat:'LOGICAL GLUE',
    def:'marks the relationship between a noun and the rest of the sentence — location, direction, source, or instrument',
    mandarin_note:''},
  'modal':{cat:'ACTION/STATE',
    def:'expresses necessity, possibility, desire, or obligation — precedes a main verb',
    mandarin_note:''},
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
                  'particle','conjunction','modal verb','measure word','preposition'];

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
  const CJKf=charFont();

  $('studyMode').textContent='PART OF SPEECH';
  $('studyPOSRank').textContent='';
  $('studyPOSChar').textContent=ch;
  $('studyPOSChar').style.fontFamily=CJKf.split(':')[1].trim();
  $('studyPOSChar').style.color=fg;
  $('studyPOSChar').style.textDecoration='none';

  // Pinyin
  const py=$('studyPOSPinyin'); py.innerHTML='';
  renderSyls(py,syls,fg);

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

      logAnswer(i,isCorrect,'pos');
      if(isCorrect){ S.xp+=Math.round(8*(mcCombo>=5?2:1)*fatigueXPMultiplier()); }
      else { studyPending.push(i); }
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
  "fun fact: more exploring right now does approximately nothing.",
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
  if(window.WaveViz) try{ WaveViz.clear(); }catch(e){}
  // Strategic-interval cold recompute (ENGINE §7-bis, shadow mode).
  try{ if(typeof coldRecompute==='function'){ coldRecompute(); save(); } }catch(e){}
  // Backfill frontier-legal context for already-introduced atoms (bounded; the
  // intro hook only covers new introductions). Background, no-op without a key.
  try{ if(typeof backfillSentences==='function') backfillSentences(3); }catch(e){}
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
  const introChs=D.filter((_,i)=>S.cards[i]&&S.cards[i].seen).map(d=>d[0]);

  // Try semantic distractors first — always preferred over random
  const semantic=getSemanticDistractors(targetIdx, n, introChs);

  // Pad with fallback pool if semantic doesn't fill n slots
  if(semantic.length<n){
    const needed=n-semantic.length;
    const semSet=new Set(semantic);
    semSet.add(correctDef);

    // Fallback pool — scored by stage
    const pool=D.map((_,i)=>i).filter(i=>{
      if(i===targetIdx||!(S.cards[i]&&S.cards[i].seen)) return false;
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
    return dIdx<0||masteryScore(dIdx)>=1; // must be consolidated (m≥1), not just seen
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
  const CJKf=charFont();
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
    // Near-homophone disambiguation: surface seen words sharing the same bare syllable root
    if([...chars].length===1){
      const _stripDia=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'');
      const _cDIdx=D.findIndex(([ch])=>ch===chars);
      if(_cDIdx>=0){
        const _roots=new Set(D[_cDIdx][1].map(([s])=>_stripDia(s)));
        const _homos=[];
        D.forEach(([ch,syls,def],_idx)=>{
          if(ch===chars||!(card(_idx).seen)) return;
          if(syls.some(([s])=>_roots.has(_stripDia(s)))) _homos.push(ch+' ('+def.split('/')[0].trim().toLowerCase()+')');
        });
        if(_homos.length){
          const _nd=document.createElement('div');
          _nd.style.cssText="font-size:8px;opacity:.55;letter-spacing:1px;font-family:'Noto Sans',Arial,sans-serif;margin-top:1px;";
          _nd.textContent='≠ '+_homos.slice(0,2).join(', ');
          right.appendChild(_nd);
        }
      }
    }

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
      left.title='Explore earlier words to unlock this one';
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
  const CJKf=charFont();
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
      $('studyXP').textContent=studyHudText();
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
    if(stage===1){ el.textContent=key; return; } // reset to English on course switch
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
    // role→atom map for the universal GRAMMAR_SPEC (function-word fillers; POS-class
    // roles resolve from the deck). Drives the generative basis + capability tiers.
    grammarRoles:{ copula:'是', degree:'很', negator:'不', 'negator-perf':'没', 'q-particle':'吗',
                   modifier:'的', classifier:'个', coverb:'在', aspect:'了', 'additive-adv':'也' },
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
    // Same universal roles as Mandarin (VN is its typological twin: isolating, classifiers,
    // copula, q-particle, aspect) — only the fillers differ. Drives capability tiers for VN.
    grammarRoles:{ copula:'là', degree:'rất', negator:'không', 'negator-perf':'chưa', 'q-particle':'à',
                   modifier:'của', classifier:'cái', coverb:'ở', aspect:'rồi', 'additive-adv':'cũng' },
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
      logGrammarAnswer(cat,axis,isCorrect,respMs);
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
    recordGrammarAttempt(cat.toLowerCase(),false);
    logGrammarAnswer(cat,axis,false,Date.now()-cardShownAtMC);
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
// `let` (not const): repointed per-course by applyCoursePointers via the bank
// wired onto each course object at the bottom of this section.
let EXAMPLE_SENTENCES={
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
// Capture the Mandarin bank so applyCoursePointers can repoint EXAMPLE_SENTENCES back.
const EXAMPLE_SENTENCES_ZH=EXAMPLE_SENTENCES;

// VIETNAMESE example sentences — built STRICTLY from the 16 seed atoms (every word
// is a seed headword, so sentenceAllIntroduced/tokenizer cover them once seen). Slot
// 1 (the "reading") repeats the orthography: Vietnamese IS its own reading. Thinness
// of cái/ở examples is a real seed lesson — the clause-template seed has no concrete
// inanimate/place noun, so a playable course would seed a couple alongside it.
const EXAMPLE_SENTENCES_VI={
  "tôi":   [["tôi đi.","tôi đi.","I go."],["tôi là người tốt.","tôi là người tốt.","I am a good person."],["tôi rất tốt.","tôi rất tốt.","I am very well."]],
  "đi":    [["tôi đi rồi.","tôi đi rồi.","I already went."],["tôi chưa đi.","tôi chưa đi.","I haven't gone yet."],["tôi không đi.","tôi không đi.","I'm not going."]],
  "là":    [["tôi là người.","tôi là người.","I am a person."],["tôi là người tốt.","tôi là người tốt.","I am a good person."],["tôi cũng là người tốt.","tôi cũng là người tốt.","I am also a good person."]],
  "người": [["một người tốt.","một người tốt.","A good person."],["người rất tốt.","người rất tốt.","A very good person."],["người của tôi.","người của tôi.","My person."]],
  "tốt":   [["rất tốt.","rất tốt.","Very good."],["người tốt.","người tốt.","A good person."],["tôi tốt.","tôi tốt.","I am well."]],
  "rất":   [["tôi rất tốt.","tôi rất tốt.","I am very well."],["một người rất tốt.","một người rất tốt.","A very good person."],["rất tốt.","rất tốt.","Very good."]],
  "không": [["tôi không đi.","tôi không đi.","I'm not going."],["tôi không tốt.","tôi không tốt.","I'm not well."],["tôi đi không?","tôi đi không?","Am I going?"]],
  "một":   [["một người.","một người.","One person."],["một người tốt.","một người tốt.","One good person."],["một cái của tôi.","một cái của tôi.","One of mine."]],
  "cái":   [["cái của tôi.","cái của tôi.","Mine (the one of mine)."],["một cái.","một cái.","One (of them)."],["cái của tôi rất tốt.","cái của tôi rất tốt.","Mine is very good."]],
  "của":   [["của tôi.","của tôi.","Mine."],["cái của tôi.","cái của tôi.","Mine."],["người của tôi.","người của tôi.","My person."]],
  "và":    [["tôi đi và người đi.","tôi đi và người đi.","I go and the person goes."],["tôi và người tốt.","tôi và người tốt.","I and the good person."],["tôi tốt và người tốt.","tôi tốt và người tốt.","I am good and the person is good."]],
  "cũng":  [["tôi cũng đi.","tôi cũng đi.","I also go."],["tôi cũng là người tốt.","tôi cũng là người tốt.","I am also a good person."],["người cũng tốt.","người cũng tốt.","The person is also good."]],
  "ở":     [["tôi ở.","tôi ở.","I stay."],["tôi không ở.","tôi không ở.","I'm not staying."],["tôi cũng ở.","tôi cũng ở.","I'm staying too."]],
  "rồi":   [["tôi đi rồi.","tôi đi rồi.","I already went."],["tôi tốt rồi.","tôi tốt rồi.","I'm well now."],["người đi rồi.","người đi rồi.","The person already left."]],
  "chưa":  [["tôi chưa đi.","tôi chưa đi.","I haven't gone yet."],["tôi chưa tốt.","tôi chưa tốt.","I'm not well yet."],["người chưa đi.","người chưa đi.","The person hasn't gone yet."]],
  "à":     [["tôi đi à?","tôi đi à?","Oh, I'm going?"],["người tốt à?","người tốt à?","A good person, huh?"],["tôi tốt à?","tôi tốt à?","Am I well?"]],
};
// Wire each bank onto its course object so applyCoursePointers can swap them.
// Runs at script-eval time, after COURSES (grammar.js) and both banks exist.
try{
  if(typeof COURSES!=='undefined'){
    if(COURSES['mandarin'])   COURSES['mandarin'].sentences=EXAMPLE_SENTENCES_ZH;
    if(COURSES['vietnamese']) COURSES['vietnamese'].sentences=EXAMPLE_SENTENCES_VI;
  }
}catch(e){}


/* ============ CLOZE MODALITY ============ */
// Fill-in-the-blank: sentence shown with target word removed.
// User selects from 4 choices. Tests meaning in grammatical context.
// Harder than MC forward — context dependency means choices can be similar words.
// Unlocks at meaning axis stage >= 2.

// ── LLM sentence generation ───────────────────────────────────────────────
var _sentenceCache=(function(){
  try{ return JSON.parse(localStorage.getItem('earworm-sentences-v1'))||{}; }
  catch(e){ return {}; }
})();

function _saveSentenceCache(){
  try{ localStorage.setItem('earworm-sentences-v1',JSON.stringify(_sentenceCache)); }catch(e){}
}

function getAnthropicKey(){
  try{ return localStorage.getItem('earworm-api-key')||''; }catch(e){ return ''; }
}

function setAnthropicKey(k){
  try{ if(k) localStorage.setItem('earworm-api-key',k); else localStorage.removeItem('earworm-api-key'); }catch(e){}
}

// Pending buffer: generated sentences awaiting curation before entering _sentenceCache.
var _pendingSentences={};   // ch → [[zh,pinyin,gloss], ...]
var _pendingRejected={};    // "ch::idx" → true

function clearPendingState(){
  _pendingSentences={};
  _pendingRejected={};
}

// Move all non-rejected pending sentences into the cache. Returns count of words committed.
function commitApprovedSentences(){
  var count=0;
  Object.keys(_pendingSentences).forEach(function(ch){
    var approved=_pendingSentences[ch].filter(function(s,idx){
      if(_pendingRejected[ch+'::'+idx]) return false;
      // Hard gate: never commit a sentence whose component words aren't all introduced.
      // The curator badge is advisory; this is the enforcement point.
      return sentenceAllIntroduced(s[0]);
    });
    if(approved.length){
      _sentenceCache[ch]=(_sentenceCache[ch]||[]).concat(approved);
      count++;
    }
  });
  _saveSentenceCache();
  clearPendingState();
  return count;
}

function generateSentencesForWord(i, onDone){
  var key=getAnthropicKey();
  if(!key){ if(onDone) onDone({ok:false,error:'no api key'}); return; }
  var ci=D[i];
  var ch=ci[0];
  if(_sentenceCache[ch]&&_sentenceCache[ch].length){
    if(onDone) onDone({ok:true,cached:true}); return;
  }
  if(_pendingSentences[ch]&&_pendingSentences[ch].length){
    if(onDone) onDone({ok:true,pending:true}); return;
  }
  // Build covered character set (sentenceAllIntroduced validates at char level)
  var coveredSet={}, coveredArr=[];
  for(var j=0;j<D.length;j++){
    if(S.cards[j]&&S.cards[j].seen){
      var dch=D[j][0];
      for(var k=0;k<dch.length;k++){
        var c=dch[k]; if(!coveredSet[c]){ coveredSet[c]=1; coveredArr.push(c); }
      }
    }
  }
  var pinyinStr=ci[1].map(function(s){return s[0];}).join(' ');
  var prompt='You are writing beginner Mandarin example sentences for a learner who knows ONLY these characters (most common first):\n'
    +coveredArr.join('')+'\n\n'
    +'Feature this target word: '+ch+' ('+pinyinStr+') — "'+ci[2]+'"\n\n'
    +'Write 3 short, natural sentences:\n'
    +'- HARD CONSTRAINT: use ONLY characters from the list above; never any other character.\n'
    +'- Every sentence MUST contain '+ch+'.\n'
    +'- 4–10 characters each; prefer the most common words and the simplest phrasing.\n'
    +'- Vary the grammar across the three (e.g. a statement, a yes/no question, a negation) — not three of the same frame.\n'
    +'- Each must be grammatical and something a beginner would really say.\n\n'
    +'Reply with ONLY a JSON array, no markdown, no prose:\n'
    +'[["汉字","pīnyīn with tone marks","English gloss"],["...","...","..."],["...","...","..."]]';
  fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{
      'content-type':'application/json',
      'x-api-key':key,
      'anthropic-version':'2023-06-01',
      'anthropic-dangerous-direct-browser-access':'true'
    },
    body:JSON.stringify({
      model:'claude-haiku-4-5-20251001',
      max_tokens:400,
      messages:[{role:'user',content:prompt}]
    })
  })
  .then(function(r){ return r.json(); })
  .then(function(data){
    if(data.error) throw new Error(data.error.message||JSON.stringify(data.error));
    var text=(data.content&&data.content[0]&&data.content[0].text)||'';
    var stripped=text.replace(/```[a-z]*\n?/gi,'').replace(/```/g,'').trim();
    var sents=JSON.parse(stripped);
    if(!Array.isArray(sents)||!sents.length) throw new Error('bad response');
    _pendingSentences[ch]=sents;
    if(onDone) onDone({ok:true,count:sents.length});
  })
  .catch(function(e){ if(onDone) onDone({ok:false,error:String(e)}); });
}

try{ window.generateSentencesForWord=generateSentencesForWord; window.commitApprovedSentences=commitApprovedSentences; }catch(e){}

// ── Trusted pull-generation (no human gate) ────────────────────────────────
// The curator is a manual, human-gated batch op. For the context-first loop the
// scheduler needs to PULL a comprehensible sentence for a target atom on demand
// and trust it without a human approving each one. Auto-validation replaces the
// human's structural checks: target present, sane length, and the hard
// all-introduced gate (only seen scaffold). Quality beyond structure is accepted
// for the hypothesis-test phase; the curator remains for manual review.
var _genRequested={};  // in-session rate-limit: ch -> true (don't re-fire per atom)
function _validateGenerated(zh, targetCh){
  if(typeof zh!=='string'||!zh) return false;
  // sane sentence length, counted per segmentation mode (CJK atoms vs words)
  var n=(typeof _segMode==='function'&&_segMode()==='space')
    ? _spaceWords(zh).length
    : (function(){ var c=0; for(var k=0;k<zh.length;k++){ if(/[一-鿿]/.test(zh[k])) c++; } return c; })();
  if(n<3||n>12) return false;
  if(!sentenceContainsAtom(zh,targetCh)) return false; // the target must actually appear (word-boundary aware)
  return sentenceAllIntroduced(zh);            // hard gate: only seen scaffold
}
// Pull a legal sentence for atom i: returns cached if one exists, else generates,
// auto-validates, auto-commits the valid ones, and logs to the proctor bus.
function requestSentenceFor(i, onDone){
  try{
    var ch=D[i][0];
    if(getPuzzleSentences(i).some(function(s){ return sentenceAllIntroduced(s[0]); })){
      if(onDone) onDone({ok:true,cached:true}); return;
    }
    if(!getAnthropicKey()){ if(onDone) onDone({ok:false,error:'no api key'}); return; }  // before the rate-limit so a keyless attempt doesn't burn it
    if(_genRequested[ch]){ if(onDone) onDone({ok:false,reason:'already-requested'}); return; }
    _genRequested[ch]=true;
    try{ if(window.EW&&EW.obs) EW.obs.logEvent('gen:request',{ch:ch,idx:i,reason:'pull'}); }catch(e){}
    generateSentencesForWord(i,function(r){
      if(!r.ok){ try{ if(window.EW&&EW.obs) EW.obs.logEvent('gen:fail',{ch:ch,error:r.error}); }catch(e){} if(onDone) onDone(r); return; }
      if(r.cached||r.pending){ if(onDone) onDone(r); return; }
      var pend=(_pendingSentences[ch]||[]);
      var valid=pend.filter(function(s){ return _validateGenerated(s[0],ch); });
      if(valid.length){ _sentenceCache[ch]=(_sentenceCache[ch]||[]).concat(valid); _saveSentenceCache(); }
      delete _pendingSentences[ch];   // committed the valid; drop the rest (no human gate)
      try{ if(window.EW&&EW.obs) EW.obs.logEvent('gen:commit',{ch:ch,generated:pend.length,committed:valid.length}); }catch(e){}
      if(onDone) onDone({ok:true,committed:valid.length,generated:pend.length});
    });
  }catch(e){ if(onDone) onDone({ok:false,error:String(e)}); }
}
try{ window.requestSentenceFor=requestSentenceFor; window._validateGenerated=_validateGenerated; }catch(e){}

// Backfill: generate frontier-legal context for already-introduced atoms that
// lack any — the introduction hook only fires for NEW introductions, so existing
// vocabulary (and any learner mid-stream) stays starved without this. Bounded per
// call, rate-limited per atom/session, skips atoms that already have a legal
// sentence, and a no-op without a key. Called from goHome with a small limit so it
// backfills gradually rather than in one burst.
function backfillSentences(limit){
  limit=limit||3; var fired=0;
  try{
    if(typeof getAnthropicKey==='function' && !getAnthropicKey()) return 0;
    for(var i=0;i<D.length && fired<limit;i++){
      var ci=S.cards[i];
      if(!(ci&&ci.seen)) continue;                                                      // introduced only
      if(_genRequested[D[i][0]]) continue;                                              // already tried this session
      if(getPuzzleSentences(i).some(function(s){ return sentenceAllIntroduced(s[0]); })) continue; // already has context
      fired++; requestSentenceFor(i,function(){});
    }
  }catch(e){}
  return fired;
}
try{ window.backfillSentences=backfillSentences; }catch(e){}

// Puzzle-source seam. Returns [target, pinyin, gloss] sentences for word i.
// Static bank merged with LLM-generated cache; callers are generation-agnostic.
function getPuzzleSentences(i){
  try{
    var ch=D[i][0];
    var seen={};
    var results=[];
    // Scan every key, not just D[i][0]: a sentence belongs to every atom it can
    // blank, not only the one it was seeded from. Multiplies the effective bank
    // without generating new content.
    Object.keys(EXAMPLE_SENTENCES).forEach(function(key){
      (EXAMPLE_SENTENCES[key]||[]).forEach(function(s){
        if(!sentenceContainsAtom(s[0],ch)) return;   // word-boundary aware (no à-in-và)
        if(!seen[s[0]]){ seen[s[0]]=true; results.push(s); }
      });
    });
    if(_sentenceCache){
      Object.keys(_sentenceCache).forEach(function(key){
        (_sentenceCache[key]||[]).forEach(function(s){
          if(!sentenceContainsAtom(s[0],ch)) return;
          if(!seen[s[0]]){ seen[s[0]]=true; results.push(s); }
        });
      });
    }
    return results;
  }catch(e){ return []; }
}

function clozeUnlocked(i){
  // Require at least one sentence that passes the runtime sentenceAllIntroduced gate.
  // Raw .length is insufficient: LLM sentences can be in cache but blocked until vocab is introduced.
  if(!getPuzzleSentences(i).some(function(s){ return sentenceAllIntroduced(s[0]); })) return false;
  // Permissive rule: one sighting unlocks cloze (depth accrues through context).
  // The strict stage>=2 v1 gate has been removed as v2 is now the active path.
  return (card(i).exp||0)>=1;
}

// ── Build/scan-time content validator ─────────────────────────────────────
// Structural check (state-independent, ignores .seen): can each example
// sentence EVER be fully covered by D[] atoms, and is each key a real atom?
// Surfaces the design exceptions the runtime gate (sentenceAllIntroduced)
// would otherwise filter silently — so untaught-context content gets FIXED,
// not just suppressed. This is the first instance of the eligibility/"available
// cards" idea run offline. Callable as window.auditExampleSentences();
// auto-runs once in debug mode.
function auditExampleSentences(){
  const CJK=/[一-鿿㐀-䶿]/; // CJK Unified Ideographs + Ext A
  const dHas={}; D.forEach(function(d){ dHas[d[0]]=true; });
  const deadKeys=[];     // keyed under a non-D char → getPuzzleSentences never serves it
  const uncoverable=[];  // a CJK char belongs to no D atom → would render untaught
  let total=0;
  Object.keys(EXAMPLE_SENTENCES).forEach(function(key){
    if(!dHas[key]) deadKeys.push(key);
    (EXAMPLE_SENTENCES[key]||[]).forEach(function(s){
      total++;
      const zh=s[0]||'';
      const covered={};
      for(let j=0;j<D.length;j++){ const w=D[j][0]; if(zh.indexOf(w)<0) continue; for(let x=0;x<w.length;x++) covered[w[x]]=true; }
      const bad=[];
      for(const ch of zh){ if(CJK.test(ch)&&!covered[ch]&&bad.indexOf(ch)<0) bad.push(ch); }
      if(bad.length) uncoverable.push({key:key, sentence:zh, untaughtChars:bad});
    });
  });
  const report={ totalKeys:Object.keys(EXAMPLE_SENTENCES).length, totalSentences:total,
    deadKeys:deadKeys, uncoverableSentences:uncoverable,
    clean:deadKeys.length===0&&uncoverable.length===0 };
  try{ if(window.EW&&EW.obs) EW.obs.logEvent('content:audit',{deadKeys:deadKeys.length,uncoverable:uncoverable.length,clean:report.clean}); }catch(e){}
  return report;
}
try{ window.auditExampleSentences=auditExampleSentences; }catch(e){}
// Auto-run once in debug mode so design exceptions surface at scan time.
try{
  if(window.EW&&EW.obs&&EW.obs.isDebug&&EW.obs.isDebug()){
    setTimeout(function(){
      try{
        const _a=auditExampleSentences();
        if(_a.clean){ if(window.console) console.log('[content:audit] clean — every example sentence is coverable by D[] atoms'); }
        else if(window.console) console.warn('[content:audit] '+_a.deadKeys.length+' dead key(s), '+_a.uncoverableSentences.length+' uncoverable sentence(s)', _a);
      }catch(e){}
    },0);
  }
}catch(e){}

// Returns true if s has any character a TTS engine can actually pronounce.
// Guards against speaking pure-punctuation segments (e.g. "。") that cause synthesis-failed.
function hasPhoneticContent(s){
  return /[一-鿿㐀-䶿豈-﫿぀-ゟ゠-ヿ가-힯A-Za-z0-9]/.test(s);
}

// Speaks zh with the target word ch replaced by a beep.
//
// Chain: speak(before) → beepBlank() → speak(after).
// All three steps guard against card change — if the user advances
// mid-chain the remaining steps are silently dropped.
// Avoids speechSynthesis.cancel() and onBoundary entirely (iOS-safe).
// Limitation: before/after fragments have independent prosody; pregenerated
// audio with SSML muting is the correct long-term fix.
function speakWithBlank(zh,ch,langCode){
  const idx=zh.indexOf(ch);
  if(idx<0){ speak(zh,langCode); return; }
  const before=zh.slice(0,idx);
  const after=zh.slice(idx+ch.length);
  const _card=activeCardIdx;

  const speakAfter=function(){
    if(activeCardIdx!==_card) return;
    if(hasPhoneticContent(after)) speak(after,langCode);
  };

  const playBeep=function(){
    if(activeCardIdx!==_card) return;
    beepBlank(speakAfter);
  };

  if(hasPhoneticContent(before)){
    speak(before,langCode,playBeep,{suppressInterrupted:true});
  } else {
    playBeep();
  }
}

function showStudyCloze(i){
  const [ch,syls,def,,pos]=D[i];
  const sents=getPuzzleSentences(i);
  if(!sents.length){ showStudyMC(i,false); return; }  // fall back to MC on the same card, not a wasted turn

  activeCardIdx=i;
  rollBg();
  const fg=getComputedStyle(document.body).color;
  const CJKf="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";

  // Pick a sentence — only use sentences where every multi-char D[] word is already introduced
  const validSents=sents.filter(function(s){ return sentenceAllIntroduced(s[0]); });
  if(!validSents.length){ showStudyMC(i,false); return; }
  const sent=validSents[Math.floor(Math.random()*validSents.length)];
  const [zh,py,en]=sent;

  // 30ms delay lets SAPI settle after prime/cancel before first target-lang utterance.
  if(S.sound!=='mute'){
    const stg=getAxisStage(i,'meaning');
    const _clozeCard=activeCardIdx;
    if(stg<3){ setTimeout(()=>{ if(activeCardIdx===_clozeCard) speak(zh,activeCourse().langCode); },30); }
    else { setTimeout(()=>{ if(activeCardIdx===_clozeCard) speakWithBlank(zh,ch,activeCourse().langCode); },30); }
  }

  // Create cloze: replace target word with blank (word-boundary aware so 'à' does
  // not blank the à inside 'là')
  const blank='___';
  const clozeZH=blankAtom(zh,ch,blank);

  $('studyMode').textContent='CLOZE · FILL THE BLANK';
  cardShownAtMC=Date.now();

  // Stage-based target: 2 choices at stage 2, 4 at stage 3+
  const clozeStg=getAxisStage(i,'meaning');
  const targetChoices=clozeStg>=3?4:2;
  // Pick distractors ranked by utility (POS match, frequency proximity, shared radical)
  let distractors=pickCharDistractors(i,targetChoices-1);
  // Enforce even total: distractors count must be odd (1→total 2, 3→total 4)
  if(distractors.length%2===0) distractors=distractors.slice(0,distractors.length-1);
  if(!distractors.length){ showStudyMC(i,false); return; }  // fall back to MC, don't waste the turn
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
  // Parent language EXPOSED as scaffold: the meaning is given so the learner uses
  // it to fill the blank (scaffolded production), not a blind comprehension guess.
  glossDiv.style.cssText='font-size:15px;opacity:.9;text-align:center;margin-top:8px;';
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
    // Skip the reading row when it just duplicates the word (Vietnamese), so it
    // doesn't print "àà". Arabic (space, but distinct romanization) keeps it.
    const _showReadingC=!(typeof _readingRedundant==='function'&&_readingRedundant());
    if(_showReadingC&&optIdx>=0&&D[optIdx][1].length){
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
      recordObservation({mod:'cloze',comp:zh,fg:i,fax:'meaning',ok:isCorrect,opt:opt});
      recordAxisResultNew(i,'meaning',isCorrect,respMs);
      recordWagerDecision(i,isCorrect,currentMultIdx,defaultMultIdx,respMs);
      logAnswer(i,isCorrect,'cloze',respMs);
      const speedM=respMs<1500?1.3:respMs<4000?1.0:0.8;
      if(isCorrect){
        advanceMult();
        S.xp+=Math.round(computeXP(true,currentMultIdx,respMs)*fatigueXPMultiplier());
      } else {
        resetMult();
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
    recordObservation({mod:'cloze',comp:zh,fg:i,fax:'meaning',ok:false,opt:null});
    recordAxisResultNew(i,'meaning',false,Date.now()-cardShownAtMC);
    studyPending.push({idx:i,mod:'cloze'});
    armTapAdvance($('studyMC'),function(){nextStudyCard();},1200);
  };
  renderWagerControl('studyMCActions',i);
}

/* ============ COMPREHENSION MODALITY ============ */
// The PRIMARY context-first test (modality audit): hear/read the whole sentence,
// demonstrate you understood its MEANING (not "supply the missing part" like cloze).
// Audio-first. Grades the foreground atom but logs a COMPOSITE observation
// (comp:zh) so the cold engine propagates comprehension to the background atoms
// (the incidental channel — automatization). Reuses the studyMC panel.
function comprehensionDistractorGlosses(correctGloss, n){
  var pool=[], seen={}; seen[correctGloss]=1;
  try{ for(var k in EXAMPLE_SENTENCES){ (EXAMPLE_SENTENCES[k]||[]).forEach(function(s){ if(s&&s[2]) pool.push(s[2]); }); } }catch(e){}
  try{ if(typeof _sentenceCache!=='undefined') for(var k2 in _sentenceCache){ (_sentenceCache[k2]||[]).forEach(function(s){ if(s&&s[2]) pool.push(s[2]); }); } }catch(e){}
  pool=shuffle(pool);
  var out=[];
  for(var p=0;p<pool.length && out.length<n;p++){ var g=pool[p]; if(!seen[g]){ seen[g]=1; out.push(g); } }
  return out;
}
function showStudyComprehension(i){
  const [ch,syls,def,,pos]=D[i];
  const sents=getPuzzleSentences(i);
  if(!sents.length){ nextStudyCard(); return; }
  const validSents=sents.filter(function(s){ return sentenceAllIntroduced(s[0]); });
  if(!validSents.length){ nextStudyCard(); return; }
  const sent=validSents[Math.floor(Math.random()*validSents.length)];
  const zh=sent[0], en=sent[2];

  let distractors=comprehensionDistractorGlosses(en,3);
  if(!distractors.length){ nextStudyCard(); return; }
  distractors=distractors.length>=3?distractors.slice(0,3):distractors.slice(0,1); // even total (2 or 4)
  const choices=shuffle([en,...distractors]);

  activeCardIdx=i;
  rollBg();
  const fg=getComputedStyle(document.body).color;
  const CJKf="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";

  // Audio-first: play the whole sentence
  if(S.sound!=='mute'){ const _card=activeCardIdx; setTimeout(()=>{ if(activeCardIdx===_card) speak(zh,activeCourse().langCode); },30); }
  cardShownAtMC=Date.now();

  show('study');
  $('studySession').style.display='none';
  $('studyMC').style.display='flex';
  $('studyTone').style.display='none';
  if($('studyPOS')) $('studyPOS').style.display='none';
  if($('studyColl')) $('studyColl').style.display='none';
  $('studyMCRank').textContent=cardRankStr(i);
  $('studyMCModality').textContent='COMPREHENSION · WHAT DOES THIS MEAN?';

  // Prompt: the full sentence (phi-units, no blank)
  const promptEl=$('studyMCPromptText'); promptEl.innerHTML='';
  const sentRow=document.createElement('div');
  sentRow.style.cssText='display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;gap:4px;';
  const isCJKChar=function(c){return /[一-鿿㐀-䶿]/.test(c);};
  for(let k=0;k<zh.length;k++){
    const c=zh[k];
    if(isCJKChar(c)){
      const syl=charSyl(c);
      const unit=document.createElement('div');
      unit.style.cssText='display:flex;flex-direction:column;align-items:center;gap:3px;';
      const cSpan=document.createElement('span'); cSpan.textContent=c; cSpan.style.cssText='font-size:30px;line-height:1;'+CJKf;
      unit.appendChild(cSpan);
      if(syl){ const pSpan=document.createElement('span'); pSpan.textContent=syl[0]; pSpan.style.cssText='font-size:9px;font-family:\'Noto Sans\',Arial,sans-serif;'; pSpan.style.color=toneColor(syl[1],fg); unit.appendChild(pSpan); }
      sentRow.appendChild(unit);
    } else {
      const plain=document.createElement('span'); plain.textContent=c; plain.style.cssText='font-size:30px;line-height:1;align-self:flex-start;opacity:.5;'; sentRow.appendChild(plain);
    }
  }
  promptEl.appendChild(sentRow);
  $('studyMCPinyin').innerHTML='';

  // Tap prompt to repeat audio
  $('studyMCPrompt').style.cursor='pointer';
  $('studyMCPrompt').onclick=function(e){ if(S.sound==='mute')return; speak(zh,activeCourse().langCode); e.stopPropagation(); };

  // Choices = glosses (single column)
  const box=$('studyMCChoices'); box.innerHTML=''; box.style.gridTemplateColumns='1fr';
  let locked=false;
  choices.forEach(function(opt){
    const b=document.createElement('button'); b.className='choice';
    b.style.cssText='border-color:'+fg+';color:'+fg+';padding:12px 10px;font-size:13px;line-height:1.35;text-align:center;';
    b.textContent=opt;
    b.onclick=function(){
      if(locked) return; locked=true;
      const isCorrect=opt===en;
      const respMs=Date.now()-cardShownAtMC;
      document.querySelectorAll('#studyMCChoices .choice').forEach(function(tb){
        if(tb.textContent===en) tb.classList.add('correct');
        else if(tb===b&&!isCorrect) tb.classList.add('wrong');
        tb.style.pointerEvents='none';
      });
      recordChallengeResult(i,'comprehension',isCorrect,respMs);
      recordObservation({mod:'comprehension',comp:zh,fg:i,fax:'meaning',ok:isCorrect,opt:opt});
      recordAxisResultNew(i,'meaning',isCorrect,respMs);
      recordWagerDecision(i,isCorrect,currentMultIdx,defaultMultIdx,respMs);
      logAnswer(i,isCorrect,'comprehension',respMs);
      const speedM=respMs<1500?1.3:respMs<4000?1.0:0.8;
      if(isCorrect){ advanceMult(); S.xp+=Math.round(computeXP(true,currentMultIdx,respMs)*fatigueXPMultiplier()); }
      else { resetMult(); studyPending.push({idx:i,mod:'comprehension'}); }
      save();
      if(S.sound!=='mute') speak(zh,activeCourse().langCode);
      armTapAdvance($('studyMC'),function(){nextStudyCard();},isCorrect?0:1200);
    };
    box.appendChild(b);
  });

  renderChallengeRings(i,'comprehension',$('studyMCPrompt'));
  studyDontKnowAction=function(){
    if(locked) return; locked=true;
    recordObservation({mod:'comprehension',comp:zh,fg:i,fax:'meaning',ok:false,opt:null});
    recordAxisResultNew(i,'meaning',false,Date.now()-cardShownAtMC);
    studyPending.push({idx:i,mod:'comprehension'});
    armTapAdvance($('studyMC'),function(){nextStudyCard();},1200);
  };
  renderWagerControl('studyMCActions',i);
}
try{ window.showStudyComprehension=showStudyComprehension; }catch(e){}

/* ============ WORD ORDER MODALITY ============ */
// Given 3-4 shuffled words, tap them in correct Mandarin order.
// Bridges from receptive to productive — requires applying grammar knowledge.
// Unlocks when: meaning stage >= 2, grammar categorization stage >= 1 for all words.

function wordOrderUnlocked(i){
  // Legacy v1 gate; under policy, Scheduler.modality handles word-order eligibility
  if(getAxisStage(i,'meaning')<2) return false;
  // Need at least 2 other introduced words for a meaningful arrangement
  const introduced=D.filter(function(_,idx){return S.cards[idx]&&S.cards[idx].seen;});
  return introduced.length>=4;
}

function showWordOrderDrill(i){
  const [ch,syls,def,,pos]=D[i];
  // Find a sentence containing this word — routed through getPuzzleSentences so
  // a future generation backend only needs to implement that one function.
  const sents=getPuzzleSentences(i);
  // Fall back to an MC on the SAME card (not nextStudyCard) when word-order can't
  // be built: the modality picker only checks that a legal sentence EXISTS
  // (hasSentences), but word-order also needs 3+ known-word tiles. Bailing to
  // nextStudyCard wastes the turn and marks the card shown-but-not-tested.
  if(!sents.length){ showStudyMC(i,false); return; }
  // Only use sentences where every multi-char D[] word is already introduced
  const validSentsWO=sents.filter(function(s){ return sentenceAllIntroduced(s[0]); });
  if(!validSentsWO.length){ showStudyMC(i,false); return; }
  const sent=validSentsWO[Math.floor(Math.random()*validSentsWO.length)];
  const [zh,py,en]=sent;

  // Extract words via the segmentation layer (word-boundary aware — never a raw
  // substring match, which would put an 'à' tile into 'và'). Distinct atoms in
  // left-to-right sentence order, with first-occurrence rank for the correct order.
  const ordAtoms=sentenceAtomsInOrder(zh);
  const orderPos={}; const distinct=[];
  ordAtoms.forEach(function(a,k){ if(!(a.w in orderPos)){ orderPos[a.w]=k; distinct.push(a.w); } });
  // Use .seen (not .exp) — only words actually shown as a flashcard can be tiles.
  const seenDistinct=distinct.filter(function(w){ const wi=D.findIndex(function(d){return d[0]===w;}); return wi>=0&&S.cards[wi]&&S.cards[wi].seen; });
  if(seenDistinct.length<3){ showStudyMC(i,false); return; }
  // Target + up to 3 others, capped at 4.
  let drillWords=[ch].concat(seenDistinct.filter(function(w){return w!==ch;}).slice(0,3));
  if(drillWords.length<3){ showStudyMC(i,false); return; }
  drillWords=drillWords.slice(0,4);
  // Invariant check: every tile must have been properly seen as a flashcard.
  // Log any breach so the observability panel surfaces it immediately.
  drillWords.forEach(function(w){
    const wi=D.findIndex(function(d){return d[0]===w;});
    if(wi>=0&&!(S.cards[wi]&&S.cards[wi].seen)){
      try{ if(window.EW&&EW.obs) EW.obs.logEvent('violation',{type:'unseen-tile-in-word-order',char:w,targetChar:ch,sentence:zh}); }catch(e){}
    }
  });

  // Correct order: first-occurrence rank from the tokenizer (never zh.indexOf,
  // which mis-orders on repeated/substring words).
  const correctOrder=drillWords.slice().sort(function(a,b){
    return (orderPos[a]==null?999:orderPos[a])-(orderPos[b]==null?999:orderPos[b]);
  });
  const shuffledWords=shuffle(drillWords.slice());

  activeCardIdx=i;
  rollBg();
  const fg=getComputedStyle(document.body).color;
  // Tiles only force the CJK face for ideographic courses; space-delimited scripts
  // (Vietnamese, Arabic) inherit the body font so diacritics render correctly.
  const CJKf=(typeof _segMode==='function'&&_segMode()==='space')?'':"font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";

  $('studyMode').textContent='WORD ORDER';
  cardShownAtMC=Date.now();

  show('study');
  $('studySession').style.display='none';
  $('studyMC').style.display='flex';
  $('studyTone').style.display='none';
  if($('studyPOS')) $('studyPOS').style.display='none';
  if($('studyColl')) $('studyColl').style.display='none'; // word-order missed this \u2014 left a stale collocation card showing underneath

  $('studyMCRank').textContent=cardRankStr(i);
  $('studyMCModality').textContent='WORD ORDER \u00b7 ARRANGE';

  // Show English prompt
  const promptEl=$('studyMCPromptText');
  const _langName=(typeof activeCourse==='function'&&activeCourse())?activeCourse().langName:'Mandarin';
  promptEl.innerHTML='<div style="font-size:12px;opacity:.8;text-align:center;line-height:1.5;margin-bottom:8px;">'+
    en.toUpperCase()+'</div>'+
    '<div style="font-size:8px;opacity:.5;letter-spacing:1px;">ARRANGE THESE WORDS IN '+_langName.toUpperCase()+' ORDER</div>';
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
    // Skip the reading row when it just duplicates the word (Vietnamese). Arabic
    // (distinct romanization) keeps it.
    const _showReading=!(typeof _readingRedundant==='function'&&_readingRedundant());
    if(_showReading&&wIdx>=0&&D[wIdx][1].length){
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
        recordObservation({mod:'word-order',comp:zh,fg:i,fax:'meaning',ok:isCorrect,opt:selected.join('')});
        recordAxisResultNew(i,'meaning',isCorrect,respMs);
        logAnswer(i,isCorrect,'word-order',respMs);
        if(isCorrect){
          advanceMult();
          S.xp+=Math.round(computeXP(true,currentMultIdx,respMs)*fatigueXPMultiplier());
          if(S.sound!=='mute') speak(zh,activeCourse().langCode);
        } else {
          resetMult();
          studyPending.push({idx:i,mod:'word-order'});
        }
        save();
        armTapAdvance($('studyMC'),function(){nextStudyCard();},isCorrect?0:1500);
      }
    };
    box.appendChild(b);
  });

  const _woCard=activeCardIdx;
  if(S.sound!=='mute') setTimeout(function(){ if(activeCardIdx===_woCard) speak(en,'en-US'); },0);

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
        S={cards:{},xp:0,lastDay:null,streak:0,sound:S.sound||'auto',
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
    ci.axisDue.meaning=0; // always due immediately
    ci.axisDue.pos=0;
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
        S.grammar[cat][axis].due=level>=50?(S.totalSeen||0)+200:0;
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


/* ============ EXCEPTION CATCHER ============ */
// Identifies Chinese characters in `text` not yet in D[], then asks Claude
// to propose flashcard entries for them. Result: {ok, proposals, error}.
function analyzeTextForExceptions(text, onDone){
  var key=getAnthropicKey();
  if(!key){ if(onDone) onDone({ok:false,error:'no api key'}); return; }

  // Build set of characters already covered by D[]
  var known={};
  D.forEach(function(entry){ known[entry[0]]=true; });

  // Extract unique CJK characters from input text
  var seenChars={};
  var unknown=[];
  Array.from(text).forEach(function(c){
    if(seenChars[c]) return;
    seenChars[c]=true;
    if(/[一-鿿㐀-䶿\u{20000}-\u{2a6df}]/u.test(c)&&!known[c]) unknown.push(c);
  });

  if(!unknown.length){ if(onDone) onDone({ok:true,proposals:[]}); return; }

  var prompt='The user is learning Mandarin Chinese. They encountered the following characters not yet in their vocabulary deck:\n'
    +unknown.join('、')+'\n\n'
    +'For each, propose a flashcard entry. Return ONLY a JSON array, no prose:\n'
    +'[{"word":"书","pinyin":[["shū",1]],"meaning":"book","pos":"noun","radicals":[["木",4]]}]\n\n'
    +'Rules:\n'
    +'- word: the character(s) as they appear (single char or compound unit)\n'
    +'- pinyin: [[syllable_with_diacritic, tone_number]] one pair per character (tone 5=neutral)\n'
    +'- meaning: concise English, max 6 words\n'
    +'- pos: noun|verb|adjective|adverb|pronoun|particle|measure-word|interjection|conjunction\n'
    +'- radicals: [[radical_char, stroke_count]] can be []\n'
    +'Source text for context: '+text.slice(0,300);

  fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{
      'content-type':'application/json',
      'x-api-key':key,
      'anthropic-version':'2023-06-01',
      'anthropic-dangerous-direct-browser-access':'true'
    },
    body:JSON.stringify({
      model:'claude-haiku-4-5-20251001',
      max_tokens:600,
      messages:[{role:'user',content:prompt}]
    })
  }).then(function(r){ return r.json(); }).then(function(data){
    var raw=(data.content&&data.content[0]&&data.content[0].text)||'[]';
    var proposals=[];
    // Try parsing the whole response first (clean path), then regex fallback.
    // Greedy /\[[\s\S]*\]/ over-captures when LLM appends a trailing note like [see above].
    var stripped=raw.replace(/```[a-z]*\n?/gi,'').replace(/```/g,'').trim();
    try{ var p=JSON.parse(stripped); proposals=Array.isArray(p)?p:[]; }catch(e){
      var start=stripped.indexOf('[');
      if(start>=0){ try{ proposals=JSON.parse(stripped.slice(start)); if(!Array.isArray(proposals)) proposals=[]; }catch(e2){} }
    }
    if(onDone) onDone({ok:true,proposals:proposals});
  }).catch(function(e){
    if(onDone) onDone({ok:false,error:e.message});
  });
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

// ── SENTENCE CURATOR ─────────────────────────────────────────────────────
function _esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── EXCEPTION CATCHER ────────────────────────────────────────────────────
var _exProposals=[];
var _exDropped={};

function showExceptionCatcher(){
  var el=document.getElementById('exceptionCatcher');
  if(!el) return;
  _exProposals=[];
  _exDropped={};
  renderExceptionProposals();
  el.style.display='flex';
}

function renderExceptionProposals(){
  var body=document.getElementById('exceptionBody');
  if(!body) return;
  var CJK="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";

  if(!_exProposals.length){
    body.innerHTML='<div style="padding:24px;color:#666;font-size:11px;letter-spacing:1px;">Paste Chinese text above and hit ⚡ ANALYZE.</div>';
    return;
  }

  var html='<div style="font-size:9px;color:#777;margin-bottom:14px;letter-spacing:.5px;">Unknown words found. ✗ DROP removes from batch. ADD TO DECK introduces approved words immediately.</div>';

  _exProposals.forEach(function(p,i){
    var dropped=!!_exDropped[i];
    var pinyinStr=(p.pinyin||[]).map(function(s){return s[0];}).join(' ');
    html+='<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:4px;margin-bottom:6px;'
      +'border:1px solid '+(dropped?'rgba(248,113,113,0.25)':'rgba(255,255,255,0.1)')+';'
      +'background:'+(dropped?'rgba(255,60,60,0.06)':'#1c1c1c')+';">';
    html+='<div style="flex:1;'+(dropped?'opacity:.28;':'')+'transition:opacity .15s;">';
    html+='<span style="'+CJK+';font-size:26px;line-height:1;color:#fff;">'+_esc(p.word)+'</span>';
    html+='<span style="font-size:10px;color:#9a9a9a;margin-left:10px;">'+_esc(pinyinStr)+'</span>';
    html+='<span style="font-size:10px;color:#d0d0d0;margin-left:8px;">"'+_esc(p.meaning||'')+'"</span>';
    html+='<span style="font-size:9px;color:#888;margin-left:8px;">'+_esc(p.pos||'')+'</span>';
    html+='</div>';
    html+='<button class="btn exc-toggle" data-idx="'+i+'" style="font-size:8px;padding:2px 8px;flex-shrink:0;'
      +(dropped?'color:#4ade80;border-color:#4ade80;':'color:#f87171;border-color:#f87171;')
      +'">'+(dropped?'KEEP':'✗ DROP')+'</button>';
    html+='</div>';
  });

  body.innerHTML=html;

  body.querySelectorAll('.exc-toggle').forEach(function(btn){
    btn.onclick=function(){
      var idx=parseInt(this.getAttribute('data-idx'),10);
      if(_exDropped[idx]) delete _exDropped[idx]; else _exDropped[idx]=true;
      renderExceptionProposals();
    };
  });
}

function proposalToEntry(p){
  return [p.word, p.pinyin||[], p.meaning||'', p.radicals||[], p.pos||'noun'];
}

function showSentenceCurator(){
  var el=document.getElementById('sentenceCurator');
  if(!el) return;
  renderSentenceCurator();
  el.style.display='flex';
}

function renderSentenceCurator(){
  var body=document.getElementById('curatorBody');
  var countEl=document.getElementById('curatorCount');
  if(!body) return;
  var CJK="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  var words=Object.keys(_pendingSentences);

  if(countEl) countEl.textContent=words.length+' word'+(words.length!==1?'s':'')+' pending';

  if(!words.length){
    body.innerHTML='<div style="padding:24px;opacity:.4;font-size:11px;letter-spacing:1px;">NO PENDING SENTENCES — run ⚡ GENERATE first.</div>';
    return;
  }

  var html='<div style="font-size:9px;opacity:.4;margin-bottom:14px;letter-spacing:.5px;">Review generated sentences. ✗ DROP removes from the batch. SAVE APPROVED commits the rest to the drill cache.</div>';

  words.forEach(function(ch){
    var idx=D.findIndex(function(d){ return d[0]===ch; });
    var def=idx>=0?D[idx][2]:'?';
    var pinyinStr=idx>=0?D[idx][1].map(function(s){return s[0];}).join(' '):'';
    var sents=_pendingSentences[ch];
    var keptCount=sents.filter(function(_,i){ return !_pendingRejected[ch+'::'+i]; }).length;

    html+='<div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.08);">';
    html+='<div style="display:flex;align-items:baseline;gap:10px;margin-bottom:10px;">';
    html+='<span style="'+CJK+';font-size:26px;line-height:1;">'+ch+'</span>';
    html+='<span style="font-size:10px;opacity:.5;">'+pinyinStr+'</span>';
    html+='<span style="font-size:10px;opacity:.4;">"'+def+'"</span>';
    html+='<span style="margin-left:auto;font-size:9px;opacity:.5;">'+keptCount+'/'+sents.length+' kept</span>';
    html+='</div>';

    sents.forEach(function(s,i){
      var key=ch+'::'+i;
      var rejected=!!_pendingRejected[key];
      var passes=typeof sentenceAllIntroduced==='function'&&sentenceAllIntroduced(s[0]);
      html+='<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 10px;border-radius:4px;'
        +'background:'+(rejected?'rgba(255,60,60,0.07)':'rgba(255,255,255,0.03)')+';margin-bottom:6px;">';
      html+='<div style="flex:1;'+(rejected?'opacity:.3;':'')+'transition:opacity .15s;">';
      html+='<div style="'+CJK+';font-size:18px;line-height:1.3;">'+_esc(s[0])+'</div>';
      html+='<div style="font-size:9px;opacity:.6;margin-top:2px;">'+_esc(s[1]||'')+'</div>';
      html+='<div style="font-size:9px;opacity:.7;margin-top:1px;">'+_esc(s[2]||'')+'</div>';
      html+='</div>';
      html+='<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">';
      html+='<span style="font-size:8px;color:'+(passes?'#4ade80':'#f87171')+';letter-spacing:.5px;">'+(passes?'✓ vocab':'✗ vocab')+'</span>';
      html+='<button class="btn curator-toggle" data-key="'+key+'" style="font-size:8px;padding:2px 8px;'
        +(rejected?'color:#4ade80;border-color:#4ade80;':'color:#f87171;border-color:#f87171;')+'">'+( rejected?'KEEP':'✗ DROP')+'</button>';
      html+='</div>';
      html+='</div>';
    });

    html+='</div>';
  });

  body.innerHTML=html;

  body.querySelectorAll('.curator-toggle').forEach(function(btn){
    btn.onclick=function(){
      var key=this.getAttribute('data-key');
      if(_pendingRejected[key]) delete _pendingRejected[key]; else _pendingRejected[key]=true;
      renderSentenceCurator();
    };
  });
}

// ── ELIGIBILITY BROWSER ──────────────────────────────────────────────────
var _eligFilter='all';

function showEligibilityBrowser(){
  var el=document.getElementById('eligBrowser');
  if(!el) return;
  _eligFilter='all';
  renderEligibilityBrowser();
  el.style.display='flex';
}

function renderEligibilityBrowser(){
  var body=document.getElementById('eligBody');
  if(!body) return;
  var CJK="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  var course=typeof activeCourse==='function'&&activeCourse();
  var hasTone=course&&course.hasTone;

  ['All','Ripe','Fresh'].forEach(function(f){
    var b=document.getElementById('eligFilter'+f);
    if(!b) return;
    var active=_eligFilter===f.toLowerCase();
    b.style.opacity=active?'1':'0.4';
    b.style.background=active?'rgba(255,255,255,0.14)':'transparent';
  });

  var nDue=0,nRipe=0,nFresh=0,nIdle=0;
  for(var j=0;j<D.length;j++){
    if(!isUnlocked(j)) continue;
    var cj=S.cards[j]||{};
    if(!cj.exp){ nFresh++; }
    else if(isCardDue(j)){ nDue++; }
    else if(isWallClockRipe(j)){ nRipe++; }
    else{ nIdle++; }
  }

  var mkChip=function(ok,label,okBg){
    if(ok) return '<span style="display:inline-block;font-size:8px;font-weight:700;border-radius:2px;padding:2px 5px;margin-right:3px;background:'+okBg+';color:#111;">'+label+'</span>';
    return '<span style="display:inline-block;font-size:8px;font-weight:700;border-radius:2px;padding:2px 5px;margin-right:3px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.2);">'+label+'</span>';
  };

  var stageColor=function(s){ return s===0?'rgba(255,255,255,0.3)':s===1?'#60a5fa':s===2?'#86efac':'#4ade80'; };

  var html='';
  html+='<div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.1);font-size:10px;letter-spacing:.5px;">'
    +'<span>DUE <b style="font-size:13px;color:#fb923c;">'+nDue+'</b></span>'
    +'<span>RIPE <b style="font-size:13px;color:#f87171;">'+nRipe+'</b></span>'
    +'<span>FRESH <b style="font-size:13px;color:#e0e0e0;">'+nFresh+'</b></span>'
    +'<span style="opacity:.35;">IDLE '+nIdle+'</span>'
    +'</div>';

  html+='<div style="display:grid;grid-template-columns:32px 52px 64px 70px 40px 1fr;gap:4px;padding:4px 0 6px;font-size:9px;opacity:.35;letter-spacing:1.5px;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:2px;">'
    +'<span>#</span><span>WORD</span><span>STATUS</span><span>STAGES</span><span>R%</span><span>ELIGIBLE</span></div>';

  for(var i=0;i<D.length;i++){
    if(!isUnlocked(i)) continue;
    var ci=S.cards[i]||{};
    var seen=!!(ci.seen);
    var exp=ci.exp||0;
    var mStage=getAxisStage(i,'meaning')||0;
    var pStage=getAxisStage(i,'pos')||0;
    var due=seen&&isCardDue(i);
    var ripe=seen&&isWallClockRipe(i);
    var R=(ci.lastReviewAt&&ci.lastReviewAt.meaning)?Math.round(retrievability(i,'meaning')*100):null;

    if(_eligFilter==='ripe'&&!(due||ripe)) continue;
    if(_eligFilter==='fresh'&&exp!==0) continue;

    var eligMC=exp>=1;
    var eligCloze=typeof clozeUnlocked==='function'&&clozeUnlocked(i);
    var eligTone=seen&&!!(hasTone);

    var stLabel,stBg,stFg;
    if(!seen){      stLabel='NEW';  stBg='#ca8a04'; stFg='#fff'; }
    else if(mStage>=3){ stLabel='MSTD'; stBg='#16a34a'; stFg='#fff'; }
    else if(mStage>=1){ stLabel='LRNG'; stBg='#1d4ed8'; stFg='#fff'; }
    else{               stLabel='SEEN'; stBg='rgba(255,255,255,0.1)'; stFg='rgba(255,255,255,0.6)'; }

    var stChip='<span style="display:inline-block;font-size:8px;font-weight:700;letter-spacing:.5px;border-radius:2px;padding:2px 6px;background:'+stBg+';color:'+stFg+';">'+stLabel+'</span>';
    var flags='';
    if(due)  flags+=' <span style="font-size:8px;font-weight:700;color:#fb923c;">D</span>';
    if(ripe) flags+=' <span style="font-size:8px;font-weight:700;color:#f87171;">R</span>';

    var rowBg=i%2===0?'rgba(255,255,255,0.02)':'transparent';

    html+='<div style="display:grid;grid-template-columns:32px 52px 64px 70px 40px 1fr;gap:4px;padding:6px 4px;border-radius:3px;background:'+rowBg+';align-items:center;min-height:36px;">'
      +'<span style="font-size:9px;opacity:.25;text-align:right;padding-right:6px;">'+(i+1)+'</span>'
      +'<span style="'+CJK+';font-size:22px;line-height:1;">'+D[i][0]+'</span>'
      +'<span style="display:flex;align-items:center;gap:2px;">'+stChip+flags+'</span>'
      +'<span style="font-size:9px;"><span style="color:'+stageColor(mStage)+';font-weight:700;">M:'+mStage+'</span>'
        +' <span style="color:'+stageColor(pStage)+';opacity:.7;">P:'+pStage+'</span></span>'
      +'<span style="font-size:9px;opacity:.6;text-align:right;padding-right:8px;">'+(R!==null?R+'%':'—')+'</span>'
      +'<span style="display:flex;align-items:center;flex-wrap:wrap;">'+mkChip(true,'FL','#22d3ee')+mkChip(eligMC,'MC','#a78bfa')+mkChip(eligCloze,'CL','#fb923c')+mkChip(eligTone,'TN','#fbbf24')+'</span>'
      +'</div>';
  }

  body.innerHTML=html;
}

/* ============ EVENTS ============ */
// Tap the language label under the title to cycle courses.
if($('courseId')) $('courseId').onclick=cycleCourse;
if($('profileBtn')) $('profileBtn').onclick=()=>{ renderStats(); show('stats'); };
if($('stats-back')) $('stats-back').onclick=()=>{ rollBg(); renderHome(); show('home'); };
if($('debugPolicy')){
  $('debugPolicy').textContent='⚙ POLICY: '+(newSchedulerPolicy()?'V2 (context)':'V1');
  $('debugPolicy').onclick=()=>{ try{ if(newSchedulerPolicy()) localStorage.removeItem('earworm_policy'); else localStorage.setItem('earworm_policy','v2'); }catch(e){} location.reload(); };
}
// Shared debounce flag — prevents double-tap from scheduling two session starts.
// Declared here so all three start handlers (start / startStudy / startTone) share it.
let _startStudyPending=false;
$('start').onclick=()=>{
  if(_startStudyPending) return;
  _startStudyPending=true;
  primeSpeechEngine(activeCourse().langCode,()=>{ _startStudyPending=false; startStudy(true); });
};
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
$('startTone').onclick=()=>{
  if(_startStudyPending) return;
  _startStudyPending=true;
  primeSpeechEngine(activeCourse().langCode,()=>{ _startStudyPending=false; startTone(); });
};
$('startStudy').onclick=()=>{
  if(_startStudyPending) return;
  _startStudyPending=true;
  primeSpeechEngine(activeCourse().langCode,()=>{ _startStudyPending=false; startStudy(); });
};
$('study-quit').onclick=()=>{ studyActive=false; goHome(); };
$('startWS').onclick=()=>{ startWordSearch(); };
if($('startGrammar')) $('startGrammar').onclick=()=>{ startGrammarOnlySession(); };
if($('debugReset')) $('debugReset').onclick=()=>{ debugResetProgress(); };
if($('debugTTS')) $('debugTTS').onclick=()=>{ showTTSDebug(); };
if($('debugSetProficiency')) $('debugSetProficiency').onclick=()=>{ debugSetProficiency(); };
if($('debugExport')) $('debugExport').onclick=()=>{ exportState(); };
if($('debugImport')) $('debugImport').onclick=()=>{
  const inp=document.createElement('input');
  inp.type='file'; inp.accept='.json,application/json';
  inp.onchange=function(){
    const f=inp.files&&inp.files[0]; if(!f) return;
    const reader=new FileReader();
    reader.onload=function(e){ importState(e.target.result); };
    reader.readAsText(f);
  };
  inp.click();
};
if($('debugElig')) $('debugElig').onclick=()=>{ showEligibilityBrowser(); };
if($('debugAddWords')) $('debugAddWords').onclick=()=>{ showExceptionCatcher(); };
if($('exceptionBack')) $('exceptionBack').onclick=function(){
  var el=document.getElementById('exceptionCatcher'); if(el) el.style.display='none';
};
if($('exceptionAnalyze')) $('exceptionAnalyze').onclick=function(){
  var btn=$('exceptionAnalyze'), status=$('exceptionStatus');
  var text=($('exceptionInput')&&$('exceptionInput').value)||'';
  if(!text.trim()){ if(status) status.textContent='paste some text first'; return; }
  if(!getAnthropicKey()){ if(status) status.textContent='no api key'; return; }
  btn.disabled=true;
  if(status) status.textContent='analyzing…';
  analyzeTextForExceptions(text,function(r){
    btn.disabled=false;
    if(!r.ok){ if(status) status.textContent='error: '+(r.error||'unknown'); return; }
    _exProposals=r.proposals||[];
    _exDropped={};
    if(status) status.textContent=_exProposals.length?_exProposals.length+' new word'
      +(_exProposals.length!==1?'s':'')+' found':'no unknown characters found';
    renderExceptionProposals();
  });
};
if($('exceptionCommit')) $('exceptionCommit').onclick=function(){
  var batch=[];
  _exProposals.forEach(function(p,i){
    if(!_exDropped[i]) batch.push(proposalToEntry(p));
  });
  var added=batch.length;
  if(added) addUserWords(batch);
  var el=document.getElementById('exceptionCatcher'); if(el) el.style.display='none';
  var btn=$('debugAddWords');
  if(btn&&added){
    btn.textContent='⊕ '+added+' word'+(added!==1?'s':'')+' added';
    setTimeout(function(){ btn.textContent='⊕ ADD WORDS'; },3000);
  }
};
// API key management (stored in localStorage only — never in any file or repo)
(function(){
  var inp=$('debugApiKey'), status=$('debugKeyStatus');
  if(inp){ var k=getAnthropicKey(); if(k) inp.placeholder='sk-ant-…'+k.slice(-4)+' (set)'; }
  if($('debugKeySave')) $('debugKeySave').onclick=function(){
    var v=inp&&inp.value.trim();
    if(!v) return;
    setAnthropicKey(v);
    if(inp){ inp.value=''; inp.placeholder='sk-ant-…'+v.slice(-4)+' (saved)'; }
    if(status) status.textContent='key saved';
  };
  if($('debugKeyClear')) $('debugKeyClear').onclick=function(){
    setAnthropicKey('');
    if(inp){ inp.value=''; inp.placeholder='sk-ant-api03-…'; }
    if(status) status.textContent='cleared';
  };
})();
if($('debugGenerate')) $('debugGenerate').onclick=function(){
  var btn=$('debugGenerate');
  if(!getAnthropicKey()){ btn.textContent='⚡ NO API KEY'; setTimeout(function(){ btn.textContent='⚡ GENERATE SENTENCES'; },2000); return; }
  var words=[];
  for(var i=0;i<D.length;i++){
    if(!isUnlocked(i)) continue;
    if(!(S.cards[i]&&S.cards[i].seen)) continue;
    if(getPuzzleSentences(i).length>0) continue;
    words.push(i);
  }
  if(!words.length){ btn.textContent='⚡ ALL COVERED'; setTimeout(function(){ btn.textContent='⚡ GENERATE SENTENCES'; },2000); return; }
  btn.disabled=true;
  var idx=0, done=0, errors=0;
  (function next(){
    if(idx>=words.length){
      btn.disabled=false;
      var pending=Object.keys(_pendingSentences).length;
      btn.textContent='⚡ '+done+' fetched'+(errors?' ('+errors+' err)':'')+(pending?' — '+pending+' to curate':'');
      setTimeout(function(){ btn.textContent='⚡ GENERATE SENTENCES'; },4000);
      if(pending>0) showSentenceCurator();
      return;
    }
    btn.textContent='⚡ '+idx+'/'+words.length+'…';
    generateSentencesForWord(words[idx++],function(r){
      if(r.ok&&!r.cached&&!r.pending) done++; else if(!r.ok) errors++;
      setTimeout(next,400);
    });
  })();
};
if($('debugCurate')) $('debugCurate').onclick=function(){ showSentenceCurator(); };
if($('curatorClose')) $('curatorClose').onclick=function(){ var el=document.getElementById('sentenceCurator'); if(el) el.style.display='none'; };
if($('curatorSave')) $('curatorSave').onclick=function(){
  var count=commitApprovedSentences();
  var el=document.getElementById('sentenceCurator');
  if(el) el.style.display='none';
  var btn=$('debugGenerate');
  if(btn){ btn.textContent='⚡ '+count+' word'+(count!==1?'s':'')+' saved'; setTimeout(function(){ btn.textContent='⚡ GENERATE SENTENCES'; },2500); }
};
if($('eligClose')) $('eligClose').onclick=()=>{ var el=document.getElementById('eligBrowser'); if(el) el.style.display='none'; };
if($('eligFilterAll')) $('eligFilterAll').onclick=()=>{ _eligFilter='all'; renderEligibilityBrowser(); };
if($('eligFilterRipe')) $('eligFilterRipe').onclick=()=>{ _eligFilter='ripe'; renderEligibilityBrowser(); };
if($('eligFilterFresh')) $('eligFilterFresh').onclick=()=>{ _eligFilter='fresh'; renderEligibilityBrowser(); };
// Cutover validation instrument: recompute the cold engine and render the
// cold-vs-live divergence so the cutover can be a trusted, deliberate flip.
function renderColdVsLive(){
  try{ if(typeof coldRecompute==='function') coldRecompute(); }catch(e){}
  var rep=(typeof coldVsLive==='function')?coldVsLive():null;
  var ov=document.getElementById('coldLiveOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='coldLiveOverlay';
    ov.style.cssText='position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;background:#0c0f0d;color:#cfe9dd;font-family:monospace;overflow:hidden;';
    document.body.appendChild(ov);
  }
  ov.style.display='flex';
  if(!rep){ ov.innerHTML='<div style="padding:16px">no cold state — play a session first</div>'; return; }
  var s=rep.summary;
  var html='<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.15);flex-wrap:wrap;flex-shrink:0;">'
    +'<button class="btn" id="coldLiveClose" style="width:auto;font-size:10px;padding:5px 12px;">◄ BACK</button>'
    +'<span style="font-size:11px;letter-spacing:1px;">COLD vs LIVE</span>'
    +'<span style="font-size:10px;opacity:.75;">'+s.compared+' atoms · agree '+s.agreePct+'% · '
    +'<span style="color:#ffb84d">live over-grad '+s.coldStricter+'</span> · '
    +'<span style="color:#4dd8ff">cold-ahead '+s.coldLooser+'</span> · obs '+s.obsRecords+'</span></div>'
    +'<div style="flex:1;overflow-y:auto;padding:8px 12px;font-size:11px;line-height:1.5;">';
  if(!rep.rows.length){ html+='<div style="opacity:.6;padding:12px">no seen atoms with data yet — play a session.</div>'; }
  rep.rows.forEach(function(r){
    var col=r.rel==='cold-stricter'?'#ffb84d':r.rel==='cold-looser'?'#4dd8ff':'#7c8a82';
    var tag=r.rel==='cold-stricter'?'LIVE OVER-GRAD':r.rel==='cold-looser'?'COLD AHEAD':'agree';
    html+='<div style="display:flex;gap:8px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.05);">'
      +'<span style="width:96px;flex-shrink:0;color:'+col+'">'+tag+'</span>'
      +'<span style="width:30px;flex-shrink:0;font-size:14px;">'+r.ch+'</span>'
      +'<span style="opacity:.85;flex-shrink:0;width:130px;">live '+(r.live.grad?'GRAD':'—')+' m'+r.live.m+' s'+r.live.stage+'</span>'
      +'<span style="opacity:.6;">cold '+(r.cold.grad?'GRAD':'—')+' d'+r.cold.discrim+' i'+r.cold.incid+' n'+r.cold.n+'</span>'
      +'</div>';
  });
  html+='</div>';
  ov.innerHTML=html;
  var cb=document.getElementById('coldLiveClose'); if(cb) cb.onclick=function(){ ov.style.display='none'; };
}
if($('debugColdLive')) $('debugColdLive').onclick=renderColdVsLive;
// Card browser: the full rank-ordered ranking 0→N with per-card scheduler state
// and the INTRODUCTION GATE diagnostic (why the frontier is/isn't advancing).
function renderCardBrowser(){
  var ov=document.getElementById('cardBrowserOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='cardBrowserOverlay';
    ov.style.cssText='position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;background:#0b0e0c;color:#cfe9dd;font-family:monospace;overflow:hidden;';
    document.body.appendChild(ov); }
  ov.style.display='flex';
  var fr=(typeof frontier==='function')?frontier():0, CAP=3, CEIL=16;
  var grad=function(i){ try{ return Scheduler._isGraduated(S.cards[i]||{}); }catch(e){ return false; } };
  var brandNew=0, blockers=[];
  for(var i=0;i<D.length;i++){ var ci=S.cards[i]; if(ci&&ci.exp>0&&!grad(i)){ brandNew++; blockers.push(D[i][0]); } }
  var canIntro=brandNew<CAP && brandNew<CEIL;
  var nextIdx=-1; for(var j=0;j<D.length;j++){ if(!(S.cards[j]&&S.cards[j].exp>0)){ nextIdx=j; break; } }
  var MMAX=(typeof MASTERY_MAX!=='undefined')?MASTERY_MAX:4;
  var head='<div style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.15);display:flex;gap:10px;align-items:center;flex-wrap:wrap;flex-shrink:0;">'
    +'<button class="btn" id="cardBrowserClose" style="width:auto;font-size:10px;padding:5px 12px;">◄ BACK</button>'
    +'<span style="font-size:11px;letter-spacing:1px;">CARD RANKING 0→N</span>'
    +'<span style="font-size:10px;opacity:.85;">FRONTIER '+fr+' · brand-new <b style="color:'+(brandNew>=CAP?'#ff6b6b':'#9fd')+'">'+brandNew+'/'+CAP+'</b>'
    +' · introduce: '+(canIntro?'<span style="color:#6f6">YES</span>':'<span style="color:#ff6b6b">NO — cap hit</span>')
    +(nextIdx>=0?' · next: '+D[nextIdx][0]+' #'+(nextIdx+1):'')+'</span></div>';
  if(brandNew>=CAP && blockers.length) head+='<div style="padding:5px 14px;font-size:10px;color:#ffb84d;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0;">⚠ introduction blocked — these are seen but not graduated (show/answer them to advance): '+blockers.join(' ')+'</div>';
  var upto=Math.min(D.length, Math.max(fr+12, 22));
  var body='<div style="flex:1;overflow-y:auto;padding:6px 12px;font-size:11px;line-height:1.55;">';
  for(var i=0;i<upto;i++){
    var ci=S.cards[i]||{}, seen=!!ci.seen, g=grad(i);
    var m=(typeof masteryScore==='function')?masteryScore(i):(ci.m||0);
    var stg=(typeof getAxisStage==='function')?getAxisStage(i,'meaning'):((ci.axisStage||{}).meaning||0);
    var tag,col;
    if(!seen){ tag='fog'; col='#566'; }
    else if(!g){ tag='● BLOCKER'; col='#ffb84d'; }
    else if(m>=MMAX){ tag='mastered'; col='#7dffc0'; }
    else { tag='learning'; col='#9fd'; }
    var ls=(ci._lastSeenAt?('seen@'+ci._lastSeenAt):'');
    body+='<div style="display:flex;gap:8px;padding:2px 0;border-bottom:1px solid rgba(255,255,255,.04);'+(i===fr?'border-top:2px solid #4dffa0;':'')+'">'
      +'<span style="width:34px;opacity:.5;flex-shrink:0;">#'+(i+1)+'</span>'
      +'<span style="width:26px;flex-shrink:0;font-size:14px;color:'+(seen?'#eafff4':'#566')+'">'+D[i][0]+'</span>'
      +'<span style="width:74px;flex-shrink:0;color:'+col+'">'+tag+'</span>'
      +'<span style="opacity:.82;">'+(seen?('exp'+(ci.exp||0)+' m'+(Math.round(m*10)/10)+' stg'+stg+(g?' GRAD':' —')+' '+ls):D[i][2])+'</span>'
      +'</div>';
  }
  body+='</div>';
  ov.innerHTML=head+body;
  var cb=document.getElementById('cardBrowserClose'); if(cb) cb.onclick=function(){ ov.style.display='none'; };
}
if($('debugCardBrowser')) $('debugCardBrowser').onclick=renderCardBrowser;

// ── Scheduler dry-run simulator ────────────────────────────────────────────
// Hypothetical playthrough from a FRESH course (card 0 → N) using the REAL
// Scheduler.next + recordAxisResultNew, so changes to the heuristics show up
// immediately — iterate without playing the deck. Read-only: swaps in a throwaway
// state and stubs save(), restores everything (real progress/localStorage untouched).
function simulateSchedule(N, accuracy){
  N=N||80; accuracy=(accuracy==null)?1.0:accuracy;
  var trace=[], intros=0, finalFrontier=0;
  var _S=S, _save=save;
  var _mi=(typeof currentMultIdx!=='undefined')?currentMultIdx:0;
  var _md=(typeof defaultMultIdx!=='undefined')?defaultMultIdx:0;
  try{
    var fresh=(typeof defaultState==='function')?JSON.parse(JSON.stringify(defaultState())):{};
    fresh.cards={}; fresh.totalSeen=0; fresh.userWordQueue=[]; fresh.coldCutover=false;
    S=fresh; save=function(){};
    try{ currentMultIdx=defaultMultIdx; }catch(e){}   // neutralize wager stage-compression for a clean baseline
    var grad=function(i){ try{ return Scheduler._isGraduated(S.cards[i]||{}); }catch(e){ return false; } };
    var frontierNow=function(){ var f=0; for(var k=0;k<D.length;k++){ if(S.cards[k]&&S.cards[k].exp>0) f=k+1; } return f; };
    var brandNewNow=function(){ var n=0; for(var k=0;k<D.length;k++){ var c=S.cards[k]; if(c&&c.exp>0&&!grad(k)) n++; } return n; };
    var simCount=0, simRing=[], simRecent=[];
    for(var step=0; step<N; step++){
      var sess={ studyCardCount:simCount, studyFlashOnly:false, studyModalityFilter:null,
        studyPending:[], sessionGrammarAnswered:new Set(), studyEncounters:new Map(),
        sessionRecentCards:simRecent.slice(), sessionAnswerRing:simRing.slice(), nextQueueRebuildAt:0 };
      var effCap=(function(){ try{ return Scheduler._effectiveCap(sess); }catch(e){ return null; } })();
      var decision; try{ decision=Scheduler.next(S,D,sess); }catch(e){ trace.push({n:step+1,error:String(e)}); break; }
      if(!decision || decision.idx==null || decision.idx<0){ trace.push({n:step+1,end:true}); break; }
      var idx=decision.idx, isIntro=decision.type==='introduce';
      simRecent.push(idx); if(simRecent.length>8) simRecent.shift();  // mirror live sessionRecentCards (anti-repeat)
      var frB=frontierNow(), bnB=brandNewNow();
      simCount++; S.totalSeen=(S.totalSeen||0)+1;
      if(typeof isGrammarKey==='function'&&isGrammarKey(idx)){ trace.push({n:step+1,ch:'(grammar)',type:'grammar',mod:'grammar',reason:'grammar drill'}); continue; }
      var ci=S.cards[idx]=S.cards[idx]||{};
      var mod=isIntro?'flash':(function(){ try{ return Scheduler.modality(S,D,idx); }catch(e){ return 'mc-fwd'; } })();
      var stg=(typeof getAxisStage==='function')?getAxisStage(idx,'meaning'):((ci.axisStage||{}).meaning||0);
      if(isIntro) intros++;
      var capTxt=(effCap==null)?'cap':('cap '+effCap+(simRing.length>=ACQ_ADAPT_MIN&&ACQ_ADAPT?'*':''));
      var reason= isIntro
        ? ('introduce — frontier '+frB+'→'+(frB+1)+', in-acq room ('+capTxt+')')
        : ('review · '+mod+' · '+(mod==='flash'?'not yet MC-ready':(stg===0?'first MC → graduates it':((mod==='cloze'||mod==='word-order')?'context (stg'+stg+')':'recall (stg'+stg+')'))));
      var pAlgo=(function(){ try{ return Math.round(Scheduler._pCorrect(ci,'meaning')*100)/100; }catch(e){ return null; } })();
      trace.push({n:step+1, idx:idx, ch:D[idx][0], type:decision.type, mod:mod, stg:stg, frontier:frB, brandNew:bnB, cap:effCap, p:pAlgo, reason:reason});
      ci._lastSeenAt=S.totalSeen;
      if(mod==='flash'){
        if(!(ci.exp>0)){ ci.exp=1; ci.seen=true; ci.axisDue=ci.axisDue||{};
          ci.axisDue.meaning=S.totalSeen+((typeof AXIS_STABILITY!=='undefined'&&AXIS_STABILITY.meaning&&AXIS_STABILITY.meaning[0])||3);
          ci.axisDue.pos=S.totalSeen+((typeof AXIS_STABILITY!=='undefined'&&AXIS_STABILITY.pos&&AXIS_STABILITY.pos[0])||5); }
      } else {
        var axis=(mod.indexOf('pos')===0)?'pos':'meaning';
        var ok=Math.random()<accuracy;
        try{ recordAxisResultNew(idx, axis, ok, 2500); }catch(e){}
        simRing.push(ok); if(simRing.length>15) simRing.shift();   // mirror live sessionAnswerRing for adaptive C
      }
    }
    finalFrontier=frontierNow();
  } finally { S=_S; save=_save; try{ currentMultIdx=_mi; defaultMultIdx=_md; }catch(e){} }
  return { steps:trace, finalFrontier:finalFrontier, intros:intros };
}
try{ window.simulateSchedule=simulateSchedule; }catch(e){}

// Standing invariant battery — runs on the SIM trace EVERY playthrough so the
// obvious scheduler properties fail loudly instead of waiting for a user report.
// Each invariant here encodes a property we've had to learn the hard way; add to
// this list whenever a new "that can't be optimal" surfaces. A SIM with no
// assertions is just a print statement — this is what makes it a regression harness.
function simInvariants(r){
  var steps=(r&&r.steps)||[];
  var flashAt={}, testAt={}, prevIdx=null, immediateRepeat=0;
  steps.forEach(function(s){
    if(s.idx==null||s.type==='grammar'||s.end||s.error){ prevIdx=null; return; }
    var isFlash=(s.mod==='flash'||s.type==='introduce');
    if(isFlash){ if(flashAt[s.idx]==null) flashAt[s.idx]=s.n; }
    else if(testAt[s.idx]==null){ testAt[s.idx]=s.n; }
    if(prevIdx===s.idx) immediateRepeat++;
    prevIdx=s.idx;
  });
  var beforeFlash=0, gaps=[];
  Object.keys(testAt).forEach(function(idx){
    var f=flashAt[idx], t=testAt[idx];
    if(f==null||t<f) beforeFlash++; else gaps.push(t-f);
  });
  var minGap=gaps.length?Math.min.apply(null,gaps):null;
  var ps=steps.filter(function(s){return s.type!=='introduce'&&s.type!=='grammar'&&typeof s.p==='number';}).map(function(s){return s.p;});
  var meanEdge=ps.length?ps.reduce(function(a,b){return a+Math.abs(b-0.5);},0)/ps.length:null;
  // No-monopoly: the single most-served card must not dominate the run. A livelock
  // (e.g. the 2-card alternation that froze the frontier) makes one card ~50% of
  // steps; healthy rotation keeps any single card well under that. Only meaningful
  // once the run is long enough to have cycled a real working set.
  var servedCount={}, totalServed=0, maxShare=0;
  steps.forEach(function(s){ if(s.idx!=null && !s.end && !s.error && s.type!=='grammar'){ servedCount[s.idx]=(servedCount[s.idx]||0)+1; totalServed++; } });
  Object.keys(servedCount).forEach(function(k){ if(servedCount[k]>maxShare) maxShare=servedCount[k]; });
  var topShare=totalServed?maxShare/totalServed:0;
  var MIN_GAP=3, PACE_FLOOR=Math.max(1,Math.round(steps.length*0.15)), EDGE_MAX=0.15, MONOPOLY_MAX=0.35;
  var checks=[
    {name:'never test before flash',     pass:beforeFlash===0,                              detail:beforeFlash+' violation(s)'},
    {name:'initial spacing ≥'+MIN_GAP, pass:(minGap==null||minGap>=MIN_GAP),            detail:'min gap '+minGap},
    {name:'no immediate repeat',         pass:immediateRepeat===0,                          detail:immediateRepeat+' repeat(s)'},
    {name:'no card monopoly',            pass:(totalServed<30||topShare<=MONOPOLY_MAX),     detail:'top card '+Math.round(topShare*100)+'% of '+totalServed},
    {name:'pace ≥'+PACE_FLOOR,         pass:(r.finalFrontier>=PACE_FLOOR),              detail:'frontier '+r.finalFrontier},
    {name:'edge ≤'+EDGE_MAX,           pass:(meanEdge==null||meanEdge<=EDGE_MAX),       detail:'mean|P-.5| '+(meanEdge==null?'-':meanEdge.toFixed(3))}
  ];
  return {pass:checks.every(function(c){return c.pass;}), checks:checks};
}
// One-shot runner for console/CI: window.simCheck(160,0.85) → {pass, checks}
try{ window.simInvariants=simInvariants; window.simCheck=function(N,acc){ return simInvariants(simulateSchedule(N||160, acc==null?0.85:acc)); }; }catch(e){}

var _simN=80, _simAcc=1.0;
function renderSimTrace(){
  var r=simulateSchedule(_simN,_simAcc);
  var ov=document.getElementById('simTraceOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='simTraceOverlay';
    ov.style.cssText='position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;background:#0b0e0c;color:#cfe9dd;font-family:monospace;overflow:hidden;';
    document.body.appendChild(ov); }
  ov.style.display='flex';
  function btn(label,on){ return '<button class="btn st-ctl" data-act="'+on+'" style="width:auto;font-size:9px;padding:4px 8px;">'+label+'</button>'; }
  var inv=simInvariants(r);
  var badges=inv.checks.map(function(c){
    var col=c.pass?'#6f6':'#ff5d5d';
    return '<span title="'+c.detail+'" style="font-size:9px;padding:2px 6px;border:1px solid '+col+';color:'+col+';white-space:nowrap;">'+(c.pass?'✓':'✗')+' '+c.name+'</span>';
  }).join('');
  var head='<div style="padding:9px 14px;border-bottom:1px solid rgba(255,255,255,.15);display:flex;gap:8px;align-items:center;flex-wrap:wrap;flex-shrink:0;">'
    +'<button class="btn" id="simClose" style="width:auto;font-size:10px;padding:5px 12px;">◄ BACK</button>'
    +'<span style="font-size:11px;letter-spacing:1px;">SIM PLAYTHROUGH (fresh course, real scheduler)</span>'
    +'<span style="font-size:10px;opacity:.8;">'+r.steps.length+' steps · reached FRONTIER '+r.finalFrontier+' · '+r.intros+' introductions · acc '+Math.round(_simAcc*100)+'%</span>'
    +'<span style="margin-left:auto;display:flex;gap:6px;">'+btn('80','n80')+btn('160','n160')+btn('300','n300')+btn('100%','a100')+btn('85%','a85')+'</span></div>'
    +'<div style="padding:6px 14px;border-bottom:1px solid rgba(255,255,255,.1);display:flex;gap:6px;align-items:center;flex-wrap:wrap;flex-shrink:0;">'
    +'<span style="font-size:9px;letter-spacing:1px;opacity:.6;">INVARIANTS '+(inv.pass?'<span style="color:#6f6">ALL PASS</span>':'<span style="color:#ff5d5d">FAIL</span>')+'</span>'+badges+'</div>'
    +'<div style="flex:1;overflow-y:auto;padding:6px 12px;font-size:11px;line-height:1.5;">';
  var body='';
  r.steps.forEach(function(s){
    if(s.error){ body+='<div style="color:#ff6b6b">#'+s.n+' ERROR '+s.error+'</div>'; return; }
    if(s.end){ body+='<div style="opacity:.6">#'+s.n+' — session would end (no card)</div>'; return; }
    var col=s.type==='introduce'?'#6f6':(s.mod==='flash'?'#ffb84d':'#9ab');
    var tag=s.type==='introduce'?'INTRO':'·';
    body+='<div style="display:flex;gap:8px;padding:1px 0;">'
      +'<span style="width:34px;opacity:.4;flex-shrink:0;">#'+s.n+'</span>'
      +'<span style="width:46px;flex-shrink:0;color:'+col+'">'+tag+'</span>'
      +'<span style="width:26px;flex-shrink:0;font-size:13px;">'+s.ch+'</span>'
      +'<span style="width:70px;flex-shrink:0;opacity:.85;">'+s.mod+'</span>'
      +'<span style="opacity:.65;">'+s.reason+'</span></div>';
  });
  ov.innerHTML=head+body+'</div>';
  var cb=document.getElementById('simClose'); if(cb) cb.onclick=function(){ ov.style.display='none'; };
  Array.prototype.forEach.call(ov.querySelectorAll('.st-ctl'), function(b){ b.onclick=function(){
    var a=b.getAttribute('data-act');
    if(a==='n80')_simN=80; else if(a==='n160')_simN=160; else if(a==='n300')_simN=300;
    else if(a==='a100')_simAcc=1.0; else if(a==='a85')_simAcc=0.85;
    renderSimTrace();
  }; });
}
if($('debugSimTrace')) $('debugSimTrace').onclick=renderSimTrace;

// ◇ BASIS / 3 AXES — visualize the curriculum cost model: generative basis per
// construction tier (the dissonance vs Zipf) + the three-axis load (frequency ×
// generativity × substitution distance). Read-only analysis, no scheduler effect.
function renderBasisPanel(){
  var g, t;
  try{ g=computeGenerativeBasis(); t=computeThreeAxisBasis(); }
  catch(e){ alert('BASIS: '+e); return; }
  var ov=document.getElementById('basisOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='basisOverlay';
    ov.style.cssText='position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;background:#0b0e0c;color:#cfe9dd;font-family:monospace;overflow:hidden;';
    document.body.appendChild(ov); }
  ov.style.display='flex';
  var col={transparent:'#6f6','divergent':'#ffb84d','false-friend':'#ff6b6b',unclassified:'#789'};
  var head='<div style="padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.15);display:flex;gap:8px;align-items:center;flex-wrap:wrap;flex-shrink:0;">'
    +'<button class="btn" id="basisClose" style="width:auto;font-size:10px;padding:5px 12px;">◄ BACK</button>'
    +'<span style="font-size:10px;letter-spacing:1px;">BASIS / 3 AXES — freq · generativity · substitution</span></div>'
    +'<div style="flex:1;overflow-y:auto;padding:10px 12px;font-size:10px;line-height:1.5;">';

  // Section 1 — generative basis tiers (capability ladder + dissonance)
  var s1='<div style="font-size:9px;opacity:.55;letter-spacing:1.5px;margin:2px 0 6px;">GENERATIVE BASIS — capability ladder (min set-cover per tier)</div>';
  s1+='<div style="display:flex;font-size:8px;opacity:.5;"><span style="width:118px;flex-shrink:0;">TIER</span><span style="width:34px;flex-shrink:0;">SIZE</span><span style="width:44px;flex-shrink:0;">REACH</span><span>FREQ-DEFERRED</span></div>';
  g.tiers.forEach(function(ti){
    s1+='<div style="display:flex;padding:1px 0;"><span style="width:118px;flex-shrink:0;">'+ti.name+'</span>'
      +'<span style="width:34px;flex-shrink:0;">'+ti.basisSize+'</span>'
      +'<span style="width:44px;flex-shrink:0;color:'+(ti.reachRatio>=5?'#ffb84d':'#cfe9dd')+'">'+ti.reachRatio+'×</span>'
      +'<span style="opacity:.7;font-size:13px;line-height:1.2;">'+(ti.deferred.map(function(x){return x.split('#')[0];}).join(' ')||'—')+'</span></div>';
  });

  // Section 2 — three-axis breakdown of the full basis
  var s2='<div style="font-size:9px;opacity:.55;letter-spacing:1.5px;margin:16px 0 6px;">THREE AXES — each basis atom (freq · role · substitution)</div>';
  s2+='<div style="display:flex;font-size:8px;opacity:.5;"><span style="width:30px;flex-shrink:0;">ATOM</span><span style="width:42px;flex-shrink:0;">#FREQ</span><span style="width:92px;flex-shrink:0;">ROLE</span><span style="width:78px;flex-shrink:0;">SUBST</span><span>NOTE</span></div>';
  t.atoms.forEach(function(a){
    s2+='<div style="display:flex;padding:2px 0;align-items:baseline;border-bottom:1px solid rgba(255,255,255,.05);">'
      +'<span style="width:30px;flex-shrink:0;font-size:15px;">'+a.ch+'</span>'
      +'<span style="width:42px;flex-shrink:0;opacity:.7;">#'+a.freqRank+'</span>'
      +'<span style="width:92px;flex-shrink:0;opacity:.8;">'+a.role+'</span>'
      +'<span style="width:78px;flex-shrink:0;color:'+(col[a.subClass]||'#cfe9dd')+'">'+a.subClass.replace('false-friend','f-friend')+(a.dist!=null?' '+a.dist:'')+'</span>'
      +'<span style="opacity:.55;font-size:9px;line-height:1.3;">'+a.note+'</span></div>';
  });

  // Section 3 — the real learning load
  var pct=Math.round((t.effectiveLoad/t.nominalMax)*100);
  var s3='<div style="font-size:9px;opacity:.55;letter-spacing:2px;margin:16px 0 6px;">REAL LEARNING LOAD (English → Mandarin)</div>'
    +'<div style="display:flex;gap:10px;flex-wrap:wrap;">'
    +'<span style="border:1px solid '+col.transparent+';color:'+col.transparent+';padding:3px 8px;">'+t.byClass.transparent+' transparent (~free)</span>'
    +'<span style="border:1px solid '+col.divergent+';color:'+col.divergent+';padding:3px 8px;">'+t.byClass.divergent+' divergent (new)</span>'
    +'<span style="border:1px solid '+col['false-friend']+';color:'+col['false-friend']+';padding:3px 8px;">'+t.byClass['false-friend']+' false-friend (un-learn)</span></div>'
    +'<div style="margin-top:8px;font-size:11px;">basis '+t.basisSize+' atoms · <b>real load '+t.realLoadCount+'</b> (divergent+false-friend) · effective '+t.effectiveLoad+'/'+t.nominalMax+' = '+pct+'% · L1 crutch removes '+(100-pct)+'% · '+t.transparentSharePct+'% transparent</div>';

  ov.innerHTML=head+s1+s2+s3+'</div>';
  var cb=document.getElementById('basisClose'); if(cb) cb.onclick=function(){ ov.style.display='none'; };
}
if($('debugBasis')) $('debugBasis').onclick=renderBasisPanel;

// ◉ WHY THIS CARD — the SIM's per-card rationale, surfaced LIVE during a session.
// Same reasoning as the SIM trace, computed from the chosen card's state. Toggle
// via the debug button; renders a caption bar at the bottom of the study screen.
// (explainCardSelection is written human-friendly so it can graduate to a learner-
// facing "why am I seeing this?" later.)
function explainCardSelection(i, mod){
  try{
    var ci = (S.cards && S.cards[i]) || {};
    var stage = Scheduler._getAxisStage(ci,'meaning');
    var p = Scheduler._pCorrect(ci,'meaning');
    var H = Scheduler._entropy(p);
    var seen = S.totalSeen||0;
    var dueRaw = (ci.axisDue && ci.axisDue.meaning) || 0;
    var due = dueRaw>1e9?0:dueRaw;
    var overdue = seen - due;
    var introduced = ci.exp>0;
    var isAcq = introduced && stage<ACQUIRED_STAGE;
    var inAcq = D.filter(function(_,k){ var c=S.cards[k]; return c && c.exp>0 && Scheduler._getAxisStage(c,'meaning')<ACQUIRED_STAGE; }).length;
    var frontier = D.filter(function(_,k){ return S.cards[k]&&S.cards[k].exp>0; }).length;
    var ring = (typeof sessionAnswerRing!=='undefined')?sessionAnswerRing:[];
    var cap = (function(){ try{ return Scheduler._effectiveCap({sessionAnswerRing:ring}); }catch(e){ return ACQUISITION_CAP; } })();
    var modWhy = {
      'flash':'first exposure — admission, never tested yet',
      'mc-fwd':(stage===0?'first recognition test — one clean correct graduates it':'recognition: character → meaning'),
      'mc-rev':'production-leaning recall: meaning → character',
      'cloze':'context: fill the blank in a real sentence',
      'word-order':'context: assemble the sentence from tiles',
      'tone':'tone discrimination',
      'comprehension':'comprehension check'
    }[mod] || mod;
    var edge = H>=0.95?'AT THE EDGE (P≈0.5 — max learning)':H>=0.8?'near the edge':(p>=0.85?'easy — well known':(p<=0.3?'hard — model expects a miss':''));
    var pickWhy = isAcq ? 'picked: in-acquisition, prioritized to consolidate & free a slot'
                : (overdue>0 ? 'picked: most-overdue (due '+overdue+' cards ago)' : 'picked: due now');
    var capNote = 'frontier '+frontier+'/'+D.length+' · in-acquisition '+inAcq+'/'+cap+(inAcq>=cap?'  ⚠ CAP FULL — no new word until one graduates':'');
    // Substitution (σ) — the L1→L2 cost, and (when SUBST_GATING is on) its live effect
    // on the graduation bar: transparent grads a rep sooner, divergent/false-friend a rep later.
    var subNote = '';
    try {
      var sub = (typeof substitution==='function') ? substitution(D[i][0]) : null;
      if (sub) {
        var gate = (typeof SUBST_GATING!=='undefined' && SUBST_GATING)
          ? (sub.c==='transparent' ? ' → graduates FASTER (−1 rep)' : (sub.c==='divergent'||sub.c==='false-friend') ? ' → needs MORE consolidation (+1 rep)' : '')
          : ' (gating off)';
        subNote = 'substitution: '+sub.c+' (σ '+sub.d+')'+gate+' — '+sub.n;
      } else {
        subNote = 'substitution: unclassified';
      }
    } catch(e){}
    return {
      head: (D[i]?D[i][0]:'?')+' #'+i+' · '+(introduced?'review':'INTRODUCE (flash)')+' · meaning-stage '+stage,
      lines: [
        'P(correct) '+(Math.round(p*100)/100)+(edge?'  ·  '+edge:''),
        pickWhy,
        'modality '+mod+' — '+modWhy,
        subNote,
        capNote
      ]
    };
  }catch(e){ return { head:'(why: error)', lines:[String(e)] }; }
}
function renderCardExplain(i, mod){
  if(!window.EXPLAIN_MODE) return;
  var ex = explainCardSelection(i, mod);
  var el = document.getElementById('cardExplainBar');
  if(!el){ el=document.createElement('div'); el.id='cardExplainBar';
    el.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:150;background:rgba(8,12,10,.93);color:#9fe0c4;font-family:monospace;font-size:10px;line-height:1.5;padding:8px 12px;border-top:1px solid rgba(120,220,180,.35);pointer-events:none;max-height:38vh;overflow:hidden;';
    document.body.appendChild(el); }
  el.style.display='block';
  el.innerHTML='<div style="font-size:11px;color:#dff3ea;letter-spacing:1px;margin-bottom:3px;">◉ WHY ▸ '+ex.head+'</div>'
    +ex.lines.map(function(l){ return '<div style="opacity:.82;">'+l+'</div>'; }).join('');
}
function hideCardExplain(){ var el=document.getElementById('cardExplainBar'); if(el) el.style.display='none'; }
try{ window.explainCardSelection=explainCardSelection; window.renderCardExplain=renderCardExplain; window.hideCardExplain=hideCardExplain; window.EXPLAIN_MODE=false; }catch(e){}
if($('debugExplain')) $('debugExplain').onclick=function(){
  window.EXPLAIN_MODE=!window.EXPLAIN_MODE;
  this.textContent='◉ WHY THIS CARD: '+(window.EXPLAIN_MODE?'ON':'OFF');
  if(!window.EXPLAIN_MODE) hideCardExplain();
  else if(typeof activeCardIdx!=='undefined' && activeCardIdx>=0 && typeof lastModality!=='undefined') renderCardExplain(activeCardIdx, lastModality.get(activeCardIdx)||'mc-fwd');
};
// Cutover toggle: flip whether the cold engine drives graduation/selection.
function updateColdCutoverBtn(){ var b=document.getElementById('debugColdCutover'); if(b) b.textContent='⇄ COLD CUTOVER: '+((typeof S!=='undefined'&&S.coldCutover)?'ON':'OFF'); }
if($('debugColdCutover')) $('debugColdCutover').onclick=function(){
  S.coldCutover=!S.coldCutover;
  if(S.coldCutover){ try{ if(typeof coldRecompute==='function') coldRecompute(); }catch(e){} } // fresh verdicts before it drives anything
  try{ save(); }catch(e){}
  updateColdCutoverBtn();
};
try{ updateColdCutoverBtn(); }catch(e){}
$('debugToggle').onclick=()=>{
  const dm=$('debugModes');
  const open=dm.style.display==='flex';
  dm.style.display=open?'none':'flex';
  $('debugToggle').textContent=open?'▸ DEBUG MODES':'▾ DEBUG MODES';
  // ensure proctor + obs buttons exist when panel is revealed (in case of late attach)
  try{ if(window.EW&&EW.obs&&EW.obs.size){ /* obs already ensures on load; re-call is harmless */ } }catch(e){}
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
$('mapLabel').onclick=()=>{ rollBg(); renderDeckMgr(); show('deckMgr'); };
$('deckMgr-back').onclick=()=>{ goHome(); };
if($('deckMgr-create')) $('deckMgr-create').onclick=()=>{
  const inp=$('deckMgr-input');
  const name=inp.value.trim();
  if(!name) return;
  createDeck(name);
  inp.value='';
  renderDeckMgr();
};


/* ============ INIT ============ */
(()=>{
  // Destroy any lingering fatigue overlay from previous session
  const lo=document.getElementById('fatigueOverlay');
  if(lo) lo.remove();
  restoreActiveCourse(); // point D + KEY at last-used course before loading state
  load();
  loadSessionRings(); // restore ring state if page was minimized mid-session
  initGrammarState(); // ensure grammar sub-axis structure exists
  if(typeof speechSynthesis!=='undefined') speechSynthesis.getVoices();
  resetSessionFatigue(); rollBg(); renderHome(); show('home');
  renderTTSStatus();
})();


// ═══════════════════════════════════════════════════════════════
// LAYER 2 — Static Data (clean module, overrides L1 declarations)
// ═══════════════════════════════════════════════════════════════
// Note: data constants are already declared in L1 with same values.
// New course data (future: Arabic, etc.) added here only.
// ACTIVE_COURSE_KEY and activeCourse() now canonical here:
// Active course is restored from localStorage in the init IIFE above via
// restoreActiveCourse(); do NOT hardcode it here (would clobber the restore).
// activeCourse and activeLexicon already defined in L1

// ═══════════════════════════════════════════════════════════════
// LAYER 3 — Pure Scheduler Engine
// ═══════════════════════════════════════════════════════════════
// earworm — engine/scheduler.js
// Pure scheduling engine. No DOM. No side effects except through dispatch().
// Input: state snapshot. Output: {type, idx, axis, modality, reason}
// Every scheduling decision is traceable and testable.

// Working-set governor knobs (§8-bis). Live-tunable (let) so the SIM can sweep
// them without a rebuild. ACQUIRED_STAGE = the meaning-stage at which a word stops
// counting as active acquisition load (consolidated); ACQUISITION_CAP = the bound
// on simultaneously-in-acquisition atoms (working-memory limit).
let ACQUIRED_STAGE = 1;   // a word counts as active load until meaning-stage 1 (recognized once); stage 2 is consolidation-rate-bound (~12/80) — too slow
let ACQUISITION_CAP = 6;  // BASELINE working-set cap; flexed by recent accuracy (adaptive C, §8-bis)
let ACQ_ADAPT = true;     // accuracy-adaptive cap on/off
let ACQ_CAP_MIN = 3, ACQ_CAP_MAX = 10, ACQ_ADAPT_MIN = 8;  // adaptive bounds + min recent answers before flexing
try{ window.setAcqKnobs=function(cap,stage,adapt){ if(cap!=null)ACQUISITION_CAP=cap; if(stage!=null)ACQUIRED_STAGE=stage; if(adapt!=null)ACQ_ADAPT=!!adapt; return {ACQUISITION_CAP,ACQUIRED_STAGE,ACQ_ADAPT,ACQ_CAP_MIN,ACQ_CAP_MAX}; }; }catch(e){}

// Frontier-seeking selection: among DUE cards, prefer those whose modeled P(correct)
// is nearest 0.5 — the triple optimum (max information / zone of proximal development /
// max reward-prediction-error). This is the COUPLING layer the wager meta-game sits on:
// the highest-value table is always parked at the edge of what the learner almost knows.
// Subsumes the old binary acqRank (stage-0 cards have P≈0.5 → top entropy → picked first).
let FRONTIER_SEEK = true;   // select due cards by entropy(P_correct); off → legacy acqRank+recency
let ENTROPY_BUCKET = 0.08;  // coarseness of entropy tiers, so fair recency rotation operates within a tier
try{ window.setFrontierSeek=function(on){ FRONTIER_SEEK=!!on; return FRONTIER_SEEK; }; }catch(e){}

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
    if (this._shouldIntroduce(S, D, sessionState)) {
      const idx = this._nextWordToIntroduce(S, D);
      if (idx >= 0) return { type: 'introduce', idx, modality: 'flash', reason: 'new-word' };
    }

    // 5. Due grammar drills (vocabulary-gated)
    const grammarDrills = this._dueGrammarDrills(S, D, sessionGrammarAnswered);
    const vocabDue = this._dueVocab(S, D);
    const vocabSeen = this._seenVocab(S, D);

    // 6. Build interleaved queue
    return this._pickFromPools(grammarDrills, vocabDue, vocabSeen, S, D, (sessionState && sessionState.sessionRecentCards) || []);
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

      // POS axis (fibration: gated behind meaning — grammatical role is meaningless on
      // an un-comprehended word). Once a word is recognized (meaning ≥ 1), interleave
      // occasional pos drills when the pos axis is due, so the role axis actually
      // progresses (it was dormant — the v2 modality scheduler never wired it in).
      // Comprehensible stages only: capped at pos-s3, deferring the stage-4 Mandarin
      // metalanguage drill. The drill records the pos axis (grammar.js showStudyPOSStaged).
      const posStg = this._getAxisStage(ci, 'pos');
      const POS_MOD_CAP = 3;
      if (meanStg >= 1 && posStg < POS_MOD_CAP && D[i] && D[i][4] &&
          this._isAxisDue(ci, 'pos') && Math.random() < 0.25) {
        return 'pos-s' + Math.min(POS_MOD_CAP, posStg + 1);
      }

      // Convergence: grammar + vocab both ready
      if (this._convergenceUnlocked(S, D, i) && this._isCardDue(ci)) {
        if (this._mostOverdueAxis(ci) === 'pos') return 'convergence';
      }

      // Meaning axis scheduling
      const meanDue = this._isAxisDue(ci, 'meaning');
      if (meanDue || meanStg >= 1) {
        const hasSentences = getPuzzleSentences(i).some(function(s){ return sentenceAllIntroduced(s[0]); });
        if (meanStg === 1) return 'mc-fwd';
        // Context modality is CLOZE with the gloss exposed (scaffolded production:
        // see the sentence with one blank AND its meaning, fill the blank). The
        // sentence-level target->parent "comprehension" modality is DISABLED for
        // now — it's an unscaffolded whole-meaning guess, too hard/unengaging this
        // early; showStudyComprehension stays in the code for a much-later
        // (high-mastery) reintroduction. Isolated MC remains scaffold/remedial.
        if (meanStg === 2) {
          if (hasSentences && Math.random() < 0.35) return 'cloze';
          return Math.random() < 0.6 ? 'mc-fwd' : 'mc-rev';
        }
        if (meanStg === 3) {
          if (hasSentences) return Math.random() < 0.5 ? 'cloze' : 'mc-rev';
          return Math.random() < 0.5 ? 'mc-fwd' : 'mc-rev';
        }
        if (meanStg >= 4) {
          const r = Math.random();
          if (hasSentences) {
            if (r < 0.45) return 'cloze';
            if (r < 0.70) return 'word-order';
          }
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

  // (Scheduler.recordAnswer — the vocab second-engine — is removed; recordAxisResultNew
  // in data.js is the sole authoritative writer of vocab axis state.)

  // ─── Grammar: record result ──────────────────────────────────────────────

  recordGrammarAnswer(S, cat, axis, isCorrect, responseMs, currentMultIdx, defaultMultIdx) {
    if (!S.grammar) S.grammar = {};
    if (!S.grammar[cat]) S.grammar[cat] = {};
    if (!S.grammar[cat][axis]) S.grammar[cat][axis] = { stage: 0, history: [], due: 0, reps: 0 };

    const ax = S.grammar[cat][axis];
    const seen = S.totalSeen || 0;
    const intervals = AXIS_INTERVALS[axis] || [8, 25, 100];

    ax.history.push(isCorrect ? 1 : 0);
    if (ax.history.length > 30) ax.history.shift();

    const stage = ax.stage || 0;
    const maxStage = AXIS_MAX_STAGES[axis] || 4;

    if (!isCorrect) {
      ax.reps = 0;
      const wrongCards = stage <= 1 ? 3 : stage <= 2 ? 6 : 12;
      ax.due = seen + wrongCards;
    } else {
      ax.reps = (ax.reps || 0) + 1;
      const wagerBonus = currentMultIdx > defaultMultIdx ? 1 : 0;
      const windowSize = Math.max(1, (stage === 0 ? 2 : 3) - wagerBonus);
      const recent = ax.history.slice(-windowSize);
      const acc = recent.reduce((s,v) => s+v, 0) / Math.max(1, recent.length);
      const threshold = stage === 0 ? 1.0 : 0.8;
      const shouldAdvance = recent.length >= windowSize && acc >= threshold && stage < maxStage;
      const speedMult = responseMs < 1500 ? 1.2 : responseMs < 4000 ? 1.0 : 0.9;

      if (shouldAdvance) {
        ax.stage = stage + 1;
        ax.reps = 0;
        ax.due = seen + Math.round((intervals[Math.min(stage + 1, intervals.length - 1)] || 100) * speedMult);
      } else {
        ax.due = seen + Math.max(1, Math.round((intervals[Math.min(stage, intervals.length - 1)] || 8) * speedMult));
      }
    }

    return S.grammar[cat][axis];
  },

  // ─── Distractor selection ────────────────────────────────────────────────

  pickMeaningDistractors(S, D, targetIdx, n, stage) {
    const [ch,,correctDef,,targetPos] = D[targetIdx];
    const introChs = D.filter((_, i) => S.cards[i] && S.cards[i].seen).map(d => d[0]);

    // Semantic distractors first
    const semantic = this._semanticDistractors(D, targetIdx, n, introChs);

    if (semantic.length >= n) return semantic.slice(0, n);

    // Fallback: scored pool
    const semSet = new Set(semantic);
    semSet.add(correctDef);
    const pool = D.map((_, i) => i).filter(i => {
      if (i === targetIdx || !(S.cards[i] && S.cards[i].seen)) return false;
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

  // P_algo: the model's posterior that the user retrieves this card-axis correctly
  // right now. A stage prior (rising recognition with consolidation), blended toward
  // empirical recent accuracy as evidence accrues, then decayed by overdue-ness
  // (forgetting pulls retrievability toward a recognition guess floor). This is the
  // "house line" the wager will eventually be posted from, and the signal frontier-
  // seeking selection ranks on. Range clamped to (0.02, 0.98).
  _pCorrect(ci, axis, modality) {
    if (!ci || !ci.exp) return 0.5;
    const stage = this._getAxisStage(ci, axis);
    const STAGE_PRIOR = [0.50, 0.66, 0.78, 0.87, 0.92, 0.95];
    let p = STAGE_PRIOR[Math.min(stage, STAGE_PRIOR.length - 1)];
    const hist = (ci.axisHistory && ci.axisHistory[axis]) || [];
    if (hist.length >= 2) {
      const acc = hist.reduce((s, b) => s + (b ? 1 : 0), 0) / hist.length;
      const w = Math.min(0.7, hist.length / 10);   // trust empirical more as n grows (cap 0.7)
      p = (1 - w) * p + w * acc;
    }
    const seen = (typeof S !== 'undefined' ? S.totalSeen : 0) || 0;
    const dueRaw = (ci.axisDue && ci.axisDue[axis]) || 0;
    const due = dueRaw > 1e9 ? 0 : dueRaw;
    const reps = (ci.axisReps && ci.axisReps[axis]) || 0;
    const stabArr = (typeof AXIS_STABILITY !== 'undefined' && AXIS_STABILITY[axis]) || [10];
    const stab = stabArr[Math.min(reps, stabArr.length - 1)] || 10;
    if (seen > due && stab > 0) {
      const r = Math.pow(2, -(seen - due) / stab);   // retrievability ∈ (0,1], one full interval overdue → 0.5
      const FLOOR = 0.30;                             // recognition floor (you can still guess)
      p = FLOOR + (p - FLOOR) * r;
    }
    // Modality difficulty (formal model): a harder ask lowers the expected P toward
    // the guess floor, so the posted wager line drops and the correct call earns a
    // bigger edge. Omitted modality → competence-only (selection/frontier use this).
    if (modality && typeof modalityDiff === 'function') {
      const d = modalityDiff(modality);
      if (d > 0) { const FLOOR = 0.25; p = FLOOR + (p - FLOOR) * (1 - d); }
    }
    return Math.max(0.02, Math.min(0.98, p));
  },

  // Shannon entropy (bits) of a Bernoulli(p) — information value of testing this card.
  // Peaks at p=0.5, → 0 at the extremes. The quantity frontier-seeking maximizes.
  _entropy(p) {
    if (p <= 0 || p >= 1) return 0;
    return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
  },

  _isAxisDue(ci, axis) {
    if (!ci || !ci.axisDue) return true;
    const v = ci.axisDue[axis] || 0;
    if (v > 1e9) return true; // migration: old ms timestamp → immediately due
    const seen = (typeof S !== 'undefined' ? S.totalSeen : 0) || 0;
    return v <= seen;
  },

  _isCardDue(ci) {
    return this._isAxisDue(ci, 'meaning') || this._isAxisDue(ci, 'pos');
  },

  _mostOverdueAxis(ci) {
    const seen = (typeof S !== 'undefined' ? S.totalSeen : 0) || 0;
    const mDue = ci.axisDue && ci.axisDue.meaning ? (ci.axisDue.meaning > 1e9 ? 0 : ci.axisDue.meaning) : 0;
    const pDue = ci.axisDue && ci.axisDue.pos ? (ci.axisDue.pos > 1e9 ? 0 : ci.axisDue.pos) : 0;
    return (seen - mDue) >= (seen - pDue) ? 'meaning' : 'pos';
  },

  _isGraduated(ci) {
    if (!ci || !ci.exp) return false;
    if (ci.axisReps && (ci.axisReps.meaning || 0) >= 1) return true;
    if ((ci.reps || 0) + (ci.lapses || 0) > 0) return true;
    return false;
  },

  // Effective graduation — the single READ seam the cutover flips. Cold verdict
  // when coldDrivesSelection() is on, else the live verdict (unchanged default).
  _isGraduatedEff(S, i) {
    if (typeof coldDrivesSelection === 'function' && coldDrivesSelection())
      return (typeof coldGraduated === 'function') ? coldGraduated(i) : this._isGraduated(S.cards[i]);
    return this._isGraduated(S.cards[i]);
  },

  _isUnlocked(S, i) {
    return !!(S.cards[i] && S.cards[i].exp > 0);
  },

  // Adaptive C (§8-bis): flex the working-set cap by recent accuracy. High
  // recent accuracy → admit more parallel new atoms; struggling → fewer. The
  // pace tracks the learner instead of a fixed constant. Throughput is still
  // consolidation-rep-bound; this matches working-set SIZE to performance.
  _effectiveCap(sessionState) {
    if (!ACQ_ADAPT) return ACQUISITION_CAP;
    const ring = (sessionState && sessionState.sessionAnswerRing) || [];
    if (ring.length < ACQ_ADAPT_MIN) return ACQUISITION_CAP;
    const acc = ring.reduce((s, b) => s + (b ? 1 : 0), 0) / ring.length;
    const adj = acc >= 0.90 ?  2 :
                acc >= 0.75 ?  1 :
                acc >= 0.60 ?  0 :
                acc >= 0.45 ? -1 : -2;
    return Math.max(ACQ_CAP_MIN, Math.min(ACQ_CAP_MAX, ACQUISITION_CAP + adj));
  },

  _shouldIntroduce(S, D, sessionState) {
    if (sessionState && sessionState.studyModalityFilter) return false;
    // Working set = atoms still being ACQUIRED (§8-bis): introduced but meaning-stage
    // below ACQUIRED_STAGE. This is STAGE-based, not the old 1-answer graduation bar —
    // a word answered once is still stage 0-1 and still occupies working memory, so it
    // must count as load. (The old brandNew/inRotation pair both keyed on the 1-answer
    // bar, so they measured "introduced-but-never-answered", not real acquisition load,
    // and were the same set — one binding cap.) Selection prioritizes this same set so
    // it consolidates fast (see _pickFromPools), so a truer measure doesn't just stall.
    const inAcquisition = D.filter((_, i) => {
      const ci = S.cards[i];
      if (!ci || !ci.exp) return false;
      return this._getAxisStage(ci, 'meaning') < ACQUIRED_STAGE;
    }).length;
    return inAcquisition < this._effectiveCap(sessionState);
  },

  _nextWordToIntroduce(S, D) {
    // User-added words take immediate priority over the core spine.
    if (S.userWordQueue && S.userWordQueue.length) {
      for (let j = 0; j < S.userWordQueue.length; j++) {
        const wi = S.userWordQueue[j];
        if (D[wi] && !this._isUnlocked(S, wi)) return wi;
      }
    }
    // Generativity bias: within a bounded rank window, prefer the un-introduced
    // atom that unlocks the most comprehensible sentences (crosses milestones,
    // escapes the scaffold valley). Falls back to pure rank when nothing unlocks.
    if (typeof introUnlockBias === 'function') {
      const biased = introUnlockBias(S, D);
      if (biased >= 0) return biased;
    }
    for (let i = 0; i < D.length; i++) {
      if (!this._isUnlocked(S, i)) return i;
    }
    return -1;
  },

  _dueVocab(S, D) {
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
    const seen = S.totalSeen || 0;
    const drills = [];
    GRAMMAR_CATS.forEach(cat => {
      GRAMMAR_AXES.forEach(axis => {
        const ax = S.grammar[cat] && S.grammar[cat][axis];
        if (!ax) return;
        const v = ax.due || 0;
        const effectiveDue = v > 1e9 ? 0 : v; // migration guard
        if (effectiveDue > seen) return;
        if (sessionGrammarAnswered && sessionGrammarAnswered.has(cat + ':' + axis)) return;
        if (!this._grammarAxisUnlocked(S, D, cat, axis)) return;
        drills.push({ cat, axis, overdue: seen - effectiveDue });
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

  _pickFromPools(grammarDrills, vocabDue, vocabSeen, S, D, recent) {
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

    // Fair rotation by LEAST-RECENTLY-SHOWN, tracked PER CARD via _lastSeenAt (a
    // monotonic stamp set from S.totalSeen in showStudyCard). The old window-based
    // recency (lastIndexOf over a 10-deep ring) could NOT distinguish "shown long
    // ago" from "never shown" — both were -1 — so the tie broke by index and, with
    // 14 due cards but a window of 10, the low indices perpetually cycled while the
    // TAIL (11+) starved: never tested, never graduated, frontier frozen at the
    // brand-new cap. A persistent per-card stamp is window-independent: never-shown
    // (stamp 0) and oldest cards sort first. Grammar is disabled from this rotation.
    const lastSeen = idx => (S.cards[idx] && S.cards[idx]._lastSeenAt) || 0;
    // Prioritize atoms still in ACQUISITION (meaning-stage < ACQUIRED_STAGE) so they
    // consolidate fast and free the frontier; consolidated words fall back to the
    // least-recently-seen rotation. (Without this, a stage-based load measure just
    // throttles harder — the new words wait behind perpetually-due mastered ones.)
    const acqRank = idx => { const ci = S.cards[idx]; return (ci && ci.exp > 0 && this._getAxisStage(ci,'meaning') < ACQUIRED_STAGE) ? 0 : 1; };
    const isDue = idx => { const ci = S.cards[idx]; return !!(ci && this._isCardDue(ci)); };
    // Anti-repeat: never serve the immediately-previous card twice in a row when any
    // alternative exists. A card stays "due" right after it's answered (its other axis,
    // or it's alone in the top entropy tier), which otherwise re-serves it next card —
    // surfaced by the SIM "no immediate repeat" invariant.
    const prevIdx = (recent && recent.length) ? recent[recent.length - 1] : null;
    const noRepeat = arr => { if (prevIdx == null) return arr; const f = arr.filter(it => it.idx !== prevIdx); return f.length ? f : arr; };
    const vocabItems = items.filter(it => it.type === 'vocab');
    if (vocabItems.length) {
      // CRITICAL spacing gate: a just-introduced word is NOT due yet (its initial
      // axisDue interval hasn't elapsed). Not-due cards must never pre-empt the queue —
      // serving one as a test is "tested immediately after introduction". So DUE cards
      // are picked first (frontier-seek ordered); not-due cards are filler only when
      // nothing is due, ordered least-recently-seen — NOT by entropy, which would
      // re-surface the freshly-flashed card (it's stage-0, P≈0.5 = top entropy).
      const dueItems = noRepeat(vocabItems.filter(it => isDue(it.idx)));
      let pick;
      if (dueItems.length) {
        if (FRONTIER_SEEK) {
          // In-acquisition cards come first (graduation velocity + anti-starvation),
          // but the two sets want DIFFERENT objectives:
          //   • acquisition set (acqRank 0): the goal is to GRADUATE all of them, so
          //     use FAIR ROTATION (least-recently-seen). Entropy-seeking here is a
          //     deadlock: an overdue hard card decays to P≈0.3 → LOWER entropy than the
          //     fresh P≈0.5 cards → it's never reached → never graduates → jams the cap.
          //     (Observed live as a 2-card livelock on the highest-entropy stage-0 pair.)
          //   • review set (acqRank 1): entropy-seek the P≈0.5 learning edge.
          const tier = idx => { const ci = S.cards[idx]; return Math.round(this._entropy(this._pCorrect(ci, 'meaning')) / ENTROPY_BUCKET); };
          pick = dueItems.slice().sort((a, b) => {
            const ar = acqRank(a.idx) - acqRank(b.idx);
            if (ar) return ar;
            if (acqRank(a.idx) === 0) return lastSeen(a.idx) - lastSeen(b.idx);       // acquisition: fair rotation
            return (tier(b.idx) - tier(a.idx)) || (lastSeen(a.idx) - lastSeen(b.idx)); // review: entropy edge
          })[0];
        } else {
          pick = dueItems.slice().sort((a, b) => (acqRank(a.idx) - acqRank(b.idx)) || (lastSeen(a.idx) - lastSeen(b.idx)))[0];
        }
      } else {
        // Nothing due — filler. Least-recently-seen so a freshly-flashed word is the
        // LAST thing re-served, preserving its initial spacing interval.
        pick = noRepeat(vocabItems).slice().sort((a, b) => (lastSeen(a.idx) - lastSeen(b.idx)))[0];
      }
      return { type: 'vocab', idx: pick.idx };
    }

    if (!items.length) return null;
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
// State persistence & grammar dispatch
// ═══════════════════════════════════════════════════════════════
// The legacy global S (data.js) is the SINGLE source of truth — loaded/saved by
// load()/save() in data.js (.bak backup + migration). The old dispatch object kept a
// parallel hidden copy of S; that dual state drifted and was the root of the
// frontier-freeze class of bugs, and its dispatch API was dead except the grammar
// answer. Removed entirely. Grammar — its only live consumer, and the one writer with
// no engine-1 (recordAxisResultNew) equivalent — dispatches directly onto S below.
(function wireGrammarDispatch(){
  window.dispatchStudyAction = function(action, payload){
    if (action !== 'ANSWER_GRAMMAR') return;
    const { cat, axis, isCorrect, responseMs, currentMultIdx, defaultMultIdx } = payload;
    Scheduler.recordGrammarAnswer(S, cat, axis, isCorrect, responseMs, currentMultIdx, defaultMultIdx);
    if (isCorrect) S.xp += Math.round(10 * (MULT_STEPS[currentMultIdx || 0] || 1));
    save();
  };
  console.log('[Earworm] state = single global S; grammar dispatch wired.');
})();

// ── Waveform Visualizer ──────────────────────────────────────────────────────
// Each language family gets a visualization for its most perceptually opaque
// feature for an English speaker.
//
// Mandarin (tonal family): schematic pitch contour drawn from tone numbers in
// syls[]. Platonic/canonical shapes — not extracted from audio — so the learner
// sees the ideal tone, not a contextually reduced realization. The visual pairs
// with TTS on every card and trains the pitch channel that beginners filter out.
//
// Arabic / non-tonal: ambient heartbeat bars during playback (decorative
// placeholder until phoneme data exists for pharyngeal/emphatic encoding).
//
// Real-time Web Audio waveform deferred; see ROADMAP §WaveViz.
(function(){
  // SHELVED. The canonical tone contour is isomorphic to the pinyin tone
  // diacritic — same information, redrawn — so it carries no signal a learner
  // who reads the diacritic doesn't already have. The feature only earns its
  // place with real F0 extracted offline from a real audio database (sandhi,
  // coarticulation, actual pitch range — the facets a beginner cannot hear).
  // Disabled until that audio database exists. See ROADMAP §WaveViz.
  // To re-enable: flip ENABLED and restore the #waveform/#waveformMC CSS display.
  var ENABLED=false;

  var _raf=null;
  var _setupRaf=null;
  var _mode=null;
  var _restingFn=null; // function that draws the at-rest state for the current card

  function els(){ return ['waveform','waveformMC'].map(function(id){ return document.getElementById(id); }).filter(Boolean); }

  function fg(){
    try{ return getComputedStyle(document.documentElement).getPropertyValue('--fg').trim()||'#0d2e1f'; }
    catch(e){ return '#0d2e1f'; }
  }

  function drawDims(c){
    var dpr=window.devicePixelRatio||1;
    var w=c.offsetWidth, h=c.offsetHeight;
    if(w<2||h<2) return null;
    if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){
      c.width=Math.round(w*dpr);
      c.height=Math.round(h*dpr);
    }
    return {w:w,h:h,dpr:dpr};
  }

  // Canonical pitch contour control points per Mandarin tone.
  // t = time within syllable (0–1), p = pitch height (0=low, 1=high).
  function tonePoints(tone){
    switch(tone){
      case 1: return [{t:0.05,p:0.84},{t:0.95,p:0.84}];                      // high flat
      case 2: return [{t:0.05,p:0.28},{t:0.95,p:0.84}];                      // rising
      case 3: return [{t:0.05,p:0.68},{t:0.45,p:0.10},{t:0.95,p:0.50}];     // dip-rise
      case 4: return [{t:0.05,p:0.84},{t:0.95,p:0.08}];                      // falling
      default: return [{t:0.10,p:0.22},{t:0.90,p:0.22}];                     // neutral
    }
  }

  function drawContour(syls){
    var canvases=els(); if(!canvases.length) return false;
    var drew=false;
    var n=syls.length;
    var interGap=n>1?8:0;
    var color=fg();
    canvases.forEach(function(c){
      var d=drawDims(c); if(!d) return;
      var ctx=c.getContext('2d'); if(!ctx) return;
      var segW=(d.w-(n-1)*interGap)/n;
      var vPad=d.h*0.13;
      var drawH=d.h-2*vPad;
      ctx.setTransform(d.dpr,0,0,d.dpr,0,0);
      ctx.clearRect(0,0,d.w,d.h);
      ctx.strokeStyle=color;
      ctx.lineWidth=2.2;
      ctx.lineCap='round';
      ctx.lineJoin='round';
      ctx.globalAlpha=0.72;
      for(var i=0;i<n;i++){
        var tone=syls[i][1];
        var pts=tonePoints(tone);
        var xOff=i*(segW+interGap);
        ctx.beginPath();
        if(pts.length===2){
          var x0=xOff+pts[0].t*segW, y0=vPad+(1-pts[0].p)*drawH;
          var x1=xOff+pts[1].t*segW, y1=vPad+(1-pts[1].p)*drawH;
          var dx=x1-x0;
          ctx.moveTo(x0,y0);
          ctx.bezierCurveTo(x0+dx*0.35,y0, x1-dx*0.35,y1, x1,y1);
        } else {
          // Tone 3: two cubic segments through the dip point
          var xa=xOff+pts[0].t*segW, ya=vPad+(1-pts[0].p)*drawH;
          var xb=xOff+pts[1].t*segW, yb=vPad+(1-pts[1].p)*drawH;
          var xc=xOff+pts[2].t*segW, yc=vPad+(1-pts[2].p)*drawH;
          ctx.moveTo(xa,ya);
          ctx.bezierCurveTo(xa+(xb-xa)*0.35,ya, xb-(xb-xa)*0.12,yb, xb,yb);
          ctx.bezierCurveTo(xb+(xc-xb)*0.12,yb, xc-(xc-xb)*0.35,yc, xc,yc);
        }
        ctx.stroke();
      }
      ctx.globalAlpha=1;
      drew=true;
    });
    return drew;
  }

  function drawFlatLine(){
    var canvases=els(); if(!canvases.length) return false;
    var drew=false;
    var color=fg();
    canvases.forEach(function(c){
      var d=drawDims(c); if(!d) return;
      var ctx=c.getContext('2d'); if(!ctx) return;
      ctx.setTransform(d.dpr,0,0,d.dpr,0,0);
      ctx.clearRect(0,0,d.w,d.h);
      ctx.fillStyle=color;
      ctx.globalAlpha=0.20;
      ctx.fillRect(0,Math.floor(d.h/2)-1,d.w,2);
      ctx.globalAlpha=1;
      drew=true;
    });
    return drew;
  }

  // Called from showStudyFlash when a card is shown.
  // Sets the at-rest visual for this card; draws immediately (with rAF fallback
  // if the canvas hasn't been laid out yet after show()).
  function setWord(syls,hasTone){
    if(!ENABLED) return;
    if(_raf){ cancelAnimationFrame(_raf); _raf=null; }
    if(_setupRaf){ cancelAnimationFrame(_setupRaf); _setupRaf=null; }
    _mode=null;
    _restingFn=(hasTone&&syls&&syls.length)?function(){ return drawContour(syls); }:drawFlatLine;
    var drew=_restingFn();
    if(!drew) _setupRaf=requestAnimationFrame(function(){ _setupRaf=null; if(_restingFn) _restingFn(); });
  }

  // Restores the at-rest visual (tone contour or flat line). Called after audio
  // ends and on goHome(). Does not reset _restingFn — next setWord() does that.
  function clear(){
    if(!ENABLED) return;
    if(_raf){ cancelAnimationFrame(_raf); _raf=null; }
    _mode=null;
    if(_restingFn) _restingFn(); else drawFlatLine();
  }

  // Ambient heartbeat for non-tonal languages during TTS playback.
  function startHeartbeat(){
    if(!ENABLED) return;
    if(_raf){ cancelAnimationFrame(_raf); _raf=null; }
    _mode='heart';
    var BARS=24, GAP=2;
    var color=fg();
    var t0=performance.now();
    function draw(now){
      if(_mode!=='heart') return;
      var canvases=els();
      if(!canvases.length){ _raf=requestAnimationFrame(draw); return; }
      var t=(now-t0)/1000;
      var anyDrawn=false;
      canvases.forEach(function(c){
        var d=drawDims(c); if(!d) return;
        var ctx=c.getContext('2d'); if(!ctx) return;
        var barW=Math.max(2,Math.floor((d.w-(BARS-1)*GAP)/BARS));
        ctx.setTransform(d.dpr,0,0,d.dpr,0,0);
        ctx.clearRect(0,0,d.w,d.h);
        ctx.fillStyle=color;
        for(var i=0;i<BARS;i++){
          var phase=(i/BARS)*Math.PI*2;
          var a1=0.5+0.5*Math.sin(t*3.8+phase);
          var a2=0.5+0.5*Math.sin(t*5.1+phase*0.7);
          var amp=0.15+0.7*(a1*a2);
          var bh=Math.max(2,Math.round(amp*d.h));
          var x=i*(barW+GAP);
          var y=Math.round((d.h-bh)/2);
          ctx.globalAlpha=0.3+amp*0.65;
          ctx.fillRect(x,y,barW,bh);
        }
        ctx.globalAlpha=1;
        anyDrawn=true;
      });
      _raf=requestAnimationFrame(draw);
    }
    _raf=requestAnimationFrame(draw);
  }

  window.WaveViz={setWord:setWord,startHeartbeat:startHeartbeat,clear:clear};
})();
