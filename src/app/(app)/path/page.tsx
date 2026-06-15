"use client";

import { useRouter } from "next/navigation";
import { KnowledgeMap } from "@/components/KnowledgeMap";

export default function PathPage() {
  const router = useRouter();
  return (
    <KnowledgeMap
      onOpenLesson={(id) => router.push(`/learn/${id}`)}
      onReview={() => router.push("/review")}
    />
  );
}
