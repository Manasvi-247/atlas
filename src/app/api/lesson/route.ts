import { NextRequest } from "next/server";
import { streamText } from "@/lib/anthropic";
import { lessonSystem } from "@/lib/prompts";
import type { LearningStyle } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Body {
  subject: string;
  goal: string;
  concept: { name: string; summary: string; difficulty: number };
  style: LearningStyle;
  modality?: string;
  /** Names of concepts already mastered, so the lesson can build on them. */
  knownConcepts?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const system = lessonSystem(body.style, body.modality);
    const user = `Subject: ${body.subject}
Learner's goal: ${body.goal}
Concept to teach: "${body.concept.name}" (difficulty ${body.concept.difficulty}/5)
What they should be able to do after: ${body.concept.summary}
${body.knownConcepts?.length ? `They already know: ${body.knownConcepts.join(", ")}. Build on these; don't re-teach them.` : ""}

Write the micro-lesson now.`;

    const stream = streamText({
      system,
      messages: [{ role: "user", content: user }],
      maxTokens: 3000,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(`[Atlas error: ${message}]`, { status: 500 });
  }
}
