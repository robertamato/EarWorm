# Earworm — The Production Bar (Phase 2 spec)

> **Scope — the production *modality* only.** The first modality that measures
> *crutch-independence*, interjected inline in study as the **Build** consumer of the
> capability lifecycle. **Title Defense (the Maintain consumer) is out of scope here** —
> it incorporates this modality but adds its own machinery and gets its own spec. Framing
> is [THEORY.md](THEORY.md) §§10–12; the renders shipped in Phase 1 are the Estimator,
> Yield Curve, and capability labels. This is the §12 "load-bearing unbuilt thing."

---

## 0. The reframe

Production is **not "a harder MC."** It is the first modality where the learner
*generates* L2 from nothing rather than *recognizing/assembling* from given options — and
therefore the first that can measure whether the **L1 crutch has faded** (the variable
§12 and [[project_substitution_layer]] say none of our current renders measure). Word-order
is assembly-from-tiles (trap-exposed); production is generate-from-nothing. It is the
trap-escape the two-axes memory names: free production + production-gated graduation.

Long-horizon: production is roadmapped to **dominate** the modality mix. v1 ships it
*rare, dark, and weak* (unproven grader), but the cadence and feedback weight are knobs
built to grow toward dominance on evidence, not faith.

---

## 1. The capability lifecycle — where production appears

Production appears **twice**, for opposite reasons. One modality, two consumers:

| Phase | What | Modality | Trigger | Consumer |
|---|---|---|---|---|
| Recognize | graduate the tier's atoms | MC / cloze / word-order | normal scheduler (shipped) | — |
| **Build** | *close* the tier by producing it; climb rungs; flip the §12 gate | **production, inline in study** | production cadence due on a ripe tier | **this spec** |
| Hold | the closed capability decays | — | forgetting (cold) | — |
| Defend | re-prove a *decaying held* capability | production, inside a bout | tenure crosses threshold | **Title Defense (future)** |

Production is the substrate; Build and Defend are distinct consumers. Defend *incorporates*
production but adds tenure trigger + regression framing + calibration market + engine-
calibration. **Defense is not "production in a frame."** This spec builds only Build.

---

## 2. The crutch-fade ladder (the novel axis)

Three rungs of decreasing L1 scaffold. **v1 = R1 + R2; R3 deferred** (hardest to grade).

- **R1 — cued translation:** "Say in VN: *I am a good person*." L1 prompt present (max crutch).
- **R2 — transformation:** "Make this negative: *tôi đi*." L2 in, L2 out (partial crutch).
- **R3 — free response (deferred):** "Trả lời: *bạn là ai?*" crutch-free.

**Crutch-fade = the highest rung produced correctly** (`capabilityMet && !usedL1` over
recent productions). This *is* the measurement — cleaner than asking the grader to
introspect dependence.

R2 transformations are **tier-defined and reuse the agnostic spec** (`grammarRoles`): the
transformation *is* the capability — T2 → negate / make-yes-no-Q; T3 → add possessive /
classifier+numeral; T4 → add location / aspect; T5 → conjoin. One generator, per-course
fillers, like the basis itself.

---

## 3. The modality — mechanics

- **Typed**, L2 out (romanization accepted for CJK; speech/ASR deferred to Phase 3).
- **Never produce before recognize** — extends the core invariant ("never test before
  flash"). A production task uses **only graduated atoms**, and targets a tier whose atoms
  are graduated.
- **Tier-targeted**: each task exercises the specific capability being built.
- **Template-generated tasks** (deterministic, cheap, controllable). R1 pulls a target
  from `EXAMPLE_SENTENCES` whose atoms are all graduated; R2 applies a tier transformation
  to a graduated L2 sentence. **The LLM is scoped to grading only** — one call per
  response, never per task — to bound cost.
- **Inline**: a new study-screen card type (prompt + text box + submit), alongside
  cloze/word-order. Flow: prompt → type → "grading…" (1–2s) → ✓/✗ + one feedback line →
  next card.

---

## 4. The grading contract

```
in:  { task, rung, targetCapability, allowedAtoms, expected?, learnerResponse }
out: { ok, capabilityMet, usedL1, rung, errors:[{type,span,fix}], feedback }
```

- `ok` — grammatical AND satisfies the task. `capabilityMet` — actually exercised the
  target capability (e.g. *actually negated*) — the tier-certification signal. `usedL1` —
  fell back to L1 / wrong-language tokens / L1 calque — the crutch signal.
- **haiku-4.5**, low temperature, strict rubric, **conservative pass** (require a clear
  pass; ambiguity → not-ok). Short-sentence grammaticality is in haiku's range; escalate
  to sonnet only if quality disappoints.
- **The grade is evidence, not truth** (reward≠measurement). A single grade never gates
  or rewards; accumulated graded productions are the evidence the cold engine infers from.

---

## 5. Evidence flow & the feedback knob

- Each production → append to a **hot** production log `S.productionLog` (task, rung,
  verdict, atoms, ts). No inference at capture (hot-log/cold-infer).
- **Cold infer** `S.tierProduced[tierName]` = true when ≥ K successful productions
  (`capabilityMet`) across distinct tasks at the tier (K small, ~2–3). This is the signal
  `Estimator._tierProduced()` already reads (the seam stubbed in srs.js).
- **The §12 gate**: `Estimator.PRODUCTION_GATE` flips on once the grader is trusted — then
  a capability claim requires graduation **AND** production. Manual flag for now.
- **Feedback into scheduling** behind `PRODUCTION_FEEDBACK_WEIGHT` (0..1), **starts ~0**
  (your #4 caveat). At 0, production is logged + displayed but moves nothing — the proven
  scheduler is untouched. >0: a successful production conservatively nudges the used atoms'
  stability / cold graduation. Turn it up as trust grows.

**Gate-off + weight-0 ⇒ byte-identical to today.** The whole modality lands dark and additive.

---

## 6. Scheduler placement

- New `'production'` branch in `Scheduler.modality`, at high meaning-stage, **rare**
  (`PRODUCTION_CADENCE` knob — a starting cap, not the end state). Per-tier, not per-card:
  fires when a tier's atoms are graduated and production cadence is due.
- **Key-gated**: only scheduled when an API key exists (else skipped — capability stays
  graduation-based, the current state). Graceful degradation; no key ⇒ no behavior change.

---

## 7. Infrastructure (reuse — already proven browser-direct)

- `getAnthropicKey()` (drills.js); `fetch('https://api.anthropic.com/v1/messages')`,
  `anthropic-version: 2023-06-01`, the direct-browser-access header, the **rate-limit
  guard** and async `onDone` pattern — all as in `generateSentencesForWord` /
  `analyzeTextForExceptions` (drills.js). Model: `claude-haiku-4-5-20251001`.
- Key handling unchanged: user-supplied, localStorage, dev-only, no proxy ([[project_build_plan]]).

---

## 8. Guardrails & invariants (keep the SIM battery alive)

- The **grader is an injectable dependency**. SIM uses a deterministic **mock grader**
  (accuracy-parametrized, like today's `simulateSchedule`); real sessions use the LLM.
- New invariants for `simInvariants`: **never-produce-before-recognize** (every production
  task atom is graduated); **production uses only graduated atoms**; **gate-off + weight-0
  ⇒ scheduling identical** to the no-production baseline; production only scheduled with a
  key (or the mock in SIM).
- reward≠measurement and hot-log/cold-infer hold throughout (§10.0).

---

## 9. Settled decisions (2026-06-20)

1. **Typed-only** v1 (speech/ASR → Phase 3). 2. **haiku-4.5** grader + strict rubric.
3. **R1 + R2** only (R3 deferred). 4. **Feeds back, conservatively** — `PRODUCTION_FEEDBACK_WEIGHT`
starts ~0, grows on trust; production foreseen to dominate eventually. 5. **Inline study
modality first** (Build consumer); Title Defense is a distinct later consumer, not a wrapper.

---

## 10. Out of scope (future, named so they're not forgotten)

- **Title Defense** — the Maintain consumer: tenure trigger, regression framing, posted
  line + chips, engine-calibration loop. Incorporates this modality; specced separately.
- **R3 free response**; **speech/ASR + pronunciation** (Phase 3); **LLM-as-line-poster**
  for the wager (the line stays heuristic `_pCorrect` to avoid a call per wager);
  **ingestor faculties** (same backend, parallel track — exception→flashcard is half-built).
