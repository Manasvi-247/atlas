import { NextRequest, NextResponse } from "next/server";
import { structured } from "@/lib/anthropic";
import { DIAGNOSIS_SYSTEM, diagnosisSchema } from "@/lib/prompts";
import type { AssessmentAnswer, Diagnosis, LearningStyle } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Body {
  subject: string;
  goal: string;
  answers: (AssessmentAnswer & { concept: string })[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    const user = `Subject: ${body.subject}
Learner's goal: ${body.goal}

Answered assessment (chronological):
${body.answers
  .map(
    (a, i) =>
      `${i + 1}. concept="${a.concept}" difficulty=${a.difficulty} → ${
        a.correct ? "CORRECT" : "WRONG"
      }, self-confidence=${Math.round(a.confidence * 100)}%`
  )
  .join("\n")}

Diagnose where their knowledge boundary sits and infer an initial learning-style weighting.`;

    const out = await structured<Diagnosis & { styleHint: LearningStyle }>({
      system: DIAGNOSIS_SYSTEM,
      user,
      schema: diagnosisSchema as unknown as Record<string, unknown>,
      toolName: "submit_diagnosis",
      maxTokens: 2000,
    });

    return NextResponse.json(out);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
