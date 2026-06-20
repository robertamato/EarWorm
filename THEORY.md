# Earworm — Formal Theory

*The rigorous version. For the plain-language overview see [VISION.md](VISION.md);
for SRS-engine internals (cold engine, evidence log, fibered poset) see
[ACQUISITION_MODEL.md](ACQUISITION_MODEL.md). This document is also the **language
instantiation spec** — §7 is the recipe for adding a language.*

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
cold/hot split, and the evidence log: ACQUISITION_MODEL.md.)

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

---

## 10. Implementation pointers

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
| Engine internals | — | ACQUISITION_MODEL.md |
