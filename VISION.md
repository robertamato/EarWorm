# Earworm — the idea, in plain language

*A one-sitting read for anyone who wants to understand what we're building and why.
No math here — see [THEORY.md](THEORY.md) for the formal version.*

---

## The problem everyone has felt

You can spend a year on a language app, keep a 365-day streak, and still freeze
the moment a real person asks you a question. You got good at *the app*. You did
not get good at *the language*. People call this the "Duolingo trap" or the
"high-school Spanish trap," and almost every learning tool falls into it.

It happens for one reason: the app tests **recognition** — pick the right answer,
match the pair, tap the tiles in order — and recognition is not the skill you
actually want. The skill you want is **production**: saying what you mean and
being understood. Those are different muscles, and you only build the one you
train.

Everything about Earworm is designed around that single distinction.

## The core idea: we teach the *difference*, not the language

Here's the insight most apps ignore: **you already speak a language.** You have a
complete, working language engine in your head. You don't need to relearn what a
sentence is, what "negation" or "a question" or "the past" means — you have all
of that. You only need to learn where the *new* language does things differently.

So Earworm doesn't teach you Mandarin from zero. It teaches you the **diff**
between the language you have and the one you want. Most words are just a new
label for a concept you already own (water → 水 — nothing new but the sound).
A few are genuinely new ideas with no equivalent in your language (Mandarin's
measure words, tones, the way it marks "finished"). And a few are traps —
they *look* like they map over but don't, and your instinct will betray you.

The whole curriculum is built around finding those differences and spending your
effort *only* where it's actually needed. The payoff is enormous: roughly half of
what you'd "learn" in a from-scratch course is, for you, just relabeling — and we
don't waste your time on it.

## Three questions we ask about every word

To decide what to teach you and when, we score every word on three axes:

1. **How often will you actually encounter it?** (Frequency.) Some words appear
   constantly; some almost never. Teach the useful ones first. This part is the
   classic, well-understood idea.

2. **Does it let you build a sentence?** (Generativity.) This is the part others
   miss. The 50 most *common* words won't necessarily let you say anything,
   because frequency doesn't care whether you've learned how to ask a question or
   say "not." There's a small set of words — surprisingly small, often just a
   couple dozen — that unlocks the ability to *produce* real sentences. We
   front-load that set, so you can say something real almost immediately.

3. **Is it actually new to you, or just a relabel?** (Substitution distance.)
   This is what makes the course *yours*. The answer depends on your native
   language — the same Mandarin word is trivial for one person and hard for
   another. We put your effort where the genuine difficulty is and let your native
   language carry the rest.

The tension between the first two — the most *common* words and the most
*sentence-enabling* words aren't the same set — is the central design problem,
and getting it right is most of the magic.

## What "knowing" means here

We hold to a strict, honest definition: **you know a word when you can produce it
and be understood.** Not when you can pick it out of four choices.

We can never peer inside your head to check whether you "understand" something —
nobody can. But we *can* observe whether what you say *works*: whether a fluent
listener gets what you meant. That's the same test the world uses on you ("do you
*speak* French?" — not "can you recognize French?"), and it's the same test you'd
use to decide whether a person — or an AI — is good at a language. So that's the
bar. The hardest, realest exercises ask you to say something from your own intent
and check that it lands.

Early on, we let you lean on your native language as a crutch — say what you can
in the new language and fill the gaps with your own — and then we take the crutch
away, piece by piece, as you stop needing it. A crutch that never comes off is the
trap; a crutch that fades is how everyone actually learns.

## The engine keeps you at the edge

The fastest way to learn anything is to spend your time right at the boundary of
what you *almost* know — hard enough to stretch you, easy enough to succeed. Too
easy is boring; too hard is demoralizing. There's a precise sweet spot, and
remarkably, it's the same spot that's the most *informative* for the system, the
most *educational* for you, and the most *exciting* to play. Earworm's scheduler
constantly hunts that edge and parks you on it — and the edge keeps moving as you
improve, so you're never bored and never lost.

## The honest casino

Language learning is genuinely hard work, and most people quit. So we borrow the
engagement mechanics that casinos use — the streaks, the bets, the near-misses,
the jackpots — but with the polarity flipped. A casino profits when you *lose*. We
"profit" only when you *learn*. Because winning in our game *is* learning, we can
use those powerful hooks with a clear conscience.

The heart of it is a calibration bet: before you answer, you wager how confident
you are, against odds the system posts based on what it thinks you know. Beat the
house's line — nail something it bet you'd miss — and you win big. It's a real
game of skill (calibrating your own confidence) that stays fun even after you've
mastered the language, the way a good poker player still enjoys the game. And
every bet quietly measures how well you actually know your own knowledge.

We hold two hard lines: a mechanic is only allowed if the *feeling* of winning
tracks *real* learning (no fake wins), and we cap the dose — the app is built to
send you away while you're ahead and bring you back tomorrow, not to keep you
glued for six hours. We use the casino's tools against the casino's purpose.

## Why this is a real moat

Almost every app ships one identical course per language for the entire planet.
We compute the course for *your specific starting point* — your native language
plus your target — because the thing actually worth teaching is the *difference*
between them, and that difference is different for everyone. "We don't teach you
Mandarin; we transform your English into Mandarin" is not a slogan, it's the
architecture.

And because the engine reasons about language in a universal way — every language
is the same kind of object, just with different surface details — adding a new
language is mostly a matter of filling in a template, not building a new app. The
core is near-language-agnostic; the language is a plug-in.

## Where it's going

A learning engine that, given any two languages, computes the shortest honest path
from one to the other — and makes the trip feel like a game you want to keep
playing. We're proving it on Mandarin first (the hard case — different script,
tones, no shared roots), then Vietnamese (the close typological cousin, to prove
the engine generalizes), then outward. Underneath the game, it's quietly building
something rarer: a precise, personalized map of how a given mind acquires a given
language.

---

*Want the rigorous version — the formal objects, the algorithms, the measured
numbers? See [THEORY.md](THEORY.md).*
