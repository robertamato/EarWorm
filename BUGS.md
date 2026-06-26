# Earworm — Bug Log

Tracks known bugs, root causes, fix quality, and monitoring status.
Status: **OPEN** | **MONITORING** (fixed but watch for recurrence) | **CLOSED** (confident full fix)

---

## OPEN

Items below surfaced by external code reviews (Grok REVIEW_ID 3d19c9f3, also
93972d6f) and triaged against committed ground truth. Several other "CRITICAL"
items from those reviews were **already fixed** and are recorded under MONITORING
(distractor `.seen` leak, curator commit gate) or were **stale/incorrect** at
review time (build hygiene / `app.js` drift — tree is clean and byte-exact). Treat
external-review severities as candidates, not verdicts.

### Scheduler: v2 path ignored wall-clock ripe — FIXED (wall-clock); cold cutover still OPEN
**Symptom:** Cards that decay between sessions (retrievability `R < ~0.85`) were never resurfaced under the active (v2) scheduler; many never became "ripe."
**Root cause:** `Scheduler._dueVocab`/`_pickFromPools` were count-only (`axisDue`/`totalSeen`); `isWallClockRipe`/`retrievability` existed but were read only by legacy `buildStudyQueue`, never by the v2 path.
**Fix (`9f310eb`):** new `Scheduler._dueNow(i,ci)` = count-due OR `isWallClockRipe(i)`, used by `_dueVocab`/`_seenVocab`/`_pickFromPools.isDue`. Between-session forgetting now resurfaces decayed maintenance fibers (ENGINE.md §8 "gate by calendar, sequence by count"). Verified: a graduated, not-count-due, freshly-reviewed card is dormant; after a simulated 40-day decay (R=0.40) it becomes ripe→due purely by wall-clock.
**Status (cold cutover): OPEN — deliberately NOT flipped.** `coldRecompute` (shadow) replays the obs-log (408 records) into graduation verdicts. **Validated 2026-06-24: live graduates 86/86 (on 1 recall each); cold graduates 6/86 (requires contextual discrimination+incidental evidence).** The ~14× gap is the over-graduation / Duolingo trap *quantified* — not an engine bug. A blind cutover would collapse graduation 86→6, dumping 80 cards back into acquisition, halting introductions (load ceiling), and collapsing capability counts. The cutover must be a deliberate redesign (graduation = "demonstrated in context"), tied to the reading-first/production pivot ([[project_reading_first]]) + re-tuned pacing/renders — NOT a flag-flip. Until then cold's value is as the honest MEASUREMENT signal. ENGINE.md §7-bis/§8.

### State export/import: misses generated sentences + user words; import destructive
**Symptom:** Export → import roundtrip loses LLM-generated sentences and user-added words; importing can corrupt across courses.
**Root cause:** `exportState` snapshots `S` (card signals incl. `lastReviewAt`) but not `_sentenceCache`, `drills.js` `_pending*`, or the separate `earworm-user-words-v1` store. `importState` is destructive, ignores `_export.course`, no confirm/preview, silent errors.
**Status:** OPEN. See `ENGINE.md` §9-bis (scheduling vs fitting retention tiers; export is the durable seam).

### Observability: no proctor visibility for generation/curator/ripe
**Symptom:** PROCTOR summary + VIOLATIONS see only legacy `tts:`/`answer`/`firstFlash`/`violation` events. Sentence generation, curator approve/reject/commit, ripe rate/R, eligibility health, and LLM quality are invisible.
**Root cause:** No `EW.obs.logEvent` on those paths. (Slice 1/2a added `observation` + `cold:recompute`; generation/curator/ripe still unlogged.)
**Status:** OPEN (partial).

### Multi-language: LLM/curator/eligibility/sentence paths hardcode Mandarin
**Symptom:** On a non-Mandarin course (e.g. Arabic), sentence generation produces wrong/zero output; `sentenceAllIntroduced` is a no-op (CJK-only regex); curator/elig/exception UIs assume CJK fonts.
**Root cause:** `generateSentencesForWord` prompt hardcodes Mandarin/CJK/pinyin; `sentenceAllIntroduced` CJK regex; no course/script awareness.
**Status (2026-06-25, backlog #3 — functional blockers RESOLVED):** `generateSentencesForWord` is now course-general (char-vs-word covered set per segmentation mode, `activeCourse().langName` + the right unit, generic output example) — VN/AR generate correct prompts (verified by switching courses). `sentenceAllIntroduced` was ALREADY space-aware (full `_segMode()==='space'` word-boundary branch — the migration fixed it; the "CJK-only no-op" symptom is stale). Cloze + comprehension sentence display now use the course-general `charFont()`. REMAINING (cosmetic/low-priority): literal CJK fonts in the debug UIs (curator/eligibility/exception), CJK-specific detail views (char/radical — CJK-by-nature), grammar metalanguage, tone/POS; `LLM output not validated post-parse` (next item) is still Mandarin-shaped.

### LLM output not validated post-parse
**Symptom:** A generated sentence could be committed that doesn't contain the target word, is out of length bounds, or has characters beyond the `.seen` set.
**Root cause:** `commitApprovedSentences` now enforces `sentenceAllIntroduced` (the `.seen`/covered gate), but there is no check that the target word is present or length-bounded.
**Status:** OPEN (minor hardening / defense-in-depth on LLM output).

### State signal: `.exp` used as "introduced" proxy in non-test surfaces
**Symptom:** Frontier counts, `isMCEligible`, `clozeUnlocked` (target `exp>=1`), and `grammar.js` use `.exp>0` as the introduced/unlocked signal instead of `.seen`.
**Root cause:** Legacy convention; `.exp` and `.seen` normally co-occur but diverge on migration artifacts.
**Status:** OPEN (latent — **not** an unseen-in-test leak; foreground cards are flash-gated by `showStudyCard`). Distractor/tile surfaces already migrated to `.seen` (see MONITORING). A full sweep of remaining `.exp`-as-introduced uses is pending. Relates to the "exp>0 without seen:true" item below and the CLAUDE.md state-signals table.

### Security: LLM calls go direct to api.anthropic.com from the browser
**Symptom:** Generation/analysis use raw `fetch` to the Anthropic API with the key from `localStorage` + `anthropic-dangerous-direct-browser-access`. A Cloudflare worker proxy exists but is never called.
**Status:** OPEN — **accepted for the dev phase** (user decision; key lives in `localStorage`, never committed to the repo). Revisit at productization: route through the worker, drop the direct-browser header.

### Architecture: Scheduler defined in events.js, not srs.js
**Symptom:** `const Scheduler` (`next`/`modality`/`recordAnswer`) lives in `events.js` (DOM/UI layer); `srs.js` holds challenge/UI code — contradicts the CLAUDE.md "Key files" table.
**Status:** OPEN (nit — code organization, not correctness).

---

## MONITORING

### TTS contract: `speakWithBlank` bypass + deferred-speak guards — VERIFIED RESOLVED (2026-06-25)
Three June 2026 code reviews flagged `speakWithBlank` as a `speak()`-wrapper BYPASS (direct
`speechSynthesis.speak` + private gen/obs) plus "multiple missing `activeCardIdx` guards on deferred
speak". Audited 2026-06-25 (backlog #5): both are FIXED. `speakWithBlank` (drills.js) is now a
`speak()` CHAIN — `speak(before) → beepBlank() → speak(after)`, each through the canonical wrapper,
all card-change-guarded (`activeCardIdx===_card`); `beepBlank` is Web Audio (oscillator), not TTS. No
direct `speechSynthesis.speak` exists outside the `speak()` wrapper internals, the sanctioned
`_doPrewarm` (volume-0 SAPI warm, `!localService` bail intact), and the TTS DEBUG panel. All five
deferred `speak()` calls (session.js 850/939/1278, drills.js 541/790) carry the `activeCardIdx===…`
guard. The contract holds; the historical review note is stale.

### Production bar: activated into game-flow + R2 negation fixed (2026-06-25, `6d31671`)
**What changed:** The production modality (PRODUCTION.md, the Build consumer) was fully built but DARK (`PRODUCTION_ENABLED` hardcoded false) and had never run end-to-end. Now key-gated (defaults on when an Anthropic key exists; debug toggle `⌨ PRODUCTION IN FLOW` persists `S.productionOn`). Still ADDITIVE: `Estimator.PRODUCTION_GATE` + `PRODUCTION_FEEDBACK_WEIGHT` stay 0, so capability claims + scheduling are unchanged.
**R2 negation correctness (was emitting ungrammatical targets):** (a) `sentenceAtomsInOrder` returns OVERLAPPING atoms (我是学生→[我,是,学,学生]) so R2 negated the bound morpheme 学 → garbage "我是不学生"; guarded by free-atom (no other atom contains it) + ≥3-free-atom checks. (b) modals take the negator via `grammarRoles.preverbal` (我会说→我不会说). (c) 有→没有 via `grammarRoles.neg-suppletive`→negator-perf. Per-course flags; VN default-empty.
**SIM (PRODUCTION.md §8):** `simulateSchedule(N,acc,opts)` gained `{seedGraduated, mockProduction}`; production is OFF in the baseline (key-independent), ON with a deterministic mock when seeded. New `window.simProdCheck` asserts: production fired, never-before-recognize (stage ≥3), only-graduated-atoms, no-null-task — all pass (8 prod steps). Baseline `simCheck` unchanged (0 prod steps).
**Watch for:** (1) **Live haiku grader is read-verified only** — not yet exercised against a real typed submission (endpoint/model/parse/offline-fallback all correct on inspection). First real production card will exercise it; watch for JSON-parse failures or over/under-strict grading. (2) **"Gate-off ⇒ scheduling byte-identical" is NOT asserted** in SIM — production consumes an extra `Math.random()` at its modality gate, desyncing the shared RNG stream, so a naive sequence-equality test fails spuriously; needs a seeded-RNG harness. The per-card "dark" property IS enforced (production steps don't advance the meaning axis). (3) R2 `preverbal`/`neg-suppletive` lists are Mandarin-tuned; new courses need their own or R2 silently falls back to R1.

### Scheduler: in-acquisition cards starved ALL review modalities ("stuck on MC")
**Symptom (user-reported, 2026-06-23):** "Can't get the scheduler to show me anything past 2 multiple choices." The study loop served only a handful of stage-0 cards as `mc-fwd`/`mc-rev`; cloze / pos / word-order never appeared, even with the deck well past stage 2.
**Root cause:** `Scheduler._pickFromPools` used `acqRank` (in-acquisition = meaning stage < `ACQUIRED_STAGE`, which is **1**, i.e. stage 0) as an **absolute** primary sort key over due cards. Stage-0 cards have short intervals so a few are perpetually due; they always sorted first and **completely blocked the review pool**. Diagnosed live: 6 stage-0 cards due (acqRank 0) vs **80** review cards due (acqRank 1) — the 80 (carrying cloze/pos/word-order) were never reached. `Scheduler.modality` and the drill fallbacks were all fine; the bug was purely card *selection*. (Confirmed by simulating the live loop: 100% `mc-fwd` on ~6 cards.)
**Fix (`ca00eaa`):** INTERLEAVE — split due cards into acquisition (acqRank 0) + review (acqRank 1) pools and alternate via `studyCardCount % 2` so review surfaces every other card when both pools have due cards; acquisition still gets half the turns to consolidate. Per-pool objectives preserved (acquisition = fair rotation by `_lastSeenAt`; review = entropy edge). When one pool is empty the other takes all turns. `studyCardCount` threaded into `_pickFromPools`. Re-simulated: sequence went 100% `mc-fwd` → interleaved `mc-fwd`/`cloze`/`pos-s1`/`mc-rev`.
**Watch for:** (1) the 50/50 split could under-serve fresh introductions when the acquisition pool is large (many new words at once) — if new words feel slow to graduate, weight the ratio toward acquisition when `acqPool.length` is high. (2) Verify in a REAL session (sim used a frozen state with `_lastSeenAt` stamped manually). (3) `ACQUIRED_STAGE=1` means only stage 0 counts as acquisition — intentional, but the whole stall hinged on it.

### Scheduler: dual recording engine double-wrote axis state (Slice 2b)
**Symptom:** Every vocab answer pushed **two** entries to `axisHistory` and double-incremented `axisReps` / could double-advance `axisStage` — corrupting the accuracy window that drives stage advancement and graduation (and therefore the new introduction pacing).
**Root cause:** Both `recordAxisResultNew` (v1, called directly in every drill handler) **and** `Scheduler.recordAnswer` (v2, via the `ANSWER_VOCAB` dispatch) wrote `axisDue`/`axisStage`/`axisReps`/`axisHistory` on the same card object every answer. Latent while the v2 path was dormant; live once `newSchedulerPolicy` went always-on. Confirmed empirically: one answer → `axisHistory:[1,1]`, `axisReps:2`.
**Fix (Slice 2b increment 2):** `Scheduler.recordAnswer` is now a **no-op for axis state** — it only ensures the card exists and returns it so the dispatch keeps its xp/mult. `recordAxisResultNew` is the single authoritative axis writer (it also owns the durable `lastReviewAt`/`reviewLog`). Verified: one answer → `axisHistory:[1]`, `axisReps:1`, `lastReviewAt`/`reviewLog` present, xp + card-state intact. `7c4ba9a`+
**Watch for:** `Scheduler.recordGrammarAnswer` has the same dual-write with `recordAxisResultNew(i,'pos',…)`, but grammar is disabled from the main flow. xp/mult still flows through the dispatch (drill-side xp is clobbered by `Object.assign`, as before — not doubled). **Next 2b step:** make `coldState` drive selection + retire `recordAxisResultNew` in favor of pure cold inference — gated on validating the cold engine against real sessions.

---

### Scheduler: same card + modality drilled back-to-back (stale recency window)
**Symptom:** EXPLORE repeatedly showed the same atom with the same modality/difficulty one after another (no rotation).
**Root cause:** `buildSessionState` read `sessionRecentCards` from `State._s._session` (preferred when it is an array) — but that copy is an empty array that is **never kept in sync** with the live module `sessionRecentCards` (which `showStudyCard` pushes to on every card). So the recency window the v2 scheduler saw was always empty → `_pickFromPools` always picked the lowest-index card with no rotation → atom 0 forever. **Same root pattern as the EXPLORE-crash bug below** — `buildSessionState` trusting an unsynced `State._s._session` copy.
**Fix (two parts — Slice 2b increment 1):** (1) `buildSessionState` now reads **all** session globals (`studyPending`, `sessionGrammarAnswered`, `studyEncounters`, `sessionRecentCards`, `sessionAnswerRing`) from the live module — never the `State._s._session` mirror. (2) `dispatchStudyAction` no longer syncs the `_session` mirror **back into** the module globals — that read-back clobbered the recency push on every answer (and risked dropping freshly-queued pending). Module globals are now authoritative end-to-end. Verified across the full answer loop (dispatch on every card): rotation `0,1,2,…` with zero consecutive same-atom / exact-probe repeats. Also makes the `new Set` non-iterable crash (below) impossible via this path. `f33481c`+
**Watch for:** The bridge still mirrors module→`State._s._session` after dispatch (harmless, now unread) and the dead `window.save` proxy never runs (`save` is a function declaration, not `window.save`). The essential card-state sync `Object.assign(S, State._s)` on dispatch remains. Full bridge removal is the Slice 2b endgame (hot-log/cold-infer split in ENGINE.md).

---

### Scheduler: EXPLORE bounces to home (v2 buildSessionState throws on corrupted _session)
**Symptom:** Clicking EXPLORE only rolls the home background and stays home; no session starts. Console: `Scheduler.next error TypeError: object is not iterable (...Symbol.iterator)` at `new Set` in `buildSessionState`.
**Root cause:** `buildSessionState` did `new Set(sess.grammarAnswered)` where `State._s._session.grammarAnswered` was a plain object — a `Set` that round-trips through JSON (persisted `_session`) becomes `{}`, which is truthy but **not iterable**, so `new Set({})` throws. The throw was caught by the v2 `Scheduler.next` try/catch → falls to `goHome()` (rolls bg, stays home). Latent for a long time because the v2 path was dormant (`newSchedulerPolicy` defaulted false); **exposed when `newSchedulerPolicy` was flipped to always-true.**
**Fix:** `buildSessionState` checks `typeof x[Symbol.iterator]==='function'` before `new Set(sess.grammarAnswered)`, falling back to the module-global Set. `a054fae`+
**Watch for:** Deeper cause — `State._s._session` is persisted to localStorage despite being commented "(not persisted)"; its Sets/Maps corrupt to `{}` on reload. The coercion makes this harmless (falls back to clean module session state, which `startStudy` clears anyway), but `_session` should be excluded from persistence or nulled on load — fold into the Slice 2b state work. Other `new Set`/spreads in `buildSessionState` are already guarded (`Array.isArray` / `Object.entries`).

---

### Invariant: unseen words appearing as distractors (cloze/MC/word-order)
**Symptom:** An unintroduced word (user-reported: 一, never flashed) appeared as a cloze distractor option.
**Root cause:** Distractor pickers (`pickCharDistractors`, `pickDistractors`, standalone `pickMeaningDistractors`, and `Scheduler.pickMeaningDistractors`) gated candidates on `isUnlocked`/`.exp>0`, not `.seen`. `isUnlocked` also has a custom-deck branch that returns true with no flash at all. So a word with `seen:false` (incl. `exp>0` migration artifacts) could surface as a distractor — violating "never test before first flash."
**Fix:** All distractor/tile pickers now require `S.cards[i] && S.cards[i].seen`; `wordOrderUnlocked` count too. Verified in-browser: with only 3 cards seen, pickers return only those 3. `a054fae`
**Watch for:** Any new distractor / tile / sentence-component source must gate on `.seen`, never `.exp`/`isUnlocked`. Same root family as "exp>0 without seen:true" below. Non-test surfaces still use `.exp` (see OPEN: "State signal").

---

### Curator: advisory-only commit could cache un-introduced sentences
**Symptom:** `commitApprovedSentences` could move LLM-generated sentences into `_sentenceCache` even when they failed `sentenceAllIntroduced` (the on-screen "✗ vocab" badge was advisory only).
**Root cause:** Commit dropped only `_pendingRejected` and concatenated the rest without re-checking the gate.
**Fix:** `commitApprovedSentences` now filters by `sentenceAllIntroduced(s[0])` — a hard gate at commit time (drills.js). `162bd04`
**Watch for:** This is the enforcement point for LLM-sourced sentences. Post-parse validation (target word present / length bounds) is still missing — see OPEN: "LLM output not validated post-parse."

---

### TTS: Stale deferred speak() overrides tone reveal
**Symptom:** Tone drill card shows silently; tap-to-replay works fine.
**Root cause:** `showStudyFlash` and `showStudyMC` defer their initial `speak()` by 30ms (SAPI settle time). If the user advances to a tone card inside that 30ms window, the tone card fires `speak()` directly — then the stale timeout fires and cancels it.
**Fix:** `_flashTTSCard`/`_mcTTSCard` guard — deferred callbacks check `activeCardIdx === i` before firing. `fa6aa66`
**Watch for:** Any other card type that defers `speak()` without an `activeCardIdx` guard. Also: cards that call `speak()` directly (not deferred) being overridden by a queued prewarm that somehow escapes the `_prewarmQueue=[]` clear in `speak()`.

---

### TTS: Audible pre-warm
**Symptom:** Silent pre-warm utterances (volume=0) are faintly audible between cards.
**Root cause:** `volume=0` on `SpeechSynthesisUtterance` is only respected by local SAPI voices (`localService === true`). Online/neural voices ignore the flag and play at full volume.
**Fix:** `_doPrewarm` bails if `getBestVoice()` returns no voice or a non-local one. `fa6aa66`
**Watch for:** Pre-warm becomes a no-op on systems where all voices are online. This is acceptable (pre-warm was always a best-effort SAPI optimization), but worth noting if TTS feels sluggish on first card. Also: Microsoft Neural voices self-report `localService=false` even when locally installed — they already get filtered out by `getBestVoice`, so pre-warm is effectively disabled for most Windows users.

---

### Invariant: exp>0 without seen:true (migration artifact)
**Symptom:** Words appearing as tiles in word-order drills or as sentence components before the user has seen their flashcard.
**Root cause:** Historical state had `exp > 0` set on cards without `seen: true`, violating the "never test before first flash" invariant. `sentenceAllIntroduced` and `showWordOrderDrill` used `exp` as the introduced signal.
**Fix:** Both now use `.seen` instead of `.exp`. Hard invariant guard in `showStudyCard` extended to catch `!seen`. Tile-level violation logging added. Per-word violation events logged to `EW.obs`. `ca20801`
**Watch for:** The existing state in `localStorage` may still have cards with `exp > 0` and `seen: false`. The fixes prevent these from reaching drills, but violations may fire and appear in the VIOLATIONS panel (orange badge in debug mode). If violation count is nonzero at session start, it likely means residual corrupt state. A one-time migration to sync `seen` from `exp > 0` cards was NOT done — watch whether user reports continued violations.

---

### TTS: Wrong-answer replay stacking in tone drill
**Symptom:** After multiple wrong taps in tone drill, the eventual correct tap doesn't play TTS (synthesis-failed or silence).
**Root cause:** Each wrong tap scheduled an independent `setTimeout(speak, 650)`. Multiple wrong taps stacked competing speak() calls that raced on the SAPI engine.
**Fix:** Single managed `replayTimer` per card — `cancelReplay()`/`scheduleReplay()` pattern. Correct tap, skip, and don't-know all cancel the timer before acting. `7ce9907`
**Watch for:** Any new code path in the tone drill that calls `speak()` or `setTimeout(speak)` directly rather than going through `scheduleReplay()`.

---

### TTS: iOS/Android resume after backgrounding
**Symptom:** TTS plays silently or not at all after returning from another app or locking screen.
**Root cause:** `speechSynthesis.resume()` silently fails on iOS after backgrounding. The engine appears paused but `resume()` doesn't restart it.
**Fix:** `visibilitychange` handler: on tab-return, if synthesis is paused/stuck and `_lastSpokenText` is set, cancel and re-speak after 350ms. `872ac7f`
**Watch for:** iOS Safari version regressions. The fix relies on `speechSynthesis.paused` being accurately reported — this is inconsistent across Safari versions. If user reports continued silence after backgrounding on iOS, the handler may not be triggering.

---

### TTS: synthesis-failed recovery
**Symptom:** TTS silently fails (no audio, no error visible) on first card or after voice list hasn't loaded.
**Root cause:** SAPI on Windows Edge fires `synthesis-failed` when the voice list isn't yet populated, or when a speak() is queued too quickly after a cancel().
**Fix:** Recovery path in `speak()` onerror handler: 180ms retry at rate=1.0. Also: 30ms cancel-settle delay when `wasSpeaking` is true before queuing new utterance. `872ac7f`
**Watch for:** Recovery loop — if the retry also fails, there's no second retry. If `synthesis-failed` is persistent (wrong voice, bad state), the user gets silence with no feedback. The `EW.obs` TTS debug panel logs `tts:fail` and `tts:recovery` events.

---

## CLOSED

### Stage 4 tone drill unlocking too early
**Symptom:** Pure-audio tone drill (no character shown) fires after only ~9–10 correct answers.
**Root cause:** `toneStage()` used a single mastery threshold (≥3.0) with no vocabulary or grammar gating. +0.25 per correct answer meant stage 4 was reachable in ~12 answers.
**Fix:** `toneAdvancedUnlocked()` secondary gate: 150 introduced words AND 40+ grammar attempts across 3+ categories. `7ce9907`
**Note:** The grammar engagement gate is currently unreachable (grammar track disabled from main flow). Stage 4 is therefore locked behind vocabulary count alone in practice.

---

### iOS Safari blank/unresponsive on load
**Symptom:** App loads but shows blank screen; no interaction possible on iOS Safari.
**Root cause:** Temporal Dead Zone (TDZ) error — `warmVoices` called during module initialization before its definition was hoisted.
**Fix:** Deferred `warmVoices` call with `setTimeout(warmVoices, 0)`. `ae5b163`

---

### Word 中 appearing in word-order drill before first flashcard
**Symptom:** Word-order drill tile showed 中 (zhōng) which the user had not been introduced to.
**Root cause:** `sentenceAllIntroduced` used `.exp` to determine if words are introduced. Historical migration had set `exp > 0` on early cards without `seen: true`. The sentence "我是中国人" passed the filter, placing 中 as a tile.
**Fix:** See "Invariant: exp>0 without seen:true" above. `ca20801`

---

## Patterns to watch

- **TTS timing**: Multiple bugs stem from the same root — SAPI on Windows requires explicit settle delays, and async speak() calls can race. Any new feature that calls `speak()` should go through the existing single-call contract, not call `speechSynthesis.speak()` directly.
- **State signal ambiguity**: `exp`, `seen`, `mastery`, `axisDue`, `axisStage` — multiple overlapping signals with subtle distinctions. Bugs tend to arise when one signal is used as a proxy for another (e.g., `exp` for "has seen flashcard"). Always use `.seen` as the introduced gate.
- **setTimeout without card guard**: Deferred `speak()` calls must always capture and check `activeCardIdx` to avoid firing after card transition.
- **Study sub-panel hiding is manual boilerplate**: every `show*` study function (`showStudyMC`, `showStudyCloze`, `showWordOrderDrill`, `showStudyTone`, `showStudyColl`, …) must individually hide all sibling sub-panels (`studyMC`/`studyTone`/`studyPOS`/`studyColl`/…). `showWordOrderDrill` missed `studyColl`, leaving a stale collocation card (谢谢) rendered underneath the word-order drill (`a3faf7d`+ era, fixed). Any new modality must hide the full set — a single `hideStudySubPanels()` helper would remove this whole class.
