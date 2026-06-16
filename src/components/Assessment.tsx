"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  X,
  Gauge,
  Compass,
  MapPinned,
  Loader2,
  Star,
  Target,
  Layers,
} from "lucide-react";
import { Button, MasteryRing, Pill, SectionLabel, Spinner, cx } from "./ui";
import { Markdown } from "./Markdown";
import { NotePad } from "./NotePad";
import { useAtlas } from "@/lib/store";
import type {
  AssessmentAnswer,
  AssessmentQuestion,
  Diagnosis,
  LearningStyle,
} from "@/lib/types";

const TARGET = 8;
const MIN_BEFORE_FINISH = 5;

type Phase = "quiz" | "diagnosing" | "diagnosis" | "building";

export function Assessment({ onDone }: { onDone: () => void }) {
  const model = useAtlas((s) => s.model);
  const setDiagnosis = useAtlas((s) => s.setDiagnosis);
  const buildCurriculum = useAtlas((s) => s.buildCurriculum);
  const recordAssessment = useAtlas((s) => s.recordAssessment);
  const toggleStar = useAtlas((s) => s.toggleStar);
  const starred = useAtlas((s) => s.starred);

  const [phase, setPhase] = useState<Phase>("quiz");
  const [queue, setQueue] = useState<AssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(0.6);
  const [revealed, setRevealed] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosis, setLocalDiagnosis] = useState<(Diagnosis & { styleHint: LearningStyle }) | null>(null);

  const fetchingRef = useRef(false);
  const askedRef = useRef<Set<string>>(new Set());

  const answersRef = useRef<AssessmentAnswer[]>([]);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const fetchBatch = useCallback(
    async (size: number) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setFetching(true);
      setError(null);
      try {
        const res = await fetch("/api/assess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: model.subject,
            goal: model.goal,
            batchSize: size,
            history: answersRef.current.map((a) => ({
              concept: a.concept,
              difficulty: a.difficulty,
              correct: a.correct,
            })),
            askedConcepts: [...askedRef.current],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load questions");
        const fresh: AssessmentQuestion[] = (data.questions || []).filter(
          (q: AssessmentQuestion) => !askedRef.current.has(q.concept.toLowerCase())
        );
        fresh.forEach((q) => askedRef.current.add(q.concept.toLowerCase()));
        setQueue((prev) => [...prev, ...fresh]);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        fetchingRef.current = false;
        setFetching(false);
      }
    },
    [model.subject, model.goal]
  );

  useEffect(() => {
    fetchBatch(3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answered = answers.length;
  const correctCount = answers.filter((a) => a.correct).length;
  const current = queue[0] ?? null;
  const avgDifficulty = answered
    ? Math.round(answers.reduce((a, h) => a + h.difficulty, 0) / answered)
    : current?.difficulty ?? 2;

  useEffect(() => {
    if (phase !== "quiz") return;
    if (queue.length <= 1 && answered + queue.length < TARGET && !fetchingRef.current) {
      fetchBatch(2);
    }
  }, [queue.length, answered, phase, fetchBatch]);

  function check() {
    if (chosen == null || !current) return;
    setRevealed(true);
  }

  function next() {
    if (chosen == null || !current) return;
    const ans: AssessmentAnswer = {
      questionId: current.id,
      concept: current.concept,
      difficulty: current.difficulty,
      chosenIndex: chosen,
      correct: chosen === current.answerIndex,
      confidence,
    };
    setAnswers([...answers, ans]);
    setQueue((q) => q.slice(1));
    setChosen(null);
    setConfidence(0.6);
    setRevealed(false);
  }

  async function diagnose() {
    setPhase("diagnosing");
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: model.subject,
          goal: model.goal,
          answers: answers.map((a) => ({ ...a })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Diagnosis failed");
      setLocalDiagnosis(data);
      setDiagnosis(data, data.styleHint);
      recordAssessment(answers.length);
      setPhase("diagnosis");
    } catch (e) {
      setError((e as Error).message);
      setPhase("quiz");
    }
  }

  async function build() {
    if (!diagnosis) return;
    setPhase("building");
    try {
      const res = await fetch("/api/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: model.subject, goal: model.goal, diagnosis }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not build curriculum");
      if (!Array.isArray(data.concepts) || data.concepts.length === 0) {
        throw new Error("The curriculum came back empty — please try again.");
      }
      buildCurriculum(data.concepts, data.modules ?? []);
      onDone();
    } catch (e) {
      setError((e as Error).message);
      setPhase("diagnosis");
    }
  }

  if (phase === "diagnosing" || phase === "building") {
    return (
      <div className="min-h-[65vh] grid place-items-center text-center px-6">
        <div className="float-in">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--color-pine)] grid place-items-center text-white">
            <Loader2 className="animate-spin" />
          </div>
          <h2 className="font-display text-2xl font-semibold mt-5">
            {phase === "diagnosing" ? "Locating your knowledge boundary…" : "Charting your path…"}
          </h2>
          <p className="text-[var(--color-ink-soft)] mt-2 max-w-sm mx-auto">
            {phase === "diagnosing"
              ? "Atlas is analysing every answer — what you know, what's at your edge, and how you reason."
              : "Sequencing concepts, ordering prerequisites, and tailoring each module to your goal."}
          </p>
        </div>
      </div>
    );
  }

  if (phase === "diagnosis" && diagnosis) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <DiagnosisReveal d={diagnosis} subject={model.subject} onBuild={build} error={error} />
      </div>
    );
  }

  const progress = Math.min(1, answered / TARGET);
  const accuracy = answered ? correctCount / answered : 0;
  const isStarred = current ? starred.some((x) => x.id === current.id) : false;

  return (
    <div className="min-h-[70vh] flex items-center">
      <div className="w-full">
        <div className="w-full grid lg:grid-cols-[1fr_300px] gap-6 items-start">
          {/* ── Main question column ───────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between">
              <SectionLabel>{model.subject} · adaptive diagnostic</SectionLabel>
              <span className="text-xs text-[var(--color-ink-faint)] inline-flex items-center gap-1.5">
                {fetching && <Loader2 size={12} className="animate-spin" />}
                {fetching ? "calibrating difficulty" : `question ${Math.min(answered + 1, TARGET)} of ~${TARGET}`}
              </span>
            </div>

            <div className="mt-3 h-1.5 rounded-full bg-[var(--color-line)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-terra)] rounded-full transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            {error && (
              <div className="mt-4 atlas-inset p-3 text-sm text-[var(--color-rose)] flex items-center justify-between">
                {error}
                <Button size="sm" variant="outline" onClick={() => fetchBatch(2)}>
                  Retry
                </Button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {current ? (
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  className="atlas-card p-6 mt-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Pill tone="pine">{current.concept}</Pill>
                      <Pill tone="neutral">difficulty {current.difficulty}/5</Pill>
                    </div>
                    <button
                      onClick={() =>
                        toggleStar({
                          id: current.id,
                          prompt: current.prompt,
                          concept: current.concept,
                          kind: "assessment",
                        })
                      }
                      title={isStarred ? "Unstar" : "Star this question for later"}
                      className={cx(
                        "shrink-0 transition-colors",
                        isStarred ? "text-[var(--color-gold)]" : "text-[var(--color-ink-faint)] hover:text-[var(--color-gold)]"
                      )}
                    >
                      <Star size={20} fill={isStarred ? "var(--color-gold)" : "none"} />
                    </button>
                  </div>

                  <div className="lesson-prose text-[1.08rem]">
                    <Markdown text={current.prompt} />
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {current.choices.map((choice, i) => {
                      const isChosen = chosen === i;
                      const isCorrect = i === current.answerIndex;
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
                            state === "idle" &&
                              "border-[var(--color-line)] hover:border-[var(--color-line-strong)] bg-[var(--color-card)]",
                            state === "chosen" &&
                              "border-[var(--color-pine)] bg-[color-mix(in_srgb,var(--color-pine)_8%,var(--color-card))]",
                            state === "correct" &&
                              "border-[var(--color-pine)] bg-[color-mix(in_srgb,var(--color-pine)_14%,var(--color-card))]",
                            state === "wrong" &&
                              "border-[var(--color-rose)] bg-[color-mix(in_srgb,var(--color-rose)_10%,var(--color-card))]"
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
                          <span className="text-[0.97rem]">{choice}</span>
                        </button>
                      );
                    })}
                  </div>

                  {!revealed && (
                    <div className="mt-5 atlas-inset p-3.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-soft)]">
                          <Gauge size={15} /> How sure are you?
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
                        {chosen === current.answerIndex ? "Correct" : "Not quite"}
                      </div>
                      <div className="text-sm text-[var(--color-ink-soft)]">
                        <Markdown text={current.explanation} />
                      </div>
                    </motion.div>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <button
                      onClick={diagnose}
                      disabled={answered < MIN_BEFORE_FINISH}
                      className="text-sm text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] disabled:opacity-40"
                      title={answered < MIN_BEFORE_FINISH ? `Answer ${MIN_BEFORE_FINISH - answered} more to finish early` : "Finish now"}
                    >
                      Finish &amp; diagnose
                    </button>
                    {!revealed ? (
                      <Button onClick={check} disabled={chosen == null}>
                        Check answer
                      </Button>
                    ) : answered + 1 >= TARGET ? (
                      <Button onClick={diagnose} variant="terra">
                        See my diagnosis <ArrowRight size={17} />
                      </Button>
                    ) : (
                      <Button onClick={next}>
                        Next <ArrowRight size={17} />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="atlas-card p-10 mt-5 grid place-items-center">
                  <Spinner label="Writing your first questions…" />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Side rail ──────────────────────────────────────────── */}
          <aside className="space-y-4">
            <div className="atlas-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold">Your run</h3>
                <MasteryRing value={accuracy} size={42} stroke={5} color="var(--color-terra)" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Stat label="Answered" value={`${answered}`} />
                <Stat label="Correct" value={`${correctCount}`} />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-[var(--color-ink-faint)] mb-1.5">
                  <span className="inline-flex items-center gap-1">
                    <Target size={12} /> Current difficulty
                  </span>
                  <span>{avgDifficulty}/5</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 flex-1 rounded-full"
                      style={{ background: d <= avgDifficulty ? "var(--color-terra)" : "var(--color-line)" }}
                    />
                  ))}
                </div>
                <p className="text-[0.7rem] text-[var(--color-ink-faint)] mt-2 leading-snug">
                  Atlas raises the bar when you&apos;re right and eases off when you miss — homing in on your edge.
                </p>
              </div>
            </div>

            <div className="atlas-card p-5">
              <div className="flex items-center gap-2 mb-2.5">
                <Layers size={15} className="text-[var(--color-pine)]" />
                <h3 className="font-display text-base font-semibold">Concepts probed</h3>
              </div>
              {askedRef.current.size === 0 ? (
                <p className="text-xs text-[var(--color-ink-faint)]">Building your first questions…</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {answers.map((a, i) => (
                    <span
                      key={i}
                      className={cx(
                        "text-[0.7rem] font-medium px-2 py-1 rounded-full border inline-flex items-center gap-1",
                        a.correct
                          ? "border-[color-mix(in_srgb,var(--color-pine)_30%,var(--color-card))] text-[var(--color-pine-deep)] bg-[color-mix(in_srgb,var(--color-pine)_10%,var(--color-card))]"
                          : "border-[color-mix(in_srgb,var(--color-rose)_30%,var(--color-card))] text-[var(--color-rose)] bg-[color-mix(in_srgb,var(--color-rose)_8%,var(--color-card))]"
                      )}
                    >
                      {a.correct ? <Check size={10} /> : <X size={10} />} {a.concept}
                    </span>
                  ))}
                  {current && (
                    <span className="text-[0.7rem] font-medium px-2 py-1 rounded-full border border-dashed border-[var(--color-line-strong)] text-[var(--color-ink-faint)]">
                      {current.concept}…
                    </span>
                  )}
                </div>
              )}
            </div>

            <NotePad context="assessment" compact />
          </aside>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="atlas-inset px-3 py-2">
      <div className="font-display text-xl font-semibold">{value}</div>
      <div className="text-[0.66rem] uppercase tracking-wide text-[var(--color-ink-faint)]">{label}</div>
    </div>
  );
}

function DiagnosisReveal({
  d,
  subject,
  onBuild,
  error,
}: {
  d: Diagnosis;
  subject: string;
  onBuild: () => void;
  error: string | null;
}) {
  const Group = ({
    title,
    items,
    tone,
  }: {
    title: string;
    items?: string[];
    tone: "pine" | "terra" | "neutral";
  }) => (
    <div>
      <div className="text-sm font-semibold mb-2">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {items && items.length ? (
          items.map((it) => (
            <Pill key={it} tone={tone}>
              {it}
            </Pill>
          ))
        ) : (
          <span className="text-sm text-[var(--color-ink-faint)]">—</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl w-full mx-auto float-in">
      <SectionLabel>Diagnosis · {subject}</SectionLabel>
      <div className="atlas-card p-6 mt-4">
        <div className="flex items-start gap-5">
          <MasteryRing value={d.level ?? 0.4} size={72} stroke={7} color="var(--color-terra)" />
          <div>
            <Pill tone="terra" className="mb-2">
              <Compass size={13} /> Knowledge boundary located
            </Pill>
            <p className="text-[var(--color-ink)] leading-relaxed">{d.summary}</p>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-3 gap-5">
          <Group title="You already know" items={d.known} tone="pine" />
          <Group title="Your frontier — start here" items={d.frontier} tone="terra" />
          <Group title="Coming later" items={d.gaps} tone="neutral" />
        </div>
      </div>

      {error && <div className="mt-4 text-sm text-[var(--color-rose)]">{error}</div>}

      <div className="mt-6 flex items-center justify-center">
        <Button size="lg" variant="terra" onClick={onBuild}>
          <MapPinned size={18} /> Chart my personal path
        </Button>
      </div>
    </div>
  );
}
