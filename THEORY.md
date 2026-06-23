# Earworm — Formal Theory

> **Scope — the framework.** *What* to teach, in what order, for a given (L₁,L₂) pair,
> and what counts as *knowing* it. Canonical for the φ/γ/σ cost measures, the generative
> basis, substitution, the production-gate definition of knowing, the framing lenses, and
> the **language-instantiation recipe** (§7 — the spec for adding a language).
> **Plain-language version:** [VISION.md](VISION.md). · **The engine that executes this**
> (state, measurement, scheduling): [ENGINE.md](ENGINE.md).

---

## 0. Objects

Fix a target language **L₂** and a learner's native language **L₁**.

- **Atom set A** — the units of acquisition (lexemes/morphemes/characters). Each
  `a ∈ A` is a teachable item.
- A learner's **state** assigns each atom per-axis progression (see §5).
- **Construction tiers** `T₁ ⊂ T₂ ⊂ … ⊂ T_k` — sets of clause templates ordered by
  structural complexity (predication → transitivity → modification → adjuncts →
  embedding). Each template is a sequence of obligatory **roles** (closed-class
  functions + open-class POS slots).

Three real-valued measures are defined on A. They are **orthogonal**, and the
curriculum is a scheduling that optimizes their combination.

---

## 1. Axis 1 — Frequency φ

`φ(a)` = the corpus frequency rank of `a` (Zipf). Low rank = high comprehension
utility: learning atoms in φ-order maximizes text coverage per atom. This is the
classical, solved axis (any LLM emits it). On its own it optimizes **comprehension**
and is silent about production.

---

## 2. Axis 2 — Generativity γ (the generative basis)

Frequency does not guarantee you can form a sentence: the top-N atoms by φ need
not cover the obligatory roles of any clause template (no copula, no negator, no
question particle → no grammatical clause).

**Generative basis.** For tier `T`, define

> `μ(T) = argmin |S|` subject to: every obligatory role in every template of `T`
> has ≥1 filler in `S`.

This is a **minimum set-cover / hitting-set** problem. The nested sequence
`μ(T₁) ⊆ … ⊆ μ(T_k)` is the **capability ladder**; `|μ(Tᵢ)|` is milestone `i`'s
size. Tie-break the cover toward low-φ (frequent) fillers — **that tie-break is
where Axes 1 and 2 reconcile: γ selects the roles, φ selects the filler per role.**

**Span vs. basis.** μ is a *generating set*; the **span** is the (much larger,
possibly infinite under recursion) set of well-formed sentences it produces under
the grammar. Generativity-as-yield = |span|; generativity-as-cost = |μ|. The
learner's production repertoire is the span; the curriculum target is the basis.

**Dissonance metrics.** Frequency order and generative order diverge. Quantify:
- **reach ratio** = (deepest φ-rank in μ(T)) / |μ(T)| — how far past its own size the
  basis must reach into the frequency list.
- **frequency-deferred fraction** = |{a ∈ μ(T) : φ(a) ≥ |μ(T)|}| / |μ(T)| — the share
  of the basis a same-size pure-frequency curriculum would *lack*.

**Measured (Mandarin, 114-atom deck, `computeGenerativeBasis()`):** complex-sentence
basis μ(T₅) = **16 atoms**, deepest rank 75, **reach ratio 4.69×**, frequency-deferred
**38%**. Interpretation: production capability is cheap (≪ the Zipf knee); generative
milestones arrive far before frequency milestones. Mandarin is the *low-dissonance*
(isolating) baseline; reach ratio is expected to grow in fusional/agglutinative L₂.

### 2.1 The seed — the canonical minimal generative deck

The smallest deck that satisfies the *production* requirement is not a frequency deck —
it is the generative basis itself: **the seed**.

> **seed(L) = a tie-broken minimum set-cover over the universal role set** — one filler
> per obligatory role across the construction tiers (~6 atoms for basic predication,
> ~16 for complex sentences).

Three levels, which must not be conflated:
- **The role set is universal and unique.** The obligatory roles (referent, predicate,
  copula, negator, classifier, Q-marker, …) are the pre-linguistic categories (§3) — the
  *dimensions*. Every language's seed covers the same roles.
- **The cover's *size* is canonical** per language (the min cardinality).
- **The *membership* is NOT unique.** Many minimum covers exist (several atoms can fill a
  role); the seed is one *representative* of that equivalence class, fixed by a TIE-BREAK.

**The tie-break is where the three axes negotiate.** A φ-tie-broken seed takes the most
*frequent* filler per role; a σ-tie-broken seed takes the *cheapest-to-learn* (lowest
substitution distance) filler. So "the seed" is not a single object until you name the
tie-break, and different tie-breaks yield different optimal seeds (frequency-optimal vs.
effort-optimal). The role structure is the invariant; the membership is the optimization.

So the seed is the **first target of language instantiation** (generate the seed, not a
deck), the **unit of cross-language comparison** (compare seeds like-for-like), and the
categorical opposite of "the top-N frequent words" (the seed-vs-post-knee distinction, §6).

---

## 3. Axis 3 — Substitution distance σ (the L₁→L₂ diff)

Acquisition is not learning L₂ from zero — the learner owns a complete generative
engine (L₁). The true cost of an atom is its distance from L₁, not φ or γ.

`σ_{L₁}(a) ∈ [0,1]` with class:
- **transparent** — same concept/role/combination, relabel only (positive transfer,
  ~free). `σ ≈ 0.15`.
- **divergent** — no clean L₁ analog / new category (the real learning load, no
  crutch). `σ ≈ 0.7–0.9`.
- **false-friend** — looks substitutable, misfires (negative transfer; must
  *un-learn* the reflex). `σ ≈ 0.85–1.0`; carries an explicit *do-not-substitute*
  flag and gets contrastive correction, never scaffolding.

**Effective basis** = the divergent + false-friend subset of μ; transparent atoms
are near-free. **Effective load** = `Σ σ(a)` over μ.

**Measured (English→Mandarin μ(T₅), `computeThreeAxisBasis()`):** 7 transparent /
6 divergent / 3 false-friend → real load 9 atoms, effective load 9.05/16 — the L₁
crutch removes **~43%** of nominal work. σ is **L₁-specific**, so:

> **The curriculum is an operator C(L₁, L₂) on the language *pair*** — the diff —
> not a function of L₂ alone. Aggregate σ over μ ≈ typological distance ≈ predicts
> time-to-fluency and informs second-language choice.

The universal core (pre-linguistic categories: self/other, existence, negation,
quantity, deixis, core predicates/entities) supplies the **role-dimensions**; the
language module supplies L₂'s lexicalization + grammar spec + the σ map vs L₁.

### 3.1 Classification rubric (so σ is reproducible and L₂-comparable)

σ is only useful as a *comparison* (the C(L₁,L₂) delta across language pairs), and a
comparison is only as sound as the classification process is consistent. The rubric:

**Scope — what σ measures, and what it EXCLUDES.** σ is the cost of the **meaning +
grammatical-category mapping** from L₁ to L₂ for an atom. It deliberately excludes
three things that belong to *other* axes, because folding them in would make pairs
incomparable (e.g. a Latin-script L₂ would look artificially cheaper than a
logographic one):
- **phonology** (tone, pronunciation difficulty) → the phonological basis (§6.3).
- **orthography** (script, character form) → the orthographic basis (§6.3).
- **template-level word order / construction placement** → the grammar spec / γ (§2).
  (So an interrogative pronoun whose only divergence is *in-situ placement* is
  transparent — the *category* exists in L₁; the placement is a construction.)

**Class — decided by the TRANSFER relationship, not by raw difficulty.** Ask: does the
learner have an L₁ instinct here, and does it help or hurt?
- **transparent** — L₁ has an atom with the same concept *and* grammatical category;
  transfer-then-relabel yields correct L₂ in the core cases. *Positive transfer.*
- **divergent** — L₂'s atom belongs to a category/distinction L₁ **lacks**; there is no
  L₁ atom to transfer from, so it is learned as new. *No misleading instinct.*
- **false-friend** — L₁ has a salient atom the learner **will** reach for, but it
  misfires (partial/conditional mapping; one-L₁-to-many-L₂ confusable; misleading
  default sense). *Negative transfer* — must be un-learned.
- **Discriminator (divergent vs false-friend):** *is there a tempting-but-wrong L₁
  instinct?* No → divergent. Yes → false-friend. (False-friends often cost ≥ divergent
  because suppression+correction is harder than fresh acquisition.)

**Distance d ∈ [0,1] — learning cost WITHIN the class:**
- transparent **0.15–0.45** — 0.15 clean relabel; +up to 0.30 for peripheral divergence
  (polysemy, a divergent secondary use, an excluded placement quirk worth flagging).
- divergent **0.55–0.95** — 0.55 a distinction English partly analogizes; → 0.95 a wholly
  novel **obligatory** category (classifier, aspect particle). Score up by obligatoriness
  and how alien the category.
- false-friend **0.55–1.0** — 0.55 a mild, easily-corrected trap; → 1.0 a pervasive trap
  with a strongly-wrong instinct. Score up by frequency of the misfire and number of
  confusable senses.

**Compounds** are classified by the **compound's meaning** transparency (电话 electric-
speech → "telephone" maps cleanly → transparent), not by morphological novelty (a
separate axis).

This rubric is applied identically to every (L₁,L₂) pair. The EN→ZH map
(`SUBSTITUTION_EN_ZH`) is the rubric-governed baseline; EN→VN will be derived the same
way, and the **σ-delta between them is only interpretable because the procedure is
fixed**. (Caveat: still a single-author pass — independent validation is the next rigor.)

---

## 4. Two orthogonal axes of the whole problem

A common confusion collapses two independent questions. Keep them apart:

- **Axis A — what to teach / in what order.** Everything above (§1–3), the lattice
  of bases (§6), the framing lenses (§8). Content.
- **Axis B — how you practice it / what counts as KNOWING.** Recognition < cued
  recall < free production from intent.

**The Duolingo trap is an Axis-B failure.** No choice of basis on Axis A fixes a
practice-mode failure on Axis B. Formally, define knowing behaviorally (we cannot
observe internal comprehension, only communicative success):

> **Knows(a) :⇔ ∃ a production from intent containing `a` that a competent listener
> comprehends.**

This is the externalist/Turing criterion ("do you *speak* L?"). The **production
gate**: graduation to "known" requires a free-production event judged by a competent
listener (the LLM, in single-turn form; humans/AI in the eventual conversational
layer). Recognition modalities are for *learning*; the production gate is for
*knowing*. The generative basis (§2) is the **precondition** for production practice
(you cannot produce a sentence whose roles you haven't covered) — necessary, not
sufficient. Substitution scaffolding (§3) provides the *fading* L₁ crutch on the
on-ramp to the gate.

---

## 5. The scheduler — information-seeking on the frontier

Per atom-axis, the model maintains a posterior of correct retrieval:

`P(a, axis, modality)` — a stage prior, blended toward empirical recent accuracy,
decayed by overdue-ness toward a recognition floor, then shifted down by the
modality's intrinsic difficulty (`MODALITY_PROFILE.diff`). (`Scheduler._pCorrect`.)

**Information value** = binary entropy `H(P) = −P log P − (1−P) log(1−P)`, maximized
at `P = 0.5`. The **triple coincidence**: `P ≈ 0.5` is simultaneously
- the maximally **informative** query (active learning / max entropy),
- the **zone of proximal development** (desirable difficulty), and
- the maximal **reward-prediction-error** (dopamine).

So the highest-value, most-educational, most-engaging card is the same card, and it
sits at the edge of what the learner almost knows — an edge that recedes as ability
rises. **Frontier-seeking selection** serves due cards by descending `H(P)` within
an in-acquisition priority, with hard gates: never test before first exposure;
never test within a card's initial spacing interval; never repeat the immediately
prior card (these are encoded as standing invariants, `simInvariants()`).

**Graduation = evidence-channel filter-crossing.** Channels are ordered
recall < discrimination < incidental; a correct on a harder modality carries more
evidence (`MODALITY_PROFILE.ev`) and advances progression faster. (Full SRS engine,
cold/hot split, and the evidence log: ENGINE.md.)

**Adaptive load.** The count of simultaneously in-acquisition atoms is capped
(working-memory bound); the cap flexes with recent accuracy. *Known open problem:*
a chronically un-graduatable cluster (typically high-σ divergent atoms) can hold the
cap and freeze the frontier — observed live; the fix (parking / scaffolding hard
atoms so they don't block) is unspecified here.

---

## 6. The lattice of bases

Generalize across language families by composing several spanning sets over A, each
a different optimization:

1. **frequency** (§1) — comprehension.
2. **generative** (§2) — production capability.
3. **phonological / orthographic** — minimal cover of the phoneme/tone inventory and
   writing-system primitives (Mandarin radical set; Vietnamese diacritics/tones;
   Arabic letterforms).
4. **morphological** — minimal morphemes closing inflection (trivial isolating;
   load-bearing fusional/agglutinative).
5. **semantic-field covering** — minimal reference across core domains ("survival").
6. **pragmatic / discourse** — speech-act + politeness primitives (greet, affirm/deny,
   request, question) — minimum to participate in an exchange.
7. **construction / dependency** — atoms covering the most distinct dependency
   constructions (information-theoretic cousin of §2).

The **seed deck** ≈ union of the small bases (generative ∪ phonological ∪ pragmatic),
φ-tie-broken; the **post-knee deck** = the φ tail.

---

## 7. Instantiating a language module (the generation recipe)

To add L₂ for learners of L₁, produce four artifacts — all LLM-emittable, since the
model holds both languages:

1. **Lexicon with φ** — atom list ranked by corpus frequency.
2. **Grammar spec** — the tiered construction templates `T₁…T_k` as obligatory-role
   sequences, plus the role→POS/function mapping. (Implemented for Mandarin as
   `GRAMMAR_SPEC_ZH`.)
3. **Substitution map σ_{L₁→L₂}** — per atom/cluster: class ∈ {transparent, divergent,
   false-friend} + distance + a contrastive note (the *do-not-substitute* flags).
   (Implemented for EN→ZH as `SUBSTITUTION_EN_ZH`.)
4. **Generative-basis sentence set** — example sentences constructed *from the
   generative basis* (so they respect the introduced frontier — the failure mode in
   the static Mandarin deck was sentences containing out-of-frontier words, which
   blocked all context).

Given these, `computeGenerativeBasis` / `computeThreeAxisBasis` and the scheduler run
unchanged. **Validation:** the EN→Vietnamese substitution profile should differ
measurably from EN→Mandarin (no logographic script, Latin-based Quốc Ngữ, distinct
tone system) — measuring that delta against the Mandarin baseline is how we confirm
`C(L₁,L₂)` generalizes rather than overfits.

> **Done, for Vietnamese.** All four artifacts exist (`D_VI`, the VN seed mirroring
> `GRAMMAR_SPEC_ZH`, an inline EN→VN σ-map, `EXAMPLE_SENTENCES_VI`), the engine ran
> unchanged, and the σ-delta came out as predicted (EN→VN lighter). The *one* engine
> change the port forced was below this recipe — the **segmentation seam** (atom ≠ CJK
> character). That field report is [MIGRATION.md](MIGRATION.md): which assumptions were
> "language" vs secretly "Mandarin," and what a typologically distant language breaks next.

---

## 8. Framing lenses (orthogonal to the lattice)

The lattice (§6) asks *which spanning set*; a lens asks *what objective frames the
whole endeavor*. Any lens runs over any basis.

1. **algebraic** — generators (basis) vs. span (generated language).
2. **information-theoretic / MDL** — find the codebook minimizing description length
   of the corpus: `min(lexicon + grammar + residual)` bits. **Unifies the
   dissonance into a single objective** (frequency → short codes; productive patterns
   → factored rules); turns "when to break frequency order" into a gradient. *The
   lens to chase.*
3. **type-theoretic** — typed atoms (n : e, vᵢ : e→t, det : (e→t)→…); a sentence is a
   well-typed term of type `t`; basis = minimal combinators reaching `t`. Makes
   composition first-class (stricter than role-coverage).
4. **economic / Pareto** — atoms with cost (≈σ) and dual return (comprehension,
   production); curriculum = the efficient frontier. Makes the frequency-vs-generativity
   trade an explicit tunable.
5. **developmental** — match the empirically attested acquisition order; the reality
   check on the formal optima.
6. **geometric** — atoms as embedding vectors; basis = spanning the semantic
   dimensions; exposes redundancy (same direction) and gaps (uncovered direction).

---

## 9. Engagement coupling (the licensing rule)

A casino/compulsion mechanic `m` is permitted **iff** it passes both:
- **Coupling test** — the feeling of winning tracks real learning (bans losses-
  disguised-as-wins and fabricated near-misses; honest proximity is fine).
- **Dose test** — does not drive harmful *quantity* even when coupled (so we invert
  the casino on time-shape: maximize per-session intensity + return, cap duration).

The mechanic is morally neutral; the *coupling* determines its ethics. The manipulation
is earned by the quality of the instruction — licensed exactly to the degree the
learning under it is real. **Build the coupling (teaching at P≈0.5) before the
dopamine (the wager).** The wager itself is a calibration market: the house posts a
line `P_algo`, the user bets `P_user`, and the measured/rewarded quantity is the gap
`Δ(P_user, P_algo)` under a proper scoring rule — a language-agnostic skill game that
survives mastery of L₂.

### 9.1 The wager collapse — one line, two scales

The system carried **two** multipliers, and only one is justifiable.

- **Streak multiplier** (`S.mult`, `naturalMultIdx`): XP scaled by consecutive-correct.
  *Anti-coupled and to be removed.* Consecutive-correct correlates with *easy* cards,
  so it pays most for the lowest-information answers — fighting the edge bonus in
  `computeXP`, which (correctly) pays for *beating a low line*. Two reward signals
  pointing opposite ways; this one points wrong.
- **Wager slider** (`currentMultIdx`, anchored to `houseLineIdx`): justifiable, but its
  job is **measurement, not reward**. It elicits `P_user` against the house's `P_algo`;
  `currentMultIdx − defaultMultIdx = Δ(P_user, P_algo)` is the calibration signal.
  Framing a measurement instrument as a reward amplifier is the reward≠measurement
  violation (§11.0). Its reward role is already subsumed by the losable chip stake.

**Collapse:** one slider = *post your line*. It sets a losable chip stake, scored by a
**symmetric** proper rule (credits calibration in both directions — correctly betting
*below* a high line, "I know that I don't know this", is half of calibration and the
one-sided `edge = max(0, w−def)` misses it). No streak multiplier; XP, if kept, is flat
or information-weighted, never streak-multiplied. The same market re-appears at the
capability scale as the Title Defense (§11.3).

---

## 10. Measurement renders — the estimator and its projections

The features we keep "discovering" — a diminishing-returns curve, capability badges, a
title-defense challenge — are not three subsystems. They are three **renders of one
object**: the model's posterior over the learner's latent state, and its information
gradient. The ingredients already exist but scattered (`_pCorrect`, `retrievability`,
axis stage, `axisDue`); §10 names the single thing they compose and reads everything
off it. One source of truth ⇒ the badge and the curve cannot tell different stories.

### 10.0 Two guardrails (inherited)

- **reward ≠ measurement.** Every object below *measures* retained capability. None may
  become a reward target, or it is Goodharted exactly as the old daily-goal quota was.
- **hot-log / cold-infer.** Live, session-local quantities (the micro yield curve) may
  be computed on the fly; anything that persists or drives scheduling (tenure, ripening)
  is a **cold inference** over the evidence log — never a live double-written counter.

### 10.1 The Yield Curve (session render)

For a card `i` served at session-position `n`, realized learning gain is a product of
two non-increasing factors:

```
ρ(n) = φ(n) · v(c_n)
```

- `φ(n)` — encoding quality (fatigue), 1 → floor over the session (`fatigueXPMultiplier`).
- `v(i)` — the card's instantaneous value, **the scheduler's own selection criterion**:
  `v(i) = P_i · ΔS_i(R_i) + g₀·[first exposure]`, where `ΔS` (stability jump on success)
  rises as retrievability `R` falls but `P` falls with it ⇒ product peaks at intermediate
  `R` (desirable-difficulty / the P≈0.5 edge the frontier-seek already targets).

The scheduler serves greedily by `v`, so `v(c₁) ≥ v(c₂) ≥ …`; times non-increasing
`φ` ⇒ cumulative `V(N) = Σ ρ(n)` is **concave with a knee** near `n ≈ D + M` (the
genuinely-due set plus the cap-limited introduceable atoms). **The diminishing-returns
plot is literally the running integral of the scheduler's value function being depleted**
— no new model.

Uses, not just a readout: (1) **self-terminating sessions** — stop when `ρ(n) < τ`;
(2) the **window is predictable at session start** (count cards with `R` in the
productive band + introduceable atoms), so the whole curve and the learner's live
position can be drawn ahead of time; (3) the **macro cadence is free** — overnight `R`
decay refills the due set, so "≈14 ripe tomorrow" is computable. This *replaces the
daily-goal bar*: a rising/flattening curve whose flattening is the honest "come back
tomorrow", never a quota. It is also the **dose-test instrument** (§9): you cannot pass
a dose test without a dose-response curve.

### 10.2 Capability milestones (lattice render)

The old milestones were frequency-rank counts (`[10,50,…]`, labels like "advanced") —
they report *how many words*, never *what you can do*. Replace with the generative-basis
tiers (`GRAMMAR_SPEC_ZH`, §2): each tier is the min set-cover closing a clause template,
i.e. *a capability*. A **capability badge fires on a filter-crossing in the poset** — the
tier's basis atoms **graduated** (not merely seen) — and is the right milestone unit.

| Badge | Tier | Capability | Now-producible |
|---|---|---|---|
| PREDICATE | T1 | say what something *is / is like / does* | 我是人 · 我很好 |
| NEGATE & ASK | T2 | deny, ask yes/no | 我不是学生 · 你好吗 |
| MODIFY & COUNT | T3 | possess, modify, quantify | 我的书 · 一个人 |
| PLACE & ASPECT | T4 | locate, mark completion | 我在学校 · 我去了 |
| CONNECT | T5 | join clauses | 我也去 |

Each badge carries: a *true* capability name; one concrete now-producible sentence;
**effort-to-next = σ-weighted effective load** of the next tier's un-graduated atoms
(`computeThreeAxisBasis`, *not* a raw count — 3 transparent atoms ≪ 3 false-friends);
and the next tier's capability line. **Production-gated:** the badge requires not just
graduation but ≥1 successful *production* at the tier — otherwise it is a recognition
badge masquerading as capability (the coupling failure of §12). A quiet secondary
**coverage** track keeps the frequency counts, reframed to a defensible Zipf claim
("≈X% of running text"). Capability (sparse, loud) + coverage (smooth, quiet) renders
the basis-vs-frequency dissonance (§4) as the curriculum it is.

### 10.3 Title Defense (uncertainty render) — the macro calibration market

Badges do **not decay** (the trophy is permanent), yet the *claim* stays honest, because
the house can **challenge** it. We re-measure, we do not revoke — the reward≠measurement
split made diegetic. It is the §9 calibration market lifted to the capability scale:

- The house tracks **tenure** = P(capability still held), a *cold* inference over the
  tier's atoms' forgetting curves. When tenure crosses a threshold (the model is willing
  to post the bet that you've regressed) it issues a **Title Defense**: a short bout of
  the tier's atoms at production modalities — a proof, not a re-grind.
- **Win** ⇒ reaffirmed, tenure resets, the decayed atoms re-consolidate (the defense *is*
  the optimally-timed spaced review); badge gains a gleam. **Decline/lose** ⇒ a visible
  **CONTESTED** state (still held, marked), re-issued later. **Never a lockout** — study
  is never gated behind the meta-game.
- Chips may *optionally* ride a defense (house posts odds = its P_regressed); declining
  never blocks the bout. Preemptive "defend now" is allowed (user-initiated spaced
  review), but the core trigger stays house-initiated — the SRS knows when review is due.

The deep payoff: the defense **calibrates the engine**, not only the user. A challenge
the user trivially wins means the forgetting model fired too early — a tuning signal
validating `retrievability` predictions against ground-truth retrieval. It is a
measurement pointed at the cold engine, closing a loop the cold-infer layer needs.

---

## 11. Implementation pointers

| Concept | Symbol/object | Code |
|---|---|---|
| Frequency | φ | deck order |
| Generative basis | μ(T) | `computeGenerativeBasis`, `GRAMMAR_SPEC_ZH` |
| Three-axis load | φ×γ×σ | `computeThreeAxisBasis`, `SUBSTITUTION_EN_ZH` |
| Posterior / line | P(a,axis,mod) | `Scheduler._pCorrect` |
| Information value | H(P) | `Scheduler._entropy`, frontier-seeking in `_pickFromPools` |
| Modality evidence/difficulty | ev, diff | `MODALITY_PROFILE` |
| Invariant battery | — | `simInvariants` / `window.simCheck` |
| Wager / coupling | Δ(P_user,P_algo) | `houseLine*`, `computeXP`, chips |
| Latent-state renders | posterior + ∇ | §10 (yield curve, badges, defense) |
| Engine internals | — | ENGINE.md |

---

## 12. The load-bearing unbuilt thing — the production bar

> Full v1 spec: [PRODUCTION.md](PRODUCTION.md) — the production *modality* (the Build
> consumer), inline in study, R1+R2, haiku-graded, gate-off and feedback-weight-low.

Every honest claim in §10 — a capability badge, a Title Defense verdict — is gated on a
**production** measurement. The top production modality today is tile-assembly
(word-order), which §4 flags as **exposed to the Duolingo trap**: rearranging tiles with
the L₁ gloss visible can be passed without the productive system closing or the L₁ crutch
fading (§3). So the system is poised to mint true-*looking* capability certificates, and
stage gym battles to defend them, on an asset that may not back the claim. The badge says
"you can negate"; the bout it survived was tile-shuffling with the answer in view.

This is the **highest-leverage work**, above any render in §10: make the production bar
real — free production, L₁-crutch *faded* — because it is the latent variable every other
feature attests to. None of the §10 renders currently measure crutch-independence; they
measure retained recognition and *call* it capability. The realistic grader for free
production (and the only honest "house" for the wager) is the **LLM backend** (build
plan): design the production bar assuming that grader, not a tile proxy we will discard.

**Sequencing consequence.** Per §9 (coupling before dopamine): ship the
honest-measurement renders now — the **Yield Curve** and **capability *labels*** as
projections of the §10 estimator. Hold the **game layer** — Title Defense and the wager
market — *behind* the production bar. Build the sport before the gym that scores it. The
build order is therefore: (1) name the estimator + ship its measurement renders;
(2) make the production modality real (LLM-graded free production, crutch-fade metric);
(3) only then the Title Defense + collapsed wager that sit on it.

---

## 13. The negative space — contrast, the confusion graph, and the dealer

Everything above is positive: which atoms to teach (§2), how well each is held (§10). But
acquisition itself is **differential**. Saussure: *"in language there are only differences
without positive terms."* An atom has no positive essence; its value is its position in the
web of contrasts — *what it is not*. The learner doesn't store `tôi` as a thing; they pin
it by its boundaries against `đi`, `là`, everything else. **The thing being learned is the
difference-structure.**

So the **confusion graph is the spine, not error-handling.** Every wrong answer writes a
directed edge `correct → chosen · type` (`opposite`/`neighbor`/`false-friend`); a clean hit
decays it. The graph is the learner's *live boundary-fuzziness* — and it's the one organ the
rest read from: the **correction moment** writes it; **contrastive scheduling** interleaves
the pairs it lists; **distinctiveness-color** separates them; the **dealer** presses them;
the **estimator** reads error *type* (an `opposite` error is polarity inverted; a
`false-friend` error is L1 interference — different latent states than a binary miss).
Code: `recordConfusion`/`decayConfusion`/`confusionWeight`/`confusionEdges`, `S.confusion`.

**Contrast grain, not contrast presence.** Contrast is always the mechanism; what refines
is its *grain* — coarse category boundaries at bootstrapping (binary disambiguation, where
a first atom can't exist without a not-it), microscopic within-category distinctions at
mastery (near-synonyms, register). The grain is most salient/effortful at the two ends. The
`choiceCount` ladder (2→4→6) and the dealer's escalations *are* the contrast-grain axis.

### 13.1 The correction moment

A wrong pick is the highest-value encoding moment (hypercorrection effect — Metcalfe 2017),
wasted if rushed past. The moment: reveal **what the chosen option actually was** (the
boundary blurred — "person, people = người"), **hold** every other gloss, and require a
**manual selection of the correct answer** (active retrieval, riding the ERN window).
Clicking a held wrong reveals *it* too — learning by elimination, the negative space made
literal. The meta-game sting (chip loss) is quarantined and supplemental, never overriding
the teaching (coupling test, §9) — opt-in via the wager, the two layers semi-independent.

### 13.2 The dealer frame

The app is a **dealer betting against you knowing the card** (the analogy is exact — it
deals flashcards). The **house line** is `_pCorrect`; the **confusion graph is the dealer's
card-counting** — its private read on your weak boundaries. Crucially, *"maximize winnings"
resolves to good pedagogy*: a real house profits on **volume × edge**, keeping players at
the table losing *just* often enough to stay — which is P≈0.5, the exact frontier where
learning information is maximal. **The house's greed and the learner's growth are the same
objective when the edge is the learning edge** — the coupling test isn't imposed, it's the
dealer's profit motive. The **double-down** (a rare consumable: an extra high-confusion
distractor pulled from the graph, or *none-of-the-above* stripping the recognition crutch)
is the house pressing a read — and its **rarity is structural**: over-pressing empties the
table, so the dealer self-limits to keep you in the productive zone. **That is the dose test
(§9), made diegetic and self-enforcing.**

### 13.3 Color as distinctiveness, never meaning

The free card background routes a second perceptual channel into the trace — manufactured
synesthesia (trained grapheme-color association improves memory; Bor/Rothen/Seth 2014) +
dual coding (Paivio) + isolation (von Restorff). The design: **per-atom hue, consistent
within a session, randomized between** — within-session binding for distinctiveness,
between-session variation for encoding-variability (Bjork) that forces a context-independent
representation and forbids a durable crutch (synesthesia-as-scaffold, not -as-crutch). The
guardrail dissolves a tension: color must be **distinctiveness-only, never semantic** — a
semantic hue (POS-color) *carries decodable content* and so can mislead and be crutched;
a distinctiveness hue asserts nothing, so it has no error vector. And the **confusion graph
assigns it**: give maximally-separated hues to the atoms you actively confuse, so the
incidental channel disambiguates exactly the live-fuzzy boundaries — recall aid and
no-confusion guardrail in one. Measurement stays clean: graduation requires context
/production (color-independent) and survival across the nightly shuffle, so durable
capability can't be color-cued.

---

## 14. The object the lenses render — a structured atom set with a fibered state

The atom set `A` (§0) is not bare. Acquisition equips it with a **family of structures**, and
the constellation ("the fibroid") is a viewport that foregrounds one at a time — a **lens
engine**. Two kinds of structure, separated by what they depend on:

**Language structures** — intrinsic to the (L₁,L₂) pair and the corpus; *fixed per deck*, the
curriculum's substrate:
- **φ — frequency grading** (§1): a total preorder on `A` (Zipf rank).
- **γ — the generative basis / lattice of bases** (§2, §6): a graded poset, tiers
  `T₁ ⊂ … ⊂ T_k`, with a covering relation (which acquisitions enlarge generative reach).
- **POS partition**: an equivalence relation grouping atoms by syntactic class (a fibration
  over a POS base).
- **δ — the distributional metric**: a weighted graph on `A` from PMI co-occurrence over the
  example corpus, `δ(a,b) = log P(a,b) / P(a)P(b)`, with a community structure (label
  propagation). The empirical shadow of meaning ("a word by the company it keeps"); the σ
  axis (§3) is its (L₁,L₂)-relative cousin.

**Learner structures** — functions of the evidence log; *evolve with the learner*, the
estimator's posterior (§10):
- **The acquisition fibration** `π : E → B` (ENGINE.md §2): base = meaning, fibers = the
  dependent axes gated over the base; `state(a) ∈ E`. Its scalar graduation height is the
  **rung** (SEEN ≺ KNOWN ≺ DISTINGUISHED ≺ PLACED ≺ PRODUCED ≺ FLUENT) — base-, then-fiber-,
  then-production, a total-order refinement of the climb.
- **κ — the confusion metric** (§13): a learner-specific weighted graph — what *this* learner
  blurs. The negative space; the spine the estimator reads.

> **The object.** `(A, {φ, γ, POS, δ}, {π, κ})` — one atom set carrying four *language*
> structures (fixed) and two *learner* structures (inferred). The measurement renders (§10)
> and the lenses are **projections** of this single object; nothing in the UI is a new
> subsystem, only a new view.

**The lenses are projections.** A lens fixes a structure `S` and a layout `A → ℝ²` realizing
`S` on the **ground plane**; the **vertical axis Z is always the fiber height** — the rung of
`π` — *lens-invariant*. Switching a lens is a base-space reshuffle under a constant fiber: the
mastery landscape is held while the arrangement morphs. Current lenses: ANATOMY = POS ·
READING = φ · ENGINE = γ · TERRITORY = δ (+ its communities as islands) · WEB = κ · EDGE =
the frontier of `π` (the filter-crossing band). The atom card's rung ladder and a star's
elevation are therefore the **same coordinate, two renders**.

**Why the split matters.** The language structures *are* `C(L₁,L₂)` (§4) — the product moat,
authored per pair. The learner structures are the posterior — the personalization, inferred
per learner. The lens engine is that claim made visual: *here is your language as a fixed
shape, and here is you moving through it.*

> **The covering relation (pinned).** γ is a graded poset; its **covering relation** is
> authored on the roles: each `GRAMMAR_SPEC` role declares `covers` = the immediate generative
> prerequisite it attaches to (copula ▸ referent, aspect ▸ lexical-verb, numeral ▸ classifier,
> q-particle ▸ copula, degree ▸ adjective, …) — the *primary* dependency, not every one.
> `computeGenerativeBasis` resolves it to a per-atom DAG rooted at the referent; THE ENGINE
> draws it (the **Hasse diagram**). On the 16-atom Mandarin basis: 15 covering edges, all
> linguistically sound. So the lens now shows the order's *edges* (generativity as dependency),
> not just its *grading* (tiers). The relation travels with the role map, so it is per-(L₁,L₂).
