"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAtlas } from "@/lib/store";
import { Onboarding } from "@/components/Onboarding";
import { Spinner } from "@/components/ui";

export default function Home() {
  const router = useRouter();
  const hydrated = useAtlas((s) => s.hydrated);
  const model = useAtlas((s) => s.model);

  useEffect(() => {
    if (!hydrated) return;
    if (model.subject && model.curriculum) router.replace("/path");
    else if (model.subject && !model.curriculum) router.replace("/assess");
  }, [hydrated, model.subject, model.curriculum, router]);

  if (!hydrated) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Spinner label="Loading Atlas…" />
      </div>
    );
  }

  if (model.subject) {
    // Redirecting via the effect above.
    return (
      <div className="min-h-screen grid place-items-center">
        <Spinner label="Resuming your path…" />
      </div>
    );
  }

  return <Onboarding onStart={() => router.push("/assess")} />;
}
