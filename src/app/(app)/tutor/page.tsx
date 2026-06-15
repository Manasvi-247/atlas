"use client";

import { use } from "react";
import { Tutor } from "@/components/Tutor";

export default function TutorPage({
  searchParams,
}: {
  searchParams: Promise<{ concept?: string }>;
}) {
  const { concept } = use(searchParams);
  return <Tutor focusConceptId={concept ?? null} />;
}
