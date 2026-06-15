import { NextRequest, NextResponse } from "next/server";
import { structured } from "@/lib/anthropic";
import { LESSON_QUIZ_SYSTEM, lessonMetaSchema } from "@/lib/prompts";
import type { QuizQuestion } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Body {
  subject: string;
  concept: { id: string; name: string };
  lessonText: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const user = `Subject: ${body.subject}
Concept id: ${body.concept.id}
Concept name: ${body.concept.name}

Lesson the learner just read:
"""
${body.lessonText.slice(0, 6000)}
"""

Write 3-4 check questions. Use concept id "${body.concept.id}" in the concepts array of each question.`;

    const out = await structured<{ quiz: QuizQuestion[] }>({
      system: LESSON_QUIZ_SYSTEM,
      user,
      schema: lessonMetaSchema as unknown as Record<string, unknown>,
      toolName: "submit_quiz",
      maxTokens: 3000,
    });

    return NextResponse.json(out);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
