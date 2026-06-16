"use client";

import React from "react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  type = "button",
  className,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline" | "terra";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  title?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all duration-150 active:scale-[.97] disabled:opacity-40 disabled:cursor-not-allowed select-none";
  const sizes = {
    sm: "text-sm px-3.5 py-1.5",
    md: "text-[0.95rem] px-5 py-2.5",
    lg: "text-base px-7 py-3.5",
  };
  const variants = {
    primary:
      "bg-[var(--color-pine)] text-white hover:bg-[var(--color-pine-deep)] shadow-[0_10px_24px_-12px_rgba(44,90,79,0.7)]",
    terra:
      "bg-[var(--color-terra)] text-white hover:brightness-95 shadow-[0_10px_24px_-12px_rgba(184,107,58,0.7)]",
    outline:
      "border border-[var(--color-line-strong)] text-[var(--color-ink)] hover:bg-[var(--color-paper-2)]",
    ghost: "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)]",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cx(base, sizes[size], variants[variant], className)}
    >
      {children}
    </button>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "pine" | "terra" | "gold" | "rose";
  className?: string;
}) {
  const tones = {
    neutral: "bg-[var(--color-paper-2)] text-[var(--color-ink-soft)] border-[var(--color-line)]",
    pine: "bg-[color-mix(in_srgb,var(--color-pine)_14%,var(--color-card))] text-[var(--color-pine-deep)] border-[color-mix(in_srgb,var(--color-pine)_30%,var(--color-card))]",
    terra: "bg-[color-mix(in_srgb,var(--color-terra)_14%,var(--color-card))] text-[var(--color-terra)] border-[color-mix(in_srgb,var(--color-terra)_30%,var(--color-card))]",
    gold: "bg-[color-mix(in_srgb,var(--color-gold)_18%,var(--color-card))] text-[var(--color-gold)] border-[color-mix(in_srgb,var(--color-gold)_34%,var(--color-card))]",
    rose: "bg-[color-mix(in_srgb,var(--color-rose)_14%,var(--color-card))] text-[var(--color-rose)] border-[color-mix(in_srgb,var(--color-rose)_30%,var(--color-card))]",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase border rounded-full px-2.5 py-1",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
      <span className="h-px w-6 bg-[var(--color-line-strong)]" />
      {children}
    </div>
  );
}

/** A circular mastery dial (0..1). */
export function MasteryRing({
  value,
  size = 44,
  stroke = 5,
  color = "var(--color-pine)",
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset .6s cubic-bezier(.2,.7,.2,1)" }}
        />
      </svg>
      <span className="absolute text-[0.66rem] font-bold text-[var(--color-ink)]">
        {label ?? `${Math.round(pct * 100)}`}
      </span>
    </div>
  );
}

export function Bar({ value, color = "var(--color-pine)" }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-[var(--color-line)] overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          background: color,
          transition: "width .6s cubic-bezier(.2,.7,.2,1)",
        }}
      />
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-[var(--color-ink-soft)]">
      <span className="relative flex h-5 w-5">
        <span className="absolute inline-flex h-full w-full rounded-full border-2 border-[var(--color-line-strong)]" />
        <span className="absolute inline-flex h-full w-full rounded-full border-2 border-transparent border-t-[var(--color-pine)] animate-spin" />
      </span>
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="22" fill="none" stroke="var(--color-pine)" strokeWidth="5" />
        <g stroke="var(--color-ink-faint)" strokeWidth="4" strokeLinecap="round">
          <line x1="50" y1="16" x2="50" y2="24" />
          <line x1="50" y1="76" x2="50" y2="84" />
          <line x1="16" y1="50" x2="24" y2="50" />
          <line x1="76" y1="50" x2="84" y2="50" />
        </g>
        <g className="compass-needle">
          <path d="M50 31 L59 50 L50 45 Z" fill="var(--color-terra)" />
          <path d="M50 69 L41 50 L50 55 Z" fill="var(--color-pine)" />
        </g>
        <circle cx="50" cy="50" r="5" fill="var(--color-ink)" />
      </svg>
      <span className="font-display text-[1.35rem] font-semibold tracking-tight">Atlas</span>
    </span>
  );
}
