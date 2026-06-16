"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  MessagesSquare,
  ArrowLeft,
  CheckCircle2,
  Lightbulb,
  Check,
  X,
} from "lucide-react";
import { Button, Pill, SectionLabel, Spinner, cx } from "./ui";
import { Markdown } from "./Markdown";
import { useStream } from "@/lib/useStream";
import { useAtlas } from "@/lib/store";
import { MODALITY_LABELS } from "@/lib/types";
import type { Modality } from "@/lib/types";
import { Quiz } from "./Quiz";

// ── Lesson markdown → segments (markdown + interactive practice widgets) ──────

type PracticeOption = { text: string; correct: boolean };
type Segment =
  | { type: "md"; text: string }
  | { type: "practice"; q: string; options: PracticeOption[]; hint?: string };

function parseLesson(text: string): { segments: Segment[]; openPractice: boolean } {
  const segments: Segment[] = [];
  const fence = /```practice\s*([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = fence.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: "md", text: text.slice(last, m.index) });
    segments.push(parsePractice(m[1]));
    last = m.index + m[0].length;
  }
  const tail = text.slice(last);
  // Detect an unclosed practice fence still streaming.
  const openIdx = tail.indexOf("```practice");
  if (openIdx >= 0) {
    if (openIdx > 0) segments.push({ type: "md", text: tail.slice(0, openIdx) });
    return { segments, openPractice: true };
  }
  if (tail.trim()) segments.push({ type: "md", text: tail });
  return { segments, openPractice: false };
}

function parsePractice(body: string): Segment {
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  let q = "";
  let hint: string | undefined;
  const options: PracticeOption[] = [];
  for (const line of lines) {
    if (line.startsWith("Q:")) q = line.slice(2).trim();
    else if (line.startsWith("Hint:")) hint = line.slice(5).trim();
    else if (line.startsWith("* ")) options.push({ text: line.slice(2).trim(), correct: true });
    else if (line.startsWith("- ")) options.push({ text: line.slice(2).trim(), correct: false });
    else if (line.startsWith("*")) options.push({ text: line.slice(1).trim(), correct: true });
  }
  // Defensive: drop duplicate options (keep the first, preferring a correct one)
  // and keep at most one correct answer, so a malformed block never shows the
  // answer twice.
  const deduped: PracticeOption[] = [];
  const seen = new Set<string>();
  let haveCorrect = false;
  for (const o of options) {
    const key = o.text.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const correct = o.correct && !haveCorrect;
    if (correct) haveCorrect = true;
    deduped.push({ text: o.text, correct });
  }
  return { type: "practice", q, options: deduped, hint };
}

const MODALITIES: Modality[] = ["analogy", "visual", "code", "story", "formal"];

export function LessonView({
  lessonId,
  onExit,
  onNextLesson,
  onAskTutor,
}: {
  lessonId: string;
  onExit: () => void;
  onNextLesson: () => void;
  onAskTutor: (conceptId: string) => void;
}) {
  const model = useAtlas((s) => s.model);
  const recordLessonDone = useAtlas((s) => s.recordLessonDone);
  const nudgeStyle = useAtlas((s) => s.nudgeStyle);

  const lesson = model.curriculum?.lessons[lessonId];
  const concept = lesson ? model.concepts[lesson.conceptId] : undefined;

  const lessonStream = useStream();
  const explainStream = useStream();

  const [mode, setMode] = useState<"lesson" | "quiz">("lesson");
  const [explainOpen, setExplainOpen] = useState(false);
  const [activeModality, setActiveModality] = useState<Modality | null>(null);
  const [completed, setCompleted] = useState(false);
  const startTime = useRef<number>(Date.now());

  const knownConcepts = useMemo(
    () =>
      Object.values(model.concepts)
        .filter((c) => c.mastery >= 0.7 && c.id !== concept?.id)
        .map((c) => c.name)
        .slice(0, 8),
    [model.concepts, concept?.id]
  );

  // Stream the lesson when the lesson changes.
  useEffect(() => {
    if (!lesson || !concept) return;
    startTime.current = Date.now();
    setMode("lesson");
    setExplainOpen(false);
    setActiveModality(null);
    setCompleted(false);
    lessonStream.run("/api/lesson", {
      subject: model.subject,
      goal: model.goal,
      concept: { name: concept.name, summary: concept.summary, difficulty: concept.difficulty },
      style: model.style,
      knownConcepts,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  if (!lesson || !concept) {
    return (
      <div className="grid place-items-center min-h-[40vh]">
        <Button variant="outline" onClick={onExit}>
          <ArrowLeft size={16} /> Back to path
        </Button>
      </div>
    );
  }

  const { segments, openPractice } = parseLesson(lessonStream.text);

  function explainWith(modality: Modality) {
    setActiveModality(modality);
    setExplainOpen(true);
    nudgeStyle(modality, 0.12); // learning-style adapts to what they reach for
    explainStream.run("/api/explain", {
      subject: model.subject,
      goal: model.goal,
      concept: { name: concept!.name, summary: concept!.summary },
      modality,
    });
  }

  function markComplete() {
    if (!completed) {
      const minutes = Math.max(1, Math.round((Date.now() - startTime.current) / 60000));
      recordLessonDone(lessonId, Math.min(minutes, lesson!.minutes + 4));
      setCompleted(true);
    }
    setMode("quiz");
  }

  if (mode === "quiz") {
    return (
      <Quiz
        lessonId={lessonId}
        lessonText={lessonStream.text}
        onBackToLesson={() => setMode("lesson")}
        onExit={onExit}
        onNextLesson={onNextLesson}
        onAskTutor={() => onAskTutor(concept.id)}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto float-in">
      <button
        onClick={onExit}
        className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] inline-flex items-center gap-1.5"
      >
        <ArrowLeft size={15} /> Path
      </button>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <Pill tone="terra">Lesson · difficulty {concept.difficulty}/5</Pill>
        <Pill tone="neutral">~{lesson.minutes} min</Pill>
        {model.style && (
          <Pill tone="pine">
            <Sparkles size={12} /> tuned to your style
          </Pill>
        )}
      </div>

      <h1 className="font-display text-[2.1rem] leading-tight font-semibold mt-3">{lesson.title}</h1>
      <p className="text-[var(--color-ink-soft)] mt-1">{concept.summary}</p>

      <article className="atlas-card p-7 mt-6">
        {lessonStream.text === "" && lessonStream.streaming ? (
          <Spinner label="Writing your lesson…" />
        ) : (
          <div className={cx(lessonStream.streaming && "caret")}>
            {segments.map((seg, i) =>
              seg.type === "md" ? (
                <Markdown key={i} text={seg.text} />
              ) : (
                <PracticeWidget key={i} seg={seg} />
              )
            )}
            {openPractice && <div className="text-[var(--color-ink-faint)] text-sm">…</div>}
          </div>
        )}
        {lessonStream.error && (
          <div className="text-sm text-[var(--color-rose)] mt-3">{lessonStream.error}</div>
        )}
      </article>

      {/* Explain differently */}
      <div className="mt-5 atlas-card p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 text-sm font-semibold">
            <RefreshCw size={15} className="text-[var(--color-terra)]" /> Didn&apos;t land? Explain it…
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MODALITIES.map((mo) => (
              <button
                key={mo}
                onClick={() => explainWith(mo)}
                className={cx(
                  "text-xs px-3 py-1.5 rounded-full border transition-colors",
                  activeModality === mo
                    ? "border-[var(--color-terra)] bg-[color-mix(in_srgb,var(--color-terra)_12%,var(--color-card))] text-[var(--color-terra)]"
                    : "border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-line-strong)]"
                )}
              >
                {MODALITY_LABELS[mo]}
              </button>
            ))}
          </div>
        </div>
        {explainOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 atlas-inset p-4 overflow-hidden"
          >
            {explainStream.text === "" && explainStream.streaming ? (
              <Spinner label="Re-explaining…" />
            ) : (
              <div className={cx(explainStream.streaming && "caret")}>
                <Markdown text={explainStream.text} />
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" onClick={() => onAskTutor(concept.id)}>
          <MessagesSquare size={16} /> Ask the tutor
        </Button>
        <Button variant="terra" size="lg" onClick={markComplete} disabled={lessonStream.streaming}>
          <CheckCircle2 size={18} /> Check my understanding
        </Button>
      </div>
    </div>
  );
}

function PracticeWidget({ seg }: { seg: Extract<Segment, { type: "practice" }> }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  if (!seg.q || seg.options.length === 0) return null;
  const answered = picked !== null;

  return (
    <div className="my-5 rounded-2xl border border-[color-mix(in_srgb,var(--color-terra)_30%,var(--color-card))] bg-[color-mix(in_srgb,var(--color-terra)_6%,var(--color-card))] p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--color-terra)] mb-2">
        <Lightbulb size={13} /> Quick check
      </div>
      <div className="font-medium text-[var(--color-ink)]">
        <Markdown text={seg.q} />
      </div>
      <div className="mt-3 space-y-2">
        {seg.options.map((o, i) => {
          const isPicked = picked === i;
          let cls = "border-[var(--color-line)] bg-[var(--color-card)] hover:border-[var(--color-line-strong)]";
          if (answered && o.correct) cls = "border-[var(--color-pine)] bg-[color-mix(in_srgb,var(--color-pine)_14%,var(--color-card))]";
          else if (answered && isPicked && !o.correct) cls = "border-[var(--color-rose)] bg-[color-mix(in_srgb,var(--color-rose)_10%,var(--color-card))]";
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setPicked(i)}
              className={cx("w-full text-left px-3.5 py-2.5 rounded-xl border text-sm transition-all flex items-center gap-2.5", cls)}
            >
              {answered && o.correct ? (
                <Check size={15} className="text-[var(--color-pine)] shrink-0" />
              ) : answered && isPicked ? (
                <X size={15} className="text-[var(--color-rose)] shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-[var(--color-line-strong)] shrink-0" />
              )}
              {o.text}
            </button>
          );
        })}
      </div>
      <div className="mt-2.5 flex items-center gap-3">
        {seg.hint && !answered && (
          <button
            onClick={() => setShowHint((v) => !v)}
            className="text-xs text-[var(--color-terra)] hover:underline"
          >
            {showHint ? "Hide hint" : "Need a hint?"}
          </button>
        )}
        {answered && (
          <span
            className={cx(
              "text-xs font-semibold",
              seg.options[picked!].correct ? "text-[var(--color-pine)]" : "text-[var(--color-rose)]"
            )}
          >
            {seg.options[picked!].correct ? "Nice - that's right." : "Not quite - see the highlighted answer."}
          </span>
        )}
      </div>
      {showHint && seg.hint && !answered && (
        <div className="mt-2 text-xs text-[var(--color-ink-soft)] italic">{seg.hint}</div>
      )}
    </div>
  );
}
