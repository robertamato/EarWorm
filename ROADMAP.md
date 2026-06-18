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
- 2026-06-14 code review (REVIEW_ID 4308af58, local mode via review skill + reviewer persona): uncommitted renames (grid→map, langLabel→courseId etc., "STUDY"→"EXPLORE", course picker polish) clean + consistent across sources (no stale IDs, no app.js direct edits, sources in sync with generated). Pre-existing HIGH issues flagged in drills.js (speakWithBlank bypass of canonical wrapper + multiple missing activeCardIdx guards on deferred speak) matching CLAUDE.md contract + BUGS.md monitoring; must address before more modality work. .seen gate, proctor instrumentation, grammar-disabled, and other invariants healthy. Full artifacts: C:/tmp/grok-review-4308af58.md + summary. Rebuild rule (bash cat only) reinforced.
- 2026-06-16 code review (REVIEW_ID 6cbdeb05): Recent major changes (SRS card-count migration + wager, grammar re-enable in main flow for hasGrammar courses incl. Arabic, Arabic-Levantine + romanization + hybrid static audio via audioMap/_playStaticAudio in speak(), totalSeen, RTL/picker). Diff ~57k (sources only; no direct app.js edits; current app.js sync for this diff). **Critical/HIGH blockers**: Grammar main-flow re-enable without metalanguage flashcards/.seen gates (direct CLAUDE.md + ROADMAP violation; AR hasGrammar:true); Scheduler purity violated (js/srs.js polluted with render code; dupe logic in events/data; breaks CLAUDE pure + bash cat); speakWithBlank still full bypass (direct speechSynthesis.speak + own gen/obs; pre-existing from 4308af58, exposed by AR cloze); static hybrid incomplete (entry via speak good but no full tts:end/gen/lastSpoken/prewarm/cardCtx/proctor firstSuccess; hybrid fallback silent); totalSeen skew (only ++ on vocab flash; grammar drills bypass) + .seen gate incomplete (legacy .exp + grammar metalang for AR violates "never test before first flash"). Proctor gaps for static/grammar/wager/AR first-card. Partial progress on guards (cloze/wo initial) + recency/"no-repeat" + romanization accuracy (display-only). Full artifacts: C:/tmp/grok-review-*-6cbdeb05.md (5 slices + unified + summary). Rebuild + fixes required before expansion. See unified for prioritized actions (revert grammar enable, fix bypass, restore srs purity, complete static parity, centralize totalSeen/.seen).
- 2026-06-17 code review (REVIEW_ID 26153582): LLM sentence generation (Claude via direct/proxy), sentenceCurator (human proctor/approve/reject/save to cache), getPuzzleSentences merge, eligibility browser, integration with drills/Scheduler/sentenceAllIntroduced. Diff ~15k (sources only; no direct app.js edits; current app.js sync for new funcs). **Critical/HIGH blockers**: Curator advisory only (can commit sentences that fail sentenceAllIntroduced); upstream (Scheduler, clozeUnlocked, elig) use raw length + .exp (bypass .seen gate); zero EW.obs logging for generation/curator (missed proctor vision); multi-lang/Arabic completely unsupported (hardcoded Mandarin prompt + CJK-only invariant); direct browser Anthropic calls (key exposure; worker proxy dead); speakWithBlank bypass re-exposed by new sentence drills. Partial positives: good seam + leaf filters in drills; .seen respected in generation/covered-set; TTS guards on added paths; grammar track still disabled; static fallback. Full artifacts: /tmp/grok-review-*-26153582.md (5 slices + unified + summary). See unified for prioritized actions (hard gate in commit, fix upstream, add obs logging, course-aware gen + invariants, integrate proxy). Rebuild with bash cat required.
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
- [ ] **Grid struggle channel.** The grid color currently encodes mastery *position* (tier 0–3), so a dim cell can't distinguish "brand new" from "I keep lapsing this." Add a second visual channel — thin border / desaturation / flicker — driven by struggle signal (lapse rate + axis gap, both already computed for the PROFILE view). Then "see where you're weak, tap, hear it" closes literally on the grid. Transfers unchanged to the constellation (a star can carry both brightness=mastery and a struggle halo). Data is in hand; this is a render change, not a model change.
- [x] **Coll gate: mastery ≥ 1 for component chars.** Was gating on `exp > 0` (seen once). Now requires `masteryScore(dIdx) >= 1` — at least one successful recall — before a colloquialism surfaces. Prevents homophones from appearing as compositional building blocks before the learner has consolidated them. **Layer 2 shipped:** inline disambiguation note (≠ 吗 question particle) in `renderCollBreakdown` when another seen D[] entry shares the same bare syllable root.
- [ ] **Homophone disambiguation system (Layer 3 — deep fix).** The Layer 2 note and Layer 1 gate treat the symptom. The disease is that the scheduler has no **homophone-pair model**: no mechanism to detect that two vocabulary items share a syllable root, enforce explicit disambiguation before either is used as a building block, or schedule a deliberate side-by-side disambiguation flash. Design: (a) build a `HOMOPHONE_PAIRS` index keyed on bare-syllable root → [dIdx, ...] at deck-load time; (b) when both members of a pair have `seen:true` but disambiguation hasn't been explicitly surfaced, inject a disambiguation flash modality (side-by-side character + pinyin + meaning, contrast highlighted); (c) gate the pair on `disambiguated:true` before either member can appear in coll/compound breakdown without the ≠ note. This generalizes across all languages — Arabic letters with similar shapes, Japanese homophones (端/橋/箸), etc. Belongs with the prerequisite-graph design (same structure: `requires` edges, but at the phonological-disambiguation layer). Do not build until the Arabic prerequisite graph design clarifies the edge model.

## Tiered Audio Architecture

**Invariant:** pre-rendered audio is the *primary* source for first exposure in every course. Browser TTS is a fallback for words the course hasn't generated yet — a missing-asset state, not a feature. A course that ships with browser TTS covering first-exposure words is incomplete; the proctor should surface this gap.

The stack has three tiers, each unlocking at a higher mastery level:

```
Tier 1 — Pre-rendered static MP3        mastery 0+   primary; language-agnostic; generated at course build time
Tier 2 — Browser synthesis fallback     mastery 0+   acceptable for zh/ja; last resort for Arabic/Greek/Navajo
Tier 3 — Natural speech samples         mastery 2+   authentic clips; highest ceiling; finite corpus
```

**speak() resolution order:** audioMap[text] (Tier 1) → browser TTS (Tier 2). Natural clips (Tier 3) overlay Tier 1 when mastery ≥ 2 and a clip exists. Dialect accuracy is a quality concern within Tier 1, not an architectural concern — MSA audio is acceptable where Levantine-specific audio is unavailable. Regenerate entries as better sources appear; the audioMap is the seam.

**Course authorship contract:** when a new vocabulary batch is added to D[], audio must be generated for those entries before the course is considered playable. Generation tool is flexible (Anki reference deck extraction, gTTS, Azure batch, native recording) — what matters is that `audioMap` coverage tracks `D[]` coverage.

`audioSource` field in COURSES (not yet implemented) will encode the generation spec so entries can be targeted for regeneration:
```js
audioSource: 'gtts:ar'  // or 'azure:ar-LB-Layla', 'polly:Zeina', 'native-recording'
```

**Tier 1 — Pre-rendered audio.**
`speak()` checks `course.audioMap[text]` before synthesis. Map lives in the COURSES registry. For Arabic: 6 entries from Amazon Polly (reference .apkg), 16 entries generated via gTTS. Expand as vocabulary grows. Keep .apkg local; commit only MP3s corresponding to active D[] entries.

**Tier 2 — Browser synthesis.**
Works well for zh/ja (local SAPI voices on most platforms). For Arabic: `ar-LB` locale gives the engine a dialect signal; still MSA-approximated. No browser fix exists for Levantine-specific words — pre-rendered audio is the only path there.

**Tier 3 — Natural speech samples (design only — do not build yet).**
At mastery ≥ 2 (familiar tier), word audio could come from authentic speech clips rather than synthesis — a 1–3 second excerpt from a podcast, news segment, or native conversation where the word appears in natural context. This is the comprehensible input progression made tangible: controlled synthesis during acquisition, authentic speech as reinforcement. Design questions that must be resolved first:
- Source and rights: Creative Commons audio or self-recorded content. Sampled content cannot be redistributed without license.
- Clip extraction: forced alignment or keyword search to find word boundary in continuous speech. Tools: Montreal Forced Aligner, WhisperX, or manual curation.
- Storage: clips are small (~2–5 sec MP3), can be committed alongside `audioMap` entries. Schema: `audioMap[word] = {synth: 'audio/ar/xxx.mp3', natural: 'audio/ar/natural/xxx.mp3'}`.
- Harvesting from user-generated content: a later-stage idea where authentic clips are sourced from real material *the learner brings* (a YouTube video, a podcast they're working through). The word-search tier is the scaffolding for this.

**Arabic audio immediate backlog:**
- [ ] Source or record audio for the 16 missing seed words (من، على، مع، ب، أنا، أنت، هو، هي، إحنا، مين، وين، كيف، كتير، هلق، لا، يلا). Options: Azure `ar-LB` TTS batch generation, user recording, or restructure seed vocabulary toward words covered by the .apkg.
- [ ] Gender voice toggle: `getBestVoice(lang, genderHint)` extension. Target language defaults to one gender, native language to the opposing gender — perceptual channel that distinguishes "this is the thing you're learning" from "this is the translation." Gender inferred from voice name (Naayf/Zayd = male; Heba/Hala/Layla = female).
- [ ] TTS debug panel: add Arabic voice list alongside zh/ja panels.

## Phonological Tracking (design only — do not build yet)

**Premise:** phonological categories are not introduced proactively. The learner first builds conceptual/semantic grounding. Phonological awareness is triggered diagnostically — when the data shows the learner needs it, not on a fixed schedule. This mirrors the Mandarin tone drill design: gated behind `exp > 0` and meaning stage ≥ 2. For Arabic the delta is larger (pharyngeals, emphatics are not approximatable from English phonology), so the trigger matters more, but the principle is the same.

**Trigger conditions (any one suffices):**
- Learner has ≥ 3 seen words containing phoneme P, and error rate on those words exceeds threshold (e.g. > 40% over last 10 attempts)
- A near-homophone confusion is detected: learner errors on word A with a response that matches word B where A and B differ only in phoneme P
- Learner explicitly requests phonological review (future UI)

**What fires:** a dedicated phonological anchor card for phoneme P — audio-primary, minimal text. Shows the phoneme in isolation, then in a known word. Not MC-testable in isolation; mastery signal is indirect (downstream error rate on words containing P).

**Data schema prerequisite:** D[] entries need a `phonemes` field — array of phoneme codes present in the word (e.g. `['3yn', 'aa']`). This is the seam that lets the diagnostic fire. Add to D_AR entries when expanding the lexicon; do not retrofit retroactively until the trigger logic is built.

**Long-term:** phonological tracking as an independent axis (parallel to grammar), with per-phoneme SRS schedules and per-learner acquisition curves. The aptitude signal here is rich — speed of pharyngeal/emphatic acquisition varies enormously across adult learners and is likely the most linguistically-interesting measurement axis the app can generate.

**Open questions not yet resolved:**
- Are emphatics acquirable through passive exposure alone (vowel-colouring effect is perceptible)? Probably yes for most learners.
- Are pharyngeals (ع ح) acquirable without explicit intervention? Probably not — an English speaker may permanently process ع as a vowel onset without a deliberate anchor.
- What is the minimum number of exposures before the diagnostic should be considered "given a chance to work"? Threshold is a tunable parameter; start conservative (N=5, err>50%) and instrument.

**Do not build until:** D_AR has enough vocabulary that near-homophone and error-rate signals are meaningful (target: ≥ 30 words in the deck).

---

## Grammar Track Re-integration

Grammar drills are **disabled in the main study flow** (`dueDrills=[]` in `buildStudyQueue`). Still reachable via the GRAMMAR DRILL debug button. The `toneAdvancedUnlocked()` gate (40+ grammar attempts, 3+ categories) is currently unreachable.

**Blocked on:** metalanguage teaching design. Grammar drills use terms like 名词/动词/形容词 that have never been introduced as flashcards. This violates the "never test before first flash" invariant for the metalanguage itself.

**Re-integration path (design only — do not implement until settled):**
1. Add metalanguage terms to `D[]` as proper flashcard entries at appropriate frequency rank: 名词 (noun), 动词 (verb), 形容词 (adjective), 副词 (adverb), 代词 (pronoun), 介词 (preposition), 量词 (measure word), 助词 (particle). These are genuinely useful vocabulary, not just scaffolding.
2. Gate each grammar drill axis on `seen:true` for the relevant metalanguage card — same invariant enforced for sentence components.
3. Re-enable grammar in `buildStudyQueue` once the gate is wired.
4. Open design question: `POS_LOGICAL` maps English POS names to Chinese. The gate needs a join between the POS axis and the `D[]` metalanguage entry for that category.

## Arabic Dialect Architecture

**Current state:** MSA and Levantine Arabic are fully separate courses. This is correct for now.

**Divergence point:** D_AR as a shared base is sufficient through approximately the first 25–35 words — the cement layer (prepositions, pronouns, interrogatives, particles) has substantial overlap across registers, with differences that are largely phonological (ق→2 in Levantine, ث→t, etc.) rather than lexical. The divergence becomes structural at the verb system. Levantine present tense uses a b- prefix conjugation (بحكي، بتحكي، بيحكي) that has no MSA equivalent. From that point, the two registers require genuinely different lexical entries, not just different audio or romanization.

**Long-term target: shared Arabic trunk.** The function-word and cement-atom layer is a genuine shared base that a learner of either register benefits from. The architecture that serves this:
- An `'arabic-core'` course holding the shared trunk (prepositions, pronouns, interrogatives, particles, phonological anchors)
- `'arabic-levantine'` and `'arabic-msa'` as child courses that inherit the trunk and add register-specific verb systems, vocabulary, and conjugation patterns
- Engine support for course inheritance (not yet designed; do not build until Arabic content forces the shape)

**`rootSystem: 'semitic'`** field in COURSES (planned, not yet implemented) will group Arabic dialects and MSA under a common family for scheduling and prerequisite-graph purposes. The triconsonantal root system is a first-class concept in the prerequisite graph: a root (ك-ت-ب) is a node; derived forms (كتب، كاتب، مكتوب) are children. This is the structure Arabic *forces* into the engine that Mandarin lets us fake.

**Immediate action:** none. Continue building D_AR as Levantine-specific. Flag entries that are register-neutral (shared trunk candidates) with a comment as the deck grows — this will make the eventual trunk extraction straightforward.

---

## Language-Agnostic Engine — Program Arc (North Star)

The long game. Mandarin is the first instrument, not the product. The product is a **language-agnostic acquisition engine**: a universal scheduler/structure with thin per-language modules (atomic unit, acquisition axes, prerequisite graph). The sequence below is how we earn that generalization rather than assuming it.

1. **Arabic as teacher / forcing function.** Build the Arabic course with the project owner acting as teacher and oracle. Arabic's triconsonantal root system *forces* the prerequisite graph to be explicit — you cannot atomize ك-ت-ب → كتب/كاتب/مكتوب without declaring derivation relationships. Designing Arabic surfaces the structure Mandarin lets us fake (where character ≈ atom hides the dependency edges). Deliverable: a typed `D[]` with root / derived-form / bound-morpheme entries and explicit prerequisite links, plus a morphological axis definition.

2. **Extract the gnosis.** Distill what Arabic forced into existence into language-neutral primitives: what *is* an atomic unit, what are the acquisition axes (meaning / form / phonology / morphology / ...), what shape does the prerequisite graph take, how does `priority(i)` fold frequency against prerequisite necessity. This is where the agnostic scheduler contract gets written down.

3. **Validate bidirectionally on English ↔ Spanish.** Use a closely-related contrast pair (shared script, dense cognates, Romance vs Germanic) to test that the engine is actually agnostic and *symmetric* — teaching English to Spanish speakers and Spanish to English speakers should both fall out of the same machine with only module swaps. Asymmetries that appear here are bugs in the "agnostic" claim, and they're the signal we mine.

4. **Converge on the agnostic structure/algorithm.** With three families exercised (Sino-Tibetan, Semitic, the Romance/Germanic pair), the invariant core vs the per-language module boundary becomes empirical rather than assumed. The SRS, the axis system, and `priority(i)` settle into their language-independent form; everything else is a pluggable module.

**Merge target:** every step folds into the **constellation** when pertinent/optimal — it is the unifying surface where any language's territory, frontier, and struggle render identically. The `priority(i)` seam (see Constellation section) is the single joint that lets a finished agnostic scheduler drive the map without touching layout. Keep that seam clean across all four steps.

**Sequencing note:** this arc is upstream of effective-priority radius and the prerequisite-graph-aware constellation. Do Arabic *before* committing the constellation to any semantic/prerequisite layout — the graph it forces is what gives position meaning beyond raw frequency.

## Constellation Home Screen (North Star — design only)

The flat 10×N mastery grid is a *flat inventory*: cells in frequency order, opacity = mastery. The target is a *territory map* — a scrollable/zoomable/pannable 2D star field where the user's whole journey is a single legible shape. This is aspirational and gated on decisions below; **do not build yet**.

**Core layout — Vogel sunflower spiral.** Each word is a dot. Seed index = frequency rank: `r = k·√n`, `θ = n·137.507°` (golden angle). This is Zipf rendered as uniform-density 2D — center is the irreducible core (的 是 我…), the long tail spirals outward indefinitely. Radius means "how core to the language," the one axis we already trust. No glyphs printed — the constellation is the *macro* view (territory, progress, shape); the existing study flow is the *micro* view. Tap a star → reveal the word.

**Retained signal:** opacity = mastery (same as today). Bands: mastered (bright) → learning (mid) → frontier (gold leading-edge arc) → downloaded-but-locked (faint outline) → undownloaded (fog).

**The radius decision (gates everything):** does radius encode *raw frequency rank* or *effective priority*?
- Raw rank ships today, honest, zero new data.
- Effective priority (frequency adjusted by prerequisite necessity / conceptual debt) is better — a foundational-but-rare morpheme sits closer to center than its rank, making the scheduler's deliberate Zipf-deviations *visible* as inward-bent cells.
- **Build seam:** compute radius from a `priority(i)` function that currently just `return`s rank. The upgrade is then a one-function change, not a re-architecture. `priority(i)` is downstream of the prerequisite graph (the thing designing Arabic is meant to force into existence).

**Chunk-as-annulus delivery model.** A downloadable course chunk = a contiguous frequency band = a ring. "Download the next 300" lights the next annulus of fog. The **linear phase** is filling outward, ring by ring, frontier arc advancing. Past a proficiency threshold, the **divergence phase** begins: the spiral stops being radially uniform and sprouts *arms* — angle starts meaning something (formal register / domain / second language). The circle deforms into a star; two users' maps look different, which is the aptitude signal rendered as silhouette.

**Tensions to respect:**
1. **One-glance read must survive.** The flat grid's superpower is zero-interaction legibility. The default fully-zoomed-out constellation must still answer "how am I doing" in one look (lit core, fog edge, frontier arc). Pan/zoom is for exploration, never required for the basic signal.
2. **iOS perf.** Hundreds→thousands of dots with pan/zoom wants canvas (likely static pre-render at default zoom), not DOM divs — on the exact platform that's been fragile.
3. **The fog is aspirational.** `D[]` is one baked array; there is no chunked content backend yet. "Undownloaded territory" currently means "ranks past the deck size." The *visual* of chunked delivery can precede the actual CDN — but don't draw fog that can't later be filled.

**Dependencies / sequencing:** prerequisite-graph design (Arabic forcing function) → `priority(i)` scalar → effective-priority radius. Chunked-content delivery model should be decided before the fog/locked bands carry real meaning. Until both exist, a raw-rank spiral is a valid visual scaffold that upgrades in place.

## WaveViz — Shelved (revisit with a real audio database)

**Status: disabled.** Code remains in `events.js` (WaveViz IIFE) and the `#waveform` / `#waveformMC` canvases remain in the DOM, but `ENABLED=false` gates all rendering and the canvases are `display:none`. Re-enable by flipping the flag and the CSS — do not before reading the constraint below.

**Why shelved — the canonical contour is redundant with the pinyin diacritic.** The schematic tone curves we built are *isomorphic* to the tone marks already over the pinyin: the `\` over `bù`, the `ˇ` over `nǐ` **are** the canonical pitch shape. Drawing them as a larger curve adds no information a learner who can read the diacritic doesn't already have. It fails the bar the feature was justified on ("perceive a facet of the language they otherwise couldn't"). Animating or restyling the canonical glyph does not fix this — animating a redundant signal is still redundant.

**What would make it non-redundant: real F0 from real audio.** The diacritic shows the *citation* tone — it lies about what is actually spoken in context. The signal worth showing is the divergence from citation form that a beginner cannot hear: third-tone sandhi (你好 nǐ hǎo → ní hǎo), the 不/一 sandhi (不是 bù → bú shì), coarticulation, the speaker's real pitch range, timing. That information only exists in actual audio.

**Live extraction is a dead end and not the plan.** The Web Speech API exposes no output samples (no AudioBuffer / MediaStream / AnalyserNode), so the Mandarin TTS path cannot be analyzed in-browser at all. The static-audio path can, but real-time F0 on short clips is noisy (octave jumps, unvoiced gaps) — worse than nothing pedagogically.

**The actual plan — gate on a real target-language audio database.** When we have pre-generated or sampled audio *files* per word (the generation-backend seam; target density to make it worthwhile ≈ ≥ 50 words), the build is: extract F0 **offline**, clean it, store it as a per-word polyline alongside the entry, then render the real contour with a **playhead animated in sync with the clip duration**. That is the version where the contour stops being a redrawn tone mark and starts showing something no learner could otherwise perceive. Timing hooks for the animation already exist (`onstart`/`onend`/`onboundary`) even though samples do not.

The Arabic heartbeat was always a decorative placeholder (Arabic is non-tonal; F0 contour is the wrong feature there — pharyngeals/emphatics are the opaque ones). It is shelved with the rest until a per-family visualization is designed against real audio data.

---

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