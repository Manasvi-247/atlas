"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useAtlas } from "@/lib/store";

/** The slice of the store that's persisted per user on the server. */
function snapshot() {
  const s = useAtlas.getState();
  return {
    courses: s.courses,
    activeCourseId: s.activeCourseId,
    model: s.model,
    history: s.history,
    notes: s.notes,
    starred: s.starred,
  };
}

/**
 * Bridges the Zustand store to the server. On sign-in it loads the user's
 * saved snapshot (the DB is the source of truth), then debounce-saves every
 * change back. Renders nothing.
 */
export function StateSync() {
  const { status } = useSession();
  const ready = useRef(false);

  // Load once, when authenticated.
  useEffect(() => {
    if (status !== "authenticated" || ready.current) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/state");
        if (res.ok && !cancelled) {
          const { data } = await res.json();
          if (data && typeof data === "object") useAtlas.setState(data);
        }
      } catch {
        // Network/DB not reachable — start fresh; saves will retry on change.
      }
      if (!cancelled) {
        useAtlas.getState().setHydrated();
        ready.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  // Debounced save on every change after the initial load.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const unsub = useAtlas.subscribe(() => {
      if (!ready.current) return;
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        fetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snapshot()),
        }).catch(() => {});
      }, 800);
    });
    return () => {
      unsub();
      if (t) clearTimeout(t);
    };
  }, []);

  return null;
}
