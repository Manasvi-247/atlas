"use client";

import { useTheme } from "./useTheme";

/**
 * Resolved accent hexes for the current theme, for places that need literal
 * colors (Recharts, inline SVG) rather than CSS variables. Mirrors the landing
 * palette baked into globals.css / providers.tsx.
 */
export interface Palette {
  pine: string;
  pineDeep: string;
  terra: string;
  gold: string;
  rose: string;
  line: string;
  ink: string;
  inkSoft: string;
  card: string;
}

export const LIGHT_PALETTE: Palette = {
  pine: "#41b07f",
  pineDeep: "#2f9b6f",
  terra: "#f56a9c",
  gold: "#d99a3c",
  rose: "#c0455f",
  line: "#ddc3cd",
  ink: "#2c2440",
  inkSoft: "#6c6383",
  card: "#ffffff",
};

export const DARK_PALETTE: Palette = {
  pine: "#5eead4",
  pineDeep: "#34d8b4",
  terra: "#8b7cf6",
  gold: "#d8b86a",
  rose: "#f08fc0",
  line: "#3a4173",
  ink: "#ecebfb",
  inkSoft: "#a8a4cf",
  card: "#161a39",
};

export function usePalette(): Palette {
  const dark = useTheme((s) => s.dark);
  return dark ? DARK_PALETTE : LIGHT_PALETTE;
}
