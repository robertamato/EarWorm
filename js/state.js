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
function hslToRgb(h,s,l){
  h=((h%360)+360)%360; s/=100; l/=100;
  const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2;
  let r=0,g=0,b=0;
  if(h<60){r=c;g=x;} else if(h<120){r=x;g=c;} else if(h<180){g=c;b=x;}
  else if(h<240){g=x;b=c;} else if(h<300){r=x;b=c;} else {r=c;b=x;}
  return [Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];
}
// Per-app-open POS palette: each category gets a golden-angle-spaced hue, randomly
// permuted + offset, frozen for the sitting. A page load re-executes this module and
// clears _posPalette, so it reshuffles only on close/reopen — STABLE within a sitting,
// unlike the per-atom session hue (which churns per study session). Color here = POS
// CATEGORY (~8 distinct clusters = legible structure); it is NOT the atom-identity
// channel, and the Sky is a dashboard, not a measurement surface, so the two don't
// collide. Reshuffle per open is what keeps a durable "amber=noun" crutch from forming.
let _posPalette=null;
function _buildPosPalette(){
  const GAp=137.508, off=Math.random()*360;
  const order=POS_SECTORS.slice();
  for(let i=order.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=order[i]; order[i]=order[j]; order[j]=t; }
  _posPalette={};
  order.forEach(function(s,k){ _posPalette[s]=hslToRgb(off+k*GAp,78,64); });
}
function posColor(s){ if(!_posPalette) _buildPosPalette(); return _posPalette[s]||[160,180,170]; }
function posRGB(s){ const c=posColor(s); return 'rgb('+c[0]+','+c[1]+','+c[2]+')'; }
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
// PMI-weighted co-occurrence (for THE TERRITORY lens). Raw co-occurrence collapses on hub
// words (的/我 appear everywhere); PMI = log( P(a,b) / P(a)P(b) ) divides that expectation
// out, so only SURPRISING pairings (semantic relatedness) keep weight. Returns [a,b,ppmi].
let _pmiCache=null,_pmiCacheD=null;
function constellationPMI(){
  if(_pmiCache&&_pmiCacheD===D) return _pmiCache;
  const sents=(typeof EXAMPLE_SENTENCES!=='undefined')?EXAMPLE_SENTENCES:{};
  const cnt={},co={}; let S=0;
  for(const key in sents){ (sents[key]||[]).forEach(function(s){
    const text=(s&&s[0])||'';
    const present=(typeof decomposeSentence==='function')?decomposeSentence(text):[];
    const seenA={},uniq=[]; for(let i=0;i<present.length;i++){ const a=present[i]; if(!seenA[a]){ seenA[a]=1; uniq.push(a); } }
    if(!uniq.length) return; S++;
    for(let i=0;i<uniq.length;i++){ cnt[uniq[i]]=(cnt[uniq[i]]||0)+1; for(let j=i+1;j<uniq.length;j++){ const x=uniq[i],y=uniq[j],k=x<y?x+'_'+y:y+'_'+x; co[k]=(co[k]||0)+1; } }
  }); }
  const out=[];
  if(S>0) Object.keys(co).forEach(function(k){ const c=co[k]; const p=k.split('_'),a=+p[0],b=+p[1];
    const pmi=Math.log((c*S)/((cnt[a]||1)*(cnt[b]||1))); if(pmi>0.25) out.push([a,b,pmi]); });
  _pmiCache=out;_pmiCacheD=D;return out;
}
// Label-propagation community detection over the top-3 sparse PMI graph (the dense full
// graph is one community). Each node adopts its neighbors' strongest-weighted label until
// stable → semantic communities ("neighborhoods") for THE TERRITORY island layout.
let _commCache=null,_commCacheD=null;
function constellationCommunities(){
  if(_commCache&&_commCacheD===D) return _commCache;
  const pm=(typeof constellationPMI==='function')?constellationPMI():[], N2=D.length;
  const byN={}; for(let e=0;e<pm.length;e++){ const a=pm[e][0],b=pm[e][1]; (byN[a]=byN[a]||[]).push(e); (byN[b]=byN[b]||[]).push(e); }
  const keep={}; Object.keys(byN).forEach(function(n){ const arr=byN[n].sort(function(x,y){return pm[y][2]-pm[x][2];}); for(let j=0;j<arr.length&&j<3;j++) keep[arr[j]]=1; });
  const adj=new Array(N2); for(let i=0;i<N2;i++) adj[i]=[];
  Object.keys(keep).forEach(function(i){ const e=pm[+i]; if(e[0]<N2&&e[1]<N2){ adj[e[0]].push([e[1],e[2]]); adj[e[1]].push([e[0],e[2]]); } });
  const label=new Int32Array(N2); for(let i=0;i<N2;i++) label[i]=i;
  const order=[]; for(let i=0;i<N2;i++) order.push(i);
  for(let it=0;it<30;it++){
    for(let i=order.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0,t=order[i]; order[i]=order[j]; order[j]=t; }
    let changed=0;
    for(let oi=0;oi<order.length;oi++){ const i=order[oi]; if(!adj[i].length) continue;
      const sc={}; for(let a=0;a<adj[i].length;a++){ const j=adj[i][a][0],w=adj[i][a][1]; sc[label[j]]=(sc[label[j]]||0)+w; }
      let best=label[i],bestS=-1; for(const l in sc){ if(sc[l]>bestS){ bestS=sc[l]; best=+l; } }
      if(best!==label[i]){ label[i]=best; changed++; }
    }
    if(!changed) break;
  }
  _commCache=label;_commCacheD=D;return label;
}
// Spectral embedding for THE TERRITORY: the top eigenvectors of the symmetric PPMI matrix ARE
// the classical distributional word-embedding (Levy & Goldberg 2014: SPPMI factorization ≈
// word2vec). Real embedding from local co-occurrence, not a force heuristic. Power iteration +
// deflation for the top 4; eigvec 0 is the dominant degree/frequency axis (skipped), so
// eigvecs 1-3 (weighted by √eigenvalue) become the x/y/z of the semantic manifold.
let _embedCache=null,_embedCacheD=null;
function constellationEmbed(){
  if(_embedCache&&_embedCacheD===D) return _embedCache;
  const pm=(typeof constellationPMI==='function')?constellationPMI():[], N2=D.length;
  const M=new Array(N2); for(let i=0;i<N2;i++) M[i]=new Float64Array(N2);
  for(let e=0;e<pm.length;e++){ const a=pm[e][0],b=pm[e][1],w=pm[e][2]; if(a<N2&&b<N2){ M[a][b]=w; M[b][a]=w; } }
  const K=4, vecs=[], vals=[], tmp=new Float64Array(N2);
  for(let kk=0;kk<K;kk++){
    let v=new Float64Array(N2); for(let i=0;i<N2;i++) v[i]=Math.sin((i+1)*(kk+1)*1.7)+0.001;
    for(let it=0;it<100;it++){
      for(let i=0;i<N2;i++){ let s=0; const Mi=M[i]; for(let j=0;j<N2;j++) s+=Mi[j]*v[j]; tmp[i]=s; }
      for(let p=0;p<vecs.length;p++){ let d=0; for(let i=0;i<N2;i++) d+=tmp[i]*vecs[p][i]; for(let i=0;i<N2;i++) tmp[i]-=d*vecs[p][i]; }
      let nrm=0; for(let i=0;i<N2;i++) nrm+=tmp[i]*tmp[i]; nrm=Math.sqrt(nrm)||1;
      for(let i=0;i<N2;i++) v[i]=tmp[i]/nrm;
    }
    let lam=0; for(let i=0;i<N2;i++){ let s=0; const Mi=M[i]; for(let j=0;j<N2;j++) s+=Mi[j]*v[j]; lam+=v[i]*s; }
    vecs.push(v.slice()); vals.push(lam);
  }
  const idx=[1,2,3], wt=idx.map(k=>Math.sqrt(Math.abs(vals[k]||0.001)));
  const out=[]; for(let i=0;i<N2;i++) out.push([ (vecs[idx[0]]||vecs[0])[i]*wt[0], (vecs[idx[1]]||vecs[0])[i]*wt[1], (vecs[idx[2]]||vecs[0])[i]*wt[2] ]);
  _embedCache=out; _embedCacheD=D; return out;
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
  cv.style.cssText='display:block;width:100%;height:54vh;max-height:620px;min-height:340px;cursor:grab;touch-action:none;';
  host.appendChild(cv);
  // Vertical scrims: the Sky bleeds full-bleed, so its top/bottom stars must FADE into the
  // dark field instead of being guillotined at the seam with the opaque Masthead / Verb.
  // pointer-events:none so drag/zoom pass straight through; appended before the legend +
  // hint (below) so those stay crisp on top of the fade.
  const _homeBg='#070b08';
  const scrimTop=document.createElement('div');
  scrimTop.style.cssText='position:absolute;left:0;right:0;top:0;height:50px;pointer-events:none;z-index:1;'+
    'background:linear-gradient(to bottom,rgba(7,11,8,0.9) 0%,rgba(7,11,8,0.32) 45%,rgba(7,11,8,0) 100%);';
  const scrimBot=document.createElement('div');
  scrimBot.style.cssText='position:absolute;left:0;right:0;bottom:0;height:64px;pointer-events:none;z-index:1;'+
    'background:linear-gradient(to top,'+_homeBg+' 0%,rgba(7,11,8,0.45) 38%,rgba(7,11,8,0) 100%);';
  host.appendChild(scrimTop); host.appendChild(scrimBot);
  const ctx=cv.getContext('2d');
  const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
  const Wc=Math.max(280,cv.clientWidth||host.clientWidth||window.innerWidth||360);
  const Hc=Math.max(280,cv.clientHeight||360);
  cv.width=Wc*dpr; cv.height=Hc*dpr; ctx.scale(dpr,dpr);
  const CX=Wc/2,CY=Hc/2,Rmax=Math.min(Wc,Hc)*0.58,Rmin=Rmax*0.18,FOC=Rmax*2.6,CAM=Rmax*2.6,EL=0.60;
  const POP=Math.min(Wc,Hc)*0.30; // pull-to-pop: finger travel (canvas px) past which the fruit BREAKS → opens the card
  // Camera elevation is PER-LENS (eased in draw, like positions). Flat-structure lenses
  // (sunflower/islands/DAG) tilt toward top-down → their (x,y) renders face-on AND the fiber
  // lift becomes pure screen depth (in/out). Cloud lenses keep the turntable tilt EL.
  let elCur=EL, elTarget=EL, camDist=CAM, camTarget=CAM, camDist0=CAM, _lastDownT=0;
  // look-at TARGET (eased): dolly flies toward this. Panned toward the cursor on zoom so you
  // steer to peripheral atoms, not just the center. Recenters when you back out.
  let tcx=0,tcy=0,tcz=0, ttx=0,tty=0,ttz=0, fovNow=1;
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
    // Z = the FIBER coordinate: the house-line RUNG (the fibration's graduation height — the
    // SAME quantity the atom card renders as a ladder). Lens-INVARIANT: only the ground plane
    // (x,y) changes per lens; elevation = how far up acquisition each atom has climbed.
    const rung=(typeof atomHouseLine==='function')?atomHouseLine(i).rung:(seen?st:-1);
    // Z = fiber depth, INVERTED: less-mastered floats SHALLOW (toward the viewer), mastered
    // sinks DEEP (back). A modest lean + a volumetric jitter that restores the cloud's screen
    // in/out body (the old large random jitter, lost in the first migration). Kept gentle so
    // the flat lenses (READING spiral, TERRITORY islands) read their (x,y) structure cleanly.
    const lean=(rung<0?0.18:(0.16-(rung/5)*0.30));
    const fz=(lean+(hash(i+1)-0.5)*0.22)*Rmax;
    const nx=r*Math.cos(a), ny=r*Math.sin(a);
    // ax/ay = anatomy ground; fz = fiber height (Z, lens-invariant); tx/ty/tz = lens target
    node[i]={i:i,pos:s,seen:seen,st:st,rung:rung,x:nx,y:ny,z:fz,ax:nx,ay:ny,az:fz,fz:fz,tx:nx,ty:ny,tz:fz,_sx:null,_sy:null};
  }
  // fibers between introduced atoms
  const fibers=constellationFibers(),edges=[];
  for(let f=0;f<fibers.length;f++){const a=fibers[f][0],b=fibers[f][1]; if(node[a].seen&&node[b].seen) edges.push([node[a],node[b],1]);}
  const frR=Rmin+(Rmax-Rmin)*Math.sqrt(Math.min(frontier(),N)/N);
  // ── LENS ENGINE: the same star field, re-projected. Each lens sets per-node targets
  // (tx,ty,tz); the draw loop eases toward them, so switching MORPHS the constellation.
  // It also swaps the edges + a dim() emphasis. New insight = a new lens, not a new screen.
  let _edges=edges, _dim=null, _lensId='anatomy', _lensColor=null;
  function _confusionPairs(){ const map={}; if(S.confusion){ Object.keys(S.confusion).forEach(a=>{ const ai=+a; Object.keys(S.confusion[ai]||{}).forEach(b=>{ const bi=+b; if(node[ai]&&node[bi]&&node[ai].seen&&node[bi].seen){ const n=(S.confusion[ai][bi]&&S.confusion[ai][bi].n)||0; if(n>0){ const key=ai<bi?ai+'_'+bi:bi+'_'+ai; map[key]=(map[key]||0)+n; } } }); }); } return Object.keys(map).map(k=>{ const p=k.split('_'); return [+p[0],+p[1],map[k]]; }); }
  const LENSES=[
    { id:'anatomy', name:'ANATOMY', flex:'your words, mapped by grammar',
      apply:function(){ node.forEach(o=>{ o.tx=o.ax; o.ty=o.ay; o.tz=o.fz; }); _edges=edges; _dim=null; } },
    { id:'web', name:'THE WEB', flex:'', pluckShare:0.66, pluckDamp:0.83,
      apply:function(){ const pairs=_confusionPairs(); const px=node.map(o=>o.ax), py=node.map(o=>o.ay), inv={};
        for(let q=0;q<pairs.length;q++){ inv[pairs[q][0]]=1; inv[pairs[q][1]]=1; }
        for(let it=0;it<45;it++){ for(let q=0;q<pairs.length;q++){ const a=pairs[q][0],b=pairs[q][1],mx=(px[a]+px[b])/2,my=(py[a]+py[b])/2,f=0.05; px[a]+=(mx-px[a])*f; py[a]+=(my-py[a])*f; px[b]+=(mx-px[b])*f; py[b]+=(my-py[b])*f; } }
        node.forEach((o,i)=>{ o.tx=px[i]; o.ty=py[i]; o.tz=o.fz; });
        _edges=pairs.map(p=>[node[p[0]],node[p[1]],p[2]]); _dim=function(o){ return inv[o.i]?1:0.25; };
        this.flex=pairs.length?(pairs.length+' blur'+(pairs.length>1?'s':'')+' — drawn together, decaying as you tell them apart'):'no blurs caught yet — keep playing'; } },
    { id:'engine', name:'THE ENGINE', flex:'', el:1.30, pluckShare:0.30, pluckDamp:0.72,
      apply:function(){ let gb; try{ gb=computeGenerativeBasis(); }catch(e){ gb=null; }
        const tierOf={}; let T=0,basisSize=0,deepest=0;
        if(gb){ T=gb.tiers.length; basisSize=gb.basisSize; gb.tiers.forEach((t,ti)=>{ t.atoms.forEach(a=>{ tierOf[a.rank]=ti; if(a.rank>deepest)deepest=a.rank; }); }); }
        const GAr=2.39996, tc={};
        node.forEach((o,i)=>{ if(tierOf[i]!=null){ const t=tierOf[i],k=(tc[t]=(tc[t]||0)); tc[t]++; const rr=Rmin+(Rmax-Rmin)*((t+1)/(T+1)),ang=k*GAr+t*0.7; o.tx=rr*Math.cos(ang); o.ty=rr*Math.sin(ang); o.tz=o.fz; } else { const ang=i*GAr,rr=Rmax*1.12; o.tx=rr*Math.cos(ang); o.ty=rr*Math.sin(ang); o.tz=o.fz; } });
        // Hasse covering edges: each basis atom → the atom it generatively rests on (THEORY §14)
        const covEdges=[]; if(gb&&gb.basis){ gb.basis.forEach(a=>{ if(a.covers>=0 && a.rank<N && a.covers<N) covEdges.push([node[a.rank], node[a.covers], 1]); }); }
        _edges=covEdges; _dim=function(o){ return tierOf[o.i]!=null?1:0.18; };
        const reach=basisSize?Math.round(deepest/basisSize*10)/10:0;
        this.flex=basisSize?(basisSize+'-atom basis → '+reach+'× reach · a generator, not a memorizer'):'basis forming…'; } },
    { id:'reading', name:'THE READING', flex:'', el:1.42,
      apply:function(){ const GAr=2.39996;
        node.forEach((o,i)=>{ const rr=Rmax*Math.sqrt((i+0.5)/N),ang=i*GAr; o.tx=rr*Math.cos(ang); o.ty=rr*Math.sin(ang); o.tz=o.fz; });
        _edges=[]; let ws=0,wa=0; for(let i=0;i<N;i++){ const w=1/(i+1); wa+=w; if(node[i].seen) ws+=w; }
        const pct=wa?Math.round(ws/wa*100):0; _dim=function(o){ return o.seen?1:0.18; };
        this.flex='you can read ~'+pct+'% of running text on sight'; } },
    { id:'edge', name:'THE EDGE', flex:'',
      apply:function(){ const fset={}; node.forEach((o,i)=>{ if(o.seen && o.st<3) fset[i]=1; });
        node.forEach((o,i)=>{ o.tx=o.ax; o.ty=o.ay; o.tz=o.fz; });
        _edges=[]; _dim=function(o){ return fset[o.i]?1:0.16; };
        const n=Object.keys(fset).length; this.flex=n?('your working edge — '+n+' word'+(n>1?'s':'')+' still landing'):'all caught up — explore for more'; } },
    { id:'territory', name:'THE TERRITORY', flex:'', pluckShare:0.72, pluckDamp:0.84,
      // The crown jewel as an honest DENSE FIELD: a true 3-D force-directed embedding of the
      // PMI semantic graph. Depth here carries STRUCTURE, not mastery (mastery rides on
      // size/brightness) — all three spatial axes embed the meaning, and you ORBIT it. Tilted
      // (default EL) so dragging rotates the manifold. Colored by community so the 3-D
      // neighborhoods read even through the web. The honest "how an LLM sees it" render.
      apply:function(){ const pm=(typeof constellationPMI==='function')?constellationPMI():[];
        const lab=(typeof constellationCommunities==='function')?constellationCommunities():null;
        const emb=(typeof constellationEmbed==='function')?constellationEmbed():null;
        if(!pm.length||!lab||!emb){ node.forEach(o=>{o.tx=o.ax;o.ty=o.ay;o.tz=o.fz;}); _edges=[]; _dim=null; _lensColor=null; this.flex='neighborhoods forming — keep playing'; return; }
        // top-3 sparse edges (cleaner attraction) + their weights
        const byN={}; for(let e=0;e<pm.length;e++){ const a=pm[e][0],b=pm[e][1]; (byN[a]=byN[a]||[]).push(e); (byN[b]=byN[b]||[]).push(e); }
        const keep={}; Object.keys(byN).forEach(function(n){ const arr=byN[n].sort(function(x,y){return pm[y][2]-pm[x][2];}); for(let j=0;j<arr.length&&j<3;j++) keep[arr[j]]=1; });
        const E=Object.keys(keep).map(function(i){ return pm[+i]; });
        let maxw=0.01; for(let e=0;e<E.length;e++) if(E[e][2]>maxw) maxw=E[e][2];
        // spectral embedding → centered + uniformly scaled positions (depth = a real semantic axis)
        let cx=0,cy=0,cz=0; for(let i=0;i<N;i++){ cx+=emb[i][0]; cy+=emb[i][1]; cz+=emb[i][2]; } cx/=N;cy/=N;cz/=N;
        const p3=[], radii=[]; for(let i=0;i<N;i++){ const x=emb[i][0]-cx,y=emb[i][1]-cy,z=emb[i][2]-cz; p3.push([x,y,z]); if(node[i].seen) radii.push(Math.sqrt(x*x+y*y+z*z)); }
        radii.sort(function(a,b){return a-b;}); const pr=(radii.length?radii[Math.floor(radii.length*0.9)]:1)||1, sc=(Rmax*0.86)/pr;
        node.forEach((o,i)=>{ o.tx=p3[i][0]*sc; o.ty=p3[i][1]*sc; o.tz=p3[i][2]*sc; });
        _edges=E.filter(e=>e[0]<N&&e[1]<N&&node[e[0]].seen&&node[e[1]].seen).map(e=>[node[e[0]],node[e[1]],e[2]]); _dim=null;
        // color by COMMUNITY (golden-angle per neighborhood) so the 3-D clusters read
        const groups={}; for(let i=0;i<N;i++){ (groups[lab[i]]=groups[lab[i]]||[]).push(i); }
        const realL=Object.keys(groups).filter(l=>groups[l].length>=3).sort((a,b)=>groups[b].length-groups[a].length);
        const cHue={}; realL.forEach((l,ci)=>{ cHue[l]=(ci*137.508)%360; });
        _lensColor=function(o){ const l=lab[o.i]; return (cHue[l]!=null)?hslToRgb(cHue[l],68,60):[120,130,128]; };
        this.flex=realL.length+' neighborhoods — orbit your semantic space'; } }
  ];
  let lensIdx=0, currentLens=LENSES[0];
  let yaw=0,zoom=1,dragging=false,lastX=0,lastY=0,moved=0,tapFx=null,yawVel=0,pitchVel=0;
  // PLUCK → tug a star like fruit on an elastic branch; pull past POP and it BREAKS → opens the
  // card (replaces press-and-hold; tension, not a timer). tap stays pure TTS. project_fibroid.
  let holdStar=null,holdFired=false;
  let pluck=null,pluckFired=false,pluckGX=0,pluckGY=0,pluckSC=0.5,_springLive=false;
  const pts=new Map(); let pinchD0=0,zoom0=1;
  const CJK="'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
  function proj(o){
    // disc lies on the ground plane (o.x,o.y); o.z is vertical lift.
    // Turntable: spin about the vertical axis (yaw), then view from a
    // fixed elevation. Yaw axis ⟂ disc → constant ellipse, no sliver.
    const gx=(o.x+(o.dx||0))-tcx,gz=(o.y+(o.dy||0))-tcy,gy=(o.z+(o.dz||0))-tcz;  // pos + pluck displacement, relative to the (pannable) look-at target
    const cf=Math.cos(yaw),sf=Math.sin(yaw);
    const x1=gx*cf+gz*sf, z1=-gx*sf+gz*cf;
    const ca=Math.cos(elCur),sa=Math.sin(elCur);
    const y2=gy*ca+z1*sa, z2=-gy*sa+z1*ca;
    const denom=FOC+camDist+z2*fovNow, sc=FOC/denom; // fovNow amplifies depth divergence inside → wider FOV, center scale unchanged
    return {sx:CX+x1*sc,sy:CY-y2*sc,sc:sc,depth:z2,vis:denom>FOC*0.08}; // vis=false → behind/at camera → cull
  }
  function draw(){
    const now=performance.now();
    ctx.clearRect(0,0,Wc,Hc);
    // morph: ease every node toward its current lens target — a lens switch animates here
    // camera inertia: yaw + pitch coast on release and ease to a stop (pitch stays clamped/anchored)
    if(!dragging){ yaw+=yawVel; elTarget=Math.max(0.12,Math.min(1.52,elTarget+pitchVel)); }
    yawVel*=0.9; pitchVel*=0.9; if(Math.abs(yawVel)<1e-4)yawVel=0; if(Math.abs(pitchVel)<1e-5)pitchVel=0;
    elCur+=(elTarget-elCur)*0.14; // tilt the camera toward the active lens's elevation
    camDist+=(camTarget-camDist)*0.16; // dolly toward/through the cloud — zoom flies you in
    tcx+=(ttx-tcx)*0.16; tcy+=(tty-tcy)*0.16; tcz+=(ttz-tcz)*0.16; // ease the look-at target
    if(camTarget>CAM*0.7){ ttx*=0.94; tty*=0.94; ttz*=0.94; } // recenter as you back out to orbit (key off the TARGET, not the transient camDist — else a fly-to-star's dolly-in decays its own look-at while camDist is still high)
    const _fovT=1+0.8*(1-Math.max(0,Math.min(1, camDist/(CAM*0.55)))); // inside → 1.8 (wide), outside → 1.0 (clean)
    fovNow+=(_fovT-fovNow)*0.12;
    const _zoomNow=FOC/Math.max(0.08*FOC, FOC+camDist); // closeness proxy
    for(let q=0;q<node.length;q++){ const o=node[q]; o.x+=(o.tx-o.x)*0.14; o.y+=(o.ty-o.y)*0.14; o.z+=(o.tz-o.z)*0.14; }
    // PLUCK spring: each displaced atom (the grabbed fruit + the web it tugged) eases back toward
    // its rest via an underdamped spring → recoils with a BOING. Held atom keeps tdx==dx so it sits
    // under the finger; on release all targets are zeroed and the whole web snaps home. project_fibroid.
    if(_springLive){ let live=false; const SK=0.28, SD=(currentLens&&currentLens.pluckDamp!=null)?currentLens.pluckDamp:0.80; // per-lens recoil: fields bounce (higher), the DAG figure snaps back crisp (lower)
      for(let q=0;q<node.length;q++){ const o=node[q];
        if(o.dx||o.dy||o.dz||o.vx||o.vy||o.vz||o.tdx||o.tdy||o.tdz){
          o.vx=((o.vx||0)+(((o.tdx||0)-(o.dx||0))*SK))*SD; o.dx=(o.dx||0)+o.vx;
          o.vy=((o.vy||0)+(((o.tdy||0)-(o.dy||0))*SK))*SD; o.dy=(o.dy||0)+o.vy;
          o.vz=((o.vz||0)+(((o.tdz||0)-(o.dz||0))*SK))*SD; o.dz=(o.dz||0)+o.vz;
          if(Math.abs(o.dx)<0.02&&Math.abs(o.dy)<0.02&&Math.abs(o.dz)<0.02&&Math.abs(o.vx)<0.02&&Math.abs(o.vy)<0.02&&Math.abs(o.vz)<0.02&&!(o.tdx||o.tdy||o.tdz)){ o.dx=o.dy=o.dz=o.vx=o.vy=o.vz=0; }
          else live=true;
        }
      }
      if(!pluck && !live) _springLive=false;
    }
    if(_lensId==='anatomy' && _zoomNow<3){
      ctx.strokeStyle='rgba(77,255,160,0.22)'; ctx.setLineDash([2,7]); ctx.lineWidth=1; ctx.beginPath();
      for(let t=0;t<=64;t++){const aa=t/64*2*Math.PI,p=proj({x:frR*Math.cos(aa),y:frR*Math.sin(aa),z:0}); if(t===0)ctx.moveTo(p.sx,p.sy); else ctx.lineTo(p.sx,p.sy);} ctx.stroke(); ctx.setLineDash([]);
    }
    const ps=node.map(o=>{const p=proj(o); p.o=o; o._sx=null; return p;}).sort((a,b)=>b.depth-a.depth);
    let _minD=1e9,_maxD=-1e9; for(let q=0;q<ps.length;q++){ const d=ps[q].depth; if(d<_minD)_minD=d; if(d>_maxD)_maxD=d; } const _dR=(_maxD-_minD)||1;
    const _fog=function(dep){ return 1-0.55*((dep-_minD)/_dR); }; // depth cueing: near=bright, far recedes → 3-D reads (auto no-op when the layout is flat)
    const _webE=(_lensId==='web'), _engE=(_lensId==='engine'), _terE=(_lensId==='territory');
    for(let e=0;e<_edges.length;e++){const na=_edges[e][0],nb=_edges[e][1],a=proj(na),b=proj(nb); if(!a.vis||!b.vis)continue; ctx.globalAlpha=_fog((a.depth+b.depth)*0.5);
      if(_terE&&_lensColor){ const c0=_lensColor(na),c1=_lensColor(nb),same=(c0[0]===c1[0]&&c0[1]===c1[1]&&c0[2]===c1[2]); ctx.strokeStyle=same?'rgba('+c0[0]+','+c0[1]+','+c0[2]+',0.55)':'rgba(150,160,158,0.12)'; ctx.lineWidth=same?1:0.6; }
      else { ctx.strokeStyle=_webE?'rgba(255,255,255,0.30)':(_engE?'rgba(125,255,192,0.45)':'rgba(125,255,192,0.15)'); ctx.lineWidth=(_webE||_engE)?1:0.7; }
      ctx.beginPath(); ctx.moveTo(a.sx,a.sy); ctx.lineTo(b.sx,b.sy); ctx.stroke();} ctx.globalAlpha=1;
    const labels=[];
    for(let q=0;q<ps.length;q++){
      const p=ps[q]; if(!p.vis) continue; const o=p.o,c=(_lensColor?_lensColor(o):posColor(o.pos)),dm=(_dim?_dim(o):1)*_fog(p.depth);
      if(!o.seen){ ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+',0.12)'; ctx.beginPath(); ctx.arc(p.sx,p.sy,1.5*p.sc,0,7); ctx.fill(); continue; }
      const halo=(o.st>=3?13:o.st>=2?10:8)*p.sc, ha=(o.st>=3?0.34:o.st>=2?0.22:0.15)*dm;
      const g=ctx.createRadialGradient(p.sx,p.sy,0,p.sx,p.sy,halo);
      g.addColorStop(0,'rgba('+c[0]+','+c[1]+','+c[2]+','+ha+')'); g.addColorStop(1,'rgba('+c[0]+','+c[1]+','+c[2]+',0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.sx,p.sy,halo,0,7); ctx.fill();
      const core=(o.st>=3?4:o.st>=2?3.2:2.6)*p.sc;
      ctx.globalAlpha=dm;
      ctx.fillStyle=o.st>=3?'#ffffff':'rgb('+c[0]+','+c[1]+','+c[2]+')';
      ctx.beginPath(); ctx.arc(p.sx,p.sy,core,0,7); ctx.fill();
      if(o.st>=3){ ctx.strokeStyle='rgb('+c[0]+','+c[1]+','+c[2]+')'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(p.sx,p.sy,core+2,0,7); ctx.stroke(); }
      ctx.globalAlpha=1;
      o._sx=p.sx; o._sy=p.sy;
      // detail-on-demand: once zoomed in, on-screen seen stars earn a label
      if(_zoomNow>=1.5 && p.sx>-30&&p.sx<Wc+30&&p.sy>-30&&p.sy<Hc+50) labels.push({p:p,o:o,c:c,core:core});
    }
    // label pass on top: TARGET GLYPH ONLY. No parent-language gloss — the Sky is a stress-free
    // recognition playground (tap = hear it · hold = open the dex entry for the meaning). The L1
    // crutch lives in the dictionary card, never on the star.
    for(let l=0;l<labels.length;l++){
      const L=labels[l],p=L.p,o=L.o,c=L.c, gs=Math.max(12,Math.min(40,8+L.core*1.6));
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.font='600 '+gs+'px '+CJK;
      ctx.fillStyle='rgba(255,255,255,0.94)';
      ctx.fillText(D[o.i][0], p.sx, p.sy+L.core+3);
    }
    if(tapFx){
      const dt=now-tapFx.t0;
      if(dt>520) tapFx=null;
      else{ const o=node[tapFx.i]; if(o&&o._sx!=null){ const k=dt/520, a=1-k, c=(_lensColor?_lensColor(o):posColor(o.pos));
        // one-shot WEB FLASH: a tap lights the word's connections for a beat (the GLANCE; the pluck is
        // the sustained version) — makes the only free Sky feedback feel alive + teaches the web exists.
        if(tapFx.nbrs){ for(let n=0;n<tapFx.nbrs.length;n++){ const nb=tapFx.nbrs[n][0]; if(nb._sx==null)continue;
          ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+(0.55*a)+')'; ctx.lineWidth=0.4+1.1*a;
          ctx.beginPath(); ctx.moveTo(o._sx,o._sy); ctx.lineTo(nb._sx,nb._sy); ctx.stroke();
          ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+(0.4*a)+')'; ctx.beginPath(); ctx.arc(nb._sx,nb._sy,1.2+3*a,0,7); ctx.fill(); } }
        // focus bloom (in the star's color, synesthetic w/ the card flood) + the original expanding ring
        const br=18*(0.5+k), g=ctx.createRadialGradient(o._sx,o._sy,0,o._sx,o._sy,br);
        g.addColorStop(0,'rgba('+c[0]+','+c[1]+','+c[2]+','+(0.45*a)+')'); g.addColorStop(1,'rgba('+c[0]+','+c[1]+','+c[2]+',0)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(o._sx,o._sy,br,0,7); ctx.fill();
        ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+(0.7*a)+')'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(o._sx,o._sy,5+k*28,0,7); ctx.stroke();
      } }
    }
    // PLUCK tension overlay — the strained threads to the tugged neighbors brighten/thicken with
    // tension × bond-weight (you SEE the strong bonds resist), and a ring on the fruit fills with
    // pull, reddening toward the break point. Replaces the old time-based charge ring.
    if(pluck && holdStar && holdStar._sx!=null){
      const t=Math.min(1,(pluck.pull||0)/POP);
      for(let k=0;k<pluck.neighbors.length;k++){ const nb=pluck.neighbors[k][0],w=pluck.neighbors[k][1]; if(nb._sx==null)continue; const wf=w/pluck.maxW;
        ctx.strokeStyle='rgba(255,255,255,'+(0.16+0.6*t*wf)+')'; ctx.lineWidth=0.8+1.8*t*wf;
        ctx.beginPath(); ctx.moveTo(holdStar._sx,holdStar._sy); ctx.lineTo(nb._sx,nb._sy); ctx.stroke(); }
      ctx.strokeStyle='rgba(255,'+(255-Math.floor(150*t))+','+(255-Math.floor(180*t))+','+(0.5+0.45*t)+')'; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(holdStar._sx,holdStar._sy,16,-Math.PI/2,-Math.PI/2+t*6.2832); ctx.stroke();
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
  function starAtPx(mx,my){ let best=null,bd=1e9; for(let i=0;i<N;i++){const o=node[i]; if(!o.seen||o._sx==null)continue; const d=(o._sx-mx)*(o._sx-mx)+(o._sy-my)*(o._sy-my); if(d<bd){bd=d;best=o;}} return (best&&bd<420)?best:null; }
  function handleTap(e){
    const best=starAtPx(px(e),py(e));
    if(best){ if(S.sound!=='mute') speak(D[best.i][0],activeCourse().langCode); const nb=neighborsOf(best); tapFx={i:best.i,t0:performance.now(),nbrs:nb.list}; }
  }
  // spring every displaced atom back to rest (target=0) with a bounce — the recoil on release/cancel
  function releaseSprings(){ for(let q=0;q<node.length;q++){ const o=node[q]; o.tdx=0;o.tdy=0;o.tdz=0; } _springLive=true; }
  function cancelHold(){ if(pluck) releaseSprings(); pluck=null; holdStar=null; }
  // atoms tethered to o in the active lens's edge set, with bond weights (strong bonds follow more)
  function neighborsOf(o){ const out=[]; let mw=0.0001; for(let e=0;e<_edges.length;e++){ const a=_edges[e][0],b=_edges[e][1],w=_edges[e][2]||1; if(a===o&&b.seen){ out.push([b,w]); if(w>mw)mw=w; } else if(b===o&&a.seen){ out.push([a,w]); if(w>mw)mw=w; } } return {list:out,maxW:mw}; }
  // star's last projected canvas point → viewport coords, for the color-flood transition origin
  function floodFrom(o){ if(!o||o._sx==null) return null; const r=cv.getBoundingClientRect(); return {x:r.left+(o._sx/Wc)*r.width, y:r.top+(o._sy/Hc)*r.height}; }
  // the POP: pulled past threshold → the fruit breaks free → color-flood into its dex card. The flood
  // bursts from the DISPLACED star (where your finger pulled it), then the web recoils home behind it.
  function doPop(){ if(!holdStar||pluckFired) return; pluckFired=true; const idx=holdStar.i; try{ _atomFloodXY=floodFrom(holdStar); }catch(e){ _atomFloodXY=null; } releaseSprings(); holdStar=null; pluck=null; dragging=false; if(typeof openAtomDetail==='function') openAtomDetail(idx,'sky'); }
  cv.addEventListener('pointerdown',e=>{
    try{cv.setPointerCapture(e.pointerId);}catch(_){}
    pts.set(e.pointerId,{x:px(e),y:py(e)}); hideHint();
    if(pts.size===1){ dragging=true; moved=0; lastX=px(e); lastY=py(e); yawVel=0; pitchVel=0; cv.style.cursor='grabbing';
      holdFired=false; cancelHold(); const hs=starAtPx(px(e),py(e));
      const _nt=performance.now();
      if(_nt-_lastDownT<320){
        if(hs){ ttx=hs.tx; tty=hs.ty; ttz=hs.tz; camTarget=Rmax*0.45; } // double-tap a star → FLY TO it
        else { camTarget=CAM; elTarget=(currentLens&&currentLens.el!=null?currentLens.el:EL); ttx=0; tty=0; ttz=0; } // double-tap empty → back out + recenter
      }
      _lastDownT=_nt;
      if(hs){ holdStar=hs; pluckFired=false; const _pp=proj(hs); pluckSC=_pp.sc||0.5; pluckGX=px(e); pluckGY=py(e); const nb=neighborsOf(hs); const _sh=(currentLens&&currentLens.pluckShare!=null)?currentLens.pluckShare:0.55; pluck={o:hs,neighbors:nb.list,maxW:nb.maxW,pull:0,share:_sh}; _springLive=true; } }
    else if(pts.size===2){ dragging=false; cancelHold(); const a=[...pts.values()]; pinchD0=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1; camDist0=camTarget; }
  });
  cv.addEventListener('pointermove',e=>{
    if(!pts.has(e.pointerId)) return;
    pts.set(e.pointerId,{x:px(e),y:py(e)});
    if(pts.size>=2){ cancelHold(); const a=[...pts.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),ratio=d/(pinchD0||1); camTarget=Math.max(-FOC*0.9, Math.min(CAM*2.4, camDist0-(ratio-1)*Rmax*2.2)); }
    else if(dragging){ const x=px(e),y=py(e),dx=x-lastX,dy=y-lastY; lastX=x; lastY=y; moved+=Math.abs(dx)+Math.abs(dy);
      if(holdStar && pluck){ // PLUCK the grabbed fruit (down landed on a star) — don't orbit
        const sdx=(x-pluckGX)/(pluckSC||0.5), sdy=(pluckGY-y)/(pluckSC||0.5); // screen offset → object units (y up)
        const cf=Math.cos(yaw),sf=Math.sin(yaw),sa=Math.sin(elCur),ca=Math.cos(elCur); // camera right/up basis (matches zoom-to-cursor pan)
        holdStar.dx=cf*sdx+(-sf*sa)*sdy; holdStar.dy=sf*sdx+(cf*sa)*sdy; holdStar.dz=ca*sdy;
        holdStar.tdx=holdStar.dx; holdStar.tdy=holdStar.dy; holdStar.tdz=holdStar.dz; // held sits under the finger
        for(let k=0;k<pluck.neighbors.length;k++){ const nb=pluck.neighbors[k][0],w=pluck.neighbors[k][1],fr=pluck.share*(w/pluck.maxW); nb.tdx=holdStar.dx*fr; nb.tdy=holdStar.dy*fr; nb.tdz=holdStar.dz*fr; } // neighbors trail by bond weight (share = per-lens: dramatic on fields, subtle on the DAG figure)
        pluck.pull=Math.hypot(x-pluckGX,y-pluckGY); _springLive=true;
        if(pluck.pull>=POP) doPop(); // pulled too hard → SNAP
      } else { // ORBIT (down landed on empty space)
        yaw+=dx*0.006; yawVel=dx*0.006; elTarget=Math.max(0.12,Math.min(1.52,elTarget+dy*0.004)); pitchVel=dy*0.004; }
    }
  });
  function endPtr(e){
    const wasTap=(pts.size===1 && dragging && moved<6);
    pts.delete(e.pointerId);
    if(pts.size===0){ cv.style.cursor='grab'; cancelHold(); if(wasTap && !holdFired) handleTap(e); dragging=false; }
    else if(pts.size===1){ const a=[...pts.values()][0]; dragging=true; lastX=a.x; moved=99; }  // resume orbit after pinch (suppress tap)
  }
  cv.addEventListener('pointerup',endPtr);
  cv.addEventListener('pointercancel',endPtr);
  cv.addEventListener('wheel',e=>{ e.preventDefault(); hideHint();
    const mx=px(e),my=py(e), scOld=FOC/Math.max(0.08*FOC, FOC+camTarget);
    camTarget=Math.max(-FOC*0.9, Math.min(CAM*2.4, camTarget+e.deltaY*Rmax*0.004));
    // zoom-to-cursor: pan the look-at target so the world point under the cursor stays put —
    // you fly toward what you point at (reaching periphery), not toward the fixed center.
    const scNew=FOC/Math.max(0.08*FOC, FOC+camTarget), f=(1/scOld - 1/scNew);
    const cf=Math.cos(yaw),sf=Math.sin(yaw),sa=Math.sin(elCur),ca=Math.cos(elCur), ox=(mx-CX), oy=(CY-my);
    ttx+=(cf*ox + (-sf*sa)*oy)*f; tty+=(sf*ox + (cf*sa)*oy)*f; ttz+=(ca*oy)*f;
  },{passive:false});
  // right-click a star → open its atom card (desktop power shortcut for press-and-hold)
  cv.addEventListener('contextmenu',e=>{ e.preventDefault(); const hs=starAtPx(px(e),py(e)); if(hs && typeof openAtomDetail==='function'){ try{ _atomFloodXY=floodFrom(hs)||{x:e.clientX,y:e.clientY}; }catch(_){ _atomFloodXY={x:e.clientX,y:e.clientY}; } openAtomDetail(hs.i,'sky'); } });
  // POS legend
  const leg=document.createElement('div');
  leg.style.cssText='position:absolute;top:24px;left:8px;z-index:2;display:flex;flex-wrap:wrap;gap:2px 8px;font-size:8px;letter-spacing:1px;max-width:62%;';
  active.forEach(function(s){
    // The word itself carries the POS color (the dot was redundant) — saves the
    // glyph + gap so the legend packs tighter against the Sky.
    const sp=document.createElement('span');
    sp.textContent=s.toLowerCase();
    sp.style.color=posRGB(s);
    leg.appendChild(sp);
  });
  host.appendChild(leg);
  // faint control hint (fades on first interaction); word detail now lives on the stars
  const hint=document.createElement('div'); hint.id='mapHint';
  hint.style.cssText='position:absolute;left:8px;bottom:6px;z-index:2;font-size:9px;letter-spacing:1px;color:#9fd;opacity:.4;transition:opacity .5s;pointer-events:none;';
  hint.textContent='drag to orbit · scroll to zoom · tap to hear · pull a word loose for its card';
  host.appendChild(hint);
  // lens switcher (top-right) — cycle the lenses; shows the active lens + its flex line
  const lensCtl=document.createElement('div');
  lensCtl.style.cssText='position:absolute;top:6px;right:8px;z-index:3;text-align:right;cursor:pointer;font-size:9px;letter-spacing:1px;max-width:54%;';
  host.appendChild(lensCtl);
  function updateLensUI(){
    let pips=''; for(let i=0;i<LENSES.length;i++){ pips+='<span style="display:inline-block;width:5px;height:5px;border-radius:50%;margin-left:4px;background:'+(i===lensIdx?'currentColor':'rgba(255,255,255,0.22)')+';"></span>'; }
    lensCtl.innerHTML='<div style="opacity:.85;">◳ '+currentLens.name+' ▸</div><div style="margin-top:4px;">'+pips+'</div><div style="font-size:8px;opacity:.5;margin-top:3px;line-height:1.3;">'+(currentLens.flex||'')+'</div>';
  }
  function applyLens(idx){ lensIdx=((idx%LENSES.length)+LENSES.length)%LENSES.length; currentLens=LENSES[lensIdx]; _lensId=currentLens.id; _lensColor=null; currentLens.apply(); elTarget=(currentLens.el!=null?currentLens.el:EL);
    if(leg) leg.style.display=_lensColor?'none':'flex'; // POS legend only when the lens colors by POS (hidden on community-colored TERRITORY)
    updateLensUI(); }
  lensCtl.onclick=function(e){ e.stopPropagation(); applyLens(lensIdx+1); try{ S.lens=currentLens.id; if(typeof save==='function') save(); }catch(_){} };
  // restore the last-used lens (persisted on switch); default ANATOMY
  applyLens(Math.max(0, LENSES.findIndex(function(l){ return l.id===(typeof S!=='undefined'&&S.lens); })));
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
