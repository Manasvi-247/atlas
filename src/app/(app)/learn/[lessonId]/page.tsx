"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { LessonView } from "@/components/LessonView";
import { useAtlas } from "@/lib/store";

export default function LearnPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  const router = useRouter();
  const nextLessonId = useAtlas((s) => s.nextLessonId);

  return (
    <LessonView
      lessonId={lessonId}
      onExit={() => router.push("/path")}
      onNextLesson={() => {
        const n = nextLessonId();
        router.push(n ? `/learn/${n}` : "/path");
      }}
      onAskTutor={(conceptId) => router.push(`/tutor?concept=${conceptId}`)}
    />
  );
}
