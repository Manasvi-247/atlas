import { NextRequest, NextResponse } from "next/server";
import { structured } from "@/lib/anthropic";
import { ASSESSMENT_SYSTEM, assessmentBatchSchema } from "@/lib/prompts";
import type { AssessmentQuestion } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Body {
  subject: string;
  goal: string;
  batchSize: number;
  /** Summary of how the learner has done so far (drives adaptive targeting). */
  history: { concept: string; difficulty: number; correct: boolean }[];
  askedConcepts: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const correctCount = body.history.filter((h) => h.correct).length;
    const total = body.history.length;
    const recent = body.history.slice(-3);

    let targetDifficulty = 3;
    if (total > 0) {
      const rate = correctCount / total;
      const recentRate = recent.length ? recent.filter((r) => r.correct).length / recent.length : rate;
      // Climb when they're succeeding, ease off when they're missing.
      const avgDiff = body.history.reduce((a, h) => a + h.difficulty, 0) / total;
      targetDifficulty = Math.max(1, Math.min(5, Math.round(avgDiff + (recentRate - 0.5) * 4)));
    }

    const user = `Subject: ${body.subject}
Learner's goal: ${body.goal}

Performance so far (${correctCount}/${total} correct):
${
  body.history.length
    ? body.history
        .map((h) => `- "${h.concept}" (difficulty ${h.difficulty}): ${h.correct ? "correct" : "wrong"}`)
        .join("\n")
    : "(none yet - this is the first batch)"
}

Concepts already asked (do NOT repeat): ${body.askedConcepts.join(", ") || "none"}

Write ${body.batchSize} NEW questions. Center difficulty around ${targetDifficulty} (mix one a notch easier and one a notch harder to keep probing the boundary). Each must cover a different, not-yet-asked concept.`;

    const out = await structured<{ questions: AssessmentQuestion[] }>({
      system: ASSESSMENT_SYSTEM,
      user,
      schema: assessmentBatchSchema as unknown as Record<string, unknown>,
      toolName: "submit_questions",
      maxTokens: 4000,
    });

    return NextResponse.json(out);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
