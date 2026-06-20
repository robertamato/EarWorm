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
let _fiberCache=null,_fiberCacheN=-1;
function constellationFibers(){
  if(_fiberCache&&_fiberCacheN===D.length) return _fiberCache;
  const sents=(typeof EXAMPLE_SENTENCES!=='undefined')?EXAMPLE_SENTENCES:{};
  const seen={},pairs=[];
  for(const key in sents){
    (sents[key]||[]).forEach(function(s){
      const text=(s&&s[0])||'',present=[];
      for(let i=0;i<D.length;i++){ if(text.indexOf(D[i][0])>=0) present.push(i); }
      for(let a=0;a<present.length;a++)for(let b=a+1;b<present.length;b++){
        const pk=present[a]+'-'+present[b];
        if(!seen[pk]){seen[pk]=1;pairs.push([present[a],present[b]]);}
      }
    });
  }
  _fiberCache=pairs;_fiberCacheN=D.length;return pairs;
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
    if(visible()){ if(!dragging && pts.size===0) yaw+=0.0030; draw(); }
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
