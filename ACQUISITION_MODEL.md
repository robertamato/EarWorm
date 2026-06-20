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

## 8-ter. Seed sizing — the Phase-0 bootstrap [v2, NEW]

§8-bis governs **steady-state** expansion (one atom at a time, load-governed). It
presupposes a base rich enough that each new introduction can be **immediately
interrogated in context** — the comprehension test is the real measurement (§6);
the flashcard is only the admission ticket that satisfies I1. Below a critical
mass that base does not exist: the most frequent atoms in isolation cannot form
comprehensible wholes, so there is nothing to interrogate. The opening regime is
therefore distinct from steady state.

**Seed `Σ`** = the smallest frequency-prefix of the inventory that reaches
*combinatorial generativity*: enough atoms that the generator (the curator/oracle)
can build a large, varied set of comprehensible sentences using **only** `Σ`. The
seed is flashed in strict `rank` order, front-loaded, accepting a flash-heavy
opening because below `|Σ|` there is no context to give. After the seed, §8-bis
takes over and expansion runs ≈ pure `rank`, because `Σ` already supplies almost
all the scaffold any new atom needs. This is what makes off-`rank` front-loading
(§ pull-scheduling, see ROADMAP) **a phase, not a constant** — the deviation is
concentrated in the bootstrap and rare afterward.

### The sizing algorithm (language-agnostic)

Given language `L` with frequency-ranked, POS/role-tagged inventory `A = a_1,a_2,…`:

- `Σ_N = {a_1,…,a_N}` — the top-`N` prefix.
- **Role skeleton** `R(L)` — the minimal grammatical roles to form a clause in `L`
  (predicate-bearer, argument-bearer, the obligatory functional markers; derived
  from `L`'s typology — a per-language-module input). `roleComplete(Σ_N)` ⇔ `Σ_N`
  fills every role in `R(L)`.
- **Generativity** `G(N)` — count of distinct **valid** comprehensible sentences
  expressible using only atoms in `Σ_N`, capped at `K`, optionally
  diversity-weighted. *Valid* = closure (every atom ∈ `Σ_N`) ∧ grammatical ∧
  coherent ∧ natural. `G` is computed by the **generative oracle** (the LLM
  curator — the same engine that produces puzzle sentences); closure is checked
  mechanically.

```
N* = min { N : roleComplete(Σ_N) ∧ G(N) ≥ θ }
```

equivalently the **knee** form: smallest `N` with marginal `G(N) − G(N−1) < ε`.
`G` is monotone non-decreasing in `N`, so `N*` is found by **binary search** on the
threshold — `O(log |A|)` oracle calls — or coarse-sweep-then-refine for the knee.
`roleComplete` is a hard gate that can only *raise* `N*` (if an essential role's
filler sits deep in the tail, `N` grows until it is included).

**Nothing is hardcoded.** The procedure is identical across languages; only the
inputs differ — the inventory `A`, the skeleton `R(L)`, and the oracle's
per-language judgment of "comprehensible sentence." The seed is the constellation's
central ring made principled: **ring size = `N*`**, derived from the language, not
chosen by feel.

### The capability ladder — the seed's internal structure

`N*` is not a single switch; the seed is a **graded ramp** through a sequence of
**grammatical-capability milestones**. Each milestone is a linguistic *universal*
(every language has it; only the unlocking atoms differ — Mandarin particles,
Arabic morphology, English word-order + auxiliaries), so `roleComplete` (§ above)
is really just the **M1** gate generalized into a ladder. The single number `N*`
becomes a **spectrum** `{N(M0), N(M1), …, N(M7)=N*}`, where `N(Mk)` = smallest `N`
whose top-`N` can express capability `k`. Same oracle, same per-language inputs.

| | Capability unlocked | What it lets the learner do |
|---|---|---|
| **M0** | Holophrasis | name / react (yes, no, hi) — complete utterance, **no syntax** ("resolution without sequence") |
| **M1** | **Predication** | assert a state/event — the **minimal proposition** (referent + self-standing predicate; the minimal "sequence + resolution") |
| **M2** | Polarity | deny / contrast — the first logical operator (truth-value) |
| **M3** | Interrogation | *seek* resolution — polar-Q then wh-Q; first **dialogic** turn |
| **M4** | Deixis / reference | point — situate the proposition in the shared world |
| **M5** | Modality | the irrealis — want / can / will / maybe |
| **M6** | Relation / possession | two-place predicates — "X has / is-at / 's Y" |
| **M7** | **Saturation = the knee** | frames dense enough that *any* new atom slots in (`N*`) |

**Floor note.** The minimal sequence-with-resolution (M1) is **2 atoms** in a
zero-copula language (Mandarin 我好), **3** where a copula is obligatory (English
"I am good"). The minimal-clause atom-count is per-language; the capability is
universal. M0 (1 atom) sits below the bar — complete but not a *sequence*.

**Why the ladder tracks `rank`.** Frequency reflects communicative load, and these
capabilities *are* what language is for, so the atoms that unlock each rung are
high-frequency by necessity. `rank` order ≈ capability order ≈ L1 child-acquisition
order (name → two-word → "no" → questions → this/that → want → mine). The three-way
convergence is the tell that the ladder carves a real joint.

**The structural surprise (Mandarin instance), and its consequence.** Placing the
rungs on actual ranks reveals two sub-regions of the bootstrap:
- **Scaffold valley (≈ rank 1–16):** almost pure glue/reference (particles,
  pronouns, negation, deixis, copula, possessive 的 at rank 1, 在/有) — but **no
  complete proposition is possible**, because no self-standing predicate has
  arrived. Hardest, least-rewarding stretch; pure deferred gratification.
- **Capability cascade (≈ 17–30):** the first predicate (好/来/去, ~rank 17) lands
  on the waiting scaffold and capabilities unlock in rapid succession; the knee
  (~30) is where the cascade saturates.

**Consequence — the seed bootstrap is milestone-driven, not strict-`rank`.** Strict
frequency order forces the learner to grind all ~16 scaffold atoms before their
first complete sentence — the worst motivation curve. Instead, **front-load a
predicate to cross M1 early** (pull 好/来 forward a dozen ranks) so a true, complete
sentence — the first real *win* — is reachable almost immediately; then let the
cascade run. The seed's deviations off `rank` are driven by **capability
thresholds**, the seed-phase form of the pull scheduler (pulled by milestones, not
individual sentences). Two further hooks: the post-seed context-availability router
(see ROADMAP, context-first inversion) reads the **milestone level** an atom sits
in (which frames it can be interrogated in), not a binary yes/no; and the milestone
ladder is the natural **learner-facing progression spine** ("you can now ask
questions / negate / talk about wanting") — far more motivating than a word count,
especially across the scaffold valley where the game layer must carry the most
weight.

### Status & scope — the deviation is gated, justification is per-language [2026-06-18]

**The milestone-driven deviation from `rank` is a SPECTRUM, not a universal — and
for Mandarin it is gated OFF (pure Zipf).** Measured on a real Mandarin session
(frontier 14): the generativity bias would pull a predicate forward only ~2 ranks
(那→来) because Mandarin is **isolating** — atoms are words, predicates surface
near the top of `rank`, so the valley is shallow and Zipf crosses it on its own.
Breaking the rank invariant for a 2-rank gain is not worth it. The `introUnlockBias`
mechanism ships but is gated behind a per-course `introBias` flag (no course sets
it); the Mandarin introduction path is pure `rank`.

**What governs valley depth** (carry this abstraction forward — it predicts where
the deviation earns its keep):
- *Is there a comprehensible sub-word unit?* Isolating (Mandarin, Vietnamese) →
  shallow. Polysynthetic (Navajo, Inuktitut) → **deepest** (no morpheme below the
  verb-complex means anything; frequency over morphemes yields meaningless affixes).
- *Zero-copula present predication?* Russian, Arabic-nominal, Mandarin-adjectives
  reach M1 early → shallower than expected.
- *Frequency fragmentation* (fusional: Spanish/Russian split a lemma across
  inflections, sinking predicate ranks) → deeper, but top irregulars resist it →
  **moderate, not extreme**.
- *Obligatory bound morphology* (agglutinative: Turkish/Korean/Finnish) →
  moderate-to-deep.

So payoff scales with morphological synthesis + fragmentation, peaking at
polysynthetic and ≈0 at isolating. **The meta-lesson:** do not justify a deviation
from a clean invariant (`rank`) on its weakest instance; **measure valley depth per
language first.** Re-evaluate this whole sub-theory deeply at the first non-isolating
target — **Arabic** (Semitic, root-and-pattern: shallow nominal predication, deep
verbal morphology) is the natural forcing function and first real measurement.

### Open / fit
- `θ` (or `ε`); whether `G` weights *diversity* of grammatical frames over raw
  count (50 sentences all of frame "X 是 Y" are less generative than 20 across
  frames).
- Strict prefix vs. allowing a rank-adjacent swap to fill a missing skeleton role
  (prefix keeps it Zipf-honest; `roleComplete` already handles the common case by
  growing `N`).
- Calibrating the oracle's producible-count against held-out corpus short-sentence
  coverage.

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

## 12. Bases — the frequency/generativity dissonance (CORE PROBLEM)

Zipf is only **one** ordering principle, and on its own it is the wrong one for a
tool whose goal is *production*, not just comprehension. There are (at least) two
distinct **bases** — spanning sets — over the same atom inventory, optimizing
different things:

- **Frequency basis (Zipf):** rank by comprehension utility — each atom, in order,
  unlocks the most text. "How much will this let me *understand*."
- **Generative basis:** the minimum set of atoms that **closes the grammar's clause
  templates** — one filler per obligatory grammatical role. "What lets me *build* a
  sentence." Frequency does not care whether you've covered the copula, a negator,
  a classifier, or a question particle, so the top-N frequent words are **not**
  guaranteed to form a sentence.

**The dissonance between these two bases is a core problem of the project.** A
pure-Zipf curriculum can leave the learner "knowing" N words yet unable to produce
a single grammatical clause.

### 12.1 Formalizing the generative basis

Model a language as a sequence of **construction tiers** `T1…Tk` ordered by
structural complexity, each a set of clause templates over obligatory **roles**
(closed-class functions + open POS slots). The minimum generative basis for a tier is

> **μ(Tᵢ) = minimum-cardinality set S such that every obligatory role in Tᵢ's
> templates has ≥1 filler in S** — a set-cover / hitting-set problem.

The capability ladder is the nested sequence `μ(T1) ⊆ μ(T2) ⊆ … ⊆ μ(Tk)`; `|μ(Tᵢ)|`
is each milestone's size (the formal underpinning of the M0–M7 ladder, §8-ter).
The set-cover **algorithm is language-general**; the per-language **grammar spec**
(templates → roles) is the language module (deck-gen Phase 0). Tie-break the cover
toward **high-Zipf fillers** — that tie-break is where the two bases reconcile:
generativity decides *which roles*, frequency decides *which atom per role*.

Crucially this is no more expensive than Zipf: the same LLM that yields frequency
rank yields the grammar spec and role tags. Implemented as
`computeGenerativeBasis(deck, spec)` / `GRAMMAR_SPEC_ZH` in `data.js`.

### 12.2 Measured on the Mandarin deck (2026-06-19)

Tiers T1…T5 (predication → transitive/neg/Q → modify/quantify → adjunct/aspect →
complex), computed against the 114-atom deck:

| Tier | basis size | deepest Zipf rank | reach ratio | freq-deferred |
|---|---|---|---|---|
| T1 basic predication | 6 | 69 | 11.5× | — |
| T5 **complex sentences** | **16** | **75** | **4.69×** | 好,没,上,很,也,和 |

- **The whole ladder to complex sentences is 16 atoms** — far below the deck, and in
  a real corpus far below the Zipf knee (hundreds). *Production capability is cheap;
  comprehension breadth is expensive.* Generative milestones arrive long before
  frequency milestones.
- **Reach ratio 4.69×** = the 16-atom basis must dip to frequency rank 75 to close.
  This single number **is** the dissonance.
- **~38% of the basis (6/16) is frequency-deferred** — a pure-Zipf learner of the top
  16 words would *lack* 很(69, degree adv), 也(74), 和(75, conjunction) and could not
  say "我很好" or conjoin clauses. That is the production gap of a frequency-only
  curriculum, measured.

Mandarin is the **low-dissonance** baseline (isolating → function words stay
frequent). The reach ratio is expected to blow up in fusional/agglutinative families
where required morphology is rare relative to its structural necessity — the
abstraction to learn at the first non-isolating language (Arabic). The metric is the
transferable instrument; the absolute ranks are deck-specific.

### 12.3 Product consequences

- **Principled "when to break Zipf":** deviate from frequency order exactly enough to
  complete the current tier's minimum cover — and no more. This is the rigorous
  version of front-loading (previously gated off as arbitrary). It makes the learner
  *productive within the first session* — a "win" becomes "I made a sentence," which
  is the engagement coupling (see engagement-ethics).
- **Generative basis gates modality availability:** cloze / word-order / sentence
  modalities (the higher-evidence channels, `MODALITY_PROFILE`) are only *possible*
  once their tier's basis is covered. `sentenceAllIntroduced` is the crude current
  proxy; the basis is the principled gate.
- **Seed vs post-knee deck, defined:** the seed deck ≈ the union of the small bases
  (generative ∪ phonological ∪ pragmatic), Zipf-tie-broken; the post-knee deck is the
  Zipf long tail.

### 12.4 The lattice of bases (other spanning sets)

The curriculum is a scheduling over a **lattice of bases**, each a different
optimization on the same atoms — generalize across families by composing them:

1. **Frequency** (Zipf) — comprehension utility.
2. **Generative** (grammatical role cover, tiered) — production capability. *(§12.1)*
3. **Phonological / orthographic** — min atoms covering the phoneme/tone inventory and
   writing-system primitives (Mandarin radical/component set; Arabic letterforms).
4. **Morphological** — min morphemes/affixes that close inflection (trivial for
   isolating Mandarin; load-bearing at Arabic).
5. **Semantic-field covering** — min atoms to refer across core domains ("survival vocab").
6. **Pragmatic / discourse** — speech-act + politeness primitives (greet, affirm/deny,
   request, question) — minimum to *participate in an exchange*.
7. **Construction / dependency** — atoms covering the most distinct bigram/dependency
   constructions (the information-theoretic cousin of #2; better empirical generativity proxy).

The **pre-linguistic categories** (SELF/OTHER, EXISTENCE/IDENTITY, NEGATION, QUANTITY,
DEIXIS, core predicates/entities) are the shared scaffold that bases 2, 5, and 6 project
onto: they *are* the role-dimensions, the generative basis is one lexeme per category,
and this is the concrete mechanism behind the "universal core + pluggable language
module" thesis — language-agnostic at the category level, language-specific only in
surface lexicalization and grammar spec.

---

*Relates to: `CLAUDE.md` (invariants), `ROADMAP.md`, the product thesis
(Zipf-graded universal core), the context-pivot timescale philosophy
(count-within / time-between), and the aptitude/IRT measurement vision
(`L` as substrate).*
