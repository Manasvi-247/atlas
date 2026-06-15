"use client";

import { create } from "zustand";

/**
 * Light/dark theme state. The class on <html> is the source of truth (set
 * pre-paint by an inline script in the root layout to avoid a flash). This
 * store mirrors it for React (the toggle checkbox + antd algorithm) and writes
 * the `atlas-theme` localStorage key — the same key the landing page uses.
 */
interface ThemeState {
  dark: boolean;
  toggle: () => void;
  sync: () => void;
}

function applyDark(dark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem("atlas-theme", dark ? "dark" : "light");
  } catch {}
}

export const useTheme = create<ThemeState>((set, get) => ({
  dark: false,
  toggle: () => {
    const next = !get().dark;
    applyDark(next);
    set({ dark: next });
  },
  sync: () => {
    if (typeof document === "undefined") return;
    set({ dark: document.documentElement.classList.contains("dark") });
  },
}));
