"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Concept,
  CourseEntry,
  Curriculum,
  Diagnosis,
  HistoryEvent,
  LearnerModel,
  LearningStyle,
  Lesson,
  Module,
  Note,
  QuizResult,
  RawConcept,
  RawModule,
  StarredItem,
} from "./types";
import { nextReview } from "./sr";

export type { RawConcept, RawModule } from "./types";

const DAY = 24 * 60 * 60 * 1000;

const DEFAULT_STYLE: LearningStyle = {
  analogy: 0.5,
  visual: 0.5,
  code: 0.5,
  story: 0.5,
  formal: 0.5,
};

function todayKey(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

function uid(prefix = "h"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyModel(): LearnerModel {
  return {
    subject: "",
    goal: "",
    style: { ...DEFAULT_STYLE },
    concepts: {},
    curriculum: null,
    diagnosis: null,
    minutesSpent: 0,
    streak: 0,
    longestStreak: 0,
    studyDays: [],
    lastStudyDay: null,
    xp: 0,
    createdAt: Date.now(),
    calibration: { sumConfidence: 0, sumScore: 0, samples: 0 },
  };
}

function minutesFor(difficulty: number): number {
  return Math.max(3, Math.min(8, 2 + difficulty));
}

/**
 * Priority-aware topological ordering. Respects structural prerequisites
 * (a concept never precedes one it depends on) while floating the most
 * pedagogically urgent available concept to the front. Recomputed every time
 * the learner model changes, which is what makes the path *adapt*.
 */
export function computeOrder(concepts: Record<string, Concept>, now = Date.now()): string[] {
  const ids = Object.keys(concepts);
  const visited = new Set<string>();
  const order: string[] = [];
  const baseIndex = new Map(ids.map((id, i) => [id, i]));

  const priority = (c: Concept): number => {
    let p = 0;
    const weak = c.attempts > 0 && c.mastery < 0.6;
    const due = c.dueAt != null && c.dueAt <= now && c.mastery >= 0.6;
    if (weak) p += 100; // revisit weak areas first
    else if (due) p += 60; // spaced review
    else if (c.mastery < 0.8) p += 40; // new learning
    else p += 5; // mastered & not due - let it ride at the back
    p -= c.difficulty * 0.5;
    p -= (baseIndex.get(c.id) ?? 0) * 0.01; // stable tiebreak
    return p;
  };

  let guard = 0;
  while (visited.size < ids.length && guard++ < ids.length + 5) {
    const candidates = ids
      .filter((id) => !visited.has(id))
      .filter((id) => concepts[id].prereqs.every((p) => !concepts[p] || visited.has(p)));
    const pool = candidates.length
      ? candidates
      : ids.filter((id) => !visited.has(id)); // cycle fallback
    pool.sort((a, b) => priority(concepts[b]) - priority(concepts[a]));
    const pick = pool[0];
    visited.add(pick);
    order.push(pick);
  }
  return order;
}

interface AtlasState {
  hydrated: boolean;

  // ── Multi-course ────────────────────────────────────────────────────────────
  /** All inactive courses keyed by id. The active course lives in model+history. */
  courses: Record<string, CourseEntry>;
  activeCourseId: string | null;

  // ── Active course (source of truth) ────────────────────────────────────────
  model: LearnerModel;
  history: HistoryEvent[];

  // ── Global (not per-course) ─────────────────────────────────────────────────
  notes: Note[];
  starred: StarredItem[];

  setHydrated: () => void;
  addNote: (text: string, context?: string) => void;
  removeNote: (id: string) => void;
  toggleStar: (item: Omit<StarredItem, "at">) => void;
  isStarred: (id: string) => boolean;
  startSubject: (subject: string, goal: string) => void;
  setDiagnosis: (d: Diagnosis, styleHint?: Partial<LearningStyle>) => void;
  buildCurriculum: (concepts: RawConcept[], modules: RawModule[]) => void;

  recordAssessment: (n: number) => void;
  recordLessonDone: (lessonId: string, minutes: number) => void;
  recordQuiz: (result: QuizResult) => void;
  recordReview: (conceptId: string, quality: number) => void;
  recordTutorTurn: () => void;
  nudgeStyle: (modality: keyof LearningStyle, delta: number) => void;

  nextLessonId: () => string | null;
  reset: () => void;

  // ── Course management ───────────────────────────────────────────────────────
  /** Returns every enrolled course (active course always has fresh model/history). */
  getAllCourses: () => CourseEntry[];
  switchCourse: (id: string) => void;
  deleteCourse: (id: string) => void;
}

function bumpStreak(model: LearnerModel, now = Date.now()) {
  const today = todayKey(now);
  if (!model.studyDays) model.studyDays = [];
  if (model.lastStudyDay === today) return;
  const yesterday = todayKey(now - DAY);
  model.streak = model.lastStudyDay === yesterday ? model.streak + 1 : 1;
  model.lastStudyDay = today;
  model.longestStreak = Math.max(model.longestStreak ?? 0, model.streak);
  model.studyDays = Array.from(new Set([...model.studyDays, today])).slice(-180);
}

export const useAtlas = create<AtlasState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      courses: {},
      activeCourseId: null,
      model: emptyModel(),
      history: [],
      notes: [],
      starred: [],

      setHydrated: () =>
        set((s) => {
          // Migration: old single-course format → create a course entry
          if (s.model.subject && Object.keys(s.courses).length === 0 && !s.activeCourseId) {
            const id = uid("course");
            return {
              hydrated: true,
              courses: {
                [id]: { id, model: s.model, history: s.history, createdAt: s.model.createdAt },
              },
              activeCourseId: id,
            };
          }
          return { hydrated: true };
        }),

      addNote: (text, context) =>
        set((s) => {
          if (!text.trim()) return {};
          const note: Note = { id: uid("n"), at: Date.now(), text: text.trim(), context };
          return { notes: [note, ...s.notes] };
        }),

      removeNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      toggleStar: (item) =>
        set((s) => {
          const exists = s.starred.some((x) => x.id === item.id);
          if (exists) return { starred: s.starred.filter((x) => x.id !== item.id) };
          return { starred: [{ ...item, at: Date.now() }, ...s.starred] };
        }),

      isStarred: (id) => get().starred.some((x) => x.id === id),

      startSubject: (subject, goal) =>
        set((s) => {
          const newId = uid("course");
          const newModel = emptyModel();
          newModel.subject = subject;
          newModel.goal = goal;
          // Snapshot the current active course before creating the new one
          const updatedCourses = { ...s.courses };
          if (s.activeCourseId) {
            updatedCourses[s.activeCourseId] = {
              id: s.activeCourseId,
              model: s.model,
              history: s.history,
              createdAt: s.model.createdAt,
            };
          }
          updatedCourses[newId] = { id: newId, model: newModel, history: [], createdAt: Date.now() };
          return { courses: updatedCourses, activeCourseId: newId, model: newModel, history: [] };
        }),

      setDiagnosis: (d, styleHint) =>
        set((s) => {
          const safe: Diagnosis = {
            summary: d.summary ?? "",
            known: d.known ?? [],
            frontier: d.frontier ?? [],
            gaps: d.gaps ?? [],
            level: typeof d.level === "number" ? d.level : 0.4,
          };
          const model = { ...s.model, diagnosis: safe };
          if (styleHint) model.style = { ...model.style, ...styleHint };
          return { model };
        }),

      buildCurriculum: (rawConcepts, rawModules) =>
        set((s) => {
          const now = Date.now();
          const safeConcepts = (rawConcepts ?? []).filter((c) => c && c.id);
          const safeModules = rawModules ?? [];
          const concepts: Record<string, Concept> = {};
          for (const rc of safeConcepts) {
            concepts[rc.id] = {
              id: rc.id,
              name: rc.name ?? rc.id,
              summary: rc.summary ?? "",
              prereqs: (rc.prereqs ?? []).filter((p) => p && p !== rc.id),
              mastery: rc.knownAlready ? 0.85 : 0,
              confidence: 0.5,
              attempts: 0,
              lastSeen: null,
              srInterval: rc.knownAlready ? 3 : 0,
              dueAt: rc.knownAlready ? now + 3 * DAY : null,
              difficulty: rc.difficulty ?? 2,
            };
          }
          const lessons: Record<string, Lesson> = {};
          const lessonId = (cid: string) => `lesson-${cid}`;
          for (const c of Object.values(concepts)) {
            lessons[lessonId(c.id)] = {
              id: lessonId(c.id),
              conceptId: c.id,
              title: c.name,
              blurb: c.summary,
              minutes: minutesFor(c.difficulty),
            };
          }
          let modules: Module[] = safeModules.map((rm) => ({
            id: rm.id,
            title: rm.title ?? "Module",
            rationale: rm.rationale ?? "",
            lessonIds: (rm.conceptIds ?? []).filter((cid) => concepts[cid]).map(lessonId),
          }));
          // Fallback: if modules are missing/empty, group everything into one.
          if (modules.length === 0 && Object.keys(concepts).length > 0) {
            modules = [
              {
                id: "module-1",
                title: `Your ${s.model.subject} path`,
                rationale: "A sequenced path built from your diagnosis.",
                lessonIds: Object.keys(concepts).map(lessonId),
              },
            ];
          }
          const order = computeOrder(concepts, now).map(lessonId);
          const curriculum: Curriculum = { modules, lessons, order };
          return { model: { ...s.model, concepts, curriculum } };
        }),

      recordAssessment: (n) =>
        set((s) => {
          const model = { ...s.model, xp: s.model.xp + 15 };
          bumpStreak(model);
          const ev: HistoryEvent = {
            id: uid(),
            at: Date.now(),
            kind: "assessment",
            label: "Completed intake assessment",
            detail: `${n} questions · boundary located`,
          };
          return { model, history: [ev, ...s.history] };
        }),

      recordLessonDone: (lessonId, minutes) =>
        set((s) => {
          const model = { ...s.model };
          model.minutesSpent += minutes;
          model.xp += 10;
          bumpStreak(model);
          const lesson = model.curriculum?.lessons[lessonId];
          const concepts = { ...model.concepts };
          if (lesson && concepts[lesson.conceptId]) {
            const c = { ...concepts[lesson.conceptId] };
            // Reading a lesson confers partial mastery; the quiz confirms it.
            c.mastery = Math.max(c.mastery, 0.45);
            c.lastSeen = Date.now();
            concepts[lesson.conceptId] = c;
          }
          model.concepts = concepts;
          if (model.curriculum) {
            model.curriculum = {
              ...model.curriculum,
              order: computeOrder(concepts).map((id) => `lesson-${id}`),
            };
          }
          const ev: HistoryEvent = {
            id: uid(),
            at: Date.now(),
            kind: "lesson",
            label: `Studied “${lesson?.title ?? lessonId}”`,
            detail: `${minutes} min`,
          };
          return { model, history: [ev, ...s.history] };
        }),

      recordQuiz: (result) =>
        set((s) => {
          const now = Date.now();
          const model = { ...s.model };
          const concepts = { ...model.concepts };
          for (const pc of result.perConcept) {
            const c = concepts[pc.conceptId];
            if (!c) continue;
            const score = pc.total > 0 ? pc.correct / pc.total : 0;
            const updated: Concept = { ...c };
            // Exponential moving average - recent performance weighs more.
            updated.mastery = c.attempts === 0 ? score : c.mastery * 0.55 + score * 0.45;
            updated.attempts = c.attempts + 1;
            updated.lastSeen = now;
            const { srInterval, dueAt } = nextReview(updated, score, now);
            updated.srInterval = srInterval;
            updated.dueAt = dueAt;
            concepts[pc.conceptId] = updated;
          }
          model.concepts = concepts;
          model.xp += Math.round(result.score * 20) + 5;
          const cal = model.calibration ?? { sumConfidence: 0, sumScore: 0, samples: 0 };
          model.calibration = {
            sumConfidence: cal.sumConfidence + (result.score + result.confidenceGap),
            sumScore: cal.sumScore + result.score,
            samples: cal.samples + 1,
          };
          bumpStreak(model);
          if (model.curriculum) {
            model.curriculum = {
              ...model.curriculum,
              order: computeOrder(concepts, now).map((id) => `lesson-${id}`),
            };
          }
          const lesson = model.curriculum?.lessons[result.lessonId];
          const pct = Math.round(result.score * 100);
          const weak = result.score < 0.6;
          const ev: HistoryEvent = {
            id: uid(),
            at: now,
            kind: "quiz",
            label: `Quiz · “${lesson?.title ?? result.lessonId}” - ${pct}%`,
            detail: weak
              ? "Below mastery - Atlas moved this concept back up your path"
              : "Mastery updated · path reordered",
          };
          return { model, history: [ev, ...s.history] };
        }),

      recordReview: (conceptId, quality) =>
        set((s) => {
          const now = Date.now();
          const model = { ...s.model };
          const concepts = { ...model.concepts };
          const c = concepts[conceptId];
          if (c) {
            const updated = { ...c };
            updated.mastery = updated.mastery * 0.6 + quality * 0.4;
            updated.lastSeen = now;
            updated.attempts += 1;
            const { srInterval, dueAt } = nextReview(updated, quality, now);
            updated.srInterval = srInterval;
            updated.dueAt = dueAt;
            concepts[conceptId] = updated;
          }
          model.concepts = concepts;
          model.xp += 5;
          bumpStreak(model);
          if (model.curriculum) {
            model.curriculum = {
              ...model.curriculum,
              order: computeOrder(concepts, now).map((id) => `lesson-${id}`),
            };
          }
          const ev: HistoryEvent = {
            id: uid(),
            at: now,
            kind: "review",
            label: `Reviewed “${c?.name ?? conceptId}”`,
            detail: quality >= 0.6 ? "Recall confirmed · interval extended" : "Needs another pass soon",
          };
          return { model, history: [ev, ...s.history] };
        }),

      recordTutorTurn: () =>
        set((s) => {
          // Only log the first turn of a tutor session to avoid noise.
          const last = s.history[0];
          if (last && last.kind === "tutor" && Date.now() - last.at < 10 * 60 * 1000) {
            return {};
          }
          const ev: HistoryEvent = {
            id: uid(),
            at: Date.now(),
            kind: "tutor",
            label: "Socratic tutor session",
          };
          return { history: [ev, ...s.history] };
        }),

      nudgeStyle: (modality, delta) =>
        set((s) => {
          const style = { ...s.model.style };
          style[modality] = Math.max(0.05, Math.min(1, style[modality] + delta));
          return { model: { ...s.model, style } };
        }),

      nextLessonId: () => {
        const { model } = get();
        if (!model.curriculum) return null;
        const now = Date.now();
        for (const lid of model.curriculum.order) {
          const lesson = model.curriculum.lessons[lid];
          if (!lesson) continue;
          const c = model.concepts[lesson.conceptId];
          if (!c) continue;
          const due = c.dueAt != null && c.dueAt <= now;
          if (c.mastery < 0.8 || due) return lid;
        }
        return null;
      },

      reset: () =>
        set({ model: emptyModel(), history: [], notes: [], starred: [], courses: {}, activeCourseId: null }),

      getAllCourses: () => {
        const { courses, activeCourseId, model, history } = get();
        const all: Record<string, CourseEntry> = { ...courses };
        if (activeCourseId) {
          all[activeCourseId] = { id: activeCourseId, model, history, createdAt: model.createdAt };
        }
        return Object.values(all).sort((a, b) => a.createdAt - b.createdAt);
      },

      switchCourse: (id) =>
        set((s) => {
          if (id === s.activeCourseId || !s.courses[id]) return {};
          const updatedCourses = { ...s.courses };
          // Save current active course
          if (s.activeCourseId) {
            updatedCourses[s.activeCourseId] = {
              id: s.activeCourseId,
              model: s.model,
              history: s.history,
              createdAt: s.model.createdAt,
            };
          }
          const target = updatedCourses[id];
          return {
            courses: updatedCourses,
            activeCourseId: id,
            model: target.model,
            history: target.history,
          };
        }),

      deleteCourse: (id) =>
        set((s) => {
          const updatedCourses = { ...s.courses };
          delete updatedCourses[id];
          if (id !== s.activeCourseId) return { courses: updatedCourses };
          // Deleting the active course — switch to the next available
          const remaining = Object.values(updatedCourses);
          if (remaining.length === 0) {
            return { courses: {}, activeCourseId: null, model: emptyModel(), history: [] };
          }
          const next = remaining[0];
          return { courses: updatedCourses, activeCourseId: next.id, model: next.model, history: next.history };
        }),
    }),
    {
      name: "atlas-learner-v1",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
