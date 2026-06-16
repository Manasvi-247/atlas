"use client";

import React, { useState } from "react";
import { Card, Input, Button, Empty } from "antd";
import { StickyNote, Plus, Trash2, Link as LinkIcon } from "lucide-react";
import { cx } from "./ui";
import { useAtlas } from "@/lib/store";

const { TextArea } = Input;

/** A compact memory-notes widget, reusable on the assessment, lessons, etc. */
export function NotePad({ context, compact }: { context?: string; compact?: boolean }) {
  const notes = useAtlas((s) => s.notes);
  const addNote = useAtlas((s) => s.addNote);
  const removeNote = useAtlas((s) => s.removeNote);
  const [text, setText] = useState("");

  const shown = compact
    ? notes.filter((n) => (context ? n.context === context : true)).slice(0, 4)
    : notes;

  function save() {
    addNote(text, context);
    setText("");
  }

  const inner = (
    <>
      <div className="flex items-center gap-2 mb-3">
        <StickyNote size={16} className="text-[var(--color-gold)]" />
        <h3 className={cx("font-semibold", compact ? "text-sm" : "font-display text-lg")}>Memory notes</h3>
      </div>

      <div className="flex items-start gap-2">
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPressEnter={(e) => {
            if (e.metaKey || e.ctrlKey) {
              e.preventDefault();
              save();
            }
          }}
          autoSize={{ minRows: 2, maxRows: 5 }}
          placeholder="Jot something to remember… (⌘/Ctrl+Enter)"
        />
        <Button type="default" icon={<Plus size={15} />} disabled={!text.trim()} onClick={save} />
      </div>

      <div className={cx("mt-3 space-y-2", compact && "max-h-48 overflow-y-auto")}>
        {shown.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span className="text-xs">No notes yet</span>}
            className="!my-3"
          />
        ) : (
          shown.map((n) => (
            <div key={n.id} className="atlas-inset px-3 py-2 group flex items-start gap-2">
              <div className="flex-1 min-w-0">
                {n.context && (
                  <div className="flex items-start gap-1.5 text-[0.7rem] text-[var(--color-terra)] mb-1.5">
                    <LinkIcon size={11} className="mt-[3px] shrink-0" />
                    <span className="italic line-clamp-2 leading-snug">{n.context}</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{n.text}</p>
              </div>
              <button
                onClick={() => removeNote(n.id)}
                className="text-[var(--color-ink-faint)] hover:text-[var(--color-rose)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                title="Delete note"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );

  if (compact) return <div>{inner}</div>;
  return <Card className="!rounded-xl">{inner}</Card>;
}
