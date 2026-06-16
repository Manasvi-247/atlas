"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  Tooltip,
} from "recharts";
import { Card, Statistic } from "antd";
import { StreakCard } from "./Streak";
import { usePalette, type Palette } from "@/lib/palette";
import {
  Flame,
  Sparkles,
  Clock,
  Target,
  RefreshCw,
  BookOpen,
  GraduationCap,
  Gauge,
  TrendingUp,
} from "lucide-react";
import { Pill, SectionLabel } from "./ui";
import { useAtlas } from "@/lib/store";
import { dueForReview } from "@/lib/sr";
import { MODALITY_LABELS } from "@/lib/types";
import type { Concept, HistoryEvent, Modality } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;

function masteryColor(m: number, C: Palette): string {
  if (m >= 0.8) return C.pine;
  if (m >= 0.6) return C.gold;
  if (m > 0) return C.terra;
  return C.line;
}

function makeTooltip(C: Palette) {
  return {
    background: C.card,
    border: `1px solid ${C.line}`,
    borderRadius: 10,
    fontSize: 12,
    fontFamily: "var(--font-sans)",
    color: C.ink,
    boxShadow: "0 10px 24px -16px rgba(0,0,0,.45)",
  };
}

function computeDepths(concepts: Record<string, Concept>): Record<string, number> {
  const depth: Record<string, number> = {};
  const visiting = new Set<string>();
  const calc = (id: string): number => {
    if (depth[id] != null) return depth[id];
    const c = concepts[id];
    if (!c || c.prereqs.length === 0 || visiting.has(id)) return (depth[id] = 0);
    visiting.add(id);
    const d = 1 + Math.max(0, ...c.prereqs.map((p) => (concepts[p] ? calc(p) : -1)));
    visiting.delete(id);
    return (depth[id] = d);
  };
  Object.keys(concepts).forEach(calc);
  return depth;
}

export function Dashboard({
  onReview,
  onOpenLesson,
}: {
  onReview: () => void;
  onOpenLesson: (lessonId: string) => void;
}) {
  const model = useAtlas((s) => s.model);
  const history = useAtlas((s) => s.history);
  const nextLessonId = useAtlas((s) => s.nextLessonId);
  const C = usePalette();
  const tooltipStyle = makeTooltip(C);

  const concepts = Object.values(model.concepts);
  const total = concepts.length;
  const mastered = concepts.filter((c) => c.mastery >= 0.8).length;
  const learning = concepts.filter((c) => c.mastery > 0 && c.mastery < 0.8).length;
  const notStarted = total - mastered - learning;
  const overall = total ? concepts.reduce((a, c) => a + c.mastery, 0) / total : 0;
  const due = dueForReview(model.concepts);
  const next = nextLessonId();
  const weak = concepts
    .filter((c) => c.attempts > 0 && c.mastery < 0.6)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3);

  const cal = model.calibration;
  const avgConf = cal.samples ? cal.sumConfidence / cal.samples : 0;
  const avgScore = cal.samples ? cal.sumScore / cal.samples : 0;
  const calGap = avgConf - avgScore;

  // ── chart data ──
  const styleData = (Object.keys(model.style) as Modality[]).map((m) => ({
    modality: MODALITY_LABELS[m].split(" ")[0],
    value: Math.round(model.style[m] * 100),
  }));

  const distData = [
    { name: "Mastered", value: mastered, fill: C.pine },
    { name: "Learning", value: learning, fill: C.terra },
    { name: "Not started", value: notStarted, fill: C.line },
  ].filter((d) => d.value > 0);

  const masteryBars = concepts
    .slice()
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 10)
    .map((c) => ({
      name: c.name.length > 16 ? c.name.slice(0, 15) + "…" : c.name,
      mastery: Math.round(c.mastery * 100),
      fill: masteryColor(c.mastery, C),
    }));

  const activityData = useMemo(() => {
    const now = Date.now();
    const out: { day: string; sessions: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * DAY);
      const key = d.toISOString().slice(0, 10);
      const count = history.filter((h) => new Date(h.at).toISOString().slice(0, 10) === key).length;
      out.push({ day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), sessions: count });
    }
    return out;
  }, [history]);

  const calData = [
    { name: "Accuracy", value: Math.round(avgScore * 100), fill: C.pine },
    { name: "Confidence", value: Math.round(avgConf * 100), fill: C.terra },
  ];

  return (
    <div className="float-in space-y-6">
      <div>
        <SectionLabel>Dashboard · {model.subject}</SectionLabel>
        <h1 className="font-display text-[2.2rem] font-semibold mt-2">Your learning dashboard</h1>
        <p className="text-[var(--color-ink-soft)] mt-1">A live picture of what you know and where you&apos;re headed.</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={Target} label="Mastered" value={`${mastered}/${total}`} color={C.pine} />
        <Stat icon={Clock} label="Time invested" value={`${model.minutesSpent}m`} color={C.terra} />
        <Stat icon={Flame} label="Day streak" value={`${model.streak}`} color={C.terra} />
        <Stat icon={Sparkles} label="XP" value={`${model.xp}`} color={C.gold} />
      </div>

      {/* Streak banner */}
      <StreakCard />

      {/* Row: constellation + distribution donut */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 atlas-card p-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-display text-xl font-semibold">Knowledge map</h2>
            <div className="flex items-center gap-3 text-xs text-[var(--color-ink-faint)]">
              <Legend color={C.pine} label="mastered" />
              <Legend color={C.gold} label="solid" />
              <Legend color={C.terra} label="learning" />
              <Legend color={C.line} label="not started" />
            </div>
          </div>
          <Constellation concepts={model.concepts} />
          <p className="text-xs text-[var(--color-ink-faint)] mt-2">
            Nodes are concepts; lines are prerequisites. Colour shows mastery — the map fills in as you learn.
          </p>
        </div>

        <div className="atlas-card p-6 flex flex-col">
          <h2 className="font-display text-lg font-semibold mb-2">Mastery mix</h2>
          <div className="relative flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={distData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="none"
                >
                  {distData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="text-center">
                <div className="font-display text-3xl font-semibold">{Math.round(overall * 100)}%</div>
                <div className="text-[0.66rem] uppercase tracking-wide text-[var(--color-ink-faint)]">overall</div>
              </div>
            </div>
          </div>
          <div className="mt-2 flex justify-center gap-4 text-xs">
            <Legend color={C.pine} label={`${mastered} mastered`} />
            <Legend color={C.terra} label={`${learning} learning`} />
          </div>
        </div>
      </div>

      {/* Row: learning style radar + mastery-by-concept bars */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="atlas-card p-6">
          <h2 className="font-display text-xl font-semibold">How you learn best</h2>
          <p className="text-sm text-[var(--color-ink-faint)] mt-1">
            Inferred from your assessment and the explanations you reach for. Lessons adapt to this.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={styleData} outerRadius="72%">
              <PolarGrid stroke={C.line} />
              <PolarAngleAxis dataKey="modality" tick={{ fontSize: 12, fill: C.inkSoft }} />
              <Radar dataKey="value" stroke={C.pine} fill={C.pine} fillOpacity={0.35} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Weight"]} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="atlas-card p-6">
          <h2 className="font-display text-xl font-semibold">Mastery by concept</h2>
          <p className="text-sm text-[var(--color-ink-faint)] mt-1">Top concepts on your path.</p>
          <ResponsiveContainer width="100%" height={Math.max(220, masteryBars.length * 28)}>
            <BarChart data={masteryBars} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: C.inkSoft }} unit="%" />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 11, fill: C.inkSoft }}
                interval={0}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Mastery"]} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="mastery" radius={[0, 6, 6, 0]} barSize={14}>
                {masteryBars.map((b, i) => (
                  <Cell key={i} fill={b.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row: activity area + calibration radial */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 atlas-card p-6">
          <h2 className="font-display text-xl font-semibold">Activity</h2>
          <p className="text-sm text-[var(--color-ink-faint)] mt-1">Sessions over the last two weeks.</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={activityData} margin={{ left: -18, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.terra} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={C.terra} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: C.inkSoft }} interval={1} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: C.inkSoft }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="sessions" stroke={C.terra} strokeWidth={2} fill="url(#actGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="atlas-card p-6">
          <div className="flex items-center gap-2 mb-1">
            <Gauge size={16} className="text-[var(--color-terra)]" />
            <h2 className="font-display text-lg font-semibold">Calibration</h2>
          </div>
          {cal.samples === 0 ? (
            <p className="text-sm text-[var(--color-ink-faint)] mt-2">
              Take a quiz to see how well your confidence matches your results.
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <RadialBarChart
                  data={calData}
                  innerRadius="40%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar background dataKey="value" cornerRadius={8} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-xs -mt-2">
                <Legend color={C.pine} label={`accuracy ${Math.round(avgScore * 100)}%`} />
                <Legend color={C.terra} label={`confidence ${Math.round(avgConf * 100)}%`} />
              </div>
              <p className="text-sm text-[var(--color-ink-soft)] mt-2">
                {Math.abs(calGap) < 0.1
                  ? "Beautifully calibrated — your gut matches reality."
                  : calGap > 0
                  ? "You feel surer than you are — slow down on tricky steps."
                  : "You sell yourself short — trust your reasoning more."}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="atlas-card p-6">
        <h2 className="font-display text-xl font-semibold">Recommended next steps</h2>
        <div className="mt-4 grid md:grid-cols-2 gap-3">
          {next && (
            <Rec
              icon={BookOpen}
              color={C.terra}
              title={`Continue: ${model.curriculum?.lessons[next]?.title}`}
              detail="Your next concept on the path"
              onClick={() => onOpenLesson(next)}
            />
          )}
          {due.length > 0 && (
            <Rec
              icon={RefreshCw}
              color={C.gold}
              title={`Review ${due.length} concept${due.length > 1 ? "s" : ""}`}
              detail="Due on your forgetting curve"
              onClick={onReview}
            />
          )}
          {weak.map((c) => (
            <Rec
              key={c.id}
              icon={Target}
              color={C.rose}
              title={`Strengthen: ${c.name}`}
              detail={`Mastery ${Math.round(c.mastery * 100)}% — worth another pass`}
              onClick={() => onOpenLesson(`lesson-${c.id}`)}
            />
          ))}
          {!next && due.length === 0 && weak.length === 0 && (
            <p className="text-sm text-[var(--color-ink-faint)]">You&apos;re all caught up. Beautiful work. 🌿</p>
          )}
        </div>
      </div>

      {/* History */}
      <div className="atlas-card p-6">
        <h2 className="font-display text-xl font-semibold mb-1">Session history</h2>
        <p className="text-sm text-[var(--color-ink-faint)] mb-4">Everything Atlas has tracked for you.</p>
        {history.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-faint)]">No activity yet.</p>
        ) : (
          <div className="relative pl-5">
            <div className="absolute left-[6px] top-2 bottom-2 w-px bg-[var(--color-line)]" />
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {history.slice(0, 40).map((h) => (
                <TimelineRow key={h.id} ev={h} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card size="small" className="!rounded-xl">
      <Statistic
        title={
          <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide">
            <Icon size={14} style={{ color }} /> {label}
          </span>
        }
        value={value}
        valueStyle={{ fontFamily: "var(--font-fraunces)", fontWeight: 600, color: "#211f1a" }}
      />
    </Card>
  );
}

function Rec({
  icon: Icon,
  color,
  title,
  detail,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left atlas-inset px-4 py-3 flex items-center gap-3 hover:border-[var(--color-line-strong)] transition-colors"
    >
      <span className="w-9 h-9 rounded-xl grid place-items-center text-white shrink-0" style={{ background: color }}>
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <div className="font-medium truncate">{title}</div>
        <div className="text-xs text-[var(--color-ink-faint)] truncate">{detail}</div>
      </div>
    </button>
  );
}

const KIND_ICON: Record<HistoryEvent["kind"], React.ComponentType<{ size?: number }>> = {
  assessment: TrendingUp,
  lesson: BookOpen,
  quiz: Target,
  tutor: GraduationCap,
  review: RefreshCw,
  adapt: Sparkles,
};

function TimelineRow({ ev }: { ev: HistoryEvent }) {
  const Icon = KIND_ICON[ev.kind];
  const when = new Date(ev.at);
  return (
    <div className="relative">
      <span className="absolute -left-[13px] top-1 w-3.5 h-3.5 rounded-full bg-[var(--color-card)] border-2 border-[var(--color-pine)] grid place-items-center" />
      <div className="flex items-start gap-2">
        <Icon size={14} />
        <div className="min-w-0">
          <div className="text-sm font-medium">{ev.label}</div>
          {ev.detail && <div className="text-xs text-[var(--color-ink-faint)]">{ev.detail}</div>}
          <div className="text-[0.68rem] text-[var(--color-ink-faint)]">
            {when.toLocaleDateString()} · {when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Constellation({ concepts }: { concepts: Record<string, Concept> }) {
  const C = usePalette();
  const { nodes, edges, width, height } = useMemo(() => {
    const ids = Object.keys(concepts);
    const depths = computeDepths(concepts);
    const maxDepth = Math.max(0, ...Object.values(depths));
    const byDepth: Record<number, string[]> = {};
    ids.forEach((id) => {
      const d = depths[id];
      (byDepth[d] ||= []).push(id);
    });
    const colW = 150;
    const rowH = 64;
    const padX = 40;
    const padY = 36;
    const maxRows = Math.max(1, ...Object.values(byDepth).map((a) => a.length));
    const width = padX * 2 + (maxDepth + 1) * colW;
    const height = padY * 2 + maxRows * rowH;
    const pos: Record<string, { x: number; y: number }> = {};
    for (let d = 0; d <= maxDepth; d++) {
      const col = byDepth[d] || [];
      col.forEach((id, i) => {
        const colHeight = col.length * rowH;
        const y = padY + (height - padY * 2 - colHeight) / 2 + i * rowH + rowH / 2;
        pos[id] = { x: padX + d * colW + 28, y };
      });
    }
    const edges: { x1: number; y1: number; x2: number; y2: number; strong: boolean }[] = [];
    ids.forEach((id) => {
      concepts[id].prereqs.forEach((p) => {
        if (pos[p] && pos[id]) {
          edges.push({ x1: pos[p].x, y1: pos[p].y, x2: pos[id].x, y2: pos[id].y, strong: concepts[p].mastery >= 0.6 });
        }
      });
    });
    const nodes = ids.map((id) => ({ id, ...pos[id], c: concepts[id] }));
    return { nodes, edges, width, height };
  }, [concepts]);

  if (nodes.length === 0) return null;

  return (
    <div className="mt-4 overflow-x-auto">
      <svg width={width} height={height} className="min-w-full">
        {edges.map((e, i) => (
          <line
            key={i}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke={e.strong ? C.pine : C.line}
            strokeWidth={e.strong ? 1.6 : 1}
            strokeOpacity={e.strong ? 0.5 : 0.35}
          />
        ))}
        {nodes.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={11} fill={masteryColor(n.c.mastery, C)} stroke="var(--color-card)" strokeWidth={2.5} />
            <text
              x={n.x}
              y={n.y + 26}
              textAnchor="middle"
              fontSize="10.5"
              fill="var(--color-ink-soft)"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {n.c.name.length > 18 ? n.c.name.slice(0, 17) + "…" : n.c.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
