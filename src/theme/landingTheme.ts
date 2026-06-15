/**
 * Atlas theme — extracted verbatim from the marketing landing page
 * ("Atlas (standalone).html"). Two complete palettes:
 *
 *   • light — "warm pastel cartography"  (:root in the landing page)
 *   • dark  — "blue / purple / green terrain"  (html.dark in the landing page)
 *
 * This file is the single source of truth for the brand palette. It is NOT yet
 * applied across the app — when we wire light/dark theming in, both the CSS
 * (`themeCssVariables`) and the JS token objects (`lightTheme` / `darkTheme`)
 * below are ready to drop in (CSS custom properties, antd ConfigProvider, etc.).
 */

export interface AtlasPalette {
  /** page background */
  paper: string;
  paper2: string;
  /** card / panel surfaces */
  surface: string;
  surface2: string;
  /** text */
  ink: string;
  inkSoft: string;
  /** borders */
  line: string;
  lineStrong: string;
  /** brand accent + the pastel "map" hues */
  accent: string;
  orchid: string;
  petal: string;
  blush: string;
  icy: string;
  sky: string;
  mint: string;
  /** primary button / emphasis */
  primary: string;
  onPrimary: string;
  primaryHover: string;
  /** knowledge-map node levels */
  lvlMastered: string;
  lvlActive: string;
  lvlNext: string;
  lvlLocked: string;
  /** highlighter marker behind headline words */
  marker: string;
  /** shadows + paper-grain opacity */
  shadow: string;
  shadowStrong: string;
  grain: string;
  /** promise band */
  promiseBg: string;
  promiseText: string;
  promiseEyebrow: string;
  promiseAccent: string;
  promiseLine1: string;
  promiseLine2: string;
  promiseLine3: string;
  promiseBtnBg: string;
  promiseBtnText: string;
}

export const lightTheme: AtlasPalette = {
  paper: "#fdf3ee",
  paper2: "#f9e8ee",
  surface: "#ffffff",
  surface2: "#fcf4f7",
  ink: "#2c2440",
  inkSoft: "#6c6383",
  line: "#ecd9e0",
  lineStrong: "#ddc3cd",
  accent: "#f56a9c",
  orchid: "#cdb4db",
  petal: "#ffc8dd",
  blush: "#ffafcc",
  icy: "#bde0fe",
  sky: "#a2d2ff",
  mint: "#8fe3ba",
  primary: "#2c2440",
  onPrimary: "#fdf3ee",
  primaryHover: "#3d3357",
  lvlMastered: "#57c98a",
  lvlActive: "#f56a9c",
  lvlNext: "#6fb7f5",
  lvlLocked: "#d9cdd5",
  marker: "rgba(255, 138, 180, 0.5)",
  shadow: "rgba(120, 70, 110, 0.45)",
  shadowStrong: "rgba(120, 60, 110, 0.4)",
  grain: "0.05",
  promiseBg: "linear-gradient(135deg, #ffd8e7 0%, #dbedff 52%, #c8f0dd 100%)",
  promiseText: "#2c2440",
  promiseEyebrow: "#1f8a5b",
  promiseAccent: "#0e9468",
  promiseLine1: "#ff9ec4",
  promiseLine2: "#4fc98a",
  promiseLine3: "#6fb0f0",
  promiseBtnBg: "#2c2440",
  promiseBtnText: "#fdf3ee",
};

export const darkTheme: AtlasPalette = {
  paper: "#0c0f24",
  paper2: "#10142f",
  surface: "#161a39",
  surface2: "#1c2247",
  ink: "#ecebfb",
  inkSoft: "#a8a4cf",
  line: "#29305a",
  lineStrong: "#3a4173",
  accent: "#8b7cf6",
  orchid: "#b79cf0",
  petal: "#f0a8d0",
  blush: "#f08fc0",
  icy: "#8fd6ff",
  sky: "#7dd3fc",
  mint: "#5eead4",
  primary: "#8b7cf6",
  onPrimary: "#0c0f24",
  primaryHover: "#9d8ff8",
  lvlMastered: "#5eead4",
  lvlActive: "#a78bfa",
  lvlNext: "#7dd3fc",
  lvlLocked: "#313a66",
  marker: "rgba(139, 124, 246, 0.42)",
  shadow: "rgba(0, 0, 0, 0.7)",
  shadowStrong: "rgba(0, 0, 0, 0.75)",
  grain: "0.04",
  promiseBg: "#0c0f24",
  promiseText: "#ecebfb",
  promiseEyebrow: "#8fd6ff",
  promiseAccent: "#7dd3fc",
  promiseLine1: "#5eead4",
  promiseLine2: "#8b7cf6",
  promiseLine3: "#7dd3fc",
  promiseBtnBg: "#8b7cf6",
  promiseBtnText: "#0c0f24",
};

export const themes = { light: lightTheme, dark: darkTheme } as const;
export type ThemeName = keyof typeof themes;

/** Fonts the landing page uses (same families the app already loads). */
export const fonts = {
  display: "'Fraunces', Georgia, serif",
  sans: "'Manrope', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

/**
 * The exact CSS custom-property blocks from the landing page. Drop this into a
 * global stylesheet to enable light/dark via the `html.dark` class. Variable
 * names match the landing page (e.g. `var(--paper)`, `var(--accent)`).
 */
export const themeCssVariables = `:root {
  /* Light: warm pastel cartography */
  --paper: #fdf3ee;
  --paper-2: #f9e8ee;
  --surface: #ffffff;
  --surface-2: #fcf4f7;
  --ink: #2c2440;
  --ink-soft: #6c6383;
  --line: #ecd9e0;
  --line-strong: #ddc3cd;
  --accent: #f56a9c;
  --orchid: #cdb4db;
  --petal: #ffc8dd;
  --blush: #ffafcc;
  --icy: #bde0fe;
  --sky: #a2d2ff;
  --mint: #8fe3ba;
  --primary: #2c2440;
  --on-primary: #fdf3ee;
  --primary-hover: #3d3357;
  --lvl-mastered: #57c98a;
  --lvl-active: #f56a9c;
  --lvl-next: #6fb7f5;
  --lvl-locked: #d9cdd5;
  --marker: rgba(255, 138, 180, 0.5);
  --shadow: rgba(120, 70, 110, 0.45);
  --shadow-strong: rgba(120, 60, 110, 0.4);
  --grain: 0.05;
  --promise-bg: linear-gradient(135deg, #ffd8e7 0%, #dbedff 52%, #c8f0dd 100%);
  --promise-text: #2c2440;
  --promise-eyebrow: #1f8a5b;
  --promise-accent: #0e9468;
  --promise-line-1: #ff9ec4;
  --promise-line-2: #4fc98a;
  --promise-line-3: #6fb0f0;
  --promise-btn-bg: #2c2440;
  --promise-btn-text: #fdf3ee;
}

html.dark {
  /* Dark: blue / purple / green terrain */
  --paper: #0c0f24;
  --paper-2: #10142f;
  --surface: #161a39;
  --surface-2: #1c2247;
  --ink: #ecebfb;
  --ink-soft: #a8a4cf;
  --line: #29305a;
  --line-strong: #3a4173;
  --accent: #8b7cf6;
  --orchid: #b79cf0;
  --petal: #f0a8d0;
  --blush: #f08fc0;
  --icy: #8fd6ff;
  --sky: #7dd3fc;
  --mint: #5eead4;
  --primary: #8b7cf6;
  --on-primary: #0c0f24;
  --primary-hover: #9d8ff8;
  --lvl-mastered: #5eead4;
  --lvl-active: #a78bfa;
  --lvl-next: #7dd3fc;
  --lvl-locked: #313a66;
  --marker: rgba(139, 124, 246, 0.42);
  --shadow: rgba(0, 0, 0, 0.7);
  --shadow-strong: rgba(0, 0, 0, 0.75);
  --grain: 0.04;
  --promise-bg: #0c0f24;
  --promise-text: #ecebfb;
  --promise-eyebrow: #8fd6ff;
  --promise-accent: #7dd3fc;
  --promise-line-1: #5eead4;
  --promise-line-2: #8b7cf6;
  --promise-line-3: #7dd3fc;
  --promise-btn-bg: #8b7cf6;
  --promise-btn-text: #0c0f24;
}`;
