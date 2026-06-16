"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Map,
  BookOpen,
  MessagesSquare,
  LayoutDashboard,
  RefreshCw,
  StickyNote,
  Sparkles,
  RotateCcw,
  Menu,
  X,
  Lock,
  Compass,
} from "lucide-react";
import { Logo, cx } from "./ui";
import { useAtlas } from "@/lib/store";
import { dueForReview } from "@/lib/sr";
import { StreakBadge } from "./Streak";
import { ThemeToggle } from "./ThemeToggle";
import { FloatingTutor } from "./FloatingTutor";

const NAV = [
  { href: "/path", label: "Path", icon: Map },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/tutor", label: "Tutor", icon: MessagesSquare },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/review", label: "Review", icon: RefreshCw },
  { href: "/notes", label: "Notes", icon: StickyNote },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useAtlas((s) => s.hydrated);
  const model = useAtlas((s) => s.model);
  const notes = useAtlas((s) => s.notes);
  const starred = useAtlas((s) => s.starred);
  const reset = useAtlas((s) => s.reset);
  const nextLessonId = useAtlas((s) => s.nextLessonId);
  const due = dueForReview(model.concepts);
  const [mobileOpen, setMobileOpen] = useState(false);

  // The learning routes only work once a path is built; lock them until then.
  const ready = hydrated && !!model.curriculum;
  const inAssessment = hydrated && !!model.subject && !model.curriculum;

  const badges: Record<string, number> = {
    "/review": due.length,
    "/notes": notes.length + starred.length,
  };

  function go(href: string) {
    if (!ready) return;
    setMobileOpen(false);
    if (href === "/learn") {
      const n = nextLessonId();
      router.push(n ? `/learn/${n}` : "/path");
      return;
    }
    router.push(href);
  }

  const isActive = (href: string) =>
    href === "/learn" ? pathname.startsWith("/learn") : pathname === href;

  const statusLabel = !hydrated
    ? "Loading…"
    : !model.subject
    ? "Pick a subject to begin"
    : inAssessment
    ? "Diagnostic in progress"
    : "Currently studying";

  const SidebarInner = (
    <div className="flex flex-col h-full">
      <button
        onClick={() => router.push("/start")}
        className="px-5 h-16 flex items-center border-b border-[var(--color-line)] w-full text-left hover:bg-[var(--color-paper-2)] transition-colors"
      >
        <Logo />
      </button>

      <div className="px-4 py-4 border-b border-[var(--color-line)]">
        <div className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
          {statusLabel}
        </div>
        <div className="font-display text-lg font-semibold mt-1 leading-tight">
          {model.subject || "Atlas"}
        </div>
        {model.goal && (
          <div className="text-xs text-[var(--color-ink-faint)] mt-0.5 line-clamp-2">{model.goal}</div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!ready && (
          <div className="mb-3 mx-1 atlas-inset px-3 py-2.5 text-xs text-[var(--color-ink-soft)] flex items-start gap-2">
            <Compass size={14} className="mt-0.5 text-[var(--color-terra)] shrink-0" />
            <span>{inAssessment ? "Finish the diagnostic to unlock your path." : "Choose a subject to unlock the workspace."}</span>
          </div>
        )}
        {NAV.map((n) => {
          const active = ready && isActive(n.href);
          const badge = badges[n.href] || 0;
          return (
            <button
              key={n.href}
              onClick={() => go(n.href)}
              disabled={!ready}
              className={cx(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative",
                active
                  ? "bg-[var(--color-pine)] text-[var(--color-on-accent)] shadow-[0_8px_18px_-12px_rgba(44,90,79,0.8)]"
                  : ready
                  ? "text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)]"
                  : "text-[var(--color-ink-faint)] opacity-55 cursor-not-allowed"
              )}
            >
              <n.icon size={18} />
              {n.label}
              {!ready ? (
                <Lock size={13} className="ml-auto opacity-70" />
              ) : badge > 0 ? (
                <span
                  className={cx(
                    "ml-auto text-[0.66rem] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                    active ? "bg-white/25 text-[var(--color-on-accent)]" : "bg-[var(--color-terra)] text-[var(--color-on-accent)]"
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-[var(--color-line)] space-y-3">
        <div className="flex items-center justify-between text-sm">
          <StreakBadge />
          <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-gold)]" title="XP">
            <Sparkles size={15} /> {model.xp}
          </span>
        </div>
        {model.subject && (
          <button
            onClick={() => {
              if (confirm("Start over? This clears your path, progress, and notes.")) {
                reset();
                router.push("/start");
              }
            }}
            className="w-full text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-rose)] inline-flex items-center justify-center gap-1.5 py-1.5"
          >
            <RotateCcw size={13} /> Reset Atlas
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[var(--color-card)] border-r border-[var(--color-line)] sticky top-0 h-screen">
        {SidebarInner}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-[var(--color-card)] border-r border-[var(--color-line)] h-full">
            {SidebarInner}
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-3 text-[var(--color-ink-faint)]">
              <X size={20} />
            </button>
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-30 h-14 px-4 flex items-center justify-between bg-[color-mix(in_srgb,var(--color-paper)_88%,transparent)] backdrop-blur-md border-b border-[var(--color-line)]">
          <button onClick={() => setMobileOpen(true)} className="text-[var(--color-ink)]">
            <Menu size={22} />
          </button>
          <Logo size={22} />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <StreakBadge />
          </div>
        </header>

        {/* Desktop top utility bar — theme toggle pinned top-right */}
        <div className="hidden lg:flex items-center justify-end h-16 px-8 sticky top-0 z-20 border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-paper)_80%,transparent)] backdrop-blur-md">
          <ThemeToggle />
        </div>

        <main className="flex-1 px-5 sm:px-8 py-6 w-full max-w-6xl mx-auto">{children}</main>
      </div>

      <FloatingTutor />
    </div>
  );
}
