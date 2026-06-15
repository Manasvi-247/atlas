"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, Steps, Tag, Progress, Button, Empty, Tooltip } from "antd";
import { Play, RefreshCw, Flag, Clock, BookOpen } from "lucide-react";
import { SectionLabel, cx } from "./ui";
import { useAtlas } from "@/lib/store";
import { conceptStatus, prereqsMet, dueForReview } from "@/lib/sr";
import type { Concept, ConceptStatus } from "@/lib/types";

const PINE = "#3D7A6B";
const TERRA = "#B86B3A";
const GOLD = "#C9A34E";
const ROSE = "#B5556A";

const STATUS_TAG: Record<ConceptStatus, { label: string; color: string }> = {
  locked: { label: "Locked", color: "default" },
  ready: { label: "Ready", color: "orange" },
  learning: { label: "In progress", color: "orange" },
  review: { label: "Review due", color: "gold" },
  mastered: { label: "Mastered", color: "green" },
};

function stepStatus(c: Concept): "finish" | "process" | "wait" | "error" {
  if (c.mastery >= 0.8) return "finish";
  if (c.attempts > 0 && c.mastery < 0.6) return "error";
  if (c.mastery > 0 || c.attempts > 0) return "process";
  return "wait";
}

function barColor(c: Concept): string {
  if (c.mastery >= 0.8) return PINE;
  if (c.mastery >= 0.6) return GOLD;
  if (c.mastery > 0) return TERRA;
  return "#cdbfa3";
}

export function KnowledgeMap({
  onOpenLesson,
  onReview,
}: {
  onOpenLesson: (lessonId: string) => void;
  onReview: () => void;
}) {
  const model = useAtlas((s) => s.model);
  const nextLessonId = useAtlas((s) => s.nextLessonId);
  const next = nextLessonId();
  const due = dueForReview(model.concepts);

  if (!model.curriculum) return null;
  const { curriculum, concepts } = model;

  const all = Object.values(concepts);
  const mastered = all.filter((c) => c.mastery >= 0.8).length;
  const total = all.length;
  const overall = total ? Math.round((all.reduce((a, c) => a + c.mastery, 0) / total) * 100) : 0;

  return (
    <div className="float-in space-y-6">
      {/* Hero */}
      <div>
        <SectionLabel>Your path</SectionLabel>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-2">
          <div>
            <h1 className="font-display text-[2.3rem] leading-tight font-semibold">{model.subject}</h1>
            <p className="text-[var(--color-ink-soft)] mt-1 inline-flex items-center gap-1.5">
              <Flag size={14} className="text-[var(--color-terra)]" /> {model.goal}
            </p>
          </div>
          <Card size="small" className="!rounded-xl shrink-0">
            <div className="flex items-center gap-4">
              <Progress
                type="circle"
                percent={overall}
                size={64}
                strokeColor={PINE}
                trailColor="#e2d8c4"
                format={(p) => <span className="text-sm font-semibold">{p}%</span>}
              />
              <div>
                <div className="font-display text-2xl font-semibold leading-none">
                  {mastered}
                  <span className="text-[var(--color-ink-faint)] text-base">/{total}</span>
                </div>
                <div className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wide mt-1">mastered</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* CTAs */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="!rounded-xl" styles={{ body: { padding: 18 } }}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Tag color="orange" className="!rounded-md">Next up</Tag>
              <div className="font-display text-lg font-semibold mt-1.5 truncate">
                {next ? curriculum.lessons[next]?.title : "Path complete 🎉"}
              </div>
              <div className="text-sm text-[var(--color-ink-soft)] truncate">
                {next ? curriculum.lessons[next]?.blurb : "You've mastered every concept."}
              </div>
            </div>
            {next && (
              <Button type="primary" icon={<Play size={15} />} onClick={() => onOpenLesson(next)}>
                Continue
              </Button>
            )}
          </div>
        </Card>

        <Card className="!rounded-xl" styles={{ body: { padding: 18 } }}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Tag color={due.length ? "gold" : "default"} className="!rounded-md">Spaced review</Tag>
              <div className="font-display text-lg font-semibold mt-1.5">
                {due.length ? `${due.length} concept${due.length > 1 ? "s" : ""} due` : "Nothing due"}
              </div>
              <div className="text-sm text-[var(--color-ink-soft)]">
                {due.length ? "Refresh before they fade" : "Scheduled on a forgetting curve"}
              </div>
            </div>
            <Button icon={<RefreshCw size={15} />} disabled={due.length === 0} onClick={onReview}>
              Review
            </Button>
          </div>
        </Card>
      </div>

      {/* Modules as cards with Steps */}
      {curriculum.modules.length === 0 ? (
        <Empty description="No modules yet" />
      ) : (
        curriculum.modules.map((mod, mi) => {
          const lessonsInMod = mod.lessonIds
            .map((lid) => ({ lid, lesson: curriculum.lessons[lid] }))
            .filter((x) => x.lesson && concepts[x.lesson.conceptId]);

          const nextLocalIdx = lessonsInMod.findIndex((x) => x.lid === next);

          const items = lessonsInMod.map(({ lid, lesson }) => {
            const c = concepts[lesson.conceptId];
            const met = prereqsMet(c, concepts);
            const cs = conceptStatus(c, met);
            const tag = STATUS_TAG[cs];
            const locked = cs === "locked";
            const started = c.attempts > 0 || c.mastery > 0;
            return {
              key: lid,
              status: stepStatus(c),
              disabled: locked,
              title: (
                <Tooltip title={c.summary} placement="right" mouseEnterDelay={0.3}>
                  <span className="inline-flex items-center gap-2">
                    <span className={cx("text-[0.95rem]", locked && "text-[var(--color-ink-faint)]")}>
                      {lesson.title}
                    </span>
                    <Tag color={tag.color} className="!rounded-md !text-[0.62rem] !leading-4 !px-1.5 !m-0" bordered={false}>
                      {tag.label}
                    </Tag>
                  </span>
                </Tooltip>
              ),
              description: (
                <div className="flex items-center gap-3 -mt-0.5">
                  {started ? (
                    <Progress
                      percent={Math.round(c.mastery * 100)}
                      size={[120, 5]}
                      strokeColor={barColor(c)}
                      trailColor="#e2d8c4"
                      className="!m-0"
                    />
                  ) : (
                    <span className="text-xs text-[var(--color-ink-faint)]">Not started</span>
                  )}
                  <span className="text-xs text-[var(--color-ink-faint)] inline-flex items-center gap-1 whitespace-nowrap">
                    <Clock size={11} /> {lesson.minutes}m
                  </span>
                </div>
              ),
            };
          });

          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mi * 0.05 }}
            >
              <Card
                className="!rounded-xl"
                title={
                  <div className="py-1 flex items-center gap-2.5">
                    <span className="font-mono text-xs text-[var(--color-ink-faint)]">
                      {String(mi + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-lg font-semibold">{mod.title}</span>
                    <Tooltip title={mod.rationale} placement="right">
                      <span className="text-[var(--color-ink-faint)] cursor-help text-xs border border-[var(--color-line)] rounded-full w-4 h-4 grid place-items-center font-normal">
                        ?
                      </span>
                    </Tooltip>
                  </div>
                }
              >
                <Steps
                  direction="vertical"
                  size="small"
                  current={nextLocalIdx >= 0 ? nextLocalIdx : lessonsInMod.length}
                  onChange={(idx) => {
                    const target = lessonsInMod[idx];
                    if (!target) return;
                    const c = concepts[target.lesson.conceptId];
                    if (conceptStatus(c, prereqsMet(c, concepts)) === "locked") return;
                    onOpenLesson(target.lid);
                  }}
                  items={items}
                />
              </Card>
            </motion.div>
          );
        })
      )}

      <div className="atlas-card p-4 flex items-center gap-2.5 text-sm text-[var(--color-ink-soft)]">
        <BookOpen size={16} className="text-[var(--color-pine)]" />
        Click any unlocked step to open its lesson. Atlas reorders this path as your mastery changes.
      </div>
    </div>
  );
}
