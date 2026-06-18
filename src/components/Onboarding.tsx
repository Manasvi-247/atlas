"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Compass, Map, Sparkles, Target, BookOpen,
  Plus, X, Flame, Clock, ChevronRight, Trash2,
} from "lucide-react";
import { Button, Pill, SectionLabel } from "./ui";
import { FEATURED_TRACKS, SUBJECT_SUGGESTIONS } from "@/lib/tracks";
import { useAtlas } from "@/lib/store";
import type { CourseEntry } from "@/lib/types";

function masteryPct(entry: CourseEntry): number {
  const cs = Object.values(entry.model.concepts);
  if (!cs.length) return 0;
  return Math.round((cs.reduce((a, c) => a + c.mastery, 0) / cs.length) * 100);
}

function getNextLesson(entry: CourseEntry): string | null {
  const { curriculum, concepts } = entry.model;
  if (!curriculum) return null;
  const now = Date.now();
  for (const lid of curriculum.order) {
    const lesson = curriculum.lessons[lid];
    if (!lesson) continue;
    const c = concepts[lesson.conceptId];
    if (!c) continue;
    if (c.mastery < 0.8 || (c.dueAt != null && c.dueAt <= now)) return lesson.title;
  }
  return null;
}

export function Onboarding({ onStart }: { onStart: () => void }) {
  const router = useRouter();
  const startSubject = useAtlas((s) => s.startSubject);
  const switchCourse = useAtlas((s) => s.switchCourse);
  const deleteCourse = useAtlas((s) => s.deleteCourse);
  const getAllCourses = useAtlas((s) => s.getAllCourses);
  const activeCourseId = useAtlas((s) => s.activeCourseId);
  const [subject, setSubject] = useState("");
  const [goal, setGoal] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<CourseEntry | null>(null);

  const courses = getAllCourses();
  const hasCourses = courses.length > 0;

  function begin(s: string, g: string) {
    if (!s.trim()) return;
    startSubject(s.trim(), g.trim() || `Make real progress in ${s.trim()}`);
    onStart();
  }

  function continueCourse(entry: CourseEntry) {
    if (entry.id !== activeCourseId) switchCourse(entry.id);
    if (entry.model.curriculum) router.push("/path");
    else router.push("/assess");
  }

  function handleDeleteCourse(e: React.MouseEvent, entry: CourseEntry) {
    e.stopPropagation();
    setCourseToDelete(entry);
  }

  function confirmDelete() {
    if (!courseToDelete) return;
    deleteCourse(courseToDelete.id);
    setCourseToDelete(null);
  }

  // ── Courses view ────────────────────────────────────────────────────────────
  if (hasCourses) {
    return (
      <>
      {/* ── Delete confirmation modal ── */}
      <AnimatePresence>
        {courseToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40"
            onClick={() => setCourseToDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="atlas-card w-full max-w-md p-7 relative"
            >
              {/* Close */}
              <button
                onClick={() => setCourseToDelete(null)}
                className="absolute top-4 right-4 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors"
              >
                <X size={18} />
              </button>

              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl bg-[color-mix(in_srgb,var(--color-rose)_12%,var(--color-card))] dark:bg-[color-mix(in_srgb,var(--color-pine)_12%,var(--color-card))] grid place-items-center mb-5">
                <Trash2 size={22} className="text-[var(--color-rose)] dark:text-[var(--color-pine)]" />
              </div>

              <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
                Remove this course?
              </h2>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                <span className="font-semibold text-[var(--color-ink)]">{courseToDelete.model.subject}</span>
                {" "}and all its progress — mastery, history, and notes — will be permanently deleted. This cannot be undone.
              </p>

              <div className="mt-6 flex items-center gap-3 justify-end">
                <button
                  onClick={() => setCourseToDelete(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--color-rose)] dark:bg-[var(--color-pine)] text-white dark:text-[var(--color-on-accent)] hover:opacity-90 transition-opacity shadow-[0_4px_14px_-6px_rgba(192,69,95,0.5)] dark:shadow-[0_4px_14px_-6px_rgba(94,234,212,0.4)]"
                >
                  Yes, remove it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-2xl mx-auto pb-10">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

          {/* ── Add another course — TOP, centred ── */}
          <div className="mb-6">
            <AnimatePresence mode="wait">
              {!showNew ? (
                <motion.button
                  key="add-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowNew(true)}
                  className="add-course-btn w-full text-left p-5 rounded-2xl border transition-all group hover:scale-[1.01] hover:shadow-[0_6px_24px_-10px_rgba(180,150,210,0.35)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="add-course-icon w-11 h-11 rounded-xl grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
                      <Plus size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-semibold text-[var(--color-ink)]">Add another course</div>
                      <div className="text-xs text-[var(--color-ink-soft)] mt-0.5">Explore a new subject and chart a fresh path</div>
                    </div>
                    <ChevronRight size={16} className="text-[#c8a8d8] dark:text-[var(--color-pine)] group-hover:translate-x-1 transition-transform shrink-0" />
                  </div>
                </motion.button>
              ) : (
                <motion.div
                  key="add-form"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="atlas-card p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-semibold">Start a new course</h3>
                    <button
                      onClick={() => { setShowNew(false); setSubject(""); setGoal(""); }}
                      className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Featured tracks — compact */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {FEATURED_TRACKS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => begin(t.subject, t.goal)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-line)] hover:border-[var(--color-pine)] hover:bg-[color-mix(in_srgb,var(--color-pine)_5%,var(--color-card))] transition-all text-left group"
                      >
                        <span
                          className="font-mono text-sm font-bold w-9 h-9 rounded-lg grid place-items-center text-white shrink-0"
                          style={{ background: t.accent }}
                        >
                          {t.glyph}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate">{t.subject}</div>
                          <div className="text-[0.68rem] text-[var(--color-ink-faint)] truncate">{t.tagline}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Custom subject form */}
                  <form onSubmit={(e) => { e.preventDefault(); begin(subject, goal); }} className="space-y-3">
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Or type any subject — Machine Learning, Chess, Spanish…"
                      className="w-full atlas-inset px-4 py-2.5 text-sm outline-none focus:border-[var(--color-pine)] transition-colors"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {SUBJECT_SUGGESTIONS.slice(0, 6).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSubject(s)}
                          className="text-xs px-2.5 py-1 rounded-full border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-pine)] hover:text-[var(--color-pine)] transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <input
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="Your goal (optional)"
                      className="w-full atlas-inset px-4 py-2.5 text-sm outline-none focus:border-[var(--color-pine)] transition-colors"
                    />
                    <Button type="submit" disabled={!subject.trim()} className="w-full">
                      <Sparkles size={16} /> Begin the diagnostic
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Course cards — full-width, stacked ── */}
          <div className="space-y-3">
            {courses.map((entry, i) => {
              const pct = masteryPct(entry);
              const concepts = Object.values(entry.model.concepts);
              const totalConcepts = concepts.length;
              const masteredConcepts = concepts.filter((c) => c.mastery >= 0.8).length;
              const isActive = entry.id === activeCourseId;
              const hasCurriculum = !!entry.model.curriculum;
              const nextLesson = getNextLesson(entry);

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                >
                  {/* Card — div wrapper so delete button can live alongside Continue without nesting buttons */}
                  <div
                    onClick={() => continueCourse(entry)}
                    className="atlas-card w-full text-left p-5 hover:-translate-y-0.5 transition-transform cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className="w-11 h-11 rounded-xl grid place-items-center shrink-0 text-[var(--color-on-accent)]"
                        style={{ background: isActive ? "var(--color-pine)" : "var(--color-line-strong)" }}
                      >
                        <BookOpen size={18} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Top row: name + badges | Continue + Delete */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-display text-lg font-semibold leading-tight text-[var(--color-ink)]">
                                {entry.model.subject}
                              </h3>
                              {isActive && (
                                <span className="text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[var(--color-pine)] text-[var(--color-on-accent)]">
                                  Active
                                </span>
                              )}
                              {!hasCurriculum && (
                                <span className="text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[var(--color-terra)] text-[var(--color-on-accent)]">
                                  Assessment pending
                                </span>
                              )}
                            </div>
                            {entry.model.goal && (
                              <p className="text-sm text-[var(--color-ink-faint)] mt-0.5 line-clamp-1">
                                {entry.model.goal}
                              </p>
                            )}
                          </div>
                          {/* Continue + Delete — always visible, side by side */}
                          <div className="flex items-center gap-3 shrink-0 mt-0.5">
                            <span className="flex items-center gap-1 text-sm font-semibold text-[var(--color-pine)]">
                              Continue <ChevronRight size={15} />
                            </span>
                            <button
                              onClick={(e) => handleDeleteCourse(e, entry)}
                              title="Remove course"
                              className="h-7 w-7 rounded-lg grid place-items-center text-[var(--color-ink-faint)] hover:text-[var(--color-rose)] hover:bg-[color-mix(in_srgb,var(--color-rose)_8%,var(--color-card))] transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        {hasCurriculum && totalConcepts > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-[var(--color-ink-faint)] mb-1.5">
                              <span>{pct}% mastery</span>
                              <span>{masteredConcepts} of {totalConcepts} concepts mastered</span>
                            </div>
                            <div className="h-2 rounded-full bg-[var(--color-line)] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[var(--color-pine)] transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Stats + next up */}
                        {hasCurriculum && (
                          <div className="mt-2.5 flex items-center gap-4 text-xs text-[var(--color-ink-faint)] flex-wrap">
                            {entry.model.streak > 0 && (
                              <span className="flex items-center gap-1">
                                <Flame size={11} className="text-[var(--color-terra)]" />
                                {entry.model.streak} day streak
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Sparkles size={11} className="text-[var(--color-gold)]" />
                              {entry.model.xp} XP
                            </span>
                            {entry.model.minutesSpent > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {entry.model.minutesSpent}m studied
                              </span>
                            )}
                            {nextLesson && (
                              <span className="flex items-center gap-1 text-[var(--color-pine)] font-medium ml-auto">
                                <ArrowRight size={11} />
                                Next: {nextLesson.length > 28 ? nextLesson.slice(0, 28) + "…" : nextLesson}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </motion.div>
      </div>
      </>
    );
  }

  // ── No courses yet — full onboarding ───────────────────────────────────────
  return (
    <div className="max-w-3xl w-full mx-auto">
      <div className="pb-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Pill tone="terra" className="mb-5">
            <Compass size={13} /> Adaptive learning cartography
          </Pill>
          <h1 className="font-display text-[2.6rem] sm:text-[3.4rem] leading-[1.05] font-semibold tracking-tight">
            Learning that knows{" "}
            <span className="map-underline">what you know</span>,
            <br className="hidden sm:block" /> what you need next, and how{" "}
            <span className="italic">you</span> learn best.
          </h1>
          <p className="mt-5 text-lg text-[var(--color-ink-soft)] max-w-xl">
            Atlas diagnoses your current understanding, charts a personal path through the concept
            terrain, teaches each idea your way, and adapts after every step.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mt-12"
        >
          <SectionLabel>Start with a charted track</SectionLabel>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            {FEATURED_TRACKS.map((t) => (
              <button
                key={t.id}
                onClick={() => begin(t.subject, t.goal)}
                className="atlas-card group text-left p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-lg font-bold w-11 h-11 rounded-xl grid place-items-center text-white"
                    style={{ background: t.accent }}
                  >
                    {t.glyph}
                  </span>
                  <ArrowRight
                    size={18}
                    className="text-[var(--color-ink-faint)] group-hover:text-[var(--color-pine)] group-hover:translate-x-0.5 transition-all"
                  />
                </div>
                <h3 className="font-display text-xl font-semibold mt-3">{t.subject}</h3>
                <p className="text-sm text-[var(--color-ink-soft)] mt-1">{t.tagline}</p>
                <p className="text-xs text-[var(--color-ink-faint)] mt-3 inline-flex items-center gap-1.5">
                  <Target size={12} /> {t.goal}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-8">
            <SectionLabel>…or chart any subject</SectionLabel>
            <form
              onSubmit={(e) => { e.preventDefault(); begin(subject, goal); }}
              className="atlas-card p-5 mt-4 space-y-4"
            >
              <div>
                <label className="text-sm font-semibold text-[var(--color-ink)]">
                  What do you want to learn?
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Machine Learning, Music Theory, Spanish grammar…"
                  className="mt-2 w-full atlas-inset px-4 py-3 outline-none focus:border-[var(--color-pine)] transition-colors"
                />
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {SUBJECT_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubject(s)}
                      className="text-xs px-2.5 py-1 rounded-full border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-pine)] hover:text-[var(--color-pine)] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-[var(--color-ink)]">
                  Your goal{" "}
                  <span className="font-normal text-[var(--color-ink-faint)]">
                    (optional - shapes the path)
                  </span>
                </label>
                <input
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Build a recommender for a side project"
                  className="mt-2 w-full atlas-inset px-4 py-3 outline-none focus:border-[var(--color-pine)] transition-colors"
                />
              </div>
              <Button type="submit" size="lg" disabled={!subject.trim()} className="w-full">
                <Sparkles size={18} /> Begin the diagnostic
              </Button>
            </form>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: Compass, t: "Diagnose", d: "An adaptive quiz finds your edge" },
              { icon: Map, t: "Chart", d: "A path built only for you" },
              { icon: Sparkles, t: "Adapt", d: "Re-routes after every step" },
            ].map((f) => (
              <div key={f.t} className="px-2">
                <f.icon size={18} className="mx-auto text-[var(--color-pine)]" />
                <div className="font-display font-semibold mt-2">{f.t}</div>
                <div className="text-xs text-[var(--color-ink-faint)] mt-0.5">{f.d}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
