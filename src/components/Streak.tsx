"use client";

import React from "react";
import { Card, Popover, Progress, Tooltip } from "antd";
import { Flame, Snowflake, Check, Trophy } from "lucide-react";
import { cx } from "./ui";
import { useAtlas } from "@/lib/store";
import type { LearnerModel } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;
const MILESTONES = [3, 7, 14, 30, 60, 100];

function dayKey(t: number) {
  return new Date(t).toISOString().slice(0, 10);
}

/** Shared derivation so the popover and the dashboard card stay in sync. */
function deriveStreak(model: LearnerModel, now = Date.now()) {
  const streak = model.streak;
  const longest = model.longestStreak ?? streak;
  const studyDays = model.studyDays ?? [];
  const tier = tierFor(streak);
  const today = dayKey(now);
  const studiedToday = model.lastStudyDay === today;
  const atRisk = streak > 0 && !studiedToday;

  const week = Array.from({ length: 7 }, (_, i) => {
    const t = now - (6 - i) * DAY;
    const key = dayKey(t);
    return {
      key,
      label: new Date(t).toLocaleDateString(undefined, { weekday: "narrow" }),
      studied: studyDays.includes(key),
      isToday: key === today,
    };
  });

  const nextMilestone = MILESTONES.find((m) => m > streak) ?? null;
  const prevMilestone = [...MILESTONES].reverse().find((m) => m <= streak) ?? 0;
  const toNext = nextMilestone ? nextMilestone - streak : 0;
  const milestonePct = nextMilestone
    ? Math.round(((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100)
    : 100;

  return { streak, longest, studyDays, tier, today, studiedToday, atRisk, week, nextMilestone, toNext, milestonePct };
}

function WeekDots({ week, color }: { week: ReturnType<typeof deriveStreak>["week"]; color: string }) {
  return (
    <div className="flex justify-between gap-1">
      {week.map((d) => (
        <div key={d.key} className="flex flex-col items-center gap-1">
          <span className="text-[0.6rem] text-[var(--color-ink-faint)]">{d.label}</span>
          <span
            className={cx(
              "w-7 h-7 rounded-full grid place-items-center text-xs",
              d.studied ? "text-[var(--color-on-accent)]" : "border border-dashed border-[var(--color-line-strong)] text-[var(--color-ink-faint)]",
              d.isToday && "ring-2 ring-offset-1 ring-offset-[var(--color-card)]"
            )}
            style={{
              background: d.studied ? color : "transparent",
              ...(d.isToday ? { ["--tw-ring-color" as string]: color } : {}),
            }}
          >
            {d.studied ? <Flame size={13} fill="#fff" /> : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Horizontal streak banner for the dashboard. */
export function StreakCard() {
  const model = useAtlas((s) => s.model);
  const s = deriveStreak(model);

  return (
    <Card className="!rounded-xl" styles={{ body: { padding: 20 } }}>
      <div className="grid md:grid-cols-[auto_1fr] gap-8 items-center">
        {/* Flame + count */}
        <div className="flex items-center gap-3">
          <span
            className={cx("grid place-items-center", s.streak > 0 && "flame-live")}
            style={{ filter: s.streak > 0 ? `drop-shadow(0 0 8px ${s.tier.glow})` : "none" }}
          >
            <Flame size={40} fill={s.streak > 0 ? s.tier.color : "none"} color={s.tier.color} />
          </span>
          <div>
            <div className="font-display text-3xl font-semibold leading-none">{s.streak}</div>
            <div className="text-xs font-semibold uppercase tracking-wide mt-1" style={{ color: s.tier.color }}>
              {s.tier.name}
            </div>
          </div>
        </div>

        {/* Milestone + status */}
        <div className="md:border-l md:border-[var(--color-line)] md:pl-8">
          {s.nextMilestone ? (
            <>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold">Next: {s.nextMilestone}-day badge</span>
                <span className="text-[var(--color-ink-faint)]">{s.toNext} to go</span>
              </div>
              <Progress percent={s.milestonePct} showInfo={false} strokeColor={s.tier.color} trailColor="var(--color-line)" size="small" />
            </>
          ) : (
            <div className="text-xs font-semibold inline-flex items-center gap-1.5 text-[var(--color-pine)]">
              <Trophy size={14} /> Every badge earned.
            </div>
          )}
          <div
            className={cx(
              "mt-2.5 text-xs font-medium px-2.5 py-1 rounded-md inline-flex items-center gap-1.5",
              s.studiedToday
                ? "bg-[color-mix(in_srgb,var(--color-pine)_14%,var(--color-card))] text-[var(--color-pine-deep)]"
                : "bg-[color-mix(in_srgb,var(--color-rose)_12%,var(--color-card))] text-[var(--color-rose)]"
            )}
          >
            {s.studiedToday ? (
              <>
                <Check size={13} /> Studied today
              </>
            ) : (
              <>
                <Snowflake size={13} /> {s.streak > 0 ? "Study today to keep it" : "Study today to start"}
              </>
            )}
          </div>
          <div className="mt-2 text-[0.7rem] text-[var(--color-ink-faint)]">
            Longest <strong className="text-[var(--color-ink)]">{s.longest}</strong> · Active days{" "}
            <strong className="text-[var(--color-ink)]">{s.studyDays.length}</strong>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface Tier {
  name: string;
  color: string;
  glow: string;
}
function tierFor(streak: number): Tier {
  if (streak >= 100) return { name: "Mythic", color: "#3D7A6B", glow: "rgba(61,122,107,.5)" };
  if (streak >= 30) return { name: "Legendary", color: "#B5556A", glow: "rgba(181,85,106,.5)" };
  if (streak >= 14) return { name: "Blazing", color: "#C9A34E", glow: "rgba(201,163,78,.55)" };
  if (streak >= 7) return { name: "On fire", color: "#E0913A", glow: "rgba(224,145,58,.55)" };
  if (streak >= 3) return { name: "Kindling", color: "#B86B3A", glow: "rgba(184,107,58,.5)" };
  if (streak >= 1) return { name: "Spark", color: "#D89A6A", glow: "rgba(216,154,106,.45)" };
  return { name: "No streak", color: "#8c8576", glow: "transparent" };
}

export function StreakBadge() {
  const model = useAtlas((s) => s.model);
  const streak = model.streak;
  const tier = tierFor(streak);
  const today = dayKey(Date.now());
  const studiedToday = model.lastStudyDay === today;
  const atRisk = streak > 0 && !studiedToday;

  return (
    <Popover
      content={<StreakPanel />}
      trigger="click"
      placement="rightBottom"
      styles={{ body: { padding: 0, width: 290 } }}
    >
      <button
        className="inline-flex items-center gap-1.5 font-semibold transition-transform hover:scale-105"
        title="Your streak"
        style={{ color: tier.color }}
      >
        <span
          className={cx("relative grid place-items-center", streak > 0 && "flame-live")}
          style={{ filter: streak > 0 ? `drop-shadow(0 0 6px ${tier.glow})` : "none" }}
        >
          <Flame size={17} fill={streak > 0 ? tier.color : "none"} />
          {atRisk && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--color-rose)] ring-2 ring-[var(--color-card)]" />
          )}
        </span>
        {streak}
      </button>
    </Popover>
  );
}

function StreakPanel() {
  const model = useAtlas((s) => s.model);
  const streak = model.streak;
  const longest = model.longestStreak ?? streak;
  const studyDays = model.studyDays ?? [];
  const tier = tierFor(streak);
  const now = Date.now();
  const today = dayKey(now);
  const studiedToday = model.lastStudyDay === today;
  const atRisk = streak > 0 && !studiedToday;

  // Last 7 days (oldest → today).
  const week = Array.from({ length: 7 }, (_, i) => {
    const t = now - (6 - i) * DAY;
    const key = dayKey(t);
    return {
      key,
      label: new Date(t).toLocaleDateString(undefined, { weekday: "narrow" }),
      studied: studyDays.includes(key),
      isToday: key === today,
    };
  });

  const nextMilestone = MILESTONES.find((m) => m > streak) ?? null;
  const prevMilestone = [...MILESTONES].reverse().find((m) => m <= streak) ?? 0;
  const toNext = nextMilestone ? nextMilestone - streak : 0;
  const milestonePct = nextMilestone
    ? Math.round(((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100)
    : 100;

  return (
    <div className="rounded-lg overflow-hidden bg-[var(--color-card)] border border-[var(--color-line)]">
      {/* Header */}
      <div
        className="px-4 py-4"
        style={{ background: `linear-gradient(135deg, ${tier.color}22, transparent)` }}
      >
        <div className="flex items-center gap-3">
          <span
            className={cx("grid place-items-center", streak > 0 && "flame-live")}
            style={{ filter: streak > 0 ? `drop-shadow(0 0 8px ${tier.glow})` : "none" }}
          >
            <Flame size={34} fill={streak > 0 ? tier.color : "none"} color={tier.color} />
          </span>
          <div>
            <div className="font-display text-2xl font-semibold leading-none">
              {streak} day{streak === 1 ? "" : "s"}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wide mt-1" style={{ color: tier.color }}>
              {tier.name}
            </div>
          </div>
        </div>

        <div
          className={cx(
            "mt-3 text-xs font-medium px-2.5 py-1.5 rounded-md inline-flex items-center gap-1.5",
            studiedToday
              ? "bg-[color-mix(in_srgb,var(--color-pine)_14%,var(--color-card))] text-[var(--color-pine-deep)]"
              : "bg-[color-mix(in_srgb,var(--color-rose)_12%,var(--color-card))] text-[var(--color-rose)]"
          )}
        >
          {studiedToday ? (
            <>
              <Check size={13} /> Studied today - streak safe
            </>
          ) : atRisk ? (
            <>
              <Snowflake size={13} /> Study today to keep your streak
            </>
          ) : (
            <>
              <Flame size={13} /> Study today to start a streak
            </>
          )}
        </div>
      </div>

      {/* Week calendar */}
      <div className="px-4 py-3 border-b border-[var(--color-line)]">
        <div className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-faint)] mb-2">
          This week
        </div>
        <div className="flex justify-between">
          {week.map((d) => (
            <div key={d.key} className="flex flex-col items-center gap-1">
              <span className="text-[0.6rem] text-[var(--color-ink-faint)]">{d.label}</span>
              <span
                className={cx(
                  "w-7 h-7 rounded-full grid place-items-center text-xs",
                  d.studied
                    ? "text-[var(--color-on-accent)]"
                    : "border border-dashed border-[var(--color-line-strong)] text-[var(--color-ink-faint)]",
                  d.isToday && "ring-2 ring-offset-1 ring-offset-[var(--color-card)]"
                )}
                style={{
                  background: d.studied ? tier.color : "transparent",
                  ...(d.isToday ? { ["--tw-ring-color" as string]: tier.color } : {}),
                }}
              >
                {d.studied ? <Flame size={13} fill="#fff" /> : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Next milestone */}
      <div className="px-4 py-3 border-b border-[var(--color-line)]">
        {nextMilestone ? (
          <>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold">Next badge: {nextMilestone}-day</span>
              <span className="text-[var(--color-ink-faint)]">{toNext} to go</span>
            </div>
            <Progress percent={milestonePct} showInfo={false} strokeColor={tier.color} trailColor="var(--color-line)" size="small" />
          </>
        ) : (
          <div className="text-xs font-semibold inline-flex items-center gap-1.5 text-[var(--color-pine)]">
            <Trophy size={14} /> Every badge earned. Unstoppable.
          </div>
        )}
      </div>

      {/* Milestone badges */}
      <div className="px-4 py-3 border-b border-[var(--color-line)]">
        <div className="flex justify-between">
          {MILESTONES.map((m) => {
            const earned = longest >= m;
            const t = tierFor(m);
            return (
              <Tooltip key={m} title={earned ? `${m}-day badge earned` : `Reach ${m} days`}>
                <span
                  className={cx(
                    "w-8 h-8 rounded-full grid place-items-center text-[0.6rem] font-bold transition-transform",
                    earned ? "text-[var(--color-on-accent)] scale-100" : "text-[var(--color-ink-faint)] opacity-50"
                  )}
                  style={{
                    background: earned ? t.color : "var(--color-paper-2)",
                    border: earned ? "none" : "1px dashed var(--color-line-strong)",
                  }}
                >
                  {m}
                </span>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 grid grid-cols-2 gap-2 text-center">
        <div>
          <div className="font-display text-lg font-semibold">{longest}</div>
          <div className="text-[0.62rem] uppercase tracking-wide text-[var(--color-ink-faint)]">Longest streak</div>
        </div>
        <div>
          <div className="font-display text-lg font-semibold">{studyDays.length}</div>
          <div className="text-[0.62rem] uppercase tracking-wide text-[var(--color-ink-faint)]">Active days</div>
        </div>
      </div>
    </div>
  );
}
