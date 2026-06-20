
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
const GRAMMAR_SPEC_ZH = {
  reserved: ['是','在'],   // function words excluded from generic POS-class roles
  tiers: [
    { name:'T1 predication',     roles:[ {role:'referent',pos:'pronoun'}, {role:'lexical-verb',pos:'verb'}, {role:'copula',char:'是'}, {role:'nominal',pos:'noun'}, {role:'adjective',pos:'adjective'}, {role:'degree',char:'很'} ] },
    { name:'T2 transitive/neg/Q',roles:[ {role:'negator',char:'不'}, {role:'negator-perf',char:'没'}, {role:'Q-particle',char:'吗'} ] },
    { name:'T3 modify/quantify', roles:[ {role:'modifier',char:'的'}, {role:'numeral',pos:'numeral'}, {role:'classifier',char:'个'} ] },
    { name:'T4 adjunct/aspect',  roles:[ {role:'coverb',char:'在'}, {role:'aspect',char:'了'} ] },
    { name:'T5 complex',         roles:[ {role:'conjunction',pos:'conjunction'}, {role:'additive-adv',char:'也'} ] }
  ]
};
function computeGenerativeBasis(deck, spec){
  deck=deck||(typeof D!=='undefined'?D:[]); spec=spec||GRAMMAR_SPEC_ZH;
  const reserved=new Set(spec.reserved||[]);
  const charIdx=c=>deck.findIndex(d=>d[0]===c);
  const toks=i=>(deck[i][4]||'').split('/');
  const lowestPOS=tok=>{ for(let i=0;i<deck.length;i++){ if(toks(i).indexOf(tok)>=0 && !reserved.has(deck[i][0])) return i; } return -1; };
  const fill=r=> r.char!=null?charIdx(r.char):lowestPOS(r.pos);
  const cum=new Map(); const tiers=[];
  spec.tiers.forEach(t=>{
    t.roles.forEach(r=>{ const idx=fill(r); if(idx>=0){ const ch=deck[idx][0]; if(!cum.has(ch)) cum.set(ch,{role:r.role,idx:idx}); } });
    const atoms=[...cum.values()].sort((a,b)=>a.idx-b.idx);
    const m=atoms.length, deep=atoms.length?Math.max.apply(null,atoms.map(a=>a.idx)):0;
    const deferred=atoms.filter(a=>a.idx>=m);   // generatively required but beyond a same-size pure-Zipf deck
    tiers.push({ name:t.name, basisSize:m, deepestRank:deep, reachRatio:m?Math.round(deep/m*100)/100:0,
      deferredCount:deferred.length, deferred:deferred.map(a=>deck[a.idx][0]+'#'+a.idx) });
  });
  const basis=[...cum.values()].sort((a,b)=>a.idx-b.idx).map(a=>({ch:deck[a.idx][0], rank:a.idx, role:a.role}));
  return { tiers:tiers, basis:basis, basisSize:basis.length };
}
try{ window.computeGenerativeBasis=computeGenerativeBasis; window.GRAMMAR_SPEC_ZH=GRAMMAR_SPEC_ZH; }catch(e){}

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
