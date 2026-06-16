"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, StickyNote, MessagesSquare, Trash2, Plus, Link as LinkIcon, Pin } from "lucide-react";
import { SectionLabel } from "./ui";
import { useAtlas } from "@/lib/store";

// Sticky-note tints - accent mixed into the card surface, so they adapt to
// light and dark automatically.
const TINTS = [
  "--color-gold",
  "--color-terra",
  "--color-pine",
  "--color-rose",
  "--color-terra-soft",
];

function tintStyle(accentVar: string): React.CSSProperties {
  return {
    background: `color-mix(in srgb, var(${accentVar}) 22%, var(--color-card))`,
    borderColor: `color-mix(in srgb, var(${accentVar}) 46%, var(--color-card))`,
  };
}

export function Notes() {
  const router = useRouter();
  const notes = useAtlas((s) => s.notes);
  const addNote = useAtlas((s) => s.addNote);
  const removeNote = useAtlas((s) => s.removeNote);
  const starred = useAtlas((s) => s.starred);
  const toggleStar = useAtlas((s) => s.toggleStar);
  const [text, setText] = useState("");

  function save() {
    addNote(text);
    setText("");
  }

  return (
    <div className="float-in">
      <div className="mb-6">
        <SectionLabel>Your workspace</SectionLabel>
        <h1 className="font-display text-[2.2rem] font-semibold mt-2">Notes &amp; saved questions</h1>
      </div>
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left: notes (larger) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 font-sans text-xl font-bold text-[var(--color-ink)]">
            <Pin size={19} className="text-[var(--color-terra)]" /> Notes
            <span className="text-[var(--color-ink-faint)] font-medium text-base">({notes.length})</span>
          </div>
      {/* Composer */}
      <div
        className="relative rounded-xl border p-4 shadow-[0_14px_30px_-22px_rgba(0,0,0,0.5)]"
        style={tintStyle("--color-gold")}
      >
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-16 rounded-sm bg-[rgba(255,255,255,0.25)] border border-[rgba(255,255,255,0.15)] rotate-[-2deg]" />
        <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
          <StickyNote size={16} className="text-[var(--color-gold)]" /> New note
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              save();
            }
          }}
          rows={2}
          placeholder="Jot something to remember… (⌘/Ctrl+Enter to pin)"
          className="w-full resize-none bg-transparent outline-none placeholder:text-[var(--color-ink-faint)] text-[var(--color-ink)]"
        />
        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={!text.trim()}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-full bg-[var(--color-ink)] text-[var(--color-card)] disabled:opacity-40 transition-opacity"
          >
            <Plus size={15} /> Pin note
          </button>
        </div>
      </div>

      {/* Sticky-note board */}
      <div>
        {notes.length === 0 ? (
          <div className="atlas-card p-8 text-center text-sm text-[var(--color-ink-faint)]">
            No notes yet. Capture an insight above, or jot one while you study - it&apos;ll appear here.
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 gap-4 [&>*]:mb-4">
            {notes.map((n, i) => (
              <div
                key={n.id}
                className="group relative inline-block w-full align-top break-inside-avoid rounded-xl border p-4 pt-5 transition-transform duration-200 hover:-translate-y-0.5 shadow-[0_12px_26px_-20px_rgba(0,0,0,0.55)]"
                style={tintStyle(TINTS[i % TINTS.length])}
              >
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-16 rounded-sm bg-[rgba(255,255,255,0.25)] border border-[rgba(255,255,255,0.15)] rotate-[-2deg]" />
                {n.context && (
                  <div className="flex items-start gap-1.5 text-[0.7rem] text-[var(--color-ink-soft)] mb-2">
                    <LinkIcon size={11} className="mt-[3px] shrink-0" />
                    <span className="italic line-clamp-2 leading-snug">{n.context}</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap text-[var(--color-ink)] leading-relaxed">{n.text}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[0.64rem] text-[var(--color-ink-faint)]">
                    {new Date(n.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                  <button
                    onClick={() => removeNote(n.id)}
                    className="text-[var(--color-ink-faint)] hover:text-[var(--color-rose)] opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete note"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </div>

        {/* Right: starred (smaller) */}
        <div className="lg:col-span-1">
      <div>
        <div className="flex items-center gap-2 mb-4 font-sans text-xl font-bold text-[var(--color-ink)]">
          <Star size={19} className="text-[var(--color-gold)]" /> Starred questions
          <span className="text-[var(--color-ink-faint)] font-medium text-base">({starred.length})</span>
        </div>
        {starred.length === 0 ? (
          <div className="atlas-card p-8 text-center text-sm text-[var(--color-ink-faint)]">
            Star a question during your assessment or a quiz and it&apos;ll wait here for review.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {starred.map((s) => (
              <div key={s.id} className="atlas-card p-4 group">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className="inline-flex items-center gap-1 text-[0.62rem] font-semibold uppercase tracking-wide rounded-md px-1.5 py-0.5"
                    style={{
                      background: "color-mix(in srgb, var(--color-gold) 16%, var(--color-card))",
                      color: "var(--color-gold)",
                    }}
                  >
                    <Star size={10} fill="var(--color-gold)" /> {s.concept}
                  </span>
                  <button
                    onClick={() => toggleStar(s)}
                    className="text-[var(--color-ink-faint)] hover:text-[var(--color-rose)] opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove star"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-sm text-[var(--color-ink)]">{s.prompt}</p>
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
      </div>
    </div>
  );
}
