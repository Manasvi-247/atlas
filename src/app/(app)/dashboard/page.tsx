"use client";

import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";

export default function DashboardPage() {
  const router = useRouter();
  return (
    <Dashboard
      onReview={(all) => router.push(all ? "/review?all=1" : "/review")}
      onOpenLesson={(id) => router.push(`/learn/${id}`)}
    />
  );
}
