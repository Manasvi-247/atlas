"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAtlas } from "@/lib/store";
import { Spinner } from "@/components/ui";

/** Guards the in-app routes. The sidebar shell itself comes from the root
 * layout (Chrome), so this only handles access control. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAtlas((s) => s.hydrated);
  const model = useAtlas((s) => s.model);

  useEffect(() => {
    if (!hydrated) return;
    if (!model.subject) router.replace("/start");
    else if (!model.curriculum) router.replace("/assess");
  }, [hydrated, model.subject, model.curriculum, router]);

  if (!hydrated || !model.subject || !model.curriculum) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Spinner label="Loading Atlas…" />
      </div>
    );
  }

  return <>{children}</>;
}
