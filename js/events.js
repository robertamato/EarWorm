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
$('start').onclick=()=>{ startStudy(true); };
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
$('startTone').onclick=()=>{ startTone(); };
$('startStudy').onclick=()=>{ startStudy(); };
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
