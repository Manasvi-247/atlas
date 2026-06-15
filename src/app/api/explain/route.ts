import { NextRequest } from "next/server";
import { streamText } from "@/lib/anthropic";
import { explainSystem } from "@/lib/prompts";
import { MODALITY_LABELS } from "@/lib/types";
import type { Modality } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Body {
  subject: string;
  goal: string;
  concept: { name: string; summary: string };
  modality: Modality;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const label = MODALITY_LABELS[body.modality] ?? body.modality;
    const user = `Subject: ${body.subject}
Learner's goal: ${body.goal}
Concept: "${body.concept.name}" — ${body.concept.summary}

Re-explain this concept using this modality: ${label}. Keep it fresh and short.`;

    const stream = streamText({
      system: explainSystem(),
      messages: [{ role: "user", content: user }],
      maxTokens: 1200,
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
