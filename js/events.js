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
          const hasSentences = getPuzzleSentences(i).some(function(s){ return sentenceAllIntroduced(s[0]); });
          if (hasSentences) return Math.random() < 0.4 ? 'cloze' : 'mc-rev';
          return Math.random() < 0.5 ? 'mc-fwd' : 'mc-rev';
        }
        if (meanStg >= 4) {
          const r = Math.random();
          const hasSentences = getPuzzleSentences(i).some(function(s){ return sentenceAllIntroduced(s[0]); });
          if (r < 0.35 && hasSentences) return 'cloze';
          if (r < 0.55) return hasSentences ? 'word-order' : (Math.random() < 0.5 ? 'mc-fwd' : 'mc-rev');
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
    const seen = S.totalSeen || 0;

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
    const stability = AXIS_STABILITY[axis] || [3, 10, 30, 100];
    const maxStage = AXIS_MAX[axis] || 5;

    if (!isCorrect) {
      ci.axisReps[axis] = 0;
      const wrongCards = stage <= 1 ? 3 : stage === 2 ? 8 : 20;
      ci.axisDue[axis] = seen + wrongCards;
    } else {
      ci.axisReps[axis] = (ci.axisReps[axis] || 0) + 1;
      const speedFactor = responseMs < 2000 ? 1.2 : responseMs < 5000 ? 1.0 : 0.8;
      const baseCards = stability[Math.min((ci.axisReps[axis] || 1) - 1, stability.length - 1)] || 3;
      const intervalCards = Math.max(1, Math.round(baseCards * speedFactor));
      ci.axisDue[axis] = seen + intervalCards;

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
    // User-added words take immediate priority over the core spine.
    if (S.userWordQueue && S.userWordQueue.length) {
      for (let j = 0; j < S.userWordQueue.length; j++) {
        const wi = S.userWordQueue[j];
        if (D[wi] && !this._isUnlocked(S, wi)) return wi;
      }
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

    const recentArr = recent || [];
    const rset = new Set(recentArr);

    // Rotate among vocab outside the recency window. Grammar is disabled from the
    // main flow, so it is never injected into the rotation here — only used if there
    // is no vocab at all (matches the pre-rotation behavior where items[0] is vocab).
    const vocabItems = items.filter(it => it.type === 'vocab');
    if (vocabItems.length) {
      let pick = vocabItems.find(it => !rset.has(it.idx));
      if (!pick) {
        // Seen pool ≤ recency window: round-robin by least-recent showing
        // (largest lastIndexOf = most recent; smallest = show next).
        pick = vocabItems.slice().sort((a, b) =>
          recentArr.lastIndexOf(a.idx) - recentArr.lastIndexOf(b.idx))[0];
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
          ci.axisDue.meaning = (S.totalSeen || 0) + AXIS_STABILITY.meaning[0];
          ci.axisDue.pos = (S.totalSeen || 0) + AXIS_STABILITY.pos[0];
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
      ci.axisDue = { meaning: 0, pos: 0 }; // always due immediately
      ci.axisHistory = { meaning: Array(Math.round((level / 100) * 15)).fill(1), pos: [], tone: [] };
      this._s.cards[i] = ci;
    });

    GRAMMAR_CATS.forEach(cat => {
      GRAMMAR_AXES.forEach(axis => {
        this._s.grammar[cat][axis] = {
          stage: Math.min(AXIS_MAX_STAGES[axis] || 4, grammarStageTarget),
          reps: Math.round((level / 100) * 10),
          due: level >= 50 ? (S.totalSeen || 0) + 200 : 0,
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

  // Initialize _session for v2 session state (pending, grammarAnswered, rings, etc.)
  if (!State._s._session) {
    State._s._session = {
      grammarAnswered: new Set(),
      studyPending: [],
      studyEncounters: {},
      sessionRecentCards: [],
      sessionAnswerRing: []
    };
  }

  // Initial sync of key session globals into _session (for v2 paths)
  try {
    State._s._session.studyPending = [...studyPending];
    if (sessionGrammarAnswered && sessionGrammarAnswered.size) {
      State._s._session.grammarAnswered = new Set(sessionGrammarAnswered);
    }
    State._s._session.studyEncounters = Object.fromEntries(studyEncounters);
    State._s._session.sessionRecentCards = [...sessionRecentCards];
    State._s._session.sessionAnswerRing = [...sessionAnswerRing];
  } catch(e){}

  // Proxy save() to also update State._s (and _session)
  const _origSave = window.save;
  window.save = function() {
    _origSave && _origSave();
    Object.assign(State._s, S);
    if (State._s._session) {
      State._s._session.studyPending = [...studyPending];
      State._s._session.studyEncounters = Object.fromEntries(studyEncounters);
      State._s._session.sessionRecentCards = [...sessionRecentCards];
      State._s._session.sessionAnswerRing = [...sessionAnswerRing];
      // grammarAnswered is managed via dispatch cases
    }
  };

  // Wire State.dispatch for new code paths
  window.dispatchStudyAction = function(action, payload) {
    State.dispatch(action, payload);
    // Stronger bridge: keep legacy S and session globals in sync with State._session
    Object.assign(S, State._s);

    const sess = State._s._session;
    if (sess) {
      if (Array.isArray(sess.studyPending)) {
        studyPending = [...sess.studyPending];
      }
      if (sess.grammarAnswered) {
        sessionGrammarAnswered.clear();
        try { sess.grammarAnswered.forEach(k => sessionGrammarAnswered.add(k)); } catch(e){}
      }
      if (sess.studyEncounters) {
        studyEncounters.clear();
        Object.entries(sess.studyEncounters).forEach(([k,v]) => studyEncounters.set(Number(k), v));
      }
      if (Array.isArray(sess.sessionRecentCards)) sessionRecentCards = [...sess.sessionRecentCards];
      if (Array.isArray(sess.sessionAnswerRing)) sessionAnswerRing = [...sess.sessionAnswerRing];
    }

    // Mirror back from legacy globals to _session after dispatch (for future Scheduler.next calls)
    if (State._s._session) {
      State._s._session.studyPending = [...studyPending];
      State._s._session.studyEncounters = Object.fromEntries(studyEncounters);
      State._s._session.sessionRecentCards = [...sessionRecentCards];
      State._s._session.sessionAnswerRing = [...sessionAnswerRing];
      if (sessionGrammarAnswered) {
        State._s._session.grammarAnswered = new Set(sessionGrammarAnswered);
      }
    }
  };

  console.log('[Earworm v2] Architecture layers loaded. Scheduler and State available.');
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
