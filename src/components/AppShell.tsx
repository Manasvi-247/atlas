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
  LogOut,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { Logo, cx } from "./ui";
import { useAtlas } from "@/lib/store";
import { dueForReview } from "@/lib/sr";
import { StreakBadge } from "./Streak";
import { ThemeToggle } from "./ThemeToggle";
import { FloatingTutor } from "./FloatingTutor";
import { CourseSwitcher } from "./CourseSwitcher";

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
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // The sign-in screen renders bare (no app sidebar).
  if (pathname === "/signin") return <>{children}</>;

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

  function confirmReset() {
    reset();
    setShowResetModal(false);
    router.push("/start");
  }

  const isActive = (href: string) =>
    href === "/learn" ? pathname.startsWith("/learn") : pathname === href;

  const SidebarInner = (
    <div className="flex flex-col h-full">
      <button
        onClick={() => router.push("/")}
        className="px-5 h-16 flex items-center border-b border-[var(--color-line)] w-full text-left hover:bg-[var(--color-paper-2)] transition-colors"
      >
        <Logo />
      </button>

      <CourseSwitcher />

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
        {session?.user && (
          <div className="flex items-center gap-2.5">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="w-8 h-8 rounded-full shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--color-pine)] text-[var(--color-on-accent)] grid place-items-center text-xs font-semibold shrink-0">
                {(session.user.name ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[var(--color-ink)] truncate">
                {session.user.name ?? "Learner"}
              </div>
              <div className="text-xs text-[var(--color-ink-faint)] truncate">{session.user.email}</div>
            </div>
            <button
              onClick={() => setShowSignOutModal(true)}
              title="Sign out"
              className="text-[var(--color-ink-faint)] hover:text-[var(--color-rose)] transition-colors p-1 shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <StreakBadge />
          <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-gold)]" title="XP">
            <Sparkles size={15} /> {model.xp}
          </span>
        </div>
        {model.subject && (
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-rose)] hover:border-[var(--color-rose)] inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[var(--color-line)] transition-colors"
          >
            <RotateCcw size={15} /> Reset Atlas
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Reset confirmation modal ── */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40"
            onClick={() => setShowResetModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="atlas-card w-full max-w-md p-7 relative"
            >
              <button
                onClick={() => setShowResetModal(false)}
                className="absolute top-4 right-4 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors"
              >
                <X size={18} />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-[color-mix(in_srgb,var(--color-rose)_12%,var(--color-card))] dark:bg-[color-mix(in_srgb,var(--color-pine)_12%,var(--color-card))] grid place-items-center mb-5">
                <RotateCcw size={22} className="text-[var(--color-rose)] dark:text-[var(--color-pine)]" />
              </div>

              <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
                Reset Atlas?
              </h2>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                This will permanently clear{" "}
                <span className="font-semibold text-[var(--color-ink)]">all courses, progress, notes, and history</span>
                {" "}across your entire account. You'll start completely fresh. This cannot be undone.
              </p>

              <div className="mt-6 flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReset}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--color-rose)] dark:bg-[var(--color-pine)] text-white dark:text-[var(--color-on-accent)] hover:opacity-90 transition-opacity shadow-[0_4px_14px_-6px_rgba(192,69,95,0.5)] dark:shadow-[0_4px_14px_-6px_rgba(94,234,212,0.4)]"
                >
                  Yes, reset everything
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sign-out confirmation modal ── */}
      <AnimatePresence>
        {showSignOutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40"
            onClick={() => setShowSignOutModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="atlas-card w-full max-w-sm p-7 relative"
            >
              <button
                onClick={() => setShowSignOutModal(false)}
                className="absolute top-4 right-4 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors"
              >
                <X size={18} />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-[color-mix(in_srgb,var(--color-pine)_12%,var(--color-card))] grid place-items-center mb-5">
                <LogOut size={22} className="text-[var(--color-pine)]" />
              </div>

              <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">Sign out?</h2>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                Your progress is saved to your account, so it'll be here when you sign back in.
              </p>

              <div className="mt-6 flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowSignOutModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--color-pine)] text-[var(--color-on-accent)] hover:opacity-90 transition-opacity"
                >
                  Sign out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen flex">
        <aside className="hidden lg:flex w-72 shrink-0 flex-col bg-[var(--color-card)] border-r border-[var(--color-line)] sticky top-0 h-screen">
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

          <div className="hidden lg:flex items-center justify-end h-16 px-8 sticky top-0 z-20 border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-paper)_80%,transparent)] backdrop-blur-md">
            <ThemeToggle />
          </div>

          <main className="flex-1 px-5 sm:px-8 py-6 w-full max-w-6xl mx-auto">{children}</main>
        </div>

        <FloatingTutor />
      </div>
    </>
  );
}
