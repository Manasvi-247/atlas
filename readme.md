# 🧭 Atlas — Personalised Learning Path Generator

> AI tutoring that knows **what you know**, **what you need to learn next**, and **how you learn best**.

Atlas is an adaptive learning platform built for Assignment 4 (EdTech AI). It runs a
diagnostic that finds the exact boundary of a learner's knowledge, charts a personal
curriculum from that diagnosis, teaches each concept in the learner's preferred style,
adapts the path after every quiz, and provides a Socratic tutor that guides without
giving the answer away.

It is **domain-agnostic** — Python and Algebra are polished featured tracks, but a
learner can type *any* subject ("Music Theory", "Machine Learning", "Spanish grammar")
and the entire path is generated live by Claude.

---

## ✨ What's inside

### The six core features
| Feature | Where | What it does |
|---|---|---|
| **Knowledge Assessment** | `Assessment.tsx`, `/api/assess` + `/api/diagnose` | Adaptive intake quiz. Difficulty climbs/eases per answer to narrow to the knowledge boundary. Ends in a precise diagnosis (known / frontier / gaps). |
| **Curriculum Generation** | `/api/curriculum`, `store.buildCurriculum` | Builds a prerequisite-ordered concept **graph** + modules from the diagnosis, starting at the learner's frontier. Two learners get demonstrably different paths. |
| **Interactive Lessons** | `LessonView.tsx`, `/api/lesson` | Streaming AI lessons with explanations, analogies, code, and **inline practice questions** rendered as interactive widgets. |
| **Adaptive Progress** | `store.ts` (`recordQuiz`, `computeOrder`) | Mastery is updated per concept (EMA); the path is **re-ordered** after every quiz — weak concepts float up, mastered ones drop, prerequisites stay valid. |
| **Socratic Tutor** | `Tutor.tsx`, `/api/tutor` | A chat tutor that guides toward answers with one question at a time and **refuses to state the answer outright**, even when asked directly. |
| **Progress Dashboard** | `Dashboard.tsx` | Knowledge-graph constellation, mastery rings, time/streak/XP, session history timeline, and recommended next steps. |

### The cutting-edge extras
- **Confidence calibration** — every quiz answer carries a confidence rating; Atlas tracks whether you're over/under-confident and tells you.
- **Learning-style adaptation** — a 5-modality style profile (analogy / visual / code / story / formal) is inferred from your assessment and from which "explain it differently" buttons you reach for; lessons are tuned to it.
- **"Explain it differently"** — re-teach any concept through a different modality, live.
- **Spaced repetition** — mastered concepts re-surface on an SM-2 forgetting curve in a dedicated **Review** mode.
- **Knowledge constellation** — a layered-DAG visualisation of the concept graph that fills with colour as you master concepts.
- **Persistent learner model** — everything is saved to `localStorage`, so progress survives reloads.

---

## 🚀 Run it

> **Prerequisites:** Node 18+ and an Anthropic API key.

```bash
# 1. Install
npm install

# 2. Add your key
cp .env.local.example .env.local      # then paste your key into ANTHROPIC_API_KEY

# 3. Start
npm run dev                            # → http://localhost:3000
```

> If port 3000 is taken, run `PORT=3939 npm run dev`.

The key lives **server-side only** (`.env.local`) and is never shipped to the browser —
every Claude call goes through a Next.js API route under `src/app/api/`.

---

## 🧠 How the adaptivity actually works

1. **Assessment** sends a running performance summary to `/api/assess`; the route computes a
   target difficulty (climb on success, ease on failure) so questions home in on the boundary.
2. **Diagnosis** (`/api/diagnose`) classifies concepts into *known / frontier / gaps* and
   emits a first-guess learning-style weighting.
3. **Curriculum** (`/api/curriculum`) returns a concept graph with `prereqs` + `knownAlready`
   flags. The store turns this into live `Concept` objects (known ones start at 0.85 mastery).
4. **`computeOrder()`** runs a *priority-aware topological sort*: it respects prerequisites but
   floats the most urgent available concept to the front (weak > due-for-review > new > mastered).
   It is recomputed after **every** lesson, quiz, and review — that's the adaptation.
5. **Quizzes** update mastery via an exponential moving average and schedule the next spaced
   review with an SM-2-style interval.

---

## ✅ Mapping to the assignment success metrics

| Success metric | How Atlas satisfies it |
|---|---|
| Assessment identifies gaps and generates a path that addresses them | Diagnosis → frontier/gaps → curriculum begins at the frontier and sequences the gaps. |
| Two learners with different results get demonstrably different curricula | The whole graph is generated from each learner's unique diagnosis + goal. |
| Socratic tutor guides without stating the answer | `tutorSystem` prompt + verified: asking "just tell me the answer" yields a guiding question, not the answer. |
| Progress updates after each quiz and adjusts the remaining path | `recordQuiz` updates mastery and re-runs `computeOrder`; weak concepts move up the path. |
| Dashboard reflects session history and mastery | Timeline of every event + per-concept mastery rings + the knowledge constellation. |

---

## 🗂️ Project structure

```
src/
  app/
    page.tsx              # view controller (onboarding → assessment → workspace)
    layout.tsx            # fonts + metadata
    globals.css           # the "field notebook" design system
    api/                  # assess · diagnose · curriculum · lesson · quiz · tutor · explain
  lib/
    types.ts              # the learner model
    anthropic.ts          # Claude client: structured() (forced tool-use) + streamText()
    prompts.ts            # all system prompts + JSON schemas
    store.ts              # Zustand store: mastery updates, path reordering, calibration
    sr.ts                 # spaced-repetition + concept status
    tracks.ts             # featured tracks
    useStream.ts          # streaming fetch hook
  components/             # AppShell, Onboarding, Assessment, KnowledgeMap,
                          # LessonView, Quiz, Tutor, Dashboard, ReviewSession, Markdown, ui
```

## 🛠️ Tech
Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Zustand ·
the official `@anthropic-ai/sdk`, calling **`claude-opus-4-8`**.

Structured outputs use **forced tool-use** (schema-guaranteed JSON); lessons and the tutor
**stream** token-by-token for a live feel.

---

See **`LANDING_PROMPT.md`** for a ready-to-paste prompt to generate the marketing landing page.
