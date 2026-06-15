"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Drives a streaming POST to one of the text routes (lesson / tutor / explain),
 * exposing the accumulating text and a streaming flag for the UI.
 */
export function useStream() {
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  const run = useCallback(
    async (url: string, body: unknown, onChunk?: (full: string) => void): Promise<string> => {
      ctrl.current?.abort();
      const ac = new AbortController();
      ctrl.current = ac;
      setText("");
      setError(null);
      setStreaming(true);
      let full = "";
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: ac.signal,
        });
        if (!res.ok || !res.body) {
          throw new Error(`Request failed (${res.status})`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          setText(full);
          onChunk?.(full);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError((e as Error).message);
        }
      } finally {
        setStreaming(false);
      }
      return full;
    },
    []
  );

  const stop = useCallback(() => ctrl.current?.abort(), []);
  const reset = useCallback(() => {
    setText("");
    setError(null);
  }, []);

  return { text, streaming, error, run, stop, reset, setText };
}
