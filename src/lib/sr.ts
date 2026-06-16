import type { Concept, ConceptStatus } from "./types";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Lightweight SM-2-flavoured spaced repetition. `quality` is 0..1 (how well the
 * learner recalled the concept this time). Returns the next interval (days) and
 * the due timestamp.
 */
export function nextReview(concept: Concept, quality: number, now = Date.now()) {
  const prev = concept.srInterval || 1;
  let interval: number;
  if (quality < 0.5) {
    interval = 1; // reset - needs to come back tomorrow
  } else if (concept.srInterval <= 1) {
    interval = quality > 0.8 ? 3 : 2;
  } else {
    // ease factor scaled by how strongly they recalled it
    const ease = 1.3 + quality * 1.2; // 1.3 .. 2.5
    interval = Math.round(prev * ease);
  }
  interval = Math.min(interval, 90);
  return { srInterval: interval, dueAt: now + interval * DAY };
}

export function conceptStatus(c: Concept, prereqsMet: boolean, now = Date.now()): ConceptStatus {
  if (c.mastery >= 0.8) {
    if (c.dueAt && c.dueAt <= now) return "review";
    return "mastered";
  }
  if (c.attempts > 0 && c.mastery > 0) return "learning";
  if (!prereqsMet) return "locked";
  return "ready";
}

export function prereqsMet(c: Concept, concepts: Record<string, Concept>): boolean {
  return c.prereqs.every((p) => (concepts[p]?.mastery ?? 0) >= 0.6);
}

/** Concepts that are mastered but now due for a refresh. */
export function dueForReview(concepts: Record<string, Concept>, now = Date.now()): Concept[] {
  return Object.values(concepts)
    .filter((c) => c.mastery >= 0.6 && c.dueAt != null && c.dueAt <= now)
    .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0));
}
