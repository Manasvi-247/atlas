<div align="center">

<br/>

# 🧭 &nbsp; A T L A S

### *Learning that knows the way.*

An adaptive, AI‑tutored learning‑path generator that finds the edge of what you know,
draws a route made only for you, and redraws it after every step.

<br/>

![Next.js](https://img.shields.io/badge/Next.js_15-000?logo=next.js&logoColor=white&style=flat-square)
![React](https://img.shields.io/badge/React_19-149ECA?logo=react&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind_v4-38BDF8?logo=tailwindcss&logoColor=white&style=flat-square)

</div>

---

## The idea

Most courses teach everyone the same thing in the same order. Atlas does the opposite. It runs
a short adaptive diagnostic to locate the **exact boundary** of your knowledge, generates a
personal curriculum that *begins at that boundary*, teaches each concept in the style you learn
best, and **re‑routes the path after every quiz**. A Socratic tutor rides along the whole way,
guiding with questions and never handing over the answer.

It is **domain‑agnostic.** Python and Algebra ship as polished featured tracks, but type *any*
subject (*"Music Theory", "Machine Learning", "Spanish grammar"*) and the entire path is
generated live by LLM.

---

## The adaptive loop

```
                ┌──────────────────────────────────────────────────┐
                │                                                    │
   ┌────────┐   ▼   ┌──────────┐   ┌────────────┐   ┌─────────┐   ┌─┴────────┐
   │ ASSESS │─────▶ │ DIAGNOSE │──▶│ CURRICULUM │──▶│ LEARN   │──▶│ ADAPT    │
   └────────┘       └──────────┘   └────────────┘   └─────────┘   └──────────┘
   difficulty       known /         prereq concept    streaming     mastery + path
   homes in on      frontier /      graph from your    lessons +     reorder after
   your boundary    gaps            frontier           live quizzes  every answer
```

Every quiz answer feeds `computeOrder()`, a **priority‑aware topological sort** that respects
prerequisites while floating the most urgent concept (weak › due‑for‑review › new › mastered) to
the front. That recompute, after every lesson, quiz, and review, *is* the adaptation.

---

## What's inside

### The six core capabilities

| | Capability | Lives in | What it does |
|:--:|---|---|---|
| 🎯 | **Knowledge assessment** | `Assessment.tsx` · `/api/assess` · `/api/diagnose` | Adaptive intake quiz. Difficulty climbs on a right answer and eases on a wrong one, homing in on your boundary. Ends in a precise *known / frontier / gaps* diagnosis. |
| 🗺️ | **Curriculum generation** | `/api/curriculum` · `store.buildCurriculum` | Turns the diagnosis into a prerequisite‑ordered concept **graph** + modules, starting at your frontier. Two learners get demonstrably different paths. |
| 📖 | **Interactive lessons** | `LessonView.tsx` · `/api/lesson` | Streaming lessons with explanations, analogies, code, and **inline practice questions** rendered as live widgets. |
| 🔁 | **Adaptive progress** | `store.ts` (`recordQuiz`, `computeOrder`) | Per‑concept mastery (EMA); the path **reorders** after every quiz, so weak floats up, mastered drops, and prerequisites hold. |
| 💬 | **Socratic tutor** | `Tutor.tsx` · `FloatingTutor.tsx` · `/api/tutor` | Guides one question at a time and **refuses to state the answer outright**. Reachable on every screen as a floating bubble. |
| 📊 | **Progress dashboard** | `Dashboard.tsx` | Mastery rings, "where you stand", confidence calibration, spaced‑review stats, streak & XP, and a full session timeline, charted with Recharts. |

### Going further

- 📚 **Multi‑course enrollment:** learn several subjects at once. Each course keeps its own model, history, and mastery; the **`CourseSwitcher`** swaps the active one in a click (`CourseEntry`, `courses`, `switchCourse`, `deleteCourse`).
- 🎚️ **Confidence calibration:** every answer carries a confidence rating; Atlas tracks whether you're over‑ or under‑confident and tells you.
- 🧬 **Learning‑style adaptation:** a 5‑modality profile (analogy · visual · code · story · formal) is inferred from your assessment and the "explain it differently" buttons you reach for; lessons tune to it.
- 🔄 **"Explain it differently":** re‑teach any concept through another modality, live (`/api/explain`).
- 🧠 **Spaced repetition:** mastered concepts resurface on an SM‑2 forgetting curve in a dedicated **Review** mode.
- 🗒️ **Notes & saved questions:** a sticky‑note workspace; star any quiz question and it's filed with its original context.
- 🌗 **Light / dark theme:** one design system that flips cleanly, charts and all, with no flash on load.
- 🔐 **Google sign‑in (required):** Auth.js (NextAuth v5) with a Google OAuth provider gates the whole app. The sign‑in surface is a modal over the landing page, not a separate screen.
- ☁️ **Per‑account cloud sync:** every learner's courses, progress, notes, and streak are stored in Postgres keyed to their account, so the same path follows them across devices and reloads.

---

## Quick start

> **Prerequisites:** Node 18+, an [Anthropic API key](https://console.anthropic.com), a
> [Google OAuth client](https://console.cloud.google.com/apis/credentials), and a
> [Neon Postgres](https://neon.tech) database.

```bash
npm install                            # 1 · install
cp .env.local.example .env.local       # 2 · fill in the env (see below)
npx prisma migrate dev --name init     # 3 · create the database tables
npm run dev                            # 4 · run → http://localhost:3000
```

> Port 3000 taken? `PORT=3939 npm run dev` (then set `AUTH_URL` and the Google redirect
> URI to that port too, see below).

### Environment

```ini

ANTHROPIC_API_KEY=sk-ant-...
# ATLAS_MODEL=claude-sonnet-4-6        # optional model override

# Auth.js (Google sign-in)
AUTH_SECRET=                           # npx auth secret
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
# AUTH_URL=http://localhost:3000       # set if not on the default port / in prod

# Neon Postgres (per-account persistence)
DATABASE_URL=                          # pooled connection (runtime)
DIRECT_URL=                            # direct connection (migrations)
```

**Google OAuth redirect URI:** add `http://localhost:3000/api/auth/callback/google` (and your
production `https://YOUR_DOMAIN/api/auth/callback/google`) in the Google Cloud console.

---

## Routes

The marketing landing page is the front door; the app lives behind a Google sign‑in gate
(enforced in `middleware.ts`).

| Path | |
|---|---|
| `/` | Marketing landing page *(served from `public/landing.html`; also at `/landing`)*. Hosts the sign‑in modal. |
| `/signin` | Auth.js sign‑in target; redirects to the landing with the sign‑in modal open |
| `/start` | Onboarding: your courses + "add another", or pick a track / type any subject |
| `/assess` | Adaptive diagnostic |
| `/path` | Your charted curriculum (the knowledge map) |
| `/learn/[lessonId]` | A streaming interactive lesson |
| `/tutor` *· floating bubble* | Socratic tutor |
| `/dashboard` | Progress dashboard |
| `/review` | Spaced‑repetition review |
| `/notes` | Sticky‑note workspace + starred questions |

---

## Under the hood

```
middleware.ts             # gates every route behind sign-in (edge-safe auth config)
prisma/
  schema.prisma           # Auth.js tables + LearnerState (one JSON snapshot per user)
src/
  auth.ts                 # Auth.js instance (Google provider + Prisma adapter)
  auth.config.ts          # edge-safe config: providers, pages, the authorized() gate
  app/
    (app)/                # workspace: path · learn · tutor · dashboard · review · notes
    start/                # onboarding + course management
    assess/               # adaptive diagnostic
    signin/               # redirect → landing with the sign-in modal open
    api/                  # assess · curriculum · diagnose · explain · lesson · quiz · tutor
                          # auth/[...nextauth] · state (load/save the user snapshot)
    layout.tsx            # fonts, theme bootstrap, providers, chrome
    globals.css           # the design system (light/dark tokens)
  lib/
    types.ts              # learner model + CourseEntry (multi-course)
    anthropic.ts          # Claude client: structured() forced tool-use + streamText()
    prisma.ts             # PrismaClient singleton
    prompts.ts            # system prompts + JSON schemas
    store.ts              # Zustand: mastery, path reorder, calibration, course switching
    sr.ts                 # spaced repetition + concept status
    tracks.ts             # featured tracks (Python, Algebra)
    palette.ts            # theme-aware chart palette
    useTheme.ts           # light/dark store
    useStream.ts          # streaming fetch hook
  components/             # AppShell · Chrome · CourseSwitcher · Onboarding · Assessment
                          # KnowledgeMap · LessonView · Quiz · Tutor · FloatingTutor · StateSync
                          # Dashboard · ReviewSession · Notes · NotePad · Streak · ThemeToggle
public/
  landing.html           # standalone marketing landing page (served at / and /landing)
```

**How a course is stored:** the *active* course lives in `model` + `history`; every other enrolled
course is parked in `courses` (a `Record<string, CourseEntry>`) keyed by id. `switchCourse(id)`
swaps the active one in and out, and no progress is ever lost.

**How progress syncs:** the Zustand store holds the live state; `StateSync` loads the signed‑in
user's snapshot from `/api/state` on sign‑in and debounce‑saves every change back to their
`LearnerState` row. The database (not the browser) is the source of truth.

---

## Tech

**Next.js 15** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS v4** ·
**Framer Motion** · **Zustand** · **Ant Design 5** · **Recharts** · **Auth.js (NextAuth v5)** ·
**Prisma** + **Neon Postgres** · the official **`@anthropic-ai/sdk`**, calling **`claude-sonnet-4-6`**.

Structured outputs use **forced tool‑use** (schema‑guaranteed JSON); lessons and the tutor
**stream** token‑by‑token for a live feel. Swap model tiers with the `ATLAS_MODEL` env var.

---

## Capabilities at a glance

| What it handles | How |
|---|---|
| Identifies gaps and generates a path that addresses them | Diagnosis → frontier/gaps → curriculum begins at the frontier and sequences the gaps. |
| Two different learners get demonstrably different curricula | The whole graph is generated from each learner's unique diagnosis + goal. |
| Tutor guides without stating the answer | `tutorSystem` prompt: "just tell me the answer" yields a guiding question, not the answer. |
| Progress updates after each quiz and adjusts the remaining path | `recordQuiz` updates mastery and re‑runs `computeOrder`; weak concepts move up. |
| Dashboard reflects session history and mastery | Mastery rings, calibration, review stats, and a full session timeline. |

---

## Deploy

```bash
vercel                       # preview
vercel --prod                # ship
```

Set every env var in the Vercel project (Production scope) before deploying:
`ANTHROPIC_API_KEY`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `DATABASE_URL`,
`DIRECT_URL`. Add your production callback URL to the Google OAuth client, and run
`npx prisma migrate deploy` against the production database. Auth.js auto‑detects the Vercel
host, so `AUTH_URL` isn't needed there.

Hosting is free on Vercel's Hobby plan; the running costs are per‑use Claude API calls and the
Neon database (free tier covers light use). Set a spend cap in the Anthropic Console to stay safe.

---

<div align="center">

### Developed by

[**@Manasvi-247**](https://github.com/Manasvi-247/) &nbsp;·&nbsp; [**@sanaa-duhh**](https://github.com/sanaa-duhh/) &nbsp;·&nbsp; [**@Posiedon207**](https://github.com/Posiedon207) &nbsp;·&nbsp; [**@Kesab2909**](https://github.com/Kesab2909)

<sub>🧭 &nbsp; Atlas</sub>

</div>
