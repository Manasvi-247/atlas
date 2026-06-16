"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MessagesSquare, X, Send, GraduationCap, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Markdown } from "./Markdown";
import { useAtlas } from "@/lib/store";
import { cx } from "./ui";
import type { ChatMessage } from "@/lib/types";

/**
 * A universal floating Socratic-tutor bubble — available on every app page so a
 * learner can ask for a nudge without leaving what they're doing. Shares the
 * /api/tutor endpoint with the full Tutor page. Hidden on onboarding (no
 * subject yet) and on the /tutor page itself (where the full chat lives).
 */
export function FloatingTutor() {
  const pathname = usePathname();
  const router = useRouter();
  const model = useAtlas((s) => s.model);
  const recordTutorTurn = useAtlas((s) => s.recordTutorTurn);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming, open]);

  const hidden = !model.subject || pathname === "/tutor";

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
        body: JSON.stringify({ subject: model.subject, goal: model.goal, messages: history }),
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
          copy[copy.length - 1] = { role: "assistant", content: `*(tutor unavailable: ${(e as Error).message})*` };
          return copy;
        });
      }
    } finally {
      setStreaming(false);
    }
  }

  if (hidden) return null;

  return (
    <>
      {/* Floating bubble */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={() => setOpen(true)}
            title="Ask the Socratic tutor"
            className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full grid place-items-center text-white shadow-[0_14px_30px_-10px_rgba(0,0,0,0.5)] bg-[var(--color-pine)] hover:scale-105 transition-transform"
          >
            <MessagesSquare size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed bottom-6 right-6 z-40 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-3rem))] flex flex-col atlas-card overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-line)] bg-[var(--color-pine)] text-white">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} />
                <div>
                  <div className="text-sm font-semibold leading-none">Socratic tutor</div>
                  <div className="text-[0.66rem] opacity-80 mt-0.5">guides — never spoils</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => router.push("/tutor")}
                  title="Open full tutor"
                  className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
                >
                  <ArrowUpRight size={16} />
                </button>
                <button onClick={() => setOpen(false)} title="Close" className="p-1.5 rounded-lg hover:bg-white/15 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[var(--color-paper)]">
              {messages.length === 0 && (
                <div className="h-full grid place-items-center text-center px-4">
                  <div>
                    <div className="mx-auto w-11 h-11 rounded-2xl bg-[var(--color-pine)] grid place-items-center text-white">
                      <GraduationCap size={20} />
                    </div>
                    <p className="text-sm text-[var(--color-ink-soft)] mt-3">
                      Stuck on something in <strong>{model.subject}</strong>? Ask away — I&apos;ll guide you to it.
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                      {["I'm stuck — give me a hint", "Quiz me with a question", "Why does this matter?"].map((s) => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="text-xs px-2.5 py-1 rounded-full border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-pine)] hover:text-[var(--color-pine)] transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cx(
                      "max-w-[88%] rounded-2xl px-3.5 py-2",
                      m.role === "user"
                        ? "bg-[var(--color-pine)] text-white rounded-br-md"
                        : "atlas-inset rounded-bl-md"
                    )}
                  >
                    {m.role === "assistant" ? (
                      m.content === "" ? (
                        <span className="text-[var(--color-ink-faint)] caret" />
                      ) : (
                        <div className="lesson-prose text-[0.9rem]">
                          <Markdown text={m.content} />
                        </div>
                      )
                    ) : (
                      <span className="text-[0.9rem]">{m.content}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="border-t border-[var(--color-line)] p-2.5 flex items-end gap-2 bg-[var(--color-card)]"
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
                placeholder="Ask the tutor…"
                className="flex-1 resize-none atlas-inset px-3 py-2 text-sm outline-none focus:border-[var(--color-pine)] max-h-24"
              />
              <button
                type="submit"
                disabled={!input.trim() || streaming}
                className="h-9 w-9 shrink-0 grid place-items-center rounded-full bg-[var(--color-pine)] text-white disabled:opacity-40 transition-opacity"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
