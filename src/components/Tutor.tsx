"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, GraduationCap } from "lucide-react";
import { Button, Pill, SectionLabel, cx } from "./ui";
import { Markdown } from "./Markdown";
import { useAtlas } from "@/lib/store";
import type { ChatMessage } from "@/lib/types";

export function Tutor({ focusConceptId }: { focusConceptId?: string | null }) {
  const model = useAtlas((s) => s.model);
  const recordTutorTurn = useAtlas((s) => s.recordTutorTurn);

  const concept = focusConceptId ? model.concepts[focusConceptId] : null;
  const concepts = Object.values(model.concepts);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(focusConceptId ?? null);

  useEffect(() => {
    setSelectedConceptId(focusConceptId ?? null);
  }, [focusConceptId]);

  const selected = selectedConceptId ? model.concepts[selectedConceptId] : null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ctrl = useRef<AbortController | null>(null);

  // Reset the conversation when switching focus concept.
  useEffect(() => {
    setMessages([]);
  }, [selectedConceptId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    recordTutorTurn();
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    ctrl.current?.abort();
    const ac = new AbortController();
    ctrl.current = ac;
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: model.subject,
          goal: model.goal,
          concept: selected
            ? { name: selected.name, summary: selected.summary, mastery: selected.mastery }
            : undefined,
          messages: history,
        }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: `*(tutor unavailable: ${(e as Error).message})*`,
          };
          return copy;
        });
      }
    } finally {
      setStreaming(false);
    }
  }

  const starters = selected
    ? [
        `I'm stuck on ${selected.name}.`,
        `Can you check my understanding of ${selected.name}?`,
        `Why does ${selected.name} matter?`,
      ]
    : [
        `What should I focus on next?`,
        `I don't get one of the ideas in ${model.subject}.`,
        `Quiz me with a question.`,
      ];

  return (
    <div className="max-w-3xl mx-auto float-in flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <SectionLabel>Socratic tutor</SectionLabel>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1.5">
            It guides you to the answer with questions - it won&apos;t just tell you.
          </p>
        </div>
        {concepts.length > 0 && (
          <label className="text-sm flex items-center gap-2">
            <span className="text-[var(--color-ink-faint)]">Focus:</span>
            <select
              value={selectedConceptId ?? ""}
              onChange={(e) => setSelectedConceptId(e.target.value || null)}
              className="atlas-inset px-3 py-1.5 text-sm outline-none focus:border-[var(--color-pine)]"
            >
              <option value="">General</option>
              {concepts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="atlas-card mt-4 flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="h-full grid place-items-center text-center px-6">
              <div>
                <div className="mx-auto w-12 h-12 rounded-2xl bg-[var(--color-pine)] grid place-items-center text-white">
                  <GraduationCap size={22} />
                </div>
                <h3 className="font-display text-xl font-semibold mt-3">
                  {selected ? `Let's reason through ${selected.name}` : "Bring a question"}
                </h3>
                <p className="text-sm text-[var(--color-ink-soft)] mt-1 max-w-sm mx-auto">
                  Tell the tutor where you&apos;re stuck. It will ask the right next question to get you
                  unstuck - the discovery stays yours.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {starters.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-pine)] hover:text-[var(--color-pine)] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cx(
                  "max-w-[85%] rounded-2xl px-4 py-2.5",
                  m.role === "user"
                    ? "bg-[var(--color-pine)] text-white rounded-br-md"
                    : "atlas-inset rounded-bl-md"
                )}
              >
                {m.role === "assistant" ? (
                  <div
                    className={cx(
                      "lesson-prose text-[0.97rem]",
                      streaming && i === messages.length - 1 && m.content === "" && "caret"
                    )}
                  >
                    {m.content === "" ? (
                      <span className="text-[var(--color-ink-faint)] caret" />
                    ) : (
                      <Markdown text={m.content} />
                    )}
                  </div>
                ) : (
                  <span className="text-[0.97rem]">{m.content}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-[var(--color-line)] p-3 flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder={selected ? `Ask about ${selected.name}…` : "Ask the tutor anything…"}
            className="flex-1 resize-none atlas-inset px-4 py-2.5 outline-none focus:border-[var(--color-pine)] max-h-32"
          />
          <Button type="submit" disabled={!input.trim() || streaming}>
            <Send size={16} />
          </Button>
        </form>
      </div>

      <p className="text-xs text-[var(--color-ink-faint)] mt-2 text-center inline-flex items-center justify-center gap-1.5">
        <Sparkles size={11} /> The tutor withholds direct answers on purpose - push back, guess, reason aloud.
      </p>
    </div>
  );
}
