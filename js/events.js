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
  studyModalityFilter=null;   // flash-only isolation; clear any stale debug filter
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
  studyModalityFilter=null;   // ★ EXPLORE = the unified flow; never inherit a debug filter
  primeSpeechEngine(activeCourse().langCode,()=>{ _startStudyPending=false; startStudy(); });
};
$('study-quit').onclick=()=>{ studyActive=false; goHome(); };
$('startWS').onclick=()=>{ startWordSearch(); };
if($('startGrammar')) $('startGrammar').onclick=()=>{ startGrammarOnlySession(); };
// Per-modality isolation (DRILL ISOLATION): force ONE unified-study modality via
// studyModalityFilter, then run the normal study loop. resolveStudyModality honors it;
// never-test-before-flash still holds (unseen → flash; unbuildable → recognition fallback).
function _startIsoModality(filter){
  if(_startStudyPending) return;
  _startStudyPending=true;
  studyModalityFilter=filter;
  primeSpeechEngine(activeCourse().langCode,()=>{ _startStudyPending=false; startStudy(false); });
}
if($('startCloze')) $('startCloze').onclick=()=>_startIsoModality('cloze');
if($('startWordOrder')) $('startWordOrder').onclick=()=>_startIsoModality('word-order');
if($('startProduction')) $('startProduction').onclick=()=>_startIsoModality('production');
if($('startPOS')) $('startPOS').onclick=()=>_startIsoModality('pos');
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
  // Never produce before recognize (PRODUCTION.md): a 'production' step must only occur
  // on a well-recognized card (meaning-stage ≥ the production gate). Mirrors never-test-
  // before-flash, one rung up. Trivially passes when production is disabled (no such steps).
  var pMin=2; try{ pMin=PRODUCTION_MIN_STAGE; }catch(e){}
  var prodSteps=0, prodEarly=0;
  steps.forEach(function(s){ if(s.mod==='production'){ prodSteps++; if(s.stg==null||s.stg<pMin) prodEarly++; } });
  var MIN_GAP=3, PACE_FLOOR=Math.max(1,Math.round(steps.length*0.15)), EDGE_MAX=0.15, MONOPOLY_MAX=0.35;
  var checks=[
    {name:'never test before flash',     pass:beforeFlash===0,                              detail:beforeFlash+' violation(s)'},
    {name:'initial spacing ≥'+MIN_GAP, pass:(minGap==null||minGap>=MIN_GAP),            detail:'min gap '+minGap},
    {name:'no immediate repeat',         pass:immediateRepeat===0,                          detail:immediateRepeat+' repeat(s)'},
    {name:'no card monopoly',            pass:(totalServed<30||topShare<=MONOPOLY_MAX),     detail:'top card '+Math.round(topShare*100)+'% of '+totalServed},
    {name:'pace ≥'+PACE_FLOOR,         pass:(r.finalFrontier>=PACE_FLOOR),              detail:'frontier '+r.finalFrontier},
    {name:'edge ≤'+EDGE_MAX,           pass:(meanEdge==null||meanEdge<=EDGE_MAX),       detail:'mean|P-.5| '+(meanEdge==null?'-':meanEdge.toFixed(3))},
    {name:'never produce before recognize', pass:prodEarly===0,                            detail:prodEarly+' early of '+prodSteps+' prod'}
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

// Production modality knobs (PRODUCTION.md — the Build consumer). Lands DARK:
// PRODUCTION_ENABLED=false ⇒ Scheduler.modality never returns 'production' ⇒ scheduling
// byte-identical to today. PROB is the rarity (a knob to grow toward dominance);
// MIN_STAGE enforces never-produce-before-recognize; FEEDBACK_WEIGHT (0) keeps production
// measurement-only until trusted.
let PRODUCTION_ENABLED = false;
let PRODUCTION_MIN_STAGE = 3;
let PRODUCTION_PROB = 0.20;
let PRODUCTION_FEEDBACK_WEIGHT = 0;
try{ window.setProductionKnobs=function(en,prob,minStg,w){ if(en!=null)PRODUCTION_ENABLED=!!en; if(prob!=null)PRODUCTION_PROB=prob; if(minStg!=null)PRODUCTION_MIN_STAGE=minStg; if(w!=null)PRODUCTION_FEEDBACK_WEIGHT=w; return {PRODUCTION_ENABLED,PRODUCTION_PROB,PRODUCTION_MIN_STAGE,PRODUCTION_FEEDBACK_WEIGHT}; }; }catch(e){}

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

      // Production (PRODUCTION.md — the Build consumer). Dark unless PRODUCTION_ENABLED.
      // Rare, and only when well-recognized (never produce before recognize) AND a task
      // can be built over graduated atoms. Off ⇒ this branch never fires.
      if (PRODUCTION_ENABLED && meanStg >= PRODUCTION_MIN_STAGE && Math.random() < PRODUCTION_PROB) {
        try { if (typeof buildProductionTask === 'function' && buildProductionTask({forIdx:i})) return 'production'; } catch(e){}
      }

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
