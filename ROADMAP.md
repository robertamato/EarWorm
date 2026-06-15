# Earworm Roadmap

**Status**: Post-verification (TTS + iOS + deploy pipeline working well on desktop + GitHub Pages iOS).  
**Guiding constraints**: Pure static client-side (index.html + obs.js + app.js). No heavy build. Methodology-first (reliable target-language TTS concurrent with written hanzi on every exposure, especially the first card after study start).  
**Architectural truth**: `app.js` is the built/delivered output. Canonical modular sources live under `js/` (L1 legacy pieces, L3 Scheduler, L4 State, etc.). Changes should keep the small modules from rotting; the running experience comes from app.js.

## Principles
- Observability bus (obs.js) is the single source of truth for stability signals and the "aptitude/proctoring" vision. Build it once; everything (debug, recovery, learning insights, future aptitude model) consumes `EW.obs.logEvent` + rings.
- Continue incremental L1 → v2 migration. Legacy behavior must not regress. New code paths prefer `Scheduler.*` (pure) and `State.dispatch` / `dispatchStudyAction`.
- The applyAnswer / logAnswer funnel is the heart of durable stats + telemetry. It must stay the single place every graded answer lands.
- Proctoring = using the event stream + session rings to continuously verify that the core acquisition loop (written + spoken target language together) is actually happening reliably for the learner.

## Current Baseline (June 2026)
- TTS: prime-on-gesture + 30 ms first-target delays + local-first getBestVoice + _ttsGen + synthesis-failed recovery + experimental voice filter. First-card and pill cases addressed.
- Proctor: full tts:* (request/end/fail/recovery/voice) + firstInSession tagging (fixed detection) + recovery success logging + session:firstFlash + enriched 'answer' events (policy, stage, frontier); PROCTOR button in #debugModes + proctorSummary() with targetTTS/recovered/firstFlash metrics. All target-lang study speaks (flash, MC-fwd, tone replays, etc.) now observable.
- iOS: safe-area calc padding + aspect-ratio JS fallback in renderHome. No optional chaining. Verified scrollable + usable.
- Deploy: clean SSH GitHub Pages pipeline, banner removed.
- Architecture: L3 Scheduler (pure next/modality/recordAnswer) + L4 State (dispatch for ANSWER_*) + L5 thin bridge + policy flag (v1/v2). applyAnswer funnel + one 'answer' obs event already exist.
- Obs: solid ring-buffer bus (errors + events), installed first, debug button, captureError.
- Debt: most study paths still L1-direct (S mutations + logAnswer). js/ dir has partial module copies (not loaded at runtime). No tests.

## Migration — Continue (prioritized slices)
1. **Answer funnel unification (next immediate)**  
   `logAnswer` / `applyAnswer` should drive *both* legacy durable `S.stats` (for "Your Learning") *and* `State.dispatch('ANSWER_VOCAB' / 'ANSWER_GRAMMAR')` (so Scheduler's per-axis SRS, history, stages stay authoritative).  
   Use the policy flag or always dual-write with sync via the existing bridge. Goal: one source of truth for "what the learner knows".

2. **Study loop decisions**  
   When `newSchedulerPolicy()`, have `startStudy` / the "next" logic in unified study call `Scheduler.next(...)` for modality and card selection instead of (or in addition to) the legacy queue + wordModality.

3. **TTS orchestration**  
   Extract the prime + guarded first-speak + recovery logic into a small observable service (still inside the legacy flow for now). All target-language speak sites must go through it so proctor events are guaranteed.

4. **Module hygiene**  
   As pieces are cleaned, keep `js/data.js`, `js/state.js`, `js/srs.js`, a future `js/scheduler.js` etc. in sync with the corresponding sections of the built `app.js`. Consider a trivial concat script or manual "build step" comment at the top of app.js when it grows painful.

5. **Later**: full session state machine, grammar drills, tone, word-order, etc. routed through dispatch + Scheduler.

Legacy must continue to work unchanged during the transition. Use the policy toggle for safe canary.

## Observability + Proctoring Iteration (the aptitude spine)
**Vision**: The event ring lets us *proctor* the method in real time and over sessions.  
Questions the bus should be able to answer:
- Did target-language TTS actually play (onend without recovery) for card N, especially the very first card of the session?
- What was the real wall time from "card shown" to audio?
- Recovery rate? Which voices/engines are flaky?
- Latency + accuracy trends by modality/axis?
- Was the learner in a high-fatigue or high-error streak when a TTS failure happened?
- Long-term: per-learner aptitude signals (speed of stage advance, consistency, preferred modalities, TTS reliability per device).

### Event Taxonomy (add incrementally, keep payloads small)
Core (already partially present):
- `obs:installed`
- `answer` (enrich: add `axis`, `stage`, `firstInSession`, `ttsFiredForCard`, `frontier`)

TTS proctoring (high priority — this is the methodology):
- `tts:prime` {lang, sample}
- `tts:request` {text, lang, card?, modality?, firstInSession?, gen}
- `tts:end` {card?, success:true, durationMs?}
- `tts:recovery` {card?, reason:'synthesis-failed'|'interrupted', attempt}
- `tts:fail` {card?, error, final:true}
- `tts:voice` {chosenName, localService, lang} (on selection)

Session / flow:
- `session:start` {mode, flashOnly, policy}
- `session:firstFlash` {idx}
- `session:modality` {idx, modality}
- `proctor:violation` {type: 'tts-mute'|'tts-missing-first'|'unseen-in-test', ...}

Use `EW.obs.logEvent(kind, data)` everywhere. It is already truncated + safe.

### Proctor Surfaces (debug-first, no user-facing noise)
- Reuse/extend the existing `#debugModes` + obs button pattern.
- New or enhanced "PROCTOR" button (only when `?earworm_debug=1` or localStorage earworm_debug).
- `EW.obs.proctorSummary()` (or similar) that walks the event ring + sessionAnswerRing + studyEncounters and returns a tiny report:
  - TTS attempts / onend successes this session (target lang only)
  - First-card TTS outcome (the critical one)
  - Recent answer accuracy + median latency by modality
  - Recovery count
  - Any violations
- Optional: dump to console or a small on-screen log (same style as the current obs error list).
- Title badge or status line can show "TTS 12/12" or "⚠ TTS 9/12 (1 recover)" when in study.

Implementation order for this iteration:
1. Instrument prime + the key target-lang speak sites (showStudyFlash, showStudyMC non-reverse, tone, etc.) + speak() itself + recovery path with rich tts:* events. Use `activeCardIdx` or pass the card index down. [x] (plus voice logging, recovery end tagging, firstInSession fix for accurate first-card tracking)
2. Enrich the existing 'answer' event and call site in applyAnswer. [x]
3. Add a `proctorSummary()` helper on the obs object + a button that renders a concise alert or console view. [x] (button + expanded summary with targetTTS etc.)
4. Wire the first migration slice (answer funnel → also dispatchStudyAction) so proctor events and State stay in sync. [x] (prior slice)
5. Add a couple of session lifecycle events. [x] (session:firstFlash + prior session:start / study:*)

Keep every logEvent wrapped so the observer itself never throws.

## Near-term Backlog (small, safe, high-signal)
- [x] TTS + answer proctor events + proctor summary button (this iteration) — events wired in speak/prime/recovery + key showStudy* sites (flash/MC/tone), firstInSession fixed, tts:voice + session:firstFlash added, proctorSummary expanded with target/recovered/firstFlash metrics; button verified.
- [x] Answer funnel dual-writes to State (migration slice 2: grammar answers now route through central logGrammarAnswer → applyAnswer + ANSWER_GRAMMAR dispatch under policy; enriched 'answer' obs event with stage; unifies telemetry for proctoring)
- [x] More Scheduler.next usage under the policy flag (first clean iteration: nextStudyCard now delegates to Scheduler.next for pending/introduce/grammar/vocab decisions when policy on; v1 legacy path untouched; study:next events added for proctor visibility)
- [x] Clean up duplicated filter logic + v2 branches inside wordModalityFromAxes (now v1-only reference; filters centralized in resolveStudyModality(); v2 uses Scheduler.modality directly under policy)
- [x] Study loop / answer / thin+bridge/hygiene slices (1-3+): Scheduler.next delegation with buildSessionState; grammar through central funnel + dispatch; thinned policy branches in helpers; strengthened bridge sync; added LEGACY v1 markers and comment hygiene throughout study paths.
- [ ] (Future) persist a bounded proctor snapshot to localStorage for "across sessions" views
- [ ] (Future) optional "TTS required" strict mode that falls back or warns if a target speak didn't fire

## Grammar Track Re-integration

Grammar drills are **disabled in the main study flow** (`dueDrills=[]` in `buildStudyQueue`). Still reachable via the GRAMMAR DRILL debug button. The `toneAdvancedUnlocked()` gate (40+ grammar attempts, 3+ categories) is currently unreachable.

**Blocked on:** metalanguage teaching design. Grammar drills use terms like 名词/动词/形容词 that have never been introduced as flashcards. This violates the "never test before first flash" invariant for the metalanguage itself.

**Re-integration path (design only — do not implement until settled):**
1. Add metalanguage terms to `D[]` as proper flashcard entries at appropriate frequency rank: 名词 (noun), 动词 (verb), 形容词 (adjective), 副词 (adverb), 代词 (pronoun), 介词 (preposition), 量词 (measure word), 助词 (particle). These are genuinely useful vocabulary, not just scaffolding.
2. Gate each grammar drill axis on `seen:true` for the relevant metalanguage card — same invariant enforced for sentence components.
3. Re-enable grammar in `buildStudyQueue` once the gate is wired.
4. Open design question: `POS_LOGICAL` maps English POS names to Chinese. The gate needs a join between the POS axis and the `D[]` metalanguage entry for that category.

## Out of Scope (for now)
- Real build system (unless the manual concat pain becomes real)
- Server-side anything
- Changing the core acquisition loop (flash-first, per-axis SRS, etc.)

## How to Work
- Verify on both desktop (Chrome/Edge) and iOS Safari (GitHub Pages) after changes.
- Use the debug policy toggle + earworm_debug for v2 paths and proctor views.
- When editing, prefer the clean L3/L4 code in the layered sections of app.js; keep js/*.js from diverging.
- Every new event or dispatch path must have a corresponding try/catch + obs.captureError on the error path.

This roadmap picks up directly from the original "observability bus first, then applyAnswer funnel, pure scheduler" direction. The bus is the foundation; proctoring is how we make the methodology observable and therefore reliably improvable.

Update this file as slices land.