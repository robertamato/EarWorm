# Earworm — The Mandarin → Vietnamese Migration

> **Scope — the case study.** What the *first* port of the engine to a second language
> taught us: which assumptions were genuinely about *language* and which were secretly
> about *Mandarin*. A field report, not a spec. The framework is [THEORY.md](THEORY.md);
> the engine internals are [ENGINE.md](ENGINE.md); the plain pitch is [VISION.md](VISION.md).

---

## Why Vietnamese first (and not a hard language)

The product claim is a *near-language-agnostic acquisition engine*. The only way to test
that claim is to instantiate a second language and see what breaks. Vietnamese is the
**gentlest possible stressor**: it breaks exactly **one** core assumption cleanly —
tokenization — without simultaneously throwing right-to-left rendering, rich morphology,
or non-concatenative script at us. So it *isolates* the lesson. A hard language would have
broken five things at once and taught us nothing precise.

Vietnamese is also the typological **twin** of Mandarin for an English speaker (isolating,
classifiers, tone, SVO), which is why it doubles as a clean σ-measurement (see
[THEORY.md](THEORY.md) §3 and `computeSeedDelta()`): EN→VN comes out measurably *lighter*
than EN→ZH (effective load 7.55 vs 9.25 over the 16-atom seed). The port and the
measurement were the same act.

---

## The catalog — every Mandarin-ism we found

Each row: the buried assumption, where it lived, how it surfaced, and the **seam** that
absorbed it. The pattern is the headline: *every one became a per-course flag or strategy
on the course object — none required a fork of the engine.*

| # | Assumption (secretly "Mandarin") | Where it lived | How it broke for VN | Seam / fix | Status |
|---|---|---|---|---|---|
| 1 | **An atom = one CJK character.** Sentences decomposed by substring search (`zh.indexOf(headword)`). | `decomposeSentence`, `sentenceAllIntroduced`, `getPuzzleSentences`, `constellationFibers` | `à` (Q-particle) is a substring of `và`/`là`; `đi` sits inside `điện`. Substring matching put a phantom `à` tile into every sentence with `và`. | `course.segment` (`'cjk'` \| `'space'`). Space = greedy longest-match word-boundary tokenizer. One predicate, `sentenceContainsAtom`, is now the *only* "is this atom in this sentence" test. | **Fixed** |
| 2 | **The reading slot is distinct from the word** (pinyin ≠ hanzi). | `renderSyls`, MC/cloze choices, word-order tiles | VN's Latin orthography already *is* the reading → every render printed the word twice (`àà`). | `course.readingIsWord` flag suppresses the reading row. *Not* keyed on segment mode — Arabic is also space-delimited but its romanization is genuinely useful, so it stays `false`. | **Fixed** |
| 3 | **Tone is a number/contour** (pinyin tone 1–4, F0 curve). | tone drill, `WaveViz`, `toneColor` | VN tone is carried *in the diacritic* (`á à ả ã ạ`); there is no separate tone token to drill. | `course.hasTone:false` for now — sidesteps the tone modality entirely. *Tone-as-diacritic* drilling is a real future axis, deliberately deferred. | **Partial (deferred)** |
| 4 | **Atoms decompose into radicals + strokes** (deck slot 3). | flashcard enrichment | VN/Arabic have no ideographic decomposition. | Slot 3 left `[]`; enrichment already guards on length. | OK |
| 5 | **The display font is a CJK face.** | flashcard, MC, word-order tiles | CJK font on Latin renders via fallback but is wrong. | `charFont()` is script-aware; word-order tiles force CJK only for ideographic courses. | **Fixed** |
| 6 | **Example sentences are one global bank.** | `EXAMPLE_SENTENCES` (const) | A second language needs its own sentences. | Made `let`; per-course banks wired onto the course object and repointed by `applyCoursePointers` alongside `D`/`KEY`. | **Fixed** |
| 7 | **UI chrome is bilingual EN/中文** (`学习`, `返回`, `完成`, "MANDARIN ORDER"). | home + study buttons | The decorative CJK shows on every course. | Word-order label is now course-aware ("…IN VIETNAMESE ORDER"). The *decorative* button glyphs (`学习` etc.) remain — cosmetic only. | **Partial (cosmetic)** |

---

## The load-bearing lesson

**The acquisition engine needed zero changes.** The scheduler, the three cost axes, the
per-axis SRS, graduation, σ-gating, the frontier model, the SIM invariant battery — none
of it was touched. Everything that broke lived in the **rendering and content layer**, and
every fix landed as a **property on the course object**. The course object *is* the
language module; the engine below it is genuinely language-general. That is the product
thesis, now demonstrated rather than asserted.

The corollary: **the seam to watch is always "where does the engine assume what an atom
*is*?"** For Mandarin that question never had to be asked — a character is an atom is a
glyph. Every other language forces it. The segmentation seam (#1) is the canonical
instance; everything else is downstream of the same root confusion (atom ≡ surface unit).

**The seed made it tractable.** We instantiated *16 atoms*, not a deck. The generative
seed (THEORY.md §2.1) is the right unit to stand up a new language: it's the smallest
thing that exercises every modality and every code path, it's the unit of cross-language
comparison, and it kept the entire port to one sitting.

---

## What a genuinely hard language breaks next

Vietnamese was gentle by design. The honest forward list — each is a seam *not yet built*:

- **The atom is no longer the whole surface word (inflectional morphology).** Arabic,
  Turkish, Russian: `kitāb`/`kutub`, `git`/`gitti`/`gidiyorum`. The tokenizer currently
  matches `surface === headword` exactly; an inflected form won't match its lemma. This is
  the **next big seam**: lemmatization/stemming between the surface token and the deck
  atom. It is strictly harder than segmentation because it's many-surface-to-one-atom.
- **One space-token = many atoms (agglutination).** Turkish `evlerinizden` is a sentence's
  worth of atoms. Neither the CJK char-walker nor the space-word-walker suffices; you need
  sub-word segmentation. Note this is the *mirror* of #1 — Mandarin packs many atoms with
  no delimiter, Turkish packs many atoms inside one delimited token.
- **Non-concatenative morphology (Arabic root-and-pattern).** Atoms interleave (root
  k-t-b + pattern); there is no contiguous substring *or* whitespace span to grab. The
  "atom" is a discontinuous skeleton. No tokenizer over surface strings reaches it.
- **RTL + bidi.** Arabic already has `script:'rtl'` and an Arabic `charFont()`, but its
  sentence content is untested — bidi blanking, tile ordering, and the word-order drill's
  left-to-right position model are unproven.
- **Vowel-optional orthography, ligatures, casing.** Surface forms that don't uniquely
  determine the atom.
- **The σ map is still single-author and unvalidated** per (L₁,L₂) pair — correctness, not
  mechanism, is the open risk there.

The prediction the framework makes: each of these, too, should land as a course-level
strategy (a `tokenize` / `lemmatize` function on the course) rather than a fork of the
engine. Whether that holds at Arabic is the *next* real test — and the reason to do one
typologically distant language before trusting the "near-agnostic" claim.
