"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Map, Sparkles, Target } from "lucide-react";
import { Button, Pill, SectionLabel } from "./ui";
import { FEATURED_TRACKS, SUBJECT_SUGGESTIONS } from "@/lib/tracks";
import { useAtlas } from "@/lib/store";

export function Onboarding({ onStart }: { onStart: () => void }) {
  const startSubject = useAtlas((s) => s.startSubject);
  const [subject, setSubject] = useState("");
  const [goal, setGoal] = useState("");

  function begin(s: string, g: string) {
    if (!s.trim()) return;
    startSubject(s.trim(), g.trim() || `Make real progress in ${s.trim()}`);
    onStart();
  }

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
            <span className="map-underline">what you know</span>,<br className="hidden sm:block" /> what
            you need next, and how <span className="italic">you</span> learn best.
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
              onSubmit={(e) => {
                e.preventDefault();
                begin(subject, goal);
              }}
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
                  <span className="font-normal text-[var(--color-ink-faint)]">(optional - shapes the path)</span>
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
