"use client";

import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";

export default function DashboardPage() {
  const router = useRouter();
  return (
    <Dashboard
      onReview={() => router.push("/review")}
      onOpenLesson={(id) => router.push(`/learn/${id}`)}
    />
  );
}
