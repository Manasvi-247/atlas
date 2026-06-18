"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, Check, Compass } from "lucide-react";
import { useAtlas } from "@/lib/store";
import { cx } from "./ui";
import type { CourseEntry } from "@/lib/types";

function masteryPct(entry: CourseEntry): number {
  const cs = Object.values(entry.model.concepts);
  if (!cs.length) return 0;
  return Math.round((cs.reduce((a, c) => a + c.mastery, 0) / cs.length) * 100);
}

export function CourseSwitcher() {
  const router = useRouter();
  const hydrated = useAtlas((s) => s.hydrated);
  const model = useAtlas((s) => s.model);
  const activeCourseId = useAtlas((s) => s.activeCourseId);
  const getAllCourses = useAtlas((s) => s.getAllCourses);
  const switchCourse = useAtlas((s) => s.switchCourse);
  const [open, setOpen] = useState(false);

  if (!hydrated) return null;

  const courses = getAllCourses();
  const courseCount = courses.length;
  const activeIndex = courses.findIndex((c) => c.id === activeCourseId);
  // Only the courses that are NOT currently active
  const otherCourses = courses.filter((c) => c.id !== activeCourseId);

  const statusLabel = !model.subject
    ? "Pick a subject"
    : !model.curriculum
    ? "Diagnostic in progress"
    : courseCount > 1
    ? `Course ${activeIndex + 1} of ${courseCount}`
    : "Currently studying";

  function handleSwitch(id: string) {
    switchCourse(id);
    setOpen(false);
    router.push("/dashboard");
  }


  return (
    <div className="border-b border-[var(--color-line)]">
      {/* ── "My Courses" header label ── */}
      <div className="px-4 pt-4 pb-1">
        <button
          onClick={() => router.push("/start")}
          className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[var(--color-pine)] hover:opacity-70 transition-opacity"
        >
          My Courses
        </button>
      </div>

      {/* ── Active course row ── */}
      <div className="px-4 pb-4 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-faint)] mt-0.5">
            {statusLabel}
          </div>
          <div className="font-display text-base font-semibold mt-0.5 leading-snug truncate text-[var(--color-ink)]">
            {model.subject || "Atlas"}
          </div>
          {model.goal && (
            <div className="text-[0.7rem] text-[var(--color-ink-faint)] mt-0.5 line-clamp-2 leading-snug">
              {model.goal}
            </div>
          )}
        </div>

        {/* ── Action buttons — bigger, bolder ── */}
        <div className="flex items-center gap-1.5 mt-0.5 shrink-0">
          <button
            onClick={() => { setOpen(false); router.push("/start"); }}
            title="Add a new course"
            className="h-8 w-8 rounded-lg grid place-items-center text-[var(--color-ink-soft)] hover:text-[var(--color-pine)] hover:bg-[color-mix(in_srgb,var(--color-pine)_12%,transparent)] transition-colors"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
          {courseCount > 1 && (
            <button
              onClick={() => setOpen((v) => !v)}
              title="Switch course"
              className={cx(
                "h-8 w-8 rounded-lg grid place-items-center transition-colors",
                open
                  ? "text-[var(--color-pine)] bg-[color-mix(in_srgb,var(--color-pine)_12%,transparent)]"
                  : "text-[var(--color-ink-soft)] hover:text-[var(--color-pine)] hover:bg-[color-mix(in_srgb,var(--color-pine)_12%,transparent)]"
              )}
            >
              {open ? <ChevronUp size={18} strokeWidth={2.5} /> : <ChevronDown size={18} strokeWidth={2.5} />}
            </button>
          )}
        </div>
      </div>

      {/* ── Expanded course list — active (tick only) + others ── */}
      {open && courseCount > 1 && (
        <div className="px-3 pb-3 space-y-2">
          {/* Active course — tick only, no duplicate content */}
          <div className="rounded-xl border border-[var(--color-pine)] bg-[color-mix(in_srgb,var(--color-pine)_8%,var(--color-card))] px-3 py-2 flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-[var(--color-pine)] grid place-items-center shrink-0">
              <Check size={10} className="text-[var(--color-on-accent)]" />
            </span>
            <span className="text-sm font-semibold text-[var(--color-pine)] truncate flex-1">
              {model.subject}
            </span>
            <span className="text-[0.65rem] text-[var(--color-pine)] opacity-70 shrink-0">active</span>
          </div>

          {/* Other courses */}
          {otherCourses.map((entry) => {
            const pct = masteryPct(entry);
            const conceptCount = Object.keys(entry.model.concepts).length;
            const hasCurriculum = !!entry.model.curriculum;

            return (
              <div
                key={entry.id}
                className="rounded-xl border border-[var(--color-line)] hover:border-[var(--color-line-strong)] transition-colors p-3"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate text-[var(--color-ink)]">
                      {entry.model.subject}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[0.68rem] text-[var(--color-ink-faint)]">
                      {hasCurriculum ? (
                        <>
                          <span>{pct}% mastery</span>
                          {conceptCount > 0 && <span>· {conceptCount} concepts</span>}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--color-terra)]">
                          <Compass size={10} /> Assessment pending
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleSwitch(entry.id)}
                      className="text-[0.68rem] font-semibold px-2 py-1 rounded-lg bg-[var(--color-pine)] text-[var(--color-on-accent)] hover:opacity-90 transition-opacity"
                    >
                      Switch
                    </button>
                  </div>
                </div>
                {hasCurriculum && conceptCount > 0 && (
                  <div className="mt-2 h-1 rounded-full bg-[var(--color-line)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-pine)] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
