# Earworm Arabic Romanization System
## Levantine Arabic — working reference

This system is used for the latinization display on Arabic flashcards.
It prioritises learnability for English-speaking beginners over academic precision.
All romanizations encode the **underlying (classical) form**; dialect reductions are
noted per word in the lexicon, not baked into the system.

---

## Digit set — pharyngeal · uvular · glottal

The five sounds absent from English that have no clean Latin letter:

| Digit | Glyph | Name | Sound |
|-------|-------|------|-------|
| `2` | ء / أ / إ / ؤ / ئ | hamza | glottal stop (the catch in "uh-oh") |
| `3` | ع | 3yn | voiced pharyngeal fricative |
| `5` | خ | 5aa | voiceless uvular/velar fricative (like German *Bach*) |
| `7` | ح | 7aa | voiceless pharyngeal fricative (deeper, drier than h) |
| `8` | غ | 8yn | voiced uvular fricative (like French *r*) |

Voiced/voiceless pairs: **3 / 7** (pharyngeal) · **8 / 5** (uvular fricative).

Digit `9` is reserved for ق but currently unused — we write `q` instead,
which signals "not a standard k" without ambiguity.

---

## Emphatic consonants — capital letters

Four consonants with a "heavy" or "emphatic" quality that colours surrounding vowels:

| Latin | Glyph | Name |
|-------|-------|------|
| `S` | ص | Sad |
| `D` | ض | Dad |
| `T` | ط | Ta |
| `Z` | ظ | Zha (Lev: → D or emphatic-z) |

No other letter is capitalised mid-word. A capital always signals the emphatic class.

---

## All 28 consonants

| Glyph | Latin | Letter name | Notes |
|-------|-------|-------------|-------|
| ا | a / aa | alef | vowel carrier; long-a when bare |
| ب | b | ba | |
| ت | t | ta | |
| ث | th | tha | Lev: → t or s |
| ج | j | jim | Lev: j / zh |
| ح | `7` | 7aa | voiceless pharyngeal; digit set |
| خ | `5` | 5aa | uvular fricative; digit set |
| د | d | dal | |
| ذ | dh | dhal | Lev: → d or z |
| ر | r | ra | rolled / flapped |
| ز | z | zay | |
| س | s | sin | |
| ش | sh | shin | |
| ص | `S` | Sad | emphatic |
| ض | `D` | Dad | emphatic |
| ط | `T` | Ta | emphatic |
| ظ | `Z` | Zha | emphatic; Lev: → D or Z |
| ع | `3` | 3yn | voiced pharyngeal; digit set |
| غ | `8` | 8yn | voiced uvular; digit set |
| ف | f | fa | |
| ق | q | qaf | uvular stop; Lev: → 2 or k |
| ك | k | kaf | |
| ل | l | lam | |
| م | m | mim | |
| ن | n | nun | |
| ه | h | ha | plain h; lowercase |
| و | w · uu | waw | consonant / long-u vowel |
| ي | y · ii | ya | consonant / long-i vowel |

---

## Hamza forms

Hamza (glottal stop) sits on different "seats" depending on context.
The romanization is always `2`; the seat is noted only when it changes the vowel:

| Glyph | Latin | Notes |
|-------|-------|-------|
| ء | `2` | standalone |
| أ | `2a` | alef seat + hamza above; word-initial |
| إ | `2i` | alef seat + hamza below; always followed by short i |
| ؤ | `2u` | waw seat; u-context |
| ئ | `2` | ya seat; mid-word |
| آ | aa | alef madda (long-a); write `2aa` when glottal onset matters |

---

## Special letters

| Glyph | Latin | Name | Notes |
|-------|-------|------|-------|
| ة | ah · at | ta marbuta | feminine ending; **-ah** in pause (audible aspiration), **-at** in construct state |
| ى | a | alef maqsura | word-final long-a; looks like ي without dots |
| ال | al- | definite article | sun letters assimilate: al-shams → ash-shams |

---

## Harakat — vowel diacritics

### Short vowels
| Mark | Latin | Name |
|------|-------|------|
| بَ | a | fatha — short a |
| بِ | i | kasra — short i |
| بُ | u | damma — short u |

### Long vowels
| Mark | Latin | Name |
|------|-------|------|
| بَا | aa | fatha + alef — long a |
| بِي | ii | kasra + ya — long i |
| بُو | uu | damma + waw — long u |

### Tanwin (indefinite endings — MSA; mostly silent in Levantine)
| Mark | Latin | Name |
|------|-------|------|
| بً | an | tanwin fath |
| بٍ | in | tanwin kasr |
| بٌ | un | tanwin damm |

### Prosodic marks
| Mark | Latin | Name | Notes |
|------|-------|------|-------|
| بّ | t-t | shadda — gemination | hyphen marks syllable break: kat-tab, mar-ra |
| بْ | ∅ | sukun — no vowel | absence of vowel symbol encodes it |

---

## System rules summary

1. **Digits (2 3 5 7 8)** cover all pharyngeal, uvular-fricative, and glottal sounds.
   Voiced/voiceless pairs are visually adjacent: 3/7 and 8/5.
2. **Capital letters (S D T Z)** cover the emphatic consonants only.
   No other letter is ever capitalised mid-word.
3. **Length = repetition.** Long vowel → aa / ii / uu.
   Geminated consonant → t-t, m-m (hyphen marks the syllable break).
4. **Levantine notes are per-word.** The system romanizes the underlying form;
   dialect reductions (ق→2, ث→t, ذ→d …) live in the lexicon entry.

---

## Positional letter forms

Arabic letters change shape depending on their position in a word.
Most have four forms: isolated · initial · medial · final.
Six letters (ا د ذ ر ز و) do not connect to the following letter,
which simplifies their medial/final forms. The romanization is identical
in all positions — positional forms affect display only, not sound.

---

## D_AR syllabification rules (generation algorithm)

When adding a new entry to `D_AR`, the syllabification array `[["syl",tone],...]`
must follow these rules. Tone is always `0` for Arabic (stress-timed, not lexically
tonal). These rules encode what gets dropped or mutilated by naive romanization.

### Rule 1 — digits belong to their syllable, never isolated

A digit consonant (2, 3, 5, 7, 8) is a consonant. It belongs to the syllable that
contains its vowel. Never split it off as a standalone token.

| Word | Wrong | Right |
|------|-------|-------|
| على | `["a","la"]` | `["3la"]` |
| عمل | `["a","mal"]` | `["3a","mal"]` |
| حكى | `["7","aka"]` | `["7a","ka"]` |
| راح | `["raa","7"]` | `["raa7"]` |
| أجا | `["a","ja"]` | `["2a","ja"]` |

### Rule 2 — never drop a digit consonant

If the Arabic glyph is ع، ح، خ، غ، ء the digit MUST appear in the romanization.
Dropping it silently is the most common error and the hardest for learners to detect.

### Rule 3 — hamza (2) on word-initial alef

أ and إ carry a hamza — the glottal stop is real. Write `2`. Apply consistently:
`أنا → 2ana`, `أنت → 2inta`, `إحنا → 2ihna`, `أجا → 2aja`.
Exception: bare ا (alef without hamza diacritic, used as vowel carrier mid-word)
has no glottal stop and takes no `2`.

### Rule 4 — gemination (shadda) splits at the boundary

Write the doubled consonant across the split: `بدّي → ["bid","di"]`, not `["bidd","i"]`
or `["b","iddi"]`. The hyphen in the display (`bid-di`) falls at this split point.

### Rule 5 — long vowels stay in their syllable

A long vowel (aa, ii, uu) belongs with the consonant that precedes it in the same
syllable. Do not split `shaaf` into `sha + af`.

| Word | Wrong | Right |
|------|-------|-------|
| شاف | `["sha","af"]` | `["shaaf"]` |
| مين | `["mi","in"]` | `["miin"]` |
| يوم | `["yu","um"]` | `["yoom"]` |

### Rule 6 — Levantine ق reduction

In Levantine speech ق → 2 (glottal stop) in most words. Encode the reduced form
in the syllabification since that is what the learner will hear: `وقت → ["wa2t"]`.
Note the reduction in the lexicon comment if it is non-obvious.

### Rule 7 — sun-letter assimilation is NOT encoded

The definite article ال assimilates to sun letters in speech (al-shams → ash-shams).
Do not pre-assimilate in the romanization — write `al-` uniformly. The audio handles
the assimilation; the romanization shows the underlying form.

---

## Romanization profile (future)

A `romanizationProfile` setting is planned for user customization:

| Profile | Convention |
|---------|-----------|
| `earworm` | This system (default) |
| `arabizi` | Pure digit convention (adds 7=ح, 8=غ, 9=ق, drops H/Gh/q) |
| `ala-lc` | Library of Congress academic transliteration |

The renderer swaps a lookup table; no structural changes to the course data.
