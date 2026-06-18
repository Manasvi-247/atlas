// ── Atlas domain model ──────────────────────────────────────────────────────
// The "learner model" is the single source of truth that every AI call reads
// from and writes to. It is what makes the curriculum adaptive and personal.

export type Modality = "analogy" | "visual" | "code" | "story" | "formal";

export type LearningStyle = {
  // Soft weights (0..1) describing which explanation modalities land best for
  // this learner. Inferred over time from quiz performance + explicit feedback.
  analogy: number;
  visual: number;
  code: number;
  story: number;
  formal: number;
};

export type ConceptStatus =
  | "locked" // prerequisites not yet mastered
  | "ready" // unlocked, not started
  | "learning" // in progress
  | "review" // mastered but due for spaced review
  | "mastered"; // mastery high and not due

export interface Concept {
  id: string;
  name: string;
  /** One-line description of what the learner will be able to do. */
  summary: string;
  /** Concept ids that should be mastered before this one. */
  prereqs: string[];
  /** 0..1 - model's estimate of how well the learner knows this. */
  mastery: number;
  /** 0..1 - how confident the learner *feels* (for calibration analytics). */
  confidence: number;
  /** Total quiz/practice attempts touching this concept. */
  attempts: number;
  /** ms timestamp of last interaction (drives spaced repetition). */
  lastSeen: number | null;
  /** Spaced-repetition interval in days; grows as recall succeeds. */
  srInterval: number;
  /** ms timestamp when this concept is next due for review. */
  dueAt: number | null;
  /** Rough difficulty 1..5, used for ordering + pacing. */
  difficulty: number;
}

export interface Lesson {
  id: string;
  conceptId: string;
  title: string;
  /** Short hook shown on the card before the lesson is generated. */
  blurb: string;
  /** Estimated minutes. */
  minutes: number;
}

export interface Module {
  id: string;
  title: string;
  /** Why this module exists for *this* learner (ties back to assessment). */
  rationale: string;
  lessonIds: string[];
}

export interface Curriculum {
  modules: Module[];
  lessons: Record<string, Lesson>;
  /** Ordered lesson ids - the adaptive "path". Reordered as the model updates. */
  order: string[];
}

// ── Assessment ───────────────────────────────────────────────────────────────

export interface AssessmentQuestion {
  id: string;
  concept: string; // concept name the question probes
  difficulty: number; // 1..5
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
}

export interface AssessmentAnswer {
  questionId: string;
  concept: string;
  difficulty: number;
  chosenIndex: number;
  correct: boolean;
  confidence: number; // 0..1 self-reported before reveal
}

export interface Diagnosis {
  /** Human-readable summary of where the boundary of knowledge sits. */
  summary: string;
  /** Concepts the learner already knows (skip / light review). */
  known: string[];
  /** Concepts at the frontier - the right place to start teaching. */
  frontier: string[];
  /** Concepts clearly not yet known (future modules). */
  gaps: string[];
  /** Estimated overall level 0..1. */
  level: number;
}

// ── Quizzes (per-lesson) ──────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  /** Concept ids this question touches (for targeted mastery updates). */
  concepts: string[];
}

export interface QuizResult {
  lessonId: string;
  score: number; // 0..1
  perConcept: { conceptId: string; correct: number; total: number }[];
  confidenceGap: number; // signed: positive = overconfident
}

// ── Tutor ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ── Learner model + session ────────────────────────────────────────────────────

export interface LearnerModel {
  subject: string;
  goal: string;
  style: LearningStyle;
  concepts: Record<string, Concept>;
  curriculum: Curriculum | null;
  diagnosis: Diagnosis | null;
  /** Total focused minutes across all sessions. */
  minutesSpent: number;
  /** Per-day study streak. */
  streak: number;
  /** Longest streak ever reached. */
  longestStreak: number;
  /** Distinct YYYY-MM-DD days the learner studied (recent window). */
  studyDays: string[];
  lastStudyDay: string | null; // YYYY-MM-DD
  xp: number;
  createdAt: number;
  /** Running confidence-vs-correctness calibration across all quizzes. */
  calibration: { sumConfidence: number; sumScore: number; samples: number };
}

/** A timeline event for the dashboard / session history. */
export interface HistoryEvent {
  id: string;
  at: number;
  kind: "assessment" | "lesson" | "quiz" | "tutor" | "review" | "adapt";
  label: string;
  detail?: string;
}

// ── Memory notes & starred questions (learner-authored) ─────────────────────

export interface Note {
  id: string;
  at: number;
  text: string;
  /** Optional concept/context this note was taken against. */
  context?: string;
}

export interface StarredItem {
  id: string;
  at: number;
  prompt: string;
  concept: string;
  /** Where it came from. */
  kind: "assessment" | "quiz" | "lesson";
}

export const MODALITY_LABELS: Record<Modality, string> = {
  analogy: "Analogies",
  visual: "Visual / spatial",
  code: "Worked code",
  story: "Narrative",
  formal: "Formal / precise",
};

// Raw shapes returned by the curriculum API route (before they're turned into
// the live concept graph + lesson set in the store).
// ── Multi-course ─────────────────────────────────────────────────────────────

/** One enrolled course with its own full learner model + history. */
export interface CourseEntry {
  id: string;
  model: LearnerModel;
  history: HistoryEvent[];
  createdAt: number;
}

export interface RawConcept {
  id: string;
  name: string;
  summary: string;
  prereqs: string[];
  difficulty: number;
  knownAlready: boolean;
}
export interface RawModule {
  id: string;
  title: string;
  rationale: string;
  conceptIds: string[];
}

/** The two seeded, polished tracks plus the open-ended custom option. */
export interface FeaturedTrack {
  id: string;
  subject: string;
  tagline: string;
  goal: string;
  accent: string; // css color
  glyph: string; // single character / emoji used in the map node
}
