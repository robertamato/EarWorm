# Earworm — The Acquisition Model

**Status:** foundational spec **v2** (2026-06-17), revised after an adversarial
pressure-test. This document defines the abstract object the system *is*. The
scheduler, the evidence schema, and the progressive-enrichment UI are three
renderings of *this* object and must answer to it. Code that contradicts this
spec is wrong, even if it runs.

This is theory, not an implementation plan. It defines *what to log*, *what the
cold inference engine computes*, and *which functions are fit rather than
designed* (§9). v2 changes from v1 are marked **[v2]**.

---

## 0. One-paragraph statement

A learner's knowledge of a language is a **frontier advancing through a graded,
fibered poset of linguistic atoms**. Atoms are graded by frequency (Zipf). Each
atom's mastery is a point in a **fibration**: a base (meaning) over which
dependent axes live as fibers whose reachable range is gated by the base.
Interactions are **morphisms** — a sentence is a composite that decomposes into
atoms — and evidence flows **one-way**, from a foreground success down to the
background atoms that scaffolded it, *gated by a necessity proxy*. This flow is
directional and non-invertible: it is **not a group**, it is a graded ordered
algebra. Two distinct quantities ride on every interaction — **reward**
(attributable, foreground only) and **measurement** (latent, axis-typed,
propagating). Mastery has two regimes — **acquisition** (within-session,
count-clocked) and **maintenance** (between-session, wall-clock-clocked) — joined
by a **graduation** that is a filter-crossing in the fibration. The runtime only
**records observables**; a single **cold inference engine** runs at session
boundaries and computes everything derived.

---

## 1. Objects: atoms — definition vs. presentation [v2]

Let `A` be the set of linguistic atoms for a course. Distinguish two things the
v1 spec blurred:

- **Definition.** Each `a ∈ A` is *defined by* its canonical, fully-unlocked
  flashcard — the maximally-enriched representation (all fibers present). Nothing
  is true of an atom that the unlocked card does not assert.
- **Presentation.** What the learner *sees* at a given moment is the **slice of
  that card accessible at their current base level** (I7). Definition is the whole
  fiber stack; presentation is a fiber slice. Progressive enrichment = fibers
  becoming visible as the base advances.

Other invariants of atoms:
- **Compounds are atoms.** 没有 is one object, distinct from 没 and 有. "An atom is
  the unit that has its own flashcard."
- **Frequency grade.** `rank: A → ℕ` (Zipf / subtitle-frequency). Primary prior on
  *introduction order* (§8-bis).

---

## 2. State space: the fibration

Axes `X = {meaning, pos, tone}`. For each axis `x`, mastery is a finite chain
`M_x = {0,…,K_x}` (stages). The *raw* mastery state of an atom is a point in the
product `∏_x M_x`. Not every point is reachable.

**Base and fibers.** Designate **base** `b = meaning`. The reachable space is a
fibration `π : E → B`, fiber `F(β)` over base level `β` = reachable dependent-axis
states when `meaning = β`, monotone: `β ≤ β' ⇒ F(β) ⊆ F(β')`. Each dependent axis
`x` carries a **gating function** `g_x : B → M_x` = max reachable stage of `x` at
base `β`. Advancing the base **enlarges the fiber** — this is the engine of
progression.

**[v2] The base may be a sub-product, not a single chain.** Gating is not uniform:
`g_pos` is strictly increasing (grammatical role is meaningless on an
un-comprehended word), but `g_tone` may be ~constant (phonology is partly
drillable before meaning is owned). If tone is free, it is *not* a fiber over
meaning — it is its own base. So the structure is more precisely
`(meaning → pos) × tone`: a fibration over a **sub-product** base, not over the
meaning chain alone. Treat the single-base picture as a simplification.

**[v2] The base may itself vary by atom POS-class.** For a concrete noun, meaning
and pos are cleanly separate. For a particle (的, 了), "meaning" *is* grammatical —
the fibers nearly collapse onto the base. The bundle's shape is atom-type-
dependent (open, §9).

This reconciles "axes are independent" with "axes have a prerequisite order": the
**coordinates are independent** (separately valued, separately graduated); the
**reachable subspace is fibered** (dependent axes gated over the base). Only the
*free product* (independence + full reachability) is denied.

### Why this dictates code
- **I2 (fibration invariant):** never interrogate a fiber the base has not
  unlocked. No pos-probe before `meaning` clears `g_pos`. Generalizes I1.
- The **progressive-enrichment UI is this fibration rendered visually** (§1).
  Scheduler state space and card enrichment ladder are the same object in two
  coordinate systems.

---

## 3. The learner state

1. **Introduction frontier** `S ⊆ A` — atoms flashed (`.seen`). Walks up `rank`.
2. For each `a ∈ S`, a point `state(a) ∈ E` — fibered mastery.
3. The **observation log** `L` — append-only record of interactions (§4).

**[v2] `L` is the only primary state; `state(a)` is a derived materialized cache.**
The cache is always rebuildable from `L` by full replay (§7-bis), so it can be
updated incrementally without becoming an independent source of truth that drifts.
Two retention tiers govern `L` (§9-bis).

---

## 4. Morphism: observed vs. attributed [v2]

An interaction is the **firing of a composition toward a foreground probe**. A
construction `c` has decomposition `decomp(c) = [a₁…aₙ]` into atoms *as parsed
here* (compounds atomic). v1 conflated what the hot path can *record* with what
requires *inference*. v2 splits them:

### 4a. Observed record (hot path — pure, no inference; satisfies I5)
```
o = (
  t,                 // epoch ms (wall clock)
  modality,          // 'flash'|'mc-fwd'|'mc-rev'|'cloze'|'word-order'|…
  course,
  composite,         // c: sentence id/text (null for isolated flash/MC)
  decomp,            // [atomIdx …] constituents as parsed (compound = one)
  foreground_atom,   // the probed atom
  foreground_axis,   // the probed axis  (known at drill-construction time)
  outcome,           // 1 | 0
  t_audio_end,       // ms the TTS clip finished (for latency decontam, §5)
  t_answer,          // ms the user committed
  chosen_option,     // for MC/cloze: what they picked (for δ attribution)
  mu                 // { atomIdx ↦ mastery-coords at t } — see I6
)
```
Everything here is a raw observable available without linguistic analysis.
`foreground_axis` is known because the drill *chose* it. `mu` is the only
non-retrofittable field.

### 4b. Attributed fields (cold engine — derived from `o` + structure)
- `background: [(atom, axis)…]` — which constituent fibers were exercised as
  scaffold. Requires role/parse analysis → **not** hot-path computable.
- `channel` — recall | discrimination | incidental (§6), incl. `δ` (the rejected
  distractor's relation, derived from `chosen_option` + the SR/distractor model).
- `necessity` weight per background pair (§5).

**[v2] `background-axis` and `channel` are derived, never logged.** This removes
the v1 contradiction where the schema demanded inference the hot path forbids.

---

## 5. The two flows — with a required necessity gate [v2]

Every interaction carries two independent quantities. Conflating them was the
original sin.

### Reward `ρ` — gamification
Credits **the foreground atom only**. XP is payment for the effortful act the user
performed; background did no felt work. Clean, attributable.

### Measurement `σ` — latent evidence
- To the foreground fiber: **direct** evidence (recall or discrimination per §6).
- To each background fiber: **incidental** evidence, with three hard properties:
  - **Positive-only (I3):** applied only when `outcome = 1`. A foreground failure
    is attributable to the foreground, never the scaffold. Never demote background.
  - **Mastery-gap weighted:** `w = max(0, m_bg − m_fg)`. Strongest when the
    scaffold is *more* mastered than the probe — i.e., genuinely background. This
    concentrates incidental credit on atoms ripe to graduate.
  - **[v2] Necessity-gated (REQUIRED, not deferred).** Incidental credit fires
    only if a necessity proxy passes. Without it the crude rule degenerates to
    "appeared in N correct sentences" ≈ co-occurrence frequency ≈ recall volume in
    disguise — exactly what §7 says graduation must *not* be. The minimum viable
    proxy (refine later, §9):
      `necessity = correct AND ( structural-link(bg, blank) OR fluent-latency )`
    where `structural-link` = the background atom is syntactically adjacent to or
    required by the probed position, and `fluent-latency` uses the **decontaminated
    latency** `(t_answer − t_audio_end)` below a per-modality threshold. (Raw
    latency is unusable here — in a TTS-driven app its dominant term is clip
    duration, not retrieval speed.)

Interrogation-independence and incidental credit coexist because they are
**different epistemic operations**: interrogation measures recall/discrimination
(declarative); incidental measures automatization (procedural — fluent as
background?). Each atom still earns its own foreground turns.

---

## 6. Three evidence channels — and their non-uniformity [v2]

| Channel | Measures | Condition | Modalities |
|---|---|---|---|
| **Recall** | the association exists | foreground, no distractor | flash, mc-fwd, mc-rev |
| **Discrimination** | the *boundary* (when *not* to use it) | foreground, plausible wrong option rejected | cloze, word-order, MC w/ semantic distractors |
| **Incidental** | automatization (fluent background) | background pair, necessity-gated | any multi-atom composite |

Graduation (§7) weights discrimination + incidental, **not** recall volume.

**[v2] The ladder is non-uniform across atoms, and this must be handled, not
assumed away.** Discrimination needs *deliberately plausible* distractors. Today
those come from `SR` (semantic-relations DB), **hand-built for the 100-word
Mandarin spine only**. Therefore:
- **User-added words** (exception-catcher) and **all non-Mandarin atoms** have no
  SR data → no discrimination channel → they can accrue only recall + incidental.
- The spec requires **one** of:
  1. **Language-agnostic distractor generation** (LLM- or embedding-based "wrong
     in this context" options), making discrimination available to every atom; or
  2. An explicit **graduation rule for atoms lacking the discrimination channel**
     (e.g., raise the incidental-evidence bar to compensate).
- Until (1) exists, core-Mandarin atoms and user/other-language atoms graduate by
  *different paths*. That asymmetry must be intentional, not accidental.

---

## 7. Graduation: filter-crossing

For axis `x`, atom `a` **graduates** when accumulated evidence crosses a predicate
`grad_x(a)` that is an **up-set** in evidence-state, defined over **discrimination
+ incidental** evidence (not recall count). You graduate by demonstrating the
boundary and by functioning as comprehended scaffold — not by being drilled more.

- Graduating the **base** (meaning) enlarges the fiber → unlocks dependent-axis
  interrogation. Graduation *drives the frontier through the fibered space.*
- An atom enters **maintenance** (§8) once its relevant axes graduate; until then
  it is in **acquisition**.

**[v2] Self-correction is real but its latency can be long — so cap how far
incidental evidence alone can push.** If incidental evidence graduates `a` wrongly,
its next *direct* maintenance review demotes it. But late-stage half-lives are
30–45 days (§8), and late-stage atoms are exactly the ones incidental evidence is
likeliest to over-graduate — so "one missed cycle" can mean weeks of believing a
decaying atom is solid. Therefore: **incidental + discrimination evidence may
graduate an atom up to a penultimate stage, but crossing into the
longest-half-life stage requires at least one recent *direct* confirmation.** This
bounds the blast radius where it is largest.

Graduation depends on **cross-atom** signals (was `a` background for `b`?), so it
cannot be computed inside a single answer handler. It is computed only in the cold
engine (§7-bis) — which is what dissolves the historical two-engine double-write.

### 7-bis. Hot path vs. cold engine

- **Hot path (every answer) — record + reward + mechanical step. No inference.**
  1. Append observed record `o` (§4a) to `L`.
  2. Award `ρ` (XP) to foreground.
  3. Apply the **mechanical** count-step to re-queue an acquisition card
     (deterministic, e.g. re-show in `steps[stage]` cards).

  The hot path NEVER infers schedule state — no stage advance, no due computation,
  no graduation, no priority, no channel/necessity attribution. (I5.)

- **Cold engine (strategic interval: session start/end, deck reconsideration) —
  the single inference engine.** [v2] It is **a function whose result is always
  equal to a full replay of `L`** (purity-as-invariant), implemented incrementally
  over new records as an optimization, with a periodic full-replay reconciliation
  to guarantee no drift. Steps:
  1. Attribute channels/background/necessity (§4b) for new records.
  2. Aggregate `σ` → update `state(a)`.
  3. Evaluate `grad_x(a)` → update graduation/regime (respecting the §7 cap).
  4. Update stabilities/half-lives `h_x` (stage-default now; fit later, §9).
  5. Compute retrievabilities, the working set, and priorities (§8).

There is exactly one engine and it is not in the answer path. The collision cannot
recur by construction.

---

## 8. The two clocks and their composition

- **Count clock (within-session)** `τ = totalSeen`. Acquisition re-fire near
  `τ + steps[stage]`. Within a session, calendar decay is negligible card-to-card,
  so this is the only live clock.
- **Wall clock (between-session)** `t`. Retrievability of a graduated fiber:
  `R_x(a) = 2^(−Δt / h_x(stage))`, `R ∈ (0,1]`. Maintenance due when `R_x < R*`
  (edge-of-forgetting, ≈ 0.85).

**Composition — gate by calendar, sequence by count:**
- At the **cold recompute**, build the working set:
  `{ ripe maintenance fibers : R_x < R* } ∪ { acquisition cards due by count }
   ∪ { new introductions per §8-bis }`, each assigned a **priority**.
- **Within the session**, priority is frozen; mechanical count-stepping +
  recency-avoidance sequence the working set; new introductions feed in by count
  (infinite-scroll); calendar dormant.

**Priority** = single scalar recomputed cold, blending (a) maintenance urgency
`(1 − R)` for graduated fibers, (b) acquisition pressure (count-overdue)
pre-graduation, (c) the `rank` prior — weighted by phase. Graduation is a smooth
reweighting, not a branch.

**Sessions are extensible *and* self-terminating.** Working set has a natural floor
(maintenance drained); the user may stop there or scroll into fresh acquisition.
Infinite-scroll removes the ceiling; self-termination is the suggested floor.

---

## 8-bis. Introduction pacing — the frontier-advance governor [v2, NEW]

The highest-leverage decision in the system, and previously hand-waved as
"budget." Introduction pacing is the cognitive-load governor and the home of
**desirable difficulty**. The policy:

- Maintain a target **acquisition-load ceiling** `C` — the number of atoms
  simultaneously in the acquisition regime (introduced, not yet graduated). This
  is the difficulty knob. (Current code approximates this: `inRotation < 12`,
  `brandNew >= 3` gates.)
- **Introduce the next atom along `rank`** when, at the cold recompute:
  `|acquisition set| < C` **AND** recent accuracy ≥ a floor (struggling → stop
  introducing) **AND** the acquisition pipeline shows throughput (recent
  introductions are graduating, not piling up).
- `C` and the accuracy floor **adapt** to performance — the principle behind the
  old `getIntroEvery` adaptivity, now expressed as a load target rather than a
  cadence. High accuracy + healthy graduation rate → raise `C` / introduce faster;
  struggling → lower `C`, drain before adding.
- Introduction is the **only** way new atoms enter; it always shows the flashcard
  first (I1), and it advances the `rank` frontier monotonically.

Open: exact `C`, the accuracy floor, and the graduation-throughput term are fit
against `L` (§9), not designed here.

---

## 9. Deliberately deferred (fit, don't design)

Committed structure above; these are parameters/functions fit against `L`:
- Exact gating `g_x(β)`; whether the base varies by atom POS-class (§2).
- Half-lives `h_x`: stage-default constants → per-card MLE from the log
  (HLR/FSRS-style) once durable history exists (§9-bis).
- The necessity proxy's refinement beyond the §5 minimum (grammatical role,
  dependency distance, better latency models).
- `grad_x` predicate, `priority` form, `C` and pacing terms (§8-bis).
- Language-agnostic distractor generation (§6 option 1).
- IRT/aptitude aggregation across users.
- Multi-language: the fibration is language-agnostic; axes, gating, channels, and
  distractor sources are per-language-module parameters.

---

## 9-bis. Retention tiers [v2, NEW]

The platform is localStorage (~5 MB), no backend (GitHub Pages). The full
morphism log with `mu` is heavy and cannot be retained unboundedly. **There are
two retention requirements, not one — do not conflate them:**

- **Scheduling tier (local, capped ring).** The cold engine needs only *recent*
  evidence to compute current state. A bounded ring of records + the rebuildable
  materialized cache (§3) suffices. Local-only, always available.
- **Fitting tier (full history, durable).** IRT/MLE half-life and aptitude fitting
  need *long* history. This genuinely requires the deferred durable/off-device
  store (state export already exists as a seam; a real backend later).

**Consequence for §11's urgency:** extending the schema to the rich `o` (§4a)
**now** is correct and time-sensitive *for the scheduler* — the recent window must
carry the channels or near-term graduation is blind. But unbounded `mu` retention
*for fitting* is **gated on storage we do not yet have**. "The log can't be rebuilt
against the past" is true for the recent scheduling window; the long-horizon
measurement substrate is blocked on the backend. Capture richly; retain in tiers.

---

## 10. Invariants

- **I1.** Never interrogate an atom before its first flash (`.seen`). *(existing)*
- **I2.** Never interrogate a fiber before its base unlocks it. *(fibration; ⊇ I1)*
- **I3.** Incidental measurement is positive-only; a foreground failure never
  demotes background.
- **I4.** Reward (XP) credits the foreground only; measurement may propagate.
- **I5.** The hot path records observables, awards XP, and applies mechanical
  steps; it never infers schedule state or attributes channels/necessity. All
  inference is cold and equals a full replay of `L`.
- **I6.** `mu` (mastery-at-time) is captured at fire-time; not reconstructable.
- **I7.** The fully-unlocked flashcard is the atom's *definition*; the displayed
  card is the fiber *slice* accessible at the current base.
- **[v2] I8.** Incidental credit is necessity-gated (§5); incidental + discrimination
  evidence alone may not push an atom into the longest-half-life stage without a
  recent direct confirmation (§7).

---

## 11. Mapping to current code (transitional)

| Spec concept | Current field/function | Disposition |
|---|---|---|
| Introduction frontier `S` | `.seen` | authoritative gate — keep |
| flash count | `.exp` | not a gate — transitional |
| mastery coord `m_x(a)` | `axisStage[x]` | keep, but write **only in cold engine** |
| count-clock due | `axisDue[x]` | becomes **mechanical-only** (acquisition) |
| observation log `L` | `reviewLog[x]` (+ `lastReviewAt`) | clean single-writer substrate — **extend to the observed record `o` (§4a)**; today only `[t, outcome, ms]`, missing composite/decomp/foreground/audio+answer times/chosen/`mu` |
| wall clock | `retrievability()`, `isWallClockRipe()` | move into cold recompute / selection |
| introduction pacing | `getIntroEvery`, `_shouldIntroduce` (`inRotation<12`, `brandNew>=3`) | reframe as acquisition-load ceiling `C` (§8-bis) |
| dual SRS engines | `recordAxisResultNew` **and** `Scheduler.recordAnswer` | collapse: hot path records only; both engines' inference roles removed; one cold engine |
| distractors | `SR` (Mandarin-only) | gap for non-core atoms (§6) — needs language-agnostic generation or compensating graduation rule |

**First concrete, non-retrofittable step:** extend the logged event to the observed
record `o` (§4a) — `mu`, `composite`, `decomp`, and the audio/answer timestamps
cannot be reconstructed later, and the recent window must carry them for the
scheduler to see the incidental/discrimination channels at all. Channel
attribution, background-axis, and necessity are derived cold and need not be
logged. Everything derived can be rebuilt against `L`; the observed record cannot
be rebuilt against the past.

---

*Relates to: `CLAUDE.md` (invariants), `ROADMAP.md`, the product thesis
(Zipf-graded universal core), the context-pivot timescale philosophy
(count-within / time-between), and the aptitude/IRT measurement vision
(`L` as substrate).*
