# Earworm — Codebase Rules for AI Contributors

Hard rules for this project. These encode invariants that are easy to violate and have caused real bugs. Read before touching any code.

---

## Build system

**Always rebuild `app.js` using bash `cat`. Never use PowerShell.**

```bash
cd "/c/Users/Rober/OneDrive/Desktop/Earworm"
cat js/data.js js/state.js js/srs.js js/session.js js/grammar.js js/drills.js js/events.js > js/app.js
```

PowerShell corrupts CJK regex character ranges (e.g. `一-鿿`) during file concatenation. The concatenation order above is load-order significant — do not reorder.

---

## Editing session.js

`session.js` uses CRLF line endings and contains `\` escape sequences (backslash literals) that confuse text-based edit tools. **Use Python binary read/write for all edits to session.js:**

```python
with open(path, 'rb') as f: raw = f.read()
content = raw.decode('utf-8').replace('\r\n', '\n')
content = content.replace(old, new, 1)
out = content.replace('\n', '\r\n').encode('utf-8')
with open(path, 'wb') as f: f.write(out)
```

---

## TTS contract

**All speech goes through the `speak(text, lang, onDone)` wrapper in `data.js`. Never call `speechSynthesis.speak()` directly.**

`speak()` handles: generation counters (`_ttsGen`) for stale-call cancellation, cancel-and-settle delays, synthesis-failed recovery, pre-warm queue clearing, visibility-change resume, and observability logging. Bypassing it silently breaks all of these.

**Any `speak()` call inside a `setTimeout` must guard against card change:**

```js
const _ttsCard = i;
setTimeout(() => { if (activeCardIdx === _ttsCard) speak(ch, lang); }, 30);
```

Without this guard, the deferred call fires after the user has advanced to a new card and silently overrides the new card's TTS.

---

## State signals — use `.seen`, not `.exp`

`.seen` is set to `true` in `showStudyFlash` when the flashcard is actually displayed to the user. `.exp` starts at 0 and is incremented the same moment, but historical state may have `exp > 0` and `seen: false` from migration artifacts.

**Use `.seen` as the "has been introduced as a flashcard" gate everywhere:**
- `sentenceAllIntroduced(zh)` — already correct
- `showWordOrderDrill` `introduced` filter — already correct
- The hard invariant guard in `showStudyCard` — already correct
- Any new code that gates on "has the user seen this word?" — must use `.seen`

---

## Core invariant: never test before first flash

A word must never appear in any test modality (MC, tone, cloze, word-order tile, sentence component) before it has been shown as a flashcard (`seen: true`).

This is enforced at multiple levels:
1. `showStudyCard` forces `mod='flash'` when `exp===0 || !seen` (hard invariant guard)
2. `sentenceAllIntroduced` blocks sentences where any component word has `seen:false`
3. `showWordOrderDrill` tile set uses `.seen` filter

If you add a new modality or a new sentence-sourcing path, it must respect this invariant. Violations are logged to `EW.obs` as `kind='violation'` events and surface in the orange VIOLATIONS badge in debug mode.

---

## Grammar track

The grammar interleaving track is **disabled from the main study flow** (`dueDrills = []` in `buildStudyQueue`). It is still reachable via the GRAMMAR DRILL debug button.

**Do not re-enable grammar in the main flow** without first designing a path that teaches each grammar metalanguage term (名词, 动词, etc.) as a flashcard before it appears in a grammar drill. Re-enabling it in the current state puts incomprehensible metalanguage in front of the learner mid-acquisition. See `ROADMAP.md` for the full design constraint.

---

## Pre-warm

`_doPrewarm()` in `data.js` speaks upcoming words at `volume=0` to warm local SAPI. This only works for voices where `voice.localService === true`. Online/neural voices ignore `volume=0` and play audibly.

`_doPrewarm` already guards this — do not remove the `!v.localService` bail. Do not add other pre-warm paths that skip this check.

---

## Key files

| File | Role |
|------|------|
| `js/data.js` | Vocabulary array `D[]`, `speak()`, `card()`, `sentenceAllIntroduced`, SRS primitives |
| `js/state.js` | Persistent state `S`, `buildStudyQueue`, stats |
| `js/srs.js` | Per-axis scheduler, `Scheduler.next`, `Scheduler.modality` |
| `js/session.js` | Study loop, all `show*` functions, tone drill, flash card |
| `js/grammar.js` | Grammar drill system (disabled from main flow) |
| `js/drills.js` | Cloze, word-order, convergence, POS drills; `EXAMPLE_SENTENCES` |
| `js/events.js` | DOM init, settings, debug panel wiring |
| `js/obs.js` | Observability bus — loaded BEFORE app.js, must stay separate |
| `js/app.js` | **Generated file** — concatenation of above. Never edit directly. |

---

## What to check in BUGS.md

`BUGS.md` in the repo root tracks known issues and their monitoring status. Before touching TTS, the scheduler, or drill modalities — check it. The MONITORING section lists fixes that are correct but have known edge cases or potential regressions.
