"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAtlas } from "@/lib/store";
import { Assessment } from "@/components/Assessment";
import { Spinner } from "@/components/ui";

export default function AssessPage() {
  const router = useRouter();
  const hydrated = useAtlas((s) => s.hydrated);
  const model = useAtlas((s) => s.model);

  useEffect(() => {
    if (!hydrated) return;
    if (!model.subject) router.replace("/start");
    else if (model.curriculum) router.replace("/path");
  }, [hydrated, model.subject, model.curriculum, router]);

  if (!hydrated || !model.subject || model.curriculum) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Spinner label="Loading Atlas…" />
      </div>
    );
  }

  return <Assessment onDone={() => router.push("/path")} />;
}
