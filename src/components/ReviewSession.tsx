"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, ArrowLeft, Eye, Check } from "lucide-react";
import { Button, Pill, SectionLabel } from "./ui";
import { Markdown } from "./Markdown";
import { useAtlas } from "@/lib/store";
import { dueForReview } from "@/lib/sr";

const RATINGS: { label: string; quality: number; tone: string }[] = [
  { label: "Forgot", quality: 0.2, tone: "var(--color-rose)" },
  { label: "Hard", quality: 0.5, tone: "var(--color-terra)" },
  { label: "Good", quality: 0.8, tone: "var(--color-gold)" },
  { label: "Easy", quality: 1.0, tone: "var(--color-pine)" },
];

export function ReviewSession({
  onExit,
  all = false,
  onReviewAll,
}: {
  onExit: () => void;
  all?: boolean;
  onReviewAll?: () => void;
}) {
  const model = useAtlas((s) => s.model);
  const recordReview = useAtlas((s) => s.recordReview);
  const learnedCount = Object.values(model.concepts).filter((c) => c.mastery >= 0.6).length;

  // Snapshot the queue once so completing items doesn't reshuffle mid-session.
  // "all" = review every learned concept on demand; otherwise only what's due.
  const queue = useMemo(() => {
    if (all) {
      return Object.values(model.concepts)
        .filter((c) => c.mastery >= 0.6)
        .sort((a, b) => a.mastery - b.mastery)
        .map((c) => c.id);
    }
    return dueForReview(model.concepts).map((c) => c.id);
    // Recompute when the mode changes (due <-> all); model intentionally excluded
    // so completing items mid-session doesn't reshuffle the queue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);

  // Reset the session when switching modes (due <-> all).
  useEffect(() => {
    setIdx(0);
    setRevealed(false);
    setDone(0);
  }, [all]);

  if (queue.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[var(--color-pine)] grid place-items-center text-[var(--color-on-accent)]">
          <Check size={22} />
        </div>
        <h2 className="font-display text-2xl font-semibold mt-4">
          {all ? "Nothing to review yet" : "Nothing due right now"}
        </h2>
        <p className="text-[var(--color-ink-soft)] mt-1">
          {all
            ? "Master a few concepts and they'll be reviewable here."
            : "Atlas will surface reviews as concepts begin to fade."}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          {!all && onReviewAll && learnedCount > 0 && (
            <Button variant="terra" onClick={onReviewAll}>
              <RefreshCw size={16} /> Review what I&apos;ve learned ({learnedCount})
            </Button>
          )}
          <Button variant="outline" onClick={onExit}>
            <ArrowLeft size={16} /> Back to path
          </Button>
        </div>
      </div>
    );
  }

  if (idx >= queue.length) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 float-in">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[var(--color-pine)] grid place-items-center text-[var(--color-on-accent)]">
          <RefreshCw size={22} />
        </div>
        <h2 className="font-display text-2xl font-semibold mt-4">Review complete</h2>
        <p className="text-[var(--color-ink-soft)] mt-1">
          You refreshed {done} concept{done > 1 ? "s" : ""}. Intervals updated on your forgetting curve.
        </p>
        <Button className="mt-5" variant="terra" onClick={onExit}>
          Back to path
        </Button>
      </div>
    );
  }

  const concept = model.concepts[queue[idx]];
  if (!concept) {
    setIdx(idx + 1);
    return null;
  }

  function rate(quality: number) {
    recordReview(concept.id, quality);
    setDone((d) => d + 1);
    setRevealed(false);
    setIdx((i) => i + 1);
  }

  return (
    <div className="max-w-xl mx-auto float-in">
      <div className="flex items-center justify-between">
        <SectionLabel>Spaced review</SectionLabel>
        <span className="text-xs text-[var(--color-ink-faint)]">
          {idx + 1} / {queue.length}
        </span>
      </div>

      <motion.div key={concept.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="atlas-card p-7 mt-4 text-center">
        <Pill tone="gold" className="mb-3">
          <RefreshCw size={12} /> Recall check
        </Pill>
        <h2 className="font-display text-2xl font-semibold">{concept.name}</h2>
        <p className="text-sm text-[var(--color-ink-faint)] mt-2">
          Before revealing - can you explain this in your own words?
        </p>

        {!revealed ? (
          <Button className="mt-6" variant="outline" onClick={() => setRevealed(true)}>
            <Eye size={16} /> Reveal &amp; self-assess
          </Button>
        ) : (
          <>
            <div className="atlas-inset p-4 mt-5 text-left">
              <Markdown text={concept.summary} />
            </div>
            <p className="text-sm text-[var(--color-ink-soft)] mt-5">How well did you recall it?</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r.label}
                  onClick={() => rate(r.quality)}
                  className="py-2.5 rounded-xl border border-[var(--color-line)] text-sm font-medium hover:text-[var(--color-on-accent)] transition-colors"
                  style={{ ["--hover" as string]: r.tone }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = r.tone)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </>
        )}
      </motion.div>

      <div className="mt-4 text-center">
        <button onClick={onExit} className="text-sm text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
          End review
        </button>
      </div>
    </div>
  );
}
