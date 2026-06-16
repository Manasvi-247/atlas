"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ReviewSession } from "@/components/ReviewSession";

export default function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  const router = useRouter();
  const { all } = use(searchParams);
  return (
    <ReviewSession
      all={all === "1"}
      onExit={() => router.push("/path")}
      onReviewAll={() => router.push("/review?all=1")}
    />
  );
}
