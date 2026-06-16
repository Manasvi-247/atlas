"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Gauge, ArrowRight, ArrowLeft, RotateCcw, MessagesSquare, Map as MapIcon, Check, X, Star } from "lucide-react";
import { Button, MasteryRing, Pill, SectionLabel, Spinner, cx } from "./ui";
import { Markdown } from "./Markdown";
import { NotePad } from "./NotePad";
import { useAtlas } from "@/lib/store";
import type { QuizQuestion, QuizResult } from "@/lib/types";

export function Quiz({
  lessonId,
  lessonText,
  onBackToLesson,
  onExit,
  onNextLesson,
  onAskTutor,
}: {
  lessonId: string;
  lessonText: string;
  onBackToLesson: () => void;
  onExit: () => void;
  onNextLesson: () => void;
  onAskTutor: () => void;
}) {
  const model = useAtlas((s) => s.model);
  const recordQuiz = useAtlas((s) => s.recordQuiz);
  const toggleStar = useAtlas((s) => s.toggleStar);
  const starred = useAtlas((s) => s.starred);

  const lesson = model.curriculum?.lessons[lessonId];
  const concept = lesson ? model.concepts[lesson.conceptId] : undefined;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(0.6);
  const [revealed, setRevealed] = useState(false);
  const [responses, setResponses] = useState<{ correct: boolean; confidence: number; concepts: string[] }[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const recordedRef = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: model.subject,
            concept: { id: concept?.id, name: concept?.name },
            lessonText,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not build quiz");
        if (active) setQuestions(data.quiz || []);
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finalize(allResponses: typeof responses) {
    const correct = allResponses.filter((r) => r.correct).length;
    const score = allResponses.length ? correct / allResponses.length : 0;
    const avgConf = allResponses.length
      ? allResponses.reduce((a, r) => a + r.confidence, 0) / allResponses.length
      : 0;

    const perConceptMap = new Map<string, { correct: number; total: number }>();
    for (const r of allResponses) {
      const cset = r.concepts.length ? r.concepts : concept ? [concept.id] : [];
      for (const cid of cset) {
        const e = perConceptMap.get(cid) || { correct: 0, total: 0 };
        e.total += 1;
        if (r.correct) e.correct += 1;
        perConceptMap.set(cid, e);
      }
    }
    // Always ensure the lesson's own concept is updated.
    if (concept && !perConceptMap.has(concept.id)) {
      perConceptMap.set(concept.id, { correct, total: allResponses.length });
    }
    const res: QuizResult = {
      lessonId,
      score,
      perConcept: [...perConceptMap.entries()].map(([conceptId, v]) => ({ conceptId, ...v })),
      confidenceGap: avgConf - score,
    };
    if (!recordedRef.current) {
      recordQuiz(res);
      recordedRef.current = true;
    }
    setResult(res);
  }

  function submit() {
    if (chosen == null) return;
    setRevealed(true);
  }

  function next() {
    if (chosen == null) return;
    const q = questions[idx];
    const r = { correct: chosen === q.answerIndex, confidence, concepts: q.concepts || [] };
    const all = [...responses, r];
    setResponses(all);
    setChosen(null);
    setConfidence(0.6);
    setRevealed(false);
    if (idx + 1 >= questions.length) {
      finalize(all);
    } else {
      setIdx(idx + 1);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto grid place-items-center min-h-[40vh]">
        <Spinner label="Building a check on what you just learned…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto atlas-card p-6">
        <p className="text-[var(--color-rose)]">{error}</p>
        <Button className="mt-4" variant="outline" onClick={onBackToLesson}>
          <ArrowLeft size={16} /> Back to lesson
        </Button>
      </div>
    );
  }

  if (result) {
    return (
      <QuizResultView
        result={result}
        conceptName={concept?.name ?? ""}
        newMastery={concept ? model.concepts[concept.id]?.mastery ?? 0 : 0}
        onExit={onExit}
        onNextLesson={onNextLesson}
        onAskTutor={onAskTutor}
        onRetry={onBackToLesson}
      />
    );
  }

  const q = questions[idx];
  if (!q) return null;

  return (
    <div className="max-w-2xl w-full mx-auto float-in min-h-[72vh] flex flex-col justify-center">
      <div className="flex items-center justify-between">
        <SectionLabel>Understanding check · {concept?.name}</SectionLabel>
        <span className="text-xs text-[var(--color-ink-faint)]">
          {idx + 1} / {questions.length}
        </span>
      </div>

      <motion.div
        key={q.id}
        initial={{ opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0 }}
        className="atlas-card p-6 mt-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="lesson-prose text-[1.05rem] flex-1">
            <Markdown text={q.prompt} />
          </div>
          {(() => {
            const starId = `${lessonId}:${q.id}`;
            const isStarred = starred.some((x) => x.id === starId);
            return (
              <button
                onClick={() =>
                  toggleStar({
                    id: starId,
                    prompt: q.prompt,
                    concept: concept?.name ?? "",
                    kind: "quiz",
                  })
                }
                title={isStarred ? "Unstar" : "Star this question for later"}
                className={cx(
                  "shrink-0 mt-0.5 transition-colors",
                  isStarred
                    ? "text-[var(--color-gold)]"
                    : "text-[var(--color-ink-faint)] hover:text-[var(--color-gold)]"
                )}
              >
                <Star size={20} fill={isStarred ? "var(--color-gold)" : "none"} />
              </button>
            );
          })()}
        </div>

        <div className="mt-4 space-y-2.5">
          {q.choices.map((choice, i) => {
            const isChosen = chosen === i;
            const isCorrect = i === q.answerIndex;
            let state = "idle";
            if (revealed) {
              if (isCorrect) state = "correct";
              else if (isChosen) state = "wrong";
            } else if (isChosen) state = "chosen";
            return (
              <button
                key={i}
                disabled={revealed}
                onClick={() => setChosen(i)}
                className={cx(
                  "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3",
                  state === "idle" && "border-[var(--color-line)] hover:border-[var(--color-line-strong)] bg-[var(--color-card)]",
                  state === "chosen" && "border-[var(--color-pine)] bg-[color-mix(in_srgb,var(--color-pine)_8%,var(--color-card))]",
                  state === "correct" && "border-[var(--color-pine)] bg-[color-mix(in_srgb,var(--color-pine)_14%,var(--color-card))]",
                  state === "wrong" && "border-[var(--color-rose)] bg-[color-mix(in_srgb,var(--color-rose)_10%,var(--color-card))]"
                )}
              >
                <span
                  className={cx(
                    "shrink-0 w-6 h-6 rounded-full grid place-items-center text-xs font-bold border",
                    state === "correct" && "bg-[var(--color-pine)] text-white border-transparent",
                    state === "wrong" && "bg-[var(--color-rose)] text-white border-transparent",
                    (state === "idle" || state === "chosen") && "border-[var(--color-line-strong)]"
                  )}
                >
                  {state === "correct" ? <Check size={14} /> : state === "wrong" ? <X size={14} /> : String.fromCharCode(65 + i)}
                </span>
                <span className="text-[0.97rem] text-[var(--color-ink)]">{choice}</span>
              </button>
            );
          })}
        </div>

        {!revealed && (
          <div className="mt-5 atlas-inset p-3.5">
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-soft)]">
                <Gauge size={15} /> Confidence
              </span>
              <span className="font-semibold">{Math.round(confidence * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(confidence * 100)}
              onChange={(e) => setConfidence(Number(e.target.value) / 100)}
              className="w-full mt-2 accent-[var(--color-terra)]"
            />
          </div>
        )}

        {revealed && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 atlas-inset p-4">
            <div className="text-sm font-semibold mb-1">
              {chosen === q.answerIndex ? "Correct" : "Not quite"}
            </div>
            <div className="text-sm text-[var(--color-ink-soft)]">
              <Markdown text={q.explanation} />
            </div>
          </motion.div>
        )}

        <div className="mt-5 flex justify-end">
          {!revealed ? (
            <Button onClick={submit} disabled={chosen == null}>
              Check
            </Button>
          ) : (
            <Button onClick={next} variant={idx + 1 >= questions.length ? "terra" : "primary"}>
              {idx + 1 >= questions.length ? "See results" : "Next"} <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </motion.div>

      <div className="mt-4">
        <NotePad
          compact
          context={`${concept?.name ?? "Quiz"}: ${q.prompt
            .replace(/```[\s\S]*?```/g, "")
            .replace(/`/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 90)}`}
        />
      </div>
    </div>
  );
}

function QuizResultView({
  result,
  conceptName,
  newMastery,
  onExit,
  onNextLesson,
  onAskTutor,
  onRetry,
}: {
  result: QuizResult;
  conceptName: string;
  newMastery: number;
  onExit: () => void;
  onNextLesson: () => void;
  onAskTutor: () => void;
  onRetry: () => void;
}) {
  const pct = Math.round(result.score * 100);
  const weak = result.score < 0.6;
  const over = result.confidenceGap > 0.18;
  const under = result.confidenceGap < -0.18;

  return (
    <div className="max-w-2xl w-full mx-auto float-in min-h-[72vh] flex flex-col justify-center">
      <div className="atlas-card p-7 text-center">
        <div className="flex justify-center">
          <MasteryRing
            value={result.score}
            size={92}
            stroke={8}
            color={weak ? "var(--color-rose)" : "var(--color-pine)"}
            label={`${pct}%`}
          />
        </div>
        <h2 className="font-display text-2xl font-semibold mt-4">
          {weak ? "Worth another pass" : pct >= 90 ? "Mastered" : "Solid progress"}
        </h2>
        <p className="text-[var(--color-ink-soft)] mt-1">
          {weak
            ? `Atlas moved “${conceptName}” back up your path so you'll revisit it soon.`
            : `Your mastery of “${conceptName}” is now ${Math.round(newMastery * 100)}%.`}
        </p>

        {/* Calibration insight */}
        {(over || under) && (
          <div className="mt-4 inline-flex items-center gap-2 text-sm">
            <Pill tone={over ? "rose" : "pine"}>
              <Gauge size={12} /> {over ? "Overconfident" : "Underconfident"}
            </Pill>
            <span className="text-[var(--color-ink-soft)]">
              {over
                ? "You felt surer than your answers showed — slow down on the tricky ones."
                : "You knew more than you felt — trust your reasoning a bit more."}
            </span>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {weak ? (
            <>
              <Button variant="terra" onClick={onAskTutor}>
                <MessagesSquare size={16} /> Work through it with the tutor
              </Button>
              <Button variant="outline" onClick={onRetry}>
                <RotateCcw size={16} /> Reread the lesson
              </Button>
            </>
          ) : (
            <>
              <Button variant="terra" onClick={onNextLesson}>
                Next lesson <ArrowRight size={16} />
              </Button>
              <Button variant="outline" onClick={onExit}>
                <MapIcon size={16} /> View path
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
