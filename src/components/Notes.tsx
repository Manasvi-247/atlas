"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Star, StickyNote, MessagesSquare, Trash2 } from "lucide-react";
import { Pill, SectionLabel, Button } from "./ui";
import { NotePad } from "./NotePad";
import { useAtlas } from "@/lib/store";

export function Notes() {
  const router = useRouter();
  const starred = useAtlas((s) => s.starred);
  const toggleStar = useAtlas((s) => s.toggleStar);

  return (
    <div className="float-in space-y-8">
      <div>
        <SectionLabel>Your workspace</SectionLabel>
        <h1 className="font-display text-[2.2rem] font-semibold mt-2">Notes &amp; saved questions</h1>
        <p className="text-[var(--color-ink-soft)] mt-1">
          Your private memory layer — capture insights and bookmark tricky questions to revisit.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <NotePad />

        <div className="atlas-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-[var(--color-gold)]" />
            <h3 className="font-display text-lg font-semibold">Starred questions</h3>
          </div>
          {starred.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-faint)]">
              Star a question during your assessment or a quiz and it&apos;ll wait here for review.
            </p>
          ) : (
            <div className="space-y-3">
              {starred.map((s) => (
                <div key={s.id} className="atlas-inset p-3 group">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <Pill tone="terra">{s.concept}</Pill>
                    <button
                      onClick={() => toggleStar(s)}
                      className="text-[var(--color-ink-faint)] hover:text-[var(--color-rose)]"
                      title="Remove star"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-sm">{s.prompt}</p>
                  <button
                    onClick={() => router.push("/tutor")}
                    className="mt-2 text-xs text-[var(--color-pine)] hover:underline inline-flex items-center gap-1"
                  >
                    <MessagesSquare size={12} /> Work through it with the tutor
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="atlas-card p-5 flex items-center gap-3 text-sm text-[var(--color-ink-soft)]">
        <StickyNote size={18} className="text-[var(--color-gold)]" />
        Tip: notes and stars persist across sessions on this device. They&apos;re yours alone.
      </div>
    </div>
  );
}
