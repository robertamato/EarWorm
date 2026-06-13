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
