"use client";

import { AppShell } from "./AppShell";

/** Wraps every page in the persistent sidebar shell so navigation is always
 * present - including onboarding and the diagnostic (nav locks until a path
 * exists). */
export function Chrome({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
