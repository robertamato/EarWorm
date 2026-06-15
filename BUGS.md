# Earworm — Bug Log

Tracks known bugs, root causes, fix quality, and monitoring status.
Status: **OPEN** | **MONITORING** (fixed but watch for recurrence) | **CLOSED** (confident full fix)

---

## MONITORING

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
