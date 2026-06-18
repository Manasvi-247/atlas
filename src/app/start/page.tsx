"use client";

import { useRouter } from "next/navigation";
import { useAtlas } from "@/lib/store";
import { Onboarding } from "@/components/Onboarding";
import { Spinner } from "@/components/ui";

/**
 * The start page always renders Onboarding.
 * If the user has existing courses, Onboarding shows them at the top with
 * "Continue" buttons and a collapsible "Add another course" form below.
 * No auto-redirect — the user may have navigated here intentionally to add
 * a new course even while an active course exists.
 */
export default function Start() {
  const router = useRouter();
  const hydrated = useAtlas((s) => s.hydrated);

  if (!hydrated) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Spinner label="Loading Atlas…" />
      </div>
    );
  }

  return <Onboarding onStart={() => router.push("/assess")} />;
}
